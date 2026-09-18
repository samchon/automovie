/** The unit each subject is measured in.  * @evidence requirements/interior/deliverables-and-quantities.md#interior-quantities-waste Bounds each take-off's named owner sample while preserving the count and value of every omitted contributor.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Sets the canonical contributor-list limit to eight before omitted owners are separately counted and summed.
 * @author Samchon
 */
export const UNITS: { [subject in AutoMovieQuantitySubject]: AutoMovieQuantityUnit } =
  {
    "space-floor-area": "m2",
    "space-volume": "m3",
    "opening-area": "m2",
    "connector-length": "m",
    "element-count": "count",
    "opening-count": "count",
    "model-occurrence-count": "count",
  };
