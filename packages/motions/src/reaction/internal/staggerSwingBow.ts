import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { minimizeHumanBrent } from "../../posture/internal/minimizeHumanBrent";
import type { staggerRecover } from "./staggerRecover";

/**
 * The lateral bow that keeps a stagger's swinging foot clear of its standing
 * foot: the swing's prepared walking-foot curve is read inside the swing at no
 * bow, and wherever the swinging sole's outline runs alongside the standing
 * sole's (their extents along the swing overlap), the bow is the least that
 * carries the swinging outline past the standing one across the swing, on
 * either side, through the bow's own profile at that share (`16 u^2 (1 - u)^2`,
 * the bump the displayed swing applies), the largest over the swing found by
 * Brent's method (Brent 1973, ch. 5). The side needing the smaller bow is
 * taken, no wider than two sole lengths; a swing whose outline already clears
 * the standing one on a side bows not at all. The soles' outlines are the
 * body's own (`HumanFoot.sole`), so the clearance scales with the feet, and the
 * bow is fixed for the whole swing, so the foot leaves and joins its stances
 * where they stand.
 *
 * @param body The body.
 * @param step The recovery step.
 * @param standing The standing foot's placement through the swing.
 * @param normal The horizontal unit the bow displaces the swinging ankle along,
 *   the swing's travel turned a quarter turn.
 * @param swing The swinging foot at a second and a bow, metres, as displayed.
 * @returns The signed bow, metres along `normal`.
 */
export function staggerSwingBow(
  body: IAutoMovieMotionHumanBody,
  step: staggerRecover.IStep,
  standing: IAutoMovieMotionHumanFoot.IPlacement,
  normal: IAutoMovieVector3,
  swing: (
    seconds: number,
    bow: number,
  ) => IAutoMovieMotionHumanWalkFoot.IScheduled,
): number {
  const stance: AutoMovieHumanSide = step.side === "left" ? "right" : "left";
  const fixed: readonly IAutoMovieVector3[] = HumanFoot.sole(
    body,
    stance,
    standing,
  );
  // The least bow on each side over the swing, the largest of each second's
  // need found by Brent's method (`minimizeHumanBrent`) to the display's
  // frame (`STEP`).
  const largest = (side: 0 | 1): number =>
    -minimizeHumanBrent(
      (seconds: number): number => {
        const foot: IAutoMovieMotionHumanWalkFoot.IScheduled = swing(
          seconds,
          0,
        );
        return -staggerSwingBow.need(
          fixed,
          HumanFoot.sole(body, step.side, foot.placement),
          normal,
          foot.swing?.u ?? 0,
        )[side];
      },
      step.start,
      step.land,
      AutoMovieMotionHumanArmCourse.STEP,
    ).value;
  return staggerSwingBow.choose(
    largest(0),
    largest(1),
    2 *
      Vector3.distance(
        HumanFoot.point(body, step.side, "toe", step.from),
        HumanFoot.point(body, step.side, "heel", step.from),
      ),
  );
}

/** The bow's need at a second and its choice of side. */
export namespace staggerSwingBow {
  /**
   * The least bow on each side that carries the swinging outline past the
   * standing one at a swing share: on the positive side the swinging outline's
   * lowest extent along `normal` at the standing one's highest, and on the
   * negative side the other way round, each over the bow's profile there (`16
   * u^2 (1 - u)^2`). Where the outlines do not run alongside (their extents
   * along the swing do not overlap) no bow is needed on either side; at a share
   * with no bow, an outline not yet clear needs an infinite one.
   *
   * @param fixed The standing sole's outline.
   * @param outline The swinging sole's outline at no bow.
   * @param normal The horizontal unit the bow displaces along.
   * @param u The swing's share.
   * @returns The positive and the negative side's bow, metres.
   */
  export function need(
    fixed: readonly IAutoMovieVector3[],
    outline: readonly IAutoMovieVector3[],
    normal: IAutoMovieVector3,
    u: number,
  ): readonly [number, number] {
    const along: IAutoMovieVector3 = { x: normal.z, y: 0, z: -normal.x };
    const [aLo, aHi]: [number, number] = extent(fixed, normal);
    const [bLo, bHi]: [number, number] = extent(fixed, along);
    const [qLo, qHi]: [number, number] = extent(outline, along);
    if (!(qHi > bLo && qLo < bHi)) return [-Infinity, -Infinity];
    const bump: number = 16 * u * u * (1 - u) * (1 - u);
    const [pLo, pHi]: [number, number] = extent(outline, normal);
    return [
      bump > 0 ? (aHi - pLo) / bump : aHi > pLo ? Infinity : 0,
      bump > 0 ? (pHi - aLo) / bump : pHi > aLo ? Infinity : 0,
    ];
  }

  /**
   * The bow taken: the side needing the smaller, no wider than `widest`, and
   * none where either side already clears.
   *
   * @param plus The positive side's least bow.
   * @param minus The negative side's least bow.
   * @param widest The widest bow, metres.
   * @returns The signed bow, metres along `normal`.
   */
  export function choose(plus: number, minus: number, widest: number): number {
    if (plus <= 0 || minus <= 0) return 0;
    return plus <= minus ? Math.min(plus, widest) : -Math.min(minus, widest);
  }
}

/** The outline's extent along a horizontal axis. */
function extent(
  points: readonly IAutoMovieVector3[],
  axis: IAutoMovieVector3,
): [number, number] {
  let lo: number = Infinity;
  let hi: number = -Infinity;
  for (const p of points) {
    const d: number = p.x * axis.x + p.z * axis.z;
    lo = Math.min(lo, d);
    hi = Math.max(hi, d);
  }
  return [lo, hi];
}
