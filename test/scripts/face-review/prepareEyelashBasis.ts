import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  encodePortraitPng,
} from "@automovie/human";

/** A lid's lashes as the anatomy reports them. */
export interface IEyelashNorm {
  /** The lash surface region that carries this lid's cards. */
  region: string;
  /** The material the region's cards are drawn with. */
  material: string;
  /** Lashes along one lid. */
  count: number;
  /** Longest lash, mm, at the medial end, the centre and the lateral end. */
  length: { medial: number; central: number; lateral: number };
  /** Fibre diameter, mm. */
  diameter: number;
  /**
   * The share of the lid's follicles growing (anagen); a growing lash is
   * anywhere between none and its full length, a resting one full length.
   */
  growing: number;
}

/** One lash card: its root and tip edges in UV, its triangles in UV and 3D. */
export interface IEyelashCard {
  root: [number, number][];
  tip: [number, number][];
  triangles: {
    uv: [[number, number], [number, number], [number, number]];
    xyz: [
      [number, number, number],
      [number, number, number],
      [number, number, number],
    ];
  }[];
  /** True when the root chain runs from the lateral end to the medial. */
  lateralFirst: boolean;
}

/** Deterministic uniform numbers in [0, 1) (mulberry32). */
const random = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/**
 * The lash cards of one region: each connected card is a triangulated grid,
 * its boundary loop split at its four corners (the loop's four sharpest
 * turns in UV) into two long rows and two short ends; the long row nearer the lid's skin is the root edge and the
 * other the tip edge, both ordered along the lid, one vertex per column.
 * Cards that share one UV strip (the two eyes' mirrored cards) are drawn
 * once. Pure.
 */
