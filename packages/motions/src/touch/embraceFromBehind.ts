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
import { AutoMovieMotionHumanArmPhrase } from "../compose/AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
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
import { poseBones } from "../posture/poseBones";
import { StrikingBody } from "../striking/StrikingBody";
import { embraceFromBehindSolve } from "./embraceFromBehindSolve";
import { embraceTrunkClear } from "./embraceTrunkClear";
import { kissBody } from "./kissBody";
import { touchHoldRests } from "./touchHoldRests";

/**
 * The share of the body's weight the leaning chest lays on the partner's back
 * (provisional: a light lean).
 */
const LEAN: number = 0.1;

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
        embraceFromBehindSolve.TORSO.has(bone),
    ),
  );
  const back: (
    point: IAutoMovieVector3,
  ) => IAutoMovieMotionHumanColliders.IDistance = (
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
  const top: (
    point: IAutoMovieVector3,
  ) => IAutoMovieMotionHumanColliders.IDistance = (
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
    embraceFromBehindSolve.NEAR;
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
  const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
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
  const solved: embraceFromBehindSolve.IPlaced = embraceFromBehindSolve.solve(
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
            embraceFromBehindSolve.neck(posture, solved, share(seconds)),
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
