import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import type { AutoMovieHumanClinicalIk as Ik } from "./AutoMovieHumanClinicalIk";
import { AutoMovieHumanGroundingFit as Fit } from "./AutoMovieHumanGroundingFit";
import { AutoMovieHumanGroundingState as State } from "./AutoMovieHumanGroundingState";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton as Skeleton } from "./AutoMovieHumanSkeleton";
import type { AutoMovieHumanSkeletonMath as M } from "./AutoMovieHumanSkeletonMath";
import type { AutoMovieHumanSupportFrame as Frame } from "./AutoMovieHumanSupportFrame";

/** Joint clinical/root fitting retains actual sole and whole-foot floor constraints. */
export namespace AutoMovieHumanGrounding {
  /** Caller-owned scene placement; fitting changes translation only on explicitly selected axes. */
  export interface IRoot {
    /** Scene-world translation in metres, changed only on requested rootAxes. */
    translation: M.Vector;

    /** Fixed unit x/y/z/w rotation from the evaluator frame to the scene. */
    rotation: M.Quaternion;
  }
  /** Explicit absolute targets and independent full source-foot geometry. */
  export interface IRequest {
    /** World-metre target coordinates; every target keeps its exact bone-local witness. */ targets: readonly Ik.ITarget[];

    /** Expressive world-metre goals optimized only while hard support remains admitted. */ softTargets?: readonly Ik.ITarget[];

    /** Clinical angular controls admitted by the canonical Human catalogue; inspect permits an empty set for a fixed pose. */ channels: readonly Controls.DegreeChannel[];

    /** Soft angular preferences, subordinate to actual point/floor constraints; omitted knees prefer the supplied seed. */ preferred?: Readonly<
      Partial<Record<Controls.DegreeChannel, number>>
    >;

    /** Scene translation degrees of freedom, default vertical only. */ rootAxes?: readonly (
      | "x"
      | "y"
      | "z"
    )[];

    /** Metre support-plane height, default zero. All supplied foot vertices obey this inequality. */ floor?: number;

    /** Finite updates, default six, maximum sixteen. */ iterations?: number;

    /** Actual largest point/floor residual acceptance in metres, default0.00025. */ tolerance?: number;

    /** Independent nonpenetration allowance in metres, default0.000001. */ floorTolerance?: number;
  }
  /** An applied selected angular coordinate currently on its canonical interval endpoint. */
  export interface IBound {
    /** Exact own-side angular channel; jaw millimetres are excluded. */
    path: Controls.DegreeChannel;

    /** Applied clinical angle at the active static or conditional endpoint, degrees. */
    value: number;
  }
  /** Independent clinical pose/root with measurements from its exact public FK. */
  export interface IResult {
    /** Fitting normalizes selected applied controls; inspect retains the supplied controls and reports any selected clamp as unresolved. */
    pose: IAutoMovieHumanPose;

    /** Independent final scene placement; rotation remains the caller's request. */
    root: IRoot;

    /** Public full FK for exactly pose, before the separate scene root. */
    output: Skeleton.IOutput;

    /** Largest final target-distance or floor-penetration residual in metres. */
    error: number;

    /** Minimum scene-world Y across every supplied source-foot point, metres. */
    floorMinimum: number;

    /** Completed finite update count; exhaustion does not certify convergence. */
    iterations: number;

    /** Hard support, full-foot floor and applied clinical bounds all pass only when admitted. */
    status: "admitted" | "unresolved";

    /** Local numerical outcome; unresolved is not a certificate of global infeasibility. */
    reason:
      | "converged"
      | "constraints-violated"
      | "bound-or-stagnated"
      | "budget-exhausted";

    /** Largest hard support target distance in scene metres. */
    supportError: number;

    /** Largest separate expressive target distance in scene metres. */
    softError: number;

    /** Selected applied controls currently on static or conditional clinical bounds. */
    activeBounds: readonly IBound[];

    /** Last local QP's numerical certificate; actual nonlinear geometry alone determines status. */
    quadratic?: IQuadratic;
  }

  /** Local direction provenance, separate from physical goal/floor admission. */
  export interface IQuadratic {
    /** Engine TypeScript QP status, retaining the existing field name; only Solved1 supplies a proposed direction. */ nativeStatus: number;

