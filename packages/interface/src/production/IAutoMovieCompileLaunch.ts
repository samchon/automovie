import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieLaunchAction } from "../harness/IAutoMovieLaunchAction";

/** Data and callback contracts shared by the CompileLaunch operations. */
export namespace IAutoMovieCompileLaunch {
  /**
   * Compose the `launch` verb's engine primitives into one result: the
   * projectile's flight and the struck target's reaction, timed to the
   * engine-computed hit rather than a number the model had to guess.
   *
   * It {@link solveBallisticLaunch solves the aim} that connects `origin` to
   * `target` at `action.speed`, {@link projectileTrajectory bakes the flight}
   * into the projectile node's clip, and, when the launch carries an `onHit`
   * and strikes a node, schedules that node's `react` at the contact. Pass
   * `targetAt` to lead a moving target: the aim then solves through
   * {@link solveMovingLaunch} against where the mover will be when the
   * projectile arrives, and `target` only names the fallback sightline.
   *
   * Times differ by output. The clip is flight-local, keyed over `[0, hitTime]`
   * with id `trajectory:<projectile>`, and the caller shifts it by
   * `action.start` onto the shot clock. The `react` start, the event times, and
   * `targetAt`'s argument are shot-local seconds, so the hit lands at
   * `action.start + hitTime`. The events are a `contact` always, a `hit` when a
   * node is struck, and a `fall` when the react unbalances it; their
   * `actionIndex` is null for the caller to stamp.
   *
   * Returns null when the target is out of range at that speed. Throws
   * `RangeError` when `onHit` has no non-blank `targetNode`, because no actor
   * can perform that requested reaction.
   */
  export type IProps = {
    /** The launch to compile: its `projectile`, `speed`, `onHit` and `start`. */
    action: IAutoMovieLaunchAction;

    /** Where the projectile launches from, in world metres. */
    origin: IAutoMovieVector3;

    /** The struck target's world point, where a static aim lands. */
    target: IAutoMovieVector3;

    /**
     * The struck scene node, the emitted `react`'s actor, or null when the aim
     * is a point or group with no single actor to recoil. A null value supports
     * flight and contact without `onHit`; requesting `onHit` without a
     * non-blank target node throws.
     */
    targetNode: string | null;

    /**
     * The target's world position at shot-local second `t`, when it moves
     * during the shot. Supplied, the aim leads the mover to the intercept;
     * omitted, the launch is a static intercept on `target`. The lead solver
     * calls it synchronously, potentially repeatedly at different times. It
     * must describe one stable trajectory during the solve; callback exceptions
     * propagate and the callback is not retained after compilation.
     */
    targetAt?: (t: number) => IAutoMovieVector3;

    /**
     * Constant acceleration in m/s²; defaults to standard gravity along world
     * −Y (`AutoMovieEngineGravity.DOWN`).
     */
    gravity?: IAutoMovieVector3;

    /** A flat `direct` shot, the default, or a lobbed `high` arc. */
    arc?: "direct" | "high";

    /** Samples per second of the baked flight clip; defaults to 30. */
    fps?: number;
  };
}
