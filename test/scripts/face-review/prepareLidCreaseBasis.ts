import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

/**
 * The lid crease revision of the connected face basis: each upper lid's
 * fold convexity (`leftEyelidFoldConvexity`, `rightEyelidFoldConvexity`)
 * keeps its concave side as the supratarsal crease alone.
 *
 * The source's negative endpoint is MakeHuman's concave lid fold: a narrow
 * groove along the crease, 3.5 mm above the lid margin above the pupil and
 * about 1.5 mm across, pressed 3.6 mm into the skin at -1, with the same
 * rows also carrying the lid 1.7 mm along the skin (mostly upward). That
 * shear is what faults: past -0.3 the lid overhangs itself with a lit ridge
 * and at -1 it folds back (the valid envelope revision cut the side at
 * -0.3, where the groove is 1.1 mm deep and renders as no crease). The
 * crease is an invagination: the preseptal skin and orbicularis folding
 * over the pretarsal at the levator's skin insertion, with nothing sliding
 * along the lid. So each row of the negative endpoint keeps only its part
 * along the skin's normal at rest (the area-weighted normal of its
 * triangles on `skin`), and the side returns to -1. The positive endpoint,
 * other surfaces' rows and everything else, the documents and the control
 * map are copied, restamped to `revision`. Pure.
 */
export function prepareLidCreaseBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  skin: string;
  channels: string[];
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    channels: {
      channel: string;
      rows: number;
      /** The deepest row's depth along the normal at -1, metres. */
      depth: number;
      /** The largest part along the skin dropped from a row, metres. */
      dropped: number;
    }[];
  };
} {
  if (input.revision.trim() === "" || input.revision === input.basis.id)
    throw new Error("A lid crease revision needs a distinct revision.");
  const basis = structuredClone(input.basis);
  const skin = basis.surfaces.find((one) => one.id === input.skin);
  if (skin === undefined) throw new Error(`No surface ${input.skin}.`);
  const P = skin.positions;
  const normal = new Array<number>(P.length).fill(0);
  for (let t = 0; t < skin.indices.length; t += 3) {
    const [a, b, c] = [0, 1, 2].map((k) => skin.indices[t + k]!);
    const u = [0, 1, 2].map((k) => P[3 * b! + k]! - P[3 * a! + k]!);
    const v = [0, 1, 2].map((k) => P[3 * c! + k]! - P[3 * a! + k]!);
    const n = [
      u[1]! * v[2]! - u[2]! * v[1]!,
      u[2]! * v[0]! - u[0]! * v[2]!,
      u[0]! * v[1]! - u[1]! * v[0]!,
    ];
    for (const w of [a!, b!, c!])
      for (let k = 0; k < 3; ++k) normal[3 * w + k]! += n[k]!;
  }
  const channels = input.channels.map((id) => {
    const channel = basis.channels.find((one) => one.id === id);
    if (
      channel === undefined ||
      channel.kind !== "shape" ||
      channel.negative === null
    )
      throw new Error(`No shape channel ${id} with a negative endpoint.`);
    const rows = skin.targets[channel.negative];
    if (rows === undefined)
      throw new Error(`Channel ${id}'s negative moves no ${input.skin}.`);
    const projected: number[] = [];
    let depth = 0;
    let dropped = 0;
    for (let i = 0; i < rows.length; i += 4) {
      const v = rows[i]!;
      const n = [0, 1, 2].map((k) => normal[3 * v + k]!);
      const length = Math.hypot(...n);
      const d = [0, 1, 2].map((k) => rows[i + 1 + k]!);
      const along =
        length === 0
          ? 0
          : (d[0]! * n[0]! + d[1]! * n[1]! + d[2]! * n[2]!) / length;
      const kept = n.map((one) => (length === 0 ? 0 : (along * one) / length));
      depth = Math.max(depth, -along);
      dropped = Math.max(
        dropped,
        Math.hypot(...[0, 1, 2].map((k) => d[k]! - kept[k]!)),
      );
      projected.push(v, kept[0]!, kept[1]!, kept[2]!);
    }
    skin.targets[channel.negative] = projected;
    channel.minimum = -1;
    return { channel: id, rows: rows.length / 4, depth, dropped };
  });
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
      channels,
    },
  };
}
