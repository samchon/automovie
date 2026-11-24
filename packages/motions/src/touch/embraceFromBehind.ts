import { DEFAULT_HUMANOID_ROM, Vector3 } from "@automovie/engine";
import type {
  AutoMovieClinicalAxis,
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
  IAutoMovieMotionHumanSequentialConvex,
  IAutoMovieMotionHumanStrikingBody,
  IAutoMovieMotionManner,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../audit/AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
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
import { HumanArmTrajectoryPace } from "../posture/HumanArmTrajectoryPace";
import { HumanAuditModel } from "../posture/HumanAuditModel";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanHand } from "../posture/HumanHand";
import { HumanSequentialConvex } from "../posture/HumanSequentialConvex";
import { HumanSequentialConvexFunctions } from "../posture/HumanSequentialConvexFunctions";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
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

/** The lean's forward range, degrees: the kiss's own. */
const PITCH: readonly [number, number] = [-10, 45];

/** Radians in a degree. */
const RADIAN: number = Math.PI / 180;

/** The partner's torso bones whose colliders are the back the chest lies on. */
const TORSO: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>(["spine", "chest", "upperChest"]);

/** The neck's two bones a resting head bends over. */
type NeckBone = "neck" | "head";

/**
 * How far the body may sink on bent knees to bring the chin down, metres
 * (provisional: a slight knee bend).
 */
const SINK: number = 0.12;

/** A freedom's range in the solve, metres or radians. */
interface IRange {
  /** The least value. */
  low: number;

  /** The greatest value. */
  high: number;
}

/**
 * One solved embrace: the root's advance and shift on the planted feet, the
 * lean's pitch and roll, the head's turn, and the neck's flexion and side
 * bend.
 */
interface ISolved {
  /** The root's advance along the heading on the planted feet, metres. */
  advance: number;

