import { AutoMovieHumanSeamStation } from "../lofting/AutoMovieHumanSeamStation";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";

/**
 * A head chain made C2 along its stations by the natural spline of every
 * coefficient, the lower chain's bottom layer the neck's top layer copied
 * with its jets (rule J3).
 */
export namespace AutoMovieHumanHeadStationSolve {
  /**
   * A head chain made C2 along its stations by the natural spline of every
   * coefficient (`AutoMovieHumanSeamStation.continuous`). With the neck chain
   * given, the chain's bottom layer becomes the neck's top layer, its
   * coefficients, lift, slopes and curvatures, and keeps them through the
   * solve, so the head meets the neck with the neck's position, tangent and
   * curvature (G2). Zero curvature there had left a ring of changing shade
   * round the neck under the jaw.
   *
   * @param chain The head chain; not modified.
   * @param neck The neck chain (named `head`) whose top layer the chain's
   *   bottom layer copies, or null for a chain that does not stand on the neck.
   * @returns The solved chain.
   */
  export function continuous(
    chain: IAutoMovieHumanLoftChain,
    neck: IAutoMovieHumanLoftChain | null,
  ): IAutoMovieHumanLoftChain {
    if (neck === null) return AutoMovieHumanSeamStation.continuous(chain);
    const first: IAutoMovieHumanLoftChain.ILayer = chain.layers[0]!;
    const shared: IAutoMovieHumanLoftChain.ILayer = topLayer(neck, first.y);
    if (shared.coefficients.length !== first.coefficients.length)
      throw new Error(`The neck's top layer has ${shared.coefficients.length} coefficients and ${chain.name}'s bottom ${first.coefficients.length}`);
    return AutoMovieHumanSeamStation.continuous(
      { ...chain, layers: [shared, ...chain.layers.slice(1)] },
      [0],
    );
  }

  /**
   * The neck's top layer with its jets, named in the head chain's station.
   *
   * The two chains share one ring but date it differently: the neck's layer
   * stands at the neck's top station with the ring's heights off it as its
   * lift, while the head's stations start at the ring's mean height (the
   * level its sections are cut from). The copy takes the head's station and
   * carries the difference in its lift, so every point `station + lift` of
   * the ring is the neck's own and the copy stays the head's lowest layer
   * whatever the head's first pitch: a copy left at the neck's station stood
   * 0.5 mm or more over the head's second layer on f1, whose ring dips under
   * its station by more than the first pitch. Slopes and curvatures are per
   * millimetre of station, which a shift of datum leaves as they are.
   *
   * The curvatures are the neck layer's own where it carries them, otherwise
   * the second station derivative of its last interval at its end: a cubic
   * Hermite interval of width H with end values f0, f1 and slopes m0, m1 has
   * f'' at its end of (6 (f0 - f1) / H + 2 m0 + 4 m1) / H.
   *
   * @param neck The neck chain.
   * @param station The head chain's first station, mm.
   * @returns A copy of the neck's top layer at that station.
   */
  function topLayer(neck: IAutoMovieHumanLoftChain, station: number): IAutoMovieHumanLoftChain.ILayer {
    const n: number = neck.layers.length;
    const a: IAutoMovieHumanLoftChain.ILayer = neck.layers[n - 2]!;
    const b: IAutoMovieHumanLoftChain.ILayer = neck.layers[n - 1]!;
    const H: number = b.y - a.y;
    const curvatures: number[] = b.coefficients.map((f1: number, i: number): number =>
      b.curvatures !== undefined
        ? b.curvatures[i]!
        : (6 * (a.coefficients[i]! - f1)) / (H * H) + (2 * a.slopes[i]! + 4 * b.slopes[i]!) / H,
    );

    // One lift per control point (`AutoMovieHumanSeamStation`: half the
    // coefficients), an absent lift being zero.
    const controls: number = b.coefficients.length / 2;
    const shift: number = b.y - station;
    return {
      y: station,
      coefficients: [...b.coefficients],
      slopes: [...b.slopes],
      curvatures,
      lift: (b.lift ?? new Array<number>(controls).fill(0)).map((v: number): number => v + shift),
      liftSlopes: b.liftSlopes !== undefined ? [...b.liftSlopes] : new Array<number>(controls).fill(0),
    };
  }
}
