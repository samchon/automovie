/**
 * A geometric fold observation on a saved source-section segment. Anatomical
 * identity is deliberately unresolved: a lateral extremum can belong to more
 * than one auricular structure or the neighboring scalp.
 *
 * @evidence contracts/common.md#principled-implementation The point and its signed lateral prominence describe the source polyline, without assigning anatomical identity.
 * @evidence contracts/common.md#clear-and-simple-design One observation carries the coordinates and extraction quantities needed by the ear track owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No identity, vertex index, clinical label, or reference-specific coordinate is encoded.
 * @evidence contracts/common.md#meaningful-documentation Members state the reference frame, units, sign and finite-neighborhood meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data contract does not select an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The contract coordinates no requests or effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The contract acquires no resources.
 * @author Samchon
 */
export interface EarFoldCandidate {
  /** Millimetres in the admitted source frame: +X subject-left, +Y up, +Z front. */
  point: [number, number, number];

  /** Whether the source section turns toward or away from the outward lateral axis. */
  direction: "outward" | "inward";

  /** Smaller signed lateral rise above the two stated arclength neighbors, in millimetres. */
  prominenceMm: number;

  /** Source-section arclength from its first observation, in millimetres. */
  arcMm: number;
}
