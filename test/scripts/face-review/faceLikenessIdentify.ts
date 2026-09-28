/**
 * Cross-identification of renders among the population's photographs.
 *
 * `measure-face-likeness.ts` calls `identifyFaceLikeness` with every
 * measured subject's portrait-render landmarks and photograph landmarks. A
 * render's landmark residual to its own photograph means little alone: it
 * must be judged against how far the same render is from every other
 * subject's photograph, and how far photographs of different people are
 * from each other. Each render is aligned to each photograph by the same 2D
 * similarity and inter-ocular normalization as `faceLikenessLandmarkResidual`
 * and ranked by RMS; rank 1 means the render is nearest to its own
 * photograph. The summary counts rank-1 subjects and reports the median own,
 * other-photograph and photograph-to-photograph residuals. It measures 2D
 * proportions only; it is not a recognition or likeness verdict.
 * Pure: inputs are read, new rows are returned.
 */
import {
  type FaceLikenessPoint,
  faceLikenessLandmarkResidual,
  faceLikenessMedian,
  fitFaceLikenessSimilarity,
} from "./faceLikenessGeometry";

/** One subject's render and photograph landmarks. */
export interface IFaceLikenessIdentityInput {
  subject: string;
  render: readonly FaceLikenessPoint[];
  photo: readonly FaceLikenessPoint[];
}

/** Rank of each render's own photograph and the population summary. */
export function identifyFaceLikeness(
  inputs: readonly IFaceLikenessIdentityInput[],
): {
  rows: {
    subject: string;
    rank: number;
    own: number;
    nearestOther: number | null;
  }[];
  identified: number;
  ownMedian: number | null;
  otherMedian: number | null;
  photoMedian: number | null;
} {
  const rms = (
    moving: readonly FaceLikenessPoint[],
    fixed: readonly FaceLikenessPoint[],
  ) =>
    faceLikenessLandmarkResidual(
      moving,
      fixed,
      fitFaceLikenessSimilarity(moving, fixed),
    ).rms;
  const others: number[] = [];
  const photos: number[] = [];
  const rows = inputs.map((input, i) => {
    const distances = inputs.map((candidate) =>
      rms(input.render, candidate.photo),
    );
    const own = distances[i]!;
    const rest = distances.filter((_, j) => j !== i);
    others.push(...rest);
    inputs.forEach((candidate, j) => {
      if (j > i) photos.push(rms(input.photo, candidate.photo));
    });
    return {
      subject: input.subject,
      rank: 1 + rest.filter((value) => value < own).length,
      own,
      nearestOther: rest.length === 0 ? null : Math.min(...rest),
    };
  });
  return {
    rows,
    identified: rows.filter((row) => row.rank === 1).length,
    ownMedian: faceLikenessMedian(rows.map((row) => row.own)),
    otherMedian: faceLikenessMedian(others),
    photoMedian: faceLikenessMedian(photos),
  };
}
