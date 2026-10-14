import type { IHumanFaceHairRootRefusal } from "./IHumanFaceHairRootRefusal";

/**
 * The named refusal of a hair root whose attempted exit elevations did not clear the skin, carrying the actual elevations tried and the stem's own record at the range top.
 *
 * @evidence contracts/common.md#principled-implementation A standard Error carries the root integrator's actual tried-elevation record, preserving the distinction between attempted samples and an untested interval.
 * @evidence contracts/common.md#clear-and-simple-design The class adds only a stable error name and typed detail to Error; construction leaves diagnostic interpretation with its caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied message and refusal detail are stored without retries, altered attempts or a fabricated successful root.
 * @evidence contracts/common.md#meaningful-documentation The class and constructor describe the location message, declared elevation interval and failed stem record retained at the range top.
 * @evidence contracts/performance.md#efficient-algorithms Beyond the JavaScript runtime's Error/message/stack construction, this class stores one diagnostic reference and name without traversing the detail; trial construction remains with the integrator.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This exception represents one failed walk and coordinates no requests or phases whose completed work could be shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The exception retains its detail by reference until the catcher releases it; tried elevations and the final stem record determine retained diagnostic bytes.
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
