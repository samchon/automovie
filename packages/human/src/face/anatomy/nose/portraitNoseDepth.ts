import { IPortraitNoseShape } from "./structures/IPortraitNoseShape";
import { IPortraitNoseSocket } from "./structures/IPortraitNoseSocket";

/**
 * Anterior displacement of the nasal surface at one host point, in millimetres: a tip bump plus one mirrored alar bump, each a Gaussian scaled by its projection channel.
 *
 * The point is a head-frame position in millimetres (+X anatomical left, +Y up). The tip bump is centred on the midline at `tipY` with the socket's two tip radii. The alar bump is centred on `alarY` at distance `alarOffset` from the midline on either side, taken through `|x|` so one expression serves both alae and the result is exactly mirror-symmetric. Each radius is the distance at which a bump has fallen to `1/e`, and a zero `tipProjection` and `alarProjection` return zero everywhere, the neutral of both channels. The result is a displacement along host Z, so a positive value advances the surface.
 *
 * The expression is smooth except for a slope break of the alar term on the midline, where `|x|` folds; the size of the break scales with `exp(-(alarOffset / alarRadius)^2)`, which is negligible when the alae sit several radii from the midline and is not when they nearly coincide. Radii must be positive and finite, which `resolvePortraitNoseSocket` admits.
 *
 * @evidence contracts/common.md#principled-implementation Tip and mirrored alar Gaussian fields add signed head-Z projection at the supplied point.
 * @evidence contracts/common.md#clear-and-simple-design One scalar field serves exterior targets and pre-fit aperture samples.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The absolute-X alar fold can create a midline slope break; the field is an authored geometric hypothesis rather than recovered nasal tissue.
 * @evidence contracts/common.md#meaningful-documentation Coordinates, influence radii and displacements are millimetres, with positive radii admitted by the socket owner.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed Gaussian evaluations take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work One depth expression prevents separate exterior and rim projection formulas.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the scalar displacement escapes and no mesh or sample cache is retained.
 */
export function portraitNoseDepth(
  point: number[],
  socket: IPortraitNoseSocket,
  shape: IPortraitNoseShape,
): number {
  const x: number = point[0] - socket.midline;
  const alar: number = Math.exp(
    -(((Math.abs(x) - socket.alarOffset) / socket.alarRadius) ** 2) -
      ((point[1] - socket.alarY) / socket.alarRadius) ** 2,
  );
  const tip: number = Math.exp(
    -((x / socket.tipRadius[0]) ** 2) -
      ((point[1] - socket.tipY) / socket.tipRadius[1]) ** 2,
  );
  return shape.alarProjection * alar + shape.tipProjection * tip;
}
