import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import type { AutoMovieLoftViewSource } from "./AutoMovieLoftViewSource";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/** The exact compatibility rows whose legitimate producer admitted a source. */
interface Binding {
  station: number;
  value: number[];
  slope: number[];
  curvature: number[] | null;
  unavailable: string | null;
}

/** A complete actual boundary function in one of the two supported families. */
type Family =
  | { kind: "native"; inputs: AutoMovieLoftViewRead.IJets }
  | {
      kind: "basis";
      order: number;
      rows: readonly [number[], number[], number[]];
    };

/** A chain remains structurally usable before the public interface acquires this source field. */
type Chain = IAutoMovieLoftChain & {
  nativeSource?: AutoMovieLoftSectionSource.ISource;
};

/** Explicit endpoint metadata belongs to the layer that its producer re-expressed. */
type Layer = IAutoMovieLoftChain.ILayer & {
  sectionSource?: AutoMovieLoftSectionSource.IEndpoint;
};

/**
 * Explicit original scalar ownership and numeric binding snapshots.
 *
 * @evidence contracts/common.md#principled-implementation Original plain scalar data and independent compatibility-row snapshots preserve immutable source ownership and expose changed boundary families.
 * @evidence contracts/common.md#clear-and-simple-design Native source retention and endpoint retention share one explicit validation owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No WeakMap registration changes geometry; stale coefficient rewrites and broken present metadata throw instead of choosing a legacy curve.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes finite value admission, physical source2 availability, compatibility arrays and explicit endpoint functions.
 * @evidence contracts/performance.md#efficient-algorithms One source2 query and O(N) snapshot per principal row precede binary snapshot lookup and O(N) selected-row comparison on cold station preparation.
 * @evidence contracts/performance.md#reuse-equivalent-work Retained original scalar preparations and explicit endpoint data are shared by immutable chain copies and station plans.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Source knots plus O(LN) numeric binding data and fixed endpoint records are caller-owned; no module cache retains them.
 */
export namespace AutoMovieLoftSectionSource {
  /**
   * Original scalar field and the compatibility rows published beside it.
   *
   * @evidence contracts/common.md#principled-implementation Retains the actual prepared scalar functions independently of their approximate principal coefficient projection.
   * @evidence contracts/common.md#clear-and-simple-design One discriminator, scalar source and ordered binding list define admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing physical jet is a diagnostic status rather than a fabricated tuple or lost finite value.
   * @evidence contracts/common.md#meaningful-documentation Data is immutable and value-copyable; the frame owner's callable serialization limit is separate.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no interpolation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Readers own station-plan reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Its plain original sources and linear binding rows belong to its containing chain.
   */
  export interface ISource {
    /** A broken present discriminator never means source absence. */
    kind: "view";

    /** Original scalar functions and existing effective cap law. */
    data: AutoMovieLoftViewSource.ISource;

    /** Independent snapshots; a later coefficient rewrite must explicitly re-express ownership. */
    rows: readonly Binding[];
  }

  /**
   * Actual endpoint family with an independent transformed-layer binding.
   *
   * @evidence contracts/common.md#principled-implementation Complete native scalar2 or actual basis coefficient2 determines the endpoint's whole phase function.
   * @evidence contracts/common.md#clear-and-simple-design Family and transformed numeric layer snapshot remain explicit plain records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A composed non-native function is not fitted into eight native scalars, and no missing derivative row is supplied as zero.
   * @evidence contracts/common.md#meaningful-documentation Station direction and chart reflection are applied before binding this record to its new layer.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This endpoint record evaluates no curve.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Endpoint construction and station preparation own reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Two fixed scalar/basis snapshots and one layer binding are retained only by their resulting immutable chain.
   */
  export interface IEndpoint {
    /** Explicit boundary discriminator. */
    kind: "endpoint";

    /** Actual complete endpoint generating family, already oriented into the receiver. */
    field: Family;

    /** The changed layer's compatibility arrays and station. */
    binding: Binding;

    /** Independent plain field snapshot, preserving value copies and detecting stale edits. */
    snapshot: Family;
  }

