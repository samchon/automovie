import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";

type V3 = [number, number, number];

/** Finds every place a generated body is mathematically unsound. */
export namespace HumanCurveAudit {
/** One group of points that break the same rule in the same place. */
export interface IHumanCurveFinding {
  /** Person or parameter set. */
  person: string;

  /** Chain or join. */
  region: string;

  /** Rule broken. */
  rule: string;

  /** Layers and direction on the body. */
  where: string;

  /** Worst value found there. */
  value: number;

  /** The rule's limit. */
  limit: number;

  /** Points in the group. */
  count: number;

  /** The worst point, mm, to look at in the viewer. */
  point: number[];
}

/**
 * Every place a body's curves are mathematically unsound.
 *
 * Each rule is a property of curves and surfaces, in units that do not depend
 * on a person: nothing names a coordinate. Findings are gathered rather than
 * thrown one at a time, so a run fixes them together by cause.
 *
 * - `finite`, `stations`, `winding`: values, station order, ring orientation.
 * - `crossing`: a ring runs over itself.
 * - `slope`: a control point's station slope, against what the ring's width can
 *   need.
 * - `slide`: rings slip along themselves between layers, which shears skin.
 * - `overshoot`: a span swings past both of its layers.
 * - `crease`: tangent breaks along a longitudinal curve (G1).
 * - `band`: curvature flips within less than a radius, the ripple that reads
 *   as a horizontal stripe under light.
 * - `ridge`: the whole ring bends the same way at one height.
 * - `ripple`: a section's curvature flips more often than its anatomy needs.
 * - `gap`, `seam`: a join is open (G0) or kinks across its seam (G1).
 * - `fold`: a limb's or the trunk's join turns within a few millimetres of its
 *   ring, though the tangent planes agree on the ring itself.
 * - `midline`, `mirror`: a limb crosses the plane of symmetry, or the sides
 *   differ under equal inputs.
 */
export function auditHumanCurves(
  person: string,
  body: IAutoMovieHumanBodyCalibration,
  generated: RegExp,
): IHumanCurveFinding[] {
  const groups: Map<string, IHumanCurveFinding> = new Map();
  const report = (
    region: string,
    rule: string,
    where: string,
    value: number,
    limit: number,
    point: readonly number[] = [],
  ): void => {
    const key: string = [region, rule, where].join("|");
    const found: IHumanCurveFinding | undefined = groups.get(key);
    if (found === undefined)
      groups.set(key, {
        person,
        region,
        rule,
        where,
        value,
        limit,
        count: 1,
        point: [...point],
      });
    else {
      found.count++;
      if (value > found.value) {
        found.value = value;
        found.point = [...point];
      }
    }
  };
  const chains: IAutoMovieHumanLoftChain[] = body.chains.filter(
    (c: IAutoMovieHumanLoftChain): boolean => generated.test(c.name),
  );
  for (const chain of chains) auditChain(chain, report);
  auditJoins(body, generated, report);
  auditSides(body, report);
  return [...groups.values()];
}

/**
 * The thigh above its tape, against the tape.
 *
 * The crotch ring is the skin's way into the trunk, not a section of the thigh.
 * A law that lets the ring set the thigh's top keeps its tape exact at the tape's
 * own station and fills the fold under the buttock above it.
 *
 * @param person Name in the findings.
 * @param body The generated body.
 * @param height Stature input, to read the tape in the body's millimetres.
 * @param tape Thigh tape input.
 */
export function auditHumanThigh(
  person: string,
  body: IAutoMovieHumanBodyCalibration,
  height: number,
  tape: number,
): IHumanCurveFinding[] {
  return ["leg.left", "leg.right"].flatMap(
    (name: string): IHumanCurveFinding[] => {
      const leg: IAutoMovieHumanLoftChain = body.chains.find(
        (c: IAutoMovieHumanLoftChain): boolean => c.name === name,
      )!;
      const station: number =
        leg.layers[leg.layers.length - 1]!.y - THIGH_TOP * body.stature;
      const ring: V3[] = AutoMovieHumanLoftChain.ring(
        leg,
        station,
        uniform(PHASES),
      );
      const value: number =
        perimeter(ring) / ((tape * body.stature) / height);
      return value > THIGH_GIRTH
        ? [
            {
              person,
              region: name,
              rule: "thigh",
              where: `at ${Math.round(station)}`,
              value,
              limit: THIGH_GIRTH,
              count: 1,
              point: centre(ring),
            },
          ]
        : [];
    },
  );
}

/** Bounds `[front, back, outer, inner]` of a body part at one share of stature, mm. */
export type IHumanSlice = [string, number, number, number, number, number];

/**
 * Where each part stands at set shares of the stature, in world millimetres.
 *
 * A construction may lay its layers anywhere, so two figures compare at a
 * height rather than a layer. Only the left side is read: the mirror rule owns
 * the right.
 */
export function sliceHumanBody(
  body: IAutoMovieHumanBodyCalibration,
  height: number,
): IHumanSlice[] {
  const k: number = height / body.stature;
  const out: Map<string, IHumanSlice> = new Map();
  for (const [part, pattern] of PARTS)
    for (const chain of body.chains) {
      if (!pattern.test(chain.name)) continue;
      const stations: number[] = chain.layers.flatMap(
        (l: IAutoMovieHumanLoftChain.ILayer, i: number): number[] =>
          i === 0 ? [l.y] : [(l.y + chain.layers[i - 1]!.y) / 2, l.y],
      );
      for (const s of stations)
        for (const p of AutoMovieHumanLoftChain.ring(chain, s, uniform(48))) {
          const share: number = Math.round(((p[1] * k) / height) * SHARES);
          const key: string = `${part}/${share}`;
          const x: number = p[0] * k;
          const z: number = p[2] * k;
          const found: IHumanSlice = out.get(key) ?? [part, share, x, x, z, z];
          found[2] = Math.max(found[2], x);
          found[3] = Math.min(found[3], x);
          found[4] = Math.max(found[4], z);
          found[5] = Math.min(found[5], z);
          out.set(key, found);
        }
    }
  return [...out.values()].map(
    (s: IHumanSlice): IHumanSlice => [
      s[0],
      s[1],
      Math.round(s[2]),
      Math.round(s[3]),
      Math.round(s[4]),
      Math.round(s[5]),
    ],
  );
}

/**
 * Parts that stand absurdly far from the figure before generation. Agreement
 * is not asked for and a small error is not a goal: this fires only where a
 * part has left its place, or is missing from or added to a height.
 */
export function auditHumanSlices(
  person: string,
  body: IAutoMovieHumanBodyCalibration,
  height: number,
  before: readonly IHumanSlice[],
): IHumanCurveFinding[] {
  const now: Map<string, IHumanSlice> = new Map(
    sliceHumanBody(body, height).map((s: IHumanSlice): [string, IHumanSlice] => [
      `${s[0]}/${s[1]}`,
      s,
    ]),
  );
  const out: IHumanCurveFinding[] = [];
  const add = (region: string, where: string, value: number, limit: number): void => {
    out.push({ person, region, rule: "absurd", where, value, limit, count: 1, point: [] });
  };
  const names: string[] = ["front", "back", "outer", "inner"];
  for (const old of before) {
    const share: string = `${Math.round((old[1] / SHARES) * 100)}% of stature`;
    const fresh: IHumanSlice | undefined = now.get(`${old[0]}/${old[1]}`);
    if (fresh === undefined) {
      // A part's end may fall a slice either way.
      if (!now.has(`${old[0]}/${old[1] - 1}`) || !now.has(`${old[0]}/${old[1] + 1}`))
        if (!now.has(`${old[0]}/${old[1] - 1}`) && !now.has(`${old[0]}/${old[1] + 1}`))
          add(old[0], `${share} missing`, 1, 0);
      continue;
    }
    const sizes: number[] = [old[2] - old[3], old[2] - old[3], old[4] - old[5], old[4] - old[5]];
    names.forEach((name: string, i: number): void => {
      const off: number = Math.abs(Number(fresh[i + 2]) - Number(old[i + 2]));
      const limit: number = ABSURD_BASE + ABSURD_SHARE * sizes[i]!;
      if (off > limit) add(old[0], `${share} ${name} edge`, off, Math.round(limit));
    });
  }
  return out;
}

}

