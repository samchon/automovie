import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
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

import { AutoMovieMotionHumanAuditSkin } from "../audit/AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
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
import { HumanArmObstacleBones } from "../posture/HumanArmObstacleBones";
import { HumanArmTrajectoryPace } from "../posture/HumanArmTrajectoryPace";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { StrikingBody } from "../striking/StrikingBody";
import { embraceTrunkClear } from "./embraceTrunkClear";
import { kiss } from "./kiss";
import { kissBody } from "./kissBody";
import { kissPose } from "./kissPose";
import { touchHoldRests } from "./touchHoldRests";

/**
 * The miss under which a region rests on another, metres (provisional: a skin
 * contact, as `headRest`'s).
 */
const NEAR: number = 0.01;

/**
 * The share of the body's weight the leaning chest lays on the partner's back
 * (provisional: a light lean).
 */
const LEAN: number = 0.1;

/** The lean's forward range searched, degrees: the kiss's own. */
const PITCH: readonly [number, number] = [-10, 45];

/** The neck's flexion range searched, degrees: the kiss's own. */
const FLEXION: readonly [number, number] = [-30, 45];

/** The side bend's range searched, degrees: `headRestAim.TILT`. */
const TILT: number = 40;

/**
 * The partner's bones whose colliders the embracing arms reach around: the
 * trunk, the thighs and the arms hanging at the partner's sides.
 */
const AROUND: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>([
    ...HumanArmObstacleBones.TRUNK,
    "leftUpperLeg",
    "rightUpperLeg",
    "leftUpperArm",
    "rightUpperArm",
    "leftLowerArm",
    "rightLowerArm",
    "leftHand",
    "rightHand",
  ]);

/** The neck's two bones a resting head bends over. */
type NeckBone = "neck" | "head";

/**
 * The neck's protraction searched, degrees of lower-neck flexion countered by
 * as much upper-neck extension, so the chin juts forward with the face level:
 * cervical protraction flexes the lower cervical segments and extends the upper
 * ones (Ordway et al. 1999, Spine 24(3):240-247; provisional range).
 */
const PROTRACT: number = 25;

/**
 * How far the body may sink on bent knees to bring the chin down, metres
 * (provisional: a slight knee bend).
 */
const SINK: number = 0.12;

/**
 * How far the head turns toward the shoulder, either way, degrees (provisional:
 * inside a cervical rotation of about 70 to 80 degrees).
 */
const TWIST: number = 60;

/**
 * One solved embrace: the lean's pitch and roll, the head's turn, and the
 * neck's flexion and side bend.
 */
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

  /**
   * The neck's protraction, degrees: lower-neck flexion countered by upper-neck
   * extension.
   */
  protract: number;

  /** The chin's distance from the shoulder at the solution, metres. */
  miss: number;
}

