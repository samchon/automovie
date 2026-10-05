import type { IHumanFaceHairRootRefusal } from "./IHumanFaceHairRootRefusal";

/**
 * The named refusal of a hair root whose stem cannot clear the skin at any
 * exit elevation the cited source allows, carrying the elevations tried and
 * the stem's own record at the range top.
 *
 * @evidence contracts/common.md#principled-implementation A root refusal that carries the exhausted interval and the stem record can be judged without a probe.
 * @evidence contracts/common.md#clear-and-simple-design One error class for one refusal kind, with its record as a named member.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Raised only after every cited elevation was walked; it changes no admission.
 * @evidence contracts/common.md#meaningful-documentation States what the message and detail carry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The detail states its units.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A refused root emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The contact and interval own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The range owner states the cited angles.
 * @evidenceExclude contracts/anatomy.md#permitted-range The range owner bounds the elevations.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export class HumanFaceHairRootRefusalError extends Error {
  /** The cited interval, elevations tried and the stem record at the range top. */
  public readonly detail: IHumanFaceHairRootRefusal;

  /**
   * @param message Human-readable root location and elevations tried.
   * @param detail The record of the exhausted interval.
   */
  public constructor(message: string, detail: IHumanFaceHairRootRefusal) {
    super(message);
    this.name = "HumanFaceHairRootRefusalError";
    this.detail = detail;
  }
}
