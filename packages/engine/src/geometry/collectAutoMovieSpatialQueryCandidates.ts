import type {
  IAutoMovieMeshQueryHierarchy,
  IAutoMovieSpatialQueryEntry,
} from "@automovie/interface";

import { AutoMovieSpatialCandidates } from "./AutoMovieSpatialCandidates";

/**
 * Collect the hierarchy entries whose boxes can meet a subject box, ordered by
 * the first cell of an XYZ grid they share with the subject.
 *
 * `hierarchy` is the tree `buildAutoMovieMeshQueryHierarchy` built from the
 * owner's resident entries, and `subject` is a box in the same metre frame.
 * `overlap` keeps entries whose actual boxes overlap the subject's, boundaries
 * included. `shared-cell` keeps the wider population whose boxes occupy a
 * common grid cell of width `cell`, which lash contact reads as its contact
 * neighbourhood. In both modes the result is sorted by the first shared cell
 * index in X, then Y, then Z, and then by original ordinal, so the order is a
 * deterministic function of the geometry and not of the tree's shape.
 *
 * Cell indices are read from coordinates by division and floor, never by
 * stepping through cells, so work follows the resident population and not
 * coordinate magnitude. An infinite cell width puts every finite coordinate in
 * cell zero, and indices that overflow to the same infinity compare equal and
 * fall to the ordinal tie-break. No entry geometry, coordinate or contact
 * allowance is changed.
 *
 * @param hierarchy Tree over the resident entries.
 * @param subject Box the candidates must reach.
 * @param cell Positive cell width in metres for ordering and `shared-cell`.
 * @param population Which entries qualify.
 * @returns Qualifying entries by reference, in cell then ordinal order.
 */
export function collectAutoMovieSpatialQueryCandidates<
  T extends IAutoMovieSpatialQueryEntry,
>(
  hierarchy: IAutoMovieMeshQueryHierarchy<T>,
  subject: IAutoMovieSpatialQueryEntry,
  cell: number,
  population: "overlap" | "shared-cell",
): T[] {
  if (!(cell > 0))
    throw new Error("Spatial candidate ordering needs a positive cell width.");
  const candidates: T[] = AutoMovieSpatialCandidates.read(
    hierarchy,
    subject,
    population === "shared-cell"
      ? (value: number): number => Math.floor(value / cell)
      : undefined,
  );
  return candidates.sort((a: T, b: T): number =>
    AutoMovieSpatialCandidates.compare(subject, cell, a, b),
  );
}
