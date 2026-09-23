import { createHash } from 'node:crypto';
import minimist from 'minimist';
import { palette as generatePalette } from './colors';

const argv = minimist(process.argv.slice(2));

const size = parseInt(argv.size || 26, 10);
const s = parseFloat(argv.s || 0.8);
const v = parseFloat(argv.v || 0.8);
const seed = parseFloat(argv.seed || 0.8);
const palette = generatePalette(size, seed, s, v);

function idToColor(id: string): string {
  const idAsHex = createHash('md5').update(id).digest('hex');
  const idAsNumber = parseInt(idAsHex, 16);
  return palette[idAsNumber % palette.length]!;
}

export default idToColor;
