import { IAutoMovieClipShapeFault } from "./IAutoMovieClipShapeFault";
/**
 * Return a loop-shape fault unless the authored flag is boolean.
 *
 * @evidence contracts/common.md#principled-implementation A strict typeof boolean check prevents truthy strings or objects from choosing time wrapping, preserving the sampler's declared wrap-versus-clamp branch.
 * @evidence contracts/common.md#clear-and-simple-design Loop admission is separate from duration because artifact duration is deliberately stricter while both callers share the same boolean policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No truthiness coercion or default looping changes a malformed author flag; the original value is carried with a type fault.
 * @evidence contracts/common.md#meaningful-documentation Names loop field, boolean acceptance, null success and the reason duration has another owner.
 * @evidence contracts/performance.md#efficient-algorithms One type check is constant work; refusal additionally allocates a message/fault and can invoke authored value string conversion.
 * @evidence contracts/performance.md#reuse-equivalent-work Sampler and artifact callers reuse this policy rather than independent truthiness checks; no loop verdict is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a fresh fault/value reference or null transfers, with no clip, playback cursor or host resource acquired.
 * @author Samchon
 */
export const clipLoopFault: (loop: unknown) => IAutoMovieClipShapeFault | null = (
  loop: unknown,
): IAutoMovieClipShapeFault | null =>
  typeof loop === "boolean"
    ? null
    : {
        kind: "type",
        field: "loop",
        message: `loop must be boolean, but was ${String(loop)}`,
        value: loop,
      };
