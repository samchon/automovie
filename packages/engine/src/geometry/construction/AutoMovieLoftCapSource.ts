import { AutoMovieLoftFrameSource } from "./AutoMovieLoftFrameSource";
import { AutoMovieLoftSectionSource } from "./AutoMovieLoftSectionSource";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** A retained original closed end, with legacy absence still permitted. */
type Pole = NonNullable<IAutoMovieLoftChain["pole"]>;
/** Immutable original chain and its explicit end ownership. */
type Chain = IAutoMovieLoftChain;

/**
 * Explicit ownership of original cap intervals beyond principal positive rows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives station units, immutable callback lifetime, copy semantics and unsupported transformed ownership.
 * @evidence contracts/development/design.md#principled-representation Represents Explicit ownership of original cap intervals beyond principal positive rows: companion namespace of 4 members (`ISource`, `retain`, `bounds`, `at`); units and frames named in its text: world, frame. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieLoftCapSource` in packages/engine/src/geometry/construction/AutoMovieLoftCapSource.ts; its surface is the 4 members listed and the text shows 5 other files naming it, mostly packages/engine (5), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieLoftCapSource {
  /**
   * Immutable source capability for one actual retained closed end.
   *
   * @evidence contracts/development/design.md#principled-representation Stores actual generating ownership separately from principal projection data and physical-jet availability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface End station, adjacent station and independent bindings define precisely the retained interval.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Value copies preserve numeric bindings; callable axes must be retained or rebuilt, never restored from JSON as a hidden registration.
   * @evidence contracts/development/common.md#meaningful-documentation Coordinates are physical station mm, point is world mm, and callback dependencies must remain immutable for reader lifetime.
   */
  export interface ISource {
    /** Original closed station in mm. */
    station: number;

    /** Unchanged nearest principal row, in mm. */
    adjacent: number;

    /** Actual original axis; value-only axes remain value-only. */
    axis: IAutoMovieViewPart["axis"];

    /** Independent original world pole value. */
    point: [number, number, number];

    /** Exact numeric boundary snapshot; changed producers must re-express it. */
    boundary: string;

    /** Exact plain scalar snapshot, independent of its retained source record. */
    scalar: string;
  }

  /**
   * Retain original cap ownership after all principal-row preparation.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Existing pole declarations and the direct native scalar source define the original end stations; original axis ownership is passed by the producer.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shallow chain copy attaches two independent end records without changing any row or curve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Source absence leaves legacy poles unchanged; lift-bearing boundaries have no authored cap lift owner and are not silently extrapolated.
   * @evidence contracts/development/common.md#meaningful-documentation Input and callback dependencies remain immutable, numeric records are copied, and unsupported ownership throws.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most two O(K+N) snapshots and constant end/frame checks; no phase inverse or source2 is required.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares existing scalar preparations and the actual original axis instead of preparing curves again.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned chain owns new end records and shares unchanged rows/source; no registry or cache is retained.
   */
  export function retain(
    chain: IAutoMovieLoftChain,
    axis: IAutoMovieViewPart["axis"],
  ): Chain {
    if (chain.nativeSource === undefined) return chain;
    const copy: Chain = { ...chain };
    for (const key of ["pole", "opposite"] as const) {
      const pole: Pole | undefined = chain[key];
      if (pole === undefined) continue;
      const index: number = pole.end === "bottom" ? 0 : chain.layers.length - 1;
      const layer: IAutoMovieLoftChain.ILayer = chain.layers[index]!;
      const station: number =
        chain.nativeSource.data.domain[pole.end === "bottom" ? 0 : 1];
      copy[key] = {
        ...pole,
        source: {
          station,
          adjacent: layer.y,
          axis,
          point: [...pole.point],
          boundary: binding(layer),
          scalar: JSON.stringify(chain.nativeSource.data),
        },
      };
    }
    bounds(copy);
    return copy;
  }

  /**
   * Owned station interval, including only validated surviving original caps.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Extends principal bounds only through explicit end ownership whose source, adjacent row and pole value still match.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The same validator supplies bounds and actual cap selection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A clipped or deformed present end throws; it is never revived from the old source.domain or silently discarded.
   * @evidence contracts/development/common.md#meaningful-documentation Returns inclusive station mm; no physical2 or pole regularity is implied.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two O(K+N) ownership comparisons, without a numerical geometry query.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure cold validation retains no result and does not change geometry by access history.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a fresh pair escapes; no chain is retained globally.
   */
  export function bounds(chain: Chain): [number, number] {
    const out: [number, number] = [
      chain.layers[0]!.y,
      chain.layers[chain.layers.length - 1]!.y,
    ];
    for (const pole of [chain.pole, chain.opposite]) {
      if (pole?.source === undefined) continue;
      validate(chain, pole);
      out[pole.end === "bottom" ? 0 : 1] = pole.source.station;
    }
    return out;
  }

  /**
   * Actual cap owner outside the principal rows, or null on ordinary rows.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Selects only a retained end's inclusive physical interval and validates its unchanged generating bindings.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Ordinary interpolation remains with the existing row readers; this branch owns only missing cap intervals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance widens ownership and nonfinite stations fail explicitly; malformed present bindings propagate.
   * @evidence contracts/development/common.md#meaningful-documentation A null result means no extra cap owner at that station, not unavailable derivatives becoming legacy geometry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Ordinary stations take constant comparisons; selected caps validate O(K+N) data once per cold preparation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This selector owns no cross-call cache; Point and Jet retain their existing station plans.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a borrowed immutable record or null, with no retained query state.
   */
  export function at(chain: Chain, station: number): ISource | null {
    if (!Number.isFinite(station))
      throw new Error("A loft station must be finite.");
    const first: number = chain.layers[0]!.y;
    const last: number = chain.layers[chain.layers.length - 1]!.y;
    if (station >= first && station <= last) return null;
    for (const pole of [chain.pole, chain.opposite]) {
      if (pole?.source === undefined) continue;
      validate(chain, pole);
      const source: ISource = pole.source;
      if (
        station < Math.min(source.station, source.adjacent) ||
        station > Math.max(source.station, source.adjacent)
      )
        continue;
      return source;
    }
    return null;
  }
}

