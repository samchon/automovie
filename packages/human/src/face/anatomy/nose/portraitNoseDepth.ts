import { IPortraitNoseShape } from "./structures/IPortraitNoseShape";
import { IPortraitNoseSocket } from "./structures/IPortraitNoseSocket";

/**
 * Anterior displacement of the nasal surface at one host point, in
 * millimetres: a tip bump plus one mirrored alar bump, each a Gaussian scaled
 * by its projection channel.
 *
 * The point is a head-frame position in millimetres (+X anatomical left, +Y
 * up). The tip bump is centred on the midline at `tipY` with the socket's two
 * tip radii. The alar bump is centred on `alarY` at distance `alarOffset` from
 * the midline on either side, taken through `|x|` so one expression serves both
 * alae and the result is exactly mirror-symmetric. Each radius is the distance
 * at which a bump has fallen to `1/e`, and a zero `tipProjection` and
 * `alarProjection` return zero everywhere, the neutral of both channels. The
 * result is a displacement along host Z, so a positive value advances the
 * surface.
 *
 * The expression is smooth except for a slope break of the alar term on the
 * midline, where `|x|` folds; the size of the break scales with
 * `exp(-(alarOffset / alarRadius)^2)`, which is negligible when the alae sit
 * several radii from the midline and is not when they nearly coincide. Radii
 * must be positive and finite, which `resolvePortraitNoseSocket` admits.
 *
 * @evidence contracts/common.md#principled-implementation Each bump is a Gaussian of the normalized distance to its centre, bounded by its projection and smooth in the interior; mirroring through |x| is exact, and the slope break on the midline and the positive-radius precondition are stated beside the formula.
 * @evidence contracts/common.md#clear-and-simple-design One expression owns the nasal volume relief and both the exterior targets and the aperture samples read it, so no second depth field can disagree with it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is special-cased; the value follows the point, the socket centres and radii and the two projections.
 * @evidence contracts/common.md#meaningful-documentation The comment states the frame and unit, the centres and radii, the neutral, the sign, the midline slope break and the radius precondition.
 * @evidence contracts/modeling.md#parameter-channels `tipProjection` varies only the tip bump and `alarProjection` only the alar bump, each zero at neutral because the function then returns zero, and a positive value advances the surface along host Z as IPortraitNoseShape documents; the two alae are one channel mirrored through |x|, so no asymmetry is authored here; the two channels add where their supports overlap, so the relief there exceeds either alone.
 * @evidence contracts/modeling.md#spatial-conventions The point, the socket centres and radii and the result are head-frame millimetres with +X anatomical left, +Y up and +Z anterior; the function converts nothing.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part; it is the relief evaluator of the nose component.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitives; it returns one displacement for its caller to apply.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part; the component that samples it owns the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part; the nose component that consumes it is the declaration that observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value of its own; the Gaussian profile is a smooth envelope convention and the amplitudes and radii come from its inputs.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no quantity; the shape and socket admissions refuse what cannot be evaluated, and the bounds of a living nose are not encoded.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is arithmetic on channels IPortraitNoseShape already names, not an input through which a caller shapes a human form.
 */
export function portraitNoseDepth(
  point: number[],
  socket: IPortraitNoseSocket,
  shape: IPortraitNoseShape,
): number {
  const x = point[0] - socket.midline;
  const alar = Math.exp(
    -(((Math.abs(x) - socket.alarOffset) / socket.alarRadius) ** 2) -
      ((point[1] - socket.alarY) / socket.alarRadius) ** 2,
  );
  const tip = Math.exp(
    -((x / socket.tipRadius[0]) ** 2) -
      ((point[1] - socket.tipY) / socket.tipRadius[1]) ** 2,
  );
  return shape.alarProjection * alar + shape.tipProjection * tip;
}