  /**
   * Bind original scalar ownership after ordinary/frame coefficient preparation.
   *
   * @evidence contracts/common.md#principled-implementation Retains the original scalar definition and snapshots the emitted compatibility rows without using them as native geometry.
   * @evidence contracts/common.md#clear-and-simple-design One pass records actual source2 availability separately from row values.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unavailable physical source2 is recorded without rejecting the original finite Point0 definition.
   * @evidence contracts/common.md#meaningful-documentation The returned chain owns immutable source/binding data; inputs are never modified.
   * @evidence contracts/performance.md#efficient-algorithms O(L) original scalar queries with their knot lookup costs, plus O(LN) numeric copies.
   * @evidence contracts/performance.md#reuse-equivalent-work Shared original scalar preparations serve all principal and later station queries.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one shallow chain copy and linear snapshots, with no global source registry.
   */
  export function retain(
    chain: Chain,
    data: AutoMovieLoftViewSource.ISource,
  ): Chain {
    const rows: Binding[] = chain.layers.map(
      (layer: IAutoMovieLoftChain.ILayer): Binding => {
        const jets: AutoMovieLoftViewRead.IJets | string =
          AutoMovieLoftViewRead.jets(data, layer.y);
        return remember(layer, typeof jets === "string" ? jets : null);
      },
    );
    return { ...chain, nativeSource: { kind: "view", data, rows } };
  }

  /**
   * Validate retained original ownership at the two rows of one station bracket.
   *
   * @evidence contracts/common.md#principled-implementation Independent numeric snapshots distinguish an unchanged native definition from a stale coefficient rewrite.
   * @evidence contracts/common.md#clear-and-simple-design Explicit absence returns null; present source and selected endpoint records are validated before use.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A malformed or mismatched source throws and never selects legacy geometry; value validation does not require a physical station2.
   * @evidence contracts/common.md#meaningful-documentation lo/hi identify the existing chain bracket; dense finite numeric rows must match twice the actual spline order and remain immutable.
   * @evidence contracts/performance.md#efficient-algorithms Binary source-row lookup and O(N) comparison for each selected ordinary row; explicit endpoint comparison follows its fixed/basis data size.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pure validation creates no registration or cached geometry decision.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains no chain or query after returning.
   */
  export function validate(
    chain: Chain,
    lo: number,
    hi: number,
  ): ISource | null {
    const source: ISource | undefined = chain.nativeSource;
    for (const index of [lo, hi])
      endpoint(chain.layers[index]!, 2 * chain.order);
    if (source === undefined) return null;
    if (
      source === null ||
      source.kind !== "view" ||
      source.data === null ||
      source.data?.kind !== "view" ||
      !Array.isArray(source.rows) ||
      chain.basis !== "spline" ||
      chain.rule !== "polar"
    )
      throw new Error(
        `The present native source of ${chain.name} is malformed or has a changed basis/rule.`,
      );
    for (const index of [lo, hi]) {
      const layer: Layer = chain.layers[index]!;
      if (layer.sectionSource !== undefined) continue;
      const binding: Binding | null = find(source.rows, layer.y);
      if (binding === null || !fits(layer, binding, 2 * chain.order))
        throw new Error(
          `Native compatibility rows of ${chain.name} at ${layer.y} were rewritten without re-expressing their source.`,
        );
    }
    return source;
  }

  /**
   * Read a changed endpoint's explicit family or its genuine absence.
   *
   * @evidence contracts/common.md#principled-implementation Field data and its copied admission snapshot bind to the same transformed layer values and physical jets.
   * @evidence contracts/common.md#clear-and-simple-design One nullable endpoint owner serves readers, continuation and kept neck boundaries.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Present malformed endpoint data throws instead of becoming ordinary basis absence.
   * @evidence contracts/common.md#meaningful-documentation Binding validation is independent of the separate frame source owner; an optional expectedWidth lets the actual chain bracket enforce its output density without rereading row properties.
   * @evidence contracts/performance.md#efficient-algorithms Fixed native data or O(N) complete basis data comparison follows O(N) layer snapshot comparison.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The validation owns no cross-call result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a borrowed immutable record and retains nothing globally.
   */
  export function endpoint(
    layer: Layer,
    expectedWidth?: number,
  ): IEndpoint | null {
    const source: IEndpoint | undefined = layer.sectionSource;
    if (source === undefined) return null;
    if (
      source === null ||
      source.kind !== "endpoint" ||
      !fits(layer, source.binding, expectedWidth) ||
      !same(source.field, source.snapshot) ||
      !family(source.field)
    )
      throw new Error(
        `The present native boundary at station ${layer.y} is stale or malformed.`,
      );
    return source;
  }

