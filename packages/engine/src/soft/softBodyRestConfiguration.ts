import { IAutoMovieSoftBodyDomain } from "@automovie/interface";
import { softBodyRestBuffer } from "./softBodyRestBuffer";
/** Return fresh plain coordinates for the authored rest mesh with static anchors and one selected state's targets applied. Production furnishing validation consumes this configuration; moving targets require the separate complete-boundary solver.
 *
 * @evidence contracts/common.md#principled-implementation The canonical typed rest-buffer owner applies named targets over explicit anchor positions over authored particle coordinates; undeclared state names throw, while valid dense coordinates and particle indices are domain-admission premises.
 * @evidence contracts/common.md#clear-and-simple-design One rest-target owner serves this validation projection and both solver paths; conversion to a plain array stays at the validator-facing API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The returned geometry is the anchored rest configuration rather than unmodified rest coordinates or a guessed moving pose; ungated particle indices are not silently promoted into extra geometry.
 * @evidence contracts/common.md#meaningful-documentation States target precedence, fresh plain ownership, static scope and named-state failure.
 * @evidence contracts/performance.md#efficient-algorithms For P coordinate values, A anchors, S states and T named poses, buffer setup plus plain conversion costs O(P+A+S+T), retaining O(P+T) local/result storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Target indexing is performed once in the shared owner; no persistent configuration assumes equivalence of a mutable domain and named state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The typed working buffer and target map are temporary; a fresh number array transfers to the caller without retaining source coordinate or target records.
 *
 * @author Samchon
 */
export const softBodyRestConfiguration: (domain: IAutoMovieSoftBodyDomain, state?: string | null) => number[] = (
  domain: IAutoMovieSoftBodyDomain,
  state: string | null = null,
): number[] => Array.from(softBodyRestBuffer(domain, state));
