import type {
  IAutoMovieBoundaryFace,
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltBoundaryIndex,
  IAutoMovieBuiltEnvironment,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { collectDeclaredIds } from "../../validation/collectDeclaredIds";
import { validateDeclaredReferences } from "../../validation/internal/validateDeclaredReferences";
import { appendBuiltRegionDefects } from "./appendBuiltRegionDefects";
import { builtOutlineIsClosed } from "./builtOutlineIsClosed";

/**
 * Validate a building's boundaries and the faces openings are cut in.
 *
 * Each boundary needs a unique id, a non-blank kind, one or two spaces it
 * encloses or separates, and space and element references that resolve once
 * each. A stated face needs a finite origin, a unit rotation, a positive
 * thickness, and an outline of at least 3 distinct finite corners that encloses
 * area without crossing itself. Findings are pushed under `<root>.boundaries`.
 *
 * @param environment Building whose boundaries are checked.
 * @param root Violation path of the building record, `$input`.
 * @param spaceIds Declared space ids.
 * @param elementIds Declared element ids.
 * @param collector Sink that receives the violations.
 * @returns The declared boundary ids, and every face that passed its checks by
 *   boundary id, so openings are only placed on a usable face.
 */
export function validateBuiltBoundaries(
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  spaceIds: ReadonlySet<string>,
  elementIds: ReadonlySet<string>,
  collector: IAutoMovieViolationCollector,
): IAutoMovieBuiltBoundaryIndex.IMutable {
  const ids: Set<string> = collectDeclaredIds(
    environment.boundaries,
    `${root}.boundaries`,
    "boundary",
    collector,
  );
  const faces: Map<string, IAutoMovieBoundaryFace> = new Map();
  environment.boundaries.forEach(
    (boundary: IAutoMovieBuiltBoundary, index: number): void => {
      const path: string = `${root}.boundaries[${index}]`;
      collector.nonEmpty(`${path}.kind`, boundary.kind, "boundary kind");
      if (boundary.spaces.length < 1 || boundary.spaces.length > 2)
        collector.push(
          "range",
          `${path}.spaces`,
          `a boundary must enclose one space or separate two, but cited ${boundary.spaces.length}`,
          boundary.spaces,
        );
      validateDeclaredReferences(
        boundary.spaces,
        spaceIds,
        `${path}.spaces`,
        "logical space",
        collector,
      );
      validateDeclaredReferences(
        boundary.elements,
        elementIds,
        `${path}.elements`,
        "building element",
        collector,
      );
      if (boundary.face === undefined) return;
      const face: IAutoMovieBoundaryFace = boundary.face;
      const before: number = collector.items.length;
      collector.unitQuaternion(
        `${path}.face.rotation`,
        face.rotation,
        "boundary face rotation",
      );
      collector.positive(
        `${path}.face.thickness`,
        face.thickness,
        "boundary thickness",
      );
      if (
        builtOutlineIsClosed(
          face.outline,
          3,
          `${path}.face.outline`,
          "boundary face outline",
          collector,
        )
      )
        appendBuiltRegionDefects(
          face.outline,
          `${path}.face.outline`,
          "boundary face outline",
          collector,
        );
      if (collector.items.length === before) faces.set(boundary.id, face);
    },
  );
  return { ids, faces };
}
