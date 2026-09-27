import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

/**
 * The nasal root revision of the connected face basis: the nasal root's
 * prominence (`nasalRootProjection`, the control of the nasofrontal angle)
 * becomes one axis, its negative endpoint the positive's displacement
 * reversed.
 *
 * The source's endpoints are two sculpts of MakeHuman's "Greek nose"
 * (`nose-greek-incr` and `nose-greek-decr`). The positive fills the soft
 * tissue over the nasion, a smooth rise of up to 3.2 mm centred on the
 * nasion's own height (the midline's deepest point, 34 mm above the origin)
 * and fading 12 to 16 mm above and below it: the straight profile of the
 * name. The negative is not its reverse: it digs a notch 3.2 mm deep 4.5 mm
 * below the nasion (at 29.6 mm) whose lower wall rises 3 mm in 11 mm, so
 * the deepest point drops onto the dorsum and the dorsum's top steepens.
 * Rendered, it is a groove across the bridge at the upper lids' height
 * (phenomenon 18 of the face anatomy inventory: a dark band above every eye,
 * in clay and without shadows as well, drawn by -0.41 on Kim Min-jung's
 * document alone), and from the side a step where the dorsum begins. A
 * nasal root set back is the same soft tissue over the same nasion
 * receding, so the negative endpoint here is the positive's rows negated
 * on every surface the positive moves: the concavity deepens where it lies
 * and with the falloff it has, and the profile from forehead to dorsum
 * stays one curve. A surface the old negative moved but the positive does
 * not loses those rows. The negative side's envelope returns to the
 * authored -1 (its earlier extension measured the notch); the caller
 * extends it again over the nasofrontal angle's reference interval.
 * Everything else, the documents and the control map are copied, restamped
 * to `revision`. Pure.
 */
export function prepareNasalRootBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  channel: string;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    channel: string;
    surfaces: { surface: string; rows: number; removed: number }[];
  };
} {
  if (input.revision.trim() === "" || input.revision === input.basis.id)
    throw new Error("A nasal root revision needs a distinct revision.");
  const basis = structuredClone(input.basis);
  const channel = basis.channels.find((one) => one.id === input.channel);
  if (
    channel === undefined ||
    channel.kind !== "shape" ||
    channel.positive === null ||
    channel.negative === null
  )
    throw new Error(`No two-sided shape channel ${input.channel}.`);
  const surfaces = basis.surfaces.flatMap((surface) => {
    const positive = surface.targets[channel.positive!];
    const negative = surface.targets[channel.negative!];
    if (positive === undefined && negative === undefined) return [];
    const removed = negative === undefined ? 0 : negative.length / 4;
    if (positive === undefined) {
      delete surface.targets[channel.negative!];
      return [{ surface: surface.id, rows: 0, removed }];
    }
    const reversed: number[] = [];
    for (let i = 0; i < positive.length; i += 4)
      reversed.push(
        positive[i]!,
        -positive[i + 1]!,
        -positive[i + 2]!,
        -positive[i + 3]!,
      );
    surface.targets[channel.negative!] = reversed;
    return [{ surface: surface.id, rows: positive.length / 4, removed }];
  });
  if (!surfaces.some((one) => one.rows > 0))
    throw new Error(`Channel ${input.channel}'s positive moves no surface.`);
  channel.minimum = -1;
  basis.id = input.revision;
  return {
    basis,
    documents: input.documents.map((one) => ({
      ...structuredClone(one),
      basis: input.revision,
    })),
    controls: { ...structuredClone(input.controls), basis: input.revision },
    receipt: {
      source: input.basis.id,
      revision: input.revision,
      channel: input.channel,
      surfaces,
    },
  };
}
