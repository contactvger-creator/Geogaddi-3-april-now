/**
 * Geogaddi Fingerprint I/O System
 * Handles lossless SVG steganography for fingerprint exchange.
 */

export const generateGeoglyphSVG = (seed: number[], payload: string, size: number = 300): string => {
  const center = size / 2;
  const nSpines = (seed[0] % 11) + 5;
  const nRings = (seed[1] % 3) + 2;
  const nSamples = 180;

  // Header and Metadata embedding
  // We encode the payload directly in a metadata comment for zero-loss recovery
  const metadata = `<!-- GEOGADDI_CIPHER_STREAM:${payload} -->`;

  let svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="background:transparent;">`;
  svgContent += `\n  ${metadata}\n`;

  // Draw Background Grids
  svgContent += `  <g stroke="rgba(255, 0, 0, 0.2)" stroke-width="0.5" fill="none">\n`;
  for (let r = 40; r < size / 2; r += 20) {
    svgContent += `    <circle cx="${center}" cy="${center}" r="${r}" />\n`;
  }
  svgContent += `  </g>\n`;

  // Draw Central Spines
  svgContent += `  <g stroke="#40E0D0" stroke-width="1.0" opacity="0.8">\n`;
  for (let i = 0; i < nSpines; i++) {
    const sByte = seed[(i + 5) % seed.length] || 0;
    const theta = (i / nSpines) * Math.PI * 2;
    const spineLength = size * 0.08 + (sByte % 15);
    const xEnd = center + spineLength * Math.cos(theta);
    const yEnd = center + spineLength * Math.sin(theta);
    svgContent += `    <line x1="${center}" y1="${center}" x2="${xEnd}" y2="${yEnd}" />\n`;
    if (sByte > 128) {
        const nx = center + (spineLength * 0.7) * Math.cos(theta);
        const ny = center + (spineLength * 0.7) * Math.sin(theta);
        svgContent += `    <rect x="${nx - 1.5}" y="${ny - 1.5}" width="3" height="3" fill="#40E0D0" stroke="none" />\n`;
    }
  }
  svgContent += `  </g>\n`;

  // Draw Radial Spectral Data
  svgContent += `  <g opacity="0.9">\n`;
  for (let i = 0; i < nSamples; i++) {
    const theta = (i / nSamples) * Math.PI * 2;
    const dataIndex = i % seed.length;
    const rawValue = seed[dataIndex];
    const spectralHeight = 30 + (rawValue % 120);
    const startR = size * 0.14;
    const endR = startR + spectralHeight;

    const xStart = center + startR * Math.cos(theta);
    const yStart = center + startR * Math.sin(theta);
    const xEnd = center + endR * Math.cos(theta);
    const yEnd = center + endR * Math.sin(theta);

    let color = '#FF1E1E';
    let width = 0.6;
    if (rawValue > 190) {
      color = '#FF8C00';
      width = 1.8;
    } else if (rawValue > 100) {
      color = '#D400FF';
      width = 0.8;
    }

    svgContent += `    <line x1="${xStart}" y1="${yStart}" x2="${xEnd}" y2="${yEnd}" stroke="${color}" stroke-width="${width}" />\n`;

    // Blips
    if (rawValue > 160 || i % 15 === 0) {
      const blipR = startR + (rawValue % (endR - startR));
      const xBlip = center + blipR * Math.cos(theta);
      const yBlip = center + blipR * Math.sin(theta);
      const bColor = rawValue > 220 ? '#FFFFFF' : (rawValue > 140 ? '#FF8C00' : '#FF0000');
      const bSize = rawValue > 240 ? 5 : 3;
      svgContent += `    <rect x="${xBlip - bSize/2}" y="${yBlip - bSize/2}" width="${bSize}" height="${bSize}" fill="${bColor}" stroke="none" />\n`;
    }
  }
  svgContent += `  </g>\n`;

  // Draw Blue Rings
  svgContent += `  <g stroke="#0066FF" stroke-width="1.6" fill="none">\n`;
  for (let j = 0; j < nRings; j++) {
    const ringR = 40 + (j * 20) + (seed[(32 + j) % seed.length] % 20);
    svgContent += `    <circle cx="${center}" cy="${center}" r="${ringR}" />\n`;
  }
  svgContent += `  </g>\n`;

  svgContent += `</svg>`;
  return svgContent;
};

export const parseGeoglyphSVG = (svgContent: string): string | null => {
  try {
    const match = svgContent.match(/GEOGADDI_CIPHER_STREAM:([A-Za-z0-9+/=]+)/);
    if (!match || !match[1]) return null;
    return match[1];
  } catch (e) {
    console.error("Failed to parse Geoglyph SVG:", e);
    return null;
  }
};
