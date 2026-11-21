import type { IAutoMovieListInspectionKindsProps } from "@automovie/interface";

import { listAutoMovieInspectionKinds } from "./listAutoMovieInspectionKinds.js";

/**
 * List the kind names available to the inspector and the draw host for this request. Supplied and measured kinds keep their default colours. The subject's declared names are available throughout its lifetime, with no default colour until a mark or measurement supplies one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who uses the options, where each name and colour comes from, and why a declared option can have no colour.
 * @evidence contracts/development/implementation.md#principled-implementation A name may be selected when the scene can produce it. The declarations establish availability and the styled kind list establishes actual default colours.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One map receives the styled kinds first and then the declared names that still need an option.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The existing styled list owns colours. A declared name cannot replace one or fabricate geometry.
 * @evidence contracts/development/implementation.md#efficient-algorithms The styled list scans supplied marks and the instrument table. This merge is linear in the resulting kinds and declared names, with one map entry per distinct name.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The result belongs to one request, supplied mark set and declaration list.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh map without retaining any inputs or handles.
 */
export function listAutoMovieInspectionKindOptions(
  props: IAutoMovieListInspectionKindsProps,
  declared: readonly string[] = [],
): ReadonlyMap<string, number | undefined> {
  const options: Map<string, number | undefined> = new Map();
  for (const { kind, color } of listAutoMovieInspectionKinds(props))
    options.set(kind, color);
  for (const kind of declared)
    if (!options.has(kind)) options.set(kind, undefined);
  return options;
}
