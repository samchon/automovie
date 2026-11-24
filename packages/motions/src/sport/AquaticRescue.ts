import {
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
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

import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanHand } from "../posture/HumanHand";
import { AquaticPosture } from "./AquaticPosture";
import { AquaticRescueBounds } from "./AquaticRescueBounds";

/**
 * The rescue's shared geometry, read the same way by the rescuer and the
 * victim.
 */
interface ITow {
  /** The victim's root at the hold, world metres. */
  from: IAutoMovieVector3;

  /** Unit horizontal direction toward the edge. */
  toward: IAutoMovieVector3;

  /** Metres the victim travels. */
  length: number;

  /** Seconds the tow takes. */
  seconds: number;
}

/** The rescuer's hold in the world, read once where the hold is taken. */
interface IHoldWorld {
  /** The wrist on the victim's sternum, world metres. */
  wrist: IAutoMovieVector3;

  /** The hand's world rotation, its palm into the sternum. */
  rotation: IAutoMovieQuaternion;

  /** The palm's point in the hand's frame, the contact the goal lays. */
  contact: IAutoMovieVector3;

  /** The victim's colliders where the hold is taken, placed in the world. */
  rests: readonly IAutoMovieMotionHumanColliders.IPlaced[];

  /** The world point the elbow bends toward. */
  bend: IAutoMovieVector3;
}

/**
 * A water rescue as the American Red Cross Lifeguarding manual describes it:
 * the rescuer swims to the victim, takes a cross-chest hold from behind and
 * tows on the side with a scissor kick to a named edge. The victim's root moves
 * from where it struggled toward the edge at the tow speed, face up with the
 * mouth clear of the water; the rescuer keeps `BEHIND` behind it and lays the
 * near arm across its chest. Both read the same tow from the victim's struggle
 * position and the edge, so neither samples the other's plan: the rescuer reads
 * only the victim's displayed chest.
 */
