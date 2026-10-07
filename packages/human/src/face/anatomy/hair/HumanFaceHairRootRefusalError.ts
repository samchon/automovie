import type { IHumanFaceHairRootRefusal } from "./IHumanFaceHairRootRefusal";

/**
 * The named refusal of a hair root whose attempted exit elevations did not
 * clear the skin, carrying the actual elevations tried and
 * the stem's own record at the range top.
 *
 * @evidence contracts/common.md#principled-implementation Carries the declared interval, actual attempted elevations and stem record without claiming that every intermediate elevation was evaluated.
 * @evidence contracts/common.md#clear-and-simple-design One error class for one refusal kind, with its record as a named member.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retains the integrator's actual failed attempts and changes no admission; an endpoint failure is not a proof that the whole interval is impossible.
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
   * @param detail The declared interval and actual failed attempts.
   */
  public constructor(message: string, detail: IHumanFaceHairRootRefusal) {
    super(message);
    this.name = "HumanFaceHairRootRefusalError";
    this.detail = detail;
  }
}
