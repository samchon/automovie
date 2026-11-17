import type { IAutoMovieHumanSourceRealization } from "./IAutoMovieHumanSourceRealization";

/** Original part, canonical metre view and preparation diagnostics, before a raw loft exists. The synchronous caller owns this record.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Original part, canonical metre view and preparation diagnostics, before a raw loft exists.
 * @evidence contracts/development/design.md#principled-representation Original part, canonical metre view and preparation diagnostics, before a raw loft exists. The selected IAutoMovieHumanSourceRealization fields retain their original constraints, nullable failure states and mutability.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyLaw.original, AutoMovieHumanBodyPreparation.original, AutoMovieHumanArmWalk.define. Read by AutoMovieHumanFootBreadth.measure, AutoMovieHumanFootPart.define, AutoMovieHumanHandAttachment.prepare. Also types AutoMovieHumanBodyLane.original, AutoMovieHumanBodyPreparation.definition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanArmSources.armDefinition, AutoMovieHumanArmWalk.define, AutoMovieHumanBodyLane.original, AutoMovieHumanBodyLaneInterim.side for original part, canonical metre view and preparation diagnostics, before a raw loft exists.
 */
export type IAutoMovieHumanSourceDefinition = Pick<
  IAutoMovieHumanSourceRealization,
  "part" | "view" | "diagnostics" | "massConnection"
>;
