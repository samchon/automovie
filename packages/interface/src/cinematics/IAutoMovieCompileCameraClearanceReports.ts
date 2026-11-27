import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieCamera } from "../scene/IAutoMovieCamera";
import type { IAutoMovieScene } from "../scene/IAutoMovieScene";
import type { IAutoMovieViolationAppendItemsSink } from "../validation/IAutoMovieViolationAppendItemsSink";
import type { IAutoMovieCameraClearanceRuntime } from "./IAutoMovieCameraClearanceRuntime";
import type { IAutoMovieShot } from "./IAutoMovieShot";
import type { IAutoMovieShotCoverage } from "./IAutoMovieShotCoverage";

/** Inputs to the engine's per-take camera-envelope clearance compilation. */
export namespace IAutoMovieCompileCameraClearanceReports {
  /**
   * Borrowed shot snapshot and caller-owned violation sink for numerical
   * camera-envelope checks.
   *
   * The hero take and every coverage take whose staged camera declares
   * `clearance` are inspected; the others are skipped, and a shot with none
   * returns `undefined` without reading `runtime`. Each such take is sampled at
   * {@link cameraClearanceSampleTimes}, and every staged node is an obstacle: a
   * node nothing animates is its rest box through its placement
   * ({@link nodeSubjectBox}), and an animated one is a box around its current
   * root holding {@link cameraClearanceDeformationRadius} scaled by its largest
   * absolute scale component, which stays valid under any rotation or pose.
   * {@link evaluateCameraClearance} then sweeps each interval.
   *
   * Every refusal is pushed to `out` with an author-facing path, and the result
   * is then `undefined`: a hero or coverage camera the scene does not stage, a
   * missing `runtime`, a sample rate that is not finite and positive, a stale
   * geometry revision (one item per take, before any geometry is read), a
   * morph-weight track, a node whose model is absent, fails `validateModel`,
   * draws nothing or whose bound overflows, a motion the clock cannot bound,
   * and every contact the evaluator finds. Items already in `out` belong to the
   * caller and do not count as refusals here. The check covers portable
   * geometry bounds and admitted interpolation, not rendered pixels, external
   * asset bytes or renderer-only deformation.
   */
  export type IProps = {
    /** The staged scene whose cameras and nodes are read. */
    scene: IAutoMovieScene;

    /** Hero take; the record itself is always present. */
    hero: IPropsHero;

    /** The shot's coverage takes, each naming a staged camera. */
    coverage: readonly IAutoMovieShotCoverage[];

    /**
     * Finite nonnegative shot length in seconds; zero is a single-instant
     * check. performShot supplies a positive duration, while the evaluator
     * admits zero.
     */
    duration: number;

    /**
     * Final actor motion by staged node id, sampled in shot-local seconds and
     * folded through each staged root.
     */
    motions: Readonly<Record<string, IAutoMovieMotion>>;

    /**
     * Final object clips on the shot clock in channel-authority order; node
     * weight tracks are refused because no morph expansion bound is available.
     */
    objectMotions: readonly IAutoMovieClip[];

    /**
     * Portable models indexed by model id; every staged node needs a valid
     * measurable model when clearance runs.
     */
    models: readonly IAutoMovieModel[];

    /** Builder-owned revision and clock, required once any take has an envelope. */
    runtime: IAutoMovieCameraClearanceRuntime | undefined;

    /** Collector that receives every refusal, after any items it already holds. */
    out: IAutoMovieViolationAppendItemsSink;
  };

  /** The hero object of {@link IProps}. */
  export type IPropsHero = {
    /**
     * Camera whose id must occur in scene.cameras; this supplied object's
     * envelope and world transform are used.
     */
    camera: IAutoMovieCamera;

    /**
     * Camera-node tracks on the shot-local seconds clock, or null to retain
     * the staged transform.
     */
    motion: IAutoMovieShot["cameraMotion"];
  };
}
