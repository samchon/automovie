import type { IHumanFaceHairStemRefusal } from "./IHumanFaceHairStemRefusal";

/**
 * The named refusal of a rooted hair stem that cannot leave its skin within
 * its construction turn, carrying the walk's own record of why.
 *
 * The message keeps the human-readable location and clearance; `detail` holds
 * the stations and trials as structured data for whoever must decide whether
 * the stem, the style or the domain is at fault. Callers that only need the
 * text read it like any Error.
 *
 * @evidence contracts/common.md#principled-implementation A refusal that carries its own measured cause can be judged without re-running a probe.
 * @evidence contracts/common.md#clear-and-simple-design One error class for one refusal kind, with its record as a named member.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Raised only where the stem genuinely refuses; it changes no admission.
 * @evidence contracts/common.md#meaningful-documentation States the message and detail roles and how callers read them.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The detail records state their frames.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A refused stem emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The contact and interval own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical state only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export class HumanFaceHairStemRefusalError extends Error {
  /** The stations and trials that led to this refusal. */
  public readonly detail: IHumanFaceHairStemRefusal;

  /**
   * @param message Human-readable location and clearance of the refusal.
   * @param detail The walk's record of the refusing stem.
   */
  public constructor(message: string, detail: IHumanFaceHairStemRefusal) {
    super(message);
    this.name = "HumanFaceHairStemRefusalError";
    this.detail = detail;
  }
}