/** A chain's own values, rings and surface. */
function auditChain(
  chain: IAutoMovieHumanLoftChain,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  const name: string = chain.name;
  const finite: boolean = chain.layers.every(
    (l: IAutoMovieHumanLoftChain.ILayer): boolean =>
      [...l.coefficients, ...l.slopes, ...(l.lift ?? [])].every(Number.isFinite),
  );
  if (!finite) {
    report(name, "finite", "controls", 1, 0);
    return;
  }
  chain.layers.forEach(
    (l: IAutoMovieHumanLoftChain.ILayer, k: number): void => {
      if (k > 0 && !(l.y > chain.layers[k - 1]!.y))
        report(name, "stations", `layer ${k}`, chain.layers[k - 1]!.y - l.y, 0);
    },
  );
  const digit: boolean = /^(toe|finger|thumb)\./.test(name);
  const pinched: boolean = /^(hand|foot|forefoot|ear)\./.test(name);
  const face: boolean = /^head\./.test(name);
  const rings: V3[][] = chain.layers.map(
    (l: IAutoMovieHumanLoftChain.ILayer): V3[] =>
      AutoMovieHumanLoftChain.ring(chain, l.y, uniform(PHASES)),
  );
  const perimeters: number[] = rings.map(perimeter);

  // Rings: orientation, crossings, section fairness.
  rings.forEach((ring: V3[], k: number): void => {
    const where = (j: number): string => `layer ${band(k)} ${side(ring, j)}`;
    const small: boolean = perimeters[k]! < SMALL;

    // Neighbouring rings turn the same way, whatever way the section planes
    // fan round the chain.
    if (
      !small &&
      k > 0 &&
      perimeters[k - 1]! >= SMALL &&
      dot(areaNormal(ring), areaNormal(rings[k - 1]!)) < 0
    )
      report(name, "winding", `layer ${k}`, 1, 0);
    if (!small && !pinched) {
      const n: number = crossings(ring);
      if (n > 0) report(name, "crossing", `layer ${k}`, n, 0);
    }
    if (small || pinched || digit) return;
    const radius: number = perimeters[k]! / (2 * Math.PI);
    const flips: number[] = flipsOf(signedCurvature(ring), radius, 0.5);
    const ripples: number = face ? FACE_RIPPLES : RIPPLES;
    if (flips.length > ripples)
      report(name, "ripple", where(flips[0]!), flips.length, ripples);
  });

  // Control slopes against what the ring's width can need.
  chain.layers.forEach(
    (l: IAutoMovieHumanLoftChain.ILayer, k: number): void => {
      const limit: number =
        (face ? FACE_SLOPE : SLOPE) *
        Math.max(1, perimeters[k]! / SLOPE_GIRTH);
      const worst: number = Math.max(...l.slopes.map(Math.abs));
      const cap: boolean = perimeters[k]! < CAP;
      if (worst > limit && !digit && !cap && !pinched)
        report(name, "slope", `layer ${band(k)}`, worst, limit);
    },
  );

  // The surface between layers.
  const stations: number[] = chain.layers.flatMap(
    (l: IAutoMovieHumanLoftChain.ILayer, k: number): number[] =>
      k === 0
        ? [l.y]
        : Array.from(
            { length: STEPS },
            (_: unknown, i: number): number =>
              chain.layers[k - 1]!.y +
              ((l.y - chain.layers[k - 1]!.y) * (i + 1)) / STEPS,
          ),
  );
  const grid: V3[][] = stations.map((s: number): V3[] =>
    AutoMovieHumanLoftChain.ring(chain, s, uniform(PHASES)),
  );
  const layerOf = (i: number): number => Math.ceil(i / STEPS);
  const count: number = grid.length;
  const centres: V3[] = grid.map(centre);
  const radii: number[] = grid.map(
    (r: V3[]): number => perimeter(r) / (2 * Math.PI),
  );

  // Slide and overshoot, per interval.
  for (let k: number = 1; k < rings.length; k++) {
    const gap: number = distance(centre(rings[k]!), centre(rings[k - 1]!));
    const a: V3[] = rings[k - 1]!;
    const b: V3[] = rings[k]!;
    const mid: V3[] = grid[(k - 1) * STEPS + Math.floor(STEPS / 2)]!;
    for (let j: number = 0; j < PHASES; j++) {
      const tangent: V3 = unit(sub(a[(j + 1) % PHASES]!, a[(j + PHASES - 1) % PHASES]!));
      const move: V3 = sub(b[j]!, a[j]!);
      const along: number = Math.abs(dot(move, tangent));
      if (gap > 0.5 && along / gap > SLIDE && !digit)
        report(name, "slide", `layer ${band(k)} ${side(a, j)}`, along / gap, SLIDE);
      const chord: number = distance(a[j]!, b[j]!);
      const swing: number = Math.max(
        distance(mid[j]!, a[j]!),
        distance(mid[j]!, b[j]!),
      );
      if (swing > OVERSHOOT * Math.max(chord, 1))
        report(name, "overshoot", `layer ${band(k)} ${side(a, j)}`, swing / Math.max(chord, 1), OVERSHOOT);
    }
  }

  // Longitudinal curves: creases and bands.
  const first: number = digit ? 2 * STEPS : 1;
  for (let j: number = 0; j < PHASES; j += 2) {
    const line: V3[] = grid.map((r: V3[]): V3 => r[j]!);
    const signed: number[] = new Array<number>(count).fill(0);
    for (let i: number = first; i + 1 < count; i++) {
      const a: V3 = sub(line[i]!, line[i - 1]!);
      const b: V3 = sub(line[i + 1]!, line[i]!);
      const la: number = Math.hypot(...a);
      const lb: number = Math.hypot(...b);
      if (la < SEGMENT || lb < SEGMENT) continue;
      const turn: number = Math.acos(clamp(dot(a, b) / (la * lb)));
      const outward: V3 = unit(sub(line[i]!, centres[i]!));
      const bend: V3 = sub(unit(b), unit(a));
      signed[i] = (Math.sign(dot(bend, outward)) * turn) / ((la + lb) / 2);
      const crease: number = face ? FACE_CREASE : CREASE;
      if ((turn * 180) / Math.PI > crease)
        report(name, "crease", `layer ${band(layerOf(i))} ${side(grid[i]!, j)}`, (turn * 180) / Math.PI, crease, line[i]!);
    }
    if (digit) continue;

    // A band is curvature that flips back within a radius.
    let last: number = -1;
    for (let i: number = 1; i + 1 < count; i++) {
      const radius: number = radii[i]!;
      if (radius < 1) continue;
      const value: number = signed[i]! * radius;
      if (Math.abs(value) < BAND_FLOOR) continue;
      if (last >= 0 && Math.sign(signed[last]!) !== Math.sign(value)) {
        const apart: number = distance(line[i]!, line[last]!);
        const size: number = Math.min(Math.abs(value), Math.abs(signed[last]! * radius));
        if (apart < radius && size > BAND)
          report(name, "band", `layer ${band(layerOf(i))} ${side(grid[i]!, j)}`, size, BAND, line[i]!);
      }
      last = i;
    }
  }

  auditRidges(chain, report);
}

