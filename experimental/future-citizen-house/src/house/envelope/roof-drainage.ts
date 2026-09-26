/** Roof drainage: one gutter, overflow, outlet and removable grate.
 * The roof supplies its measured x offset and fall function; this owner
 * builds their solids against the same plan datum. */
import { Assembly, rectangle, v } from "../assembly";
import {
  type Height,
  type Point,
  heightRegion,
  putMesh,
  tubeMesh,
} from "../metric-solid";
import { datum } from "../plan";

export type Solid = (
  id: string,
  plan: Point[],
  low: Height,
  high: Height,
  material?: string,
  holes?: Point[][],
  blind?: Height,
) => string;
export type Flat = (
  id: string,
  x0: number,
  x1: number,
  z0: number,
  z1: number,
  y0: number,
  y1: number,
) => string;
export function drainage(
  a: Assembly,
  solid: Solid,
  flat: Flat,
  gutterX: number,
  G: (z: number) => number,
): void {
  const gutterEnd = datum.maxZ + 0.1;
  const atRoof = (offset: number) => datum.roof + offset;
  for (const side of [-1, 1]) {
    const notch = Array.from({ length: 17 }, (_, i) => ({
      x: gutterX + 0.05 * Math.cos(Math.PI - (i * Math.PI) / 16),
      y: side * 0.05 * Math.sin(Math.PI - (i * Math.PI) / 16),
    }));
    const plan = [
      { x: gutterX - 0.1, y: 0 },
      ...notch,
      { x: gutterX + 0.1, y: 0 },
      { x: gutterX + 0.1, y: side * gutterEnd },
      { x: gutterX - 0.1, y: side * gutterEnd },
    ];
    solid(
      "gutter-floor-" + side,
      plan,
      (_, z) => G(z) - 0.002,
      (_, z) => G(z),
    );
    const z0 = Math.min(0, side * gutterEnd),
      z1 = Math.max(0, side * gutterEnd);
    solid(
      "gutter-inner-" + side,
      rectangle(gutterX + 0.098, gutterX + 0.1, z0, z1),
      (_, z) => G(z),
      () => atRoof(0.02),
    );
    solid(
      "gutter-outer-" + side,
      rectangle(
        gutterX - 0.1,
        gutterX - 0.098,
        side < 0 ? -gutterEnd : 0.1,
        side < 0 ? -0.1 : gutterEnd,
      ),
      (_, z) => G(z),
      () => atRoof(0.05),
    );
    solid(
      "gutter-notch-bottom-" + side,
      rectangle(
        gutterX - 0.1,
        gutterX - 0.098,
        side < 0 ? -0.1 : 0,
        side < 0 ? 0 : 0.1,
      ),
      (_, z) => G(z),
      () => atRoof(-0.02),
    );
    flat(
      "gutter-end-" + side,
      gutterX - 0.098,
      gutterX + 0.098,
      side < 0 ? -gutterEnd : gutterEnd - 0.002,
      side < 0 ? -gutterEnd + 0.002 : gutterEnd,
      G(gutterEnd),
      atRoof(0.05),
    );
  }
  flat(
    "gutter-notch-header",
    gutterX - 0.1,
    gutterX - 0.098,
    -0.1,
    0.1,
    atRoof(0.03),
    atRoof(0.05),
  );
  flat(
    "overflow-spout-floor",
    gutterX - 0.22,
    gutterX - 0.1,
    -0.1,
    0.1,
    atRoof(-0.022),
    atRoof(-0.02),
  );
  for (const z of [-0.1, 0.098])
    flat(
      "overflow-spout-side-" + z,
      gutterX - 0.22,
      gutterX - 0.1,
      z,
      z + 0.002,
      atRoof(-0.02),
      atRoof(0.03),
    );
  // The split annular rim follows G exactly, including its low-point crease.
  for (const side of [-1, 1]) {
    const arc = (radius: number) =>
      Array.from({ length: 17 }, (_, i) => ({
        x: gutterX + radius * Math.cos((i * Math.PI) / 16),
        y: side * radius * Math.sin((i * Math.PI) / 16),
      }));
    solid(
      "gutter-outlet-rim-" + side,
      [...arc(0.055), ...arc(0.05).reverse()],
      () => atRoof(-0.12),
      (_, z) => G(z) - 0.002,
    );
  }
  putMesh(
    a,
    "gutter-outlet-neck",
    "house",
    "canopy-metal",
    tubeMesh(gutterX, 0, datum.ceilings[1], atRoof(-0.12), 0.055, 0.05),
    "drainage",
  );
  for (const [i, xs] of [
    [gutterX - 0.098, gutterX - 0.07],
    [gutterX + 0.07, gutterX + 0.098],
  ].entries())
    flat(
      "gutter-grate-ledge-" + i,
      xs[0],
      xs[1],
      -0.14,
      0.14,
      atRoof(0.008),
      atRoof(0.01),
    );
  const holes = Array.from({ length: 7 }, (_, i) =>
    rectangle(-0.067 + i * 0.02, -0.053 + i * 0.02, -0.08, 0.08),
  );
  const model = a.model("gutter-grate-model", "steel", {
    type: "mesh",
    mesh: heightRegion(
      rectangle(-0.08, 0.08, -0.1, 0.1),
      () => 0,
      () => 0.02,
      holes,
    ),
  });
  a.place(
    "gutter-grate",
    "removable-grate",
    "house",
    model,
    v(gutterX, atRoof(0.01), 0),
  );
}