  /** The root's shift to the left on the planted feet, metres. */
  shift: number;

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

/** A solved embrace with the partner's bone its chest bears on. */
interface IPlaced extends ISolved {
  /**
   * The partner's torso bone whose collider lies nearest the chest's: the
   * chest's computed contact.
   */
  chest: AutoMovieHumanoidBone;
}

/**
 * Embrace a partner from behind. The stance and the head are one problem,
 * solved once (`solve`): the chin on the partner's shoulder, toward the
 * shoulder's region, and the chest on the partner's back, each contact collider
 * on collider as the audit reads two bodies (Mordatch, Todorov and Popović
 * 2012's contact violation), the bodies kept within the skin by trajopt's
 * collision term; the stance by the root's advance and shift on the planted
 * feet (the kiss's lean model, `kissBody`), with the knees' sink (up to
 * `SINK`), the lean's pitch and roll (the kiss's), the heels' raise (the kiss's
 * `RAISE`) and the neck's flexion, side bend, turn and protraction (the neck's
 * and head's ranges), by sco's trust-region SQP (`HumanSequentialConvex`). A
 * chin left farther than `NEAR` from the shoulder, a chest farther than `NEAR`
 * from the back, or bodies deeper in each other than the skin through the hold
 * (`embraceTrunkClear`) is refused with the measure. The hands meet on the
 * partner's abdomen, one placement for both: each palm on the partner's own
 * surface on its side of the midline (a ray onto the colliders), the fingers
 * toward the midline, the palm's middle as far from it as the fingertips reach
 * and a skin contact more, so the fingertips meet there without crossing. Both
 * arms are laid as one course (`courseArmGoal`) around every segment of the
 * partner the audit reads, the palms lying on the abdomen's. The places are
 * read where the partner stands at the start, the partner's segments the arms
 * keep clear of at every second the course is planned on. Loaded windows: the
 * chest on the partner's torso bone it bears on (`LEAN`), the chin on the
 * shoulder, the palms on the abdomen.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the one solve, its source, the refusals, the hands, the course and the windows.
 */
function planEmbraceFromBehind(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanEmbraceFromBehind>,
): IAutoMovieMotionHumanActionPlan {
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

  // The partner's back: the torso's colliders where the partner stands
  // at the start, the spine's, the chest's and the upper chest's.
  const torso: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    [...bones].filter(
      ([bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): boolean =>
        TORSO.has(bone),
    ),
  );
  const back = (
    point: IAutoMovieVector3,
  ): IAutoMovieMotionHumanColliders.IDistance =>
    HumanColliders.distance(partner.body, torso, point);
  // The chin rests on the top of the shoulder, the shoulder's region:
  // rested halfway to the neck's side, the head lay in the partner's neck.
  const rest: IAutoMovieVector3 = StrikingBody.region(
    partner.body,
    bones,
    shoulder,
  ).point;
  // The shoulder the head rests on: the colliders of the region's bone.
  const carrying: AutoMovieHumanoidBone =
    partner.body.surfaces.regions[shoulder].bone;
  const top = (
    point: IAutoMovieVector3,
  ): IAutoMovieMotionHumanColliders.IDistance =>
    HumanColliders.distance(
      partner.body,
      new Map([[carrying, bones.get(carrying)!]]),
      point,
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
      rotation: HumanHand.align(HumanHand.offset(body, side, "palm", "flat"), {
        normal: Vector3.scale(normal, -1),
        forward,
      }),
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
  const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner.of(
    context,
    p.manner,
  );
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
  const solved: IPlaced = solve(
    body,
    entry,
    stance,
    { back, top, rest },
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
  const arm = (side: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive => {
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
                advance: solved.advance,
                shift: solved.shift,
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
  // The arms keep clear of every segment of the partner the audit reads
  // (`HumanAuditModel.segments`), the abdomen's they rest on excepted.
  const around: ReadonlySet<AutoMovieHumanoidBone> = HumanAuditModel.segments(
    partner.body,
  );
  const placing: ReturnType<typeof HumanColliders.preparePlaced> =
    HumanColliders.preparePlaced(partner.body, around);
  const resting: ReturnType<typeof touchHoldRests> = touchHoldRests(
    partner.body,
    "abdomen",
    body.measure.hand,
  );
  const encircled: IAutoMovieMotionHumanActionPlan = {
    ...plan,
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
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
        partner.bones(context.start + seconds, around);
      const placed: IAutoMovieMotionHumanColliders.IPlaced[] = placing(now);
      const lies: (segment: IAutoMovieMotionHumanColliders.IPlaced) => boolean =
        resting(now);
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
    plan: encircled,
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
          bone: solved.chest,
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
}

/**
 * Embrace a partner from behind. The stance and the head are one problem,
 * solved once (`solve`): the chin on the partner's shoulder, toward the
 * shoulder's region, and the chest on the partner's back, each contact collider
 * on collider as the audit reads two bodies (Mordatch, Todorov and Popović
 * 2012's contact violation), the bodies kept within the skin by trajopt's
 * collision term; the stance by the root's advance and shift on the planted
 * feet (the kiss's lean model, `kissBody`), with the knees' sink (up to
 * `SINK`), the lean's pitch and roll (the kiss's), the heels' raise (the kiss's
 * `RAISE`) and the neck's flexion, side bend, turn and protraction (the neck's
 * and head's ranges), by sco's trust-region SQP (`HumanSequentialConvex`). A
 * chin left farther than `NEAR` from the shoulder, a chest farther than `NEAR`
 * from the back, or bodies deeper in each other than the skin through the hold
 * (`embraceTrunkClear`) is refused with the measure. The hands meet on the
 * partner's abdomen, one placement for both: each palm on the partner's own
 * surface on its side of the midline (a ray onto the colliders), the fingers
 * toward the midline, the palm's middle as far from it as the fingertips reach
 * and a skin contact more, so the fingertips meet there without crossing. Both
 * arms are laid as one course (`courseArmGoal`) around every segment of the
 * partner the audit reads, the palms lying on the abdomen's. The places are
 * read where the partner stands at the start, the partner's segments the arms
 * keep clear of at every second the course is planned on. Loaded windows: the
 * chest on the partner's torso bone it bears on (`LEAN`), the chin on the
 * shoulder, the palms on the abdomen.
 */
export const embraceFromBehind: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanEmbraceFromBehind> =
  {
    name: "embraceFromBehind",
    interrupts: {},
    plan: planEmbraceFromBehind,
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
 * The partner's surfaces the embrace bears on: the torso's colliders (the back
 * the chest lies on), the shoulder region's bone's colliders (the shoulder the
 * head rests on) and the region's point on them (where the chin goes).
 */
interface ISurfaces {
  /** The signed distance to the partner's torso colliders. */
  back: (point: IAutoMovieVector3) => IAutoMovieMotionHumanColliders.IDistance;

  /** The signed distance to the colliders of the shoulder region's bone. */
  top: (point: IAutoMovieVector3) => IAutoMovieMotionHumanColliders.IDistance;

  /** The shoulder region's point, world metres. */
  rest: IAutoMovieVector3;
}

/**
 * The embrace's stance and head, solved once at preparation as one constrained
 * problem: the head on the partner's shoulder, the chest on the partner's back,
 * the two bodies clear of each other, or the refusal.
 *
 * The stance is solved with the head: the root's advance and shift on the
 * planted feet (the kiss's own supported root, `kissBody`) are variables of the
 * solve, with the knees' sink, the lean's pitch and roll, the heels' raise and
 * the neck's flexion, side bend, turn and protraction. The solve is sco's
 * `BasicTrustRegionSQP` (`HumanSequentialConvex`, the trajopt port), its
 * variables in metres and radians, the units sco's parameters hold:
 *
 * - The cost is the squared distance from the chin to the shoulder's region,
 *   convexified with its full Hessian (trajopt's `CostFromFunc` with
 *   `full_hessian`).
 * - The two contacts are equalities on their contact violation, the distance from
 *   the contacting part to the nearest point of the surface it bears on
 *   (Mordatch, Todorov and Popović 2012, "Discovery of complex behaviors
 *   through contact-invariant optimization", §4.2), read against the colliders
 *   the audit reads two bodies by (`AutoMovieMotionHumanAuditPartner`: a
 *   declared contact is "a statement that the skins meet"): the chin's signed
 *   distance to the shoulder's colliders, the chin the contact's end effector,
 *   and the least signed distance from the audit's probes of the torso to the
 *   partner's back (`contact`).
 * - The two bodies are kept apart by trajopt's collision term, the hinge on the
 *   signed distance of every pair against its safety margin
 *   (`trajopt/src/collision_terms.cpp`), the margin the skin the audit allows
 *   (`AutoMovieMotionHumanAuditSkin.BUILT`): one row per pair of segments, each
 *   pair's deepest probe through the hold (`embraceTrunkClear`) at most that
 *   deep.
 * - The bounds are each freedom's range.
 *
 * The solved embrace is then checked as Algorithm 1 checks a base: each contact
 * within `NEAR` of its surface and the bodies within the skin; a check that
 * fails refuses with its measure.
 */
function solve(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  stance: IAutoMovieMotionHumanRise.Stance,
  surfaces: ISurfaces,
  partner: string,
  depth: (posture: IAutoMovieMotionHumanPosture, head: boolean) => number[],
): IPlaced {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const leaned: ReturnType<typeof kissPose> = kissPose(
    body,
    entry,
    stance,
    0,
    false,
  );
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
        advance: s.advance,
        shift: s.shift,
      }),
      s,
      1,
    );

  // A point of the solve: metres and radians, read back in degrees.
  const solved = (x: HumanSequentialConvexFunctions.Vector): ISolved => ({
    advance: x[0]!,
    shift: x[1]!,
    sink: x[2]!,
    pitch: degrees(x[3]!),
    roll: degrees(x[4]!),
    flexion: degrees(x[5]!),
    tilt: degrees(x[6]!),
    twist: degrees(x[7]!),
    protract: degrees(x[8]!),
    raise: degrees(x[9]!),
    miss: 0,
  });
  const neckRange = (axis: AutoMovieClinicalAxis): IRange => ({
    low:
      (DEFAULT_HUMANOID_ROM.neck![axis]!.min +
        DEFAULT_HUMANOID_ROM.head![axis]!.min) *
      RADIAN,
    high:
      (DEFAULT_HUMANOID_ROM.neck![axis]!.max +
        DEFAULT_HUMANOID_ROM.head![axis]!.max) *
      RADIAN,
  });
  const bounds: readonly IRange[] = [
    { low: -Infinity, high: Infinity },
    { low: -Infinity, high: Infinity },
    { low: 0, high: SINK },
    { low: PITCH[0] * RADIAN, high: PITCH[1] * RADIAN },
    { low: -kiss.ROLL * RADIAN, high: kiss.ROLL * RADIAN },
    neckRange("flexion"),
    neckRange("abduction"),
    neckRange("twist"),
    { low: 0, high: DEFAULT_HUMANOID_ROM.neck!.flexion!.max * RADIAN },
    { low: 0, high: kiss.RAISE * RADIAN },
  ];
  const result: IAutoMovieMotionHumanSequentialConvex.IResult<
    HumanSequentialConvexFunctions.Vector,
    IAutoMovieMotionHumanSequentialConvex.IEvaluation
  > = HumanSequentialConvex.minimise(
    HumanSequentialConvexFunctions.problem({
      costs: [
        {
          f: (x: HumanSequentialConvexFunctions.Vector): number => {
            const d: IAutoMovieVector3 = Vector3.subtract(
              chin(posed(solved(x)), resolution),
              surfaces.rest,
            );
            return Vector3.dot(d, d);
          },
          full: true,
        },
      ],
      constraints: [
        {
          g: (
            x: HumanSequentialConvexFunctions.Vector,
          ): HumanSequentialConvexFunctions.Vector => {
            const posture: IAutoMovieMotionHumanPosture = posed(solved(x));
            return [
              surfaces.top(chin(posture, resolution)).distance,
              contact(body, posture, TORSO, surfaces.back).distance,
            ];
          },
          equality: true,
        },
        {
          g: (
            x: HumanSequentialConvexFunctions.Vector,
          ): HumanSequentialConvexFunctions.Vector =>
            depth(posed(solved(x)), true).map(
              (pair: number): number =>
                pair - AutoMovieMotionHumanAuditSkin.BUILT,
            ),
          equality: false,
        },
      ],
      low: bounds.map((b: IRange): number => b.low),
      high: bounds.map((b: IRange): number => b.high),
    }),
    bounds.map((): number => 0),
    HumanSequentialConvex.DEFAULTS,
  );
  const best: ISolved = solved(result.x);
  const posture: IAutoMovieMotionHumanPosture = posed(best);
  const miss: number = Vector3.distance(
    chin(posture, resolution),
    surfaces.rest,
  );
  const head: IAutoMovieMotionHumanColliders.IDistance = surfaces.top(
    chin(posture, resolution),
  );

  const chest: IAutoMovieMotionHumanColliders.IDistance = contact(
    body,
    posture,
    TORSO,
    surfaces.back,
  );
  const into: number = Math.max(...depth(posture, true));
  if (Math.abs(head.distance) > NEAR)
    throw refusal(
      partner,
      `the chin stays ${(head.distance * 1000).toFixed(0)} mm from the partner's shoulder with the chest on the back, ${(miss * 1000).toFixed(0)} mm from the shoulder's top, leaning ${best.roll.toFixed(0)} degrees aside, sinking ${(best.sink * 1000).toFixed(0)} mm, the head turned ${best.twist.toFixed(0)}, flexed ${best.flexion.toFixed(0)} and bent ${best.tilt.toFixed(0)}, the heels raised ${best.raise.toFixed(0)}`,
      "stand behind the shoulder the chin rests on, or embrace a partner whose shoulder is near the chin's height",
    );
  if (Math.abs(chest.distance) > NEAR)
    throw refusal(
      partner,
      `the chest lies ${(chest.distance * 1000).toFixed(0)} mm ${chest.distance > 0 ? "off" : "into"} the partner's back with the head on the shoulder`,
      "stand behind the partner, nearer or farther by that much",
    );
  // Within the skin to the solve's own constraint tolerance (sco's
  // `cntTolerance`).
  if (
    into >
    AutoMovieMotionHumanAuditSkin.BUILT +
      HumanSequentialConvex.DEFAULTS.cntTolerance
  )
    throw refusal(
      partner,
      `the bodies lie ${(into * 1000).toFixed(1)} mm into each other with the head on the shoulder and the chest on the back`,
      "stand behind the shoulder the chin rests on",
    );
  return { ...best, miss, chest: chest.bone as AutoMovieHumanoidBone };
}

/**
 * A contact's violation: the least signed distance from the audit's probes of a
 * body's parts (`HumanAuditModel.frame`) to the surface they bear on, with the
 * surface's nearest bone.
 */
function contact(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  parts: ReadonlySet<AutoMovieHumanoidBone>,
  surface: (
    point: IAutoMovieVector3,
  ) => IAutoMovieMotionHumanColliders.IDistance,
): IAutoMovieMotionHumanColliders.IDistance {
  const frame: HumanAuditModel.IFrame = HumanAuditModel.frame(
    body,
    poseBones(body, resolveHumanPosture(body, posture)),
  );
  let least: IAutoMovieMotionHumanColliders.IDistance | undefined;
  frame.model.parts.forEach(
    (part: AutoMovieMotionHumanAuditTangleModel.IPart, i: number): void => {
      if (!parts.has(part.bone)) return;
      for (const probe of frame.probes[i]!) {
        const near: IAutoMovieMotionHumanColliders.IDistance = surface(probe);
        if (least === undefined || near.distance < least.distance) least = near;
      }
    },
  );
  return least!;
}
/** Degrees of an angle in radians. */
function degrees(radians: number): number {
  return radians / RADIAN;
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
