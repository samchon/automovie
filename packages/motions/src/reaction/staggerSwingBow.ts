import { Vector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

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
 * @evidence contracts/development/implementation.md#efficient-algorithms Each candidate still fits one swinging leg per instant, including the original second full widest sweep on a refused side. Standing legs, fixed pelvis/hip posing, rest-knee origins and swing shares prepare once. Existing clearance preparation lazily shares each fixed standing leg's capsule axes and only originally demanded collider placements, retaining all moving geometry and ordered pair/probe tests. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed sample body/side/pelvis/hip establish leg preparation; unchanged root/yaw establish only authored rest-knee origins. Each originally once-fitted standing leg also fixes that sample's collision geometry. Current heading still makes the actual hint, and every ankle/bend/rotation reaches its original cold remembered fit, with no moving answer or continuation seed reused.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous search owns O(k) sample geometry/readers and scalar bisection state for k instants; per-sample standing collider preparation grows only to its fixed four bones and ends on return/failure. Private rest-knee points feed fresh hints, while no dynamic FK/ROM loan, moving target history or fitted answer survives the returned scalar.
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
    share: number;
    pelvis: IAutoMovieQuaternion;
    fit: ReturnType<typeof HumanLegChain.prepareSeeded>;
    pose: ReturnType<typeof HumanLegChain.prepare>;
    knees: Record<"left" | "right", IAutoMovieVector3>;
  };
  const observed: IObserved[] = instants.map(
    (instant: (typeof instants)[number]): IObserved => {
      const pelvis: IAutoMovieQuaternion = instant.settled.pelvis ??
        resolveHumanPosture.heading({ yaw: instant.settled.yaw, pitch: 0, roll: 0 });

      // Bow changes the moving ankle, never this observation's root or yaw.
      const kneeAt: (side: "left" | "right") => IAutoMovieVector3 = (
        side: "left" | "right",
      ): IAutoMovieVector3 =>
        HumanFrame.point(
          { origin: instant.settled.root, yaw: instant.settled.yaw },
          body.rest.get(`${side}LowerLeg`)!,
        );
      return {
        ...instant,
        share: (instant.seconds - step.start) / (step.land - step.start),
        pelvis,
        fit: HumanLegChain.prepareSeeded(body, step.side, pelvis, instant.settled.hips[step.side]),
        pose: HumanLegChain.prepare(body, step.side, pelvis, instant.settled.hips[step.side]),
        knees: {
          left: kneeAt("left"),
          right: kneeAt("right"),
        },
      };
    },
  );

  // Each leg as the posture's own fit poses it there (`HumanLegChain`),
  // its knee bent toward the hint the posture gives it.
  const legOf: (side: "left" | "right", instant: IObserved, foot: walkFoot.IEnd) => walkLegClearance.ILeg = (
    side: "left" | "right",
    instant: IObserved,
    foot: walkFoot.IEnd,
  ): walkLegClearance.ILeg => {
    const { settled, pelvis }: IObserved = instant;
    const bend: IAutoMovieVector3 = staggerKnots.kneePole(
      body,
      settled.root,
      settled.yaw,
      side,
      HumanFoot.heading(foot.rotation),
      instant.knees[side],
    );
    const swivel: HumanLegChain.ISwivel = side === step.side
      ? instant.fit(foot.ankle, bend, foot.rotation).swivel
      : HumanLegChain.fit(body, side, pelvis, settled.hips[side], foot.ankle, bend, foot.rotation);
    const posed: HumanLegChain.IPosed | null = side !== step.side
      ? HumanLegChain.pose(
        body,
        side,
        pelvis,
        settled.hips[side],
        foot.ankle,
        swivel,
      )
      : instant.pose(foot.ankle, swivel);
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
  const clearances: ReturnType<typeof walkLegClearance.prepareAgainst>[] = standingLegs.map(
    (standing: walkLegClearance.ILeg): ReturnType<typeof walkLegClearance.prepareAgainst> =>
      walkLegClearance.prepareAgainst(body, standing),
  );
  const worst: (bow: number) => number = (bow: number): number => {
    let out: number = 0;
    for (const [i, instant] of observed.entries()) {
      const { seconds, settled, share }: IObserved = instant;
      const reached: walkFoot.IEnd = reach(
        settled,
        swing(seconds, bow),
        share,
      );
      out = Math.max(
        out,
        clearances[i]!(legOf(step.side, instant, reached)),
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
      if (worst(way * widest) > walkLegClearance.BOUND)
        return { way, bow: Infinity, at: worst(way * widest) };
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
