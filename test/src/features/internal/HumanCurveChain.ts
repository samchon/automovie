import { AutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftFrame } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftFrame";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanCurveFoot } from "./HumanCurveFoot";
import { HumanCurveRing } from "./HumanCurveRing";
import { HumanCurveVector } from "./HumanCurveVector";
import { HumanCurveConstants } from "./HumanCurveConstants";

type V3 = [number, number, number];
const { auditRibs }: typeof HumanCurveFoot = HumanCurveFoot;
const { areaNormal, band, centre, crossings, flipsOf, perimeter, side, signedCurvature, uniform }: typeof HumanCurveRing = HumanCurveRing;
const { clamp, distance, dot, sub, unit }: typeof HumanCurveVector = HumanCurveVector;
const { ALIAS, ALIAS_FRONT, BAND, BAND_FLOOR, CAP, CREASE, FACE_CREASE, FACE_RIPPLES, FACE_SLOPE, OVERSHOOT, PHASES, RIDGE, RIDGE_BEARINGS, RIDGE_FACE, RIDGE_STEP, RIPPLES, SEGMENT, SLIDE, SLOPE, SLOPE_GIRTH, SMALL, STEPS }: typeof HumanCurveConstants = HumanCurveConstants;

/** The rules of one chain on its own: finite rings, stations, winding, crossings, slope, slide, overshoot, creases, bands, ridges and ripples. */
export namespace HumanCurveChain {
  /** A chain's own values, rings and surface. */
  export function auditChain(
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
      // Where on the ring a finding stands: its layer and the side of the point.
      const where: (j: number) => string = (j: number): string => `layer ${band(k)} ${side(ring, j)}`;
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

    // A feature of the face narrower than its controls: the section turns by
    // most of a corner in one control, so the mesh's cells alias it into teeth.
    if (/^head\.(lower|middle|upper)$/.test(name))
      chain.layers.forEach(
        (l: IAutoMovieHumanLoftChain.ILayer, k: number): void => {
          const ring: V3[] = AutoMovieHumanLoftChain.ring(chain, l.y, uniform(chain.order));
          const c: V3 = centre(ring);
          ring.forEach((p: V3, j: number): void => {
            if (Math.abs(Math.atan2(p[2] - c[2], p[0] - c[0])) > ALIAS_FRONT) return;
            const a: V3 = sub(p, ring[(j + ring.length - 1) % ring.length]!);
            const b: V3 = sub(ring[(j + 1) % ring.length]!, p);
            if (Math.hypot(...a) < 1e-6 || Math.hypot(...b) < 1e-6) return;
            const turn: number = (Math.acos(clamp(dot(unit(a), unit(b)))) * 180) / Math.PI;
            if (turn > ALIAS)
              report(name, "alias", `layer ${band(k)} ${side(ring, j)}`, turn, ALIAS, p);
          });
        },
      );

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

    // The layer interval a sampled station belongs to.
    const layerOf: (i: number) => number = (i: number): number => Math.ceil(i / STEPS);
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
    auditRibs(chain, report);
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

    // Bearings and radii lie in each ring's own section plane, which is level
    // on a chain without frames and across the bone on a limb lofted in them.
    const table: number[][] = rings.map((ring: V3[], i: number): number[] => {
      const c: V3 = centre(ring);
      const f: AutoMovieHumanLoftFrame.IFrame = AutoMovieHumanLoftChain.frame(chain, low + i * RIDGE_STEP);
      const flat: [number, number][] = ring.map((p: V3): [number, number] => [
        dot(sub(p, c), f.u),
        dot(sub(p, c), f.v),
      ]);
      const angles: number[] = flat.map((p: [number, number]): number =>
        Math.atan2(p[1], p[0]),
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
        return Math.hypot(...flat[at]!);
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
}