export function faceEyelashCards(props: {
  positions: readonly number[];
  indices: readonly number[];
  uvs: readonly number[];
  skin: readonly number[];
}): IEyelashCard[] {
  const { positions: P, indices: I, uvs } = props;
  const uv = new Map<number, [number, number]>();
  I.forEach((v, i) => uv.set(v, [uvs[2 * i]!, uvs[2 * i + 1]!]));
  const xyz = (v: number): [number, number, number] => [
    P[3 * v]!,
    P[3 * v + 1]!,
    P[3 * v + 2]!,
  ];
  const parent = new Map<number, number>();
  const find = (v: number): number => {
    while (parent.get(v) !== v) v = parent.get(v)!;
    return v;
  };
  for (const v of I) if (!parent.has(v)) parent.set(v, v);
  for (let t = 0; t < I.length; t += 3)
    for (const v of [I[t + 1]!, I[t + 2]!]) parent.set(find(v), find(I[t]!));
  const components = new Map<number, number[]>();
  for (let t = 0; t < I.length; t += 3) {
    const k = find(I[t]!);
    if (!components.has(k)) components.set(k, []);
    components.get(k)!.push(t);
  }
  const skinDistance = (v: number) => {
    let best = Infinity;
    for (let k = 0; k < props.skin.length; k += 3)
      best = Math.min(
        best,
        Math.hypot(
          props.skin[k]! - P[3 * v]!,
          props.skin[k + 1]! - P[3 * v + 1]!,
          props.skin[k + 2]! - P[3 * v + 2]!,
        ),
      );
    return best;
  };
  const cards: IEyelashCard[] = [];
  const seen: [number, number][] = [];
  for (const triangles of components.values()) {
    const edges = new Map<string, [number, number]>();
    const count = new Map<string, number>();
    for (const t of triangles)
      for (const [a, b] of [
        [I[t]!, I[t + 1]!],
        [I[t + 1]!, I[t + 2]!],
        [I[t + 2]!, I[t]!],
      ] as const) {
        const key = a < b ? `${a},${b}` : `${b},${a}`;
        edges.set(key, [a, b]);
        count.set(key, (count.get(key) ?? 0) + 1);
      }
    const boundary = [...edges]
      .filter(([key]) => count.get(key) === 1)
      .map(([, edge]) => edge);
    // A card is a triangulated grid: its boundary is one loop, and between
    // its four corners lie two long rows (root and tip) and two short ends.
    // A boundary vertex has two boundary neighbours, so the walk always goes
    // on; it closes early only where the boundary is more than one loop.
    const next = new Map<number, number[]>();
    for (const [a, b] of boundary) {
      next.set(a, [...(next.get(a) ?? []), b]);
      next.set(b, [...(next.get(b) ?? []), a]);
    }
    const loop = [boundary[0]![0]];
    for (;;) {
      const onward = next
        .get(loop[loop.length - 1]!)!
        .find((v) => v !== loop[loop.length - 2])!;
      if (onward === loop[0]) break;
      loop.push(onward);
    }
    if (loop.length !== next.size)
      throw new Error("A lash card boundary is not one loop.");
    // The loop turns by about a right angle at each corner and little along
    // a row, so the corners are the four sharpest turns in UV.
    const turn = (k: number) => {
      const [p, q, r] = [-1, 0, 1].map(
        (d) => uv.get(loop[(k + d + loop.length) % loop.length]!)!,
      );
      const a = Math.atan2(q![1] - p![1], q![0] - p![0]);
      const b = Math.atan2(r![1] - q![1], r![0] - q![0]);
      return Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a)));
    };
    // A jagged row can turn nearly as sharply as a corner, so of the ten
    // sharpest turns the corners are the four that cut the loop into a grid:
    // opposite sides of equal length, rows times columns the card's vertices.
    const cardVertices = new Set(
      triangles.flatMap((t) => [I[t]!, I[t + 1]!, I[t + 2]!]),
    ).size;
    const candidates = loop
      .map((_, k) => k)
      .sort((p, q) => turn(q) - turn(p))
      .slice(0, 10);
    let corners: number[] = [];
    let sharpest = -Infinity;
    for (let i = 0; i < candidates.length; ++i)
      for (let j = i + 1; j < candidates.length; ++j)
        for (let k = j + 1; k < candidates.length; ++k)
          for (let l = k + 1; l < candidates.length; ++l) {
            const four = [
              candidates[i]!,
              candidates[j]!,
              candidates[k]!,
              candidates[l]!,
            ].sort((p, q) => p - q);
            const lengths = four.map(
              (start, m) =>
                ((four[(m + 1) % 4]! - start + loop.length) % loop.length) + 1,
            );
            const total = four.reduce((sum, m) => sum + turn(m), 0);
            if (
              lengths[0] === lengths[2] &&
              lengths[1] === lengths[3] &&
              lengths[0]! * lengths[1]! === cardVertices &&
              total > sharpest
            ) {
              corners = four;
              sharpest = total;
            }
          }
    if (corners.length !== 4)
      throw new Error("A lash card is not a grid with four corners.");
    const sides = corners.map((start, k) => {
      const end = corners[(k + 1) % 4]!;
      const side: number[] = [];
      for (let i = start; ; i = (i + 1) % loop.length) {
        side.push(loop[i]!);
        if (i === end) break;
      }
      return side;
    });
    const long = [...sides]
      .sort((p, q) => q.length - p.length)
      .slice(0, 2)
      .map((side) => ({
        side,
        distance:
          side.reduce((sum, v) => sum + skinDistance(v), 0) / side.length,
      }))
      .sort((p, q) => p.distance - q.distance);
    const root = long[0]!.side;
    let tip = long[1]!.side;
    // Both edges run the same way along the lid.
    const d = (a: number, b: number) => {
      const [p, q] = [uv.get(a)!, uv.get(b)!];
      return Math.hypot(p[0] - q[0], p[1] - q[1]);
    };
    if (d(root[0]!, tip[0]!) > d(root[0]!, tip[tip.length - 1]!))
      tip = tip.reverse();
    const centre = [0, 1].map(
      (a) => root.reduce((sum, v) => sum + uv.get(v)![a]!, 0) / root.length,
    ) as [number, number];
    if (seen.some((c) => Math.hypot(c[0] - centre[0], c[1] - centre[1]) < 1e-3))
      continue;
    seen.push(centre);
    cards.push({
      root: root.map((v) => uv.get(v)!),
      tip: tip.map((v) => uv.get(v)!),
      triangles: triangles.map((t) => ({
        uv: [uv.get(I[t]!)!, uv.get(I[t + 1]!)!, uv.get(I[t + 2]!)!],
        xyz: [xyz(I[t]!), xyz(I[t + 1]!), xyz(I[t + 2]!)],
      })),
      lateralFirst:
        Math.abs(P[3 * root[0]!]!) > Math.abs(P[3 * root[root.length - 1]!]!),
    });
  }
  return cards;
}

/**
 * A point `f` of the way along a polyline by its vertices: a card is a grid
 * whose root and tip edges hold one vertex per column, so equal fractions of
 * their vertices are the same column however unequal the edges' lengths.
 */
export const faceEyelashAlong = (
  line: readonly [number, number][],
  f: number,
): [number, number] => {
  const at = f * (line.length - 1);
  const k = Math.min(line.length - 2, Math.floor(at));
  const s = at - k;
  return [
    line[k]![0] + s * (line[k + 1]![0] - line[k]![0]),
    line[k]![1] + s * (line[k + 1]![1] - line[k]![1]),
  ];
};

