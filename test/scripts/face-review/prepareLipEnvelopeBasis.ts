import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

/**
 * The lip envelope revision of the connected face basis: each vermilion
 * height control spans the heights adults show.
 *
 * A control that means one anatomical measure reaches every value the
 * sampled populations' adults show: its envelope spans the measure's
 * reference interval, the union over the populations of their mean plus and
 * minus two standard deviations, as far as the control's geometry stays
 * valid. The source's lip height controls end at plus and minus one, where
 * its upper vermilion is 0.160 of the mouth's width and its lower 0.182,
 * the means of European men: half of them lay beyond the envelope, and the
 * photographs of thin lips held the controls at their bounds.
 *
 * The measure is the vermilion's height on the midline over the mouth's
 * width (`faceVermilionRatios`), labrale superius and inferius read where
 * the lip region's outer surface crosses the midsagittal plane, as the
 * vermilion revision reads the first (`faceUpperVermilionHeight`). The
 * earlier revision brought the population corners of the source to their
 * norms and left the neutral, so a document of fine controls alone, which
 * starts from the neutral, needs this envelope.
 *
 * Each side of each control is followed outward from its authored end in
 * steps of `step` (the endpoint rows scaled past one, which keeps the
 * source's deformation) until the measure crosses the interval's edge,
 * interpolated between the last two steps; an edge inside the authored
 * range leaves that side at one. The extension goes no further than the
 * control still means its measure: a step that changes the measure at less
 * than half the rate the authored range does ends it (the source's upper
 * lip height thins the vermilion by 0.050 of the mouth's width per unit to
 * -2 and by 0.012 beyond, where the lip's lower edge starts to wave), as
 * does `reach`. The extension is kept only where the surface stays valid:
 * no triangle of the control's support turned over against the source, no
 * pair of its triangles crossing that did not cross before
 * (`faceSupportFaults`), and the lips' contact pair not closed past each
 * other; otherwise the side stops at the last valid step. The revision
 * rewrites only the envelopes, a new `revision`
 * id, and the documents' and simple controls' basis stamps. Pure.
 */
export function prepareLipEnvelopeBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  surface: string;
  lips: string;
  skin: string;
  channels: { upper: string; lower: string };
  intervals: { upper: [number, number]; lower: [number, number] };
  depth: number;
  step: number;
  reach: number;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    neutral: { upper: number; lower: number };
    envelopes: {
      channel: string;
      measure: "upper" | "lower";
      interval: [number, number];
      from: [number, number];
      to: [number, number];
      reached: [number, number];
      faults: [number, number];
    }[];
  };
} {
  const basis = structuredClone(input.basis);
  if (input.revision.trim() === "" || input.revision === basis.id)
    throw new Error("A lip envelope revision needs a distinct revision.");
  const surface = basis.surfaces.find((one) => one.id === input.surface);
  if (surface === undefined) throw new Error(`No surface ${input.surface}.`);
  const region = (id: string) => {
    const found = surface.regions.find((one) => one.id === id);
    if (found === undefined) throw new Error(`No region ${id}.`);
    return found.indices;
  };
  const lips = region(input.lips);
  const skin = new Set(region(input.skin));
  const contact = basis.contact?.lips;
  if (contact === undefined || contact.surface !== input.surface)
    throw new Error("The basis names no lip contact on the surface.");
  const ratios = (positions: readonly number[]) =>
    faceVermilionRatios({
      positions,
      lips,
      skin,
      contact,
      depth: input.depth,
    });
  const neutral = ratios(surface.positions);
  const envelopes = (["upper", "lower"] as const).map((measure) => {
    const id = input.channels[measure];
    const channel = basis.channels.find((one) => one.id === id);
    if (
      channel === undefined ||
      channel.kind !== "shape" ||
      channel.positive === null ||
      channel.negative === null
    )
      throw new Error(`No two-sided shape channel ${id}.`);
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
      }) +
      (positions[3 * contact.upper + 1]! > positions[3 * contact.lower + 1]!
        ? 0
        : 1);
    const interval = input.intervals[measure];
    const from: [number, number] = [channel.minimum, channel.maximum];
    // Each side: out from the authored end until the measure passes the
    // interval's edge on that side.
    const side = (sign: -1 | 1): [number, number, number] => {
      const edge = sign < 0 ? interval[0] : interval[1];
      const past = (value: number) =>
        sign < 0 ? value <= edge : value >= edge;
      let previous = 1;
      let read = ratios(at(sign))[measure];
      if (past(read)) return [1, read, 0];
      // The authored rate of the measure per unit of control; a control
      // that does not move its measure means nothing to extend.
      const rate = Math.abs(read - neutral[measure]);
      if (rate === 0) return [1, read, 0];
      const steps = Math.round((input.reach - 1) / input.step);
      for (let k = 1; k <= steps; ++k) {
        const w = 1 + k * input.step;
        const next = ratios(at(sign * w))[measure];
        if (Math.abs(next - read) < (rate * input.step) / 2) break;
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
    // The last valid step below an invalid reach.
    const backOff = (
      sign: -1 | 1,
      reach: number,
      fault: number,
    ): [number, number, number] => {
      let w = reach - input.step;
      while (w > 1 && faults(at(sign * w)) > 0) w -= input.step;
      w = Math.max(1, w);
      return [w, ratios(at(sign * w))[measure], fault];
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
      channel: id,
      measure,
      interval,
      from,
      to,
      reached: [lowRead, highRead] as [number, number],
      faults: [lowFault, highFault] as [number, number],
    };
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
      neutral,
      envelopes,
    },
  };
}

