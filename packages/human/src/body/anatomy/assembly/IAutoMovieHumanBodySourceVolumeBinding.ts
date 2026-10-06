/**
 * Bind an existing anatomical volume record to actual source boundary volume.
 * The producer owns compartment membership and the coarse target condition;
 * clinical observations remain raw acquisition records, not shape commands.
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
