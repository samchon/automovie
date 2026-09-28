import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

/**
 * The lid crease revision of the connected face basis: each upper lid's
 * fold convexity (`leftEyelidFoldConvexity`, `rightEyelidFoldConvexity`)
 * reaches, on its concave side, as far as the lid stays whole.
 *
 * The source's negative endpoint is MakeHuman's concave lid fold: along the
 * crease, 3.5 mm above the lid margin above the pupil, its rows press the
 * skin 3.6 mm in along its normal and carry it 2.6 mm up along the lid at
 * -1, so the pressed skin slides up behind the skin above it: a cleft under
 * an overhanging fold, as a supratarsal crease is (the preseptal skin and
 * orbicularis folding over the pretarsal at the levator's skin insertion,
 * the crease itself hidden above the fold's edge in the open eye). The valid
 * envelope revision had cut the side at -0.3 on a render ("-0.4 overhangs
 * the lid with a lit ridge"), which is the fold's edge catching the key; at
 * -0.3 the cleft renders as no crease. Its rows are kept as the source drew
 * them and the side's minimum becomes `minimum`, the last weight before the
 * lid adds a fault to the neutral (read by the caller). The receipt
 * gives each channel's rows and, at -1, the deepest row's depth along the
 * skin's normal at rest (the area-weighted normal of its triangles on
 * `skin`) and the largest part along the skin. The positive endpoint, other
 * surfaces' rows and everything else, the documents and the control map are
 * copied, restamped to `revision`. Pure.
 */
export function prepareLidCreaseBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  skin: string;
  channels: string[];
  minimum: number;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    minimum: number;
    channels: {
      channel: string;
      rows: number;
      /** The deepest row's depth along the normal at -1, metres. */
      depth: number;
      /** The largest part of a row along the skin at -1, metres. */
      slide: number;
    }[];
  };
} {
  if (input.revision.trim() === "" || input.revision === input.basis.id)
    throw new Error("A lid crease revision needs a distinct revision.");
  if (!(input.minimum >= -1 && input.minimum < 0))
    throw new Error("The concave side's minimum lies in [-1, 0).");
  const basis = structuredClone(input.basis);
  const skin = basis.surfaces.find((one) => one.id === input.skin);
  if (skin === undefined) throw new Error(`No surface ${input.skin}.`);
  const normal = faceSkinNormals(skin.positions, skin.indices);
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
    const { depth, slide } = faceLidCreaseDepth(rows, normal);
    channel.minimum = input.minimum;
    return { channel: id, rows: rows.length / 4, depth, slide };
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
      minimum: input.minimum,
      channels,
    },
  };
}

/**
 * Each vertex's unit normal at rest: the area-weighted sum of its
 * triangles' normals (zero for a vertex no triangle uses). Pure.
 */
export function faceSkinNormals(
  positions: readonly number[],
  indices: readonly number[],
): number[] {
  const P = positions;
  const normal = new Array<number>(P.length).fill(0);
  for (let t = 0; t < indices.length; t += 3) {
    const [a, b, c] = [0, 1, 2].map((k) => indices[t + k]!);
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
  for (let v = 0; v < P.length / 3; ++v) {
    const length = Math.hypot(
      normal[3 * v]!,
      normal[3 * v + 1]!,
      normal[3 * v + 2]!,
    );
    for (let k = 0; k < 3; ++k)
      normal[3 * v + k] = length === 0 ? 0 : normal[3 * v + k]! / length;
  }
  return normal;
}

/**
 * How deep a concave endpoint presses the skin: its rows' largest inward
 * part along the vertices' normals (`faceSkinNormals`) and their largest
 * part along the skin, at the endpoint's full weight. Pure.
 */
export function faceLidCreaseDepth(
  rows: readonly number[],
  normal: readonly number[],
): { depth: number; slide: number } {
  let depth = 0;
  let slide = 0;
  for (let i = 0; i < rows.length; i += 4) {
    const v = rows[i]!;
    const n = [0, 1, 2].map((k) => normal[3 * v + k]!);
    const d = [0, 1, 2].map((k) => rows[i + 1 + k]!);
    const along = d[0]! * n[0]! + d[1]! * n[1]! + d[2]! * n[2]!;
    depth = Math.max(depth, -along);
    slide = Math.max(
      slide,
      Math.hypot(...[0, 1, 2].map((k) => d[k]! - along * n[k]!)),
    );
  }
  return { depth, slide };
}
