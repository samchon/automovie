import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A waypoint that takes a straight leg round a point it would pass too near
 * (`approach`): abeam the point at the passing distance, on the side of the leg
 * the point already lies away from, or none when the leg passes clear or the
 * point lies beyond either end.
 *
 * @param from The leg's start, floor metres.
 * @param to The leg's end.
 * @param point The point to pass.
 * @param pass The least passing distance, metres.
 * @returns The waypoint on the floor, or undefined.
 */
export function approachAbeam(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  point: IAutoMovieVector3,
  pass: number,
): IAutoMovieVector3 | undefined {
  const dx: number = to.x - from.x;
  const dz: number = to.z - from.z;
  const length: number = Math.hypot(dx, dz);
  if (length < 1e-9) return undefined;
  const ux: number = dx / length;
  const uz: number = dz / length;
  const along: number = (point.x - from.x) * ux + (point.z - from.z) * uz;
  if (along <= 0 || along >= length) return undefined;
  const across: number = (point.x - from.x) * -uz + (point.z - from.z) * ux;
  if (Math.abs(across) >= pass) return undefined;
  const side: number = across >= 0 ? -1 : 1;
  return {
    x: point.x + side * pass * -uz,
    y: 0,
    z: point.z + side * pass * ux,
  };
}
