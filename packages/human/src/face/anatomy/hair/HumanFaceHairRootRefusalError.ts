import type { IHumanFaceHairRootRefusal } from "./IHumanFaceHairRootRefusal";

/**
 * The named refusal of a hair root whose attempted exit elevations did not
 * clear the skin, carrying the actual elevations tried and
 * the stem's own record at the range top.
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
