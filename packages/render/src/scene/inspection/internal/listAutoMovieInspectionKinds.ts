import type {
  IAutoMovieInspectionKind,
  IAutoMovieListInspectionKindsProps,
} from "@automovie/interface";

import { AutoMovieRenderInspectionKinds } from "../../AutoMovieRenderInspectionKinds.js";

/*
 * List the styled kinds for the supplied marks and the measurements available
 * under the current request. Each entry has a label and default colour.
 *
 * The supplied marks' kinds come first, in the order they first appear, with
 * the label and colour of their first mark. The inspection's own kinds follow
 * in `AutoMovieRenderInspectionKinds` order: `edge` and the `defect/<kind>` kinds
 * always, since every mesh has them, except `defect/sliver`, which exists only
 * while the request sets a sliver limit, and `trail` and `trail/now` only while
 * the request names a trail. A supplied kind that has an inspection kind's name
 * is listed once, as supplied.
 *
 * `listAutoMovieInspectionKindOptions` adds lifetime declarations to these
 * styled kinds for request admission and the inspector panel.
 */
export function listAutoMovieInspectionKinds(
  props: IAutoMovieListInspectionKindsProps,
): IAutoMovieInspectionKind[] {
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
  for (const [kind, entry] of Object.entries(AutoMovieRenderInspectionKinds)) {
    if (kind === "defect/sliver" && props.request.sliver === null) continue;
    if (kind.startsWith("trail") && props.request.trail.length === 0) continue;
    if (!kinds.has(kind))
      kinds.set(kind, { kind, label: entry.label, color: entry.color });
  }
  return [...kinds.values()];
}
