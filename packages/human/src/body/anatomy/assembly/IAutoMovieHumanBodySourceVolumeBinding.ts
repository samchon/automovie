/**
 * Bind an existing anatomical volume record to actual source boundary volume. The producer owns compartment membership and the coarse target condition; clinical observations remain raw acquisition records, not shape commands.
 *
 * @evidence contracts/common.md#principled-implementation An anatomical record path binds one closed source compartment to a producer-supported shape field while observed acquisitions remain raw records.
 * @evidence contracts/common.md#clear-and-simple-design Path, member set, field identity and the two protocol accounts expose quantity ownership without mixing compartment membership with clinical interpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Target capability follows actual source freedom; clinical volume observations cannot silently become shape commands.
 * @evidence contracts/common.md#meaningful-documentation Fields document the prefix-free path, exclusive compartment members, source field and coarse-versus-clinical protocol limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Volume-binding metadata specifies measurement ownership without calculating boundary volume or searching coefficients.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A bound path declares source dependencies but stores no previously achieved volume target.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Compartment descriptors acquire no volume instrument, temporary mesh or asynchronous measurement task.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceVolumeBinding {
  /** Direct path to an existing kind/volume anatomy record, without the anatomy prefix. */
  path: string;

  /** Closed source members defining this one compartment, excluding other tissue. */
  members: readonly string[];

  /** Source shape field providing this quantity's actual supported freedom. */
  field: string;

  /** Source boundary/protocol meaning, distinct from clinical segmentation validity. */
  sourceProtocol: string;

  /** Actual coarse authoring condition, member relation and preserved support responsibility. */
  targetCondition: string;
}
