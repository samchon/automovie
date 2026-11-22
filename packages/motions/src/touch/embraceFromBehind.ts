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
import { AutoMovieMotionHumanRise } from "../compose/AutoMovieMotionHumanRise";
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
import { kiss } from "./kiss";
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

/** The neck's protraction searched, degrees of lower-neck flexion countered by as much upper-neck extension, so the chin juts forward with the face level: cervical protraction flexes the lower cervical segments and extends the upper ones (Ordway et al. 1999, Spine 24(3):240-247; provisional range). */
const PROTRACT: number = 25;

/** How far the body may sink on bent knees to bring the chin down, metres (provisional: a slight knee bend). */
const SINK: number = 0.12;

/** How far the head turns toward the shoulder, either way, degrees (provisional: inside a cervical rotation of about 70 to 80 degrees). */
const TWIST: number = 60;

/** One solved embrace: the lean's pitch and roll, the head's turn, and the neck's flexion and side bend. */
interface ISolved {
  /** The forward lean from the hips, degrees. */
  pitch: number;

  /** The side lean from the hips, degrees. */
  roll: number;

  /** How far the body sinks on bent knees, metres. */
  sink: number;

  /** The heels' raise, degrees: the rise onto the forefeet that lifts the chin. */
  raise: number;

  /** The head's turn, degrees. */
  twist: number;

  /** The neck's flexion, degrees. */
  flexion: number;

  /** The side bend over the neck and head, degrees. */
  tilt: number;

  /** The neck's protraction, degrees: lower-neck flexion countered by upper-neck extension. */
  protract: number;

  /** The chin's distance from the shoulder at the solution, metres. */
  miss: number;
}