export namespace AquaticRescue {
  /** The rescuer: approach, hold and tow. */
  export function rescuer(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params, start } = context;
    const victim: IAutoMovieMotionHumanPerformerReader = partnerOf(context);
    const from: IAutoMovieVector3 = victim.root(start).position;
    const tow: ITow = plan(from, edgeOf(context));
    const behind: IAutoMovieVector3 = Vector3.subtract(
      from,
      Vector3.scale(tow.toward, AquaticRescueBounds.BEHIND),
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
        ? Vector3.add(behind, {
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
      throw new HumanRefusal({
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
          { shoulder: 95 + 60 * stroke },
          { shoulder: 95 - 60 * stroke },
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
        { pitch: 70, roll: 80, neck: -10 },
        { hip: 30, knee: 40, shoulder: 60, raise: 30, elbow: 70 },
      ),
    );
    const turn: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      swim,
      side,
    );
    const hipsAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["hips"]);
    // The body without the holding arm's goal.
    const bodyAt: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, seconds));
      const shaped: IAutoMovieMotionHumanPosture =
        t < arrive ? swimAt(t) : turn((t - arrive) / AquaticRescueBounds.GRIP);
      const where: IAutoMovieVector3 =
        t < arrive
          ? Vector3.lerp(
              { ...entry.posture.root, y: 0 },
              { ...standoff, y: 0 },
              t / arrive,
            )
          : t < hold
            ? Vector3.lerp(
                { ...standoff, y: 0 },
                { ...behind, y: 0 },
                minimumJerk.share((t - arrive) / AquaticRescueBounds.GRIP),
              )
            : Vector3.add(
                { ...behind, y: 0 },
                Vector3.scale(tow.toward, along(tow, t - hold)),
              );
      const hips: IAutoMovieVector3 = hipsAt(shaped).get("hips")!.worldPosition;
      const placed: IAutoMovieMotionHumanPosture = AquaticPosture.translate(
        shaped,
        Vector3.add(shaped.root, {
          x: where.x - hips.x,
          y: water - 0.15 - hips.y,
          z: where.z - hips.z,
        }),
      );
      if (t < arrive) return placed;
      // The legs scissor under the side-lying rescuer, the kick growing in
      // as the turn onto the side is taken, so the legs move on from the
      // crawl's without a jump.
      const k: number = minimumJerk.share(
        Math.min(1, (t - arrive) / AquaticRescueBounds.GRIP),
      );
      const swing: number =
        k * Math.sin((2 * Math.PI * (t - arrive)) / AquaticRescueBounds.KICK);
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
        return [x + degrees, y, z];
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
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const shaped: IAutoMovieMotionHumanPosture = bodyAt(seconds);
        return seconds < arrive
          ? shaped
          : {
              ...shaped,
              limbs: { ...shaped.limbs, leftArm: grip(shaped, seconds) },
            };
      },
    };

    // The hold rides the rescuer's own chest: the victim's displayed
    // sternum and body are read once, where the hold is taken, and kept in
    // the rescuer's chest frame, so the hand goes with the pair through the
    // tow without reading the victim at a later second. During the reach the
    // rescuer still closes in from the standoff while the victim stays where
    // it was in the world, so each frame of the reach puts the hold in that
    // frame's chest; from the hold on, in the hold's. The upper arm of the
    // side-lying rescuer drapes over the victim's shoulder, the elbow back
    // toward the rescuer.
    let world: IHoldWorld | undefined;
    const holdWorld = (): IHoldWorld => {
      if (world !== undefined) return world;
      const sternum: IAutoMovieHumanoidSurfaces.IFrame =
        victim.body.surfaces.regions.sternum;
      const placed: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> =
        resolveAutoMovieHumanoidSurfaces.place(
          sternum,
          victim
            .bones(start + hold, new Set([sternum.bone]))
            .get(sternum.bone)!,
        );
      const chest: IAutoMovieVector3 = placed.point;
      // The palm lies on the sternum, facing into it, the fingers across
      // the victim's chest: the hand rests on the skin, not in it.
      const palm: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
        body,
        "left",
        "palm",
      );
      const across: IAutoMovieVector3 = Vector3.normalize(
        Vector3.cross(placed.normal, tow.toward),
      );
      const rotation: IAutoMovieQuaternion = HumanHand.align(palm, {
        normal: Vector3.scale(placed.normal, -1),
        forward: across,
      });
      world = {
        wrist: Vector3.subtract(
          chest,
          Quaternion.rotateVector(rotation, palm.point),
        ),
        rotation,
        contact: palm.point,
        rests: HumanColliders.placed(
          victim.body,
          victim.bones(start + hold, HumanColliders.bones(victim.body)),
        ),
        bend: Vector3.add(
          Vector3.subtract(chest, Vector3.scale(tow.toward, 0.25)),
          {
            x: 0,
            y: 0.1,
            z: 0,
          },
        ),
      };
      return world;
    };
    // The hold in the rescuer's chest frame `own`.
    const inFrame = (own: IAutoMovieResolvedBone): IAutoMovieHumanLimbGoal => {
      const w: IHoldWorld = holdWorld();
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(
        own.worldRotation,
      );
      const local: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
        point: IAutoMovieVector3,
      ): IAutoMovieVector3 =>
        Quaternion.rotateVector(
          inverse,
          Vector3.subtract(point, own.worldPosition),
        );
      return {
        on: "chest",
        point: local(w.wrist),
        rotation: Quaternion.multiply(inverse, w.rotation),
        contact: w.contact,
        // The victim's body, as it was where the hold was taken, rides the
        // rescuer's chest with the hand: the arm keeps clear of it on its way
        // and lays the hand on it.
        clearanceOn: {
          clear: [],
          rests: w.rests.map(
            (
              segment: IAutoMovieMotionHumanColliders.IPlaced,
            ): IAutoMovieMotionHumanColliders.IPlaced => ({
              ...segment,
              pose: {
                position: local(segment.pose.position),
                rotation: Quaternion.multiply(inverse, segment.pose.rotation),
              },
            }),
          ),
        },
        bend: local(w.bend),
      };
    };
    let held: IAutoMovieHumanLimbGoal | undefined;
    const grip = (
      shaped: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieHumanLimbGoal =>
      seconds < hold
        ? inFrame(chestAt(shaped).get("chest")!)
        : (held ??= inFrame(chestAt(bodyAt(hold)).get("chest")!));
    const chestAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["chest"]);
    // The near arm reaches from its last crawl stroke to the victim's
    // sternum as one admitted course and holds it through the tow
    // (`courseArmGoal`); the victim never reads the rescuer.
    const opening: IAutoMovieMotionHumanPosture = swimming.posture(arrive);
    return courseArmGoal({
      context,
      plan: swimming,
      side: "left",
      rest: AquaticPosture.rest(body, opening, "left"),
      span: { start: arrive, ready: hold, relax: duration, end: duration },
    });
  }

  /** The victim: face up, carried along the tow from the rescuer's hold. */
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
        { hip: 20, knee: 20, shoulder: 10, raise: 20, elbow: 20 },
      ),
    );
    const lie: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      entry.posture,
      back,
    );
    const mouthAt = (posture: IAutoMovieMotionHumanPosture): number =>
      HumanTrunk.region(body, posture, "mouth").point.y;
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
        const shaped: IAutoMovieMotionHumanPosture = lie(
          t / AquaticRescueBounds.GRIP,
        );
        const where: IAutoMovieVector3 = Vector3.add(
          { ...tow.from, y: 0 },
          Vector3.scale(tow.toward, along(tow, t)),
        );
        const lift: number =
          water + AquaticRescueBounds.CLEAR - mouthAt(shaped);
        return AquaticPosture.translate(shaped, {
          x: where.x,
          y: shaped.root.y + lift,
          z: where.z,
        });
      },
    };
  }

  /** The tow from the victim's position to `SHORT` before the edge. */
  function plan(from: IAutoMovieVector3, edge: IAutoMovieVector3): ITow {
    const flat: IAutoMovieVector3 = {
      x: edge.x - from.x,
      y: 0,
      z: edge.z - from.z,
    };
    const distance: number = Vector3.length(flat);
    const length: number = Math.max(0, distance - AquaticRescueBounds.SHORT);
    return {
      from,
      toward:
        distance > 0 ? Vector3.scale(flat, 1 / distance) : { x: 0, y: 0, z: 1 },
      length,
      seconds: Math.max(
        AquaticRescueBounds.GRIP,
        length / AquaticRescueBounds.TOW,
      ),
    };
  }

  /**
   * Metres along the tow at a second of it, at the tow speed with a
   * minimum-jerk start and stop.
   */
  function along(tow: ITow, t: number): number {
    return (
      tow.length * minimumJerk.share(Math.min(1, Math.max(0, t / tow.seconds)))
    );
  }

  /** The named partner, or a refusal. */
  function partnerOf(
    context: AquaticPosture.Context,
  ): IAutoMovieMotionHumanPerformerReader {
    const partner: string | undefined = context.params.partner;
    if (partner === undefined)
      throw new HumanRefusal({
        kind: "participant",
        axis: "partner",
        value: null,
        reason: "a rescue joins a rescuer and a victim",
        fix: "name the other performer in partner",
      });
    return context.performer(partner);
  }

  /** The edge the tow heads for, or a refusal. */
  function edgeOf(context: AquaticPosture.Context): IAutoMovieVector3 {
    const at: IAutoMovieVector3 | undefined = context.params.at;
    if (at === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "at",
        value: null,
        reason: "a tow heads for a named edge or shore",
        fix: "give the edge point in at",
      });
    return at;
  }
}
