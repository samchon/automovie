import type {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { swivelArcs } from "./swivelArcs";
import { swivelJointReadings } from "./swivelJointReadings";

/**
 * The swivels at which the end joint of a chain whose mid segment twists
 * distally (a wrist beyond a forearm) cannot take a requested rotation
 * inside its range, as arcs in closed form.
 *
 * The mid segment's twist turns it about its own long axis `u` and leaves
 * where it points unchanged, and the end joint's own twist is immobile, so
 * with the end joint's world rotation `R` requested, its two free angles are
 * fixed by where the mid segment points alone. The end joint's articulation
 * is `L = Abd(a) Flex(f)` (the proximal order of
 * `decomposeJointRotationOnBasis` with no twist) and `R = M rest L` with `M`
 * the mid segment's world rotation, so `d = R^-1 u_world = L^-1 (rest^-1 u)`.
 * When `rest^-1 u` is the end joint's twist axis, in the joint's basis
 * coordinates (flexion, abduction, twist) that is
 * `d = (-sin a, cos a sin f, cos a cos f)`: the abduction is the middle angle,
 * read by its sine `-d_flexion`, and the flexion an outer angle, read by the
 * vector `(d_abduction, d_twist)`. The mid segment's world axis is affine in
 * the mid joint's place, which circles the root-to-target line as the swivel
 * turns, so every component of `d` is `a + b cos ψ + c sin ψ`, fitted exactly
 * from three swivels, and each bound of the joint's box refuses the arc
 * where its sinusoid exceeds the margin (`swivelArcs`), as
 * `boxExcludedSwivels` reads a root joint's box.
 *
 * The arcs say nothing of the mid segment's own twist range: the twist the
 * request leaves it is not a sinusoid of the swivel and is the caller's to
 * check at the swivel chosen.
 *
 * @param props The end joint and the mid segment's direction by swivel.
 * @returns The refused arcs merged over a turn, every swivel, or null when the analysis does not apply (no range, a swing-twist gate, a mobile twist, a rest that does not carry the mid segment's axis onto the twist axis, or an interval it cannot read).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the premise, the derivation of both readings, what the arcs leave to the caller and every case that returns null.
 * @evidence contracts/development/implementation.md#principled-implementation A distal twist leaves the mid segment's direction unchanged and the end joint's twist is immobile, so its two angles are read off that direction in the requested rotation's frame; the direction is affine in the mid joint's place, which circles the root-to-target line, so each bound is a sinusoid of the swivel with exact roots (Tolani, Goswami and Badler 2000, after Korein: the elbow's restriction as a function of the wrist joints).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three sampled directions, three fitted components, the two angles' bounds and one union.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact roots, never sampling; a joint or an interval the analysis does not cover returns null rather than a guess, and the margin is the caller's.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three directions, nine dot products, at most four arcs and one merge.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The fit, the arcs and their union are `swivelArcs`'s and the rest-relative interval `swivelJointReadings`'s, shared with a root joint's box.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function distalEndSwivelArcs(props: {
  /** The end joint's clinical basis, admitted and normalized (`normalizeJointAxes`), in the proximal order. */
  basis: IAutoMovieJointAxes;

  /** The rest frame lifting the joint's rest-relative angles to clinical ones; omitted, they are clinical. */
  frame?: IAutoMovieRestFrame | undefined;

  /** The joint's resolved range of motion. */
  constraint: IAutoMovieJointConstraint | null;

  /** The mid segment's long axis in the end joint's rest frame (`rest^-1 u`), unit. */
  axis: IAutoMovieVector3;

  /** The mid segment's world long axis at a swivel, degrees, in the requested end rotation's frame (`R^-1 u_world`), unit. */
  direction: (swivel: number) => IAutoMovieVector3;

  /** How far past a bound, in sine or projected units, a reading must lie to be refused; negative keeps the result strictly inside. */
  margin: number;
}): swivelArcs.IArc[] | "all" | null {
  const constraint: IAutoMovieJointConstraint | null = props.constraint;
  if (constraint === null) return null;
  if (constraint.swingTwist !== undefined && constraint.swingTwist !== null) return null;
  if (constraint.twist !== null) return null;
  if (props.basis.twistPlacement === "distal") return null;
  const basis: IAutoMovieJointAxes = props.basis;
  const handed: 1 | -1 =
    Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >= 0 ? 1 : -1;
  const twist: IAutoMovieVector3 = Vector3.scale(basis.twist, handed);
  if (!(Vector3.dot(props.axis, twist) > 1 - 1e-9)) return null;

  // d's three components on the basis, each a sinusoid of the swivel.
  const sampled: IAutoMovieVector3[] = [0, 90, 180].map(props.direction);
  const along = (axis: IAutoMovieVector3): swivelArcs.ISinusoid => {
    const [zero, quarter, half] = sampled.map(
      (d: IAutoMovieVector3): number => Vector3.dot(d, axis),
    ) as [number, number, number];
    return swivelArcs.fitted(zero, quarter, half);
  };
  const onFlexion: swivelArcs.ISinusoid = along(basis.flexion);
  const onAbduction: swivelArcs.ISinusoid = along(basis.abduction);
  const onTwist: swivelArcs.ISinusoid = along(twist);

  const arcs: swivelArcs.IArc[] = [];
  const refuse = (f: swivelArcs.ISinusoid): boolean => {
    const arc: swivelArcs.IArc | "all" | null = swivelArcs.above(f, props.margin);
    if (arc === "all") return true;
    if (arc !== null) arcs.push(arc);
    return false;
  };

  // Abduction, the middle angle: sin a = -d_flexion, inside [lo, hi] within
  // a quarter turn either way.
  const abduction: IAutoMovieAngleRange | null = constraint.abduction;
  if (abduction !== null) {
    const [lo, hi] = swivelJointReadings.rig(abduction, props.frame?.abduction);
    if (lo < -90 || hi > 90) return null;
    const sine: swivelArcs.ISinusoid = swivelArcs.scaled(onFlexion, -1);
    if (hi < 90 && refuse({ ...sine, a: sine.a - Math.sin(hi * Quaternion.DEG2RAD) })) return "all";
    if (lo > -90 && refuse(swivelArcs.scaled({ ...sine, a: sine.a - Math.sin(lo * Quaternion.DEG2RAD) }, -1)))
      return "all";
  }

  // Flexion, an outer angle: atan2(d_abduction, d_twist), past the upper end
  // where y cos β - x sin β is positive and past the lower where
  // x sin α - y cos α is, for an interval no wider than a half turn.
  const flexion: IAutoMovieAngleRange | null = constraint.flexion;
  if (flexion !== null) {
    const [lo, hi] = swivelJointReadings.rig(flexion, props.frame?.flexion);
    if (hi - lo > 180) return null;
    const alpha: number = lo * Quaternion.DEG2RAD;
    const beta: number = hi * Quaternion.DEG2RAD;
    if (refuse(swivelArcs.combined(onAbduction, Math.cos(beta), onTwist, -Math.sin(beta)))) return "all";
    if (refuse(swivelArcs.combined(onTwist, Math.sin(alpha), onAbduction, -Math.cos(alpha)))) return "all";
  }
  return swivelArcs.union(arcs);
}
