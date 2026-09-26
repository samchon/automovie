import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

/** One lip's control. */
export interface IFaceVermilionLip {
  channel: string;
  /** The lip above the mouth's slit or the one below it. */
  lip: "upper" | "lower";
  /**
   * Where the skin that follows the lip ends vertically: subnasale's height
   * for the upper lip, the labiomental fold's for the lower (metres).
   */
  reach: number;
  /** The channel's range, thinner (negative) to fuller (positive). */
  envelope: [number, number];
}

/**
 * The vermilion height revision of the connected face basis: a control per
 * lip for the height of its vermilion, the lip's red part.
 *
 * Read on the midline's colour, the photographs' upper vermilions are
 * thinner than the source's `upperLipHeight` reaches: at its valid end
 * (-1.5; past it the thinned lip's border crumples) seven documents still
 * read fuller. A lip's vermilion is thinner when its border with the skin
 * lies nearer the lips' meeting line, the skin of the cutaneous lip
 * following it. The `lips` region is both lips' surface, each vermilion
 * wrapping over its lip's free margin into the lining that faces the mouth;
 * the lips part at the mouth's slit and join at the commissures, so each lip
 * is the part of the region nearer its own meeting point
 * (`basis.contact.lips`) than the other's along the surface
 * (`faceLipOwners`), and its vermilion is its surface joined to its most
 * prominent point without the lining (the lining faces back and toward the
 * other lip). In each column (`column` across) a lip's free margin is its
 * vermilion's point nearest the other lip; where the slit parts the lips,
 * each vermilion vertex is moved vertically toward its column's margin by
 * `unit` of its distance from it per unit, and toward the commissures, where
 * the margin joins the other lip, the vermilion follows as the skin does.
 * The skin around follows as a membrane (each vertex's displacement the
 * mean of its neighbours', the least bending between the lip and the still
 * skin): the outer skin reached from the vermilion without crossing the
 * lips' surface, between the lip and `reach` (subnasale above the upper lip,
 * the labiomental fold below the lower) and within `margin` beyond the
 * vermilion's widest point on either side (the modiolus, where the lip's
 * muscles meet a centimetre lateral of the corner of the mouth); the
 * lining, the other lip and the skin outside stay. Negative is thinner,
 * positive fuller, and each channel spans its side's `envelope`. Pure.
 */
