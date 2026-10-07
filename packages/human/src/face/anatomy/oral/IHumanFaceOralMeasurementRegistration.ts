/**
 * Compact successful oral geometry correspondence for actual-model readers.
 * Values identify original dental ordinals, not substitute coordinates. A
 * removed crown stays unavailable, including in neutral-reference acquisition.
 * @author Samchon
 */
export interface IHumanFaceOralMeasurementRegistration {
  /** Canonical source generation of the successfully emitted oral assembly; not a clinical validity claim. */
  generation: string;
  /** Lowercase SHA-256 of the original native dental serialization, naming its ordinal domain independently of skin samples. */
  dentalNativeSha256: string;
  /** Registered native dental surface whose original ordinals are recovered from actual emitted Float32 enamel aliases. */
  dentalSurface: string;
  /** Original native dental ordinals removed from the actual crown population; owned snapshot preserves unavailable point/reference acquisition. */
  absentDentalVertices: readonly number[];
}
