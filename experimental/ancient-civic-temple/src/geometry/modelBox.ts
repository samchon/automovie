/**
 * Metric face construction for reviewed model prototypes. Inputs are local
 * metre coordinates. The explicit outline, grain axis and surface id remain
 * with each model owner; this module only emits faces and stable UV seams.
 * A change here invalidates every model mesh and neutral-board observation.
 */
import { ObjectMesh } from "./ObjectMesh";
import { modelFace } from "./modelFace";
import { Point } from "./Point";
import { p } from "./p";

/** A solid rectangular section; grain axis is the reviewed member's long axis. */
export const modelBox = (builder: ObjectMesh, part: string,
  min: Point, max: Point, grain?: { origin: Point; direction: Point }): void => {
  if (!(max.x > min.x && max.y > min.y && max.z > min.z))
    throw new Error(`${part}: positive box extents required`);
  const a=min.x,b=max.x,c=min.y,d=max.y,e=min.z,f=max.z;
  const faces = [
    [p(a,c,e),p(b,c,e),p(b,c,f),p(a,c,f)], // bottom -Y
    [p(a,d,f),p(b,d,f),p(b,d,e),p(a,d,e)], // top +Y
    [p(a,c,f),p(b,c,f),p(b,d,f),p(a,d,f)], // front +Z
    [p(b,c,e),p(a,c,e),p(a,d,e),p(b,d,e)], // back -Z
    [p(a,c,e),p(a,c,f),p(a,d,f),p(a,d,e)], // left -X
    [p(b,c,f),p(b,c,e),p(b,d,e),p(b,d,f)], // right +X
  ];
  for (const face of faces) modelFace(builder,part,face,grain);
};

