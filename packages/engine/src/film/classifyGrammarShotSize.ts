import { IAutoMovieCameraIntent } from "@automovie/interface";
import { FRAMING_HEIGHT_FRACTION } from "./FRAMING_HEIGHT_FRACTION";

/**
 * Classify a subject's measured fraction of the frame.
 *
 * The fraction is of the frame's own height for a subject the frame holds
 * vertically, and of its width for one whose width is what placed the camera:
 * {@link FRAMING_HEIGHT_FRACTION} is applied to both axes by the framing solve,
 * so the axis that fills the most of its own side is the one that states the
 * size delivered.
 *
 * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar classifyGrammarShotSize supplies deterministic spatial-grammar analysis: Classify a subject's measured fraction of the frame, of its height or of its width, whichever the subject fills more.
 * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar classifyGrammarShotSize realizes deterministic continuity-grammar analysis: Classify a subject's measured fraction of the frame. The fraction is of the frame's own height for a subject the frame holds vertically, and of its width for one whose width is what placed the camera: the framing fractions are applied to both axes by the framing solve, so the axis that fills the most of its own side is the one that states the size delivered.
 */
export const classifyGrammarShotSize = (
  frameOccupancy: number,
): IAutoMovieCameraIntent["framing"] => {
  positive(frameOccupancy, "frameOccupancy");
  const visibleHeightMultiple = 1 / frameOccupancy;
  return (
    Object.entries(FRAMING_HEIGHT_FRACTION) as [
      IAutoMovieCameraIntent["framing"],
      number,
    ][]
  ).reduce((best, candidate) =>
    Math.abs(Math.log(visibleHeightMultiple / candidate[1])) <
    Math.abs(Math.log(visibleHeightMultiple / best[1]))
      ? candidate
      : best,
  )[0];
};

const positive = (value: number, path: string): void => {
  if (Number.isFinite(value) === false || value <= 0)
    throw new Error(`${path} must be finite and positive.`);
};
