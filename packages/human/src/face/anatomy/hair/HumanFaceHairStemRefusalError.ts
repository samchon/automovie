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
