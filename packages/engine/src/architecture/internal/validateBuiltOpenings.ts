import type {
  IAutoMovieBoundaryFace,
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltBoundaryIndex,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMoviePlanarPoint,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { collectDeclaredIds } from "../../validation/internal/collectDeclaredIds";
import { appendBuiltRegionDefects } from "./appendBuiltRegionDefects";
import { builtOutlineIsClosed } from "./builtOutlineIsClosed";
import { outlineHull } from "./outlineHull";
import { polygonInside } from "./polygonInside";
import { polygonsOverlap } from "./polygonsOverlap";
import { validateBuiltOpeningOperation } from "./validateBuiltOpeningOperation";

/**
 * Validate a building's openings: references, voids, operations and overlap.
 *
 * Each opening needs a unique id, a non-blank kind, a boundary that resolves,
 * and a fill element that resolves when it names one. A stated void must sit on
 * a boundary that declares a face, have at least 2 distinct finite corners and
 * one finite bulge in [-1, 1] per edge when bulges are stated, and its
 * arc-bounding hull from {@link outlineHull} must enclose area without crossing
 * itself and stay inside the host face's outline. The operation is judged by
 * {@link validateBuiltOpeningOperation} right after each opening's void, sharing
 * `driven` with the connectors. Finally, two usable voids on one boundary may
 * not share any point. Findings are pushed under `<root>.openings`.
 *
 * @param environment Building whose openings are checked.
 * @param root Violation path of the building record, `$input`.
 * @param boundaries Declared boundary ids and the usable faces by boundary id.
 * @param elementIds Declared element ids.
 * @param driven Which member already drives each element, updated.
 * @param collector Sink that receives the violations.
 * @returns Every usable void hull by opening index, for the staged panel fit.
 */
export function validateBuiltOpenings(
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  boundaries: IAutoMovieBuiltBoundaryIndex,
  elementIds: ReadonlySet<string>,
  driven: Map<string, string>,
  collector: IAutoMovieViolationCollector,
): Map<number, IAutoMoviePlanarPoint[]> {
  collectDeclaredIds(
    environment.openings,
    `${root}.openings`,
    "opening",
    collector,
  );
  const declared: Map<string, IAutoMovieBuiltBoundary> = new Map();
  for (const boundary of environment.boundaries)
    if (!declared.has(boundary.id)) declared.set(boundary.id, boundary);
  const hulls: Map<number, IAutoMoviePlanarPoint[]> = new Map();
  environment.openings.forEach(
    (opening: IAutoMovieBuiltOpening, index: number): void => {
      const path: string = `${root}.openings[${index}]`;
      collector.nonEmpty(`${path}.kind`, opening.kind, "opening kind");
      if (!boundaries.ids.has(opening.boundary))
        collector.push(
          "type",
          `${path}.boundary`,
          `opening boundary "${opening.boundary}" does not resolve`,
          opening.boundary,
        );
      if (opening.fill !== null && !elementIds.has(opening.fill))
        collector.push(
          "type",
          `${path}.fill`,
          `opening fill element "${opening.fill}" does not resolve`,
          opening.fill,
        );
      const hull: IAutoMoviePlanarPoint[] | null = validateVoid(
        opening,
        path,
        declared.get(opening.boundary),
        boundaries.faces.get(opening.boundary),
        collector,
      );
      if (hull !== null) hulls.set(index, hull);
      validateBuiltOpeningOperation({
        opening,
        path,
        elements: environment.elements,
        elementIds,
        driven,
        collector,
      });
    },
  );
  // Position keys preserve distinct records even when their declared ids repeat.
  environment.openings.forEach(
    (opening: IAutoMovieBuiltOpening, index: number): void => {
      const hull: IAutoMoviePlanarPoint[] | undefined = hulls.get(index);
      if (hull === undefined) return;
      for (let other: number = 0; other < index; ++other) {
        const earlier: IAutoMovieBuiltOpening = environment.openings[other]!;
        const against: IAutoMoviePlanarPoint[] | undefined = hulls.get(other);
        if (
          against !== undefined &&
          earlier.boundary === opening.boundary &&
          polygonsOverlap(hull, against)
        )
          collector.push(
            "range",
            `${root}.openings[${index}].profile.outline`,
            `openings "${earlier.id}" and "${opening.id}" occupy the same part of boundary "${opening.boundary}"`,
            opening.profile!.outline,
          );
      }
    },
  );
  return hulls;
}

/**
 * One opening's void: its outline and bulges, the region its arc hull encloses,
 * and that hull staying on the host face. Returns the hull when the void itself
 * is usable, or null.
 */
const validateVoid: (
  opening: IAutoMovieBuiltOpening,
  path: string,
  host: IAutoMovieBuiltBoundary | undefined,
  face: IAutoMovieBoundaryFace | undefined,
  collector: IAutoMovieViolationCollector,
) => IAutoMoviePlanarPoint[] | null = (
  opening: IAutoMovieBuiltOpening,
  path: string,
  host: IAutoMovieBuiltBoundary | undefined,
  face: IAutoMovieBoundaryFace | undefined,
  collector: IAutoMovieViolationCollector,
): IAutoMoviePlanarPoint[] | null => {
  if (opening.profile === undefined) return null;
  const profilePath: string = `${path}.profile`;
  if (host !== undefined && host.face === undefined)
    collector.push(
      "type",
      profilePath,
      `opening "${opening.id}" states a void, but its host boundary "${opening.boundary}" declares no face to cut it in`,
      opening.boundary,
    );
  const before: number = collector.items.length;
  builtOutlineIsClosed(
    opening.profile.outline,
    2,
    `${profilePath}.outline`,
    "opening outline",
    collector,
  );
  const bulges: number[] | undefined = opening.profile.bulges;
  if (bulges !== undefined) {
    if (bulges.length !== opening.profile.outline.length)
      collector.push(
        "type",
        `${profilePath}.bulges`,
        `an opening states ${bulges.length} bulges for ${opening.profile.outline.length} edges`,
        bulges.length,
      );
    bulges.forEach((bulge: number, bulgeIndex: number): void => {
      if (Math.abs(bulge) > 1)
        collector.push(
          "range",
          `${profilePath}.bulges[${bulgeIndex}]`,
          `an edge bulge must be a finite number within [-1, 1], because an arc longer than a half turn is authored as two edges, but was ${bulge}`,
          bulge,
        );
    });
  }
  // The region an arc encloses is the hull's, not the corner polygon's: two
  // corners and two half turns are a circle, which the corners alone call flat.
  if (collector.items.length !== before) return null;
  const hull: IAutoMoviePlanarPoint[] = outlineHull(opening.profile);
  appendBuiltRegionDefects(
    hull,
    `${profilePath}.outline`,
    "opening outline",
    collector,
  );
  if (collector.items.length !== before) return null;
  // A missing or malformed host face is already reported on its own path, and
  // repeating it here would only hide the one defect worth acting on.
  if (face !== undefined && polygonInside(hull, face.outline) === false)
    collector.push(
      "range",
      `${profilePath}.outline`,
      `opening "${opening.id}" leaves the face of its host boundary "${opening.boundary}"`,
      opening.profile.outline,
    );
  return hull;
};
