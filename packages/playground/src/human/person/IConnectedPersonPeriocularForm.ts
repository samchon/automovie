import type { ConnectedPersonPeriocularGroup } from "./ConnectedPersonPeriocularGroup";

/**
 * One scalar form mounted by the periocular controls. Choice names select document members; the numerical builder owns their support and admission. Form names describe the existing source anatomy choices and authored scalar keys; they do not establish a measured tissue value or geometry support. An empty choices list addresses the side's group record directly.
 *
 * @evidence contracts/common.md#principled-implementation A closed field group, literal member choices and scalar names select existing optional face document records for the shared person transaction.
 * @evidence contracts/common.md#clear-and-simple-design Form metadata stays separate from DOM construction, owner default materialization and numerical support/admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A listed anatomical name is not evidence that the source supports its tissue, and no clinical dimensions or guessed populations are supplied by this form.
 * @evidence contracts/common.md#meaningful-documentation The comment explains selectable member versus direct side-record targeting and retains numerical support with the builder.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This form descriptor chooses no row rendering, document update or anatomical construction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Static form choices define no geometry-cache equivalence or numerical reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ordinary choice and scalar-name arrays acquire no form listener or numerical worker by their declaration.
 *
 * @author Samchon
 */
export interface IConnectedPersonPeriocularForm {
  /** Optional face document field authored by this form. */
  field: ConnectedPersonPeriocularGroup;

  /** Human-readable group caption shown in the editor. */
  title: string;

  /** Selectable anatomical members; an empty list edits the side's group directly. */
  choices: readonly string[];

  /** Numerical property names to expose, with units and bounds owned by their document declarations. */
  scalars: readonly string[];
}
