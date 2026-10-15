import { p } from "./p";
import { Point } from "./Point";
import { modelFace } from "./modelFace";
import { ObjectMesh } from "./ObjectMesh";

/** Extrudes one counterclockwise XY section from back to front. */

export const modelExtrudeXY = (builder: ObjectMesh, part: string,
  section: readonly (readonly [number, number])[], back: number, front: number,
  grain?: { origin: Point; direction: Point; }): void => {
  if (section.length < 3 || !(front > back)) throw new Error(
    `${part}: invalid XY section`
  );
  // Ear clipping preserves the cap of a concave section; a fan can put
  // reversed triangles across a beam's underside notch.
  const cross2 = (a: readonly [number, number], b: readonly [number, number],
    c: readonly [number, number]) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const active = section.map((_, i) => i).filter((i) => Math.abs(cross2(section[(i + section.length - 1) % section.length]!, section[i]!,
    section[(i + 1) % section.length]!)) > 1e-12);
  const triangles: number[][] = [];
  while (active.length > 3) {
    let cut = false;
    for (let j = 0; j < active.length; j++) {
      const ia = active[(j + active.length - 1) % active.length]!, ib = active[j]!, ic = active[(j + 1) % active.length]!;
      const a = section[ia]!, b = section[ib]!, c = section[ic]!;
      if (cross2(a, b, c) <= 1e-12) continue;
      if (active.some((index) => index !== ia && index !== ib && index !== ic &&
        cross2(a, b, section[index]!) >= -1e-12 &&
        cross2(b, c, section[index]!) >= -1e-12 &&
        cross2(c, a, section[index]!) >= -1e-12)) continue;
      triangles.push([ia, ib, ic]);
      active.splice(j, 1);
      cut = true;
      break;
    }
    if (!cut) throw new Error(`${part}: section cannot be triangulated`);
  }
  triangles.push([...active]);
  for (const triangle of triangles) {
    modelFace(
      builder,
      part,
      triangle.map((i) => {
        const [x, y] = section[i]!;
        return p(x, y, front);
      }),
      grain
    );
    modelFace(
      builder,
      part,
      [...triangle].reverse().map((i) => {
        const [x, y] = section[i]!;
        return p(x, y, back);
      }),
      grain
    );
  }
  for (let i = 0; i < section.length; i++) {
    const [x0, y0] = section[i]!, [x1, y1] = section[(i + 1) % section.length]!;
    modelFace(
      builder,
      part,
      [p(x0, y0, front), p(x0, y0, back), p(x1, y1, back), p(x1, y1, front)],
      grain
    );
  }
};