export function prepareVermilionHeightBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  skin: string;
  lips: string;
  sides: readonly IFaceVermilionLip[];
  /** Fraction of a vermilion vertex's distance from the meeting line per unit. */
  unit: number;
  column: number;
  margin: number;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    sides: {
      channel: string;
      vermilion: number;
      field: number;
      sweeps: number;
    }[];
  };
} {
  const basis = structuredClone(input.basis);
  if (input.revision.trim() === "" || input.revision === basis.id)
    throw new Error("A vermilion height revision needs a distinct revision.");
  if (!(input.unit > 0 && input.unit < 1))
    throw new Error("The unit lies between zero and one.");
  const skin = basis.surfaces.find((one) => one.id === input.skin);
  if (skin === undefined) throw new Error(`No surface ${input.skin}.`);
  const region = skin.regions.find((one) => one.id === input.lips);
  if (region === undefined) throw new Error(`No region ${input.lips}.`);
  const contact = basis.contact?.lips;
  if (contact === undefined) throw new Error("The basis has no lip contact.");
  const P = skin.positions;
  const lipVertices = new Set(region.indices);
  if (![contact.upper, contact.lower].every((v) => lipVertices.has(v)))
    throw new Error("The lips region must hold both lips' meeting points.");
  const neighbours = new Map<number, Set<number>>();
  // Each vertex's normal, its triangles' area-weighted sum.
  const normal = new Array<number>(P.length).fill(0);
  const I = skin.indices;
  for (let t = 0; t < I.length; t += 3) {
    const [a, b, c] = [I[t]!, I[t + 1]!, I[t + 2]!];
    const u = [0, 1, 2].map((k) => P[3 * b + k]! - P[3 * a + k]!);
    const w = [0, 1, 2].map((k) => P[3 * c + k]! - P[3 * a + k]!);
    const n = [
      u[1]! * w[2]! - u[2]! * w[1]!,
      u[2]! * w[0]! - u[0]! * w[2]!,
      u[0]! * w[1]! - u[1]! * w[0]!,
    ];
    for (const v of [a, b, c])
      for (let k = 0; k < 3; ++k) normal[3 * v + k]! += n[k]!;
    for (let e = 0; e < 3; ++e) {
      const from = I[t + e]!;
      const to = I[t + ((e + 1) % 3)]!;
      if (!neighbours.has(from)) neighbours.set(from, new Set());
      if (!neighbours.has(to)) neighbours.set(to, new Set());
      neighbours.get(from)!.add(to);
      neighbours.get(to)!.add(from);
    }
  }
  // Each lip is the part of the lips' surface nearer its own meeting point
  // than the other's along the surface: the lips part at the mouth's slit
  // and join only at the commissures.
  const owner = faceLipOwners(P, neighbours, lipVertices, contact);
  const sides = input.sides.map((side) => {
    if (basis.channels.some((one) => one.id === side.channel))
      throw new Error(`The basis already has a channel ${side.channel}.`);
    if (!(side.envelope[0] < 0 && side.envelope[1] > 0))
      throw new Error(`${side.channel}'s envelope must hold both directions.`);
    if (side.envelope[0] * input.unit <= -1)
      throw new Error(`${side.channel}'s envelope would close the vermilion.`);
    const upper = side.lip === "upper";
    const lip = new Set(
      [...lipVertices].filter((v) => owner.get(v) === side.lip),
    );
    // The vermilion: the lip's surface joined to its most prominent point
    // without the lining, which past the free margin faces the mouth (back
    // and toward the other lip).
    const front = [...lip].reduce((best, v) =>
      P[3 * v + 2]! > P[3 * best + 2]! ? v : best,
    );
    const vermilion = new Set<number>([front]);
    const stack = [front];
    while (stack.length !== 0)
      for (const n of neighbours.get(stack.pop()!)!)
        if (
          lip.has(n) &&
          !vermilion.has(n) &&
          (normal[3 * n + 2]! > 0 ||
            (upper ? normal[3 * n + 1]! > 0 : normal[3 * n + 1]! < 0))
        ) {
          vermilion.add(n);
          stack.push(n);
        }
    // The free margin in a vertex's column: the vermilion's point nearest
    // the other lip within `column` across.
    const margin = (x: number): number => {
      let best = -1;
      for (const v of vermilion)
        if (Math.abs(P[3 * v]! - x) <= input.column)
          if (
            best === -1 ||
            (upper
              ? P[3 * v + 1]! < P[3 * best + 1]!
              : P[3 * v + 1]! > P[3 * best + 1]!)
          )
            best = v;
      return best;
    };
    // Where the mouth's slit parts the lips, each column's vermilion scales
    // about its free margin; toward the commissures, where the margin joins
    // the other lip, the vermilion follows as the skin does.
    const joined = (v: number) =>
      [...neighbours.get(v)!].some(
        (n) => lipVertices.has(n) && owner.get(n) !== side.lip,
      );
    const field = new Map<number, number>();
    const held = new Set<number>();
    for (const v of vermilion) {
      const edge = margin(P[3 * v]!);
      if (joined(edge)) field.set(v, 0);
      else {
        field.set(v, P[3 * edge + 1]! - P[3 * v + 1]!);
        held.add(v);
      }
    }
    if (held.size === 0)
      throw new Error(`The ${side.lip} lip has no free margin.`);
    const half =
      Math.max(...[...vermilion].map((v) => Math.abs(P[3 * v]!))) +
      input.margin;
    const ys = [...vermilion].map((v) => P[3 * v + 1]!);
    const [low, high] = upper
      ? [Math.min(...ys), side.reach]
      : [side.reach, Math.max(...ys)];
    if (!(low < high)) throw new Error(`${side.channel} reaches nowhere.`);
    // The skin that follows: the outer skin reached from the vermilion
    // without crossing the lips' surface, within the reach and the margin.
    stack.push(...vermilion);
    while (stack.length !== 0) {
      const v = stack.pop()!;
      for (const n of neighbours.get(v)!) {
        if (field.has(n) || lipVertices.has(n)) continue;
        const y = P[3 * n + 1]!;
        if (Math.abs(P[3 * n]!) < half && y > low && y < high) {
          field.set(n, 0);
          stack.push(n);
        }
      }
    }
    const free = [...field.keys()].filter((v) => !held.has(v));
    let sweeps = 0;
    for (; sweeps < 20000; ++sweeps) {
      let change = 0;
      for (const v of free) {
        const around = [...neighbours.get(v)!];
        const mean =
          around.reduce((sum, n) => sum + (field.get(n) ?? 0), 0) /
          around.length;
        change = Math.max(change, Math.abs(mean - field.get(v)!));
        field.set(v, mean);
      }
      if (change < 1e-10) break;
    }
    const rows = [...field]
      .filter(([, d]) => Math.abs(d) > 1e-9)
      .sort(([a], [b]) => a - b);
    const names = {
      thinner: `${side.channel}.thinner`,
      fuller: `${side.channel}.fuller`,
    };
    skin.targets[names.thinner] = rows.flatMap(([v, d]) => [
      v,
      0,
      input.unit * d,
      0,
    ]);
    skin.targets[names.fuller] = rows.flatMap(([v, d]) => [
      v,
      0,
      -input.unit * d,
      0,
    ]);
    basis.channels.push({
      id: side.channel,
      description: `The ${side.lip} vermilion's height, thinner to fuller, ${Number((input.unit * 100).toFixed(3))} percent of its height per unit toward or away from the lips' meeting line; the lip's skin follows.`,
      kind: "shape",
      minimum: side.envelope[0],
      maximum: side.envelope[1],
      positive: names.fuller,
      negative: names.thinner,
    });
    return {
      channel: side.channel,
      vermilion: held.size,
      field: free.length,
      sweeps,
    };
  });
  const source = basis.id;
  basis.id = input.revision;
  return {
    basis,
    documents: input.documents.map((one) => ({
      ...one,
      basis: input.revision,
    })),
    controls: { ...input.controls, basis: input.revision },
    receipt: { source, revision: input.revision, sides },
  };
}