/**
 * Embrace a partner from behind. The lean from the hips is solved first, the
 * least forward pitch that lays the chest's sternum region on the partner's
 * upper back (the kiss's lean model, `kissBody`, on planted feet); then the
 * knees' sink (up to `SINK`), the side lean (within the kiss's `ROLL`), the
 * head's turn (`TWIST`), the neck's flexion and side bend and its protraction
 * (`PROTRACT`) that bring the chin nearest the top of the partner's shoulder
 * (the shoulder's region), by turns on coarse grids refined by degrees; a chin
 * still behind and below the shoulder then reaches forward in closed form, the
 * neck flexing about its base by the angle that carries the chin forward to it
 * and the heels rising (within the kiss's `RAISE`) by the height that flexion
 * costs plus what was missing. A chest already in the partner's back, a back
 * the lean cannot reach, or a chin left farther than `NEAR` from the shoulder
 * is refused with the gap or the miss. The lean stops where the two bodies'
 * colliders come to the skin's depth if that comes before the chest's region
 * meets the back, and every chin candidate keeps them within it, read as the
 * partner audit reads them against the partner at every frame of the hold
 * (`embraceTrunkClear`). The hands meet on the partner's abdomen, one placement
 * for both: each palm on the partner's own surface on its side of the midline
 * (a ray onto the colliders), the fingers toward the midline, the palm's middle
 * as far from it as the fingertips reach and a skin contact more, so the
 * fingertips meet there without crossing. Both arms are laid as one course
 * (`courseArmGoal`) around the partner's trunk, thighs and arms, the palms
 * lying on the abdomen's. The places are read where the partner stands at the
 * start, the partner's segments the arms keep clear of at every second the
 * course is planned on. Loaded windows: the chest on the upper back (`LEAN`),
 * the chin on the shoulder, the palms on the abdomen.
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
      HumanBound.above("hold", p.hold, 0, "s");
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
      // The chin rests on the top of the shoulder, the shoulder's region:
      // rested halfway to the neck's side, the head lay in the partner's neck.
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

      // The hands meet on the abdomen, one placement for both: each palm on
      // its own side of the midline, the fingers toward it, the palm's middle
      // as far from the midline as the fingertips reach beyond it and a skin
      // contact more, so the fingertips meet at the midline and never cross.
      // A clasp of one hand over the other at the midline laid the forearms
      // straight across the abdomen's curve, through it.
      const belly: IAutoMovieMotionHumanStrikingBody.IRegionResult =
        StrikingBody.region(partner.body, bones, "abdomen");
      const leftward: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(
          StrikingBody.region(partner.body, bones, "hipLeft").point,
          StrikingBody.region(partner.body, bones, "hipRight").point,
        ),
      );
      const laid = (
        side: AutoMovieHumanSide,
        point: IAutoMovieVector3,
        normal: IAutoMovieVector3,
        forward: IAutoMovieVector3,
      ): IAutoMovieMotionHumanArmTarget.ITarget =>
        AutoMovieMotionHumanArmTarget.prepareTarget(
          body,
          side,
          "palm",
          "flat",
        )({
          point,
          rotation: HumanHand.align(
            HumanHand.offset(body, side, "palm", "flat"),
            { normal: Vector3.scale(normal, -1), forward },
          ),
          bend: AutoMovieMotionHumanBend.hang(body, entry, side, 0.2),
        });
      const tips: number =
        body.measure.hand -
        Vector3.length(HumanHand.offset(body, "left", "palm", "flat").point) +
        NEAR;
      const place = (
        side: AutoMovieHumanSide,
      ): IAutoMovieMotionHumanArmTarget.ITarget => {
        const out: IAutoMovieVector3 = Vector3.scale(
          leftward,
          side === "left" ? 1 : -1,
        );
        // The palm lies on the partner's own surface there, the abdomen
        // curving back from its middle: a ray in from the tangent plane
        // finds the place and its facing on the colliders.
        const hit: IAutoMovieMotionHumanColliders.IHit | undefined =
          HumanColliders.cast(
            partner.body,
            bones,
            Vector3.addScaled(
              Vector3.addScaled(belly.point, out, tips),
              belly.normal,
              partner.body.measure.chestDepth,
            ),
            Vector3.scale(belly.normal, -1),
            2 * partner.body.measure.chestDepth,
          );
        const normal: IAutoMovieVector3 = hit?.normal ?? belly.normal;
        const across: IAutoMovieVector3 = Vector3.scale(out, -1);
        return laid(
          side,
          hit?.point ?? Vector3.addScaled(belly.point, out, tips),
          normal,
          Vector3.normalize(
            Vector3.addScaled(across, normal, -Vector3.dot(across, normal)),
          ),
        );
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
          hold: p.hold,
          retract: approach,
        }),
        modifiers,
      );
      const share = (seconds: number): number =>
        clock.envelope(["start", "ready"], ["relax", "end"], seconds);
      const duration: number = clock.duration;

      // The lean and the chin are solved against the partner as the partner
      // stands at every frame of the hold, where the audit reads the two.
      const held: number[] = [];
      for (
        let t: number = clock.at("ready");
        t < clock.at("relax");
        t += HumanArmTrajectoryPace.STEP
      )
        held.push(context.start + t);
      held.push(context.start + clock.at("relax"));
      const solved: ISolved = solve(
        body,
        entry,
        stance,
        back,
        rest,
        p.partner,
        embraceTrunkClear(body, partner, held),
      );
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
      // The arms reach around the partner's waist and back: each arm's goal
      // carries the partner's trunk, thighs and arms as the partner stands
      // at that second, the abdomen's segments and their neighbours as the
      // ones the palm lies on, the rest as ones the arm keeps clear of, as a
      // touch's do (`touchHold.others`). The partner is read at every second
      // the course is planned on, so a partner who sways while held is kept
      // clear where the audit reads them, not where they stood at the start.
      const placing: ReturnType<typeof HumanColliders.preparePlaced> =
        HumanColliders.preparePlaced(partner.body, AROUND);
      const resting: ReturnType<typeof touchHoldRests> = touchHoldRests(
        partner.body,
        "abdomen",
        body.measure.hand,
      );
      const around: IAutoMovieMotionHumanActionPlan = {
        ...plan,
        posture: (
          seconds: number,
          channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
          resolution?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[2],
          projection?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[3],
        ): IAutoMovieMotionHumanPosture => {
          const shown: IAutoMovieMotionHumanPosture = plan.posture(
            seconds,
            channels,
            resolution,
            projection,
          );
          const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
            ...shown.limbs,
          };
          if (limbs.leftArm === undefined && limbs.rightArm === undefined)
            return shown;
          const now: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            partner.bones(context.start + seconds, AROUND);
          const placed: IAutoMovieMotionHumanColliders.IPlaced[] = placing(now);
          const lies: (
            segment: IAutoMovieMotionHumanColliders.IPlaced,
          ) => boolean = resting(now);
          const clear: IAutoMovieMotionHumanColliders.IPlaced[] = placed.filter(
            (segment: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
              !lies(segment),
          );
          const rests: IAutoMovieMotionHumanColliders.IPlaced[] =
            placed.filter(lies);
          for (const limb of ["leftArm", "rightArm"] as const) {
            const goal: IAutoMovieHumanLimbGoal | undefined = limbs[limb];
            if (goal !== undefined)
              limbs[limb] = {
                ...goal,
                clear: [...(goal.clear ?? []), ...clear],
                rests: [...(goal.rests ?? []), ...rests],
              };
          }
          return { ...shown, limbs };
        },
      };
      const coursed: IAutoMovieMotionHumanActionPlan = courseArmGoal({
        context,
        plan: around,
        side: "left",
        span: {
          start: 0,
          ready: clock.at("ready"),
          relax: clock.at("relax"),
          end: duration,
        },
        with: [
          {
            side: "right",
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

/**
 * The neck's flexion, side bend and turn at a share, added over the posture's
 * own.
 */
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

