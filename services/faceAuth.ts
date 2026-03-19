const TEMPLATE_SIDE = 24;
const LIVENESS_FRAME_COUNT = 3;

const luminance = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

const toBitString = (pixels: Uint8ClampedArray) => {
  let sum = 0;
  const values: number[] = [];

  for (let i = 0; i < pixels.length; i += 4) {
    const value = luminance(pixels[i], pixels[i + 1], pixels[i + 2]);
    values.push(value);
    sum += value;
  }

  const avg = sum / values.length;
  return values.map((value) => (value > avg ? '1' : '0')).join('');
};

const hammingDistance = (a: string, b: string) => {
  const minLength = Math.min(a.length, b.length);
  let distance = 0;

  for (let i = 0; i < minLength; i += 1) {
    if (a[i] !== b[i]) distance += 1;
  }

  return distance + Math.abs(a.length - b.length);
};

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const fromBase64 = (text: string) => {
  const binary = atob(text);
  const result = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    result[i] = binary.charCodeAt(i);
  }
  return result;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const deriveAesKey = async (salt: string) => {
  const material = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(navigator.userAgent),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: textEncoder.encode(salt),
      iterations: 120000,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
};

const randomSalt = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toBase64(bytes);
};

const frameTemplate = (videoEl: HTMLVideoElement) => {
  const canvas = document.createElement('canvas');
  canvas.width = TEMPLATE_SIDE;
  canvas.height = TEMPLATE_SIDE;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Unable to initialize camera frame processor.');

  ctx.drawImage(videoEl, 0, 0, TEMPLATE_SIDE, TEMPLATE_SIDE);
  const image = ctx.getImageData(0, 0, TEMPLATE_SIDE, TEMPLATE_SIDE);
  return toBitString(image.data);
};

export const isFaceLoginSupported = () => {
  return Boolean(navigator.mediaDevices?.getUserMedia && window.crypto?.subtle);
};

export const startCamera = async (videoEl: HTMLVideoElement) => {
  let stream: MediaStream | null = null;

  // Attempt 1: front camera with ideal dimensions.
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'user' },
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });
  } catch {
    // Attempt 2: simplest possible camera request for restrictive browsers/webviews.
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  }

  videoEl.srcObject = stream;

  // Some browsers require metadata readiness before play resolves.
  await new Promise<void>((resolve) => {
    const handler = () => {
      videoEl.removeEventListener('loadedmetadata', handler);
      resolve();
    };
    videoEl.addEventListener('loadedmetadata', handler);
  });

  try {
    await videoEl.play();
  } catch {
    // Keep stream attached; user interaction may be required on some browsers.
  }

  return stream;
};

export const stopCamera = (stream: MediaStream | null) => {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
};

export const captureFaceTemplate = async (videoEl: HTMLVideoElement) => {
  const frames: string[] = [];

  for (let i = 0; i < LIVENESS_FRAME_COUNT; i += 1) {
    frames.push(frameTemplate(videoEl));
    await new Promise((resolve) => setTimeout(resolve, 220));
  }

  const variation = hammingDistance(frames[0], frames[2]) / Math.max(frames[0].length, 1);
  if (variation < 0.02) {
    throw new Error('Liveness check failed. Please move slightly and retry.');
  }

  return frames[1];
};

export const encryptTemplate = async (template: string) => {
  const salt = randomSalt();
  const key = await deriveAesKey(salt);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    textEncoder.encode(template),
  );

  return {
    faceTemplateEnc: `${toBase64(iv)}.${toBase64(new Uint8Array(cipher))}`,
    faceSalt: salt,
  };
};

export const decryptTemplate = async (encrypted: string, salt: string) => {
  const [ivBase64, cipherBase64] = encrypted.split('.');
  if (!ivBase64 || !cipherBase64) throw new Error('Malformed encrypted template.');

  const key = await deriveAesKey(salt);
  const iv = fromBase64(ivBase64);
  const cipherBytes = fromBase64(cipherBase64);

  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipherBytes,
  );

  return textDecoder.decode(plain);
};

export const faceSimilarity = (stored: string, incoming: string) => {
  if (!stored || !incoming) return 0;
  const maxLength = Math.max(stored.length, incoming.length);
  if (maxLength === 0) return 0;
  const distance = hammingDistance(stored, incoming);
  return 1 - distance / maxLength;
};

export const isFaceMatch = (stored: string, incoming: string, threshold = 0.82) => {
  return faceSimilarity(stored, incoming) >= threshold;
};