/**
 * A ridge bends the whole ring the same way at one height, which no anatomy
 * does: a rib or a breast bends a part of it. It is read off the surface's
 * radius at fixed heights and bearings, so a phase sliding round a ring is not
 * mistaken for a bend, and at even steps, so a short layer does not magnify
 * noise.
 */
function auditRidges(
  chain: IAutoMovieHumanLoftChain,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  if (!/^(trunk|upper|leg\.|arm\.)/.test(chain.name)) return;
  const low: number = chain.layers[0]!.y;
  const high: number = chain.layers[chain.layers.length - 1]!.y;
  const count: number = Math.floor((high - low) / RIDGE_STEP);
  if (count < 3) return;
  const rings: V3[][] = Array.from(
    { length: count + 1 },
    (_: unknown, i: number): V3[] =>
      AutoMovieHumanLoftChain.ring(chain, low + i * RIDGE_STEP, uniform(PHASES)),
  );
  // Across the shoulders only the torso's faces have a bearing: the arm's root
  // is not star-shaped about the ring's centre.
  const bearings: number[] = uniform(RIDGE_BEARINGS).filter(
    (a: number): boolean =>
      chain.name !== "upper" || Math.abs(Math.cos(a)) > RIDGE_FACE,
  );
  const table: number[][] = rings.map((ring: V3[]): number[] => {
    const c: V3 = centre(ring);
    const angles: number[] = ring.map((p: V3): number =>
      Math.atan2(p[2] - c[2], p[0] - c[0]),
    );
    return bearings.map((bearing: number): number => {
      let best: number = Infinity;
      let at: number = 0;
      angles.forEach((a: number, j: number): void => {
        const d: number = Math.abs(
          Math.atan2(Math.sin(a - bearing), Math.cos(a - bearing)),
        );
        if (d < best) {
          best = d;
          at = j;
        }
      });
      const p: V3 = ring[at]!;
      return Math.hypot(p[0] - c[0], p[2] - c[2]);
    });
  });
  for (let i: number = 1; i < count; i++) {
    const r: number = perimeter(rings[i]!) / (2 * Math.PI);
    if (r < 1) continue;
    const bends: number[] = bearings
      .map(
        (_: number, b: number): number =>
          ((table[i + 1]![b]! - 2 * table[i]![b]! + table[i - 1]![b]!) /
            (RIDGE_STEP * RIDGE_STEP)) *
          r,
      )
      .sort((p: number, q: number): number => p - q);
    const middle: number = Math.abs(bends[Math.floor(bends.length / 2)]!);
    if (middle > RIDGE)
      report(
        chain.name,
        "ridge",
        `at ${Math.round(low + i * RIDGE_STEP)}`,
        middle,
        RIDGE,
        centre(rings[i]!),
      );
  }
}

