export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

export function hsv2rgb({ h, s, v }: HSV): RGB {
  // Make sure our arguments stay in-range
  h = Math.max(0, Math.min(360, h));
  s = Math.max(0, Math.min(100, s));
  v = Math.max(0, Math.min(100, v));

  if (s === 0) {
    // Achromatic (grey)
    const grey = Math.round(v * 255);
    return { r: grey, g: grey, b: grey };
  }

  h /= 60; // sector 0 to 5
  const i = Math.floor(h);
  const f = h - i; // factorial part of h
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));

  let rgb: [number, number, number];
  switch (i) {
    case 0:
      rgb = [v, t, p];
      break;
    case 1:
      rgb = [q, v, p];
      break;
    case 2:
      rgb = [p, v, t];
      break;
    case 3:
      rgb = [p, q, v];
      break;
    case 4:
      rgb = [t, p, v];
      break;
    default: // case 5:
      rgb = [v, p, q];
  }
  const [r, g, b] = rgb;
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export function validateHex(input: unknown): boolean {
  return /[0-9A-Fa-f]{6}/g.test(String(input));
}

export function hexComponentToString(c: number): string {
  const hex = c.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

export function rgb2hexString({ r, g, b }: RGB): string {
  return `#${hexComponentToString(r)}${hexComponentToString(g)}${hexComponentToString(b)}`;
}

export function palette(size: number, seed: number, s: number, v: number): string[] {
  let seeded = seed;
  const result: string[] = [];
  const goldenRatioConjugate = 0.618033988749895;

  for (let i = 0; i < size; i++) {
    seeded += goldenRatioConjugate;
    seeded %= 1;
    result[i] = rgb2hexString(hsv2rgb({ h: (360 * seeded), s, v }));
  }
  return result;
}