  /**
   * Attach actual oriented endpoint data to a newly transformed layer.
   *
   * @evidence contracts/common.md#principled-implementation Copies the actual complete family and the new layer's independent numeric binding after coordinate re-expression.
   * @evidence contracts/common.md#clear-and-simple-design One record combines the oriented generating data and its explicit layer ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses incomplete families; no callback registration or inferred geometry is introduced.
   * @evidence contracts/common.md#meaningful-documentation The caller owns the station/phase sign transform and actual physical source2 availability.
   * @evidence contracts/performance.md#efficient-algorithms Fixed native copies or linear complete basis copies plus one O(N) layer snapshot.
   * @evidence contracts/performance.md#reuse-equivalent-work The retained endpoint is shared by both adjoining field readers.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns independent plain data and retains no host chain or callable owner.
   */
  export function bind(layer: Layer, field: Family): IEndpoint {
    if (!family(field))
      throw new Error(
        "A native boundary needs an actual complete generating family.",
      );
    return {
      kind: "endpoint",
      field: structuredClone(field),
      snapshot: structuredClone(field),
      binding: remember(layer, null),
    };
  }

  /**
   * Presence/recorded availability of native physical2 at retained layer boundaries.
   *
   * @evidence contracts/common.md#principled-implementation Preserves recorded missing source2 status while changed endpoint records already contain complete actual family2.
   * @evidence contracts/common.md#clear-and-simple-design This predicate complements existing frame-presence checks without evaluating phase geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is not a certificate of an arbitrary interior station; every actual native jet query still checks its source2.
   * @evidence contracts/common.md#meaningful-documentation Ordinary source absence keeps existing legacy admission; unavailable native physical2 remains distinct from finite values.
   * @evidence contracts/performance.md#efficient-algorithms One layer scan with direct aligned-row lookup, using binary lookup only for clipped/reordered row indices.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pure predicate creates no cached availability authority.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains no input or result.
   */
  export function regular(chain: Chain): boolean {
    const source: ISource | undefined = chain.nativeSource;
    if (source === undefined) return true;
    if (
      source === null ||
      source.kind !== "view" ||
      !Array.isArray(source.rows)
    )
      throw new Error("The present native availability record is malformed.");
    return chain.layers.every(
      (layer: Layer, index: number): boolean =>
        layer.sectionSource !== undefined ||
        (source.rows[index]?.station === layer.y
          ? source.rows[index]!.unavailable === null
          : find(source.rows, layer.y)?.unavailable === null),
    );
  }
}

/** Snapshot actual compatibility values; no missing physical jet is invented here. */
function remember(
  layer: IAutoMovieLoftChain.ILayer,
  unavailable: string | null,
): Binding {
  return {
    station: layer.y,
    value: [...layer.coefficients],
    slope: [...layer.slopes],
    curvature: layer.curvatures === undefined ? null : [...layer.curvatures],
    unavailable,
  };
}

/** Compare ordinary rows in their original getter order; every row must be dense finite data at the same output width. */
function fits(
  layer: IAutoMovieLoftChain.ILayer,
  binding: Binding,
  expectedWidth?: number,
): boolean {
  if (binding === null || binding === undefined || binding.station !== layer.y)
    return false;
  const value: unknown = layer.coefficients;
  const valueSnapshot: unknown = binding.value;
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length % 2 !== 0 ||
    (expectedWidth !== undefined && value.length !== expectedWidth) ||
    !same(value, valueSnapshot, true)
  )
    return false;
  const slope: unknown = layer.slopes;
  const slopeSnapshot: unknown = binding.slope;
  if (
    !Array.isArray(slope) ||
    slope.length !== value.length ||
    !same(slope, slopeSnapshot, true)
  )
    return false;
  const curvature: unknown = layer.curvatures ?? null;
  const curvatureSnapshot: unknown = binding.curvature;
  return curvature === null
    ? curvatureSnapshot === null
    : Array.isArray(curvature) &&
        curvature.length === value.length &&
        same(curvature, curvatureSnapshot, true);
}

