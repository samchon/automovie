import type { IAutoMovieHumanFaceBasis } from "@automovie/human";

/**
 * Extend one two-sided shape channel's envelope (changing `basis` in place)
 * over the reference `interval` of the measure it means, as
 * `prepareLipEnvelopeBasis` describes: each side followed outward from its
 * authored end in steps of `step` until the measure, moving the way that
 * side moves it, passes the interval's edge in that direction; no further
 * than a step at half the authored rate, a step where the measure cannot
 * be read (not a number), or `reach`; kept only where the support has no
 * faults (`faceSupportFaults`) and `guard` counts none.
 */
export function extendFaceEnvelope(props: {
  basis: IAutoMovieHumanFaceBasis;
  surface: IAutoMovieHumanFaceBasis["surfaces"][number];
  channel: string;
  measure: (positions: readonly number[]) => number;
  interval: [number, number];
  guard: (positions: readonly number[]) => number;
  step: number;
  reach: number;
}): {
  from: [number, number];
  to: [number, number];
  reached: [number, number];
  faults: [number, number];
} {
  const { surface } = props;
  const channel = props.basis.channels.find((one) => one.id === props.channel);
  if (
    channel === undefined ||
    channel.kind !== "shape" ||
    channel.positive === null ||
    channel.negative === null
  )
    throw new Error(`No two-sided shape channel ${props.channel}.`);
  const rows = (sign: number) =>
    surface.targets[sign < 0 ? channel.negative! : channel.positive!] ?? [];
  const at = (w: number): number[] => {
    const flat = rows(w);
    const positions = [...surface.positions];
    for (let i = 0; i < flat.length; i += 4)
      for (let k = 0; k < 3; ++k)
        positions[3 * flat[i]! + k]! += Math.abs(w) * flat[i + 1 + k]!;
    return positions;
  };
  const support = new Set<number>();
  for (const sign of [-1, 1]) {
    const flat = rows(sign);
    for (let i = 0; i < flat.length; i += 4) support.add(flat[i]!);
  }
  const triangles: number[] = [];
  for (let t = 0; t < surface.indices.length; t += 3)
    if ([0, 1, 2].some((e) => support.has(surface.indices[t + e]!)))
      triangles.push(t);
  const faults = (positions: readonly number[]) =>
    faceSupportFaults({
      source: surface.positions,
      positions,
      indices: surface.indices,
      triangles,
    }) + props.guard(positions);
  const neutral = props.measure(surface.positions);
  const from: [number, number] = [channel.minimum, channel.maximum];
  // The last valid step below an invalid reach.
  const backOff = (
    sign: -1 | 1,
    reach: number,
    fault: number,
  ): [number, number, number] => {
    let k = 1;
    while (
      reach - k * props.step > 1 &&
      faults(at(sign * (reach - k * props.step))) > 0
    )
      ++k;
    const w = Math.max(1, reach - k * props.step);
    return [w, props.measure(at(sign * w)), fault];
  };
  // Each side: out from the authored end until the measure passes the
  // interval's edge in the direction that side moves it.
  const side = (sign: -1 | 1): [number, number, number] => {
    let previous = 1;
    let read = props.measure(at(sign));
    // The authored rate of the measure per unit of control; a control
    // that does not move its measure, or loses it, means nothing to extend.
    const rate = Math.abs(read - neutral);
    if (!(rate > 0)) return [1, read, 0];
    const rising = read > neutral;
    const edge = rising ? props.interval[1] : props.interval[0];
    const past = (value: number) => (rising ? value >= edge : value <= edge);
    if (past(read)) return [1, read, 0];
    const steps = Math.round((props.reach - 1) / props.step);
    for (let k = 1; k <= steps; ++k) {
      const w = 1 + k * props.step;
      const next = props.measure(at(sign * w));
      // A measure lost (not a number) or slowed to under half its authored
      // rate ends the side.
      if (!(Math.abs(next - read) >= (rate * props.step) / 2)) break;
      if (past(next)) {
        const reach =
          previous + ((edge - read) / (next - read)) * (w - previous);
        const fault = faults(at(sign * reach));
        if (fault === 0) return [reach, edge, 0];
        return backOff(sign, reach, fault);
      }
      [previous, read] = [w, next];
    }
    const fault = faults(at(sign * previous));
    return fault === 0 ? [previous, read, 0] : backOff(sign, previous, fault);
  };
  const [low, lowRead, lowFault] = side(-1);
  const [high, highRead, highFault] = side(1);
  // Hundredths, rounded toward the authored end.
  const to: [number, number] = [
    Math.min(from[0], -Math.floor(low * 100 + 1e-9) / 100),
    Math.max(from[1], Math.floor(high * 100 + 1e-9) / 100),
  ];
  channel.minimum = to[0];
  channel.maximum = to[1];
  return {
    from,
    to,
    reached: [lowRead, highRead],
    faults: [lowFault, highFault],
  };
}