/** Joins: closed, and smooth across the seam. */
function auditJoins(
  body: IAutoMovieHumanBodyCalibration,
  generated: RegExp,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  const chains: Map<string, IAutoMovieHumanLoftChain> = new Map(
    body.chains.map(
      (c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [
        c.name,
        c,
      ],
    ),
  );
  const find = (n: string): IAutoMovieHumanLoftChain => chains.get(n)!;
  for (const event of body.events) {
    const parent: IAutoMovieHumanLoftChain = find(event.parent);
    const down: boolean = event.direction === "down";
    const end: number = down
      ? parent.layers[0]!.y
      : parent.layers[parent.layers.length - 1]!.y;
    const into: number = end + (down ? 1 : -1) * Math.min(REACH, length(parent) / 2);
    for (const split of event.splits) {
      const child: IAutoMovieHumanLoftChain = find(split.child);
      if (!generated.test(child.name) && !generated.test(parent.name)) continue;
      const region: string = `${event.parent} > ${child.name}`;
      const tip: number = down
        ? child.layers[child.layers.length - 1]!.y
        : child.layers[0]!.y;
      const away: number = tip + (down ? -1 : 1) * Math.min(REACH, length(child) / 2);
      const fine: number[] = uniform(720);
      const own: V3[] = AutoMovieHumanLoftChain.ring(child, tip, fine);
      const next: V3[] = AutoMovieHumanLoftChain.ring(child, away, fine);
      for (const [from, to] of split.arcs) {
        const span: number = to >= from ? to - from : to + 2 * Math.PI - from;
        const count: number = 48;
        const phases: number[] = Array.from(
          { length: count },
          (_: unknown, i: number): number =>
            from + (span * (i + 0.5)) / count,
        );
        const ring: V3[] = AutoMovieHumanLoftChain.ring(parent, end, phases);
        const inner: V3[] = AutoMovieHumanLoftChain.ring(parent, into, phases);
        const facing: number[] = [];
        ring.forEach((p: V3, i: number): void => {
          let best: number = Infinity;
          let at: number = 0;
          own.forEach((q: V3, m: number): void => {
            const d: number = distance(p, q);
            if (d < best) {
              best = d;
              at = m;
            }
          });
          facing.push(fine[at]!);
          if (best > GAP) report(region, "gap", side(ring, i), best, GAP, p);

          // Pinches are corners by design: the seam rule is for the open arc.
          const edge: number = Math.min(i, count - 1 - i) / count;
          if (edge < 0.15) return;
          const a: V3 = unit(sub(p, inner[i]!));
          const b: V3 = unit(sub(next[at]!, own[at]!));
          const kink: number = (Math.acos(clamp(dot(a, b))) * 180) / Math.PI;
          if (/ear\./.test(region)) return;
          const limit: number = /> hand\./.test(region)
            ? WRIST_SEAM
            : /^upper > arm/.test(region)
              ? ARMPIT_SEAM
              : /^head\.middle > head\.lower/.test(region)
                ? ARMPIT_SEAM
                : SEAM;
          if (kink > limit) report(region, "seam", side(ring, i), kink, limit, p);
        });

        // How far the skin has turned a few millimetres either side of the ring.
        // One point of a heavy arm pressed on the trunk is a contact, so the
        // rule reads the arc's ninth decile.
        if (!/^(trunk|upper)$/.test(event.parent)) continue;
        const open: number[] = phases
          .map((_: number, i: number): number => i)
          .filter((i: number): boolean => Math.min(i, count - 1 - i) / count >= 0.15);
        const step: number = (down ? 1 : -1) * FOLD_REACH;
        const above: V3[] = normalsOf(
          parent,
          end + step,
          open.map((i: number): number => phases[i]!),
        );
        const below: V3[] = normalsOf(
          child,
          tip - step,
          open.map((i: number): number => facing[i]!),
        );
        const turns: number[] = open
          .map(
            (_: number, i: number): number =>
              (Math.acos(clamp(Math.abs(dot(above[i]!, below[i]!)))) * 180) /
              Math.PI,
          )
          .sort((p: number, q: number): number => p - q);
        const turn: number = turns[Math.floor(0.9 * (turns.length - 1))]!;
        if (turn > FOLD)
          report(region, "fold", side(ring, Math.floor(count / 2)), turn, FOLD, ring[Math.floor(count / 2)]!);
      }
    }
  }
}

/** Unit normals of a chain's surface at one station and given phases. */
function normalsOf(
  chain: IAutoMovieHumanLoftChain,
  station: number,
  phases: number[],
): V3[] {
  const at = (s: number, shift: number): V3[] =>
    AutoMovieHumanLoftChain.ring(
      chain,
      s,
      phases.map((t: number): number => t + shift),
    );
  const up: V3[] = at(station + NORMAL_STATION, 0);
  const down: V3[] = at(station - NORMAL_STATION, 0);
  const ahead: V3[] = at(station, NORMAL_PHASE);
  const behind: V3[] = at(station, -NORMAL_PHASE);
  return phases.map(
    (_: number, i: number): V3 =>
      unit(cross(sub(up[i]!, down[i]!), sub(ahead[i]!, behind[i]!))),
  );
}

/** The two sides mirror each other, and no limb crosses the midline. */
function auditSides(
  body: IAutoMovieHumanBodyCalibration,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  for (const left of body.chains.filter(
    (c: IAutoMovieHumanLoftChain): boolean => /^(arm|leg)\.left$/.test(c.name),
  )) {
    const right: IAutoMovieHumanLoftChain | undefined = body.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean =>
        c.name === left.name.replace("left", "right"),
    );
    if (right === undefined || right.layers.length !== left.layers.length) {
      report(left.name, "mirror", "layer count", 1, 0);
      continue;
    }
    left.layers.forEach(
      (l: IAutoMovieHumanLoftChain.ILayer, k: number): void => {
        const a: V3[] = AutoMovieHumanLoftChain.ring(left, l.y, uniform(PHASES));
        const b: V3[] = AutoMovieHumanLoftChain.ring(
          right,
          right.layers[k]!.y,
          uniform(PHASES),
        );
        let square: number = 0;
        for (const p of a) {
          let near: number = Infinity;
          for (const q of b)
            near = Math.min(
              near,
              (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] + q[2]) ** 2,
            );
          square = Math.max(square, near);
        }
        const off: number = Math.sqrt(square);
        if (off > MIRROR) report(left.name, "mirror", `layer ${band(k)}`, off, MIRROR);
        const across: number = -Math.min(...a.map((p: V3): number => p[2]));
        if (across > MIDLINE)
          report(left.name, "midline", `layer ${band(k)}`, across, MIDLINE);
      },
    );
  }
}