/** Ordered original bindings permit clipping without changing source evaluation. */
function find(rows: readonly Binding[], station: number): Binding | null {
  let low: number = 0;
  let high: number = rows.length;
  while (low < high) {
    const middle: number = (low + high) >> 1;
    if (rows[middle]!.station < station) low = middle + 1;
    else high = middle;
  }
  return rows[low]?.station === station ? rows[low]! : null;
}

/** Whole phase functions require either eight native source2 inputs or complete basis2 rows. */
function family(value: Family): boolean {
  if (value === null || value === undefined) return false;
  if (value.kind === "basis")
    return (
      Number.isInteger(value.order) &&
      value.order > 0 &&
      Array.isArray(value.rows) &&
      value.rows.length === 3 &&
      [0, 1, 2].every(
        (q: number): boolean =>
          Object.hasOwn(value.rows, q) &&
          finiteRow(value.rows[q], 2 * value.order),
      )
    );
  return (
    value.kind === "native" &&
    value.inputs !== null &&
    Array.isArray(value.inputs?.extents) &&
    Array.isArray(value.inputs.shoulders) &&
    value.inputs.extents.length === 4 &&
    value.inputs.shoulders.length === 4 &&
    [0, 1, 2, 3].every(
      (q: number): boolean =>
        Object.hasOwn(value.inputs.extents, q) &&
        Object.hasOwn(value.inputs.shoulders, q),
    ) &&
    [...value.inputs.extents, ...value.inputs.shoulders].every(
      (jet: readonly number[], q: number): boolean =>
        Array.isArray(jet) &&
        finiteRow(jet, 3) &&
        jet[0]! > 0 &&
        (q < 4 || jet[0]! < 1),
    )
  );
}

/** Native/basis family vectors require own finite numeric entries; sparse arrays never become complete jets. */
function finiteRow(value: unknown, width: number): boolean {
  if (!Array.isArray(value) || value.length !== width) return false;
  for (let q: number = 0; q < width; q++)
    if (!Object.hasOwn(value, q) || !Number.isFinite(value[q])) return false;
  return true;
}

/**
 * Numeric rows and nested family tuples compare dense own entries in left/right order.
 * Matching array identity never skips admission. Optional undefined record fields
 * retain their existing absent-field meaning; unavailable curvature remains null.
 * First mismatch stops before later getters, while reached getter failures propagate.
 */
function same(a: unknown, b: unknown, numeric: boolean = false): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return false;
    for (let q: number = 0; q < a.length; q++) {
      if (!Object.hasOwn(a, q) || !Object.hasOwn(b, q)) return false;
      const left: unknown = a[q];
      const right: unknown = b[q];
      if (typeof left === "number") {
        if (!Number.isFinite(left) || left !== right) return false;
      } else if (
        numeric ||
        !Array.isArray(left) ||
        !Array.isArray(right) ||
        !same(left, right)
      )
        return false;
    }
    return true;
  }
  if (a === b && (a === null || typeof a !== "object"))
    return typeof a !== "number" || Number.isFinite(a);
  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  )
    return false;
  const left: Record<string, unknown> = a as Record<string, unknown>;
  const right: Record<string, unknown> = b as Record<string, unknown>;
  const keys: string[] = Object.keys(left).filter(
    (key: string): boolean => left[key] !== undefined,
  );
  return (
    keys.length ===
      Object.keys(right).filter(
        (key: string): boolean => right[key] !== undefined,
      ).length &&
    keys.every((key: string): boolean => same(left[key], right[key]))
  );
}
