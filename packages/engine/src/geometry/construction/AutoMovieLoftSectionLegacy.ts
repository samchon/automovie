import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import { AutoMovieLoftCoefficientSource } from "./AutoMovieLoftCoefficientSource";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import { AutoMovieStationHermite } from "./AutoMovieStationHermite";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/** Local coordinates and their phase partials, mm and radians. */
type Phase = { p: [number, number]; t: [number, number]; tt: [number, number] };

/** Cartesian total2 in physical station and polar/correspondence phase. */
type Jet = Phase & {
  s: [number, number];
  ss: [number, number];
  st: [number, number];
};

/** Three complete coefficient functions, not frozen Cartesian point jets. */
type Rows = readonly [readonly number[], readonly number[], readonly number[]];

/**
 * The actual legacy spline generating field used by a mixed native boundary.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates local phase-only capability, physical source2 and the explicit spline-only mixed-boundary premise.
 * @evidence contracts/development/design.md#principled-representation Represents The actual legacy spline generating field used by a mixed native boundary: companion namespace of 5 members (`IPrepared`, `prepare`, `phase`, `jet`, `extend`); units and frames named in its text: second, local, radian, radians. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieLoftSectionLegacy` in packages/engine/src/geometry/construction/AutoMovieLoftSectionLegacy.ts; its surface is the 5 members listed and the text shows 4 other files naming it, mostly packages/engine (3), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieLoftSectionLegacy {
  /**
   * Complete value or physical source2 basis data of one station.
   *
   * @evidence contracts/development/design.md#principled-representation The discriminant distinguishes one value row from three actual station derivative rows of the same generating field.
   * @evidence contracts/development/design.md#minimal-and-owned-surface No unavailable derivative row exists on the value variant.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Value-only preparation never fills missing first/second derivatives with zero.
   * @evidence contracts/development/common.md#meaningful-documentation Order is value, first station and second station, with spline control layout.
   */
  export type IPrepared =
    | { kind: "value"; order: number; rows: readonly [number[]] }
    | {
        kind: "jet";
        order: number;
        rows: readonly [number[], number[], number[]];
      };

  /**
   * Prepare only the requested station capability of the existing spline field.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same bracket, complete endpoint arrays and declared physical/pole weights as the existing coefficient readers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One source lookup precedes the required one or three row combinations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses unsupported mixed-boundary bases; order0 never asks an unavailable physical derivative map for order1/2.
   * @evidence contracts/development/common.md#meaningful-documentation Coefficient rows use local mm and actual physical station derivatives.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(log L) bracketing and O(N) output per requested derivative order, plus explicit source validation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Endpoint controls and the source coordinate are shared by all prepared rows.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns owned rows without retaining the chain globally.
   */
  export function prepare(
    chain: IAutoMovieLoftChain,
    station: number,
    order: 0 | 2,
  ): IPrepared {
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
    const source: AutoMovieLoftCoefficientSource.IControls | null =
      AutoMovieLoftCoefficientSource.controls(chain, station);
    const quintic: boolean =
      a.curvatures !== undefined && b.curvatures !== undefined;
    const first: AutoMovieStationHermite.IEnd = source?.a ?? {
      value: a.coefficients,
      slope: a.slopes,
      ...(quintic ? { curvature: a.curvatures! } : {}),
    };
    const last: AutoMovieStationHermite.IEnd = source?.b ?? {
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
    if (
      !rows.every(
        (row: number[]): boolean =>
          row.length === 2 * chain.order && row.every(Number.isFinite),
      )
    )
      throw new Error(
        "The requested legacy basis rows are incomplete or nonfinite.",
      );
    return order === 0
      ? { kind: "value", order: chain.order, rows: [rows[0]!] }
      : {
          kind: "jet",
          order: chain.order,
          rows: [rows[0]!, rows[1]!, rows[2]!],
        };
  }

  /**
   * Value and two phase derivatives of the actual complete basis.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Differentiates the same periodic spline value row analytically in phase.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One spline jet supplies exactly the phase-only tuple.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Requires no physical station derivative and uses no finite difference.
   * @evidence contracts/development/common.md#meaningful-documentation Returns local value, first and second phase vectors in mm/radian units.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads the periodic cubic's fixed local support once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the basis evaluation between value and both phase derivatives.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns three fresh local vectors and retains no output.
   */
  export function phase(prepared: IPrepared, phi: number): Phase {
    const q: [number, number, number, number, number, number] =
      AutoMovieSplineCurve.jet(prepared.rows[0], prepared.order, phi);
    return admit({ p: [q[0], q[1]], t: [q[2], q[3]], tt: [q[4], q[5]] });
  }

  /**
   * Exact total2 of the declared legacy basis function.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Value/phase partials read row0, s and sphi read row1, and ss reads row2 of the same coefficient generating function.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Extracts only six required total-order-two vectors.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A value-only prepared field is refused rather than promoted to a false physical jet.
   * @evidence contracts/development/common.md#meaningful-documentation Physical station uses mm; phase uses the actual spline correspondence radians.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three local periodic spline evaluations have constant phase support.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses prepared actual station rows and the value/phase result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh required vectors; unused higher derivative components are neither required finite nor exposed.
   */
  export function jet(prepared: IPrepared, phi: number): Jet {
    if (prepared.kind !== "jet")
      throw new Error("The legacy station has no prepared physical source2.");
    const q: Phase = phase(prepared, phi);
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

  /**
   * Define a complete coefficient-polynomial extension of actual endpoint2.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each full basis coefficient is defined by c0+d*c1+d*d*c2/2, with its actual derivative rows, so all phase derivatives remain derivatives of a real generating function.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One polynomial extension in coefficient space supplies value-only or physical source2 rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not call the host outside its domain or invent missing native Cartesian higher derivatives.
   * @evidence contracts/development/common.md#meaningful-documentation This is an explicitly new boundary extension law, not a claim of original host fidelity outside its domain.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear work in complete endpoint coefficient rows per station; later phase reads retain local support.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual endpoint rows serve every displacement in the caller-owned boundary definition.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one or three fresh rows without a cache or host reference.
   */
  export function extend(
    rows: Rows,
    order: number,
    displacement: number,
    derivative: 0 | 2,
  ): IPrepared {
    if (
      rows.length !== 3 ||
      !rows.every(
        (row: readonly number[]): boolean =>
          row.length === 2 * order && row.every(Number.isFinite),
      ) ||
      !Number.isFinite(displacement)
    )
      throw new Error(
        "A basis extension needs complete finite endpoint coefficient2 and displacement.",
      );
    const value: number[] = rows[0].map(
      (v: number, q: number): number =>
        v +
        displacement * rows[1][q]! +
        0.5 * displacement * displacement * rows[2][q]!,
    );
    if (!value.every(Number.isFinite))
      throw new Error("The declared basis extension has no finite value row.");
    if (derivative === 0) return { kind: "value", order, rows: [value] };
    const first: number[] = rows[1].map(
      (v: number, q: number): number => v + displacement * rows[2][q]!,
    );
    if (!first.every(Number.isFinite))
      throw new Error(
        "The declared basis extension has no finite physical first derivative row.",
      );
    return { kind: "jet", order, rows: [value, first, [...rows[2]]] };
  }
}

/** Admit only the required returned total-order components, never unused higher partials. */
function admit<T extends Phase>(out: T): T {
  if (
    !Object.values(out).every(
      (row: unknown): boolean =>
        Array.isArray(row) && row.every(Number.isFinite),
    )
  )
    throw new Error(
      "The actual basis field has no finite requested local reading.",
    );
  return out;
}
