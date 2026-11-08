import { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftFrameSource } from "./AutoMovieLoftFrameSource";
import { AutoMovieLoftSectionConnect } from "./AutoMovieLoftSectionConnect";
import { AutoMovieLoftSectionSource } from "./AutoMovieLoftSectionSource";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/**
 * The station rule along a chain and the copy of a shared layer (rule J3).
 *
 * Ordinary chain coefficients follow the natural cubic spline through
 * their values at the layers: among all twice-differentiable functions through
 * them, the one of least `integral f''^2`, continuous in its second
 * derivative at every layer. Each layer carries the spline's first and
 * second derivatives as its `slopes` and `curvatures`, so its intervals take
 * the quintic Hermite rule, which reproduces the spline's cubic exactly and
 * is C2 at every layer whatever the derivatives a layer carries. Three-point
 * slopes, as `AutoMovieHumanHorizontalChain.build` gives, leave the cubic
 * spans meeting at a corner in curvature, a line at every layer.
 * Native scalar compatibility rows, explicit pole-coordinate coefficients,
 * complete endpoint owners and actual-axis frame data keep their producer's
 * station jets instead. Their source records remain part of
 * the chain's geometry and must remain immutable with the principal values.
 *
 * A layer shared with another chain is the owner's: the neighbour copies the
 * owner's layer and its derivatives, signed into its own station direction
 * ({@link copy}), and keeps them through the solve.
 *
 * @evidence contracts/common.md#principled-implementation Ordinary fields receive natural-spline jets; native compatibility rows and complete endpoint owners are validated and preserved, while explicit coefficient/frame sources keep their own jets. Changed spans receive explicit generating laws from the retained actual endpoints.
 * @evidence contracts/common.md#clear-and-simple-design One function makes a chain continuous, keeping the layers a caller names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Layers too close for a stable spline are refused by the station contract, not merged.
 * @evidence contracts/common.md#meaningful-documentation States which fields get jets, which layers are kept and the station premise.
 * @evidence contracts/performance.md#efficient-algorithms Ordinary field solves are O(LW); continuous additionally validates explicit source bindings per bracket and pays SectionConnect.finish's actual endpoint/law lookup and changed-span preparation costs. Source-owned coefficient solves are skipped.
 * @evidence contracts/performance.md#reuse-equivalent-work Each curvature call computes one station-gap array; elimination coefficients are recalculated per component, and supplied curvature results are reused by slopes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned chain shares original scalar/binding data and kept endpoint layers, owns new ordinary derivative arrays and any published changed-span laws; solve scratch is call-local and no module cache retains a chain.
 */
