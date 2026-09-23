import generateFontSize from './generateFontSize';

// ImageMagick 7 ships `magick`, ImageMagick 6 only `convert`. Both are run in
// convert's legacy CLI mode, which parses the -draw text exactly like the
// deprecated `gm` package that used to build this command.
const convert = Bun.which('magick') ? ['magick', 'convert'] : ['convert'];

// Quote draw text the same way `gm` did, so rendered output stays identical.
function quote(text: string): string {
  return `"${text.trim().replace(/"/g, '\\"')}"`;
}

async function generateImage(
  imageSize: number,
  color: string,
  font: string,
  text: string,
  format: string,
): Promise<Buffer> {
  const proc = Bun.spawn([
    ...convert,
    '-size', `${imageSize}x${imageSize}`,
    `xc:${color}`,
    '-fill', '#fff',
    '-pointsize', String(generateFontSize(imageSize)),
    '-font', font,
    '-draw', `gravity center text 0,0 ${quote(text)}`,
    `${format}:-`,
  ], { stdout: 'pipe', stderr: 'pipe' });

  const [image, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).arrayBuffer(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(`ImageMagick exited with code ${exitCode}`, { cause: new Error(stderr.trim()) });
  }

  return Buffer.from(image);
}

export default generateImage;
