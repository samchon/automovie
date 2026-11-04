import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";

/**
 * The neck's bottom ring as the shoulders read it. The neck owns this ring:
 * the trunk reads its landmarks and its lateral outline, and the shoulders
 * copy its layer (rule J3). The ring is not a neck circle but the trapezius'
 * flare: on f1 its half width is 157.8 mm at the bottom and falls 3.3 mm per
 * mm of height over the next 20 mm, so the shoulder line must arrive at it
 * with that width, slope and curvature.
 */
export namespace AutoMovieHumanTrunkNeckSeat {
  /** The ring's lateral outline: the left extreme as a function of height at the ring's bottom. */
  export interface ILateral {
    /** Height of the ring, mm. */
    y: number;

    /** Half width: the left extreme's lateral place, mm. */
    z: number;

    /** First derivative of the extreme with respect to height, mm per mm. */
    slope: number;

    /** Second derivative of the extreme with respect to height, mm per mm squared. */
    curvature: number;
  }

  /** The neck's bottom ring. */
  export interface ISeat {
    /** Mean height, mm. */
    y: number;

    /** Half width: the left side neck point's lateral place, mm. */
    width: number;

    /** Forward place of the widest point, mm. */
    middle: number;

    /** The ring's point on the front midline. */
    front: [number, number, number];

    /** The ring's point on the back midline. */
    back: [number, number, number];

    /** The left side neck point: the ring's lateral extreme (ISO 8559-1 3.1.7). */
    side: [number, number, number];

    /** The lateral outline's jet at the ring's bottom. */
    lateral: ILateral;
  }

  /** Phases the ring is sampled at. */
  const COUNT: number = 512;

  /** Spacing of the heights the lateral outline's derivatives are read over, mm: wide enough to stay clear of the sampling, narrow against the 20 mm flare. */
  const STEP: number = 1.5;

  /**
   * Read the neck's bottom ring.
   *
   * @param neck The neck chain, named `head`.
   * @returns Its landmarks and lateral outline.
   */
  export function read(neck: IAutoMovieHumanLoftChain): ISeat {
    const y: number = neck.layers[0]!.y;
    const ring: [number, number, number][] = ringAt(neck, y);

    // The left side neck point is the ring's most lateral point on +z.
    let side: [number, number, number] = ring[0]!;
    for (const p of ring) if (p[2] > side[2]) side = p;

    return {
      y,
      width: side[2],
      middle: side[0],
      front: ring[0]!,
      back: ring[COUNT / 2]!,
      side,
      lateral: lateral(neck, y),
    };
  }

  /**
   * The lateral outline's value and its first two derivatives at a height,
   * by one-sided differences over three heights `STEP` apart (second order),
   * since the ring is the chain's first and the outline is read upward.
   *
   * @param neck The neck chain.
   * @param y Height of the ring's bottom, mm.
   * @returns The outline's jet.
   */
  export function lateral(neck: IAutoMovieHumanLoftChain, y: number): ILateral {
    const extreme = (h: number): number => Math.max(...ringAt(neck, h).map((p: [number, number, number]): number => p[2]));
    const z0: number = extreme(y);
    const z1: number = extreme(y + STEP);
    const z2: number = extreme(y + 2 * STEP);

    return {
      y,
      z: z0,
      slope: (-3 * z0 + 4 * z1 - z2) / (2 * STEP),
      curvature: (z0 - 2 * z1 + z2) / (STEP * STEP),
    };
  }

  /**
   * The neck's bottom layer as the shoulders' top layer (rule J3): its
   * coefficients, lift and slopes, and as its curvatures the second station
   * derivative of the neck's own first interval at its start, so the
   * shoulders' last interval meets the neck's first with the same curvature.
   *
   * @param neck The neck chain.
   * @returns A layer carrying the neck's jets at its bottom.
   */
  export function layer(neck: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain.ILayer {
    const a: IAutoMovieHumanLoftChain.ILayer = neck.layers[0]!;
    const b: IAutoMovieHumanLoftChain.ILayer = neck.layers[1]!;
    const H: number = b.y - a.y;

    // A cubic Hermite interval of width H with end values f0, f1 and slopes
    // m0, m1 has f'' at its start of (6 (f1 - f0) / H - 4 m0 - 2 m1) / H.
    const curvatures: number[] = a.coefficients.map((f0: number, i: number): number =>
      a.curvatures !== undefined
        ? a.curvatures[i]!
        : (6 * (b.coefficients[i]! - f0)) / (H * H) - (4 * a.slopes[i]! + 2 * b.slopes[i]!) / H,
    );

    return {
      y: a.y,
      coefficients: [...a.coefficients],
      slopes: [...a.slopes],
      curvatures,
      ...(a.lift !== undefined ? { lift: [...a.lift], liftSlopes: [...a.liftSlopes!] } : {}),
    };
  }

  /**
   * The ring at a height at uniform phases.
   *
   * @param neck The neck chain.
   * @param y Height, mm.
   * @returns The ring's points.
   */
  function ringAt(neck: IAutoMovieHumanLoftChain, y: number): [number, number, number][] {
    return AutoMovieHumanLoftChain.ring(
      neck,
      y,
      Array.from({ length: COUNT }, (_: unknown, i: number): number => (2 * Math.PI * i) / COUNT),
    );
  }
}
