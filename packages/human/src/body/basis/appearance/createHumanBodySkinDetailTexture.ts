import { seededValue } from "@automovie/engine";

import { encodePng } from "../../../common/mesh/encodePng";
import type { IAutoMovieHumanBodySkinDetail } from "../../structures/IAutoMovieHumanBodySkinDetail";
import { createHumanBodySkinPoreSampler } from "./createHumanBodySkinPoreSampler";

/**
 * A tileable tangent-space normal map of the skin's micro-relief, as a PNG data URI: the surface a body's skin shows at close range, which no vertex of the body mesh is fine enough to carry.
 *
 * The relief is a height field over one square tile of the table's physical size. The primary lines of the skin's glyphic pattern are families of parallel grooves with integer UV phase coefficients so the tile repeats seamlessly. An unwarped groove follows constant `a*u + b*v`, perpendicular to the phase gradient `(a, b)`; each groove is a Gaussian valley of the family's width, its phase warped by `wander` of a groove and its depth scaled by `1 + vary` times a second field, held at zero, where each field is a periodic sum of six integer-frequency sinusoids, so the lines wander, deepen and break as skin's do. Follicular openings are Gaussian dimples whose nearest-integer tile population and equal-area seeded placement belong to createHumanBodySkinPoreSampler. This is a sampling convention, not a measured point process or whole-body density guarantee. The field wraps with the tile. The normal at a texel is `normalize(-dh/dx, -dh/dy, 1)` from wrapped central differences of the height, both in micrometres, stored as `(n + 1) / 2` in linear 8-bit RGB with opaque alpha. Every value comes from the table and `seededValue`, so the same table yields the same bytes. The appearance owner supplies its admitted physical-size, pixel and groove table; this routine adds no separate arbitrary-table admission.
 *
 * @evidence contracts/common.md#principled-implementation Integer-frequency periodic groove fields and seeded Gaussian pore dimples form a wrapped height raster; central differences in physical micrometers produce normalized linear RGB tangent normals.
 * @evidence contracts/common.md#clear-and-simple-design One CPU texture producer delegates pore population/placement and PNG encoding to existing owners while local periodic fields serve groove wander and strength.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed six-wave/eight-frequency synthesis is an authored sampling convention, not a measured point process, personal skin reconstruction or whole-body pore-density guarantee.
 * @evidence contracts/common.md#meaningful-documentation The prose gives periodicity, physical tile/gradient units, opaque linear-byte encoding, deterministic seed behavior and the admitted-table premise.
 * @evidence contracts/performance.md#efficient-algorithms For N pixels per side, F groove families and P pores with radius reach R, synthesis costs O(F*N²+P*R²+N²); cached axis sine/cosine tables avoid transcendental evaluation per groove texel.
 * @evidence contracts/performance.md#reuse-equivalent-work Each periodic field shares six precomputed row/column tables for all texels; the appearance owner caches the completed PNG instead of this producer retaining cross-call state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Height and RGBA rasters require O(N²) bytes plus field tables; all temporaries expire after encoding and only the returned URI escapes without GPU handles.
 */
