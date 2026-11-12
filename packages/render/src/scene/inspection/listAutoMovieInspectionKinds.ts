import type { IAutoMovieMark } from "@automovie/engine";

import { AUTO_MOVIE_INSPECTION_KINDS } from "./AUTO_MOVIE_INSPECTION_KINDS.js";
import type { IAutoMovieInspectionKind } from "./IAutoMovieInspectionKind.js";
import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest.js";

/**
 * List the mark kinds a request's `marks` patterns may name for a set of supplied marks: what a picture can draw, each with its label and default colour.
 *
 * The supplied marks' kinds come first, in the order they first appear, with the label and colour of their first mark. The inspection's own kinds follow in `AUTO_MOVIE_INSPECTION_KINDS` order: `edge` and the `defect/<kind>` kinds always, since every mesh has them, except `defect/sliver`, which exists only while the request sets a sliver limit, and `trail` and `trail/now` only while the request names a trail. A supplied kind that has an inspection kind's name is listed once, as supplied.
 *
 * `applyAutoMovieInspection` refuses a `marks` pattern that matches none of these, and an inspector panel and a capture plan read the same list.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order, where each label and colour come from, when the conditional kinds exist, how a name clash is listed, and who reads the list.
 * @evidence contracts/development/implementation.md#principled-implementation A kind exists when something can draw it: a supplied mark, a mesh measurement that needs no input, a sliver measurement that needs its limit, or a trail the request asks for.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the supplied marks, then one over the inspection's own table with its two conditions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The inspection's own kinds are read from their one table, not restated, and no supplied kind is named.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the supplied marks, with one hashed lookup each.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its arguments.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records and keeps nothing.
 */
export function listAutoMovieInspectionKinds(props: {
  /** The request's sliver limit and trail patterns, which decide the conditional kinds. */
  request: Pick<IAutoMovieInspectionRequest, "sliver" | "trail">;

  /** The marks the subject supplies. */
  marks: readonly IAutoMovieMark[];
}): IAutoMovieInspectionKind[] {
  const kinds: Map<string, IAutoMovieInspectionKind> = new Map<
    string,
    IAutoMovieInspectionKind
  >();
  for (const mark of props.marks)
    if (!kinds.has(mark.kind))
      kinds.set(mark.kind, {
        kind: mark.kind,
        label: mark.label,
        color: mark.color,
      });
  for (const [kind, entry] of Object.entries(AUTO_MOVIE_INSPECTION_KINDS)) {
    if (kind === "defect/sliver" && props.request.sliver === null) continue;
    if (kind.startsWith("trail") && props.request.trail.length === 0) continue;
    if (!kinds.has(kind))
      kinds.set(kind, { kind, label: entry.label, color: entry.color });
  }
  return [...kinds.values()];
}
