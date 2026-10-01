import { faceEyelashCards } from "./prepareEyelashBasis";

/**
 * The angle of a lash direction from the upward vertical, degrees, in the
 * sagittal (y, z) plane of a head whose +y is up and +z is forward: 0 is
 * straight up, 90 horizontally forward, above 90 pointing forward and down.
 * It is the lateral-photograph quantity Kikuchi et al. report, evaluated on
 * the card's root-to-tip chord. A direction without a sagittal part has no
 * angle and gives 0 by `atan2`.
 */
export function eyelashSagittalAngle(direction: readonly number[]): number {
  return (Math.atan2(direction[2]!, direction[1]!) * 180) / Math.PI;
}

/** One hinged card: its central angle before and after, and the turn applied. */
export interface IHingedEyelashCard {
  columns: number;
  before: number;
  after: number;
  delta: number;
  /** Columns whose own turn stopped at the floor instead of taking the full delta. */
  limited: number;
}

type Vec = [number, number, number];

const sub = (a: readonly number[], b: readonly number[]): Vec => [
  a[0]! - b[0]!,
  a[1]! - b[1]!,
  a[2]! - b[2]!,
];
const dot = (a: readonly number[], b: readonly number[]): number =>
  a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
const cross = (a: readonly number[], b: readonly number[]): Vec => [
  a[1]! * b[2]! - a[2]! * b[1]!,
  a[2]! * b[0]! - a[0]! * b[2]!,
  a[0]! * b[1]! - a[1]! * b[0]!,
];

/** Rodrigues rotation of `v` about the unit `axis` by `degrees`. */
const rotate = (v: Vec, axis: Vec, degrees: number): Vec => {
  const angle = (degrees * Math.PI) / 180;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const k = cross(axis, v);
  const d = dot(axis, v) * (1 - c);
  return [
    v[0] * c + k[0] * s + axis[0] * d,
    v[1] * c + k[1] * s + axis[1] * d,
    v[2] * c + k[2] * s + axis[2] * d,
  ];
};

/**
 * Turn each lash card of one region about its own root line until the
 * central root-to-tip direction has a stated sagittal angle.
 *
 * A card is a grid whose root edge lies on the lid margin and whose tip edge
 * is the lash tips; every vertex belongs to the column whose root-to-tip
 * segment (in UV) it lies on. Each card is a connected piece of the region,
 * so the two eyes' mirrored cards are measured and turned on their own. The
 * turn `target - before` is one angle per card, from its two middle
 * columns, applied as a rigid hinge: every vertex of column `c` rotates about
 * the line through that column's root vertex along the lid-margin tangent
 * (the root neighbours' difference, oriented toward +x so the sense is the
 * same on both eyes). Roots stay where they are, so the lashes stay rooted in
 * the lid; chord lengths and the card's fan and curl are preserved; only the
 * elevation changes. Tangents tilt away from x along the lid, so a column
 * off-centre turns about a slightly tilted axis and its own angle changes by
 * about, not exactly, the card's turn. With a `floor`, a column whose turn
 * would take its chord below that sagittal angle turns only as far as the
 * floor (a column already below it does not turn), so no lash is carried
 * upward past the lid-margin side of horizontal. Pure: returns the moved vertices.
 */