/** Station span of a chain. */
function length(chain: IAutoMovieHumanLoftChain): number {
  return chain.layers[chain.layers.length - 1]!.y - chain.layers[0]!.y;
}

/** Indices where a ring's curvature flips sign while large. */
function flipsOf(
  values: number[],
  radius: number,
  limit: number,
): number[] {
  const out: number[] = [];
  let sign: number = 0;
  values.forEach((v: number, i: number): void => {
    if (Math.abs(v) * radius < limit) return;
    if (sign !== 0 && Math.sign(v) !== sign) out.push(i);
    sign = Math.sign(v);
  });
  return out;
}

/** Signed curvature round a closed ring in the plane of its area. */
function signedCurvature(ring: V3[]): number[] {
  const n: V3 = areaNormal(ring);
  return ring.map((p: V3, j: number): number => {
    const a: V3 = sub(p, ring[(j + ring.length - 1) % ring.length]!);
    const b: V3 = sub(ring[(j + 1) % ring.length]!, p);
    const la: number = Math.hypot(...a);
    const lb: number = Math.hypot(...b);
    if (la < 1e-6 || lb < 1e-6) return 0;
    const c: V3 = cross(a, b);
    const turn: number = Math.atan2(dot(c, n), dot(a, b));
    return turn / ((la + lb) / 2);
  });
}

