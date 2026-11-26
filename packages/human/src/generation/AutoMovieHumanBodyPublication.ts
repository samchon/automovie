import type {
  IAutoMovieHumanBodyLane,
  IAutoMovieLoftChain,
  IAutoMovieLoftContract,
  IAutoMovieLoftSectionFrame,
  IAutoMovieSolidBody,
} from "@automovie/interface";

/**
 * Publish finite realized chains and only bodies whose complete face owners
 * survived; no source construction is repeated.
 */
export namespace AutoMovieHumanBodyPublication {
  /**
   * The chains and bodies that can be published: a chain holding a non-finite
   * number in any layer (a section, a slope, a curvature, a plane or its
   * station derivatives) is left out with one diagnostic, and every body naming
   * it with it, because the skin's station bisection over such a chain never
   * meets its tolerance (`construction.md`: a piece that cannot keep its
   * contract records one diagnostic and the figure is still made).
   *
   * @param chains The built chains.
   * @param bodies The realized bodies; one naming a chain left out is left out
   *   with it.
   * @param diagnostics Where each dropped chain and body is recorded.
   * @returns The finite chains and the bodies whose chains all remain.
   */
  export function of(
    chains: IAutoMovieLoftChain[],
    bodies: IAutoMovieSolidBody.IPublished[],
    diagnostics: IAutoMovieLoftContract.IDiagnostic[],
  ): IAutoMovieHumanBodyLane.IOutput {
    function finite(values: readonly number[] | undefined): boolean {
      return values === undefined || values.every(Number.isFinite);
    }
    function plane(f: IAutoMovieLoftSectionFrame | undefined): boolean {
      return (
        f === undefined || [...f.origin, ...f.u, ...f.v].every(Number.isFinite)
      );
    }
    function sound(c: IAutoMovieLoftChain): boolean {
      return c.layers.every(
        (l: IAutoMovieLoftChain.ILayer): boolean =>
          Number.isFinite(l.y) &&
          finite(l.coefficients) &&
          finite(l.slopes) &&
          finite(l.curvatures) &&
          finite(l.lift) &&
          finite(l.liftSlopes) &&
          plane(l.frame) &&
          plane(l.frameSlopes) &&
          plane(l.frameCurvatures),
      );
    }
    const dropped: Set<string> = new Set();
    const kept: IAutoMovieLoftChain[] = chains.filter(
      (c: IAutoMovieLoftChain): boolean => {
        if (sound(c)) return true;
        dropped.add(c.name);
        diagnostics.push({
          producer: `lane.${c.name}`,
          level: 6,
          contract: "finite chain",
          detail: `${c.name} holds a non-finite number in a layer and is left out`,
        });
        return false;
      },
    );
    return {
      chains: kept,
      bodies: bodies.filter((b: IAutoMovieSolidBody.IPublished): boolean => {
        const lost: string[] = b.faces
          .map(
            (f: IAutoMovieSolidBody.IPublished["faces"][number]): string =>
              f.chain,
          )
          .filter((n: string): boolean => dropped.has(n));
        if (lost.length === 0) return true;
        diagnostics.push({
          producer: `lane.${b.name}`,
          level: 6,
          contract: "finite chain",
          detail: `the body names ${lost.join(", ")}, chains left out, so it is left out`,
        });
        return false;
      }),
      diagnostics,
    };
  }
}
