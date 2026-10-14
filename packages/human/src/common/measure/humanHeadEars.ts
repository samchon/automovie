import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadEar } from "./humanHeadEar";

/**
 * The head view triangles of both named ear areas (`ear-right`, `ear-left`),
 * the set a face-skin search leaves out; a missing area refuses by name
 * (`humanHeadEar`).
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation The union of the two canonical named ear-touching triangle sets defines bilateral ear exclusion; each underlying reader admits its region/surface and missing names refuse.
 * @evidence contracts/common.md#clear-and-simple-design This small coordinator fixes the registered ear-right/ear-left roles while humanHeadEar owns the source population rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The two supported role names are the head basis contract, not fixture-specific triangle indices; no missing ear is replaced by an empty fabricated set.
 * @evidence contracts/common.md#meaningful-documentation The prose gives both canonical names, face-search exclusion purpose and underlying named refusal.
 * @evidence contracts/performance.md#efficient-algorithms Two ear readers each scan the head, then Set union costs their combined membership size; total work/space remain O(T+R) expected for triangles and both region populations.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical single-ear operation is reused for both roles, and union deduplicates overlapping ordinals; no persistent cache assumes unchanged source regions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Intermediate ear Sets/union input arrays are call-local, and the final Set transfers to the caller with at most T ordinals and no handle/task ownership.
 */
export function humanHeadEars(head: IAutoMovieHumanHeadSkin): Set<number> {
  return new Set([
    ...humanHeadEar(head, "ear-right").triangles,
    ...humanHeadEar(head, "ear-left").triangles,
  ]);
}
