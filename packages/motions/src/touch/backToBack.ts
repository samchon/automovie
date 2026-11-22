import { Vector3, resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionClock,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBackToBack,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPlacedAction,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionManner,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { StrikingBody } from "../striking/StrikingBody";
import { kissBody } from "./kissBody";

/** The most a seated trunk leans back, degrees: the normal thoracolumbar extension, 25 degrees (Physiopedia, Range of Motion Normative Values, https://www.physio-pedia.com/Range_of_Motion_Normative_Values), as `headRestAim.SEATED` bounds its side lean. */
const BACK: number = 25;

/** How near the upper back comes to the meeting point, metres (provisional: a skin contact, as `headRest`'s). */
const NEAR: number = 0.01;

/** How far apart the two leans may begin or end, seconds: one 24 Hz frame. */
const TOGETHER: number = 1 / 24;

/**
 * Lean back against a seated partner's back (#4012). Each of the two reads
 * the other's upper back where it is at the start and leans its trunk back
 * from the hips over the seat (the kiss's lean, `kissBody`, seated) by the
 * least pitch that brings its own upper back to the point halfway between
 * the two, so the two leans meet there and neither presses into the other.
 * The trunk's weight leans onto the partner: the window's load is the
 * trunk's share of the body's mass times the tangent of the lean
 * (moments about the hips with the contact taken at the trunk's mass
 * centre, provisional). A standing performer, or a meeting point beyond
 * `BACK`, is refused. Given the partner's own lean (`with`), the two must
 * lean and sit up together within a frame: one that sits up or leaves
 * while the other still leans is refused, naming who would be left
 * leaning on nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the meeting point, the lean, the load, the refusals and the mutual check.
 * @evidence contracts/development/design.md#principled-representation The kiss's seated lean model, the halfway point of the two backs and a loaded back window on the partner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Adds the halfway solve, the load and the mutual check; the lean, the timing and the transport are their owners'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The backs are read on the displayed bodies; nothing presses past the halfway point.
 */
export const backToBack: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanBackToBack> =
  {
    name: "backToBack",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBackToBack>,
    ): IAutoMovieMotionHumanActionPlan => {
      const p: IAutoMovieMotionHumanBackToBack = context.params;
      const body: IAutoMovieMotionHumanBody = context.body;
      HumanBound.above("seconds", p.seconds, 0, "s");
      if (p.partner === context.subject)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "partner",
          value: p.partner,
          reason: "a performer leans on another performer's back",
          fix: "name another performer as the partner",
        });
      if (
        !context.entry.supports.some(
          (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
            s.kind === "seat",
        )
      )
        throw new HumanRefusal({
          kind: "base",
          axis: "base",
          value: context.entry.base.kind,
          feasible: { kind: "alternatives", values: ["seated"] },
          reason: "two people lean back to back from sitting",
          fix: "sit down back to back first",
        });
      const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
      const stance: IAutoMovieMotionHumanRise.Stance = {
        left: {
          ankle: context.entry.feet.left.ankle,
          rotation: context.entry.feet.left.rotation,
        },
        right: {
          ankle: context.entry.feet.right.ankle,
          rotation: context.entry.feet.right.rotation,
        },
      };
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      const own: ReturnType<typeof HumanTrunk.preparePoint> =
        HumanTrunk.preparePoint(body, "upperBack");
      const leaned = (pitch: number): IAutoMovieMotionHumanPosture =>
        kissBody(body, entry, stance, { pitch, roll: 0, raise: 0 }, 1, true);
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = context
        .performer(p.partner)
        .bones(context.start);
      const theirs: IAutoMovieVector3 = StrikingBody.region(
        context.performer(p.partner).body,
        bones,
        "upperBack",
      ).point;
      const mine: IAutoMovieVector3 = own(entry, resolution);
      const meet: IAutoMovieVector3 = Vector3.lerp(mine, theirs, 0.5);
      const toward: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(theirs, mine),
      );
      const gap = (pitch: number): number =>
        Vector3.dot(
          Vector3.subtract(meet, own(leaned(pitch), resolution)),
          toward,
        );

      // The least backward lean that reaches the halfway point.
      if (gap(-BACK) > NEAR)
        throw new HumanRefusal({
          kind: "reach",
          axis: "partner",
          value: p.partner,
          feasible: {
            kind: "range",
            minimum: null,
            maximum: BACK,
            unit: "deg",
          },
          reason: `the upper back stays ${(gap(-BACK) * 1000).toFixed(0)} mm short of the halfway point at a ${BACK} degree lean`,
          fix: "sit nearer back to back",
        });
      let lo: number = 0;
      let hi: number = -BACK;
      for (let i: number = 0; i < 30; ++i) {
        const mid: number = (lo + hi) / 2;
        if (gap(mid) > 0) lo = mid;
        else hi = mid;
      }
      const pitch: number = gap(0) <= 0 ? 0 : hi;

      const modifiers: IAutoMovieMotionManner.IModifiers =
        AutoMovieMotionManner.of(context, p.manner);
      const approach: number = AutoMovieMotionHumanTiming.transport(
        Vector3.distance(mine, meet),
      );
      const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
        AutoMovieMotionClock.phrase({
          prepare: approach,
          attack: 0,
          hold: p.seconds,
          retract: approach,
        }),
        modifiers,
      );
      const duration: number = clock.duration;

      // Leaning and sitting up together with the partner's own lean.
      if (p.with !== undefined) {
        const other: IAutoMovieMotionHumanPlacedAction = context.action(p.with);
        const at = (name: string): number =>
          other.start +
          other.plan.duration *
            (other.plan.events.find(
              (e: IAutoMovieMotionEvent): boolean => e.name === name,
            )?.share ?? 1);
        const mineReady: number = context.start + clock.at("ready");
        const mineRelax: number = context.start + clock.at("relax");
        if (
          at("relax") < mineRelax - TOGETHER ||
          at("ready") > mineReady + TOGETHER
        )
          throw new HumanRefusal({
            kind: "parameter",
            axis: "with",
            value: p.with,
            reason: `the partner's back bears from ${at("ready").toFixed(2)} s to ${at("relax").toFixed(2)} s, but this lean bears on it from ${mineReady.toFixed(2)} s to ${mineRelax.toFixed(2)} s, so it would lean on nothing`,
            fix: "lean and sit up together with the partner",
          });
        if (mineRelax < at("relax") - TOGETHER)
          throw new HumanRefusal({
            kind: "parameter",
            axis: "seconds",
            value: p.seconds,
            reason: `this back is withdrawn at ${mineRelax.toFixed(2)} s while the partner still leans on it until ${at("relax").toFixed(2)} s`,
            fix: "hold the lean as long as the partner's",
          });
      }

      const share = (seconds: number): number =>
        clock.envelope(["start", "ready"], ["relax", "end"], seconds);
      const plan: IAutoMovieMotionHumanActionPlan =
        composeAutoMovieMotionHumanAction({
          base: AutoMovieMotionHumanBase.under(context, duration),
          clock,
          primitives: [
            {
              channels: ["root", "trunk"],
              from: 0,
              to: duration,
              write: (
                posture: IAutoMovieMotionHumanPosture,
                seconds: number,
              ): IAutoMovieMotionHumanPosture =>
                kissBody(
                  body,
                  posture,
                  stance,
                  { pitch, roll: 0, raise: 0 },
                  share(seconds),
                  true,
                ),
            },
          ],
          contact: "stroke",
        });
      return {
        ...plan,
        events: [
          ...plan.events,
          { name: "lean", share: clock.at("ready") / duration },
          { name: "part", share: clock.at("relax") / duration },
        ],
        contacts: [
          ...plan.contacts,
          {
            part: "back",
            kind: "bear",
            region: "upperBack",
            load: load(body, pitch),
            from: clock.at("ready") / duration,
            to: clock.at("relax") / duration,
            support: {
              kind: "person",
              subject: p.partner,
              region: "upperBack",
            },
          },
        ],
      };
    },
  };

/** The share of the body's weight the leaning trunk lays on the partner: the trunk's mass share times the tangent of the lean. */
function load(body: IAutoMovieMotionHumanBody, pitch: number): number {
  const model: IAutoMovieResolveCenterOfMass.IModel =
    resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
  const upper: ReadonlySet<string> = new Set([
    "spine",
    "chest",
    "upperChest",
    "neck",
    "head",
  ]);
  const trunk: number = model.segments
    .filter((s: IAutoMovieResolveCenterOfMass.ISegment): boolean =>
      upper.has(s.bone),
    )
    .reduce(
      (sum: number, s: IAutoMovieResolveCenterOfMass.ISegment): number =>
        sum + s.mass,
      0,
    );
  return Math.min(
    1,
    (trunk / model.mass) * Math.tan((Math.abs(pitch) * Math.PI) / 180),
  );
}