/**
 * Faults of a changed surface within a support: its triangles turned over
 * against the source, plus the pairs of the surface's triangles, one of them
 * in the support, that cross each other less those that crossed in the
 * source. A moving part that passes through skin it does not move (a nasal
 * tip lowered through the upper lip) is a fault as much as one that folds
 * through itself. Triangles sharing a vertex are not a pair, nor are two of
 * `contact`: the triangles of bodies that meet (the two lips), whose
 * overlap is their contact, which the lips' own contact governs, not a
 * fold.
 */
export function faceSupportFaults(props: {
  source: readonly number[];
  positions: readonly number[];
  indices: readonly number[];
  triangles: readonly number[];
  contact?: ReadonlySet<number>;
}): number {
  const { indices: I, triangles } = props;
  const normal = (P: readonly number[], t: number) => {
    const [a, b, c] = [I[t]!, I[t + 1]!, I[t + 2]!];
    const u = [0, 1, 2].map((k) => P[3 * b + k]! - P[3 * a + k]!);
    const w = [0, 1, 2].map((k) => P[3 * c + k]! - P[3 * a + k]!);
    return [
      u[1]! * w[2]! - u[2]! * w[1]!,
      u[2]! * w[0]! - u[0]! * w[2]!,
      u[0]! * w[1]! - u[1]! * w[0]!,
    ];
  };
  const turned = triangles.filter((t) => {
    const [a, b] = [normal(props.source, t), normal(props.positions, t)];
    return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]! < 0;
  }).length;
  const support = new Set(triangles);
  const contact = props.contact ?? new Set<number>();
  return (
    turned +
    Math.max(
      0,
      crossings(props.positions, I, support, contact) -
        crossings(props.source, I, support, contact),
    )
  );
}

/**
 * The triangles of a changed surface's faults within a support (those
 * `faceSupportFaults` counts): each turned over against the source, and both
 * of each crossing pair the source did not have.
 */
export function faceSupportFaultTriangles(props: {
  source: readonly number[];
  positions: readonly number[];
  indices: readonly number[];
  triangles: readonly number[];
  contact?: ReadonlySet<number>;
}): Set<number> {
  const { indices: I, triangles } = props;
  const normal = (P: readonly number[], t: number) => {
    const [a, b, c] = [I[t]!, I[t + 1]!, I[t + 2]!];
    const u = [0, 1, 2].map((k) => P[3 * b + k]! - P[3 * a + k]!);
    const w = [0, 1, 2].map((k) => P[3 * c + k]! - P[3 * a + k]!);
    return [
      u[1]! * w[2]! - u[2]! * w[1]!,
      u[2]! * w[0]! - u[0]! * w[2]!,
      u[0]! * w[1]! - u[1]! * w[0]!,
    ];
  };
  const out = new Set(
    triangles.filter((t) => {
      const [a, b] = [normal(props.source, t), normal(props.positions, t)];
      return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]! < 0;
    }),
  );
  const support = new Set(triangles);
  const contact = props.contact ?? new Set<number>();
  const before = new Set(
    crossingPairs(props.source, I, support, contact).map((pair) => pair.join()),
  );
  for (const pair of crossingPairs(props.positions, I, support, contact))
    if (!before.has(pair.join())) for (const t of pair) out.add(t);
  return out;
}

