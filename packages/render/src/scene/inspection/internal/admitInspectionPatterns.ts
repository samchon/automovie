import type {
  IAutoMovieInspectionColorAssignment,
  IAutoMovieInspectionRequest,
  IAutoMovieMark,
} from "@automovie/interface";

import type { IAutoMovieRenderInspectionMeasured } from "../../IAutoMovieRenderInspectionMeasured";
import type { IAutoMovieRenderInspectionPath } from "../../IAutoMovieRenderInspectionPath";
import { listInspectionKindOptions } from "./listInspectionKindOptions";
import { matchInspectionPath } from "./matchInspectionPath";

/*
 * Check kind patterns before measuring scene geometry. Return the remaining
 * path and colour check for the drawn paths, measured marks and selected
 * supplied kinds. Both checks throw with the unmatched patterns before the
 * inspection changes scene state.
 */
export function admitInspectionPatterns(
  request: IAutoMovieInspectionRequest,
  supplied: readonly IAutoMovieMark[],
  declared: readonly string[] | undefined,
): (
  drawn: readonly IAutoMovieRenderInspectionPath[],
  measured: readonly IAutoMovieRenderInspectionMeasured[],
  asks: (kind: string) => boolean,
) => void {
  const available: string[] = [
    ...listInspectionKindOptions(
      { request, marks: supplied },
      declared,
    ).keys(),
  ];
  const unknown: string[] = request.marks.filter(
    (pattern: string): boolean =>
      !available.some((kind: string): boolean =>
        matchInspectionPath(kind, pattern),
      ),
  );
  if (unknown.length !== 0)
    throw new Error(
      `Inspection marks patterns match no kind: ${unknown.join(", ")}; the kinds available are ${available.join(", ") || "none"}`,
    );

  return (
    drawn: readonly IAutoMovieRenderInspectionPath[],
    measured: readonly IAutoMovieRenderInspectionMeasured[],
    asks: (kind: string) => boolean,
  ): void => {
    const known: string[] = [
      ...new Set<string>([
        ...drawn.map((entry: IAutoMovieRenderInspectionPath): string => entry.path),
        ...supplied
          .filter((mark: IAutoMovieMark): boolean => asks(mark.kind))
          .map((mark: IAutoMovieMark): string => mark.path),
        ...measured.flatMap((set: IAutoMovieRenderInspectionMeasured): string[] =>
          set.marks.map((mark: IAutoMovieMark): string => mark.path),
        ),
      ]),
    ];
    const missesPath = (pattern: string): boolean =>
      !known.some((path: string): boolean =>
        matchInspectionPath(path, pattern),
      );
    const unmatched: string[] = [...request.parts, ...request.hide].filter(
      missesPath,
    );
    const unlabelled: string[] = request.label.filter(missesPath);
    const uncoloured: string[] = request.color
      .map(
        (entry: IAutoMovieInspectionColorAssignment): string => entry.pattern,
      )
      .filter(
        (pattern: string): boolean =>
          missesPath(pattern) &&
          !available.some((name: string): boolean =>
            matchInspectionPath(name, pattern),
          ),
      );
    if (unmatched.length + unlabelled.length + uncoloured.length !== 0)
      throw new Error(
        `Inspection patterns match no object, mark or kind of the scene: ${[...unmatched, ...unlabelled, ...uncoloured].join(", ")}`,
      );
  };
}