/** The card's 3D point at a UV point, or null outside the card. */
export const faceEyelashLift = (
  card: IEyelashCard,
  point: readonly [number, number],
): [number, number, number] | null => {
  for (const triangle of card.triangles) {
    const [a, b, c] = triangle.uv;
    const den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (den === 0) continue;
    const u =
      ((b[1] - c[1]) * (point[0] - c[0]) + (c[0] - b[0]) * (point[1] - c[1])) /
      den;
    const v =
      ((c[1] - a[1]) * (point[0] - c[0]) + (a[0] - c[0]) * (point[1] - c[1])) /
      den;
    const eps = -1e-9;
    if (u < eps || v < eps || u + v > 1 - eps) continue;
    const [p, q, r] = triangle.xyz;
    return [0, 1, 2].map(
      (k) => u * p[k]! + v * q[k]! + (1 - u - v) * r[k]!,
    ) as [number, number, number];
  }
  return null;
};

/**
 * Draw one lid's lashes into an RGBA texture of `size` pixels: `count`
 * fibres rooted evenly (with a seeded jitter of a third of their spacing)
 * along each card's root edge, each running across the card toward the tip
 * edge at the same fraction along the lid for its length, read as arc length
 * on the card's own curved surface, so the card's curl is the lash's. The
 * full length follows the norm's medial, central and lateral values
 * piecewise linearly. Lash follicles cycle out of step with one another and
 * a lash grows at a steady rate through its growing phase (Thibaut et al.,
 * Br J Dermatol 2010;162:304-310), so a lid holds its resting lashes at full
 * length and its growing ones, `growing` of them, at a length uniform between
 * none and full; which ones grow, and how far, is seeded. A fibre is
 * drawn with its diameter in the card's own scale, tapering to a tenth at the
 * tip, and a pixel it covers partly takes that coverage as alpha, so fibres
 * finer than a pixel stay fine. Pure: returns new values.
 */
export function drawEyelashTexture(props: {
  cards: readonly IEyelashCard[];
  norm: IEyelashNorm;
  size: number;
  seed: number;
  rgba?: Uint8Array;
}): Uint8Array {
  const { size, norm } = props;
  const rgba = props.rgba ?? new Uint8Array(size * size * 4);
  const next = random(props.seed);
  const plot = (x: number, y: number, alpha: number) => {
    if (x < 0 || y < 0 || x >= size || y >= size || !(alpha > 0)) return;
    const k = 4 * (y * size + x);
    // Coverage composes as independent fibres: 1 - (1 - a)(1 - b).
    const before = rgba[k + 3]! / 255;
    rgba[k + 3] = Math.round(255 * (1 - (1 - before) * (1 - alpha)));
  };
  for (const card of props.cards) {
    for (let i = 0; i < norm.count; ++i) {
      const f = Math.min(
        1,
        Math.max(0, (i + 0.5 + (next() - 0.5) * 0.67) / norm.count),
      );
      // Position from the medial end, 0, to the lateral end, 1.
      const m = card.lateralFirst ? 1 - f : f;
      const longest =
        m < 0.5
          ? norm.length.medial +
            2 * m * (norm.length.central - norm.length.medial)
          : norm.length.central +
            2 * (m - 0.5) * (norm.length.lateral - norm.length.central);
      const grown = next() < norm.growing ? next() : 1;
      const length = longest * grown * 1e-3;
      const start = faceEyelashAlong(card.root, f);
      const end = faceEyelashAlong(card.tip, f);
      // March across the card until the lash's arc length is spent.
      const steps = 64;
      let spent = 0;
      let previous = faceEyelashLift(card, start);
      let reach = 0;
      for (let s = 1; s <= steps && previous !== null; ++s) {
        const point: [number, number] = [
          start[0] + ((end[0] - start[0]) * s) / steps,
          start[1] + ((end[1] - start[1]) * s) / steps,
        ];
        const here = faceEyelashLift(card, point);
        if (here === null) break;
        const piece = Math.hypot(
          here[0] - previous[0],
          here[1] - previous[1],
          here[2] - previous[2],
        );
        if (spent + piece >= length) {
          reach = (s - 1 + (length - spent) / piece) / steps;
          spent = length;
          break;
        }
        spent += piece;
        previous = here;
        reach = s / steps;
      }
      if (!(reach > 0) || !(spent > 0)) continue;
      // Pixels per metre on the card, from the drawn span and its arc length.
      const pixels =
        (Math.hypot(end[0] - start[0], end[1] - start[1]) * reach * size) /
        spent;
      const x0 = start[0] * size;
      const y0 = start[1] * size;
      const x1 = (start[0] + (end[0] - start[0]) * reach) * size;
      const y1 = (start[1] + (end[1] - start[1]) * reach) * size;
      const span = Math.hypot(x1 - x0, y1 - y0);
      const samples = Math.max(2, Math.ceil(span * 3));
      for (let s = 0; s <= samples; ++s) {
        const t = s / samples;
        const width = norm.diameter * 1e-3 * pixels * (1 - 0.9 * t);
        const cx = x0 + (x1 - x0) * t;
        const cy = y0 + (y1 - y0) * t;
        // A width below a pixel covers that fraction of the pixel it crosses;
        // a wider fibre covers the pixels within half its width.
        const half = Math.max(0.5, width / 2);
        const alpha = Math.min(1, width) / (samples / Math.max(1, span));
        for (let y = Math.floor(cy - half); y <= Math.ceil(cy + half); ++y)
          for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); ++x)
            if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= half)
              plot(x, y, Math.min(1, alpha));
      }
    }
  }
  return rgba;
}