/**
 * The chest's lean onto the back, then the chin onto the shoulder, or the
 * refusal.
 */
function solve(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  stance: IAutoMovieMotionHumanRise.Stance,
  back: IAutoMovieMotionHumanStrikingBody.IRegionResult,
  rest: IAutoMovieVector3,
  partner: string,
  depth: (posture: IAutoMovieMotionHumanPosture, head: boolean) => number,
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

  // Whether a solution's bodies lie within the skin of each other, as the
  // partner audit reads them through the hold: the trunk and legs for the
  // lean, the head and neck too once the head is turned to the shoulder.
  const clear = (s: ISolved, head: boolean = true): boolean =>
    depth(posed(s), head) <= AutoMovieMotionHumanAuditSkin.BUILT;

  // The least pitch that lays the chest on the back, or that brings the two
  // bodies' colliders to the skin's depth, whichever the lean meets first:
  // the chest's region lies on its surface, inside the collider the audit
  // reads.
  if (gap(0) < -NEAR || !clear(upright, false))
    throw refusal(
      partner,
      `the chest is ${(Math.max(-gap(0), depth(posed(upright), false)) * 1000).toFixed(0)} mm into the partner's back standing upright`,
      "stand farther back from the partner",
    );
  const open = (pitch: number): boolean =>
    gap(pitch) > 0 && clear({ ...upright, pitch }, false);
  let pitch: number = 0;
  if (open(0)) {
    let hi: number = PITCH[1];
    if (open(hi))
      throw refusal(
        partner,
        `the chest stays ${(gap(hi) * 1000).toFixed(0)} mm off the partner's back at the lean's ${hi} degrees`,
        "stand nearer behind the partner",
      );
    let lo: number = 0;
    for (let i: number = 0; i < 30; ++i) {
      const mid: number = (lo + hi) / 2;
      if (open(mid)) lo = mid;
      else hi = mid;
    }
    pitch = clear({ ...upright, pitch: hi }, false) ? hi : lo;
  }

  // Then the side lean and the head's turn, and the neck's flexion and side
  // bend, by turns on coarse grids, the chin nearest the shoulder; then each
  // pair refined by degrees. A candidate is feasible only with the two
  // bodies within the skin of each other; it is read so only where it
  // would improve on the best.
  const scored = (s: ISolved): ISolved => ({
    ...s,
    miss: Vector3.distance(chin(posed(s), resolution), rest),
  });
  const least = (candidates: readonly ISolved[], best: ISolved): ISolved =>
    candidates
      .map(scored)
      .reduce(
        (a: ISolved, b: ISolved): ISolved =>
          b.miss < a.miss && clear(b) ? b : a,
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
    const ahead: IAutoMovieVector3 = {
      x: Math.sin(yaw),
      y: 0,
      z: Math.cos(yaw),
    };
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
    const high: number = chin(
      posed({ ...flexed, raise: kiss.RAISE }),
      resolution,
    ).y;
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
    if (reached.miss < best.miss && clear(reached)) best = reached;
    // The forward reach moves the chin aside too: the side lean, the turn
    // and the neck are refined once more about it, by degrees.
    if (best.miss > NEAR)
      best = protracted(necked(sideways(best, 1, 4), 1, 4), 1);
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