/**
 * Embrace a partner from behind (#4012). The lean from the hips is solved
 * first, the least forward pitch that lays the chest's sternum region on
 * the partner's upper back (the kiss's lean model, `kissBody`, on planted
 * feet); then the knees' sink (up to `SINK`), the side lean (within the
 * kiss's `ROLL`), the head's turn
 * (`TWIST`), the neck's flexion and side bend and its protraction (`PROTRACT`) that bring the chin nearest
 * the top of the partner's shoulder beside the neck (halfway between the
 * shoulder's region and the neck's side), by turns on coarse grids refined by
 * degrees; a chin still behind and below the shoulder then reaches forward in
 * closed form, the neck flexing about its base by the angle that carries the
 * chin forward to it and the heels rising (within the kiss's `RAISE`) by the
 * height that flexion costs plus what was missing. A
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
      // The chin rests on the top of the shoulder beside the neck: halfway
      // between the side of the neck and the shoulder's region.
      const rest: IAutoMovieVector3 = Vector3.lerp(
        StrikingBody.region(partner.body, bones, shoulder).point,
        StrikingBody.region(
          partner.body,
          bones,
          shoulder === "shoulderLeft" ? "neckLeft" : "neckRight",
        ).point,
        0.5,
      );
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
                  {
                    pitch: solved.pitch,
                    roll: solved.roll,
                    raise: solved.raise,
                    sink: solved.sink,
                  },
                  share(seconds),
                  false,
                ),
            },
            // Risen heels, the feet on their forefeet, as the kiss rises.
            ...(solved.raise > 0
              ? AutoMovieMotionHumanRise.legs({
                  body,
                  stance,
                  from: 0,
                  to: duration,
                  degrees: (seconds: number): number =>
                    solved.raise * share(seconds),
                })
              : []),
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

/** The neck's flexion, side bend and turn at a share, added over the posture's own. */
function neck(
  posture: IAutoMovieMotionHumanPosture,
  s: ISolved,
  k: number,
): IAutoMovieMotionHumanPosture {
  const flexion: IAutoMovieMotionHumanJoints.Angles =
    AutoMovieMotionHumanHead.share(0, s.flexion * k);
  const bend: IAutoMovieMotionHumanJoints.Angles =
    AutoMovieMotionHumanHead.share(1, s.tilt * k);
  const turn: IAutoMovieMotionHumanJoints.Angles =
    AutoMovieMotionHumanHead.share(2, s.twist * k);
  const added = (bone: NeckBone): readonly [number, number, number] => {
    const held: readonly [number, number, number] = posture.joints[bone] ?? [
      0, 0, 0,
    ];
    // Protraction flexes the neck bone and extends the head bone as much.
    const jut: number = (bone === "neck" ? 1 : -1) * s.protract * k;
    return [
      held[0] + flexion[bone]![0] + jut,
      held[1] + bend[bone]![1],
      held[2] + turn[bone]![2],
    ];
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
    neck(
      leaned({
        pitch: s.pitch,
        roll: s.roll,
        flexion: 0,
        raise: s.raise,
        sink: s.sink,
      }),
      s,
      1,
    );
  const upright: ISolved = {
    pitch: 0,
    roll: 0,
    sink: 0,
    raise: 0,
    twist: 0,
    flexion: 0,
    tilt: 0,
    protract: 0,
    miss: 0,
  };
  const gap = (pitch: number): number =>
    Vector3.dot(
      Vector3.subtract(
        sternum(posed({ ...upright, pitch }), resolution),
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

  // Then the side lean and the head's turn, and the neck's flexion and side
  // bend, by turns on coarse grids, the chin nearest the shoulder; then each
  // pair refined by degrees.
  const scored = (s: ISolved): ISolved => ({
    ...s,
    miss: Vector3.distance(chin(posed(s), resolution), rest),
  });
  const least = (candidates: readonly ISolved[], best: ISolved): ISolved =>
    candidates
      .map(scored)
      .reduce(
        (a: ISolved, b: ISolved): ISolved => (b.miss < a.miss ? b : a),
        best,
      );
  const grid = (from: number, to: number, step: number): number[] => {
    const out: number[] = [];
    for (let v: number = from; v <= to + 1e-9; v += step) out.push(v);
    return out;
  };
  const sideways = (s: ISolved, step: number, span: number): ISolved =>
    least(
      grid(
        Math.max(-kiss.ROLL, s.roll - span),
        Math.min(kiss.ROLL, s.roll + span),
        step / 2,
      ).flatMap((roll: number): ISolved[] =>
        grid(
          Math.max(-TWIST, s.twist - 5 * span),
          Math.min(TWIST, s.twist + 5 * span),
          step * 5,
        ).map((twist: number): ISolved => ({ ...s, roll, twist })),
      ),
      s,
    );
  const necked = (s: ISolved, step: number, span: number): ISolved =>
    least(
      grid(
        Math.max(FLEXION[0], s.flexion - span),
        Math.min(FLEXION[1], s.flexion + span),
        step,
      ).flatMap((flexion: number): ISolved[] =>
        grid(
          Math.max(-TILT, s.tilt - span),
          Math.min(TILT, s.tilt + span),
          step,
        ).map((tilt: number): ISolved => ({ ...s, flexion, tilt })),
      ),
      s,
    );
  // The chin jutted forward as far as the protraction range needs.
  const protracted = (s: ISolved, step: number): ISolved =>
    least(
      grid(0, PROTRACT, step).map(
        (protract: number): ISolved => ({ ...s, protract }),
      ),
      s,
    );
  let best: ISolved = scored({ ...upright, pitch });
  const lowered = (s: ISolved): ISolved =>
    least(
      grid(0, SINK, 0.02).map((sink: number): ISolved => ({ ...s, sink })),
      s,
    );
  for (let round: number = 0; round < 2; ++round)
    best = protracted(
      necked(sideways(lowered(best), 4, 2 * TILT), 5, 2 * TILT),
      5,
    );
  best = protracted(necked(sideways(best, 1, 4), 1, 4), 1);

  // The head's own forward reach for a chin the lean leaves behind and below
  // the shoulder: the neck flexes about its base by the angle that carries
  // the chin's circle forward to the shoulder (an arcsine less its present
  // angle), and the heels rise by the height that flexion costs plus what
  // was already missing, the rise's height going as the sine of the heels'
  // angle, within the kiss's `RAISE`.
  if (best.miss > NEAR) {
    const posture: IAutoMovieMotionHumanPosture = posed(best);
    const base: IAutoMovieVector3 = HumanTrunk.resolve(
      body,
      posture,
      undefined,
      undefined,
      new Set<AutoMovieHumanoidBone>(["neck"]),
    ).get("neck")!.worldPosition;
    const at: IAutoMovieVector3 = chin(posture, resolution);
    const yaw: number = (entry.yaw * Math.PI) / 180;
    const ahead: IAutoMovieVector3 = { x: Math.sin(yaw), y: 0, z: Math.cos(yaw) };
    const out: number = Vector3.dot(Vector3.subtract(at, base), ahead);
    const up: number = at.y - base.y;
    const radius: number = Math.hypot(out, up);
    const from: number = Math.atan2(out, up);
    const reach: number = Math.asin(
      Math.max(
        -1,
        Math.min(
          1,
          (out + Vector3.dot(Vector3.subtract(rest, at), ahead)) / radius,
        ),
      ),
    );
    const flexion: number = Math.max(
      FLEXION[0],
      Math.min(FLEXION[1], best.flexion + ((reach - from) * 180) / Math.PI),
    );
    // The chin's height on the flexed neck with the heels down and at the
    // rise's limit: the rise lifts it as the sine of the heels' angle.
    const flexed: ISolved = { ...best, flexion, raise: 0 };
    const low: number = chin(posed(flexed), resolution).y;
    const high: number = chin(posed({ ...flexed, raise: kiss.RAISE }), resolution)
      .y;
    const sine: number = Math.sin((kiss.RAISE * Math.PI) / 180);
    const lift: number = rest.y - low;
    const raise: number =
      lift <= 0 || high <= low
        ? 0
        : Math.min(
            kiss.RAISE,
            (Math.asin(Math.min(1, (lift / (high - low)) * sine)) * 180) /
              Math.PI,
          );
    const reached: ISolved = scored({ ...flexed, raise });
    if (reached.miss < best.miss) best = reached;
  }
  if (best.miss > NEAR) {
    // Where the shoulder lies from the chin, in the performer's frame.
    const off: IAutoMovieVector3 = Vector3.subtract(
      rest,
      chin(posed(best), resolution),
    );
    const r: number = (entry.yaw * Math.PI) / 180;
    const left: number = off.x * Math.cos(r) - off.z * Math.sin(r);
    const ahead: number = off.x * Math.sin(r) + off.z * Math.cos(r);
    throw refusal(
      partner,
      `the chin stays ${(best.miss * 1000).toFixed(0)} mm from the partner's shoulder with the chest on the back (the shoulder ${(left * 1000).toFixed(0)} mm to the left, ${(off.y * 1000).toFixed(0)} mm up and ${(ahead * 1000).toFixed(0)} mm ahead of it), leaning ${best.roll.toFixed(0)} degrees aside, sinking ${(best.sink * 1000).toFixed(0)} mm, the head turned ${best.twist.toFixed(0)}, flexed ${best.flexion.toFixed(0)} and bent ${best.tilt.toFixed(0)}, the heels raised ${best.raise.toFixed(0)}`,
      "stand behind the shoulder the chin rests on, or embrace a partner whose shoulder is near the chin's height",
    );
  }
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
