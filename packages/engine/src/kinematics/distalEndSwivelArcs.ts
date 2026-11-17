import { Quaternion } from "../math/Quaternion";
import { distalEndSwivelReadings } from "./distalEndSwivelReadings";
import { swivelArcs } from "./swivelArcs";

/**
 * The swivels at which the end joint of a chain whose mid segment twists
 * distally (a wrist beyond a forearm) cannot take a requested rotation
 * inside its range, as arcs in closed form.
 *
 * The end joint's two free angles are read off where the mid segment points
 * in the requested rotation's frame (`distalEndSwivelReadings` states the
 * derivation): the abduction by its sine `-d_flexion`, the flexion by the
 * vector `(d_abduction, d_twist)`, every component a sinusoid of the swivel.
 * Each bound of the joint's box therefore refuses the arc where its sinusoid
 * exceeds the margin (`swivelArcs`), as `boxExcludedSwivels` reads a root
 * joint's box.
 *
 * The arcs say nothing of the mid segment's own twist range: the twist the
 * request leaves it is not a sinusoid of the swivel and is the caller's to
 * check at the swivel chosen.
 *
 * @param props The end joint, the mid segment's direction by swivel and the margin.
 * @returns The refused arcs merged over a turn, every swivel, or null when the analysis does not apply (`distalEndSwivelReadings.of`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the premise, where the derivation of both readings lives, what the arcs leave to the caller and when the result is null.
 * @evidence contracts/development/implementation.md#principled-implementation A distal twist leaves the mid segment's direction unchanged and the end joint's twist is immobile, so its two angles are read off that direction in the requested rotation's frame; the direction is affine in the mid joint's place, which circles the root-to-target line, so each bound is a sinusoid of the swivel with exact roots (Tolani, Goswami and Badler 2000, after Korein: the elbow's restriction as a function of the wrist joints).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared readings, the two angles' bounds and one union.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact roots, never sampling; a joint or an interval the analysis does not cover returns null rather than a guess, and the margin is the caller's.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three directions, nine dot products, at most four arcs and one merge.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The readings are `distalEndSwivelReadings`'s, shared with the least rotation miss; the arcs and their union are `swivelArcs`'s, shared with a root joint's box.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function distalEndSwivelArcs(
  props: distalEndSwivelReadings.IProps & {
    /** How far past a bound, in sine or projected units, a reading must lie to be refused; negative keeps the result strictly inside. */
    margin: number;
  },
): swivelArcs.IArc[] | "all" | null {
  const read: distalEndSwivelReadings.IReadings | null = distalEndSwivelReadings.of(props);
  if (read === null) return null;
  const { onFlexion, onAbduction, onTwist }: distalEndSwivelReadings.IReadings = read;

  const arcs: swivelArcs.IArc[] = [];
  const refuse = (f: swivelArcs.ISinusoid): boolean => {
    const arc: swivelArcs.IArc | "all" | null = swivelArcs.above(f, props.margin);
    if (arc === "all") return true;
    if (arc !== null) arcs.push(arc);
    return false;
  };

  // Abduction, the middle angle: sin a = -d_flexion, inside [lo, hi] within
  // a quarter turn either way.
  if (read.abduction !== null) {
    const [lo, hi]: readonly [number, number] = read.abduction;
    const sine: swivelArcs.ISinusoid = swivelArcs.scaled(onFlexion, -1);
    if (hi < 90 && refuse({ ...sine, a: sine.a - Math.sin(hi * Quaternion.DEG2RAD) })) return "all";
    if (lo > -90 && refuse(swivelArcs.scaled({ ...sine, a: sine.a - Math.sin(lo * Quaternion.DEG2RAD) }, -1)))
      return "all";
  }

  // Flexion, an outer angle: atan2(d_abduction, d_twist), past the upper end
  // where y cos β - x sin β is positive and past the lower where
  // x sin α - y cos α is, for an interval no wider than a half turn.
  if (read.flexion !== null) {
    const alpha: number = read.flexion[0] * Quaternion.DEG2RAD;
    const beta: number = read.flexion[1] * Quaternion.DEG2RAD;
    if (refuse(swivelArcs.combined(onAbduction, Math.cos(beta), onTwist, -Math.sin(beta)))) return "all";
    if (refuse(swivelArcs.combined(onTwist, Math.sin(alpha), onAbduction, -Math.cos(alpha)))) return "all";
  }
  return swivelArcs.union(arcs);
}
