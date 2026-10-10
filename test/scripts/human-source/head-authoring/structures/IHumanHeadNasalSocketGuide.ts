import type { IHumanHeadNasalSourcePort } from "./IHumanHeadNasalSourcePort.ts";

/** Paired authored nasal socket selections carried by their original source authority.
 * @author Samchon
 */
export interface IHumanHeadNasalSocketGuide {
  /** Source basis of the original frozen cuts, distinct from current generation. */
  basis: string;

  /** Native registration when separately established by guide publication. */
  nativeGeneration?: string;

  /** Exact paired source cell and boundary populations. */
  ports: IHumanHeadNasalSourcePort[];

  /** Original authored-selection and clinical limitations. */
  qualification: string;
}