/** Unit normal of a ring's area. */
function areaNormal(ring: V3[]): V3 {
  const c: V3 = centre(ring);
  let n: V3 = [0, 0, 0];
  ring.forEach((p: V3, i: number): void => {
    n = add(n, cross(sub(p, c), sub(ring[(i + 1) % ring.length]!, c)));
  });
  return unit(n);
}

/** Direction on the body of a ring's point, about the ring's centre. */
function side(ring: V3[], j: number): string {
  const c: V3 = centre(ring);
  const p: V3 = ring[j]!;
  const a: number = Math.atan2(p[2] - c[2], p[0] - c[0]);
  const names: string[] = ["front", "front-left", "left", "back-left", "back", "back-right", "right", "front-right"];
  return names[(Math.round((a / (2 * Math.PI)) * 8) + 8) % 8]!;
}

/** Groups neighbouring layers so one defect reads as one line. */
function band(k: number): string {
  const from: number = Math.floor(k / 4) * 4;
  return `${from}-${from + 3}`;
}

const UNIFORM: Map<number, number[]> = new Map();

function uniform(count: number): number[] {
  const found: number[] | undefined = UNIFORM.get(count);
  if (found !== undefined) return found;
  const phases: number[] = Array.from(
    { length: count },
    (_: unknown, i: number): number => (2 * Math.PI * i) / count,
  );
  UNIFORM.set(count, phases);
  return phases;
}

