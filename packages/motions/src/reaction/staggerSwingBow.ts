import { Vector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";

import { walkLegClearance } from "../actions/walkLegClearance";
import type { walkFoot } from "../actions/walkFoot";
import { walkReach } from "../actions/walkReach";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanLegChain } from "../posture/HumanLegChain";
import { HumanFrame } from "../posture/HumanFrame";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { IHumanBody } from "../body/IHumanBody";
import type { staggerRecover } from "./staggerRecover";
import { staggerKnots } from "./staggerKnots";

/**
 * The original sampled and bisected lateral bow that keeps a stagger swing
 * clear of its standing leg. Every supplied instant has its already settled
 * pelvis; only the swinging foot target changes across candidate bows.
 *
 * @param body The performer with unchanged anatomy during this search.
 * @param step The recovery step and its fixed endpoint schedule.
 * @param instants The original course-knot observations strictly inside its swing.
 * @param swing The same walking-foot reader at a second and lateral bow metres.
 * @returns The original winning signed bow, metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed anatomy/instant frames, the varying target reader, metres and original clearance search.
 * @evidence contracts/development/implementation.md#principled-implementation Keeps the actual leg-fit knee, original tangle bound, two sole-length maximum bow and millimetre bisection on both sides, retaining original feasible/tie decisions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed observed frames prepare per-instant leg posing; one worst-clearance reader serves the original two-sided bisection.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every sampled instant, original fit, reach adjustment, bound, bisection width and signed winner; no candidate or leg fit is replaced by a cached answer.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each candidate still fits one swinging leg per instant. The standing leg fits once per instant, fixed pelvis/hip posing is prepared once per instant, and each widest-side result is read once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each prepared swinging-leg poser fixes its own actual sample body, side, pelvis and hip; changing target/branch/swivel still runs the original target-specific solve and posing math.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous search retains O(k) sample poses/readers for k supplied instants and scalar bisection state, released on return or failure; only the returned scalar survives.
 */
export function staggerSwingBow(
  body: IHumanBody,
  step: staggerRecover.IStep,
  instants: readonly { seconds: number; settled: walkReach.IGround }[],
  swing: (seconds: number, bow: number) => walkFoot.IScheduled,
): number {
  const stance: "left" | "right" = step.side === "left" ? "right" : "left";
  const reach: ReturnType<typeof walkReach.prepareSwing> = walkReach.prepareSwing(body, step.side);

  /** One fixed observed pelvis and its reusable swinging-leg source frame. */
  type IObserved = (typeof instants)[number] & {
    pelvis: IAutoMovieQuaternion;
    pose: ReturnType<typeof HumanLegChain.prepare>;
    knees: Record<"left" | "right", ReturnType<typeof HumanFrame.preparePoint>>;
  };
  const observed: IObserved[] = instants.map(
    (instant: (typeof instants)[number]): IObserved => {
      const pelvis: IAutoMovieQuaternion = instant.settled.pelvis ??
        resolveHumanPosture.heading({ yaw: instant.settled.yaw, pitch: 0, roll: 0 });
      return {
        ...instant,
        pelvis,
        pose: HumanLegChain.prepare(body, step.side, pelvis, instant.settled.hips[step.side]),
        knees: {
          left: HumanFrame.preparePoint(instant.settled.yaw, body.rest.get("leftLowerLeg")!),
          right: HumanFrame.preparePoint(instant.settled.yaw, body.rest.get("rightLowerLeg")!),
        },
      };
    },
  );

  // Each leg as the posture's own fit poses it there (`HumanLegChain`),
  // its knee bent toward the hint the posture gives it.
  const legOf: (side: "left" | "right", instant: IObserved, foot: walkFoot.IEnd, pose?: ReturnType<typeof HumanLegChain.prepare>) => walkLegClearance.ILeg = (
    side: "left" | "right",
    instant: IObserved,
    foot: walkFoot.IEnd,
    pose?: ReturnType<typeof HumanLegChain.prepare>,
  ): walkLegClearance.ILeg => {
    const { settled, pelvis }: IObserved = instant;
    const swivel: HumanLegChain.ISwivel = HumanLegChain.fit(
      body,
      side,
      pelvis,
      settled.hips[side],
      foot.ankle,
      staggerKnots.kneePole(
        body,
        settled.root,
        settled.yaw,
        side,
        HumanFoot.heading(foot.rotation),
        instant.knees[side],
      ),
      foot.rotation,
    );
    const posed: HumanLegChain.IPosed | null = pose === undefined
      ? HumanLegChain.pose(
        body,
        side,
        pelvis,
        settled.hips[side],
        foot.ankle,
        swivel,
      )
      : pose(foot.ankle, swivel);
    return {
      ...posed!,
      side,
      rotation: foot.rotation,
    };
  };
  // The standing leg's fit is read once a knot.
  const standingLegs: walkLegClearance.ILeg[] = observed.map((instant: IObserved): walkLegClearance.ILeg =>
    legOf(stance, instant, instant.settled.feet[stance]),
  );
  const worst: (bow: number) => number = (bow: number): number => {
    let out: number = 0;
    for (const [i, instant] of observed.entries()) {
      const { seconds, settled }: IObserved = instant;
      const reached: walkFoot.IEnd = reach(
        settled,
        swing(seconds, bow),
        (seconds - step.start) / (step.land - step.start),
      );
      out = Math.max(
        out,
        walkLegClearance.excess(
          body,
          legOf(step.side, instant, reached, instant.pose),
          standingLegs[i]!,
        ),
      );
    }
    return out;
  };
  let bow: number = 0;
  if (worst(0) > walkLegClearance.BOUND) {
    const widest: number =
      2 *
      Vector3.distance(
        HumanFoot.point(body, step.side, "toe", step.from),
        HumanFoot.point(body, step.side, "heel", step.from),
      );
    /** One side's original feasible width or its maximum-width excess. */
    type IBow = { way: number; bow: number; at: number };
    const sides: IBow[] = [1, -1].map((way: number): IBow => {
      const edge: number = worst(way * widest);
      if (edge > walkLegClearance.BOUND)
        return { way, bow: Infinity, at: edge };
      let lo: number = 0;
      let hi: number = widest;
      while (hi - lo > 0.001) {
        const mid: number = (lo + hi) / 2;
        if (worst(way * mid) > walkLegClearance.BOUND) lo = mid;
        else hi = mid;
      }
      return { way, bow: hi, at: 0 };
    });
    const pick: IBow = sides.reduce((a: IBow, b: IBow): IBow =>
      a.bow < b.bow || (a.bow === b.bow && a.at <= b.at) ? a : b,
    );
    bow = pick.way * (Number.isFinite(pick.bow) ? pick.bow : widest);
  }
  return bow;
}
