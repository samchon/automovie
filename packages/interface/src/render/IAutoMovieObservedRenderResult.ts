import type { IAutoMovieRenderObservation } from "./IAutoMovieRenderObservation.js";

/**
 * A synchronous drawing operation's unchanged result paired with measured submission counters. observeAutoMovieRendererFrame aggregates calls/triangles across all draws within one reset epoch; other dimensions remain null. Output preserves the caller's exact return type without representing or abstracting a renderer dependency.
 *
 * @evidence contracts/development/design.md#principled-representation Output preserves the caller's exact return type without representing or abstracting a renderer dependency.
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeAutoMovieRendererFrame exchanges output, observed; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Output preserves the caller's exact return type without representing or abstracting a renderer dependency.
 * @evidence contracts/development/common.md#meaningful-documentation A synchronous drawing operation's unchanged result paired with measured submission counters. observeAutoMovieRendererFrame aggregates calls/triangles across all draws within one reset epoch; other dimensions remain null. The prose and members document how observeAutoMovieRendererFrame interprets and admits these values.
 */
export interface IAutoMovieObservedRenderResult<Output> { 
/** Exact unchanged synchronous draw callback result; ownership follows the callback. */
output: Output; 
/** Frame-wide submission counts; unavailable cost dimensions are null. */
observed: IAutoMovieRenderObservation }