    /** Engine interior-point iterations, distinct from outer FK updates; the field name is retained for compatibility. */ nativeIterations: number;

    /** Original local linear-row violation in that row's declared units. */ maximumViolation: number;

    /** Original local stationarity residual, not a physical residual. */ stationarityResidual: number;

    /** Original local complementarity residual when a Solved QP result reached refinement. */ complementarityResidual?: number;

    /** Whether all three local KKT readings meet the separate1e-12 numerical certificate. */ certified: boolean;

    /** Existing Engine polishing steps; no extra QP solve or FK. */ refinements: number;

    /** A certified polished or finite QP Solved direction still needs exact nonlinear line admission. */ direction:
      | "certified"
      | "inexact"
      | "none";
  }

  /** A fixed body's solver and one-FK admission path share the same complete source points. */
  export interface IPrepared {
    /** Fit hard support and floor before expressive objectives; failures retain exact diagnostics. */
    (pose: IAutoMovieHumanPose, root: IRoot, request: IRequest): IResult;

    /** Inspect the supplied state without changing its root or solving clinical controls; empty channels retain all geometry and target measurements. */
    inspect: (
      pose: IAutoMovieHumanPose,
      root: IRoot,
      request: IRequest,
    ) => IResult;
  }

  /**
   * Prepare one immutable body's complete foot point population. The closure
   * uses bounded clinical Gauss-Newton with a hard-feasibility merit function.
   * Allowed root Y is eliminated inside every nonlinear trial: all actual foot vertices
   * give its lower bound, and hard target heights give the constrained least-
   * squares minimizer. This is not a later correction of an accepted pose.
   * Soft head/posture goals can improve only while physical tolerances hold.
   * Applied conditional controls are normalized before each linearization.
   * Linearizations retain root Y explicitly and constrain every original foot
   * height and angular interval together. Canonical conditional bound gradients
   * reuse the same selected probes, so a knee's tibial interval moves with its
   * flexion without extra FK or duplicated ROM constants. Independently differentiating a
   * minimized maximum would combine incompatible floor branches. A bounded
   * public Engine quadratic solve uses no extra FK, backtracking or updates;
   * one shared step fraction retains its direction and existing step caps.
   * Full-foot Y uses one rigid affine row per actual bone, retaining every
   * source vertex. A finite result is admitted only after exact final FK,
   * target/floor and clinical checks; local failure never proves impossibility.
   * Inspect reuses the same measurements without numerical fitting. Copied
   * descriptors live with this body; no caller pose or historical state is kept.
   * Prepared FK projects every source-foot bone and hard/soft target through
   * the same clinical law. Plain callable evaluators retain their full fallback.
   * Only the final applied result materializes a complete public snapshot;
   * projection placements and per-run affine rows never escape as mutable caches.
   */
  export function prepare(
    evaluate: Skeleton.PoseEvaluator,
    vertices: readonly Frame.IPoint[],
  ): IPrepared {
    if (
      !Array.isArray(vertices) ||
      !vertices.length ||
      Array.from(vertices).some(
        (point: Frame.IPoint): boolean =>
          point === null ||
          typeof point !== "object" ||
          !Controls.isJoint(point.bone) ||
          !State.finiteTuple(point.localPoint, 3),
      )
    )
      throw new Error("Grounding requires actual finite source-foot points");
    const feet: Frame.IPoint[] = vertices.map(
      (point: Frame.IPoint): Frame.IPoint => ({
        bone: Controls.joint(point.bone),
        localPoint: [...point.localPoint],
      }),
    );
    const groups: Map<Controls.Joint, M.Vector[]> = new Map();
    for (const point of feet) {
      const group: M.Vector[] = groups.get(point.bone) ?? [];
      group.push(point.localPoint);
      groups.set(point.bone, group);
    }
    return Object.assign(
      (pose: IAutoMovieHumanPose, root: IRoot, request: IRequest): IResult =>
        Fit.run(evaluate, groups, pose, root, request, false),
      {
        inspect: (
          pose: IAutoMovieHumanPose,
          root: IRoot,
          request: IRequest,
        ): IResult => Fit.run(evaluate, groups, pose, root, request, true),
      },
    );
  }
}
