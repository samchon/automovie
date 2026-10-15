import { p } from "./p";
import { Point } from "./Point";
import { modelFace } from "./modelFace";
import { ObjectMesh } from "./ObjectMesh";

/** Faceted ellipsoid; the owner supplies every centre, radius and division. */

export const modelEllipsoid = (builder: ObjectMesh, part: string,
  center: Point, radii: Point, around: number, levels: number): void => {
  if (!(radii.x > 0 && radii.y > 0 && radii.z > 0 && around >= 3 && levels >= 2))
    throw new Error(`${part}: invalid ellipsoid dimensions`);
  const at = (level: number, side: number): Point => {
    const polar = Math.PI * level / levels, angle = 2 * Math.PI * side / around;
    return p(
      center.x + radii.x * Math.sin(polar) * Math.cos(angle),
      center.y + radii.y * Math.cos(polar),
      center.z - radii.z * Math.sin(polar) * Math.sin(angle)
    );
  };
  const top = p(center.x, center.y + radii.y, center.z);
  const bottom = p(center.x, center.y - radii.y, center.z);
  for (let side = 0; side < around; side++) {
    modelFace(builder, part, [top, at(1, side), at(1, side + 1)]);
    for (let level = 1; level < levels - 1; level++)
      modelFace(builder, part, [
        at(level, side),
        at(level + 1, side),
        at(level + 1, side + 1),
        at(level, side + 1),
      ]);
    modelFace(builder, part, [bottom, at(levels - 1, side + 1), at(levels - 1, side)]);
  }
};