export namespace AutoMovieSeamStation {
  /**
   * Second derivatives of the natural cubic spline through values at
   * stations, for every column at once (the tridiagonal system of continuous
   * first derivatives with zero second derivatives at both ends, solved by
   * the Thomas algorithm).
   *
   * @param t Strictly increasing stations, at least two.
   * @param values Values per station.
   * @returns Second derivatives per station.
   *
   * @evidence contracts/common.md#principled-implementation Thomas elimination solves each component's natural-cubic curvature system with zero endpoint second derivatives; matching finite rows and strictly increasing well-scaled stations are caller premises.
   * @evidence contracts/common.md#clear-and-simple-design The same station system is traversed componentwise into one station-by-component output table.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not merge knots, regularize a zero gap or validate row widths; fewer than three stations receive the natural zero-curvature table.
   * @evidence contracts/common.md#meaningful-documentation States the natural boundary condition, increasing-station premise and output indexing.
   * @evidence contracts/performance.md#efficient-algorithms O(LW) time and output for L stations and W components, plus O(L) gap/elimination scratch, avoid a dense solve.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares one gap array across columns and reuses scratch arrays, but recalculates the modified upper coefficients per column; no shared factorization is claimed.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the new L-by-W curvature table escapes; gap and two elimination arrays die with the call.
   */
  export function curvatures(
    t: readonly number[],
    values: readonly (readonly number[])[],
  ): number[][] {
    const n: number = t.length;
    const width: number = values[0]!.length;
    const out: number[][] = t.map((): number[] =>
      new Array<number>(width).fill(0),
    );
    if (n < 3) return out;
    const h: number[] = t
      .slice(1)
      .map((v: number, i: number): number => v - t[i]!);
    const m: number = n - 2;
    const c: number[] = new Array<number>(m);
    const d: number[] = new Array<number>(m);
    for (let col: number = 0; col < width; col++) {
      // Row i (interior): h_{i-1} M_{i-1} + 2 (h_{i-1} + h_i) M_i + h_i M_{i+1}
      // = 6 (secant_i - secant_{i-1}).
      for (let r: number = 0; r < m; r++) {
        const i: number = r + 1;
        const rhs: number =
          6 *
          ((values[i + 1]![col]! - values[i]![col]!) / h[i]! -
            (values[i]![col]! - values[i - 1]![col]!) / h[i - 1]!);
        const diagonal: number = 2 * (h[i - 1]! + h[i]!);
        const lower: number = h[i - 1]!;
        const upper: number = h[i]!;
        const denom: number = r === 0 ? diagonal : diagonal - lower * c[r - 1]!;
        c[r] = upper / denom;
        d[r] = (r === 0 ? rhs : rhs - lower * d[r - 1]!) / denom;
      }
      out[m]![col] = d[m - 1]!;
      for (let r: number = m - 2; r >= 0; r--)
        out[r + 1]![col] = d[r]! - c[r]! * out[r + 2]![col]!;
    }
    return out;
  }

  /**
   * First derivatives of the natural cubic spline at its stations, from its
   * second derivatives `M`: the derivative of the interval to the right of a
   * station, or of the last interval at the last station.
   *
   * @param t Strictly increasing stations, at least two.
   * @param values Values per station.
   * @param M Second derivatives from {@link curvatures}.
   *
   * @evidence contracts/common.md#principled-implementation Evaluates the natural cubic's endpoint derivative from secant and adjacent curvatures, using the right interval except at the final station.
   * @evidence contracts/common.md#clear-and-simple-design One table mapping handles all stations/components and accepts already solved curvatures.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses supplied M as given or solves it once by default; no slope clipping or finite-difference replacement hides an inconsistent table.
   * @evidence contracts/common.md#meaningful-documentation Gives the final-station interval convention and provenance of the curvature argument.
   * @evidence contracts/performance.md#efficient-algorithms O(LW) derivative work/output; omitting M additionally pays one O(LW) curvature solve and its temporary storage.
   * @evidence contracts/performance.md#reuse-equivalent-work Callers continuous and the coefficient/plane branches pass their existing curvature table, avoiding its second solve; default M owns the one required preparation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new slope table without retaining inputs; a default curvature table becomes unreachable after this synchronous call.
   */
  export function slopes(
    t: readonly number[],
    values: readonly (readonly number[])[],
    M: readonly (readonly number[])[] = curvatures(t, values),
  ): number[][] {
    const n: number = t.length;
    return t.map((_: number, i: number): number[] => {
      // Left end of the interval to the right, or right end of the last.
      const lo: number = Math.min(i, n - 2);
      const h: number = t[lo + 1]! - t[lo]!;
      return values[i]!.map((_v: number, col: number): number => {
        const secant: number = (values[lo + 1]![col]! - values[lo]![col]!) / h;
        return i === lo
          ? secant - (h * (2 * M[lo]![col]! + M[lo + 1]![col]!)) / 6
          : secant + (h * (M[lo]![col]! + 2 * M[lo + 1]![col]!)) / 6;
      });
    });
  }