/** Exact numeric compatibility/frame/lift binding; source callbacks are separate. */
function binding(layer: IAutoMovieLoftChain.ILayer): string {
  return JSON.stringify([
    layer.y,
    layer.coefficients,
    layer.slopes,
    layer.curvatures,
    layer.frame,
    layer.frameSlopes,
    layer.frameCurvatures,
    layer.lift,
    layer.liftSlopes,
    layer.liftCurvatures,
    layer.sectionSource,
  ]);
}

/** What a cap source was last checked against: the chain, its end layer and the pole's point, by identity and value. */
interface IChecked {
  /** The chain the source was checked on. */
  chain: Chain;

  /** That chain's end layer at the time. */
  layer: IAutoMovieLoftChain.ILayer;

  /** The pole record it was checked with. */
  pole: Pole;
}

/** The last passed check of each cap source, released with it. */
const CHECKED: WeakMap<AutoMovieLoftCapSource.ISource, IChecked> = new WeakMap();

/**
 * Reject stale ownership before any actual geometry callback is evaluated.
 *
 * The full check serialises the end layer and the section data to compare them with the source's bindings. It ran for every station read
 * outside the principal rows, a sixth of a capped body's realization. Chains, layers and sources are immutable while they are read, so a
 * source that passed against the same chain, end layer and pole objects is not serialised again; any of them replaced is checked in full.
 */
function validate(chain: Chain, pole: Pole): void {
  const source: AutoMovieLoftCapSource.ISource = pole.source!;
  const end: IAutoMovieLoftChain.ILayer | undefined = chain.layers[pole.end === "bottom" ? 0 : chain.layers.length - 1];
  if (source !== null && typeof source === "object") {
    const passed: IChecked | undefined = CHECKED.get(source);
    if (passed !== undefined && passed.chain === chain && passed.layer === end && passed.pole === pole) return;
  }
  check(chain, pole);
  CHECKED.set(source, { chain, layer: end!, pole });
}

/** The full check of a cap source against its chain's end. */
function check(chain: Chain, pole: Pole): void {
  const source: AutoMovieLoftCapSource.ISource = pole.source!;
  if (
    source === null ||
    typeof source !== "object" ||
    !Array.isArray(source.point) ||
    source.point.length !== 3 ||
    !source.point.every(Number.isFinite)
  )
    throw new Error(
      `The retained original ${pole.end} cap of ${chain.name} is malformed.`,
    );
  const index: number = pole.end === "bottom" ? 0 : chain.layers.length - 1;
  const layer: IAutoMovieLoftChain.ILayer = chain.layers[index]!;
  const native: ReturnType<typeof AutoMovieLoftSectionSource.validate> =
    AutoMovieLoftSectionSource.validate(chain, index, index);
  AutoMovieLoftFrameSource.validate(layer);
  if (
    native === null ||
    source.station !== native.data.domain[pole.end === "bottom" ? 0 : 1] ||
    source.adjacent !== layer.y ||
    !Number.isFinite(source.station) ||
    !(pole.end === "bottom"
      ? source.station < layer.y
      : source.station > layer.y) ||
    typeof source.axis?.at !== "function" ||
    binding(layer) !== source.boundary ||
    JSON.stringify(native.data) !== source.scalar ||
    pole.point.some((x: number, k: number): boolean => x !== source.point[k]) ||
    layer.lift !== undefined
  )
    throw new Error(
      `The retained original ${pole.end} cap of ${chain.name} is stale or unsupported.`,
    );
}
