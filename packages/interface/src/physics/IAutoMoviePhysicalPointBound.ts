import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** A bounded projection of one articulated point relative to another, fitted as motor intent rather than a direct pose correction. */
export interface IAutoMoviePhysicalPointBound {
  /** Unique relationship id within the sampled target, shared with collider bindings. */ id: string;
  /** Contiguous proximal-to-distal actuator chain ending at source.bone. */ chain: string[];
  /** Candidate source point in its bone's local metre frame. */ source: {
    bone: string;
    localPoint: IAutoMovieVector3;
  };
  /** Same-body references follow the candidate; external references use the simultaneous actual snapshot. A shape selects its support point along axis on every evaluation, including shape offsets and rotation. Select exactly one of localPoint and shape. */ reference: {
    body: string;
    bone: string;
  } & (
    | { localPoint: IAutoMovieVector3; shape?: never }
    | { shape: string; localPoint?: never }
  );
  /** Explicit world-space unit projection direction. */ axis: IAutoMovieVector3;
  /** Inclusive lower projection, metres; at least one bound must be present. */ minimum?: number;
  /** Inclusive upper projection, metres. */ maximum?: number;
  /** Positive bounded geometric updates, at most 32. */ iterations: number;
  /** Positive metre residual early-out; an unreachable interval retains its measured error. */ tolerance: number;
}
