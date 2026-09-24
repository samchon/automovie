import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";

import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";

/** One closed-lip unit: its channels and the lower lip depressor they take. */
export interface ILipSealUnit {
  /** The unit's channels, both sides of a pair or one midline channel. */
  channels: string[];
  /**
   * The depressor channels: one per unit channel, same side, or any number
   * all added to a single midline channel.
   */
  depressors: string[];
}

/**
 * Keep closed-lip units' lips sealed with the source's own lip depressor.
 *
 * A unit that closes nothing and opens nothing, such as the smile, a lip
 * press or a pucker, moves the two lips together: whatever it does to the
 * corners, the lower lip cannot pass through the upper one. The source's
 * `mouthSmile` pair lifts the lower lip's midline 6.0 mm against the upper
 * lip's 3.2 mm, so the smiling lips cross by 2 mm at the midline, which a
 * crossing census of part pairs does not count because both lips lie on one
 * surface. For each unit the fix adds one multiple of its depressor endpoint
 * to each of its channels, the multiple that returns the midline vermilion
 * seam of the unit at weight one (every channel of it together) to its rest
 * aperture, read between the lip seam vertices along the basis vertical. The
 * depressor's shape is the source's; only its amount comes from the seal, and
 * a multiple outside [0, 1] would leave the channel's envelope, so it refuses
 * by name rather than extrapolate. Endpoints are displacements, so nothing
 * else moves; documents are restamped and must build.
 *
 * Pure: returns new values.
 */
export function prepareLipSealBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  units: readonly ILipSealUnit[];
  /** The vermilion seam midline vertices, upper then lower. */
  lips: { surface: string; upper: number; lower: number };
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    restApertureMetres: number;
    units: {
      channels: string[];
      depressors: string[];
      factor: number;
      apertureMetres: { before: number; after: number };
    }[];
  };
} {
  const { basis, documents, controls, revision } = structuredClone(input);
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("A lip seal revision needs a distinct revision.");
  const lips = input.lips;
  if (!basis.surfaces.some((one) => one.id === lips.surface))
    throw new Error(`No lip surface ${lips.surface}.`);
  const channel = (name: string) => {
    const found = basis.channels.find((one) => one.id === name);
    if (found === undefined || found.kind !== "expression")
      throw new Error(`The lip seal names no expression channel ${name}.`);
    return found.positive;
  };
  // Each unit channel's target and the depressor targets it takes.
  const plan = input.units.map((unit) => {
    if (
      unit.channels.length === 0 ||
      unit.depressors.length === 0 ||
      (unit.channels.length > 1 &&
        unit.channels.length !== unit.depressors.length)
    )
      throw new Error(
        "A lip seal unit pairs its channels with depressors one to one, or gives one channel any number.",
      );
    return unit.channels.map((name, k) => ({
      target: channel(name),
      depressors: (unit.channels.length === 1
        ? unit.depressors
        : [unit.depressors[k]!]
      ).map(channel),
    }));
  });
  const apply = (
    source: IAutoMovieHumanFaceBasis,
    rows: (typeof plan)[number],
    factor: number,
  ): IAutoMovieHumanFaceBasis => ({
    ...source,
    surfaces: source.surfaces.map((surface) => {
      const targets = { ...surface.targets };
      for (const { target, depressors } of rows) {
        const sum = new Map<number, [number, number, number]>();
        const own = surface.targets[target] ?? [];
        for (let i = 0; i < own.length; i += 4)
          sum.set(own[i]!, [own[i + 1]!, own[i + 2]!, own[i + 3]!]);
        let touched = false;
        for (const depressor of depressors) {
          const extra = surface.targets[depressor] ?? [];
          for (let i = 0; i < extra.length; i += 4) {
            touched = true;
            const row = sum.get(extra[i]!) ?? [0, 0, 0];
            sum.set(extra[i]!, [
              row[0] + factor * extra[i + 1]!,
              row[1] + factor * extra[i + 2]!,
              row[2] + factor * extra[i + 3]!,
            ]);
          }
        }
        if (!touched) continue;
        const rows = [...sum.entries()]
          .filter(([, row]) => row.some((value) => value !== 0))
          .sort((a, b) => a[0] - b[0])
          .flatMap(([vertex, row]) => [vertex, ...row]);
        if (rows.length === 0) delete targets[target];
        else targets[target] = rows;
      }
      return { ...surface, targets };
    }),
  });
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
  let sealed = basis;
  const rows = input.units.map((unit, u) => {
    const full = Object.fromEntries(unit.channels.map((name) => [name, 1]));
    const before = aperture(basis, full);
    // The seam is read on the built surface after the contact rules, so the
    // aperture is not exactly linear in the factor; a secant iteration from
    // the source (factor 0) settles it.
    let a = 0;
    let fa = before - rest;
    let b = 0.5;
    let fb = aperture(apply(sealed, plan[u]!, b), full) - rest;
    if (fb === fa)
      throw new Error(
        `The depressor of ${unit.channels.join("+")} does not move the seam.`,
      );
    for (let k = 0; k < 20 && Math.abs(fb) > 1e-7 && fb !== fa; ++k) {
      const next = b - (fb * (b - a)) / (fb - fa);
      [a, fa] = [b, fb];
      b = next;
      fb = aperture(apply(sealed, plan[u]!, b), full) - rest;
    }
    if (!(b >= 0 && b <= 1))
      throw new Error(
        `Sealing ${unit.channels.join("+")} needs ${b.toFixed(3)} of its depressor, outside its envelope.`,
      );
    sealed = apply(sealed, plan[u]!, b);
    return {
      channels: [...unit.channels],
      depressors: [...unit.depressors],
      factor: b,
      apertureMetres: { before, after: aperture(sealed, full) },
    };
  });
  sealed = { ...sealed, id: revision };
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
      restApertureMetres: rest,
      units: rows,
    },
  };
}