  /**
   * A shared layer's copied section/plane values and station derivatives.
   *
   * @evidence contracts/common.md#principled-implementation The record carries the owner's boundary data and both derivative orders after conversion to a neighbour's station direction.
   * @evidence contracts/common.md#clear-and-simple-design Six arrays separate section coefficients from flattened plane values and their derivatives.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type certifies neither matching widths nor geometric equality; copy's producer premises and the continuation operator own those checks.
   * @evidence contracts/common.md#meaningful-documentation Names the nine-component plane layout, first-derivative sign and squared second-derivative factor.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This data interface executes no copy or solve.
   * @evidence contracts/performance.md#reuse-equivalent-work A neighbour can retain the copied boundary jet instead of independently estimating derivatives at that shared ring.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The receiving chain owns O(W) section arrays and three nine-entry plane arrays until that boundary data is released; no process cache is added.
   */
  export interface ICopy {
    /** The owner's coefficients. */
    coefficients: number[];

    /** The owner's plane as nine numbers `[origin, u, v]`; horizontal at its station when the owner's layer has no frame. */
    plane: number[];

    /** Station slopes, signed into the neighbour's direction. */
    slopes: number[];

    /** Second station derivatives; the sign squared leaves them as they are. */
    curvatures: number[];

    /** The plane's station slopes, signed. */
    frameSlopes: number[];

    /** The plane's second station derivatives. */
    frameCurvatures: number[];
  }

  /**
   * The copy of an owner's layer for a neighbour that shares it.
   *
   * A neighbour whose station runs the same way as the owner's at the ring
   * (the owner's top is its bottom) takes `factor` 1; one that runs the
   * other way (both chains end there, or both start) takes -1, which flips
   * every first derivative and leaves the second ones.
   *
   * @param owner The owner's layer, carrying its jets (curvatures and plane slopes).
   * @param factor Station direction of the neighbour relative to the owner, 1 or -1.
   *
   * @evidence contracts/common.md#principled-implementation The station chain rule multiplies first derivatives by factor and second derivatives by factor squared; factors 1/-1 express the declared continuation orientations.
   * @evidence contracts/common.md#clear-and-simple-design One explicit record copies section and plane data into the neighbour's boundary representation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Throws for absent owner curvatures/frame slopes; frame curvatures and valid factor are additional caller premises, not independently checked or synthesized.
   * @evidence contracts/common.md#meaningful-documentation Explains orientation sign, required boundary jets and the horizontal fallback for an absent geometric frame.
   * @evidence contracts/performance.md#efficient-algorithms O(W) section-copy work and fixed nine-component plane work allocate only the returned record's arrays and local flattening intermediates.
   * @evidence contracts/performance.md#reuse-equivalent-work Takes the owner's actual boundary values and jets rather than re-solving a neighbour-local estimate.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned arrays own their copied numbers, without retaining the owner layer; transient flattened arrays remain call-local.
   */
  export function copy(
    owner: IAutoMovieLoftChain.ILayer,
    factor: number,
  ): ICopy {
    if (owner.curvatures === undefined || owner.frameSlopes === undefined)
      throw new Error("A shared layer's owner carries no jets");
    return {
      coefficients: [...owner.coefficients],
      plane: flat(owner.frame ?? horizontal(owner.y)),
      slopes: owner.slopes.map((v: number): number => v * factor),
      curvatures: owner.curvatures.map(
        (v: number): number => v * factor * factor,
      ),
      frameSlopes: flat(owner.frameSlopes).map(
        (v: number): number => v * factor,
      ),
      frameCurvatures: flat(owner.frameCurvatures!).map(
        (v: number): number => v * factor * factor,
      ),
    };
  }

