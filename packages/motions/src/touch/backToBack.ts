import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionClock,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBackToBack,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPlacedAction,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionManner,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanMaterialContact } from "../posture/HumanMaterialContact";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { StrikingBody } from "../striking/StrikingBody";
import { backToBackLoad } from "./backToBackLoad";
import { backToBackTogether } from "./backToBackTogether";
import { kissBody } from "./kissBody";

/**
 * The most a seated trunk leans back, degrees: the normal thoracolumbar
 * extension, 25 degrees (Physiopedia, Range of Motion Normative Values,
 * https://www.physio-pedia.com/Range_of_Motion_Normative_Values), as
 * `headRestAim.SEATED` bounds its side lean.
 */
const BACK: number = 25;

/**
 * How near the upper back comes to the meeting point, metres (provisional: a
 * skin contact, as `headRest`'s).
 */
const NEAR: number = 0.01;
/** The alternatives of `PlanAddedBone`'s site. */
type PlanAddedBone = "neck" | "head";

/**
 * Lean back against a seated partner's back. Each of the two reads its own and
 * the other's upper back on the displayed bodies at the start and leans its
 * trunk back from the hips over the seat (the kiss's lean, `kissBody`, seated)
 * by the least pitch that moves its own upper back (by the lean model's change
 * from upright) to half a skin contact short of the upright plane halfway
 * between the two across the floor, each back at its own height, so the two
 * backs rest a skin contact apart and neither presses into the other; the neck
 * flexes by the lean so the head stays upright and does not pass that plane
 * first. The trunk's weight leans onto the partner: the window's load is the
 * trunk's share of the body's mass times the tangent of the lean (moments about
 * the hips with the contact taken at the trunk's mass centre, provisional). A
 * standing performer, or a meeting point beyond `BACK`, is refused. Given the
 * partner's own lean (`with`), the two must lean and sit up together within a
 * frame: one that sits up or leaves while the other still leans is refused,
 * naming who would be left leaning on nothing.
 */
