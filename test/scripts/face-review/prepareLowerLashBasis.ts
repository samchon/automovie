import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
  decodePortraitPng,
  encodePortraitPng,
} from "@automovie/human";

/**
 * Give the lower lashes their own share of the lash coverage.
 *
 * The lower lid carries fewer lashes than the upper: 75 to 80 against 90 to
 * 160 (Aumond and Bitton, J Optom 2018;11:211-222). A card's drawn strands
 * cover a surface area proportional to their count times their length, and
 * a card's strand length is its extent away from the lid margin, its area
 * over its span across the eye. Keeping the lengths the card draws, the
 * lower card should cover the upper card's area times `count`, the two
 * lids' count ratio, times the lower card's length over the upper's. The
 * source card draws its lower lashes at nearly twice that coverage, which
 * is why they read as a dark fringe no photograph shows.
 *
 * The card's connected pieces lying wholly below their own eye's corneal
 * apex are the lower lashes; their triangles move to a copy of the lash
 * material. Covered area is measured on the surface: each triangle's area
 * times the fraction of its texels whose alpha passes the material's cutoff.
 * The copy's texture drops whole drawn clumps (texels with any alpha,
 * 8-connected, inside the lower triangles' texture footprint) at an even
 * spacing along the texture's u axis, keeping the most clumps whose
 * coverage does not exceed the target; the strands kept are unchanged and
 * nothing moves. Documents are restamped and must build.
 *
 * Pure: returns new values.
 */