  /**
   * A chain made C2 along its stations by the natural spline of every
   * coefficient, its lift and, when every layer is framed, its plane.
   *
   * Layers named in `keep` are shared with an owner and keep the slopes and
   * curvatures they carry (their copies); their values enter the spline like
   * any other layer's. The section, plane and lift values are unchanged, so
   * every principal section stays where it was; only the shape between
   * layers becomes the spline's.
   *
   * @param chain Chain to solve; not modified.
   * @param keep Indices of layers whose derivatives are owned elsewhere.
   * @returns A copy whose layers carry slopes and curvatures (and plane jets when framed).
   *
   * @evidence contracts/common.md#principled-implementation Admits station spacing, preserves explicit coefficient and actual-frame sources, and solves natural-cubic ordinary fields; kept/mixed-source boundaries retain their published endpoint jets rather than being globally resplined.
   * @evidence contracts/common.md#clear-and-simple-design One coordinator owns spacing, field preparation and selective layer replacement while curvatures/slopes own the tridiagonal mathematics.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects kept layers without coefficient curvatures and nonfinite new coefficient jets; lifted/framed field widths and remaining jet completeness are producer premises, not silently repaired.
   * @evidence contracts/common.md#meaningful-documentation States unchanged principal values, kept-layer identity, optional field behavior and the new layer-table return.
   * @evidence contracts/performance.md#efficient-algorithms Ordinary solves cost O(LW); native compatibility solves are skipped. Explicit bindings are validated per bracket before edits, and changed endpoints additionally pay SectionConnect.finish's layer/law/binding and preparation costs.
   * @evidence contracts/performance.md#reuse-equivalent-work Wholly source-owned coefficient/frame tables skip redundant natural solves; ordinary slopes reuse their curvature solve, lift prepares once and kept layer objects remain shared.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned chain owns new derivative arrays and shares kept layers/other chain fields; temporary station, value and solver tables are not retained by the module.
   */
  export function continuous(
    chain: IAutoMovieLoftChain,
    keep: readonly number[] = [],
  ): IAutoMovieLoftChain {
    const rows: readonly IAutoMovieLoftChain.ILayer[] = chain.layers;
    const t: AutoMovieLoftContract.Stations = AutoMovieLoftContract.stations(
      chain.name,
      rows.map((l: IAutoMovieLoftChain.ILayer): number => l.y),
      AutoMovieLoftContract.splineGap(
        rows.map((l: IAutoMovieLoftChain.ILayer): number => l.y),
      ),
    );
    const kept: Set<number> = new Set(keep);
    for (let q: number = 0; q + 1 < rows.length; q++)
      AutoMovieLoftSectionSource.validate(chain, q, q + 1);
    const native: boolean = chain.nativeSource !== undefined;
    const coefficientSources: boolean =
      native ||
      rows.every(
        (l: IAutoMovieLoftChain.ILayer): boolean =>
          l.coefficientSource !== undefined,
      );
    const values: number[][] = coefficientSources
      ? []
      : rows.map((l: IAutoMovieLoftChain.ILayer): number[] => [
          ...l.coefficients,
        ]);
    const cM: number[][] = coefficientSources ? [] : curvatures(t, values);
    const cS: number[][] = coefficientSources ? [] : slopes(t, values, cM);

    // A lift absent on a layer is zero there, as the chain reads it.
    const lifted: boolean = rows.some(
      (l: IAutoMovieLoftChain.ILayer): boolean => l.lift !== undefined,
    );
    const lifts: number[][] = rows.map(
      (l: IAutoMovieLoftChain.ILayer): number[] =>
        l.lift !== undefined
          ? [...l.lift]
          : new Array<number>(l.coefficients.length / 2).fill(0),
    );
    const lS: number[][] = lifted ? slopes(t, lifts) : [];

    // Planes move by the spline only when every layer states its plane.
    const framed: boolean = rows.every(
      (l: IAutoMovieLoftChain.ILayer): boolean => l.frame !== undefined,
    );
    const planeSpline: boolean =
      framed &&
      rows.some(
        (l: IAutoMovieLoftChain.ILayer): boolean => l.frameSource === undefined,
      );
    const planes: number[][] = planeSpline
      ? rows.map((l: IAutoMovieLoftChain.ILayer): number[] => flat(l.frame!))
      : [];
    const pM: number[][] = planeSpline ? curvatures(t, planes) : [];
    const pS: number[][] = planeSpline ? slopes(t, planes, pM) : [];

    return AutoMovieLoftSectionConnect.finish({
      ...chain,
      layers: rows.map(
        (
          l: IAutoMovieLoftChain.ILayer,
          k: number,
        ): IAutoMovieLoftChain.ILayer => {
          AutoMovieLoftFrameSource.validate(l);
          if (kept.has(k) || l.sectionSource !== undefined) {
            if (l.curvatures === undefined && l.sectionSource === undefined)
              throw new Error(
                `Kept layer ${k} of ${chain.name} carries no curvatures`,
              );
            return l;
          }
          const coefficientSlopes: number[] =
            !native && l.coefficientSource === undefined ? cS[k]! : l.slopes;
          const coefficientCurvatures: number[] | undefined =
            !native && l.coefficientSource === undefined
              ? cM[k]!
              : l.curvatures;
          if (coefficientCurvatures === undefined && !native)
            throw new Error(
              "A retained coefficient source carries no station curvatures",
            );
          AutoMovieLoftContract.jet(
            chain.name + " layer " + k + " slopes",
            coefficientSlopes,
            AutoMovieLoftContract.FINITE,
          );
          if (coefficientCurvatures !== undefined)
            AutoMovieLoftContract.jet(
              chain.name + " layer " + k + " curvatures",
              coefficientCurvatures,
              AutoMovieLoftContract.FINITE,
            );
          return {
            ...l,
            slopes: coefficientSlopes,
            curvatures: coefficientCurvatures,
            ...(lifted ? { lift: lifts[k]!, liftSlopes: lS[k]! } : {}),
            ...(planeSpline && l.frameSource === undefined
              ? { frameSlopes: unflat(pS[k]!), frameCurvatures: unflat(pM[k]!) }
              : {}),
          };
        },
      ),
    });
  }

