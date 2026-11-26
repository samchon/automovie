import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanLimbRootStrip,
} from "@automovie/interface";

/**
 * A limb's root strip: the skin between the trunk's ring, which the trunk owns,
 * and the limb's first own section, shared by the arm at its scye and the leg
 * at the crotch (`docs/techniques/surface-composition.md`, Transition strips;
 * `docs/techniques/seam-registry.md`).
 *
 * Each column of the strip is the quintic Hermite span in the strip's share `w`
 * from the trunk's ring point to the limb's own section point. At the ring it
 * copies the trunk's published jet down across the ring (the point, and the
 * first and second derivatives per millimetre of the trunk's station), and at
 * the limb's section it copies the limb law's own jet along the run, each end
 * reparametrized to the column's chord. So the strip continues each column of
 * the trunk with its tangent and curvature vector (G2) and arrives on the
 * limb's own surface the same way, and neither piece is faded into the other.
 *
 * The strip reads the two published jets; it reads neither the
 * trunk's chain nor the limb's tube, so the limb chain that composes it decides
 * where its own sections end.
 */
export namespace AutoMovieHumanLimbRootStrip {
  /**
   * The strip from the trunk's ring to the limb's own section.
   *
   * @param input The two ends' jets and the run.
   * @returns The strip.
   */
  export function strip(
    input: IAutoMovieHumanLimbRootStrip.IInputs,
  ): IAutoMovieHumanLimbRootStrip.IStrip {
    const { start, end }: IAutoMovieHumanLimbRootStrip.IInputs = input;
    if (start.length !== end.length)
      throw new Error("A root strip needs one end per start");

    // Each column's ends are reparametrized so that its speed there is its
    // chord: the derivatives become `lambda f` and `lambda^2 s` with
    // `lambda = chord / |f|`, which keeps the owner's tangent and curvature
    // vector (G2) whatever the owner's own speed, where the skin lies nearly
    // in the ring's plane and its station derivative grows without bound.
    const columns: {
      c: IAutoMovieHumanLimbRootStrip.IJet;
      a: IAutoMovieHumanLimbRootStrip.IJet;
      lc: number;
      la: number;
    }[] = start.map(
      (
        c: IAutoMovieHumanLimbRootStrip.IJet,
        m: number,
      ): {
        c: IAutoMovieHumanLimbRootStrip.IJet;
        a: IAutoMovieHumanLimbRootStrip.IJet;
        lc: number;
        la: number;
      } => {
        const a: IAutoMovieHumanLimbRootStrip.IJet = end[m]!;
        const chord: number = length(a.point, c.point);

        return { c, a, lc: speed(chord, c.first), la: speed(chord, a.first) };
      },
    );

    return {
      ring: (w: number): AutoMovieVector3Tuple[] => {
        const h: number[] = basis(w);

        return columns.map(
          ({
            c,
            a,
            lc,
            la,
          }: {
            c: IAutoMovieHumanLimbRootStrip.IJet;
            a: IAutoMovieHumanLimbRootStrip.IJet;
            lc: number;
            la: number;
          }): AutoMovieVector3Tuple =>
            [0, 1, 2].map(
              (k: number): number =>
                h[0]! * c.point[k]! +
                h[1]! * lc * c.first[k]! +
                h[2]! * lc * lc * c.second[k]! +
                h[3]! * la * la * a.second[k]! +
                h[4]! * la * a.first[k]! +
                h[5]! * a.point[k]!,
            ) as AutoMovieVector3Tuple,
        );
      },
    };
  }

  /**
   * The scale that gives a derivative a speed equal to a chord.
   *
   * @param chord The column's chord, mm.
   * @param first The owner's first derivative there.
   * @returns The scale, the chord itself where the derivative vanishes.
   */
  function speed(chord: number, first: AutoMovieVector3Tuple): number {
    const f: number = Math.hypot(first[0], first[1], first[2]);

    return f > 0 ? chord / f : chord;
  }

