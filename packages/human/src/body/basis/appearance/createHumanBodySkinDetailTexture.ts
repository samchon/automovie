import { seededValue } from "@automovie/engine";

import { encodePng } from "../../../common/mesh/encodePng";
import type { IAutoMovieHumanBodySkinDetail } from "../../structures/IAutoMovieHumanBodySkinDetail";
import { createHumanBodySkinPoreSampler } from "./createHumanBodySkinPoreSampler";

/**
 * A tileable tangent-space normal map of the skin's micro-relief, as a PNG
 * data URI: the surface a body's skin shows at close range, which no vertex
 * of the body mesh is fine enough to carry.
 *
 * The relief is a height field over one square tile of the table's physical
 * size. The primary lines of the skin's glyphic pattern are families of
 * parallel grooves with integer UV phase coefficients so the tile repeats
 * seamlessly. An unwarped groove follows constant `a*u + b*v`, perpendicular to the
 * phase gradient `(a, b)`; each groove is a
 * Gaussian valley of the family's width, its phase warped by `wander` of a
 * groove and its depth scaled by `1 + vary` times a second field, held at
 * zero, where each field is a periodic sum of six integer-frequency
 * sinusoids, so the lines wander, deepen and break as skin's do. Follicular
 * openings are Gaussian dimples whose nearest-integer tile population and
 * equal-area seeded placement belong to createHumanBodySkinPoreSampler.
 * This is a sampling convention, not a measured point process or whole-body
 * density guarantee. The field wraps with the tile. The normal at a texel is
 * `normalize(-dh/dx, -dh/dy, 1)` from
 * wrapped central differences of the height, both in micrometres, stored as
 * `(n + 1) / 2` in linear 8-bit RGB with opaque alpha. Every value comes from
 * the table and `seededValue`, so the same table yields the same bytes.
 */
export function createHumanBodySkinDetailTexture(
  table: IAutoMovieHumanBodySkinDetail,
): string {
  const pores = createHumanBodySkinPoreSampler({
    seed: table.seed,
    tileMillimetres: table.tileMillimetres,
    perSquareCentimetre: table.pores.perSquareCentimetre,
  });
  const size = table.pixels;
  const micrometresPerPixel = (table.tileMillimetres * 1000) / size;
  const height = new Float64Array(size * size);
  // primary lines: phase = (a x + b y) / size + warp, a groove at each integer
  table.lines.forEach((family, index) => {
    const spacing =
      (table.tileMillimetres * 1000) / Math.hypot(family.a, family.b);
    // a periodic field of six sinusoids, integer frequencies up to eight
    // turns across the tile, amplitudes falling as one over the frequency
    const field = (salt: number) => {
      const waves = Array.from({ length: 6 }, (_, k) => {
        const fx =
          Math.floor(seededValue(table.seed, index, salt, k, 1) * 17) - 8;
        const fy =
          Math.floor(seededValue(table.seed, index, salt, k, 2) * 17) - 8;
        const f = Math.hypot(fx, fy) || 1;
        return {
          fx: fx === 0 && fy === 0 ? 1 : fx,
          fy,
          amplitude: 1 / f,
          phase: seededValue(table.seed, index, salt, k, 3) * 2 * Math.PI,
        };
      });
      const total = waves.reduce((sum, w) => sum + w.amplitude, 0);
      // sin(A + B) from per-column and per-row tables: no sine per texel
      const tables = waves.map((w) => ({
        amplitude: w.amplitude / total,
        sx: Array.from({ length: size }, (_, x) =>
          Math.sin((2 * Math.PI * w.fx * x) / size),
        ),
        cx: Array.from({ length: size }, (_, x) =>
          Math.cos((2 * Math.PI * w.fx * x) / size),
        ),
        sy: Array.from({ length: size }, (_, y) =>
          Math.sin((2 * Math.PI * w.fy * y) / size + w.phase),
        ),
        cy: Array.from({ length: size }, (_, y) =>
          Math.cos((2 * Math.PI * w.fy * y) / size + w.phase),
        ),
      }));
      return (x: number, y: number) =>
        tables.reduce(
          (sum, t) =>
            sum + t.amplitude * (t.sx[x] * t.cy[y] + t.cx[x] * t.sy[y]),
          0,
        );
    };
    // the grooves wander and deepen and fade along their length, some to
    // nothing, as skin's lines break
    const wander = field(1);
    const strength = field(2);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const phase =
          (family.a * x + family.b * y) / size + family.wander * wander(x, y);
        const offset = (phase - Math.round(phase)) * spacing;
        const depth =
          family.depth * Math.max(0, 1 + family.vary * strength(x, y));
        height[y * size + x] -=
          depth * Math.exp(-((offset / family.width) ** 2));
      }
  });
  const radius = table.pores.radiusMicrometres / micrometresPerPixel;
  const reach = Math.ceil(radius * 3);
  for (let index = 0; index < pores.count; index++) {
    const [u, v] = pores.at(index);
    const px = u * size;
    const py = v * size;
    for (let dy = -reach; dy <= reach; dy++)
      for (let dx = -reach; dx <= reach; dx++) {
        const x = Math.floor(px) + dx;
        const y = Math.floor(py) + dy;
        const r = Math.hypot(x + 0.5 - px, y + 0.5 - py) / radius;
        const wx = ((x % size) + size) % size;
        const wy = ((y % size) + size) % size;
        height[wy * size + wx] -=
          table.pores.depthMicrometres * Math.exp(-(r * r));
      }
  }
  const rgba = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) =>
    height[(((y % size) + size) % size) * size + (((x % size) + size) % size)];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const gx = (at(x + 1, y) - at(x - 1, y)) / (2 * micrometresPerPixel);
      const gy = (at(x, y + 1) - at(x, y - 1)) / (2 * micrometresPerPixel);
      const length = Math.hypot(gx, gy, 1);
      const n = [-gx / length, -gy / length, 1 / length];
      for (let k = 0; k < 3; k++)
        rgba[(y * size + x) * 4 + k] = Math.round(((n[k] + 1) / 2) * 255);
      rgba[(y * size + x) * 4 + 3] = 255;
    }
  return encodePng({ width: size, height: size, rgba });
}
