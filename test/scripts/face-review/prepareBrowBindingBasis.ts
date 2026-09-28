import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";

/**
 * Bind the brow card to the skin it lies on: every endpoint row of the card
 * becomes the skin's displacement under it.
 *
 * The source fits its brow card to the body (MPFB's `fit_clothes_to_human`:
 * each card vertex is a weighted sum of three body vertices plus an offset),
 * so wherever the skin moves the brow moves with it, which is what brow
 * hair rooted in the skin does. The brow rest revision reseated the card
 * 6.6 mm higher but kept the rows authored for its old seat, so on the brow
 * prominence, where the source's frontalis lifts the skin by up to 5.3 mm,
 * the card rose by only 1.8 to 3.5 mm and stretched. This revision rebinds
 * the card at its present seat: each card vertex is attached to the skin
 * triangle in front of the head at its own x and y (`attachFaceCard`, the
 * front-most triangle, as the camera sees the card lie on it), and every
 * target the skin carries is written to the card as the barycentric blend of
 * the three skin rows. Card-only targets, if any, are removed and listed.
 * The neutral positions do not move; documents are restamped and must
 * build.
 *
 * Pure: returns new values.
 */
export function prepareBrowBindingBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  skin: string;
  card: string;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    vertices: number;
    targets: number;
    removed: string[];
  };
} {
  const { basis, documents, controls, revision } = structuredClone(input);
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("A brow binding revision needs a distinct revision.");
  const skin = basis.surfaces.find((one) => one.id === input.skin);
  const card = basis.surfaces.find((one) => one.id === input.card);
  if (skin === undefined || card === undefined)
    throw new Error("The brow binding needs its skin and card surfaces.");
  const count = card.positions.length / 3;
  const attachments = Array.from({ length: count }, (_, v) => {
    const found = attachFaceCard(
      skin.positions,
      skin.indices,
      card.positions[3 * v]!,
      card.positions[3 * v + 1]!,
    );
    if (found === null)
      throw new Error(`Card vertex ${v} has no skin in front of the head.`);
    return found;
  });
  const removed = Object.keys(card.targets).filter(
    (name) => skin.targets[name] === undefined,
  );
  const targets: Record<string, number[]> = {};
  for (const [name, flat] of Object.entries(skin.targets)) {
    const rows = new Map<number, [number, number, number]>();
    for (let i = 0; i < flat.length; i += 4)
      rows.set(flat[i]!, [flat[i + 1]!, flat[i + 2]!, flat[i + 3]!]);
    const out: number[] = [];
    attachments.forEach(({ vertices, weights }, v) => {
      const d = [0, 1, 2].map((a) =>
        vertices.reduce(
          (sum, vertex, k) => sum + weights[k]! * (rows.get(vertex)?.[a] ?? 0),
          0,
        ),
      );
      if (d.some((one) => one !== 0)) out.push(v, d[0]!, d[1]!, d[2]!);
    });
    if (out.length > 0) targets[name] = out;
  }
  card.targets = targets;
  const source = basis.id;
  basis.id = revision;
  const build = createHumanFaceBasisBuilder(basis);
  const restamped = documents.map((document) => {
    const next = { ...document, basis: revision };
    build(next);
    return next;
  });
  return {
    basis,
    documents: restamped,
    controls: { ...controls, basis: revision },
    receipt: {
      source,
      revision,
      vertices: count,
      targets: Object.keys(targets).length,
      removed,
    },
  };
}

/**
 * The front-most triangle of a surface over (x, y) and the barycentric
 * weights of that point on it; null when no triangle covers the point.
 */
export function attachFaceCard(
  positions: readonly number[],
  indices: readonly number[],
  x: number,
  y: number,
): {
  vertices: [number, number, number];
  weights: [number, number, number];
} | null {
  let best: {
    z: number;
    vertices: [number, number, number];
    weights: [number, number, number];
  } | null = null;
  for (let t = 0; t < indices.length; t += 3) {
    const [i, j, k] = [indices[t]!, indices[t + 1]!, indices[t + 2]!];
    const ax = positions[3 * i]!;
    const ay = positions[3 * i + 1]!;
    const bx = positions[3 * j]!;
    const by = positions[3 * j + 1]!;
    const cx = positions[3 * k]!;
    const cy = positions[3 * k + 1]!;
    const det = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    if (det === 0) continue;
    const u = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / det;
    const v = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / det;
    const w = 1 - u - v;
    if (u < 0 || v < 0 || w < 0) continue;
    const z =
      u * positions[3 * i + 2]! +
      v * positions[3 * j + 2]! +
      w * positions[3 * k + 2]!;
    if (best === null || z > best.z)
      best = { z, vertices: [i, j, k], weights: [u, v, w] };
  }
  return best === null
    ? null
    : { vertices: best.vertices, weights: best.weights };
}