/**
 * Which lip each vertex of the lips' surface belongs to: the one whose
 * meeting point is nearer along the surface (Dijkstra over the region's
 * edges, their lengths the metric).
 */
export function faceLipOwners(
  positions: readonly number[],
  neighbours: ReadonlyMap<number, ReadonlySet<number>>,
  region: ReadonlySet<number>,
  contact: { upper: number; lower: number },
): Map<number, "upper" | "lower"> {
  const distance = new Map<number, number>([
    [contact.upper, 0],
    [contact.lower, 0],
  ]);
  const owner = new Map<number, "upper" | "lower">([
    [contact.upper, "upper"],
    [contact.lower, "lower"],
  ]);
  const done = new Set<number>();
  const length = (a: number, b: number) =>
    Math.hypot(
      positions[3 * a]! - positions[3 * b]!,
      positions[3 * a + 1]! - positions[3 * b + 1]!,
      positions[3 * a + 2]! - positions[3 * b + 2]!,
    );
  for (;;) {
    let next = -1;
    for (const [v, d] of distance)
      if (!done.has(v) && (next === -1 || d < distance.get(next)!)) next = v;
    if (next === -1) break;
    done.add(next);
    for (const n of neighbours.get(next)!) {
      if (!region.has(n) || done.has(n)) continue;
      const d = distance.get(next)! + length(next, n);
      const known = distance.get(n);
      if (known === undefined || d < known) {
        distance.set(n, d);
        owner.set(n, owner.get(next)!);
      }
    }
  }
  return owner;
}
