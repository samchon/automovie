import type { IHumanObservationMaterialParameters } from "./IHumanObservationMaterialParameters.js";

/**
 * The shared meaning and material of one human observation pass.
 *
 * `reading` states what the pass judges and what it does not; `lightScope`
 * says whether the authored lights illuminate it. The reading and material
 * belong together so display clients cannot rename a diagnostic.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Reading limits, authored-light participation and native parameters describe the same supported pass; the canonical table is the authority for all three rather than a client-provided label.
 * @evidence contracts/common.md#clear-and-simple-design One record keeps diagnostic meaning beside its display configuration, preventing separate face/body clients from redefining a shared pass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Structural passes state their own quantities and limits instead of being treated as beauty or anatomical certification; no fixture name determines interpretation.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish reading scope, illumination and material parameters; omitted parameter meanings belong to their native parameter type.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-size definition data adds no rendering traversal. The accessor copies its parameters in constant work and the observation owner performs actual pass installation.
 * @evidence contracts/performance.md#reuse-equivalent-work Clients share one canonical definition while accessor copies prevent mutation of that shared table. Native materials and capture images are not cached by this type.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Definitions retain only strings and scalar parameters, no native resource; caller copies have ordinary data lifetime.
 */
export interface IHumanObservationPassDefinition {
  /** What the pass judges and its observation limits. */
  reading: string;

  /** Whether the authored lights illuminate the pass. */
  lightScope: "authored" | "none";

  /** Material parameters applied to every displayed mesh. */
  parameters: IHumanObservationMaterialParameters;
}
