import { measureAutoMovieMeshCrossings } from "@automovie/engine";
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
  const mesh = {
    positions: P.slice(),
    indices: I.slice(),
    normals: null,
    uvs: null,
    skin: null,
  };
  const seen = new Set<string>();
  const pairs: [number, number][] = [];
  for (const crossing of measureAutoMovieMeshCrossings(mesh, mesh, {
    allPairs: true,
    interiorTolerance: 1e-9,
  })) {
    if (crossing.coplanar) continue;
    const [a, b] = [crossing.triangle * 3, crossing.other * 3].sort(
      (one, other) => one - other,
    );
    if (!support.has(a) && !support.has(b)) continue;
    if (contact.has(a) && contact.has(b)) continue;
    if ([0, 1, 2].some((e) => I.slice(a, a + 3).includes(I[b + e]!))) continue;
    const key = `${a}/${b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push([a, b]);
  }
  return pairs;
}
