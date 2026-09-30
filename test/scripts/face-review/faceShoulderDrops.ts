import { type ISampleSummary, summarizeSample } from "./summarizeSample";

/** How far below menton two shoulder landmarks sit, over one sex's subjects. */
export interface IFaceShoulderDrops {
  acromion: ISampleSummary;
  suprasternale: ISampleSummary;
}

/**
 * How far below the chin the shoulders sit, from ANSUR II rows in
 * millimetres (Gordon et al., 2012 Anthropometric Survey of U.S. Army
 * Personnel, NATICK/TR-15/007).
 *
 * The survey has no menton height, so each subject's is read from what it
 * does measure: stature, less the head above the eye (sitting height less
 * sitting eye height), less menton to sellion, taking sellion at the eye's
 * height (it lies a few millimetres above the inner canthus). The shoulder is
 * the acromion (`acromialheight`); the drop from the chin to it, and to the
 * suprasternal notch beside it, is reported as mean and sample standard
 * deviation to 0.1 mm. Hair that falls further than this in a photograph lies
 * on the shoulders. A missing or non-numeric column refuses. Pure.
 */
export function faceShoulderDrops(
  rows: readonly Record<string, string>[],
): IFaceShoulderDrops {
  const read = (row: Record<string, string>, column: string): number => {
    const value = Number(row[column]);
    if (row[column] === undefined || row[column] === "" || !Number.isFinite(value))
      throw new Error(`The survey row has no numeric ${column}.`);
    return value;
  };
  const acromion: number[] = [];
  const notch: number[] = [];
  for (const row of rows) {
    const menton =
      read(row, "stature") -
      (read(row, "sittingheight") - read(row, "eyeheightsitting")) -
      read(row, "mentonsellionlength");
    acromion.push(menton - read(row, "acromialheight"));
    notch.push(menton - read(row, "suprasternaleheight"));
  }
  return {
    acromion: summarizeSample(acromion, 1),
    suprasternale: summarizeSample(notch, 1),
  };
}
