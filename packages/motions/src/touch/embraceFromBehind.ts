import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEmbraceFromBehind,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionHumanStrikingBody,
  IAutoMovieMotionManner,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPhrase } from "../compose/AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { StrikingBody } from "../striking/StrikingBody";
import { kissBody } from "./kissBody";
import { kissPose } from "./kissPose";

/** The miss under which a region rests on another, metres (provisional: a skin contact, as `headRest`'s). */
const NEAR: number = 0.01;

/** The share of the body's weight the leaning chest lays on the partner's back (provisional: a light lean). */
const LEAN: number = 0.1;

/** The lean's forward range searched, degrees: the kiss's own. */
const PITCH: readonly [number, number] = [-10, 45];

/** The neck's flexion range searched, degrees: the kiss's own. */
const FLEXION: readonly [number, number] = [-30, 45];

/** The side bend's range searched, degrees: `headRestAim.TILT`. */
const TILT: number = 40;

/** The neck's two bones a resting head bends over. */
type NeckBone = "neck" | "head";

/** One solved embrace: the lean's pitch, and the neck's flexion and side bend. */
interface ISolved {
  /** The forward lean from the hips, degrees. */
  pitch: number;

  /** The neck's flexion, degrees. */
  flexion: number;

  /** The side bend over the neck and head, degrees. */
  tilt: number;

  /** The chin's distance from the shoulder at the solution, metres. */
  miss: number;
}

/**
 * Embrace a partner from behind (#4012). The lean from the hips is solved
 * first, the least forward pitch that lays the chest's sternum region on
 * the partner's upper back (the kiss's lean model, `kissBody`, on planted
 * feet); then the neck's flexion and side bend that bring the chin nearest
 * the partner's shoulder region, on a coarse grid refined by degrees. A
 * chest already in the partner's back, a back the lean cannot reach, or a
 * chin left farther than `NEAR` from the shoulder is refused with the gap or
 * the miss. The hands go palm in onto the partner's abdomen, one each side
 * of its midline, the fingers toward it, and both arms are laid as one
 * course (`courseArmGoal`). Everything is read where the partner stands at
 * the start. Loaded windows: the chest on the upper back (`LEAN`), the chin
 * on the shoulder, the palms on the abdomen.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two solves, the refusals, the hands, the course and the windows.
 * @evidence contracts/development/design.md#principled-representation The kiss's lean model with a chest contact, a chin aim and two hand places on the partner's regions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Adds the chest solve, the chin solve and the hand places; the lean, the head shares, the phrase, the transport and the course are their owners'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is a region on the displayed partner; nothing presses past the skin.
 */
