import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { fitPhysicalWholeBodyTarget } from "../physics/fitPhysicalWholeBodyTarget";
import type { IAutoMovieRelationalGoal } from "./IAutoMovieRelationalGoal";

/**
 * Realize a relational goal at one instant: read the target subject's region
 * from its actual pose (at the window's start for `freeze`, at the instant
 * for `track`), then bend the performer's prior pose toward it by the
 * whole-body fit ({@link fitPhysicalWholeBodyTarget}) from its held support,
 * inside every declared ROM, with an optional approach for the effector.
 * Outside the window the prior is returned unchanged with no residual.
 *
 * Bodies are engine-level: a physical profile, a pose at any instant (the
 * production's shape prior, such as an authored or keyed pose) and named
 * regions; no figure package is needed.
 *
 * @param input The performer, the goal, the bodies and the instant.
 * @returns The performer's fitted pose and residual report.
 */
export function resolveAutoMovieRelationalGoal(input: {
  /** The performing subject's id. */ performer: string;
  /** The goal. */ goal: IAutoMovieRelationalGoal;
  /** Every subject's body. */ bodies: Readonly<
    Record<string, resolveAutoMovieRelationalGoal.IBody>
  >;
  /** Film seconds. */ seconds: number;
  /** Positive solver budget, at most 64; 32 by default. */ iterations?: number;
  /** Residual early-out, metres; 1e-4 by default. */ tolerance?: number;
  /** Metres of residual per unit approach difference; 0.05 by default. */ approachWeight?: number;
}): resolveAutoMovieRelationalGoal.IResult {
  const performer: resolveAutoMovieRelationalGoal.IBody | undefined =
    input.bodies[input.performer];
  const target: resolveAutoMovieRelationalGoal.IBody | undefined =
    input.bodies[input.goal.target.subject];
  if (!performer || !target)
    throw new Error(`Unknown relational subject of ${input.performer}`);
  const prior: Record<string, P.ITransform> = performer.pose(input.seconds);
  const { start, end }: { start: number; end: number } = input.goal.window;
  if (input.seconds < start || input.seconds > end)
    return {
      targets: prior,
      point: null,
      active: false,
      residual: 0,
      position: 0,
      approach: 0,
    };
  const region: resolveAutoMovieRelationalGoal.IRegion | undefined =
    target.regions[input.goal.target.region];
  if (!region)
    throw new Error(
      `Unknown region ${input.goal.target.subject}.${input.goal.target.region}`,
    );
  const read: Record<string, P.ITransform> = target.pose(
    input.goal.lock === "freeze" ? start : input.seconds,
  );
  const pose: P.ITransform = read[region.bone]!;
  const point: IAutoMovieVector3 = Vector3.add(
    pose.position,
    Quaternion.rotateVector(pose.rotation, region.localPoint),
  );
  const support: resolveAutoMovieRelationalGoal.ISupport = performer.support(
    input.seconds,
  );
  const held: P.ITransform = prior[support.bone]!;
  const fit: fitPhysicalWholeBodyTarget.IResult = fitPhysicalWholeBodyTarget({
    profile: performer.profile,
    targets: prior,
    support: {
      bone: support.bone,
      point: Vector3.add(
        held.position,
        Quaternion.rotateVector(held.rotation, support.localPoint),
      ),
      normal: support.normal,
      minimum: support.minimum,
      maximum: support.maximum,
    },
    bones: performer.bones,
    goal: {
      bone: input.goal.surface.bone,
      localPoint: input.goal.surface.localPoint,
      point,
      ...(input.goal.approach && input.goal.surface.localDirection
        ? {
            approach: {
              localDirection: input.goal.surface.localDirection,
              direction: input.goal.approach,
              weight: input.approachWeight ?? 0.05,
            },
          }
        : {}),
    },
    iterations: input.iterations ?? 32,
    tolerance: input.tolerance ?? 1e-4,
  });
  return { ...fit, point, active: true };
}
/** Companion types of {@link resolveAutoMovieRelationalGoal}. */
export namespace resolveAutoMovieRelationalGoal {
  /** A named point on a body. */
  export interface IRegion {
    /** Segment carrying it. */
    bone: string;

    /** Point in the segment frame, metres. */
    localPoint: IAutoMovieVector3;
  }

  /** A held support at an instant. */
  export interface ISupport {
    /** Held segment. */
    bone: string;

    /** Contact point in the segment frame, metres. */
    localPoint: IAutoMovieVector3;

    /** Unit world contact normal. */
    normal: IAutoMovieVector3;

    /** Lower turn about the normal, radians. */
    minimum: number;

    /** Upper turn about the normal, radians. */
    maximum: number;
  }

  /** An engine-level body. */
  export interface IBody {
    /** Its admitted physical profile. */
    profile: P;

    /** Its prior world pose of every segment at an instant. */
    pose(seconds: number): Record<string, P.ITransform>;

    /** Its named regions. */
    regions: Readonly<Record<string, IRegion>>;

    /** Its held support at an instant, for a performer. */
    support(seconds: number): ISupport;

    /** Segments a fit may move, for a performer. */
    bones: readonly string[];
  }

  /** A realized goal. */
  export interface IResult extends fitPhysicalWholeBodyTarget.IResult {
    /** The target's world point, or null outside the window. */
    point: IAutoMovieVector3 | null;

    /** Whether the instant lies in the window. */
    active: boolean;
  }
}