function perimeter(ring: V3[]): number {
  return ring.reduce(
    (s: number, p: V3, i: number): number =>
      s + distance(p, ring[(i + 1) % ring.length]!),
    0,
  );
}

function crossings(ring: V3[]): number {
  const n: V3 = areaNormal(ring);
  const seed: V3 = Math.abs(n[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
  const u: V3 = unit(cross(n, seed));
  const v: V3 = cross(n, u);
  const flat: [number, number][] = ring.map((p: V3): [number, number] => [
    dot(p, u),
    dot(p, v),
  ]);
  const turn = (a: [number, number], b: [number, number], c: [number, number]): number =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  let count: number = 0;
  const size: number = flat.length;
  for (let i: number = 0; i < size; i++)
    for (let j: number = i + 2; j < size; j++) {
      if (i === 0 && j === size - 1) continue;
      const a = flat[i]!;
      const b = flat[(i + 1) % size]!;
      const c = flat[j]!;
      const d = flat[(j + 1) % size]!;
      if (turn(a, b, c) * turn(a, b, d) < 0 && turn(c, d, a) * turn(c, d, b) < 0)
        count++;
    }
  return count;
}

function centre(ring: V3[]): V3 {
  const s: V3 = ring.reduce((a: V3, p: V3): V3 => add(a, p), [0, 0, 0]);
  return [s[0] / ring.length, s[1] / ring.length, s[2] / ring.length];
}

function add(a: V3, b: V3): V3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: V3, b: V3): V3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function unit(a: V3): V3 {
  const l: number = Math.sqrt(dot(a, a)) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

function distance(a: V3, b: V3): number {
  const d: V3 = sub(a, b);
  return Math.sqrt(dot(d, d));
}

function clamp(v: number): number {
  return Math.min(1, Math.max(-1, v));
}

/** The parts sliced, by name. */
const PARTS: [string, RegExp][] = [
  ["leg", /^leg\.left$/],
  ["foot", /^(foot|forefoot|toe)\.left/],
  ["arm", /^arm\.left$/],
  ["hand", /^(hand|finger|thumb)\.left/],
  ["trunk", /^(trunk|upper)$/],
  ["neck", /^head$/],
  ["head", /^head\.(lower|middle|upper)$/],
];

/** Slices per stature. */
const SHARES: number = 25;

/** Distance from the earlier figure that is absurd for any part, mm. */
const ABSURD_BASE: number = 45;

/** And its growth with the part's extent there. */
const ABSURD_SHARE: number = 0.3;

/** Ring samples. */
const PHASES: number = 96;

/** Surface samples per layer interval. */
const STEPS: number = 4;

/** A ring shorter than this is a cap's tip, mm. */
const SMALL: number = 20;

/** Largest slope for a ring of `SLOPE_GIRTH`: the crotch opens this steeply. */
const SLOPE: number = 13;

/** Girth the slope limit is stated for, mm. */
const SLOPE_GIRTH: number = 1300;

// The limits below sit just above what reads smooth in the viewer. A limit
// licenses everything under it, so a defect the viewer shows gets its own rule
// rather than a tighter number here.

/** Tangential motion per unit of the rings' axial gap. */
const SLIDE: number = 8;

/** Span's swing past its chord. */
const OVERSHOOT: number = 1.5;

/** Turn along a longitudinal curve between samples, degrees. */
const CREASE: number = 40;

/** Shortest step along a curve that can show a corner, mm. */
const SEGMENT: number = 0.5;

/** Curvature times the radius above which a flip is a band. */
const BAND: number = 34;

/** Curvature times the radius that counts as bending at all. */
const BAND_FLOOR: number = 1.5;

/** Median of the radius's height curvature, times the radius, round a ring. */
const RIDGE: number = 8;

/** Height between the rings a ridge is read from, mm. */
const RIDGE_STEP: number = 6;

/** Bearings a ridge is read at. */
const RIDGE_BEARINGS: number = 48;

/** Cosine of a bearing past which it faces forward or back. */
const RIDGE_FACE: number = 0.7;

/** Curvature flips a plain section may have round its ring. */
const RIPPLES: number = 14;

/** And a section through the face, which crosses the nose, lips and sockets. */
const FACE_RIPPLES: number = 26;

/** Station slope a face reaches at the lips' fissure. */
const FACE_SLOPE: number = 17;

/** Turn a face reaches at the lips and the nose's base, degrees. */
const FACE_CREASE: number = 52;

/** A ring shorter than this closes on a pole, where slopes run steep, mm. */
const CAP: number = 150;

/** Open join, mm. */
const GAP: number = 4;

/** Kink across a seam, degrees. */
const SEAM: number = 65;

/**
 * Kink at a fold by design, degrees: the armpit's front, which a heavy arm
 * deepens, and the crease beside the nose where the face's two chains meet.
 */
const ARMPIT_SEAM: number = 85;

/** Kink where the palm leaves the wrist, whose sections turn across the hand, degrees. */
const WRIST_SEAM: number = 96;

/** Station offset of the seam's tangents, mm. */
const REACH: number = 6;

/** Turn of the skin across a limb's or the trunk's join, degrees. */
const FOLD: number = 20;

/** Station offset either side of a join where its turn is read, mm. */
const FOLD_REACH: number = 4;

/** Station half step of a surface normal, mm. */
const NORMAL_STATION: number = 0.02;

/** Phase half step of a surface normal, radians. */
const NORMAL_PHASE: number = 1e-3;

/** Where the thigh's top is read under the crotch ring, a share of stature. */
const THIGH_TOP: number = 0.024;

/** Largest girth of the thigh's top per unit of the thigh tape. */
const THIGH_GIRTH: number = 1.15;

/** Sides' difference under equal inputs, mm. */
const MIRROR: number = 1.5;

/** How far a limb may pass the midline, mm: the softness of the thighs' contact. */
const MIDLINE: number = 1.5;
