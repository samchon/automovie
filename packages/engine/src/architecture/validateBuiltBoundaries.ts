import {
  IAutoMovieBoundaryFace,
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { collectDeclaredIds } from "../validation/collectDeclaredIds";
import { validateDeclaredReferences } from "../validation/validateDeclaredReferences";
import { appendBuiltRegionDefects } from "./appendBuiltRegionDefects";
import { builtOutlineIsClosed } from "./builtOutlineIsClosed";

/**
 * Validate a building's boundaries and the faces openings are cut in.
 *
 * Each boundary needs a unique non-blank id, a non-blank kind, one or two
 * spaces it encloses or separates, and space and element references that
 * resolve once each. A stated face needs a finite origin, a unit rotation, a
 * positive thickness, and an outline of at least 3 distinct finite corners
 * that encloses area without crossing itself. Findings are pushed under
 * `<root>.boundaries`.
 *
 * @param environment Building whose boundaries are checked.
 * @param root Violation path of the building record, `$input`.
 * @param spaceIds Declared space ids.
 * @param elementIds Declared element ids.
 * @param collector Sink that receives the violations.
 * @returns The declared boundary ids, and every face that passed its checks
 *   by boundary id, so openings are only placed on a usable face.
 *
 * @evidence contracts/common.md#principled-implementation A boundary encloses one space or separates two, so its space count is bounded by that topology; a face is usable only when its rigid frame, thickness and outline are all valid, which is decided by whether any violation was added while checking it.
 * @evidence contracts/common.md#clear-and-simple-design The boundary section of `validateBuiltEnvironment`, separated so that file stays one orchestration; it returns exactly what the opening checks consume and reuses the shared id, reference, outline and region rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No boundary kind is special-cased, and a defective face is left out of the returned map rather than repaired, so a void on it is not also reported as leaving it.
 * @evidence contracts/common.md#meaningful-documentation The documentation states every boundary and face rule, the path root, and what each returned value holds and why.
 * @evidence contracts/performance.md#efficient-algorithms Linear in boundaries and their references, plus the quadratic simplicity test of each face outline, whose corner count is small.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per building validation; its id set and face map are reused by every opening.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned set and map, each bounded by the boundary count; nothing else is retained.
 */
export const validateBuiltBoundaries = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  spaceIds: ReadonlySet<string>,
  elementIds: ReadonlySet<string>,
  collector: ViolationCollector,
): { ids: Set<string>; faces: Map<string, IAutoMovieBoundaryFace> } => {
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
      collector.finiteVector(
        `${path}.face.origin`,
        face.origin,
        "boundary face origin",
      );
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
};