function planBackToBack(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBackToBack>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanBackToBack = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  HumanBound.above("hold", p.hold, 0, "s");
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
  // Both backs on the displayed bodies at the start, the same reading for
  // both; the lean's own model gives only how far the back moves.
  const upright: IAutoMovieVector3 = own(entry, resolution);
  const mine: IAutoMovieVector3 = StrikingBody.region(
    body,
    context.performer(context.subject).bones(context.start),
    "upperBack",
  ).point;
  // The backs meet on the upright plane halfway between them across the
  // floor: each back stays at its own height (two bodies of unequal
  // stature carry their upper backs at unequal heights), so only the
  // horizontal reach toward the partner counts, never the height
  // between the two backs, which no lean closes.
  const across: IAutoMovieVector3 = {
    x: theirs.x - mine.x,
    y: 0,
    z: theirs.z - mine.z,
  };
  const half: number = Vector3.length(across) / 2;
  const meet: IAutoMovieVector3 = Vector3.add(mine, Vector3.scale(across, 0.5));
  const toward: IAutoMovieVector3 = Vector3.normalize(across);
  const gap = (pitch: number): number =>
    Vector3.dot(
      Vector3.subtract(
        meet,
        Vector3.add(
          mine,
          Vector3.subtract(own(leaned(pitch), resolution), upright),
        ),
      ),
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
      reason: `the upper back stays ${(gap(-BACK) * 1000).toFixed(0)} mm short of the halfway point at a ${BACK} degree lean, the point ${(half * 1000).toFixed(0)} mm off the upright back across the floor`,
      fix: "sit nearer back to back",
    });
  // Each back stops half a skin contact short of the plane, so the two
  // rest a skin contact apart: backs of unequal heights meet obliquely,
  // and reaching the plane itself pressed one trunk into the other.
  const short: number = NEAR / 2;
  let lo: number = 0;
  let hi: number = -BACK;
  for (let i: number = 0; i < 30; ++i) {
    const mid: number = (lo + hi) / 2;
    if (gap(mid) > short) lo = mid;
    else hi = mid;
  }
  const pitch: number = gap(0) <= short ? 0 : hi;

  const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
    context,
    p.manner,
  );
  const approach: number = AutoMovieMotionHumanTiming.transport(
    Vector3.distance(mine, meet),
  );
  const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
    AutoMovieMotionClock.phrase({
      prepare: approach,
      attack: 0,
      hold: p.hold,
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
    backToBackTogether(
      {
        ready: context.start + clock.at("ready"),
        relax: context.start + clock.at("relax"),
      },
      { ready: at("ready"), relax: at("relax") },
      p.with,
      p.hold,
    );
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
        // The head stays upright over the leaning trunk, the neck flexing
        // forward by the lean: leaning back, the head held with the trunk
        // passes the plane the two backs meet on before the backs do, so
        // two heads of a height met behind them.
        {
          channels: ["head"],
          from: 0,
          to: duration,
          write: (
            posture: IAutoMovieMotionHumanPosture,
            seconds: number,
          ): IAutoMovieMotionHumanPosture => {
            const upright: IAutoMovieMotionHumanJoints.Angles =
              AutoMovieMotionHumanHead.share(0, -pitch * share(seconds));
            const added = (
              bone: PlanAddedBone,
            ): readonly [number, number, number] => {
              const held: readonly [number, number, number] = posture.joints[
                bone
              ] ?? [0, 0, 0];
              return [held[0] + upright[bone]![0], held[1], held[2]];
            };
            return {
              ...posture,
              joints: {
                ...posture.joints,
                neck: added("neck"),
                head: added("head"),
              },
            };
          },
        },
      ],
      contact: "stroke",
    });
  const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
    p.partner,
  );
  const ownBone: AutoMovieHumanoidBone = body.surfaces.regions.upperBack.bone;
  const otherBone: AutoMovieHumanoidBone =
    partner.body.surfaces.regions.upperBack.bone;
  const otherBones: ReadonlySet<AutoMovieHumanoidBone> = new Set([otherBone]);
  const ownBones: ReturnType<typeof HumanTrunk.prepareResolve> =
    HumanTrunk.prepareResolve(body, new Set([ownBone]));
  const paired: ReturnType<typeof HumanMaterialContact.preparePair> =
    HumanMaterialContact.preparePair(body, ownBone, partner.body, otherBone);
  const result: IAutoMovieMotionHumanActionPlan = {
    ...plan,
    events: [
      ...plan.events,
      { name: "lean", share: clock.at("ready") / duration },
      { name: "part", share: clock.at("relax") / duration },
    ],
    prepare: (): void => {
      plan.prepare?.();
      const ready: number = clock.at("ready");
      const relax: number = clock.at("relax");
      const bearing = (
        seconds: number,
      ): IAutoMovieMotionHumanContactWindow.IMaterial | undefined => {
        const a: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = ownBones(
          plan.posture(seconds),
          resolution,
        );
        const b: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          partner.bones(context.start + seconds, otherBones);
        return paired(
          a,
          b,
          StrikingBody.region(body, a, "upperBack").normal,
          StrikingBody.region(partner.body, b, "upperBack").normal,
          NEAR,
        )?.first;
      };
      const material: IAutoMovieMotionHumanContactWindow.IMaterial | undefined =
        bearing(ready);
      result.contacts =
        material === undefined ||
        bearing((ready + relax) / 2) === undefined ||
        bearing(relax) === undefined
          ? [...plan.contacts]
          : [
              ...plan.contacts,
              {
                part: "back",
                kind: "bear",
                region: "upperBack",
                load: backToBackLoad(body, pitch),
                from: ready / duration,
                to: relax / duration,
                support: {
                  kind: "person",
                  subject: p.partner,
                  region: "upperBack",
                },
                material,
              },
            ];
    },
  };
  return result;
}

/**
 * Lean back against a seated partner's back. Each of the two reads its own and
 * the other's upper back on the displayed bodies at the start and leans its
 * trunk back from the hips over the seat (the kiss's lean, `kissBody`, seated)
 * by the least pitch that moves its own upper back (by the lean model's change
 * from upright) to half a skin contact short of the upright plane halfway
 * between the two across the floor, each back at its own height, so the two
 * backs rest a skin contact apart and neither presses into the other; the neck
 * flexes by the lean so the head stays upright and does not pass that plane
 * first. The trunk's weight leans onto the partner: the window's load is the
 * trunk's share of the body's mass times the tangent of the lean (moments about
 * the hips with the contact taken at the trunk's mass centre, provisional). A
 * standing performer, or a meeting point beyond `BACK`, is refused. Given the
 * partner's own lean (`with`), the two must lean and sit up together within a
 * frame: one that sits up or leaves while the other still leans is refused,
 * naming who would be left leaning on nothing.
 */
export const backToBack: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanBackToBack> =
  {
    name: "backToBack",
    interrupts: {},
    plan: planBackToBack,
  };
