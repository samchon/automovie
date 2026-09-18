import { AutoMovieQuantitySubject, AutoMovieQuantityUnit } from "@automovie/interface";

/**
 * Every subject a report answers for, in the order it answers for them.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-quantities-waste Ensures every promised take-off subject receives an ordered finding, including an explicit zero when no owner contributes.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Defines the canonical report order for floor area, volume, opening area, connector length, and occurrence counts.
 */
export const AUTOMOVIE_QUANTITY_SUBJECTS: AutoMovieQuantitySubject[] = [
  "space-floor-area",
  "space-volume",
  "opening-area",
  "connector-length",
  "element-count",
  "opening-count",
  "model-occurrence-count",
];

/** The unit each subject is measured in. */
const UNITS: { [subject in AutoMovieQuantitySubject]: AutoMovieQuantityUnit } =
  {
    "space-floor-area": "m2",
    "space-volume": "m3",
    "opening-area": "m2",
    "connector-length": "m",
    "element-count": "count",
    "opening-count": "count",
    "model-occurrence-count": "count",
  };
