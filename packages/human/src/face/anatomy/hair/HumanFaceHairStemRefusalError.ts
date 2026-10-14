import type { IHumanFaceHairStemRefusal } from "./IHumanFaceHairStemRefusal";

/**
 * The named refusal of a rooted hair stem that cannot leave its skin within its construction turn, carrying the walk's own record of why.
 *
 * The message keeps the human-readable location and clearance; `detail` holds the stations and trials as structured data for whoever must decide whether the stem, the style or the domain is at fault. Callers that only need the text read it like any Error.
 *
 * @evidence contracts/common.md#principled-implementation Error inheritance preserves ordinary exception handling while typed detail exposes actual refusing stations and trials for numerical diagnosis.
 * @evidence contracts/common.md#clear-and-simple-design A message, stable class name and one detail property separate readable failure text from structured walk evidence without an extra reporting layer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The constructor reports a refused stem unchanged; it neither shortens the strand nor replaces the failed walk with a passing surrogate.
 * @evidence contracts/common.md#meaningful-documentation The comment explains text-only Error consumption and structured stations/trials used to locate stem, style or domain causes.
 * @evidence contracts/performance.md#efficient-algorithms Beyond the runtime's Error/message/stack construction, the class assigns one detail reference and name without traversing station history; the refusal owner assembles stations and trials.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This failure exception coordinates no repeated computation; separate stem failures retain their own diagnostic effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caught error owns a reference to its record; station history is capped upstream at six and trials grow with the refusing station's attempted chords.
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