export const embraceFromBehind: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanEmbraceFromBehind> =
  {
    name: "embraceFromBehind",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanEmbraceFromBehind>,
    ): IAutoMovieMotionHumanActionPlan => {
      const p: IAutoMovieMotionHumanEmbraceFromBehind = context.params;
      const body: IAutoMovieMotionHumanBody = context.body;
      HumanBound.above("seconds", p.seconds, 0, "s");
      if (p.partner === context.subject)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "partner",
          value: p.partner,
          reason: "a performer embraces another performer",
          fix: "name another performer as the partner",
        });
      const shoulder: AutoMovieHumanoidRegion =
        (p.shoulder ?? "left") === "left" ? "shoulderLeft" : "shoulderRight";
      const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
        p.partner,
      );
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        partner.bones(context.start);
      const back: IAutoMovieMotionHumanStrikingBody.IRegionResult =
        StrikingBody.region(partner.body, bones, "upperBack");
      const rest: IAutoMovieVector3 = StrikingBody.region(
        partner.body,
        bones,
        shoulder,
      ).point;
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
      const solved: ISolved = solve(body, entry, stance, back, rest, p.partner);

      // The palms on the abdomen, one each side of the midline, the fingers toward it.
      const belly: IAutoMovieMotionHumanStrikingBody.IRegionResult =
        StrikingBody.region(partner.body, bones, "abdomen");
      const leftward: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(
          StrikingBody.region(partner.body, bones, "hipLeft").point,
          StrikingBody.region(partner.body, bones, "hipRight").point,
        ),
      );
      const place = (
        side: AutoMovieHumanSide,
      ): IAutoMovieMotionHumanArmTarget.ITarget => {
        const out: IAutoMovieVector3 = Vector3.scale(
          leftward,
          side === "left" ? 1 : -1,
        );
        return AutoMovieMotionHumanArmTarget.prepareTarget(
          body,
          side,
          "palm",
          "flat",
        )({
          point: Vector3.add(
            belly.point,
            Vector3.scale(out, body.measure.hand / 2),
          ),
          rotation: HumanHand.align(
            HumanHand.offset(body, side, "palm", "flat"),
            {
              normal: Vector3.scale(belly.normal, -1),
              forward: Vector3.scale(out, -1),
            },
          ),
          bend: AutoMovieMotionHumanBend.hang(body, entry, side, 0.2),
        });
      };

      const chin = (): IAutoMovieVector3 =>
        HumanTrunk.region(body, entry, "chin").point;
      const modifiers: IAutoMovieMotionManner.IModifiers =
        AutoMovieMotionManner.of(context, p.manner);
      const approach: number = AutoMovieMotionHumanTiming.transport(
        Vector3.distance(chin(), rest),
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
      const share = (seconds: number): number =>
        clock.envelope(["start", "ready"], ["relax", "end"], seconds);
      const duration: number = clock.duration;
      const pose: ReturnType<typeof poseBones> = poseBones(
        body,
        context.entry.pose,
      );
      const frame: IAutoMovieMotionHumanFrame = {
        origin: entry.root,
        yaw: entry.yaw,
      };
      const arm = (
        side: AutoMovieHumanSide,
      ): IAutoMovieMotionHumanPrimitive => {
        const target: IAutoMovieMotionHumanArmTarget.ITarget = place(side);
        return {
          ...AutoMovieMotionHumanArmPhrase.visit({
            body,
            clock,
            side,
            origin: AutoMovieMotionHumanArmTarget.origin(
              body,
              pose,
              frame,
              side,
              "palm",
            ),
            target: (): IAutoMovieMotionHumanArmTarget.ITarget => target,
          }),
          reads: ["root", `${side}Arm`, `${side}Hand`],
        };
      };
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
                  { pitch: solved.pitch, roll: 0, raise: 0 },
                  share(seconds),
                  false,
                ),
            },
            {
              channels: ["head"],
              from: 0,
              to: duration,
              write: (
                posture: IAutoMovieMotionHumanPosture,
                seconds: number,
              ): IAutoMovieMotionHumanPosture =>
                neck(posture, solved, share(seconds)),
            },
            arm("left"),
            arm("right"),
          ],
          contact: "stroke",
        });
      const coursed: IAutoMovieMotionHumanActionPlan = courseArmGoal({
        body,
        plan,
        side: "left",
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, "left"),
        span: {
          start: 0,
          ready: clock.at("ready"),
          relax: clock.at("relax"),
          end: duration,
        },
        with: [
          {
            side: "right",
            rest: AutoMovieMotionHumanArm.angles(context.entry.pose, "right"),
          },
        ],
      });
      const from: number = clock.at("ready") / duration;
      const to: number = clock.at("relax") / duration;
      return {
        ...coursed,
        contacts: [
          ...coursed.contacts,
          {
            part: "chest",
            kind: "bear",
            region: "sternum",
            load: LEAN,
            from,
            to,
            support: {
              kind: "person",
              subject: p.partner,
              region: "upperBack",
            },
          },
          {
            part: "head",
            kind: "bear",
            region: "chin",
            from,
            to,
            support: { kind: "person", subject: p.partner, region: shoulder },
          },
          ...(["left", "right"] as const).map(
            (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
              part: side === "left" ? "leftHand" : "rightHand",
              kind: "bear",
              region: side === "left" ? "palmLeft" : "palmRight",
              from,
              to,
              support: {
                kind: "person",
                subject: p.partner,
                region: "abdomen",
              },
            }),
          ),
        ],
      };
    },
  };

