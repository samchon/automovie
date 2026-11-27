import { AUTOMOVIE_DIALOGUE_ENVELOPE_JAW } from "../AUTOMOVIE_DIALOGUE_ENVELOPE_JAW";

/**
 * The jaw opening for one frame of a line without phoneme chunks, from the
 * line's frame level.
 *
 * The opening is 0 at or below `AUTOMOVIE_DIALOGUE_ENVELOPE_JAW.floorDbfs`, the
 * full `maximumOpeningMm` at or above `fullDbfs`, and linear in dB between, so
 * the jaw follows the line's own loudness on the emission clock with no lag.
 *
 * @param level The frame level as a linear RMS amplitude, from
 *   `productionDialogueFrameLevels`.
 * @returns The jaw opening in millimetres at the incisors.
 */
export function autoMovieDialogueEnvelopeJaw(level: number): number {
  if (!(level > 0)) return 0;
  const {
    floorDbfs,
    fullDbfs,
    maximumOpeningMm,
  }: typeof AUTOMOVIE_DIALOGUE_ENVELOPE_JAW = AUTOMOVIE_DIALOGUE_ENVELOPE_JAW;
  const dbfs: number = 20 * Math.log10(level);
  return (
    maximumOpeningMm *
    Math.min(1, Math.max(0, (dbfs - floorDbfs) / (fullDbfs - floorDbfs)))
  );
}
