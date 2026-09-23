import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import app from '../app';

const hasImageMagick = Boolean(Bun.which('magick') || Bun.which('convert'));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

function get(path: string): Promise<Response> {
  return fetch(`${baseUrl}${path}`);
}

// Width and height from a PNG's IHDR chunk.
function pngSize(image: ArrayBuffer) {
  const view = new DataView(image);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

test('GET / reports status', async () => {
  const res = await get('/');
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: 'okay' });
});

test('GET /favicon.ico is empty', async () => {
  const res = await get('/favicon.ico');
  expect(res.status).toBe(204);
});

describe('SVG avatars', () => {
  test('renders initials on the color derived from the id', async () => {
    const res = await get('/avatar/123/TM.svg');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/svg+xml; charset=utf-8');
    const svg = await res.text();
    expect(svg).toContain('--tiley-bg-color: #2935cc;');
    expect(svg).toContain('<text x="128" y="128">TM</text>');
  });

  test('is the default without a file extension', async () => {
    const res = await get('/avatar/123/TM');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/svg+xml; charset=utf-8');
  });

  test('accepts size and color parameters', async () => {
    const svg = await (await get('/avatar/123/TM.svg?s=500&c=DADB0D')).text();
    expect(svg).toContain('width="500" height="500"');
    expect(svg).toContain('font-size: 275px;');
    expect(svg).toContain('--tiley-bg-color: #DADB0D;');
  });

  test('romanizes kana and escapes markup in initials', async () => {
    expect(await (await get('/avatar/123/%E3%82%AB%E3%82%BF.svg')).text()).toContain('>KA</text>');
    expect(await (await get('/avatar/123/%3C%22.svg')).text()).toContain('>&lt;&#34;</text>');
  });

  test('rejects an invalid color', async () => {
    const res = await get('/avatar/123/TM.svg?c=zzz');
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ code: 'invalid_color', message: 'Invalid color parameter' });
  });

  test('only matches word-character ids', async () => {
    expect((await get('/avatar/abc_DEF_1/TM.svg')).status).toBe(200);
    expect((await get('/avatar/abc-def/TM.svg')).status).toBe(404);
  });
});

describe.skipIf(!hasImageMagick)('raster avatars', () => {
  test('renders a PNG', async () => {
    const res = await get('/avatar/123/TM.png');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(pngSize(await res.arrayBuffer())).toEqual({ width: 256, height: 256 });
  });

  test('renders a JPG', async () => {
    const res = await get('/avatar/123/TM.jpg');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/jpg');
    const image = new Uint8Array(await res.arrayBuffer());
    expect([...image.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
  });

  test('clamps the size to 1024px', async () => {
    const res = await get('/avatar/123/TM.png?s=5000');
    expect(pngSize(await res.arrayBuffer())).toEqual({ width: 1024, height: 1024 });
  });

  test('rejects an invalid color', async () => {
    const res = await get('/avatar/123/TM.png?c=zzz');
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ code: 'invalid_color', message: 'Invalid color parameter' });
  });
});
