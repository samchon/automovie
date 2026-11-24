import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../compose/AutoMovieMotionHumanArmCourse";
import { HumanFoot } from "../posture/HumanFoot";
import { minimizeHumanBrent } from "../posture/minimizeHumanBrent";
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
  const along: IAutoMovieVector3 = { x: normal.z, y: 0, z: -normal.x };
  const extent: (
    points: readonly IAutoMovieVector3[],
    axis: IAutoMovieVector3,
  ) => [number, number] = (
    points: readonly IAutoMovieVector3[],
    axis: IAutoMovieVector3,
  ): [number, number] => {
    let lo: number = Infinity;
    let hi: number = -Infinity;
    for (const p of points) {
      const d: number = p.x * axis.x + p.z * axis.z;
      lo = Math.min(lo, d);
      hi = Math.max(hi, d);
    }
    return [lo, hi];
  };
  const fixed: readonly IAutoMovieVector3[] = HumanFoot.sole(
    body,
    stance,
    standing,
  );
  const [aLo, aHi]: [number, number] = extent(fixed, normal);
  const [bLo, bHi]: [number, number] = extent(fixed, along);

  // The least bow on each side over the swing alongside the standing sole:
  // past it on the positive side, the swinging outline's lowest extent at
  // the standing one's highest, and on the negative side the other way
  // round, each the largest over the swing, found by Brent's method
  // (`minimizeHumanBrent`) to the display's frame (`STEP`). A second the
  // outlines do not run alongside needs no bow on either side.
  const need = (seconds: number): readonly [number, number] => {
    const foot: IAutoMovieMotionHumanWalkFoot.IScheduled = swing(seconds, 0);
    const outline: IAutoMovieVector3[] = HumanFoot.sole(
      body,
      step.side,
      foot.placement,
    );
    const [qLo, qHi]: [number, number] = extent(outline, along);
    if (!(qHi > bLo && qLo < bHi)) return [-Infinity, -Infinity];
    const u: number = foot.swing?.u ?? 0;
    const bump: number = 16 * u * u * (1 - u) * (1 - u);
    const [pLo, pHi]: [number, number] = extent(outline, normal);
    return [
      bump > 0 ? (aHi - pLo) / bump : aHi > pLo ? Infinity : 0,
      bump > 0 ? (pHi - aLo) / bump : pHi > aLo ? Infinity : 0,
    ];
  };
  const largest = (side: 0 | 1): number =>
    -minimizeHumanBrent(
      (seconds: number): number => -need(seconds)[side],
      step.start,
      step.land,
      AutoMovieMotionHumanArmCourse.STEP,
    ).value;
  const plus: number = largest(0);
  const minus: number = largest(1);
  if (plus <= 0 || minus <= 0) return 0;
  const widest: number =
    2 *
    Vector3.distance(
      HumanFoot.point(body, step.side, "toe", step.from),
      HumanFoot.point(body, step.side, "heel", step.from),
    );
  return plus <= minus ? Math.min(plus, widest) : -Math.min(minus, widest);
}
