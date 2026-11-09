/**
 * An observed closed loop whose source preimage is followed toward increasing section coordinates. This identifies a geometric source component, not an anatomical label or a permission to cap it.
 *
 * @evidence contracts/development/design.md#principled-representation A requested physical plane and its actual published loop ordinal identify an existing source-incidence witness.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A seed refers to the section result instead of accepting a separate source-face selection or generated geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No nearest-component match, specimen table, inferred tip or semantic body label is accepted.
 * @evidence contracts/development/common.md#meaningful-documentation States increasing-coordinate direction, millimetre plane identity, loop ordinal and the absence of closure authority.
 */
export interface IAutoMovieRecoveryTerminalSeed {
  /** A plane explicitly present in coordinatesMm, in signed physical millimetres. */
  coordinateMm: number;

  /** Zero-based closed-loop ordinal in that plane's actual source observation. */
  loopIndex: number;
}
