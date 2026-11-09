import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A bounded projection of one articulated point relative to another, fitted as motor intent rather than a direct pose correction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A bounded projection of one articulated point relative to another, fitted as motor intent rather than a direct pose correction) and documents 9 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents A bounded projection of one articulated point relative to another, fitted as motor intent rather than a direct pose correction: interface of 9 members (`id`, `chain`, `source`, `reference`, `axis`, `minimum`, ...); units and frames named in its text: local, metre, frame, world, metres. Optional members `minimum`, `maximum` express documented absence, and the ranges its member docs state are left to runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMoviePhysicalPointBound` in packages/interface/src/physics/IAutoMoviePhysicalPointBound.ts; its surface is the 9 members listed and the text shows 9 other files naming it, mostly packages/engine (5), test (3), packages/interface (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; 2 optional members (`minimum`, `maximum`) are independent fields rather than alternatives of one another as far as their docs state; it duplicates no type that another owner declares as far as a name search shows.
 */
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
