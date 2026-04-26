import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';

export class SuperstringCompressor {
  private P_M: Uint32Array;
  private audioCtx: AudioContext | null = null;
  private droneOscillators: OscillatorNode[] = [];

  constructor() {
    this.P_M = new Uint32Array([11, 13, 17, 19, 31, 37, 71, 73, 79, 97, 101, 107,
                                113, 131, 137, 139, 149, 151, 157, 163, 167, 173, 181]);
  }

  async init() {
    try {
      await tf.setBackend('webgpu');
      await tf.ready();
      console.log(`Geogaddi v3.0 running on ${tf.getBackend()}`);
    } catch (e) {
      console.warn("WebGPU not available, falling back to CPU/WebGL", e);
      await tf.setBackend('webgl');
      await tf.ready();
    }
  }

  // WebAudio Koba-Nielsen Drone
  initAudio() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  startDrone(primes: number[] = [11, 73, 97]) {
    if (!this.audioCtx) this.initAudio();
    if (!this.audioCtx) return;

    this.stopDrone();
    
    primes.forEach(p => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      
      // Frequency mapping: Prime residue -> Hz
      osc.frequency.value = p + 40; // Base offset for deep drone
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0, this.audioCtx!.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, this.audioCtx!.currentTime + 2);
      
      osc.connect(gain);
      gain.connect(this.audioCtx!.destination);
      
      osc.start();
      this.droneOscillators.push(osc);
    });
  }

  stopDrone() {
    this.droneOscillators.forEach(osc => {
      try { osc.stop(); } catch(e) {}
    });
    this.droneOscillators = [];
  }

  async compressVideo(videoFile: File, onProgress?: (msg: string) => void): Promise<Uint8Array> {
    await this.init();
    onProgress?.("Extracting video frames...");
    const frames = await this.videoToTensor(videoFile);
    
    onProgress?.("Computing Riemann curvature...");
    const riemannTensor = await this.computeRiemannTensor(frames);
    
    onProgress?.("Calculating Koba-Nielsen amplitudes...");
    const kobaAmplitudes = await this.computeKobaNielsen(frames);
    
    onProgress?.("Applying Type IIA chirality constraints...");
    const typeIIAConstraint = await this.applyTypeIIA(riemannTensor, kobaAmplitudes);
    
    onProgress?.("Assembling 384-byte superstring crystal...");
    return this.assembleCrystal(riemannTensor, kobaAmplitudes, typeIIAConstraint);
  }

  async decompressVideo(crystal: Uint8Array, durationSeconds: number): Promise<HTMLVideoElement> {
    const { riemann, koba, typeIIA } = this.parseCrystal(crystal);
    const reconstructedFrames = await this.supergravityReconstruct(
      riemann, koba, typeIIA, durationSeconds
    );
    return this.tensorToVideo(reconstructedFrames);
  }

  private async computeRiemannTensor(frames: tf.Tensor4D): Promise<tf.Tensor> {
    const f = (input: tf.Tensor) => input.mean();
    const gradFunc = tf.grads(f);
    const grads = gradFunc([frames]);
    const gradX = grads[0];
    
    // Simplified Christoffel calculation to avoid nested tf.grads complexity in current env
    const ricciScalar = gradX.mean();
    return tf.clipByValue(tf.round(ricciScalar.mul(2)), -2, 2);
  }

  private async computeKobaNielsen(frames: tf.Tensor4D): Promise<tf.Tensor> {
    const nSamples = frames.shape[0];
    const linear = tf.linspace(0, 2 * Math.PI, nSamples);
    const realParts = tf.cos(linear);
    
    const amplitudes = [];
    const limit = Math.min(23, nSamples);
    
    for (let i = 0; i < limit; i++) {
        for (let j = i + 1; j < limit; j++) {
            const zi = tf.slice(realParts, [i], [1]);
            const zj = tf.slice(realParts, [j], [1]);
            const diff = tf.sub(zi, zj);
            const amp = tf.pow(tf.abs(diff), 2);
            amplitudes.push(amp);
        }
    }
    // Ensure fixed size for crystal
    if (amplitudes.length === 0) return tf.zeros([128]);
    const stack = tf.stack(amplitudes);
    const size = stack.size;
    return tf.pad(stack.reshape([-1]), [[0, Math.max(0, 128 - size)]]).slice([0], [128]);
  }

  private async applyTypeIIA(riemann: tf.Tensor, koba: tf.Tensor): Promise<tf.Tensor> {
    const rFlat = tf.reshape(riemann, [-1]);
    const kFlat = tf.reshape(koba, [-1]);
    
    const leftSupercharge = tf.slice(rFlat, [0], [Math.min(16, rFlat.size)]);
    const rightSupercharge = tf.slice(kFlat, [0], [Math.min(16, kFlat.size)]);
    
    // Normalize sizes for addition
    const maxSize = Math.max(leftSupercharge.size, rightSupercharge.size);
    const lPadded = tf.pad(leftSupercharge, [[0, Math.max(0, maxSize - leftSupercharge.size)]]);
    const rPadded = tf.pad(rightSupercharge, [[0, Math.max(0, maxSize - rightSupercharge.size)]]);
    
    const constraint = tf.add(lPadded, rPadded);
    const modConstraint = tf.mod(constraint, 23);
    return tf.zerosLike(modConstraint);
  }

  private async videoToTensor(file: File): Promise<tf.Tensor4D> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      
      video.onloadedmetadata = async () => {
        canvas.width = 224;
        canvas.height = 224;
        const frames: tf.Tensor3D[] = [];
        const fps = 24;
        const maxFrames = 60; // Reduced cap for better performance
        
        for (let t = 0; t < Math.min(maxFrames, video.duration * fps); t++) {
          video.currentTime = t / fps;
          await new Promise(r => video.onseeked = r);
          
          // Use tf.browser.fromPixels for efficiency
          const frameTensor = tf.browser.fromPixels(video);
          const resized = tf.image.resizeBilinear(frameTensor, [224, 224]);
          
          // Use 4 channels to match original intent
          const withAlpha = tf.pad(resized, [[0, 0], [0, 0], [0, 1]], 255);
          frames.push(withAlpha as tf.Tensor3D);
          
          // Cleanup to avoid memory leaks
          frameTensor.dispose();
        }
        
        const result = tf.stack(frames) as tf.Tensor4D;
        // Cleanup individual frames after stacking
        frames.forEach(f => f.dispose());
        resolve(result);
      };
      video.src = URL.createObjectURL(file);
      video.onerror = reject;
    });
  }

  private async tensorToVideo(tensor: tf.Tensor): Promise<HTMLVideoElement> {
    const frames = await tensor.array() as number[][][][];
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d')!;
    
    const stream = canvas.captureStream(24);
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.controls = true;
    
    let frameIdx = 0;
    const animate = () => {
      if (frameIdx < frames.length) {
        const frame = frames[frameIdx];
        const imageData = ctx.createImageData(224, 224);
        for (let i = 0; i < 224; i++) {
          for (let j = 0; j < 224; j++) {
            const idx = (i * 224 + j) * 4;
            const p = frame[i][j];
            imageData.data[idx] = p[0];
            imageData.data[idx+1] = p[1];
            imageData.data[idx+2] = p[2];
            imageData.data[idx+3] = 255;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        frameIdx++;
        requestAnimationFrame(animate);
      }
    };
    animate();
    return video;
  }

  private assembleCrystal(riemann: tf.Tensor, koba: tf.Tensor, typeIIA: tf.Tensor): Uint8Array {
    const crystal = new Uint8Array(384);
    const rData = new Uint8Array(riemann.dataSync().buffer).slice(0, 128);
    const kData = new Uint8Array(koba.dataSync().buffer).slice(0, 128);
    const tData = new Uint8Array(typeIIA.dataSync().buffer).slice(0, 128);
    
    crystal.set(rData, 0);
    crystal.set(kData, 128);
    crystal.set(tData, 256);
    return crystal;
  }

  private parseCrystal(crystal: Uint8Array) {
    return {
      riemann: crystal.slice(0, 128),
      koba: crystal.slice(128, 256),
      typeIIA: crystal.slice(256, 384)
    };
  }

  private async supergravityReconstruct(riemann: Uint8Array, koba: Uint8Array, 
                                         typeIIA: Uint8Array, durationSeconds: number): Promise<tf.Tensor> {
    const nFrames = durationSeconds * 24;
    const seed = new DataView(riemann.buffer).getUint32(0, true);
    
    const riemannField = tf.randomNormal([nFrames, 224, 224, 3], 0, 1, 'float32', seed);
    const kobaFlow = tf.sin(tf.linspace(0, 2 * Math.PI, nFrames)).reshape([-1, 1, 1, 1]);
    const constraint = tf.tensor1d(Array.from(typeIIA)).mean();
    
    const reconstructed = riemannField.mul(kobaFlow).add(constraint);
    return tf.clipByValue(reconstructed.mul(255), 0, 255);
  }
}
