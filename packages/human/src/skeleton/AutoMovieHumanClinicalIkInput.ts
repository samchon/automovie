import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanTargetPoint as TargetPoint } from "./AutoMovieHumanTargetPoint";

/** Shared clinical fitting descriptors; all coordinates use the evaluator's metre frame. */
export namespace AutoMovieHumanClinicalIkInput {
  /** A rigid point in one bone's bind-relative coordinates, in metres. */
  export interface IBonePoint {
    /** Bone whose actual FK carries this point. */ bone: Controls.Joint;
    /** Omission selects the joint centre. */ localPoint?: Controls.MetrePoint;
  }
  /** Inclusive generic intervals; at least one finite endpoint is required.
   * A line offset is normal dot (point-origin-axis*dot(point-origin,axis)),
   * with axis the unit same-FK end-origin vector. Static malformed descriptors
   * refuse before projection selection; actual missing/degenerate FK refuses
   * when evaluated. Channel intervals intersect, rather than replace, ROM.
   */
  export type IConstraint = (
    | {
        /** Intersect one selected clinical channel's original ROM, in degrees. */ kind: "channel";
        /** Must occur in this request's selected channels. */ channel: Controls.DegreeChannel;
      }
    | {
        /** Signed perpendicular offset from a moving three-point line, in metres. */ kind: "line-offset";
        /** Point whose perpendicular displacement is measured. */ point: IBonePoint;
        /** Same-FK line; coincident endpoints refuse instead of inventing an axis. */ line: {
          /** Moving line origin. */ origin: IBonePoint;
          /** Second moving point defining direction. */ end: IBonePoint;
        };
        /** Evaluator-frame vector of unit norm, admitted within 1e-6. */ normal: Controls.MetrePoint;
      }
  ) & {
    /** Inclusive lower endpoint in the descriptor's units. */ minimum?: number;
    /** Inclusive upper endpoint in the descriptor's units. */ maximum?: number;
  };
  /** One rigidly bone-bound point, including geometry-derived contact points. */
  export interface ITarget {
    /** Bone identifier present in the evaluator. */
    bone: Controls.Joint;
    /** Desired evaluator-frame point, metres. */
    position: Controls.MetrePoint;
    /** Bind-relative bone-local offset, metres; omission addresses the joint centre.
     * A rigid module vertex uses its stored local coordinates. A blended skin
     * vertex cannot be represented by attaching it to just one of its bones.
     */
    localPoint?: Controls.MetrePoint;
    /** Derived hand-effector centres or support landmarks, from the same FK. */
    witness?: TargetPoint.IWitness;
    /** Positive residual scale; defaults to one. Error stays in unweighted metres. */
    weight?: number;
    /** A secondary aim contributes to fitting and reported error but does not stop a primary goal's convergence. */
    preference?: boolean;
  }
  /** Explicit work and precision budget for one small clinical chain. */
  export type IRequest = (
    | {
        /** Named public clinical paths; each must be a registered degree channel. */
        channels: readonly Controls.DegreeChannel[];
        /** Explicit paths already select the anatomical work. */ chain?: never;
      }
    | {
        /** Anatomical selection instead of explicit channels; supplying both refuses. */
        chain: Controls.Chain;
        /** A chain already selects its canonical angular paths. */ channels?: never;
      }
  ) & {
    /** FK endpoints affected by those channels. */
    targets: ITarget[];
    /** Maximum Gauss-Newton updates, 1 through 16; default 4. */
    iterations?: number;
    /** Euclidean residual acceptance in metres; default 0.001. */
    tolerance?: number;
    /** Metres per clinical degree penalizing departure from the seed; default zero. */
    priorWeight?: number;
    /** Authored regularization reference, independent of a caller's analytic or warm initial seed. */
    priorPose?: IAutoMovieHumanPose;
    /** Explicit unconstrained/box-constrained DLS numerical policy; omission preserves monotone defaults. Coupled line constraints retain the default solver. */
    step?: {
      /** Inward finite difference in clinical degrees, (0,1]. */ differenceDegrees: number;
      /** Positive diagonal normal-equation ridge. */ absoluteDamping: number;
      /** Nonnegative fraction of each original diagonal. */ relativeDamping: number;
      /** Positive angular update bound, at most 45 degrees. */ maximumDegrees: number;
      /** Bound each coordinate separately instead of scaling the complete update. */ componentwise: boolean;
      /** Fixed updates retain finite box-projected steps; monotone fitting backtracks. Neither proves global optimality. */ acceptance:
        | "finite-update"
        | "decreasing-objective";
      /** Mandatory initial updates, 0..iterations; defaults to zero. */ minimumIterations?: number;
    };
    /** Optional dense generic constraints; neither targets nor channels are replaced. */
    constraints?: readonly IConstraint[];
  };
  /** Owned fitted pose and its matching FK, including honest residuals. */
  export interface IResult {
    /** New independent pose; caller input is never mutated. */
    pose: IAutoMovieHumanPose;
    /** FK computed from exactly pose. */
    output: AutoMovieHumanSkeleton.IOutput;
    /** Largest target distance, metres; unreachable targets remain nonzero. */
    error: number;
    /** Updates performed; full FK evaluations also include finite differences. */
    iterations: number;
    /** Actual final descriptor values and nonnegative interval violations, in request order. */
    constraintValues: readonly {
      /** Actual value, in descriptor degrees or metres. */ value: number;
      /** Exact nonnegative interval distance in the same units. */ violation: number;
    }[];
    /** Every original interval holds up to local Float64 projection roundoff. Raw violations remain reported; this does not certify global feasibility. */
    constraintsSatisfied: boolean;
  }
}
