/**
 * An observed closed loop whose source preimage is followed toward increasing section coordinates. This identifies a geometric source component, not an anatomical label or a permission to cap it.
 *
 * @evidence contracts/common.md#principled-implementation A requested physical plane and its actual published loop ordinal identify an existing source-incidence witness.
 * @evidence contracts/common.md#clear-and-simple-design A seed refers to the section result instead of accepting a separate source-face selection or generated geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest-component match, specimen table, inferred tip or semantic body label is accepted.
 * @evidence contracts/common.md#meaningful-documentation States increasing-coordinate direction, millimetre plane identity, loop ordinal and the absence of closure authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record computes nothing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns two scalar fields.
 */
export interface IAutoMovieRecoveryTerminalSeed {
  /** A plane explicitly present in coordinatesMm, in signed physical millimetres. */
  coordinateMm: number;

  /** Zero-based closed-loop ordinal in that plane's actual source observation. */
  loopIndex: number;
}
