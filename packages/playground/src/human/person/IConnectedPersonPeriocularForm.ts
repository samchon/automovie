import type { ConnectedPersonPeriocularGroup } from "./ConnectedPersonPeriocularGroup";

/**
 * One scalar form mounted by the periocular controls. Choice names select
 * document members; the numerical builder owns their support and admission.
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
