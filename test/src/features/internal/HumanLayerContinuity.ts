import { AutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanAnatomy } from "./HumanAnatomy";
import { HumanPeople } from "./HumanPeople";

type V3 = HumanAnatomy.V3;

/** A chain's section at a station as a function of phase. */
type Section = (t: number) => V3;

const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * The loft's station continuity across a layer, read from the loft function
 * itself by finite differences.
 *
 * A layer's section is a joint between two intervals of the chain; the chain
 * declares the continuity it keeps there (C1 for every interior layer, C2
 * where the layer and both neighbours carry curvatures). Both readings below
 * bound their own truncation error, so a smooth loft reads clean and a
 * defect of known size reads its size.
 */
export namespace HumanLayerContinuity {
  /** Station step of the tangent reading, mm. */
  export const STEP: number = 1e-3;

  /** Station step of the curvature reading, mm. */
  export const CURVATURE_STEP: number = 0.05;

  /** The continuity readings of one station at every phase. */
  export interface IReading {
    /** Tangent break at each phase, radians: the turn of the surface normal across the station. */
    breaks: Float64Array;

    /** The break each phase may show from the differences' own truncation, radians. */
    limits: Float64Array;

    /** Curvature jump at each phase, 1/mm; zero when curvature is not read. */
    jumps: Float64Array;

    /** The jump a smooth loft may show; infinite when curvature is not read. */
    jumpLimit: number;
  }

  /**
   * The loft's station continuity across a station at every phase.
   *
   * Tangent break: the part along the surface normal of the difference
   * between the one-sided station tangents, `n . (r - l) / |l|`, with `l` and
   * `r` the backward and forward differences over {@link STEP}. A G1 surface
   * reads zero up to the differences' own truncation, which bounds each side
   * by `h / 2 |n . P''|`; the limit is twice that bound plus 1e-6 rad.
   *
   * Curvature jump, read only where C2 is declared: the normal curvature in
   * the station direction from one-sided second differences over
   * {@link CURVATURE_STEP} on either side. A jump `dk` departs from the
   * continued curve by `dk x^2 / 2` at a distance x; over half the shorter
   * neighbouring interval that departure must stay within `tolerance`, so the
   * limit is `8 tolerance / interval^2` plus twice the second differences'
   * truncation `H |P'''|` on both sides, read by third differences.
   *
   * @param surface Station to the section at that station as a function of phase.
   * @param s The station.
   * @param interval Shorter neighbouring interval, mm, for the curvature reading; null skips it.
   * @param phases Uniform phases read.
   * @param tolerance Distance the continued curve may stand from the loft, mm.
   */
  export function continuity(
    surface: (s: number) => Section,
    s: number,
    interval: number | null,
    phases: number,
    tolerance: number,
  ): IReading {
    const h: number = STEP;
    const H: number = CURVATURE_STEP;
    const f0: Section = surface(s);
    const fl: Section = surface(s - h);
    const fr: Section = surface(s + h);
    const fl2: Section = surface(s - 2 * h);
    const fr2: Section = surface(s + 2 * h);
    const sides: Section[] | null =
      interval === null ? null : [surface(s - H), surface(s - 2 * H), surface(s - 3 * H), surface(s + H), surface(s + 2 * H), surface(s + 3 * H)];
    const breaks: Float64Array = new Float64Array(phases);
    const limits: Float64Array = new Float64Array(phases);
    const jumps: Float64Array = new Float64Array(phases);
    let truncation: number = 0;

    for (let i: number = 0; i < phases; i++) {
      const t: number = (2 * Math.PI * i) / phases;
      const dt: number = 1e-4;
      const p: V3 = f0(t);
      const pt: V3 = A.scale(A.sub(f0(t + dt), f0(t - dt)), 1 / (2 * dt));
      const l: V3 = A.scale(A.sub(p, fl(t)), 1 / h);
      const r: V3 = A.scale(A.sub(fr(t), p), 1 / h);
      const n: V3 = A.unit(A.cross(pt, A.add(l, r)));
      const speed: number = Math.max(1e-9, Math.hypot(...A.scale(A.add(l, r), 0.5)));
      const sl: number = Math.abs(A.dot(n, A.add(A.sub(p, A.scale(fl(t), 2)), fl2(t)))) / (h * h);
      const sr: number = Math.abs(A.dot(n, A.add(A.sub(fr2(t), A.scale(fr(t), 2)), p))) / (h * h);

      breaks[i] = Math.abs(A.dot(n, A.sub(r, l))) / speed;
      limits[i] = (2 * (h / 2) * (sl + sr)) / speed + 1e-6;

      if (sides === null) continue;

      const [l1, l2, l3, r1, r2, r3]: Section[] = sides as [Section, Section, Section, Section, Section, Section];
      const kl: number = A.dot(n, A.add(A.sub(p, A.scale(l1(t), 2)), l2(t))) / (H * H) / (speed * speed);
      const kr: number = A.dot(n, A.add(A.sub(r2(t), A.scale(r1(t), 2)), p)) / (H * H) / (speed * speed);
      const tl: number = Math.abs(A.dot(n, A.sub(A.add(A.sub(p, A.scale(l1(t), 3)), A.scale(l2(t), 3)), l3(t)))) / (H * H * H);
      const tr: number = Math.abs(A.dot(n, A.sub(A.add(A.sub(r3(t), A.scale(r2(t), 3)), A.scale(r1(t), 3)), p))) / (H * H * H);

      jumps[i] = Math.abs(kr - kl);

      // A one-sided second difference errs by about H |P'''|, which the third difference reads.
      truncation = Math.max(truncation, (2 * H * (tl + tr)) / (speed * speed));
    }

    return { breaks, limits, jumps, jumpLimit: interval === null ? Infinity : (8 * tolerance) / (interval * interval) + truncation };
  }

  /**
   * The person's loft as a function of chain, station and phase.
   *
   * @param person The person's name in `HumanPeople`.
   */
  export function surface(person: string): (chain: string, s: number) => Section {
    const chains: Map<string, IAutoMovieHumanLoftChain> = new Map(
      HumanPeople.person(person).body.chains.map((c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [c.name, c]),
    );

    return (chain: string, s: number): Section => AutoMovieHumanLoftChain.sampler(chains.get(chain)!, s) as Section;
  }
}