/**
 * Redraw the source's lash cards from lash anatomy.
 *
 * The source's lash texture is a cosmetic one: clumped strands three to six
 * texture pixels wide, 0.2 to 0.4 mm on the card, where a lash fibre is 61 to
 * 72 um across (Na et al., Br J Dermatol 2006;155:1170-1176), and a lower lid
 * drawn nearly as full as the upper where its lashes are 40 to 48 percent as
 * dense and about 70 percent as long (Kikuchi et al., Glob Dermatol
 * 2015;2:74-77). Each lid's material gets a new texture drawn by
 * `drawEyelashTexture` on its own cards (`faceEyelashCards`), with its alpha
 * the fibres' coverage, and the material blends that coverage (glTF `BLEND`)
 * rather than cutting it at a threshold, since a mask would turn every
 * partly covered pixel into a whole fibre. The `blended` materials, other
 * fibre cards whose texture already holds coverage (the brows, whose mask at
 * 0.15 made a solid bar of their fading edges), blend it the same way.
 * Geometry, channels and every other material are untouched; documents are restamped and the controls
 * name the revision. Pure: returns new values.
 */
export function prepareEyelashBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  surface: string;
  skin: string;
  norms: readonly IEyelashNorm[];
  blended: readonly string[];
  size: number;
  seed: number;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    lids: { region: string; material: string; cards: number; drawn: number }[];
  };
} {
  const basis = structuredClone(input.basis);
  if (input.revision.trim() === "" || input.revision === basis.id)
    throw new Error("An eyelash revision needs a distinct revision.");
  const surface = basis.surfaces.find((one) => one.id === input.surface);
  const skin = basis.surfaces.find((one) => one.id === input.skin);
  if (surface === undefined || skin === undefined)
    throw new Error("An eyelash revision needs its lash and skin surfaces.");
  const lids = input.norms.map((norm, k) => {
    const region = surface.regions.find((one) => one.id === norm.region);
    const material = basis.materials.find((one) => one.id === norm.material);
    if (region === undefined || region.uvs === null)
      throw new Error(`No mapped lash region ${norm.region}.`);
    if (material === undefined)
      throw new Error(`No material ${norm.material}.`);
    const cards = faceEyelashCards({
      positions: surface.positions,
      indices: region.indices,
      uvs: region.uvs,
      skin: skin.positions,
    });
    const rgba = drawEyelashTexture({
      cards,
      norm,
      size: input.size,
      seed: input.seed + k,
    });
    let drawn = 0;
    for (let i = 3; i < rgba.length; i += 4) if (rgba[i]! > 0) ++drawn;
    material.baseColorTexture = encodePortraitPng({
      width: input.size,
      height: input.size,
      rgba,
    });
    material.alphaMode = "blend";
    delete material.alphaCutoff;
    return {
      region: norm.region,
      material: norm.material,
      cards: cards.length,
      drawn,
    };
  });
  for (const id of input.blended) {
    const material = basis.materials.find((one) => one.id === id);
    if (material === undefined) throw new Error(`No material ${id}.`);
    material.alphaMode = "blend";
    delete material.alphaCutoff;
  }
  basis.id = input.revision;
  return {
    basis,
    documents: input.documents.map((document) => ({
      ...document,
      basis: input.revision,
    })),
    controls: { ...input.controls, basis: input.revision },
    receipt: { source: input.basis.id, revision: input.revision, lids },
  };
}
