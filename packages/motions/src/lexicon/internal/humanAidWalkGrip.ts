import { Quaternion, Vector3, AutoMovieEnginePhysics, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieAffordance, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanAidWalk, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanMountRider, IAutoMovieMotionHumanPosture, IAutoMoviePhysicalShape, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";
import type { HumanRideHands } from "./HumanRideHands";

/*
 * Fit one grip per hand for a complete staged floor-aid course.
 */
export namespace humanAidWalkGrip {
  /*
   * One sampled instant of the aided walk: the aid's displayed floor frame and
   * the body's planned posture.
   */
  export interface IStation {
    /*
     * The aid's world frame, metres.
     */
    frame: IAutoMovieRigidTransform;

    /*
     * The walker's posture at that instant.
     */
    body: IAutoMovieMotionHumanPosture;
  }

  /*
   * Named hand contact and its prepared digit closure.
   */
  export interface IHand {
    /*
     * Holding side.
     */
    side: AutoMovieHumanSide;

    /*
     * Model-space grip.
     */
    affordance: IAutoMovieAffordance;

    /*
     * Distance along the actual grip rod from its centre.
     */
    offset: number;

    /*
     * Hand approach about the grip axis, in degrees.
     */
    angle: number;

    /*
     * The crutch user's wrist-relative palm used to seat it on the rod.
     */
    palm?: IAutoMovieMotionHumanHand.IFrame;

    /*
     * Fitted closure over the actual grip collider.
     */
    digits: IAutoMovieMotionHumanPosture["joints"];
  }

  /*
   * Convert a model grip into the world grip role the native holding solver
   * expects.
   */
  export function target(
    contact: IAutoMovieAffordance,
    world: IAutoMovieRigidTransform,
    offset: number,
    angle: number,
    palm?: IAutoMovieMotionHumanHand.IFrame,
  ): HumanRideHands.IMaterialGrip {
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      world.rotation,
      contact.frame.rotation,
    );
    return {
      point: Vector3.add(
        Vector3.add(
          world.position,
          Quaternion.rotateVector(world.rotation, contact.frame.translation),
        ),
        Quaternion.rotateVector(rotation, { x: 0, y: 0, z: offset }),
      ),
      normal: Quaternion.rotateVector(
        Quaternion.multiply(
          rotation,
          Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, angle),
        ),
        { x: 0, y: 1, z: 0 },
      ),
      axis: Quaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 }),
      radius: (contact.aperture ?? 0) / 2,

      // The existing surface-aligned hand fit reads this wrist-relative frame.
      ...(palm === undefined ? {} : { reinPalm: palm }),
    };
  }

  /*
   * Select a sustainable approach and close the fingers over the model solid.
   */
  export function fit(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanPosture,
    subject: string,
    shapes: readonly IAutoMoviePhysicalShape[],
    affordances: readonly IAutoMovieAffordance[],
    start: IAutoMovieRigidTransform,
    kind: IAutoMovieMotionHumanAidWalk["kind"],
    sides: readonly AutoMovieHumanSide[],
    stations: readonly IStation[],
    refuse: (axis: string, value: unknown, reason: string) => never,
  ): readonly IHand[] {
    const walker: boolean = kind === "walker";
    return sides.map((side: AutoMovieHumanSide): IHand => {
      const id: string = walker ? `${side}Grip` : "grip";
      const affordance: IAutoMovieAffordance | undefined = affordances.find(
        (value: IAutoMovieAffordance): boolean =>
          value.id === id && value.kind === "handle",
      );
      if (affordance === undefined)
        return refuse("prop", subject, `the placed aid does not declare ${id}`);
      const length: number = affordance.length ?? 0;
      const offsets: readonly number[] = walker
        ? [0, -1, 1, -2, 2, -3, 3].map((step): number => (step * length) / 8)
        : [0];
      const angles: readonly number[] = walker
        ? [0, -15, 15, -30, 30, -45, 45, -60, 60, -75, 75, -90, 90]
        : [0];
      const palm: IAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.regions[side === "left" ? "palmLeft" : "palmRight"];
      const measured: IAutoMovieMotionHumanHand.IFrame | undefined =
        kind === "crutch" ? HumanHand.offset(body, side, "palm") : undefined;
      const center: IAutoMovieVector3 = target(affordance, start, 0, 0).point;
      const solid: IAutoMoviePhysicalShape | undefined = shapes.reduce<
        IAutoMoviePhysicalShape | undefined
      >(
        (best, shape): IAutoMoviePhysicalShape =>
          best === undefined ||
          AutoMovieEnginePhysics.physicalShapeSegmentDistance(start, shape, center, center) <
            AutoMovieEnginePhysics.physicalShapeSegmentDistance(start, best, center, center)
            ? shape
            : best,
        undefined,
      );
      if (solid === undefined)
        return refuse(id, subject, "the grip has no physical rod");
      const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set([
        palm.bone,
      ]);
      let miss: number = Infinity;
      for (const offset of offsets)
        for (const angle of angles) {
          let worst: number = 0;
          for (const station of stations) {
            const selected: IAutoMovieMotionHumanMountRider.IHoldGrip = target(
              affordance,
              station.frame,
              offset,
              angle,
              measured,
            );
            const { arm }: IAutoMovieMotionHumanMountRider.IHoldResult =
              HumanMountRider.hold(body, side, station.body, selected, 1, {});
            const posed: IAutoMovieMotionHumanPosture = {
              ...station.body,
              limbs: { ...station.body.limbs, [`${side}Arm`]: arm },
            };
            const wrist: IAutoMovieResolvedBone = poseBones(
              body,
              resolveHumanPosture(body, posed),
              undefined,
              requested,
            ).get(`${side}Hand`)!;
            const contact: IAutoMovieVector3 =
              AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(palm, wrist);
            worst = Math.max(
              worst,
              Math.abs(
                AutoMovieEnginePhysics.physicalShapeSegmentDistance(
                  station.frame,
                  solid,
                  contact,
                  contact,
                ),
              ),
            );
            if (worst > GRIP_GAP) break;
          }
          miss = Math.min(miss, worst);
          if (worst <= GRIP_GAP)
            return {
              side,
              affordance,
              offset,
              angle,
              ...(measured === undefined ? {} : { palm: measured }),
              digits: HumanMountRider.closed(
                body,
                side,
                entry,
                target(affordance, start, offset, angle, measured),
                shapes,
                start,
              ),
            };
        }
      return refuse(
        id,
        miss,
        `the modeled grips miss by at least ${(miss * 1000).toFixed(1)} mm`,
      );
    });
  }
}

/*
 * Palm-to-rod stage admission in world metres.
 */
const GRIP_GAP: number = 0.01;