export function createHumanBodySkinDetailTexture(
  table: IAutoMovieHumanBodySkinDetail,
): string {
  const pores: ReturnType<typeof createHumanBodySkinPoreSampler> =
    createHumanBodySkinPoreSampler({
      seed: table.seed,
      tileMillimetres: table.tileMillimetres,
      perSquareCentimetre: table.pores.perSquareCentimetre,
    });
  const size: number = table.pixels;
  const micrometresPerPixel: number = (table.tileMillimetres * 1000) / size;
  const height: Float64Array = new Float64Array(size * size);
  // primary lines: phase = (a x + b y) / size + warp, a groove at each integer
  table.lines.forEach(
    (
      family: IAutoMovieHumanBodySkinDetail["lines"][number],
      index: number,
    ): void => {
      const spacing: number =
        (table.tileMillimetres * 1000) / Math.hypot(family.a, family.b);
      // a periodic field of six sinusoids, integer frequencies up to eight
      // turns across the tile, amplitudes falling as one over the frequency
      const field: (salt: number) => (x: number, y: number) => number = (
        salt: number,
      ): ((x: number, y: number) => number) => {
        const waves: {
          fx: number;
          fy: number;
          amplitude: number;
          phase: number;
        }[] = Array.from(
          { length: 6 },
          (
            _: unknown,
            k: number,
          ): { fx: number; fy: number; amplitude: number; phase: number } => {
            const fx: number =
              Math.floor(seededValue(table.seed, index, salt, k, 1) * 17) - 8;
            const fy: number =
              Math.floor(seededValue(table.seed, index, salt, k, 2) * 17) - 8;
            const f: number = Math.hypot(fx, fy) || 1;
            return {
              fx: fx === 0 && fy === 0 ? 1 : fx,
              fy,
              amplitude: 1 / f,
              phase: seededValue(table.seed, index, salt, k, 3) * 2 * Math.PI,
            };
          },
        );
        const total: number = waves.reduce(
          (sum: number, w: (typeof waves)[number]): number => sum + w.amplitude,
          0,
        );
        // sin(A + B) from per-column and per-row tables: no sine per texel
        const tables: {
          amplitude: number;
          sx: number[];
          cx: number[];
          sy: number[];
          cy: number[];
        }[] = waves.map(
          (
            w: (typeof waves)[number],
          ): {
            amplitude: number;
            sx: number[];
            cx: number[];
            sy: number[];
            cy: number[];
          } => ({
            amplitude: w.amplitude / total,
            sx: Array.from({ length: size }, (_: unknown, x: number): number =>
              Math.sin((2 * Math.PI * w.fx * x) / size),
            ),
            cx: Array.from({ length: size }, (_: unknown, x: number): number =>
              Math.cos((2 * Math.PI * w.fx * x) / size),
            ),
            sy: Array.from({ length: size }, (_: unknown, y: number): number =>
              Math.sin((2 * Math.PI * w.fy * y) / size + w.phase),
            ),
            cy: Array.from({ length: size }, (_: unknown, y: number): number =>
              Math.cos((2 * Math.PI * w.fy * y) / size + w.phase),
            ),
          }),
        );
        return (x: number, y: number): number =>
          tables.reduce(
            (sum: number, t: (typeof tables)[number]): number =>
              sum + t.amplitude * (t.sx[x] * t.cy[y] + t.cx[x] * t.sy[y]),
            0,
          );
      };
      // the grooves wander and deepen and fade along their length, some to
      // nothing, as skin's lines break
      const wander: (x: number, y: number) => number = field(1);
      const strength: (x: number, y: number) => number = field(2);
      for (let y: number = 0; y < size; y++)
        for (let x: number = 0; x < size; x++) {
          const phase: number =
            (family.a * x + family.b * y) / size + family.wander * wander(x, y);
          const offset: number = (phase - Math.round(phase)) * spacing;
          const depth: number =
            family.depth * Math.max(0, 1 + family.vary * strength(x, y));
          height[y * size + x] -=
            depth * Math.exp(-((offset / family.width) ** 2));
        }
    },
  );
  const radius: number = table.pores.radiusMicrometres / micrometresPerPixel;
  const reach: number = Math.ceil(radius * 3);
  for (let index: number = 0; index < pores.count; index++) {
    const [u, v]: ReturnType<typeof pores.at> = pores.at(index);
    const px: number = u * size;
    const py: number = v * size;
    for (let dy: number = -reach; dy <= reach; dy++)
      for (let dx: number = -reach; dx <= reach; dx++) {
        const x: number = Math.floor(px) + dx;
        const y: number = Math.floor(py) + dy;
        const r: number = Math.hypot(x + 0.5 - px, y + 0.5 - py) / radius;
        const wx: number = ((x % size) + size) % size;
        const wy: number = ((y % size) + size) % size;
        height[wy * size + wx] -=
          table.pores.depthMicrometres * Math.exp(-(r * r));
      }
  }
  const rgba: Uint8Array = new Uint8Array(size * size * 4);
  const at: (x: number, y: number) => number = (x: number, y: number): number =>
    height[(((y % size) + size) % size) * size + (((x % size) + size) % size)];
  for (let y: number = 0; y < size; y++)
    for (let x: number = 0; x < size; x++) {
      const gx: number =
        (at(x + 1, y) - at(x - 1, y)) / (2 * micrometresPerPixel);
      const gy: number =
        (at(x, y + 1) - at(x, y - 1)) / (2 * micrometresPerPixel);
      const length: number = Math.hypot(gx, gy, 1);
      const n: number[] = [-gx / length, -gy / length, 1 / length];
      for (let k: number = 0; k < 3; k++)
        rgba[(y * size + x) * 4 + k] = Math.round(((n[k] + 1) / 2) * 255);
      rgba[(y * size + x) * 4 + 3] = 255;
    }
  return encodePng({ width: size, height: size, rgba });
}
