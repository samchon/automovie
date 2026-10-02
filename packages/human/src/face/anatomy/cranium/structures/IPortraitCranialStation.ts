/**
 * One sagittal cranial section. Dimensions are millimetres; the crown and
 * mandibular floor are separate envelopes rather than a scaled sphere.
 *
 * @evidence contracts/common.md#principled-implementation A station is a sagittal depth, a crown depth, a transverse half-width and separate crown and floor heights, so the vault is a set of independent envelopes and not a scaled sphere; the chinRelative flag says whether the floor is absolute or offset from the host's actual chin.
 * @evidence contracts/common.md#clear-and-simple-design Six fields, one optional flag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitCranialStation carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States the unit, the descending-depth rule, that crown and floor are separate envelopes and how the floor is interpreted.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in head Y and Z, stated on the members.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitCranialStation is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitCranialStation carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitCranialStation decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitCranialStation constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitCranialStation is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @author Samchon
 */
export interface IPortraitCranialStation {
  /** Posterior station depth in head Z; stations descend in Z. */
  z: number;

  /** Superior station depth in head Z; at least z. */
  crownZ: number;

  /** Positive transverse half-width. */
  width: number;

  /** Superior envelope height in head Y. */
  crown: number;

  /** Inferior envelope height, or offset from the host's chin when chinRelative. */
  floor: number;

  /** Omission is absolute Y; true adds the host's lowest facial-oval Y to floor. */
  chinRelative?: boolean;
}
