import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanFoot, IAutoMovieMotionHumanPosture, IAutoMovieVector3 } from "@automovie/interface";

import { HumanPhysics } from "../law/HumanPhysics";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/internal/resolveHumanPosture";

/**
 * A posture's static balance as `HumanBalance` reads it: the whole-body centre
 * of mass placed on one solve of the posture, the feet's bearing base, and the
 * centre's offset and margin against that base along the heading.
 */
export namespace HumanBalanceReading {
  /**
   * A posture's balance: `HumanBalance.offset` and `HumanBalance.margin`,
   * metres, and whether both heels bear.
   */
  export interface IReading {
    /**
     * How far the centre of mass lies ahead of the base's middle along the
     * heading, metres.
     */
    offset: number;

    /** The static margin of stability, metres, positive inside the base. */
    margin: number;

    /** Whether both heels bear. */
    flat: boolean;

    /**
     * Rigid backward translation to the closest reachable boundary, when
     * requested.
     */
    candidate?: number;
  }

  /**
   * A posture's balance, read on one solve of it.
   *
   * @param body The body.
   * @param posture The posture.
   * @param resolution The synchronous evaluation's FK reader.
   * @param projection The body's ROM projection of the solve.
   * @param frames The prepared bone frames, when the caller reads a fixed
   *   demand; every bone otherwise.
   * @param mass The prepared mass model, when the caller holds one; the body's
   *   own otherwise.
   * @param propose Whether to propose the rigid backward translation to the
   *   closest reachable boundary of a centre outside the base.
   * @returns The offset, margin and heel bearing, metres.
   */
  export function read(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
    projection: ReturnType<typeof prepareHumanPostureProjection>,
    frames?: ReturnType<typeof poseBones.prepare>,
    mass?: () => AutoMovieEngineKinematics.IPreparedMassModel,
    propose: boolean = false,
  ): IReading {
    const placed: IPlaced = placement(
      body,
      posture,
      resolution,
      projection,
      frames,
      mass,
    );
    const margin: number = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassMargin(
      placed.centre,
      placed.base,
    );
    const candidate: HumanPhysics.SupportOffset =
      propose && margin < 0
        ? HumanPhysics.supportOffset(
            { centre: placed.centre, points: placed.base },
            heading(posture.yaw),
          )
        : null;
    return {
      offset: projected(placed, posture.yaw),
      margin,
      ...(candidate === null ? {} : { candidate: -candidate }),

      // A heel bears within the bearing height of the lowest sole socket.
      flat: (["left", "right"] as const).every(
        (side: AutoMovieHumanSide): boolean => {
          const sockets: readonly IAutoMovieMotionHumanFoot.ISocket[] =
            placed.feet.sockets(side);
          return (
            sockets[0]!.point.y <=
            Math.min(sockets[1]!.point.y, sockets[2]!.point.y) +
              HumanFoot.BEARING
          );
        },
      ),
    };
  }

  /** Common solved geometry needed by all static balance measurements. */
  export interface IPlaced {
    /** Borrowed sole geometry bound to this trial's complete displayed FK. */
    feet: ReturnType<typeof HumanFoot.reading>;

    /** Actual whole-body mass centre in world metres. */
    centre: IAutoMovieVector3;

    /** Original foot-outline bearing points in their original order. */
    base: IAutoMovieVector3[];
  }

  /**
   * Solve once and prepare only the common mass-centre and support geometry.
   *
   * @param body The body.
   * @param posture The posture.
   * @param resolution The FK reader lent by the evaluation; a fresh native one
   *   when absent.
   * @param projection The ROM projection of the solve; the body's own when
   *   absent.
   * @param frames The prepared bone frames; every bone when absent.
   * @param mass The prepared mass model; the body's own when absent.
   * @param sides The feet whose outlines bear; both when absent.
   * @returns The feet, the mass centre and the bearing base, world metres.
   */
  export function placement(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
    frames?: ReturnType<typeof poseBones.prepare>,
    mass?: () => AutoMovieEngineKinematics.IPreparedMassModel,
    sides?: readonly AutoMovieHumanSide[],
  ): IPlaced {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const pose: ReturnType<typeof resolveHumanPosture> =
      resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        {},
        read,
        undefined,
        projection,
      ).pose;
    const bones: ReturnType<typeof poseBones> =
      frames === undefined
        ? poseBones(body, pose, read())
        : frames(pose, read());
    const feet: ReturnType<typeof HumanFoot.reading> = HumanFoot.reading(
      body,
      bones,
    );
    return {
      feet,
      centre:
        mass === undefined
          ? AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(body.massModel, bones)
          : AutoMovieEngineKinematics.prepareAutoMovieMassModelPlace(mass(), bones),
      base: feet.base(sides),
    };
  }

  /**
   * Project the same mass centre and base on the heading without a hull or heel
   * query.
   *
   * @param placed The placed centre and base.
   * @param yaw The heading, as the posture's yaw.
   * @returns How far the centre lies ahead of the base's middle, metres.
   */
  export function projected(placed: IPlaced, yaw: number): number {
    const forward: IAutoMovieVector3 = heading(yaw);
    let rear: number = Infinity;
    let front: number = -Infinity;
    for (const p of placed.base) {
      const along: number = Vector3.dot(p, forward);
      rear = Math.min(rear, along);
      front = Math.max(front, along);
    }
    return Vector3.dot(placed.centre, forward) - (rear + front) / 2;
  }

  /** World heading of a yaw, used by the support's directional reads. */
  function heading(yaw: number): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
      { x: 0, y: 0, z: 1 },
    );
  }
}