/** The neck's flexion and side bend at a share, added over the posture's own. */
function neck(
  posture: IAutoMovieMotionHumanPosture,
  s: ISolved,
  k: number,
): IAutoMovieMotionHumanPosture {
  const flexion: IAutoMovieMotionHumanJoints.Angles =
    AutoMovieMotionHumanHead.share(0, s.flexion * k);
  const bend: IAutoMovieMotionHumanJoints.Angles =
    AutoMovieMotionHumanHead.share(1, s.tilt * k);
  const added = (bone: NeckBone): readonly [number, number, number] => {
    const held: readonly [number, number, number] = posture.joints[bone] ?? [
      0, 0, 0,
    ];
    return [held[0] + flexion[bone]![0], held[1] + bend[bone]![1], held[2]];
  };
  return {
    ...posture,
    joints: { ...posture.joints, neck: added("neck"), head: added("head") },
  };
}

/** The chest's lean onto the back, then the chin onto the shoulder, or the refusal. */
function solve(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  stance: IAutoMovieMotionHumanRise.Stance,
  back: IAutoMovieMotionHumanStrikingBody.IRegionResult,
  rest: IAutoMovieVector3,
  partner: string,
): ISolved {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const leaned: ReturnType<typeof kissPose> = kissPose(
    body,
    entry,
    stance,
    0,
    false,
  );
  const sternum: ReturnType<typeof HumanTrunk.preparePoint> =
    HumanTrunk.preparePoint(body, "sternum");
  const chin: ReturnType<typeof HumanTrunk.preparePoint> =
    HumanTrunk.preparePoint(body, "chin");
  const posed = (s: ISolved): IAutoMovieMotionHumanPosture =>
    neck(leaned({ pitch: s.pitch, roll: 0, flexion: 0, raise: 0 }), s, 1);
  const gap = (pitch: number): number =>
    Vector3.dot(
      Vector3.subtract(
        sternum(posed({ pitch, flexion: 0, tilt: 0, miss: 0 }), resolution),
        back.point,
      ),
      back.normal,
    );

  // The least pitch that lays the chest on the back.
  if (gap(0) < -NEAR)
    throw refusal(
      partner,
      `the chest is ${(-gap(0) * 1000).toFixed(0)} mm into the partner's back standing upright`,
      "stand farther back from the partner",
    );
  let pitch: number = 0;
  if (gap(0) > 0) {
    let hi: number = PITCH[1];
    if (gap(hi) > 0)
      throw refusal(
        partner,
        `the chest stays ${(gap(hi) * 1000).toFixed(0)} mm off the partner's back at the lean's ${hi} degrees`,
        "stand nearer behind the partner",
      );
    let lo: number = 0;
    for (let i: number = 0; i < 30; ++i) {
      const mid: number = (lo + hi) / 2;
      if (gap(mid) > 0) lo = mid;
      else hi = mid;
    }
    pitch = hi;
  }

  // The neck's flexion and side bend nearest the shoulder.
  const scored = (flexion: number, tilt: number): ISolved => {
    const s: ISolved = { pitch, flexion, tilt, miss: 0 };
    return { ...s, miss: Vector3.distance(chin(posed(s), resolution), rest) };
  };
  let best: ISolved = scored(0, 0);
  for (let flexion: number = FLEXION[0]; flexion <= FLEXION[1]; flexion += 5)
    for (let tilt: number = -TILT; tilt <= TILT; tilt += 4) {
      const s: ISolved = scored(flexion, tilt);
      if (s.miss < best.miss) best = s;
    }
  const coarse: ISolved = best;
  for (
    let flexion: number = coarse.flexion - 4;
    flexion <= coarse.flexion + 4;
    flexion += 1
  )
    for (let tilt: number = coarse.tilt - 3; tilt <= coarse.tilt + 3; tilt += 1)
      if (
        flexion >= FLEXION[0] &&
        flexion <= FLEXION[1] &&
        Math.abs(tilt) <= TILT
      ) {
        const s: ISolved = scored(flexion, tilt);
        if (s.miss < best.miss) best = s;
      }
  if (best.miss > NEAR)
    throw refusal(
      partner,
      `the chin stays ${(best.miss * 1000).toFixed(0)} mm from the partner's shoulder with the chest on the back, the neck flexed ${best.flexion.toFixed(0)} and bent ${best.tilt.toFixed(0)} degrees`,
      "embrace a partner whose shoulder is near the chin's height, or rest the chin elsewhere",
    );
  return best;
}

/** A reach refusal of the embrace. */
function refusal(partner: string, reason: string, fix: string): HumanRefusal {
  return new HumanRefusal({
    kind: "reach",
    axis: "partner",
    value: partner,
    reason,
    fix,
  });
}