/**
 * The upper and lower vermilion heights on the midline over the mouth's
 * width. The heights are read as `faceUpperVermilionHeight` reads the
 * upper: where the lip region's triangles cross the midsagittal plane in
 * front of stomion's depth less `depth` (the lining behind does not count),
 * the highest crossing above stomion (labrale superius) and the lowest below
 * (labrale inferius), stomion midway between the lips' contact pair; the
 * width lies between the lip region's extreme border vertices, those it
 * shares with the skin (the cheilia).
 */
export function faceVermilionRatios(props: {
  positions: readonly number[];
  lips: readonly number[];
  skin: ReadonlySet<number>;
  contact: { upper: number; lower: number };
  depth: number;
}): { upper: number; lower: number } {
  const P = props.positions;
  const stomion =
    (P[3 * props.contact.upper + 1]! + P[3 * props.contact.lower + 1]!) / 2;
  const front = P[3 * props.contact.upper + 2]! - props.depth;
  let [top, bottom] = [-Infinity, Infinity];
  for (let t = 0; t + 2 < props.lips.length; t += 3)
    for (let e = 0; e < 3; ++e) {
      const i = props.lips[t + e]!;
      const j = props.lips[t + ((e + 1) % 3)]!;
      const [xi, xj] = [P[3 * i]!, P[3 * j]!];
      if (xi > 0 === xj > 0) continue;
      const f = xi / (xi - xj);
      const y = P[3 * i + 1]! + f * (P[3 * j + 1]! - P[3 * i + 1]!);
      const z = P[3 * i + 2]! + f * (P[3 * j + 2]! - P[3 * i + 2]!);
      if (z <= front) continue;
      top = Math.max(top, y);
      bottom = Math.min(bottom, y);
    }
  const xs = [...new Set(props.lips)]
    .filter((v) => props.skin.has(v))
    .map((v) => P[3 * v]!);
  if (top <= stomion || bottom >= stomion || xs.length === 0)
    throw new Error("The lip region crosses no outer midline about stomion.");
  const width = Math.max(...xs) - Math.min(...xs);
  return { upper: (top - stomion) / width, lower: (stomion - bottom) / width };
}

/**
 * Faults of a changed surface within a support: its triangles turned over
 * against the source, plus the pairs of its triangles that cross each other
 * less those that crossed in the source. Triangles sharing a vertex are not
 * a pair.
 */
export function faceSupportFaults(props: {
  source: readonly number[];
  positions: readonly number[];
  indices: readonly number[];
  triangles: readonly number[];
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
  return (
    turned +
    Math.max(
      0,
      crossings(props.positions, I, triangles) -
        crossings(props.source, I, triangles),
    )
  );
}

/** Pairs of the triangles that cross, found through a 4 mm grid. */
function crossings(
  P: readonly number[],
  I: readonly number[],
  triangles: readonly number[],
): number {
  const corner = (t: number, e: number) =>
    [0, 1, 2].map((k) => P[3 * I[t + e]! + k]!);
  const cell = 0.004;
  const grid = new Map<string, number[]>();
  triangles.forEach((t, i) => {
    const points = [0, 1, 2].map((e) => corner(t, e));
    const lo = [0, 1, 2].map((k) =>
      Math.floor(Math.min(...points.map((p) => p[k]!)) / cell),
    );
    const hi = [0, 1, 2].map((k) =>
      Math.floor(Math.max(...points.map((p) => p[k]!)) / cell),
    );
    for (let x = lo[0]!; x <= hi[0]!; ++x)
      for (let y = lo[1]!; y <= hi[1]!; ++y)
        for (let z = lo[2]!; z <= hi[2]!; ++z) {
          const key = `${x},${y},${z}`;
          if (!grid.has(key)) grid.set(key, []);
          grid.get(key)!.push(i);
        }
  });
  const seen = new Set<string>();
  let count = 0;
  for (const members of grid.values())
    for (let a = 0; a < members.length; ++a)
      for (let b = a + 1; b < members.length; ++b) {
        const [i, j] = [members[a]!, members[b]!];
        const key = i < j ? `${i},${j}` : `${j},${i}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const [s, t] = [triangles[i]!, triangles[j]!];
        const own = [0, 1, 2].map((e) => I[s + e]!);
        if ([0, 1, 2].some((e) => own.includes(I[t + e]!))) continue;
        const A = [0, 1, 2].map((e) => corner(s, e));
        const B = [0, 1, 2].map((e) => corner(t, e));
        if (
          [0, 1, 2].some((e) => pierces(A[e]!, A[(e + 1) % 3]!, B)) ||
          [0, 1, 2].some((e) => pierces(B[e]!, B[(e + 1) % 3]!, A))
        )
          ++count;
      }
  return count;
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
