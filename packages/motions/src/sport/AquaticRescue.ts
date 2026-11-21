import {
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanRefusal } from "../law/HumanRefusal";
import { AquaticPosture } from "./AquaticPosture";

/** A lifeguard's approach swim, metres per second: provisional, a sustained sprint front crawl. */
const SWIM: number = 1.2;

/** The tow, metres per second: provisional, inside the 0.4 to 1.0 m/s rescue band. */
const TOW: number = 0.6;

/** Seconds to take the cross-chest hold once alongside: provisional. */
const GRIP: number = 0.6;

/** The rescuer's chest behind the victim's back during the tow, metres: provisional. */
const BEHIND: number = 0.35;

/** The victim stops this far short of the edge, metres: a reach for the deck. */
const SHORT: number = 0.5;

/** The towed victim's mouth above the surface, metres: provisional. */
const CLEAR: number = 0.08;

/** Seconds of one front-crawl arm cycle on the approach: provisional. */
const STROKE: number = 1.2;

/** Seconds of one scissor kick: provisional. */
const KICK: number = 1;

/** The rescue's shared geometry, read the same way by the rescuer and the victim. */
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

/**
 * A water rescue as the American Red Cross Lifeguarding manual describes it:
 * the rescuer swims to the victim, takes a cross-chest hold from behind and
 * tows on the side with a scissor kick to a named edge. The victim's root
 * moves from where it struggled toward the edge at the tow speed, face up
 * with the mouth clear of the water; the rescuer keeps `BEHIND` behind it
 * and lays the near arm across its chest. Both read the same tow from the
 * victim's struggle position and the edge, so neither samples the other's
 * plan: the rescuer reads only the victim's displayed chest.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the source, the shared tow, the speeds, the hold and the refusal.
 * @evidence contracts/development/design.md#principled-representation One closed-form tow both performers derive from the victim's position and the edge.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the rescuer's and the towed victim's tow; the struggle and exit are other kinds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The rescuer's hand reaches the victim's displayed chest, not a planned stand-in.
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
      Vector3.scale(tow.toward, BEHIND),
    );
    const approach: number = Math.hypot(
      behind.x - entry.posture.root.x,
      behind.z - entry.posture.root.z,
    );
    const limit: number = params.seconds ?? Infinity;
    if (approach / SWIM > limit)
      throw new HumanRefusal({
        kind: "reach",
        axis: "partner",
        value: params.partner ?? null,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: SWIM * limit,
          unit: "m",
        },
        reason: `the victim is ${approach.toFixed(2)} m away, beyond the ${(SWIM * limit).toFixed(2)} m a rescuer swims in ${limit} s`,
        fix: "start the rescuer nearer, or allow more time before submersion",
      });
    const arrive: number = approach / SWIM;
    const hold: number = arrive + GRIP;
    const duration: number = hold + tow.seconds;
    // The approach is a front crawl: the arms recover over the water in turn.
    const swimAt = (t: number): IAutoMovieMotionHumanPosture => {
      const stroke: number = Math.sin((2 * Math.PI * t) / STROKE);
      return AquaticPosture.key(
        entry.posture,
        ExerciseKey.from(
          body,
          { pitch: 80, neck: -20 },
          { hip: 5, knee: 10, raise: 20, elbow: 20 },
          { shoulder: 100 + 70 * stroke },
          { shoulder: 100 - 70 * stroke },
        ),
      );
    };
    const swim: IAutoMovieMotionHumanPosture = swimAt(approach / SWIM);
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
    return {
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
        const t: number = Math.max(0, Math.min(duration, seconds));
        const shaped: IAutoMovieMotionHumanPosture =
          t < arrive ? swimAt(t) : turn((t - arrive) / GRIP);
        const where: IAutoMovieVector3 =
          t < arrive
            ? Vector3.lerp(
                { ...entry.posture.root, y: 0 },
                { ...behind, y: 0 },
                t / arrive,
              )
            : Vector3.add(
                { ...behind, y: 0 },
                Vector3.scale(tow.toward, along(tow, t - hold)),
              );
        const hips: IAutoMovieVector3 =
          hipsAt(shaped).get("hips")!.worldPosition;
        const placed: IAutoMovieMotionHumanPosture = AquaticPosture.translate(
          shaped,
          Vector3.add(shaped.root, {
            x: where.x - hips.x,
            y: water - 0.15 - hips.y,
            z: where.z - hips.z,
          }),
        );
        if (t < arrive) return placed;

        // The near hand lies on the victim's displayed sternum, the arm across the chest.
        const sternum: IAutoMovieHumanoidSurfaces.IFrame =
          victim.body.surfaces.regions.sternum;
        const chest: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
          sternum,
          victim.bones(start + t, new Set([sternum.bone])).get(sternum.bone)!,
        ).point;
        // The legs scissor under the side-lying rescuer.
        const swing: number = Math.sin((2 * Math.PI * (t - arrive)) / KICK);
        const legs: IAutoMovieMotionHumanPosture["joints"] = ExerciseKey.from(
          body,
          {},
          {},
          { hip: 20 + 25 * swing, knee: 30 + 20 * swing },
          { hip: 20 - 25 * swing, knee: 30 - 20 * swing },
        ).joints;
        return {
          ...placed,
          joints: {
            ...placed.joints,
            leftUpperLeg: legs.leftUpperLeg,
            rightUpperLeg: legs.rightUpperLeg,
            leftLowerLeg: legs.leftLowerLeg,
            rightLowerLeg: legs.rightLowerLeg,
          },
          limbs: {
            ...placed.limbs,
            rightArm: { point: chest, bend: { ...chest, y: chest.y - 0.25 } },
          },
        };
      },
    };
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
        const shaped: IAutoMovieMotionHumanPosture = lie(t / GRIP);
        const where: IAutoMovieVector3 = Vector3.add(
          { ...tow.from, y: 0 },
          Vector3.scale(tow.toward, along(tow, t)),
        );
        const lift: number = water + CLEAR - mouthAt(shaped);
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
    const length: number = Math.max(0, distance - SHORT);
    return {
      from,
      toward:
        distance > 0 ? Vector3.scale(flat, 1 / distance) : { x: 0, y: 0, z: 1 },
      length,
      seconds: Math.max(GRIP, length / TOW),
    };
  }

  /** Metres along the tow at a second of it, at the tow speed with a minimum-jerk start and stop. */
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
