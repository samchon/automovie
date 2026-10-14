import {
  IAutoMovieBoundaryFace,
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { collectDeclaredIds } from "../validation/collectDeclaredIds";
import { appendBuiltRegionDefects } from "./appendBuiltRegionDefects";
import { builtOutlineIsClosed } from "./builtOutlineIsClosed";
import { outlineHull } from "./outlineHull";
import { polygonInside } from "./polygonInside";
import { polygonsOverlap } from "./polygonsOverlap";
import { validateBuiltOpeningOperation } from "./validateBuiltOpeningOperation";

/**
 * Validate a building's openings: references, voids, operations and overlap.
 *
 * Each opening needs a unique non-blank id, a non-blank kind, a boundary that
 * resolves, and a fill element that resolves when it names one. A stated void
 * must sit on a boundary that declares a face, have at least 2 distinct finite
 * corners and one finite bulge in [-1, 1] per edge when bulges are stated, and
 * its arc-bounding hull from {@link outlineHull} must enclose area without
 * crossing itself and stay inside the host face's outline. The operation is
 * judged by {@link validateBuiltOpeningOperation} right after each opening's
 * void, sharing `driven` with the connectors. Finally, two usable voids on one
 * boundary may not share any point. Findings are pushed under
 * `<root>.openings`.
 *
 * @param environment Building whose openings are checked.
 * @param root Violation path of the building record, `$input`.
 * @param boundaries Declared boundary ids and the usable faces by boundary id.
 * @param elementIds Declared element ids.
 * @param driven Which member already drives each element, updated.
 * @param collector Sink that receives the violations.
 * @returns Every usable void hull by opening index, for the staged panel fit.
 *
 * @evidence contracts/common.md#principled-implementation Tests the shared straight arc-envelope ring for region validity, approximate containment and contact overlap. Under `outlineHull`'s arc/winding and finite-intermediate premises its geometric overestimate is conservative, but binary64 predicates are not a universal one-sided error certificate and circular-arc simplicity is not independently proved. Contact is refused to preserve a separating jamb.
 * @evidence contracts/common.md#clear-and-simple-design The opening section of `validateBuiltEnvironment`, separated so that file stays one orchestration; it reuses the shared outline, region, containment, overlap and operation rules and returns exactly what the staged panel fit consumes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No opening type is special-cased; unusable host faces suppress a redundant containment complaint. Position-keyed hulls preserve distinct records even when ids repeat, so those distinct records can still report overlap rather than overwriting one another.
 * @evidence contracts/common.md#meaningful-documentation The documentation states every opening, void, bulge, hull and overlap rule, where operations are judged and what they share, the path root, and what the result is for.
 * @evidence contracts/performance.md#efficient-algorithms Builds the boundary index, then pays each profile's hull generation, O(H²) simplicity and `polygonInside` cost against its host, plus full operation validation. Scans O(K²) usable-void pairs, with shared-boundary pairs paying vertex-product overlap work. Vertex counts, operation state counts and openings per boundary are variable inputs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per building validation; each hull is computed once and reused by the face, overlap and panel-fit checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The boundary index is released on return; the caller owns the returned hull map, bounded by the opening count, and `driven` grows by at most one entry per panel.
 */
export const validateBuiltOpenings: (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  boundaries: {
    ids: ReadonlySet<string>;
    faces: ReadonlyMap<string, IAutoMovieBoundaryFace>;
  },
  elementIds: ReadonlySet<string>,
  driven: Map<string, string>,
  collector: ViolationCollector,
) => Map<number, IAutoMoviePlanarPoint[]> = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  boundaries: {
    ids: ReadonlySet<string>;
    faces: ReadonlyMap<string, IAutoMovieBoundaryFace>;
  },
  elementIds: ReadonlySet<string>,
  driven: Map<string, string>,
  collector: ViolationCollector,
): Map<number, IAutoMoviePlanarPoint[]> => {
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
};

/**
 * One opening's void: its outline and bulges, the region its arc hull
 * encloses, and that hull staying on the host face. Returns the hull when the
 * void itself is usable, or null.
 */
const validateVoid: (
  opening: IAutoMovieBuiltOpening,
  path: string,
  host: IAutoMovieBuiltBoundary | undefined,
  face: IAutoMovieBoundaryFace | undefined,
  collector: ViolationCollector,
) => IAutoMoviePlanarPoint[] | null = (
  opening: IAutoMovieBuiltOpening,
  path: string,
  host: IAutoMovieBuiltBoundary | undefined,
  face: IAutoMovieBoundaryFace | undefined,
  collector: ViolationCollector,
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
      if (!Number.isFinite(bulge) || Math.abs(bulge) > 1)
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
