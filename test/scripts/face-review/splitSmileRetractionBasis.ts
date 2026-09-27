import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

/**
 * The smile retraction as channels of its own: each side's smile keeps the
 * rows it had before the retraction was added (`source`, the basis the smile
 * retraction revision was prepared from), and a new expression channel per
 * side (`into`) carries the difference, the retraction exactly as published,
 * so both at one weight reproduce the published smile.
 *
 * The retraction was sized on the neutral face: the lips drawn back onto
 * the crowns to the posed smile's norm, each lip column held off the teeth.
 * A basis is linear, so on a face whose lips stand differently the same rows
 * can press a lip through the skin below it (round j20: twelve crossings at
 * the lower lip's midline of one document at a third of a smile, none on the
 * neutral). Merged into the smile, a crossing made the whole photographed
 * smile yield; split off, the retraction is a component set by its norm and
 * yields first, as the smile's orbital part does. Surfaces whose smile rows
 * the source lacks keep theirs; the difference drops rows equal to within
 * a nanometre. Everything else, the documents and the control map are
 * copied, restamped to `revision`. Pure.
 */
export function splitSmileRetractionBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  source: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  channels: { left: string; right: string };
  into: { left: string; right: string };
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    rows: Record<string, number>;
  };
} {
  if (input.revision.trim() === "" || input.revision === input.basis.id)
    throw new Error("A split revision needs a distinct revision.");
  const basis = structuredClone(input.basis);
  const rows: Record<string, number> = {};
  for (const side of ["left", "right"] as const) {
    const smile = basis.channels.find((one) => one.id === input.channels[side]);
    const before = input.source.channels.find(
      (one) => one.id === input.channels[side],
    );
    if (smile === undefined || before === undefined || smile.positive === null)
      throw new Error(
        `No smile channel ${input.channels[side]} in both bases.`,
      );
    if (basis.channels.some((one) => one.id === input.into[side]))
      throw new Error(`The basis already has a channel ${input.into[side]}.`);
    let count = 0;
    for (const surface of basis.surfaces) {
      const now = surface.targets[smile.positive];
      if (now === undefined) continue;
      const own = input.source.surfaces.find((one) => one.id === surface.id);
      const then = own?.targets[before.positive!];
      if (then === undefined) continue;
      const table = new Map<number, number[]>();
      for (let i = 0; i < then.length; i += 4)
        table.set(then[i]!, [then[i + 1]!, then[i + 2]!, then[i + 3]!]);
      const difference: number[] = [];
      for (let i = 0; i < now.length; i += 4) {
        const was = table.get(now[i]!) ?? [0, 0, 0];
        const d = [0, 1, 2].map((k) => now[i + 1 + k]! - was[k]!);
        if (d.some((value) => Math.abs(value) > 1e-9)) {
          difference.push(now[i]!, d[0]!, d[1]!, d[2]!);
          ++count;
        }
      }
      if (difference.length === 0) continue;
      surface.targets[input.into[side]] = difference;
      surface.targets[smile.positive] = [...then];
    }
    basis.channels.push({
      id: input.into[side],
      description: `The ${side} side of a smile's lip retraction onto the dental crowns, set with the smile to the posed smile's norm.`,
      kind: "expression",
      minimum: 0,
      maximum: 1,
      positive: input.into[side],
      negative: null,
    });
    rows[input.into[side]] = count;
  }
  const source = basis.id;
  basis.id = input.revision;
  return {
    basis,
    documents: input.documents.map((one) => ({
      ...structuredClone(one),
      basis: input.revision,
    })),
    controls: { ...structuredClone(input.controls), basis: input.revision },
    receipt: { source, revision: input.revision, rows },
  };
}

/** Each side's smile and the retraction split off it. */
export const FACE_SMILE_RETRACTION_UNITS = [
  { smile: "mouthSmileLeft", retraction: "mouthSmileRetractLeft" },
  { smile: "mouthSmileRight", retraction: "mouthSmileRetractRight" },
] as const;