  /**
   * Copy a plane or plane-derivative record to nine numbers `[origin, u, v]`.
   *
   * @evidence contracts/common.md#principled-implementation Concatenation preserves all nine components and their declared origin/u/v order.
   * @evidence contracts/common.md#clear-and-simple-design One conversion exposes the component layout used by the station solver.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not normalize derivative axes or reinterpret their units.
   * @evidence contracts/common.md#meaningful-documentation States flattening order and that derivative-valued records use the same conversion.
   * @evidence contracts/performance.md#efficient-algorithms Copies nine components in constant work and storage.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fixed record conversion owns no coordinated preparation or cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The fresh array owns its numbers without retaining the input tuples.
   */
  export function flat(f: AutoMovieLoftFrame.IFrame): number[] {
    return [...f.origin, ...f.u, ...f.v];
  }

  /**
   * Copy nine `[origin, u, v]` components into a frame-shaped record, preserving axes as given.
   *
   * @evidence contracts/common.md#principled-implementation Groups the fixed nine-component station layout into the original three triples.
   * @evidence contracts/common.md#clear-and-simple-design This is the direct inverse layout conversion of flat, without a second frame representation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Assumes nine supplied entries and preserves their values; no normalization or finite-value admission changes derivative fields.
   * @evidence contracts/common.md#meaningful-documentation Names array order and the unnormalized-axis ownership convention.
   * @evidence contracts/performance.md#efficient-algorithms Nine reads and three fixed triples take constant work and space.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This representation conversion coordinates no repeated solve or cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned record owns its three tuples and retains no input array.
   */
  export function unflat(x: readonly number[]): AutoMovieLoftFrame.IFrame {
    return {
      origin: [x[0]!, x[1]!, x[2]!],
      u: [x[3]!, x[4]!, x[5]!],
      v: [x[6]!, x[7]!, x[8]!],
    };
  }
}

/** Horizontal plane at a station, the default of an unframed layer. */
function horizontal(y: number): AutoMovieLoftFrame.IFrame {
  return { origin: [0, y, 0], u: [1, 0, 0], v: [0, 0, 1] };
}
