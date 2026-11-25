import type { IAutoMovieCompiledContractRealization } from "./IAutoMovieCompiledContractRealization";
import type { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";

/** Measured contract realization and the diagnostics that determine acceptance. */
export namespace IAutoMovieRealizeShotContract {
  /**
   * Grade a shot contract against the compiled artifacts that claim to realize
   * it, measuring every outcome from the compiled scene, motions, camera and
   * event samples rather than from the contract's own prose.
   *
   * Opening states are graded at second 0 and closing states at
   * `durationSeconds`. Each event is graded at its source sample's time and
   * passes only when every declared subject resolves, its sample exists and is
   * finite inside its window, and its predicates pass; the sample list itself
   * must name every contract event exactly once. The camera is sampled at 0,
   * every review frame and `durationSeconds`, deduplicated and ascending, and a
   * sample passes only when every required subject resolves, its box intersects
   * the clipped view frustum of the cropped raster, and the box's depth range
   * satisfies the camera's depth-precision constraint. A formation participant
   * must materialize its designed count in contiguous chunks, and, once a
   * production is supplied, every promoted hero node exactly; an actor
   * participant must be a performed scene node; every builder-reported slot
   * collision fails.
   *
   * A reference that cannot be resolved, such as an absent node, rig, bone,
   * motion, landmark or formation, makes the predicate or camera subject that
   * named it fail; nothing is substituted for it. Contract clocks must already
   * be admitted. Camera resolution runs outside the per-subject catch, so an
   * invalid review time or malformed moving-camera sample can throw here.
   */
  export type IResult = {
    /**
     * New measured state/event/camera/formation report, including failed
     * entries. Nested formation bound vectors may borrow compiled formation
     * data; treat shared geometry as immutable.
     */
    realization: IAutoMovieCompiledContractRealization;
    /**
     * New mutable compile-error list, ordered by slot collisions, states,
     * sample-list mismatch, events, camera samples, formations and actors.
     * Empty means this realization pass found no refusal.
     */
    diagnostics: IAutoMovieDiagnostic[];
  };
}
