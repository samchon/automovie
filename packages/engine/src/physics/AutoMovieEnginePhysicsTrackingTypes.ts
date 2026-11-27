import type {
  IAutoMovieRigidTransform,
  IAutoMovieTrackPhysicalBalanceTargets,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";

/** Stable result types for root and support tracking operations. */
export namespace AutoMovieEnginePhysicsTrackingTypes {
  /** The fitted balance targets and their interval state. */
  export type IBalanceTargetsResult = IAutoMovieTrackPhysicalBalanceTargets.IResult;

  /** The interval scene after contact-target planning, when available. */
  export type IContactTargetsResult =
    | Record<string, Record<string, IAutoMovieRigidTransform>>
    | undefined;

  /** The bounded force and torque applied to a root body. */
  export interface IRootExternalResult {
    /** World force, newtons. */
    force: IAutoMovieVector3;
    /** World torque, N m. */
    torque: IAutoMovieVector3;
  }

  /** Support transition fields populated on a root task. */
  export type IRootTransitionsResult = Pick<
    AutoMovieXpbdWorld.IRootTask,
    "bounds" | "released" | "stance"
  >;
}