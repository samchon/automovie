import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeQuadrupedLimb } from "../AutoMovieArchetypeQuadrupedLimb";
import { QuadrupedScapula } from "./QuadrupedScapula";

/*
 * Halvings of a search over the pelvis's turn: far below a micro-radian over
 * its range.
 */
const STEPS: number = 60;

/*
 * The pelvis turning in the sagittal plane at the lumbosacral joint, carrying
 * both hip joints fore and aft so the hind limbs follow a planted hoof's reach,
 * as the shoulder blade does for a fore (`QuadrupedScapula`).
 *
 * The pelvis is the rig's hindquarters bar, from which both femurs hang; its
 * origin, where it joins the trunk, stands for the lumbosacral joint, so the
 * lever from the joint to each hip is the rig's own (no measured
 * lumbosacral-to-hip distance was found; the identification is provisional). At
 * rest the pelvis is unturned, so every rest pose stays as it was. Both hips
 * turn together, so the two hinds bound the root jointly: the highest root at
 * which one turn within half the pelvis's range either way lets both reach
 * (`high`), and at the chosen root the turn nearest rest that does (`turn`).
 */
export namespace QuadrupedPelvis {
  /*
   * The bone that turns: the hindquarters bar, the femurs' parent.
   */
  export const BONE = "hindquarters" as const;

  /*
   * The pelvis's flexion-extension range during locomotion, degrees: 8.2 (Back
   * et al. 1996, as `AutoMovieArchetypeEquineGait.FOLLOW` cites).
   */
  export const RANGE: number = 8.2;

  /*
   * One hind's hip and the root constraint it must meet.
   */
  export interface IHip {
    /*
     * The lumbosacral joint and this hip at rest.
     */
    joint: QuadrupedScapula.IJoint;

    /*
     * The hind's ankle goal.
     */
    goal: IAutoMovieVector3;

    /*
     * The hind's radial reach.
     */
    reach: AutoMovieArchetypeQuadrupedLimb.IRange;
  }

  /*
   * The highest root translation at which one turn of the pelvis within range
   * lets every hind reach its goal.
   * Parameter hips: Each hind's hip and constraint.
   * Returns: The bound, metres; negative infinity when no turn lets them all
   * reach.
   */
  export function high(hips: readonly IHip[]): number {
    const best: number = search(hips, 0);
    return lowest(hips, best, 0, false);
  }

  /*
   * The turn nearest rest at which every hind reaches its goal at a root
   * translation.
   * Parameter hips: Each hind's hip and constraint.
   * Parameter height: The chosen root translation, metres.
   * Parameter margin: The coordinate roundoff budget, metres: each hip is aimed
   * this far inside its reach so the exact limb solve admits it.
   * Returns: The turn, radians, right-handed about +X; zero when the rest hips
   * reach; the best turn when none lets all reach, which the limb solve then
   * refuses.
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

  /*
   * The turn maximising the hinds' joint bound, by golden-section search over
   * the range.
   */
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

  /*
   * The lowest of the hinds' highest root translations at a turn; an
   * unreachable hind counts its horizontal excess below its goal when
   * `extended`, else negative infinity.
   */
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