export function prepareLowerLashBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  lashes: string;
  eyes: string;
  count: number;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    material: string;
    count: number;
    length: { upper: number; lower: number };
    lowerTriangles: number;
    upperTriangles: number;
    upperCovered: number;
    lowerCovered: { before: number; target: number; after: number };
    clumps: { before: number; kept: number };
  };
} {
  const { basis, documents, controls, revision } = structuredClone(input);
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("A lower lash revision needs a distinct revision.");
  if (!(input.count > 0 && input.count <= 1))
    throw new Error("A lower lash count ratio lies in (0, 1].");
  const lashes = basis.surfaces.find((one) => one.id === input.lashes);
  const eyes = basis.surfaces.find((one) => one.id === input.eyes);
  if (
    lashes === undefined ||
    eyes === undefined ||
    lashes.regions.length !== 1 ||
    lashes.regions[0]!.uvs === null
  )
    throw new Error(
      "The lower lash revision needs one textured lash region and the eyes.",
    );
  const region = lashes.regions[0]!;
  const uvs = region.uvs!;
  const material = basis.materials.find((one) => one.id === region.material);
  if (material === undefined || typeof material.baseColorTexture !== "string")
    throw new Error("The lash region needs a textured material.");
  const cutoff = Math.round(255 * (material.alphaCutoff ?? 0.5));
  // Each side's corneal apex: its globe's front-most vertex.
  const apex = (side: number): number => {
    let best = -1;
    for (let v = 0; v < eyes.positions.length / 3; ++v)
      if (
        Math.sign(eyes.positions[3 * v]!) === side &&
        (best < 0 || eyes.positions[3 * v + 2]! > eyes.positions[3 * best + 2]!)
      )
        best = v;
    if (best < 0) throw new Error("Each side needs a globe.");
    return eyes.positions[3 * best + 1]!;
  };
  const level: Record<number, number> = { [-1]: apex(-1), 1: apex(1) };
  // Connected pieces of the card.
  const parent = Array.from(
    { length: lashes.positions.length / 3 },
    (_, v) => v,
  );
  const root = (v: number): number => {
    while (parent[v] !== v) v = parent[v]!;
    return v;
  };
  for (let t = 0; t < region.indices.length; t += 3)
    for (let k = 1; k < 3; ++k)
      parent[root(region.indices[t + k]!)] = root(region.indices[t]!);
  const highest = new Map<number, number>();
  const sideOf = new Map<number, number>();
  for (let v = 0; v < lashes.positions.length / 3; ++v) {
    const r = root(v);
    highest.set(
      r,
      Math.max(highest.get(r) ?? -Infinity, lashes.positions[3 * v + 1]!),
    );
    sideOf.set(r, Math.sign(lashes.positions[3 * v]!));
  }
  const lower = (vertex: number) => {
    const r = root(vertex);
    return highest.get(r)! < level[sideOf.get(r)!]!;
  };
  const upper: number[] = [];
  const below: number[] = [];
  for (let t = 0; t < region.indices.length / 3; ++t)
    (lower(region.indices[3 * t]!) ? below : upper).push(t);
  if (below.length === 0 || upper.length === 0)
    throw new Error("The lash card needs both an upper and a lower piece.");

  const image = decodePortraitPng(material.baseColorTexture);
  const { width, height } = image;
  // Texels whose centre lies in a triangle's texture footprint.
  const texels = (t: number): number[] => {
    const q = [0, 1, 2].map((k) => [
      uvs[6 * t + 2 * k]! * width - 0.5,
      uvs[6 * t + 2 * k + 1]! * height - 0.5,
    ]);
    const edge = (a: number[], b: number[], x: number, y: number) =>
      (b[0]! - a[0]!) * (y - a[1]!) - (b[1]! - a[1]!) * (x - a[0]!);
    const sign = Math.sign(edge(q[0]!, q[1]!, q[2]![0]!, q[2]![1]!));
    const out: number[] = [];
    const x0 = Math.max(0, Math.floor(Math.min(...q.map((p) => p[0]!))));
    const x1 = Math.min(width - 1, Math.ceil(Math.max(...q.map((p) => p[0]!))));
    const y0 = Math.max(0, Math.floor(Math.min(...q.map((p) => p[1]!))));
    const y1 = Math.min(
      height - 1,
      Math.ceil(Math.max(...q.map((p) => p[1]!))),
    );
    for (let y = y0; y <= y1; ++y)
      for (let x = x0; x <= x1; ++x)
        if (
          [0, 1, 2].every((k) => sign * edge(q[k]!, q[(k + 1) % 3]!, x, y) >= 0)
        )
          out.push(y * width + x);
    return out;
  };
  const area = (t: number): number => {
    const p = [0, 1, 2].map((k) => {
      const v = region.indices[3 * t + k]!;
      return [0, 1, 2].map((c) => lashes.positions[3 * v + c]!);
    });
    const u = [0, 1, 2].map((c) => p[1]![c]! - p[0]![c]!);
    const w = [0, 1, 2].map((c) => p[2]![c]! - p[0]![c]!);
    return (
      0.5 *
      Math.hypot(
        u[1]! * w[2]! - u[2]! * w[1]!,
        u[2]! * w[0]! - u[0]! * w[2]!,
        u[0]! * w[1]! - u[1]! * w[0]!,
      )
    );
  };
  const footprint = new Map<number, number[]>();
  for (const t of [...upper, ...below]) footprint.set(t, texels(t));
  const covered = (triangles: number[], alpha: (texel: number) => number) =>
    triangles.reduce((sum, t) => {
      const cells = footprint.get(t)!;
      if (cells.length === 0) return sum;
      const passing = cells.filter((c) => alpha(c) >= cutoff).length;
      return sum + (area(t) * passing) / cells.length;
    }, 0);
  const source = (texel: number) => image.rgba[4 * texel + 3]!;
  const upperCovered = covered(upper, source);
  const before = covered(below, source);
  // A card's strand length: its area over its span across the eye, the
  // sides' spans summed.
  const length = (triangles: number[]): number => {
    let total = 0;
    for (const side of [-1, 1]) {
      let low = Infinity;
      let high = -Infinity;
      for (const t of triangles)
        for (let k = 0; k < 3; ++k) {
          const x = lashes.positions[3 * region.indices[3 * t + k]!]!;
          if (Math.sign(x) !== side) continue;
          low = Math.min(low, x);
          high = Math.max(high, x);
        }
      if (high > low) total += high - low;
    }
    return triangles.reduce((sum, t) => sum + area(t), 0) / total;
  };
  const lengths = { upper: length(upper), lower: length(below) };
  const target = (upperCovered * input.count * lengths.lower) / lengths.upper;

  // Drawn clumps inside the lower footprint, ordered along u.
  const inside = new Uint8Array(width * height);
  for (const t of below) for (const c of footprint.get(t)!) inside[c] = 1;
  const label = new Int32Array(width * height).fill(-1);
  const clumps: { u: number }[] = [];
  for (let start = 0; start < width * height; ++start) {
    if (inside[start] === 0 || source(start) === 0 || label[start]! >= 0)
      continue;
    let sum = 0;
    let members = 0;
    const stack = [start];
    label[start] = clumps.length;
    while (stack.length !== 0) {
      const c = stack.pop()!;
      const x = c % width;
      const y = (c - x) / width;
      sum += x;
      ++members;
      for (let dy = -1; dy <= 1; ++dy)
        for (let dx = -1; dx <= 1; ++dx) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const n = ny * width + nx;
          if (inside[n] === 0 || source(n) === 0 || label[n]! >= 0) continue;
          label[n] = clumps.length;
          stack.push(n);
        }
    }
    clumps.push({ u: sum / members });
  }
  const order = clumps
    .map((clump, index) => ({ index, u: clump.u }))
    .sort((a, b) => a.u - b.u || a.index - b.index)
    .map((entry) => entry.index);
  // Keep n of the N clumps at even spacing: the k-th along u is kept when
  // floor((k + 1) n / N) exceeds floor(k n / N).
  const keptFor = (n: number): Set<number> =>
    new Set(
      order.filter(
        (_, k) =>
          Math.floor(((k + 1) * n) / order.length) >
          Math.floor((k * n) / order.length),
      ),
    );
  const alphaFor = (kept: Set<number>) => (texel: number) =>
    label[texel]! >= 0 && !kept.has(label[texel]!) ? 0 : source(texel);
  let best: Set<number> | null = before <= target ? new Set(order) : null;
  for (let n = order.length - 1; best === null && n >= 1; --n) {
    const kept = keptFor(n);
    if (covered(below, alphaFor(kept)) <= target) best = kept;
  }
  if (best === null)
    throw new Error("No clump spacing reaches the lower lash coverage.");
  const alpha = alphaFor(best);
  const rgba = Uint8Array.from(image.rgba);
  for (let texel = 0; texel < width * height; ++texel)
    rgba[4 * texel + 3] = alpha(texel);
  const lowerId = `${material.id}.lower`;
  basis.materials.push({
    ...material,
    id: lowerId,
    name: lowerId,
    baseColorTexture: encodePortraitPng({ ...image, rgba }),
  });
  const pick = (triangles: number[]) => ({
    indices: triangles.flatMap((t) => region.indices.slice(3 * t, 3 * t + 3)),
    uvs: triangles.flatMap((t) => uvs.slice(6 * t, 6 * t + 6)),
  });
  lashes.regions = [
    { ...region, ...pick(upper) },
    { id: `${region.id}.lower`, material: lowerId, ...pick(below) },
  ];
  const from = basis.id;
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
      source: from,
      revision,
      material: lowerId,
      count: input.count,
      length: lengths,
      lowerTriangles: below.length,
      upperTriangles: upper.length,
      upperCovered,
      lowerCovered: { before, target, after: covered(below, alpha) },
      clumps: { before: clumps.length, kept: best.size },
    },
  };
}
