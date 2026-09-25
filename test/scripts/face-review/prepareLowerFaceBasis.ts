import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";

import { faceMidsagittalLandmarks } from "./faceMidsagittal";
import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";

/** One population corner and the published lower face height it should have. */
export interface ILowerFaceNorm {
  label: string;
  shape: Record<string, number>;
  targetMetres: number;
}

/**
 * Lengthen the neutral's lower face to published norms along the source's
 * own chin-height endpoint.
 *
 * Lower face height is subnasale to menton (Farkas); `faceMidsagittalLandmarks`
 * reads both on the built skin's midsagittal profile. The source's corners
 * fall short of the young-adult norms (Farkas, Katic and Forrest, Ann Plast
 * Surg 2007;59:692-698) by 6 to 18 mm, while their upper lip heights
 * (subnasale to stomion) sit within one standard deviation, so the shortfall
 * is below the lips: the chin. The fix adds one multiple of the source's
 * `chinHeight` positive endpoint (on every surface) to the neutral, the
 * multiple that minimises the squared shortfall over the given corners. Its
 * shape is the source's; only its size comes from the norms, and a factor
 * inside the channel's envelope interpolates what the source authored. Every
 * endpoint is a displacement, so channels, correctives and population rows
 * apply to the lengthened neutral unchanged; documents are restamped and
 * must build.
 *
 * Pure: returns new values.
 */
export function prepareLowerFaceBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  channel: string;
  skin: string;
  /** The vermilion seam midline vertices whose midpoint is stomion. */
  lips: { surface: string; upper: number; lower: number };
  norms: readonly ILowerFaceNorm[];
  profile: {
    nose: [number, number];
    chinDepth: number;
    level: number;
    step: number;
  };
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    factor: number;
    corners: {
      label: string;
      targetMetres: number;
      beforeMetres: number;
      afterMetres: number;
    }[];
  };
} {
  const { basis, documents, controls, revision } = structuredClone(input);
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("A lower face revision needs a distinct revision.");
  if (input.norms.length === 0)
    throw new Error("A lower face revision needs at least one norm.");
  const channel = basis.channels.find((one) => one.id === input.channel);
  if (channel === undefined || channel.kind !== "shape")
    throw new Error(
      `The lower face field names no shape channel ${input.channel}.`,
    );
  const lips = input.lips;
  if (!basis.surfaces.some((one) => one.id === lips.surface))
    throw new Error(`No lip surface ${lips.surface}.`);
  const skin = basis.surfaces.find((one) => one.id === input.skin);
  if (skin === undefined) throw new Error(`No surface ${input.skin}.`);
  const heights = (candidate: IAutoMovieHumanFaceBasis) => {
    const build = createHumanFaceBasisBuilder(candidate);
    return input.norms.map((norm) => {
      const positions = faceShapeFitSurfacePositions(
        candidate,
        build({
          id: "norm",
          name: "norm",
          basis: candidate.id,
          shape: norm.shape,
          expression: {},
        }),
        input.skin,
      );
      const seam = faceShapeFitSurfacePositions(
        candidate,
        build({
          id: "norm",
          name: "norm",
          basis: candidate.id,
          shape: norm.shape,
          expression: {},
        }),
        lips.surface,
      );
      const stomion =
        (seam[3 * lips.upper + 1]! + seam[3 * lips.lower + 1]!) / 2;
      return faceMidsagittalLandmarks({
        positions,
        indices: skin.indices,
        stomion,
        ...input.profile,
      }).lowerFaceHeight;
    });
  };
  const field = basis.surfaces.map((surface) => {
    const sum = new Float64Array(surface.positions.length);
    const rows = surface.targets[channel.positive] ?? [];
    for (let i = 0; i < rows.length; i += 4)
      for (let a = 0; a < 3; ++a) sum[3 * rows[i]! + a]! += rows[i + 1 + a]!;
    return sum;
  });
  const apply = (factor: number): IAutoMovieHumanFaceBasis => ({
    ...basis,
    surfaces: basis.surfaces.map((surface, s) => ({
      ...surface,
      positions: surface.positions.map((p, i) => p + factor * field[s]![i]!),
    })),
  });
  const before = heights(basis);
  const meanShortfall = (values: readonly number[]) =>
    values.reduce(
      (sum, value, k) => sum + (input.norms[k]!.targetMetres - value),
      0,
    ) / values.length;
  // Least squares of one additive factor is the mean shortfall over the
  // corners' common gain; the gain is measured, and the landmark reading is
  // piecewise linear, so a secant iteration settles it.
  let a = 0;
  let fa = meanShortfall(before);
  let b = 0.5;
  let fb = meanShortfall(heights(apply(b)));
  if (fb === fa)
    throw new Error("The chin field does not change the lower face.");
  for (let k = 0; k < 20 && Math.abs(fb) > 1e-7 && fb !== fa; ++k) {
    const next = b - (fb * (b - a)) / (fb - fa);
    [a, fa] = [b, fb];
    b = next;
    fb = meanShortfall(heights(apply(b)));
  }
  const lengthened = apply(b);
  const after = heights(lengthened);
  lengthened.id = revision;
  const build = createHumanFaceBasisBuilder(lengthened);
  const restamped = documents.map((document) => {
    const next = { ...document, basis: revision };
    build(next);
    return next;
  });
  return {
    basis: lengthened,
    documents: restamped,
    controls: { ...controls, basis: revision },
    receipt: {
      source: basis.id,
      revision,
      factor: b,
      corners: input.norms.map((norm, k) => ({
        label: norm.label,
        targetMetres: norm.targetMetres,
        beforeMetres: before[k]!,
        afterMetres: after[k]!,
      })),
    },
  };
}
