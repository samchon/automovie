import { AutoMovieQuantitySubject } from "@automovie/interface";

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
