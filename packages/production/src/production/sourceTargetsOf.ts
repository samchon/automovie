import type { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { encodeAutoMoviePathSegment } from "./contentIdentity";

/**
 * Attribute one canonical generated path to its current design/source owners.
 *
 * Film artifacts belong to film, shot artifacts to the exact shot, external motion receipts to adoption and shot, and typed contracts to their design owner. Unmatched generated files belong to builder.
 *
 * @evidence contracts/common.md#principled-implementation Matching uses the same encoded identity segments as generated paths and current graph populations; receipts report both adoption and consuming shot so attribution does not lose either dependency.
 * @evidence contracts/common.md#clear-and-simple-design The attempt coordinator applies this attribution when sealing generated entries; path encoders own portable storage spelling and the current graph owns supported identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching is exact, including known film filenames, and unmatched paths use builder attribution rather than borrowing a similarly spelled design id.
 * @evidence contracts/common.md#meaningful-documentation States exact path attribution, dual motion ownership and the unmatched-file fallback.
 * @evidence contracts/performance.md#efficient-algorithms One lookup scans at most S shots, M motion adoptions, R models, F formations and A acceptance records, including encoded id-text cost, and returns a constant-size target list. The coordinator repeats this for each generated file; there is no retained attribution index.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The function derives current graph attribution independently for each path and shares no cached answer across mutable graphs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned one/two-target array transfers to its generated manifest entry; graph populations are borrowed and no handle or task is acquired.
 */
export function sourceTargetsOf(file: string, graph: ReturnType<AutoMovieProductionProject["graph"]>): string[] {
  if (
    file === "contracts/film-edit.json" ||
    file === "film-timeline.json" ||
    file === "film-effects.json"
  )
    return ["film"];
  for (const [id] of graph.shots)
    if (
      file === `shots/${encodeAutoMoviePathSegment(id)}.json` ||
      file === `realizations/${encodeAutoMoviePathSegment(id)}.json` ||
      file === `contracts/shots/${encodeAutoMoviePathSegment(id)}.json`
    )
      return [`shot:${id}`];
  for (const adoption of graph.production?.externalMotions ?? [])
    if (
      file ===
      `receipts/external-motion/${encodeAutoMoviePathSegment(adoption.id)}.json`
    )
      return [`external-motion:${adoption.id}`, `shot:${adoption.shot}`];
  for (const [id] of graph.models)
    if (
      file === `models/${encodeAutoMoviePathSegment(id)}.json` ||
      file === `contracts/models/${encodeAutoMoviePathSegment(id)}.json`
    )
      return [`model:${id}`];
  for (const [id] of graph.formations)
    if (file === `contracts/formations/${encodeAutoMoviePathSegment(id)}.json`)
      return [`formation:${id}`];
  for (const [id] of graph.acceptance)
    if (file === `contracts/acceptance/${encodeAutoMoviePathSegment(id)}.json`)
      return [`acceptance:${id}`];
  return [
    file === "contracts/production.json"
      ? "production"
      : file === "contracts/world.json"
        ? "world"
        : "builder",
  ];
}
