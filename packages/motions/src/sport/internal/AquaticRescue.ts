import {
  AutoMovieEngineKinematics,
  AutoMovieEngineMotionSampling,
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { ExerciseKey } from "../../exercise/internal/ExerciseKey";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanHand } from "../../posture/internal/HumanHand";
import { prepareHumanShapeBlend } from "../../posture/internal/prepareHumanShapeBlend";
import { AquaticPosture } from "./AquaticPosture";
import { AquaticRescueBounds } from "./AquaticRescueBounds";

/*
 * A water rescue as the American Red Cross Lifeguarding manual describes it:
 * the rescuer swims to the victim, takes a cross-chest hold from behind and
 * tows alongside with a scissor kick to a named edge. The victim reclines
 * around the chest held by the rescuer and keeps the mouth clear of the
 * water. The victim's sternum follows the path from the hold toward the edge.
 * The rescuer's palm follows that displayed surface through the turn and tow.
 */
export namespace AquaticRescue {
  /*
   * The rescuer: approach, hold and tow.
   */
  export function rescuer(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params, start } = context;
    const victim: IAutoMovieMotionHumanPerformerReader = partnerOf(context);
    const from: IAutoMovieVector3 = victim.root(start).position;
    const tow: ITow = plan(from, edgeOf(context));
    const away: IAutoMovieVector3 = AutoMovieEngineVector3.cross(tow.toward, {
      x: 0,
      y: 1,
      z: 0,
    });
    const beside: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
      away,
      body.measure.hipHalfWidth +
        body.measure.thighRadius +
        victim.body.measure.hipHalfWidth +
        victim.body.measure.thighRadius,
    );
    const behind: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.subtract(
        from,
        AutoMovieEngineVector3.scale(tow.toward, AquaticRescueBounds.BEHIND),
      ),
      beside,
    );
    // The crawl stops `STANDOFF` short of the hold, clear of the victim's
    // flailing body, and the rescuer glides in onto its side as it takes
    // the hold.
    const gap: number = Math.hypot(
      behind.x - entry.posture.root.x,
      behind.z - entry.posture.root.z,
    );
    const standoff: IAutoMovieVector3 =
      gap > AquaticRescueBounds.STANDOFF
        ? AutoMovieEngineVector3.add(behind, {
            x:
              ((entry.posture.root.x - behind.x) / gap) *
              AquaticRescueBounds.STANDOFF,
            y: 0,
            z:
              ((entry.posture.root.z - behind.z) / gap) *
              AquaticRescueBounds.STANDOFF,
          })
        : behind;
    const approach: number = Math.max(0, gap - AquaticRescueBounds.STANDOFF);
    const limit: number = params.duration ?? Infinity;
    if (approach / AquaticRescueBounds.SWIM > limit)
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: "partner",
        value: params.partner ?? null,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: AquaticRescueBounds.SWIM * limit,
          unit: "m",
        },
        reason: `the victim is ${approach.toFixed(2)} m away, beyond the ${(AquaticRescueBounds.SWIM * limit).toFixed(2)} m a rescuer swims in ${limit} s`,
        fix: "start the rescuer nearer, or allow more time before submersion",
      });
    const arrive: number = approach / AquaticRescueBounds.SWIM;
    const hold: number = arrive + AquaticRescueBounds.GRIP;
    const duration: number = hold + tow.seconds;
    // The approach is a front crawl: the arms recover over the water in turn.
    // The crawl's strokes shorten over the last `NEAR` seconds of the
    // approach, so the arms do not reach into the victim the rescuer comes
    // up behind.
    const swimAt: (t: number) => IAutoMovieMotionHumanPosture = (
      t: number,
    ): IAutoMovieMotionHumanPosture => {
      const near: number = Math.max(
        0,
        Math.min(
          1,
          (approach / AquaticRescueBounds.SWIM - t) / AquaticRescueBounds.NEAR,
        ),
      );
      const stroke: number =
        near * Math.sin((2 * Math.PI * t) / AquaticRescueBounds.STROKE);
      return AquaticPosture.key(
        entry.posture,
        ExerciseKey.from(
          body,
          { pitch: 80, neck: -20 },
          // The recovering arm swings wide of the head.
          { hip: 5, knee: 10, raise: 40, elbow: 20 },
          { shoulder: 95 + 50 * stroke },
          { shoulder: 95 - 50 * stroke },
        ),
      );
    };
    const swim: IAutoMovieMotionHumanPosture = swimAt(
      approach / AquaticRescueBounds.SWIM,
    );
    const side: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: 70, roll: 35, neck: -10 },
        { hip: 30, knee: 40, shoulder: 60, raise: 30, elbow: 70 },
      ),
    );
    const turn: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      swim,
      side,
    );
    const hipsAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["hips"]);
    const hipsOf = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
      hipsAt(posture).get("hips")!.worldPosition;
    // Both kicks change only descendants of the hips. The transition is
    // the only interval where the hips follow a varying trunk attitude.
    const crawlHips: IAutoMovieVector3 = hipsOf(swim);
    const relaxed = HumanHand.shape("left", "relaxed");
    const fingers = prepareHumanShapeBlend(relaxed, {
      ...relaxed,
      ...Object.fromEntries(
        Object.entries(HumanHand.shape("left", "flat")).filter(
          ([bone]) => !bone.startsWith("leftThumb"),
        ),
      ),
    });

    // The body without the holding arm's goal.
    const bodyAt: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, seconds));
      const shaped: IAutoMovieMotionHumanPosture =
        t < arrive ? swimAt(t) : turn((t - arrive) / AquaticRescueBounds.GRIP);
      const where: IAutoMovieVector3 =
        t < arrive
          ? AutoMovieEngineVector3.lerp(
              { ...entry.posture.root, y: 0 },
              { ...standoff, y: 0 },
              t / arrive,
            )
          : t < hold
            ? AutoMovieEngineVector3.lerp(
                { ...standoff, y: 0 },
                { ...behind, y: 0 },
                AutoMovieEngineMotionSampling.minimumJerkShare(
                  (t - arrive) / AquaticRescueBounds.GRIP,
                ),
              )
            : AutoMovieEngineVector3.add(
                { ...behind, y: 0 },
                AutoMovieEngineVector3.add(
                  AutoMovieEngineVector3.scale(
                    tow.toward,
                    along(tow, t - hold),
                  ),
                  AutoMovieEngineVector3.scale(
                    away,
                    body.measure.thigh *
                      Math.sin((25 * Math.PI) / 180) *
                      AutoMovieEngineMotionSampling.minimumJerkShare(
                        Math.min(1, (t - hold) / AquaticRescueBounds.GRIP),
                      ),
                  ),
                ),
              );
      const hips: IAutoMovieVector3 = t < arrive ? crawlHips : hipsOf(shaped);
      const placed: IAutoMovieMotionHumanPosture = AquaticPosture.translate(
        shaped,
        AutoMovieEngineVector3.add(shaped.root, {
          x: where.x - hips.x,
          y: water - 0.15 - hips.y,
          z: where.z - hips.z,
        }),
      );
      if (t < arrive) return placed;
      // The legs scissor under the side-lying rescuer, the kick growing in
      // as the turn onto the side is taken, so the legs move on from the
      // crawl's without a jump.
      const k: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        Math.min(1, (t - arrive) / AquaticRescueBounds.GRIP),
      );
      const swing: number =
        k * Math.sin((2 * Math.PI * (t - arrive)) / AquaticRescueBounds.KICK);
      // Turn both kick planes away together to clear the victim's feet and
      // retain the space between the rescuer's left and right shank.
      const separation: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        Math.min(1, Math.max(0, (t - hold) / AquaticRescueBounds.GRIP)),
      );
      const kicked: (
        bone: AutoMovieHumanoidBone,
        degrees: number,
      ) => readonly [number, number, number] = (
        bone: AutoMovieHumanoidBone,
        degrees: number,
      ): readonly [number, number, number] => {
        const [x, y, z]: readonly [number, number, number] = placed.joints[
          bone
        ] ?? [0, 0, 0];
        const spread =
          bone === "leftUpperLeg"
            ? -30 * separation
            : bone === "rightUpperLeg"
              ? 30 * separation
              : 0;
        return [x + degrees, y + spread, z];
      };
      return {
        ...placed,
        joints: {
          ...placed.joints,
          leftUpperLeg: kicked("leftUpperLeg", 25 * swing),
          rightUpperLeg: kicked("rightUpperLeg", -25 * swing),
          leftLowerLeg: kicked("leftLowerLeg", 20 * swing),
          rightLowerLeg: kicked("rightLowerLeg", -20 * swing),
        },
      };
    };
    const swimming: IAutoMovieMotionHumanActionPlan = {
      duration,
      contacts: [],
      events: [
        { name: "approach", share: 0 },
        { name: "alongside", share: arrive / duration },
        { name: "hold", share: hold / duration },
        { name: "tow", share: hold / duration },
        { name: "relax", share: 1 },
      ],
      posture: (seconds, channels): IAutoMovieMotionHumanPosture => {
        const shaped: IAutoMovieMotionHumanPosture = bodyAt(seconds);
        if (seconds < arrive) return shaped;
        const target: IHoldWorld = plannedGrip?.(seconds) ?? firstGrip;
        const placed: IAutoMovieMotionHumanPosture =
          seconds < hold || reachAtHold === undefined
            ? shaped
            : drawAlongside(shaped, target.wrist, reachAtHold);
        return channels !== undefined && !channels.includes("leftArm")
          ? placed
          : {
              ...placed,
              limbs: {
                ...placed.limbs,
                leftArm:
                  seconds >= hold && plannedGrip === undefined
                    ? firstLocal
                    : inFrame(chestAt(placed).get("chest")!, target),
              },
            };
      },
    };

    // The victim stays at the hold position during the reach. During the tow
    // its displayed sternum and skin set the hand's position and attitude
    // as the victim reclines. The near elbow bends back toward the rescuer.
    const sternum: IAutoMovieHumanoidSurfaces.IFrame =
      victim.body.surfaces.regions.sternum;
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set([
      ...HumanColliders.bones(victim.body),
      sternum.bone,
    ]);
    const holdWorld = (seconds: number): IHoldWorld => {
      const bones: ReturnType<IAutoMovieMotionHumanPerformerReader["bones"]> =
        victim.bones(start + Math.max(hold, seconds), requested);
      const placed: ReturnType<
        typeof AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace
      > = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
        sternum,
        bones.get(sternum.bone)!,
      );
      const chest: IAutoMovieVector3 = placed.point;
      // The palm lies on the sternum, facing into it, the fingers across
      // the victim's chest: the hand rests on the skin, not in it.
      const palm: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
        body,
        "left",
        "palm",
      );
      const across: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
        AutoMovieEngineVector3.cross(placed.normal, tow.toward),
      );
      const rotation: IAutoMovieQuaternion = HumanHand.align(palm, {
        normal: AutoMovieEngineVector3.scale(placed.normal, -1),
        forward: across,
      });
      return {
        wrist: AutoMovieEngineVector3.subtract(
          chest,
          AutoMovieEngineQuaternion.rotateVector(rotation, palm.point),
        ),
        rotation,
        contact: palm.point,
        rests: HumanColliders.placed(victim.body, bones),
        bend: AutoMovieEngineVector3.add(
          AutoMovieEngineVector3.subtract(
            chest,
            AutoMovieEngineVector3.scale(tow.toward, 0.25),
          ),
          {
            x: 0,
            y: 0.1,
            z: 0,
          },
        ),
      };
    };
    const firstGrip: IHoldWorld = holdWorld(hold);
    let plannedGrip: ((seconds: number) => IHoldWorld) | undefined;
    // The hold in the rescuer's chest frame `own`.
    const inFrame = (
      own: IAutoMovieResolvedBone,
      w: IHoldWorld,
    ): IAutoMovieHumanLimbGoal => {
      const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
        own.worldRotation,
      );
      const local: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
        point: IAutoMovieVector3,
      ): IAutoMovieVector3 =>
        AutoMovieEngineQuaternion.rotateVector(
          inverse,
          AutoMovieEngineVector3.subtract(point, own.worldPosition),
        );
      return {
        on: "chest",
        point: local(w.wrist),
        rotation: AutoMovieEngineQuaternion.multiply(inverse, w.rotation),
        contact: w.contact,
        // Express the observed victim colliders in the same frame as the
        // wrist so the arm fit can keep clear of the body around the hold.
        clearanceOn: {
          clear: [],
          rests: w.rests.map(
            (
              segment: IAutoMovieMotionHumanColliders.IPlaced,
            ): IAutoMovieMotionHumanColliders.IPlaced => ({
              ...segment,
              pose: {
                position: local(segment.pose.position),
                rotation: AutoMovieEngineQuaternion.multiply(
                  inverse,
                  segment.pose.rotation,
                ),
              },
            }),
          ),
        },
        bend: local(w.bend),
      };
    };
    const chestAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["chest"]);
    const firstLocal: IAutoMovieHumanLimbGoal = inFrame(
      chestAt(bodyAt(hold)).get("chest")!,
      firstGrip,
    );
    const shoulderAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["leftUpperArm"]);
    let reachAtHold: number | undefined;
    // Keep the elbow's reach reserve at the hold. The victim's turn changes
    // both the wrist attitude and its offset from the retained skin point.
    // Move alongside on the water plane when that change draws the held
    // wrist outside the current shoulder's reach.
    const drawAlongside = (
      posture: IAutoMovieMotionHumanPosture,
      wrist: IAutoMovieVector3,
      reach: number,
    ): IAutoMovieMotionHumanPosture => {
      const shoulder: IAutoMovieVector3 =
        shoulderAt(posture).get("leftUpperArm")!.worldPosition;
      const delta: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
        wrist,
        shoulder,
      );
      const flat: number = Math.hypot(delta.x, delta.z);
      const limit: number = Math.sqrt(Math.max(0, reach ** 2 - delta.y ** 2));
      if (flat <= limit) return posture;
      const share: number = 1 - limit / flat;
      return AquaticPosture.translate(posture, {
        x: posture.root.x + delta.x * share,
        y: posture.root.y,
        z: posture.root.z + delta.z * share,
      });
    };
    // The near arm reaches from its last crawl stroke to the victim's
    // sternum as one admitted course and holds it through the tow
    // (`courseArmGoal`); the victim never reads the rescuer.
    const opening: IAutoMovieMotionHumanPosture = swimming.posture(arrive);
    const rest = AquaticPosture.rest(body, opening, "left");
    const course = (): IAutoMovieMotionHumanActionPlan =>
      courseArmGoal({
        context,
        plan: swimming,
        side: "left",
        rest,
        span: { start: arrive, ready: hold, relax: duration, end: duration },
      });
    // Resolve the cue on a provisional course so the victim can align its
    // takeover to it. Rebuild the arm trajectory after both actions have
    // been placed, when the victim's moving sternum can be read.
    const preliminary: IAutoMovieMotionHumanActionPlan = course();
    let read: IAutoMovieMotionHumanActionPlan["posture"] = preliminary.posture;
    return {
      ...preliminary,
      posture: (...args): IAutoMovieMotionHumanPosture => {
        const posture = read(...args);
        const [seconds, channels] = args;
        if (
          seconds < arrive ||
          (channels !== undefined && !channels.includes("leftHand"))
        )
          return posture;
        // Form the fingers in their own channel. The long fingers extend over
        // the victim's curved chest while the thumb and solved wrist hold
        // their course.
        const extension: number =
          AutoMovieEngineMotionSampling.minimumJerkShare(
            Math.min(1, (seconds - arrive) / (hold - arrive)),
          );
        return {
          ...posture,
          joints: { ...posture.joints, ...fingers(extension) },
        };
      },
      prepare: (): void => {
        plannedGrip = holdWorld;
        reachAtHold = Math.max(
          AutoMovieEngineVector3.distance(
            shoulderAt(bodyAt(hold)).get("leftUpperArm")!.worldPosition,
            holdWorld(hold).wrist,
          ),
          body.measure.upperArm +
            body.measure.forearm -
            body.measure.forearmRadius,
        );
        const coupled = course();
        coupled.prepare?.();
        read = coupled.posture;
      },
    };
  }

  /*
   * The victim: face up, carried along the tow from the rescuer's hold.
   */
  export function towed(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry } = context;
    partnerOf(context);
    const tow: ITow = plan(entry.posture.root, edgeOf(context));
    const back: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: -60, neck: 10 },
        { hip: 20, knee: 20, shoulder: 14, raise: 8, elbow: 70 },
      ),
    );
    const lie: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      entry.posture,
      back,
    );
    const mouthAt = HumanTrunk.preparePoint(body, "mouth");
    const sternumAt = HumanTrunk.preparePoint(body, "sternum");
    const first = sternumAt(lie(0));
    const settled = lie(1);
    const settledMouth: number = mouthAt(settled).y;
    const settledSternum: IAutoMovieVector3 = sternumAt(settled);
    const duration: number = tow.seconds;
    return {
      duration,
      contacts: [],
      events: [
        { name: "held", share: 0 },
        { name: "arrive", share: 1 },
      ],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.max(0, Math.min(duration, seconds));
        const settling: boolean = t < AquaticRescueBounds.GRIP;
        const share: number = t / AquaticRescueBounds.GRIP;
        const shape = lie(share);
        // Leave the distress arm press as the hold closes. The wrists drop
        // before the trunk rolls, then travel with its chest as it reclines.
        const arms = settling ? lie(3 * share).joints : shape.joints;
        const shaped: IAutoMovieMotionHumanPosture = {
          ...shape,
          joints: {
            ...shape.joints,
            leftUpperArm: arms.leftUpperArm,
            rightUpperArm: arms.rightUpperArm,
            leftLowerArm: arms.leftLowerArm,
            rightLowerArm: arms.rightLowerArm,
            leftHand: arms.leftHand,
            rightHand: arms.rightHand,
          },
        };
        const where: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          { ...tow.from, y: 0 },
          AutoMovieEngineVector3.scale(tow.toward, along(tow, t)),
        );
        const lift: number =
          water +
          AquaticRescueBounds.CLEAR -
          (settling ? mouthAt(shaped).y : settledMouth);
        // The torso tilts about the hold instead of taking the sternum off
        // the planned horizontal tow path. The mouth still sets the height.
        const sternum: IAutoMovieVector3 = settling
          ? sternumAt(shaped)
          : settledSternum;
        return AquaticPosture.translate(shaped, {
          x: where.x + first.x - sternum.x,
          y: shaped.root.y + lift,
          z: where.z + first.z - sternum.z,
        });
      },
    };
  }

  /*
   * The tow from the victim's position to `SHORT` before the edge.
   */
  function plan(from: IAutoMovieVector3, edge: IAutoMovieVector3): ITow {
    const flat: IAutoMovieVector3 = {
      x: edge.x - from.x,
      y: 0,
      z: edge.z - from.z,
    };
    const distance: number = AutoMovieEngineVector3.length(flat);
    const length: number = Math.max(0, distance - AquaticRescueBounds.SHORT);
    return {
      from,
      toward:
        distance > 0
          ? AutoMovieEngineVector3.scale(flat, 1 / distance)
          : { x: 0, y: 0, z: 1 },
      length,
      seconds: Math.max(
        AquaticRescueBounds.GRIP,
        length / AquaticRescueBounds.TOW,
      ),
    };
  }

  /*
   * Metres along the tow at a second of it, at the tow speed with a
   * minimum-jerk start and stop.
   */
  function along(tow: ITow, t: number): number {
    return (
      tow.length *
      AutoMovieEngineMotionSampling.minimumJerkShare(
        Math.min(1, Math.max(0, t / tow.seconds)),
      )
    );
  }

  /*
   * The named partner, or a refusal.
   */
  function partnerOf(
    context: AquaticPosture.Context,
  ): IAutoMovieMotionHumanPerformerReader {
    const partner: string | undefined = context.params.partner;
    if (partner === undefined)
      throw new AutoMovieMotionHumanRefusal({
        kind: "participant",
        axis: "partner",
        value: null,
        reason: "a rescue joins a rescuer and a victim",
        fix: "name the other performer in partner",
      });
    return context.performer(partner);
  }

  /*
   * The edge the tow heads for, or a refusal.
   */
  function edgeOf(context: AquaticPosture.Context): IAutoMovieVector3 {
    const at: IAutoMovieVector3 | undefined = context.params.at;
    if (at === undefined)
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "at",
        value: null,
        reason: "a tow heads for a named edge or shore",
        fix: "give the edge point in at",
      });
    return at;
  }
}

/*
 * The rescue's shared geometry, read the same way by the rescuer and the
 * victim.
 */
interface ITow {
  /*
   * The victim's root at the hold, world metres.
   */
  from: IAutoMovieVector3;

  /*
   * Unit horizontal direction toward the edge.
   */
  toward: IAutoMovieVector3;

  /*
   * Metres the victim travels.
   */
  length: number;

  /*
   * Seconds the tow takes.
   */
  seconds: number;
}

/*
 * The rescuer's hold and the victim's colliders in world coordinates.
 */
interface IHoldWorld {
  /*
   * The wrist on the victim's sternum, world metres.
   */
  wrist: IAutoMovieVector3;

  /*
   * The hand's world rotation, its palm into the sternum.
   */
  rotation: IAutoMovieQuaternion;

  /*
   * The palm's point in the hand's frame, the contact the goal lays.
   */
  contact: IAutoMovieVector3;

  /*
   * The victim's colliders where the hold is taken, placed in the world.
   */
  rests: readonly IAutoMovieMotionHumanColliders.IPlaced[];

  /*
   * The world point the elbow bends toward.
   */
  bend: IAutoMovieVector3;
}
