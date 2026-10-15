import { p } from "./p";
import { Point } from "./Point";
import { modelFace } from "./modelFace";
import { ObjectMesh } from "./ObjectMesh";

/** Extrudes one counterclockwise YZ section across X. */

export const modelExtrudeYZ = (builder: ObjectMesh, part: string,
  section: readonly (readonly [number, number])[], left: number, right: number,
  grain?: { origin: Point; direction: Point; }): void => {
  if (section.length < 3 || !(right > left)) throw new Error(
    `${part}: invalid YZ section`
  );
  modelFace(
    builder,
    part,
    section.map(([y, z]) => p(right, y, z)),
    grain
  );
  modelFace(
    builder,
    part,
    [...section].reverse().map(([y, z]) => p(left, y, z)),
    grain
  );
  for (let i = 0; i < section.length; i++) {
    const [y0, z0] = section[i]!, [y1, z1] = section[(i + 1) % section.length]!;
    modelFace(
      builder,
      part,
      [p(right, y0, z0), p(left, y0, z0), p(left, y1, z1), p(right, y1, z1)],
      grain
    );
  }
};
