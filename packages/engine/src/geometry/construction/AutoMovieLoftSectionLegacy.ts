import type {
  AutoMovieLoftSectionLegacyRows,
  IAutoMovieLoftChain,
  IAutoMovieLoftCoefficientSource,
  IAutoMovieLoftSectionJet,
  IAutoMovieLoftSectionLegacy,
  IAutoMovieLoftSectionPhase,
  IAutoMovieStationHermite,
} from "@automovie/interface";

import { overflowsBinary64 } from "../../math/overflowsBinary64";
import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import { AutoMovieLoftCoefficientSource } from "./AutoMovieLoftCoefficientSource";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import { AutoMovieStationHermite } from "./AutoMovieStationHermite";

/** The actual legacy spline generating field used by a mixed native boundary. */
export namespace AutoMovieLoftSectionLegacy {
  /** Prepare only the requested station capability of the existing spline field. */
  export function prepare(
    chain: IAutoMovieLoftChain,
    station: number,
    order: 0 | 2,
  ): IAutoMovieLoftSectionLegacy.IPrepared {
    if (chain.basis !== "spline")
      throw new Error(
        "A mixed continuation requires the existing complete spline basis.",
      );
    const [lo, hi]: [number, number] = AutoMovieLoftChain.bracket(
      chain,
      station,
    );
    const a: IAutoMovieLoftChain.ILayer = chain.layers[lo]!;
    const b: IAutoMovieLoftChain.ILayer = chain.layers[hi]!;
    const H: number = b.y - a.y;
    const u: number = Math.min(1, Math.max(0, (station - a.y) / H));
    const source: IAutoMovieLoftCoefficientSource.IControls | null =
      AutoMovieLoftCoefficientSource.controls(chain, station);
    const quintic: boolean =
      a.curvatures !== undefined && b.curvatures !== undefined;
    const first: IAutoMovieStationHermite.IEnd = source?.a ?? {
      value: a.coefficients,
      slope: a.slopes,
      ...(quintic ? { curvature: a.curvatures! } : {}),
    };
    const last: IAutoMovieStationHermite.IEnd = source?.b ?? {
      value: b.coefficients,
      slope: b.slopes,
      ...(quintic ? { curvature: b.curvatures! } : {}),
    };
    const rows: number[][] = (order === 0 ? [0] : [0, 1, 2]).map(
      (derivative: number): number[] =>
        AutoMovieStationHermite.combine(
          first,
          last,
          source === null
            ? AutoMovieStationHermite.weights(
                u,
                H,
                derivative as 0 | 1 | 2,
                quintic,
              )
            : AutoMovieLoftCoefficientSource.weights(
                source,
                derivative as 0 | 1 | 2,
              ),
        ),
    );
    if (!rows.every((row: number[]): boolean => row.length === 2 * chain.order))
      throw new Error("The requested legacy basis rows are incomplete.");
    return order === 0
      ? { kind: "value", order: chain.order, rows: [rows[0]!] }
      : {
          kind: "jet",
          order: chain.order,
          rows: [rows[0]!, rows[1]!, rows[2]!],
        };
  }

  /** Value and two phase derivatives of the actual complete basis. */
  export function phase(
    prepared: IAutoMovieLoftSectionLegacy.IPrepared,
    phi: number,
  ): IAutoMovieLoftSectionPhase {
    const q: [number, number, number, number, number, number] =
      AutoMovieSplineCurve.jet(prepared.rows[0], prepared.order, phi);
    return admit({ p: [q[0], q[1]], t: [q[2], q[3]], tt: [q[4], q[5]] });
  }

  /** Exact total2 of the declared legacy basis function. */
  export function jet(
    prepared: IAutoMovieLoftSectionLegacy.IPrepared,
    phi: number,
  ): IAutoMovieLoftSectionJet {
    if (prepared.kind !== "jet")
      throw new Error("The legacy station has no prepared physical source2.");
    const q: IAutoMovieLoftSectionPhase = phase(prepared, phi);
    const first: [number, number, number, number, number, number] =
      AutoMovieSplineCurve.jet(prepared.rows[1], prepared.order, phi);
    const second: [number, number, number, number, number, number] =
      AutoMovieSplineCurve.jet(prepared.rows[2], prepared.order, phi);
    return admit({
      ...q,
      s: [first[0], first[1]],
      ss: [second[0], second[1]],
      st: [first[2], first[3]],
    });
  }

  /** Define a complete coefficient-polynomial extension of actual endpoint2. */
  export function extend(
    rows: AutoMovieLoftSectionLegacyRows,
    order: number,
    displacement: number,
    derivative: 0 | 2,
  ): IAutoMovieLoftSectionLegacy.IPrepared {
    if (
      rows.length !== 3 ||
      !rows.every((row: readonly number[]): boolean => row.length === 2 * order)
    )
      throw new Error(
        "A basis extension needs complete endpoint coefficient2.",
      );
    const value: number[] = rows[0].map(
      (v: number, q: number): number =>
        v +
        displacement * rows[1][q]! +
        0.5 * displacement * displacement * rows[2][q]!,
    );
    // The quadratic extension overflows binary64 where its terms do.
    if (value.some(overflowsBinary64))
      throw new Error("The declared basis extension has no finite value row.");
    if (derivative === 0) return { kind: "value", order, rows: [value] };
    const first: number[] = rows[1].map(
      (v: number, q: number): number => v + displacement * rows[2][q]!,
    );
    if (first.some(overflowsBinary64))
      throw new Error(
        "The declared basis extension has no finite physical first derivative row.",
      );
    return { kind: "jet", order, rows: [value, first, [...rows[2]]] };
  }
}

/**
 * Admit only the required returned total-order components, never unused higher
 * partials.
 */
function admit<T extends IAutoMovieLoftSectionPhase>(out: T): T {
  return out;
}
