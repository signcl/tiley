function generateFontSize(imageSize: number): number {
  const scale = imageSize / 100;
  return Math.round(scale * 55);
}

export default generateFontSize;
