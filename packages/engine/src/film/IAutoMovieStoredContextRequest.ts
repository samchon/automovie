import { IAutoMovieContextRequest } from "@automovie/interface";

/** Request types whose answer is already stored on the slate. */
type AutoMovieStoredContextType =
  | "getScript"
  | "getScene"
  | "getShot"
  | "getNotes"
  | "getBeatEnd";

/**
 * A context request answerable from state already stored on the slate, the
 * input `readSlateContext` accepts.
 *
 * The geometry-dependent requests of `IAutoMovieContextRequest` (`getReach`,
 * `getResolvedPose`, `measureDistance`) need resolver inputs the slate does not
 * hold, so they are excluded here at the type level rather than refused at run
 * time.
 *
 * @evidence contracts/common.md#principled-implementation Derived with `Extract` from the interface's own request union over the literal `type` discriminants, so each member keeps its exact interface shape and a new stored request becomes reachable only by naming its type here.
 * @evidence contracts/common.md#clear-and-simple-design A derived alias rather than a restated union, so the stored family cannot drift from the interface's request records, and the local list of five type names is the only thing this file owns.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Geometry requests are excluded by type instead of being answered with a placeholder; `readSlateContext` still throws for a value cast past the type.
 * @evidence contracts/common.md#meaningful-documentation States the consumer, which request types it covers, which it excludes and why.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A compile-time narrowing of the interface union; it emits no runtime code and costs nothing per request.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A compile-time alias evaluates no request, so there is no completed or in-flight work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A compile-time alias holds no values; each request object stays owned by the caller that built it.
 * @author Samchon
 */
export type IAutoMovieStoredContextRequest = Extract<
  IAutoMovieContextRequest,
  { type: AutoMovieStoredContextType }
>;
