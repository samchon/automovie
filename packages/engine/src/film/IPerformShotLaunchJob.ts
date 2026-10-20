import {
  IAutoMovieLaunchAction,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * One gated `launch` action, ready for its flight to be solved.
 *
 * `gatePerformShotActions` records one only when the projectile is a staged
 * node and the aim resolved to a point; `compilePerformShotLaunches` then solves
 * the flight, bakes it onto the shot clock, and schedules the target's recoil.
 *
 * @evidence contracts/common.md#principled-implementation Stores the projectile's staged origin and the resolved aim as world points, the two endpoints the ballistic solve needs, plus the struck node for leading a moving target and naming the recoil.
 * @evidence contracts/common.md#clear-and-simple-design Carries exactly what the launch compile reads, so the compile never re-resolves a target the gate already resolved.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Recorded only after the projectile and aim checks pass, so the compile never meets an unstaged projectile or an unresolved aim.
 * @evidence contracts/common.md#meaningful-documentation States when one is recorded, who consumes it, and for each field its meaning, frame and units, including when the struck node is null.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Type-only: the ballistic solve that consumes each job carries the cost, stated on the launch compile.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per launch action and consumed once by the launch compile.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Lives for one `performShot` call and references the caller's action and staged vectors.
 */
export interface IPerformShotLaunchJob {
  /** The `launch` action, the same object as in the action list. */
  action: IAutoMovieLaunchAction;

  /** Position of the action in the performing action list. */
  index: number;

  /** The projectile's staged world position in metres, where it is released. */
  origin: IAutoMovieVector3;

  /** The aim's world point in metres at the shot's opening. */
  target: IAutoMovieVector3;

  /**
   * The node a `node` or `bone` aim strikes, or null for a point or group aim,
   * which flies but recoils no one.
   */
  targetNode: string | null;
}