export function hingeEyelashRegion(props: {
  positions: readonly number[];
  indices: readonly number[];
  uvs: readonly number[];
  skin: readonly number[];
  target: number;
  /**
   * The least sagittal angle any column may take after the turn, degrees from
   * the upward vertical; omit for none. A column already below it is left as it is.
   */
  floor?: number;
}): { moved: Map<number, Vec>; cards: IHingedEyelashCard[] } {
  const { positions: P, indices: I, uvs } = props;
  const parent = new Map<number, number>();
  const find = (v: number): number => {
    while (parent.get(v) !== v) v = parent.get(v)!;
    return v;
  };
  for (const v of I) if (!parent.has(v)) parent.set(v, v);
  for (let t = 0; t < I.length; t += 3)
    for (const v of [I[t + 1]!, I[t + 2]!]) parent.set(find(v), find(I[t]!));
  const pieces = new Map<number, number[]>();
  for (let t = 0; t < I.length; t += 3) {
    const k = find(I[t]!);
    pieces.set(k, [...(pieces.get(k) ?? []), t]);
  }
  const moved = new Map<number, Vec>();
  const cards: IHingedEyelashCard[] = [];
  for (const starts of pieces.values()) {
    const indices = starts.flatMap((t) => [I[t]!, I[t + 1]!, I[t + 2]!]);
    const pieceUvs = starts.flatMap((t) => [
      uvs[2 * t]!, uvs[2 * t + 1]!, uvs[2 * t + 2]!, uvs[2 * t + 3]!, uvs[2 * t + 4]!, uvs[2 * t + 5]!,
    ]);
    const [card] = faceEyelashCards({ positions: P, indices, uvs: pieceUvs, skin: props.skin });
    const at = new Map<string, Vec>();
    for (const triangle of card!.triangles)
      triangle.uv.forEach((uv, k) => at.set(uv.join(","), triangle.xyz[k]!));
    const columns = Math.min(card!.root.length, card!.tip.length);
    const root = card!.root.slice(0, columns).map((uv) => at.get(uv.join(","))!);
    const tip = card!.tip.slice(0, columns).map((uv) => at.get(uv.join(","))!);
    const chord = (c: number): number => eyelashSagittalAngle(sub(tip[c]!, root[c]!));
    const before = (chord(Math.floor((columns - 1) / 2)) + chord(Math.ceil((columns - 1) / 2))) / 2;
    const delta = props.target - before;
    const axis = (c: number): Vec => {
      const t = sub(root[Math.min(columns - 1, c + 1)]!, root[Math.max(0, c - 1)]!);
      const length = Math.hypot(...t);
      const unit = t.map((v) => v / length) as Vec;
      return unit[0] < 0 ? (unit.map((v) => -v) as Vec) : unit;
    };
    const turnedChord = (c: number, degrees: number): number =>
      eyelashSagittalAngle(rotate(sub(tip[c]!, root[c]!), axis(c), degrees));
    // One turn per column: the card's delta, unless it would carry the column
    // below the floor, then the largest turn (toward zero) that stops at it.
    const turns = root.map((_, c) => {
      const floor = props.floor;
      if (floor === undefined || turnedChord(c, delta) >= floor) return delta;
      if (turnedChord(c, 0) < floor) return 0;
      let [low, high] = delta < 0 ? [delta, 0] : [0, delta];
      for (let i = 0; i < 60; ++i) {
        const middle = (low + high) / 2;
        const holds = turnedChord(c, middle) >= floor;
        if (holds === delta < 0) high = middle;
        else low = middle;
      }
      return delta < 0 ? high : low;
    });
    const column = (uv: readonly number[]): number => {
      let best = 0;
      let nearest = Infinity;
      for (let c = 0; c < columns; ++c) {
        const a = card!.root[c]!;
        const d = [card!.tip[c]![0] - a[0], card!.tip[c]![1] - a[1]];
        const along = Math.min(1, Math.max(0, ((uv[0]! - a[0]) * d[0]! + (uv[1]! - a[1]) * d[1]!) / (d[0]! ** 2 + d[1]! ** 2)));
        const distance = Math.hypot(uv[0]! - a[0] - along * d[0]!, uv[1]! - a[1] - along * d[1]!);
        if (distance < nearest) {
          nearest = distance;
          best = c;
        }
      }
      return best;
    };
    indices.forEach((vertex, i) => {
      if (moved.has(vertex)) return;
      const c = column([pieceUvs[2 * i]!, pieceUvs[2 * i + 1]!]);
      const hinge = root[c]!;
      const turned = rotate(sub([P[3 * vertex]!, P[3 * vertex + 1]!, P[3 * vertex + 2]!], hinge), axis(c), turns[c]!);
      moved.set(vertex, [hinge[0] + turned[0], hinge[1] + turned[1], hinge[2] + turned[2]]);
    });
    const middle = [Math.floor((columns - 1) / 2), Math.ceil((columns - 1) / 2)];
    const after = (turnedChord(middle[0]!, turns[middle[0]!]!) + turnedChord(middle[1]!, turns[middle[1]!]!)) / 2;
    const limited = turns.filter((turn) => turn !== delta).length;
    cards.push({ columns, before, after, delta, limited });
  }
  return { moved, cards };
}
