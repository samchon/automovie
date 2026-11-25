import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropDrive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { unloadedFoot } from "../carrier/unloadedFoot";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanFoot } from "../posture/HumanFoot";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { AquaticCrew } from "./AquaticCrew";
import { AquaticPosture } from "./AquaticPosture";
import { AquaticProp } from "./AquaticProp";
import { AquaticSailBounds } from "./AquaticSailBounds";

/**
 * The tack's posture by time: the crew crouched below the boom or standing back
 * up, each foot crossing the cockpit in front of the standing shank and bearing
 * on its ball through its swing (the forefoot rocker, Perry and Burnfield), the
 * pelvis carried across the deck, and each hand on its handle where the drives
 * put it, read from the courses the plan laid.
 *
 * Part of `AquaticSail.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `plan`.
 */
export function AquaticSailPosture(
  prepared: AquaticSailPosture.IPrepared,
): IAutoMovieMotionHumanActionPlan {
  const {
    duration,
    contacts,
    drives,
    leadStart,
    leadEnd,
    aborted,
    trailStart,
    trailEnd,
    deck,
    upright,
    body,
    initialSide,
    helm,
    hull,
    lead,
    trail,
    swing,
    cross,
    clearance,
    ahead,
    passing,
    hips,
    hipsAt,
    context,
    plants,
    legsAt,
    controls,
    carrier,
    shouldersAt,
  }: AquaticSailPosture.IPrepared = prepared;
  return {
    duration,
    contacts,
    drives,
    events: [
      { name: "helmIn", share: AquaticSailBounds.HELM_IN },
      { name: "leadLift", share: leadStart },
      { name: "leadPlant", share: leadEnd },
      { name: aborted ? "abort" : "trailLift", share: trailStart },
      { name: "settle", share: trailEnd },
      { name: "relax", share: 1 },
    ],
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, seconds));
      const u: number = t / duration;
      const first: number = AquaticCrew.span(u, leadStart, leadEnd);
      const second: number = AquaticCrew.span(u, trailStart, trailEnd);
      const stride: number = aborted ? first - second : (first + second) / 2;
      // Sailors on a dinghy's own cockpit floor stay crouched below the
      // boom after the maneuver; on a generic hull they stand back up.
      const lower: number =
        AquaticCrew.span(u, 0, AquaticSailBounds.HELM_IN) *
        (deck ? 1 : 1 - AquaticCrew.span(u, trailEnd, 0.98));
      const trunk: IAutoMovieMotionHumanPosture = AquaticPosture.key(
        upright,
        ExerciseKey.from(
          body,
          {
            pitch: 9 + 28 * lower,
            roll: initialSide * (9 - 18 * stride),
            spine: [9 * lower, 0, (helm ? 20 : 10) * stride],
            neck: -12 * lower,
          },
          {
            hip: 23 + 60 * lower,
            knee: 28 + 75 * lower,
            shoulder: 36,
            raise: 28,
            elbow: 65,
          },
        ),
      );
      const leadX: number = aborted ? first - second : first;
      const trailX: number = aborted ? 0 : second;
      const leadBase: IAutoMovieVector3 = hull.feet[lead];
      const trailBase: IAutoMovieVector3 = hull.feet[trail];
      const leadSwing: number =
        swing(u, leadStart, leadEnd) +
        (aborted ? swing(u, trailStart, trailEnd) : 0);
      const trailSwing: number = aborted ? 0 : swing(u, trailStart, trailEnd);
      // Both feet cross the cockpit by the same `cross`, so each swing
      // passes the standing foot's place: it steps across in front of the
      // standing shank, out by two shank radii and the skin's give at its
      // swing's middle, never through it.
      const footA: IAutoMovieVector3 = Vector3.add(
        {
          ...leadBase,
          x: leadBase.x + cross * leadX,
          y: leadBase.y + clearance * leadSwing,
        },
        Vector3.scale(ahead, passing * leadSwing),
      );
      const footB: IAutoMovieVector3 = Vector3.add(
        {
          ...trailBase,
          x: trailBase.x + cross * trailX,
          y: trailBase.y + clearance * trailSwing,
        },
        Vector3.scale(ahead, passing * trailSwing),
      );
      const carriedHips: IAutoMovieVector3 = {
        ...hips,
        x: hips.x + cross * (aborted ? 0.48 : 1) * stride,
        y: hips.y - body.measure.stature * AquaticSailBounds.CROUCH * lower,
      };
      // The pelvis crosses the deck. Counter the offset from rotating the
      // floor-origin rig to duck, so pitch and yaw do not move it off that path.
      const offset: IAutoMovieVector3 = Vector3.subtract(
        hipsAt(trunk).get("hips")!.worldPosition,
        trunk.root,
      );
      const root: IAutoMovieVector3 = Vector3.subtract(
        carriedHips,
        Quaternion.rotateVector(hull.inverse, offset),
      );
      let posture: IAutoMovieMotionHumanPosture = AquaticCrew.apply(
        context,
        hull,
        t,
        trunk,
        root,
        lead === "left" ? footA : footB,
        lead === "right" ? footA : footB,
      );
      if (deck) {
        // On a deck the forefoot bears, as on a crouched dinghy stance;
        // a foot is planted while its bearing window is open.
        for (const side of ["left", "right"] as const) {
          const leg: AquaticCrew.Leg = `${side}Leg`;
          const window: IAutoMovieMotionHumanContactWindow | undefined =
            plants.find(
              (contact: IAutoMovieMotionHumanContactWindow): boolean =>
                contact.part === `${side}Foot` &&
                contact.from <= u &&
                u <= contact.to,
            );
          // The foot bears on its ball through its swing, so it leaves and
          // meets the deck without a jump. Unloaded, it
          // turns toes down as far as its ankle would otherwise dorsiflex
          // past a weightless ankle's limit. The heel rises into that turn
          // over the last `EASE` of a plant before a lift and lowers out
          // of it over the first `EASE` after a landing, as weight leaves
          // and returns to the foot.
          const near = (seconds: number): number =>
            1 - Math.min(1, Math.max(0, seconds) / AquaticSailBounds.EASE);
          const weight: number =
            window === undefined
              ? 1
              : Math.max(
                  window.to < 1 ? near((window.to - u) * duration) : 0,
                  window.from > 0 ? near((u - window.from) * duration) : 0,
                );
          const mtp: IAutoMovieVector3 = HumanFoot.offset(body, side, "mtp");
          const goal: IAutoMovieHumanLimbGoal = {
            ...posture.limbs[leg]!,
            contact: HumanFoot.offset(body, side, "ball"),
            planted: window !== undefined,
          };
          if (weight === 0 || goal.rotation === undefined) {
            posture.limbs[leg] = goal;
            continue;
          }
          const turned: IAutoMovieHumanLimbGoal = unloadedFoot(
            body,
            legsAt(posture).get(`${side}UpperLeg`)!.worldPosition,
            goal,
            weight,
          );
          // The heel rises about the toes' joint, which stays where the
          // flat foot puts it, and the toes extend at it by as much as the
          // foot turned, so they stay flat and still on the deck: the
          // forefoot rocker (Perry and Burnfield). The ankle and the
          // knee's hint move instead.
          const shift: IAutoMovieVector3 = Vector3.subtract(
            Quaternion.rotateVector(goal.rotation, mtp),
            Quaternion.rotateVector(turned.rotation!, mtp),
          );
          posture.joints = {
            ...posture.joints,
            [`${side}Toes`]: [
              Math.max(
                0,
                HumanFoot.pitch(goal.rotation) -
                  HumanFoot.pitch(turned.rotation!),
              ),
              0,
              0,
            ],
          };
          posture.limbs[leg] = {
            ...turned,
            point: Vector3.add(turned.point, shift),
            ...(turned.bend === undefined
              ? {}
              : { bend: Vector3.add(turned.bend, shift) }),
          };
        }
        posture = lowerHumanPosture(body, posture);
      }
      if (controls.length !== 0) {
        // Pose the rig at this instant's own drive travels, so the hands
        // meet the handles where the drives put them.
        const rig: AquaticProp.IContacts = AquaticProp.at(
          carrier,
          context.start + t,
          drives.length === 0
            ? undefined
            : Object.fromEntries(
                drives.map(
                  (drive: IAutoMovieMotionPropDrive): [string, number] => [
                    drive.articulation,
                    drive.travel(t),
                  ],
                ),
              ),
        );
        // Each hand's goal is the handle where the drives put it; the arm's
        // course to it and along it is planned once (`courseArmGoal`).
        for (const control of controls) {
          const placed: AquaticProp.IContact = rig.require(
            control.handle,
            "handle",
          );
          posture.limbs[`${control.side}Arm`] = AquaticProp.hold(
            body,
            posture,
            control.side,
            placed.world,
            {
              shoulder: shouldersAt(posture).get(`${control.side}UpperArm`)!
                .worldPosition,
              length: placed.affordance.length ?? 0,
            },
          );
        }
      }
      return posture;
    },
  };
}