  /**
   * The distance between two points.
   *
   * @param a One point, mm.
   * @param b The other, mm.
   * @returns The distance, mm.
   */
  function length(a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  /**
   * An owner ring's jet where the ray from a centre toward a point's level
   * projection meets the ring's outline, the jets interpolated along the
   * outline's edge there. The strip pairs each column by this crossing, so a
   * column runs from the owner's ring to the limb's own point along one ray,
   * whatever order the owner's own phases run in: paired by phase index, the
   * foot's ring and the leg's section ran in opposite orders on one side and
   * twisted the ankle into an hourglass.
   *
   * @param centre The ring's centre, mm.
   * @param ring The ring's jets, closed, in outline order.
   * @param toward A point of the limb's own section.
   * @returns The jet at the crossing; the first jet where no edge is crossed.
   */
  export function under(
    centre: AutoMovieVector3Tuple,
    ring: readonly IAutoMovieHumanLimbRootStrip.IJet[],
    toward: AutoMovieVector3Tuple,
  ): IAutoMovieHumanLimbRootStrip.IJet {
    const dx: number = toward[0] - centre[0];
    const dz: number = toward[2] - centre[2];
    const l: number = Math.hypot(dx, dz) || 1;
    const ux: number = dx / l;
    const uz: number = dz / l;
    const n: number = ring.length;
    const mix: (
      a: AutoMovieVector3Tuple,
      b: AutoMovieVector3Tuple,
      f: number,
    ) => AutoMovieVector3Tuple = (
      a: AutoMovieVector3Tuple,
      b: AutoMovieVector3Tuple,
      f: number,
    ): AutoMovieVector3Tuple => [
      a[0] + f * (b[0] - a[0]),
      a[1] + f * (b[1] - a[1]),
      a[2] + f * (b[2] - a[2]),
    ];
    let best: number = -1;
    let found: IAutoMovieHumanLimbRootStrip.IJet = ring[0]!;

    for (let i: number = 0; i < n; i++) {
      const a: IAutoMovieHumanLimbRootStrip.IJet = ring[i]!;
      const b: IAutoMovieHumanLimbRootStrip.IJet = ring[(i + 1) % n]!;
      const p: AutoMovieVector3Tuple = a.point;
      const ex: number = b.point[0] - p[0];
      const ez: number = b.point[2] - p[2];
      const den: number = ux * ez - uz * ex;

      if (Math.abs(den) < 1e-12) continue;

      const r: number =
        ((p[0] - centre[0]) * ez - (p[2] - centre[2]) * ex) / den;
      const f: number =
        ((p[0] - centre[0]) * uz - (p[2] - centre[2]) * ux) / den;

      if (r > 0 && f >= 0 && f <= 1 && r > best) {
        best = r;
        found = {
          point: mix(a.point, b.point, f),
          first: mix(a.first, b.first, f),
          second: mix(a.second, b.second, f),
        };
      }
    }

    return found;
  }

  /**
   * The quintic Hermite basis at a share: the weights of the start point, its
   * first and second derivatives, the end's second and first derivatives and
   * the end point, each derivative per unit share.
   *
   * @param t Share of the span.
   * @returns The six weights.
   */
  export function basis(t: number): number[] {
    const t2: number = t * t;
    const t3: number = t2 * t;
    const t4: number = t3 * t;
    const t5: number = t4 * t;

    return [
      1 - 10 * t3 + 15 * t4 - 6 * t5,
      t - 6 * t3 + 8 * t4 - 3 * t5,
      0.5 * t2 - 1.5 * t3 + 1.5 * t4 - 0.5 * t5,
      0.5 * t3 - t4 + 0.5 * t5,
      -4 * t3 + 7 * t4 - 3 * t5,
      10 * t3 - 15 * t4 + 6 * t5,
    ];
  }

  /**
   * The jet of a smooth curve along its run, read by central differences of
   * its points a step either side.
   *
   * @param at The curve's point at a run, mm.
   * @param run Where the jet is read, mm.
   * @param step Half the span the differences are read over, mm.
   * @returns The point and its first and second derivatives per mm.
   */
  export function jet(
    at: IAutoMovieHumanLimbRootStrip.JetAt,
    run: number,
    step: number,
  ): IAutoMovieHumanLimbRootStrip.IJet {
    const p: AutoMovieVector3Tuple = at(run);
    const a: AutoMovieVector3Tuple = at(run - step);
    const b: AutoMovieVector3Tuple = at(run + step);

    return {
      point: p,
      first: [0, 1, 2].map(
        (k: number): number => (b[k]! - a[k]!) / (2 * step),
      ) as AutoMovieVector3Tuple,
      second: [0, 1, 2].map(
        (k: number): number => (b[k]! - 2 * p[k]! + a[k]!) / (step * step),
      ) as AutoMovieVector3Tuple,
    };
  }

  /**
   * The jet of a smooth curve at its end, read by one-sided differences of
   * third order into it, since nothing exists past the end.
   *
   * @param at The curve's point at a run, mm.
   * @param run Where the jet is read, mm: the curve's end.
   * @param step Step of the differences, mm, signed into the curve.
   * @returns The point and its first and second derivatives per mm.
   */
  export function edge(
    at: IAutoMovieHumanLimbRootStrip.EdgeAt,
    run: number,
    step: number,
  ): IAutoMovieHumanLimbRootStrip.IJet {
    const p: AutoMovieVector3Tuple = at(run);
    const a: AutoMovieVector3Tuple = at(run + step);
    const b: AutoMovieVector3Tuple = at(run + 2 * step);
    const c: AutoMovieVector3Tuple = at(run + 3 * step);

    return {
      point: p,
      first: [0, 1, 2].map(
        (k: number): number =>
          (-11 * p[k]! + 18 * a[k]! - 9 * b[k]! + 2 * c[k]!) / (6 * step),
      ) as AutoMovieVector3Tuple,
      second: [0, 1, 2].map(
        (k: number): number =>
          (2 * p[k]! - 5 * a[k]! + 4 * b[k]! - c[k]!) / (step * step),
      ) as AutoMovieVector3Tuple,
    };
  }
}