/**
 * Pairs of the surface's triangles, one of them in the support, that cross,
 * found through a 4 mm grid over the support's cells.
 */
function crossings(
  P: readonly number[],
  I: readonly number[],
  support: ReadonlySet<number>,
  contact: ReadonlySet<number>,
): number {
  return crossingPairs(P, I, support, contact).length;
}

/** The crossing pairs themselves, each ordered, lower triangle first. */
function crossingPairs(
  P: readonly number[],
  I: readonly number[],
  support: ReadonlySet<number>,
  contact: ReadonlySet<number>,
): [number, number][] {
  const corner = (t: number, e: number) =>
    [0, 1, 2].map((k) => P[3 * I[t + e]! + k]!);
  const cell = 0.004;
  const cells = (t: number) => {
    const points = [0, 1, 2].map((e) => corner(t, e));
    const lo = [0, 1, 2].map((k) =>
      Math.floor(Math.min(...points.map((p) => p[k]!)) / cell),
    );
    const hi = [0, 1, 2].map((k) =>
      Math.floor(Math.max(...points.map((p) => p[k]!)) / cell),
    );
    const keys: string[] = [];
    for (let x = lo[0]!; x <= hi[0]!; ++x)
      for (let y = lo[1]!; y <= hi[1]!; ++y)
        for (let z = lo[2]!; z <= hi[2]!; ++z) keys.push(`${x},${y},${z}`);
    return keys;
  };
  const grid = new Map<string, number[]>();
  for (const t of support)
    for (const key of cells(t)) {
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push(t);
    }
  for (let t = 0; t < I.length; t += 3)
    if (!support.has(t)) for (const key of cells(t)) grid.get(key)?.push(t);
  const seen = new Set<string>();
  const pairs: [number, number][] = [];
  for (const members of grid.values())
    for (let a = 0; a < members.length; ++a)
      for (let b = a + 1; b < members.length; ++b) {
        const [s, t] = [members[a]!, members[b]!];
        if (!support.has(s) && !support.has(t)) continue;
        if (contact.has(s) && contact.has(t)) continue;
        const key = s < t ? `${s},${t}` : `${t},${s}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const own = [0, 1, 2].map((e) => I[s + e]!);
        if ([0, 1, 2].some((e) => own.includes(I[t + e]!))) continue;
        const A = [0, 1, 2].map((e) => corner(s, e));
        const B = [0, 1, 2].map((e) => corner(t, e));
        if (
          [0, 1, 2].some((e) => pierces(A[e]!, A[(e + 1) % 3]!, B)) ||
          [0, 1, 2].some((e) => pierces(B[e]!, B[(e + 1) % 3]!, A))
        )
          pairs.push(s < t ? [s, t] : [t, s]);
      }
  return pairs;
}

/** Whether the open segment p0-p1 passes through triangle t. */
function pierces(p0: number[], p1: number[], t: number[][]): boolean {
  const sub = (a: number[], b: number[]) => [0, 1, 2].map((k) => a[k]! - b[k]!);
  const cross = (a: number[], b: number[]) => [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
  const dot = (a: number[], b: number[]) =>
    a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  const d = sub(p1, p0);
  const e1 = sub(t[1]!, t[0]!);
  const e2 = sub(t[2]!, t[0]!);
  const p = cross(d, e2);
  const det = dot(e1, p);
  if (Math.abs(det) < 1e-18) return false;
  const s = sub(p0, t[0]!);
  const u = dot(s, p) / det;
  if (u < 0 || u > 1) return false;
  const q = cross(s, e1);
  const v = dot(d, q) / det;
  if (v < 0 || u + v > 1) return false;
  const along = dot(e2, q) / det;
  return along > 1e-9 && along < 1 - 1e-9;
}
