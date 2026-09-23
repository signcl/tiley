import path from 'node:path';
import express, { type Request } from 'express';
import morgan from 'morgan';
import { validateHex } from './lib/colors';
import generateFontSize from './lib/generateFontSize';
import generateImage from './lib/generateImage';
import idToColor from './lib/idToColor';
import initials from './lib/initials';
import errorHandlingMiddleware, { type HttpError } from './middlewares/errorHandling';

interface AvatarParams {
  id: string;
  initials: string;
}

interface RasterAvatarParams extends AvatarParams {
  format: string;
}

// Express 5 dropped inline regexes in path strings, so these are the patterns
// Express 4 compiled from '/avatar/:id(\\w+)/:initials.:format(png|jpg)' and
// '/avatar/:id(\\w+)/:initials.:format(svg)?', including case-insensitive
// matching and the optional trailing slash.
const rasterAvatarPath = /^\/avatar\/(?<id>\w+)\/(?<initials>[^/]+?)\.(?<format>png|jpg)\/?$/i;
const svgAvatarPath = /^\/avatar\/(?<id>\w+)\/(?<initials>[^/]+?)(?:\.(?<format>svg))?\/?$/i;

const font = path.join(import.meta.dirname, 'fonts/PingFangSC-Semibold.ttf');

const app = express();

function getColor(req: Request<AvatarParams>): string {
  if (req.query.c) {
    if (validateHex(req.query.c)) {
      return `#${req.query.c}`;
    }
    const error: HttpError = new Error('Invalid color parameter');
    error.code = 'invalid_color';
    error.status = 422;
    throw error;
  }

  return idToColor(req.params.id);
}

app.set('views', path.join(import.meta.dirname, 'views'));
app.set('view engine', 'ejs');
app.use(morgan('combined'));

// Avoid 404 favicon
app.get('/favicon.ico', (_req, res) => {
  res.sendStatus(204);
});

app.get(rasterAvatarPath, async (req: Request<RasterAvatarParams>, res) => {
  const color = getColor(req);
  const text = initials(req.params.initials);
  const { format } = req.params;
  const imageSize = Math.min(Math.max(parseInt(String(req.query.s), 10), 1), 1024) || 256;

  const image = await generateImage(imageSize, color, font, text, format);
  res.set('Content-Type', `image/${format}`);
  res.send(image);
});

app.get(svgAvatarPath, (req: Request<AvatarParams>, res) => {
  const color = getColor(req);
  const text = initials(req.params.initials);
  const imageSize = parseInt(String(req.query.s), 10) || 256;
  const fontSize = generateFontSize(imageSize);

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('vary', 'Accept-Encoding');
  res.render('svg', { color, text, imageSize, fontSize });
});

app.get('/', (_req, res) => {
  res.json({ status: 'okay' });
});

app.use(errorHandlingMiddleware);

export default app;
