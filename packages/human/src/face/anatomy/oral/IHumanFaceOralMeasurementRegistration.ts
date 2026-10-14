/**
 * Compact successful oral geometry correspondence for actual-model readers. Values identify original dental ordinals, not substitute coordinates. A removed crown stays unavailable, including in neutral-reference acquisition.
 *
 * @evidence contracts/common.md#principled-implementation Successfully emitted geometry records exact native dental ordinal/source domains for actual-model measurement.
 * @evidence contracts/common.md#clear-and-simple-design Actual Float32 readers recover dental aliases independently of skin partition identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A removed crown remains unavailable even for neutral-reference acquisition; a generation/hash is not clinical validity.
 * @evidence contracts/common.md#meaningful-documentation The digest names original native serialization and absentDentalVertices is a retained owned ordinal snapshot.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Emission and actual-point acquisition own lookup and geometry work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One correspondence record is reused by measurement context rather than substituting native reference coordinates for missing output.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The builder copies absent ordinals into this compact record and the actual measurement context owns its lifetime.
 *
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
