import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";

import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";

/**
 * Keep a closed-lip unit's lips sealed with the source's own lip depressor.
 *
 * A unit that closes nothing and opens nothing, such as the smile, moves the
 * two lips together: whatever it does to the corners, the lower lip cannot
 * pass through the upper one. The source's `mouthSmile` pair lifts the lower
 * lip's midline 6.0 mm against the upper lip's 3.2 mm, so the smiling lips
 * cross by 2 mm at the midline, which a crossing census of part pairs does
 * not count because both lips lie on one surface. The fix adds one multiple of the same
 * side's `depressor` endpoint to each side of the unit, the multiple that
 * returns the midline vermilion seam of the bilateral unit at weight one to
 * its rest aperture, read between the lip seam vertices along the basis
 * vertical. The depressor's shape is the source's; only its amount
 * comes from the seal, and a multiple inside the channel's envelope
 * interpolates what the source authored. Endpoints are displacements, so
 * nothing else moves; documents are restamped and must build.
 *
 * Pure: returns new values.
 */
export function prepareLipSealBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  /** The unit's name without its side, such as `mouthSmile`. */
  unit: string;
  /** The lower lip depressor's name without its side. */
  depressor: string;
  /** The vermilion seam midline vertices, upper then lower. */
  lips: { surface: string; upper: number; lower: number };
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    unit: string;
    depressor: string;
    factor: number;
    apertureMetres: { rest: number; before: number; after: number };
  };
} {
  const { basis, documents, controls, revision } = structuredClone(input);
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("A lip seal revision needs a distinct revision.");
  const lips = input.lips;
  if (!basis.surfaces.some((one) => one.id === lips.surface))
    throw new Error(`No lip surface ${lips.surface}.`);
  const SIDES = ["Left", "Right"] as const;
  const channel = (name: string) => {
    const found = basis.channels.find((one) => one.id === name);
    if (found === undefined || found.kind !== "expression")
      throw new Error(`The lip seal names no expression channel ${name}.`);
    return found.positive;
  };
  const units = SIDES.map((side) => channel(`${input.unit}${side}`));
  const depressors = SIDES.map((side) => channel(`${input.depressor}${side}`));
  const apply = (factor: number): IAutoMovieHumanFaceBasis => ({
    ...basis,
    surfaces: basis.surfaces.map((surface) => {
      const targets = { ...surface.targets };
      SIDES.forEach((_, s) => {
        const extra = surface.targets[depressors[s]!] ?? [];
        if (extra.length === 0) return;
        const rows = new Map<number, [number, number, number]>();
        const own = surface.targets[units[s]!] ?? [];
        for (let i = 0; i < own.length; i += 4)
          rows.set(own[i]!, [own[i + 1]!, own[i + 2]!, own[i + 3]!]);
        for (let i = 0; i < extra.length; i += 4) {
          const row = rows.get(extra[i]!) ?? [0, 0, 0];
          rows.set(extra[i]!, [
            row[0] + factor * extra[i + 1]!,
            row[1] + factor * extra[i + 2]!,
            row[2] + factor * extra[i + 3]!,
          ]);
        }
        targets[units[s]!] = [...rows.entries()]
          .sort((a, b) => a[0] - b[0])
          .flatMap(([vertex, row]) => [vertex, ...row]);
      });
      return { ...surface, targets };
    }),
  });
  const bilateral = Object.fromEntries(
    SIDES.map((side) => [`${input.unit}${side}`, 1]),
  );
  const aperture = (
    candidate: IAutoMovieHumanFaceBasis,
    expression: Record<string, number>,
  ): number => {
    const seam = faceShapeFitSurfacePositions(
      candidate,
      createHumanFaceBasisBuilder(candidate)({
        id: "seal",
        name: "seal",
        basis: candidate.id,
        shape: {},
        expression,
      }),
      lips.surface,
    );
    return seam[3 * lips.upper + 1]! - seam[3 * lips.lower + 1]!;
  };
  const rest = aperture(basis, {});
  const before = aperture(basis, bilateral);
  // The seam is read on the built surface after the contact rules, so the
  // aperture is not exactly linear in the factor; a secant iteration from
  // the source (factor 0) settles it.
  let a = 0;
  let fa = before - rest;
  let b = 0.5;
  let fb = aperture(apply(b), bilateral) - rest;
  if (fb === fa)
    throw new Error(`The ${input.depressor} pair does not move the seam.`);
  for (let k = 0; k < 20 && Math.abs(fb) > 1e-7 && fb !== fa; ++k) {
    const next = b - (fb * (b - a)) / (fb - fa);
    [a, fa] = [b, fb];
    b = next;
    fb = aperture(apply(b), bilateral) - rest;
  }
  if (!(b >= 0 && b <= 1))
    throw new Error(
      `Sealing ${input.unit} needs ${b.toFixed(3)} of ${input.depressor}, outside its envelope.`,
    );
  const sealed = apply(b);
  const after = aperture(sealed, bilateral);
  sealed.id = revision;
  const build = createHumanFaceBasisBuilder(sealed);
  const restamped = documents.map((document) => {
    const next = { ...document, basis: revision };
    build(next);
    return next;
  });
  return {
    basis: sealed,
    documents: restamped,
    controls: { ...controls, basis: revision },
    receipt: {
      source: basis.id,
      revision,
      unit: input.unit,
      depressor: input.depressor,
      factor: b,
      apertureMetres: { rest, before, after },
    },
  };
}
