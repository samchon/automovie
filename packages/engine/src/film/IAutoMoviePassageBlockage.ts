/**
 * One passage a world volume intrudes on.
 *
 * `propBlockedPassages` returns these for one prop's bounds, every blocked
 * opening in the environment's `openings` order and then every blocked
 * connector in `connectors` order, each passage at most once.
 * `validatePropPlacements` turns each into a placement violation.
 *
 * @evidence contracts/common.md#principled-implementation A passage is identified by its family and its id within the environment, which `validateBuiltEnvironment` requires unique per family, so the pair names exactly one opening or connector without carrying its geometry.
 * @evidence contracts/common.md#clear-and-simple-design Two fields, the family and the id, because the validator needs only to name the passage in its message and the geometry stays on the environment record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No passage is special-cased by kind or id; an open cut or a connector with no section is never reported, because the producer cannot measure it, rather than being reported by a guessed size.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the order and uniqueness of its list, the consumer, and what each field identifies.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; the overlap tests are answered on `propBlockedPassages`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built fresh per prop placement check; nothing caches blockages.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One literal and one string by value; the list is bounded by the environment's openings plus connectors.
 */
export interface IAutoMoviePassageBlockage {
  /** Which passage family the blocked id belongs to. */
  kind: "opening" | "connector";

  /** Id of the blocked opening or connector inside the environment. */
  id: string;
}
