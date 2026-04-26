/**
 * Geogaddi Core Cryptographic Primitives
 * Ported from NASA Geogaddi Technical White Paper
 */

// 23-element McCanney Prime Field P_M
export const P_M = [
  11, 13, 17, 19, 31, 37, 71, 73, 79, 97, 101, 107,
  113, 131, 137, 139, 149, 151, 157, 163, 167, 173, 181
];

export const P_MAX = 181;
export const FIELD_ORDER = 23;

export class PrimeField {
  static getIndex(p: number): number {
    return P_M.indexOf(p);
  }

  static add(p: number, q: number): number {
    const idx = (this.getIndex(p) + this.getIndex(q)) % FIELD_ORDER;
    return P_M[idx];
  }

  static mirror(p: number): number {
    return P_MAX - p;
  }

  static getHarmony(primes: number[]): number {
    return primes.reduce((acc, p) => acc + p, 0) % FIELD_ORDER;
  }

  /**
   * Scrambles data using the Prime Field before AES pass
   */
  static scramble(data: Uint8Array, seed: number): Uint8Array {
    const scrambled = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const p = P_M[(seed + i) % FIELD_ORDER];
      scrambled[i] = data[i] ^ (p % 256);
    }
    return scrambled;
  }
}

export type TerrainLevel = -2 | -1 | 0 | 1 | 2;

export const TERRAIN_MAP: Record<TerrainLevel, { type: string; delta: number }> = {
  [-2]: { type: "Deep Valley", delta: -30.0 },
  [-1]: { type: "Slope-", delta: -15.0 },
  [0]: { type: "Plateau", delta: 0.0 },
  [1]: { type: "Slope+", delta: 15.0 },
  [2]: { type: "Peak", delta: 30.0 },
};

export function quantizeMessage(text: string): TerrainLevel[] {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes).map(byte => {
    const norm = byte / 255.0;
    if (norm < 0.2) return -2;
    if (norm < 0.4) return -1;
    if (norm < 0.6) return 0;
    if (norm < 0.8) return 1;
    return 2;
  });
}

/**
 * Procedural Geoglyph Generator (SHA3-512 based)
 */
export async function generateGeoglyphSeeds(payload: string) {
  const msgUint8 = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  const nSpines = (hashArray[0] % 11) + 5;
  const nRings = (hashArray[1] % 7) + 3;
  
  return {
    nSpines,
    nRings,
    seed: hashArray,
  };
}

export async function encryptPayload(message: string, pass: string, bioSalt: string = ""): Promise<string> {
  const enc = new TextEncoder();
  const saltBase = "geogaddi-v2-system-" + bioSalt;
  
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(pass),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(saltBase),
      iterations: 250000, // Increased iterations for higher security
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  // Pre-scramble the message data
  const rawData = enc.encode(message);
  const seedForScramble = pass.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % FIELD_ORDER;
  const scrambledData = PrimeField.scramble(rawData, seedForScramble);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    scrambledData
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export async function decryptPayload(encoded: string, pass: string, bioSalt: string = ""): Promise<string> {
  const enc = new TextEncoder();
  const saltBase = "geogaddi-v2-system-" + bioSalt;
  
  const combined = new Uint8Array(atob(encoded).split("").map(c => c.charCodeAt(0)));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const passwordKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(pass),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(saltBase),
      iterations: 250000,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decryptedScrambled = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  // Post-descramble
  const seedForScramble = pass.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % FIELD_ORDER;
  const rawData = PrimeField.scramble(new Uint8Array(decryptedScrambled), seedForScramble);

  return new TextDecoder().decode(rawData);
}

