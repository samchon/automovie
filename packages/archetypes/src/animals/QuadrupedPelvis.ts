import type { IAutoMovieVector3 } from "@automovie/interface";

import type { QuadrupedLimb } from "./QuadrupedLimb";
import { QuadrupedScapula } from "./QuadrupedScapula";

/** Halvings of a search over the pelvis's turn: far below a micro-radian over its range. */
const STEPS: number = 60;

/**
 * The pelvis turning in the sagittal plane at the lumbosacral joint, carrying both hip joints fore and aft so the hind limbs follow a planted hoof's reach, as the shoulder blade does for a fore (`QuadrupedScapula`).
 *
 * The pelvis is the rig's hindquarters bar, from which both femurs hang; its origin, where it joins the trunk, stands for the lumbosacral joint, so the lever from the joint to each hip is the rig's own (no measured lumbosacral-to-hip distance was found; the identification is provisional). At rest the pelvis is unturned, so every rest pose stays as it was. Both hips turn together, so the two hinds bound the root jointly: the highest root at which one turn within half the pelvis's range either way lets both reach (`high`), and at the chosen root the turn nearest rest that does (`turn`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bar, its joint, the provisional lever, its rest and the joint bound and turn.
 * @evidence contracts/development/design.md#principled-representation A turn about the model X axis through the lumbosacral joint moves each hip on an arc, the shoulder blade's arc (`QuadrupedScapula.glenoid`), shared by both hips.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the pelvis's range, the hinds' joint root bound and the shared turn; the root interval and the ride pose read them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No detached hip or stretched bone; the pelvis turns rigidly within the cited range.
 */
export namespace QuadrupedPelvis {
  /** The bone that turns: the hindquarters bar, the femurs' parent. */
  export const BONE: "hindquarters" = "hindquarters";

  /** The pelvis's flexion-extension range during locomotion, degrees: 8.2 (Back et al. 1996, as `HorseGait.FOLLOW` cites). */
  export const RANGE: number = 8.2;

  /**
   * One hind's hip and the root constraint it must meet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Model space, metres, before the root translation.
   * @evidence contracts/development/design.md#principled-representation The pelvis's joint with this hip, the hind's ankle goal and its radial reach.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `high` and `turn` read for each hind.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IHip {
    /** The lumbosacral joint and this hip at rest. */
    joint: QuadrupedScapula.IJoint;

    /** The hind's ankle goal. */
    goal: IAutoMovieVector3;

    /** The hind's radial reach. */
    reach: QuadrupedLimb.IRange;
  }

  /**
   * The highest root translation at which one turn of the pelvis within range lets every hind reach its goal.
   *
   * @param hips Each hind's hip and constraint.
   * @returns The bound, metres; negative infinity when no turn lets them all reach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bound and its unit.
   * @evidence contracts/development/implementation.md#principled-implementation Each hind's highest root at a turn is its goal's height less the turned hip's plus the vertical leg of its reach over the remaining horizontal offset; the lowest over the hinds is concave in the turn on the range, so its maximum is found by a golden-section search, an out-of-reach hind counted by its horizontal excess so the search climbs back toward reach.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One search over one angle.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No reach is padded; an unreachable set is negative infinity.
   * @evidence contracts/development/implementation.md#efficient-algorithms `STEPS` evaluations of two closed forms.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the scapula's arc.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function high(hips: readonly IHip[]): number {
    const best: number = search(hips, 0);
    return lowest(hips, best, 0, false);
  }

  /**
   * The turn nearest rest at which every hind reaches its goal at a root translation.
   *
   * @param hips Each hind's hip and constraint.
   * @param height The chosen root translation, metres.
   * @param margin The coordinate roundoff budget, metres: each hip is aimed this far inside its reach so the exact limb solve admits it.
   * @returns The turn, radians, right-handed about +X; zero when the rest hips reach; the best turn when none lets all reach, which the limb solve then refuses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the choice, the unit and the unreachable case.
   * @evidence contracts/development/implementation.md#principled-implementation The set of turns admitting the root is an interval about the best turn, the joint bound being concave; bisect between rest and the best turn for its end nearest rest.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Rest, the best turn, one bisection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The turn never leaves the cited range.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most two `STEPS` searches.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the bound's closed forms.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function turn(
    hips: readonly IHip[],
    height: number,
    margin: number,
  ): number {
    if (lowest(hips, 0, margin, false) >= height) return 0;
    const best: number = search(hips, margin);
    if (!(lowest(hips, best, margin, false) >= height)) return best;
    let near: number = 0;
    let far: number = best;
    for (let k: number = 0; k < STEPS; k++) {
      const middle: number = (near + far) / 2;
      if (lowest(hips, middle, margin, false) >= height) far = middle;
      else near = middle;
    }
    return far;
  }

  /** The turn maximising the hinds' joint bound, by golden-section search over the range. */
  function search(hips: readonly IHip[], margin: number): number {
    const half: number = (RANGE * Math.PI) / 360;
    const ratio: number = (Math.sqrt(5) - 1) / 2;
    let a: number = -half;
    let b: number = half;
    for (let k: number = 0; k < STEPS; k++) {
      const c: number = b - ratio * (b - a);
      const d: number = a + ratio * (b - a);
      if (lowest(hips, c, margin, true) < lowest(hips, d, margin, true)) a = c;
      else b = d;
    }
    return (a + b) / 2;
  }

  /** The lowest of the hinds' highest root translations at a turn; an unreachable hind counts its horizontal excess below its goal when `extended`, else negative infinity. */
  function lowest(
    hips: readonly IHip[],
    angle: number,
    margin: number,
    extended: boolean,
  ): number {
    let low: number = Infinity;
    for (const hip of hips) {
      const at: IAutoMovieVector3 = QuadrupedScapula.glenoid(hip.joint, angle);
      const planar: number = Math.sqrt(
        Math.max(
          0,
          (hip.reach.maximum - margin) ** 2 - (hip.goal.x - at.x) ** 2,
        ),
      );
      const along: number = Math.abs(hip.goal.z - at.z);
      const bound: number =
        along <= planar
          ? hip.goal.y - at.y + Math.sqrt(planar * planar - along * along)
          : extended
            ? hip.goal.y - at.y - (along - planar)
            : -Infinity;
      low = Math.min(low, bound);
    }
    return low;
  }
}