/** The `plan` of `AquaticSail.plan`, built from what that plan prepared. */
export namespace AquaticSailPosture {
  /** What `AquaticSail.plan` prepared for its `plan`. */
  export interface IPrepared {
    /** The `duration` `AquaticSail.plan` prepared. */
    duration: number;

    /** The `contacts` `AquaticSail.plan` prepared. */
    contacts: IAutoMovieMotionHumanContactWindow[];

    /** The `drives` `AquaticSail.plan` prepared. */
    drives: IAutoMovieMotionPropDrive[];

    /** The `leadStart` `AquaticSail.plan` prepared. */
    leadStart: number;

    /** The `leadEnd` `AquaticSail.plan` prepared. */
    leadEnd: number;

    /** The `aborted` `AquaticSail.plan` prepared. */
    aborted: boolean;

    /** The `trailStart` `AquaticSail.plan` prepared. */
    trailStart: number;

    /** The `trailEnd` `AquaticSail.plan` prepared. */
    trailEnd: number;

    /** The `deck` `AquaticSail.plan` prepared. */
    deck: boolean;

    /** The `upright` `AquaticSail.plan` prepared. */
    upright: IAutoMovieMotionHumanPosture;

    /** The `body` `AquaticSail.plan` prepared. */
    body: AquaticPosture.Context["body"];

