import type { IAutoMovieListInspectionKindsProps } from "@automovie/interface";

import { listAutoMovieInspectionKinds } from "./listAutoMovieInspectionKinds.js";

/**
 * List the kind names available to the inspector and the draw host for this
 * request. Supplied and measured kinds keep their default colours. The
 * subject's declared names are available throughout its lifetime, with no
 * default colour until a mark or measurement supplies one.
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