    /** The `initialSide` `AquaticSail.plan` prepared. */
    initialSide: number;

    /** The `helm` `AquaticSail.plan` prepared. */
    helm: boolean;

    /** The `hull` `AquaticSail.plan` prepared. */
    hull: AquaticCrew.IHull;

    /** The `lead` `AquaticSail.plan` prepared. */
    lead: AquaticCrew.Side;

    /** The `trail` `AquaticSail.plan` prepared. */
    trail: AquaticCrew.Side;

    /**
     * An ankle's clearance pulse between release and replant, `AquaticSail`'s
     * `swing`: at a second, from the release, to the replant.
     */
    swing: (at: number, from: number, to: number) => number;

    /** The `cross` `AquaticSail.plan` prepared. */
    cross: number;

    /** The `clearance` `AquaticSail.plan` prepared. */
    clearance: number;

    /** The `ahead` `AquaticSail.plan` prepared. */
    ahead: IAutoMovieVector3;

    /** The `passing` `AquaticSail.plan` prepared. */
    passing: number;

    /** The `hips` `AquaticSail.plan` prepared. */
    hips: IAutoMovieVector3;

    /** The `hipsAt` `AquaticSail.plan` prepared. */
    hipsAt: ReturnType<typeof AquaticPosture.markers>;

    /** The `context` `AquaticSail.plan` prepared. */
    context: AquaticPosture.Context;

    /** The `plants` `AquaticSail.plan` prepared. */
    plants: IAutoMovieMotionHumanContactWindow[];

    /** The `legsAt` `AquaticSail.plan` prepared. */
    legsAt: ReturnType<typeof AquaticPosture.markers>;

    /** The `controls` `AquaticSail.plan` prepared. */
    controls: readonly AquaticSailBounds.IControl[];

    /** The `carrier` `AquaticSail.plan` prepared. */
    carrier: IAutoMovieMotionHumanPropReader;

    /** The `shouldersAt` `AquaticSail.plan` prepared. */
    shouldersAt: ReturnType<typeof AquaticPosture.markers>;
  }
}
