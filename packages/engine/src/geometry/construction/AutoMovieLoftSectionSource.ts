import type {
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionSource,
  IAutoMovieLoftSectionSourceBinding,
  IAutoMovieLoftSectionSourceFamily,
  IAutoMovieLoftViewRead,
  IAutoMovieLoftViewSource,
} from "@automovie/interface";

import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";

/** Explicit original scalar ownership and numeric binding snapshots. */
export namespace AutoMovieLoftSectionSource {
  /**
   * Bind original scalar ownership after ordinary/frame coefficient
   * preparation.
   */
  export function retain(
    chain: IAutoMovieLoftChain,
    data: IAutoMovieLoftViewSource.ISource,
  ): IAutoMovieLoftChain {
    const reader: ReturnType<typeof AutoMovieLoftViewRead.prepare> =
      AutoMovieLoftViewRead.prepare(data);
    const rows: IAutoMovieLoftSectionSourceBinding[] = chain.layers.map(
      (
        layer: IAutoMovieLoftChain.ILayer,
      ): IAutoMovieLoftSectionSourceBinding => {
        const jets: IAutoMovieLoftViewRead.IJets | string = reader.jets(
          layer.y,
        );
        return remember(layer, typeof jets === "string" ? jets : null);
      },
    );
    return { ...chain, nativeSource: { kind: "view", data, rows } };
  }

  /**
   * Validate retained original ownership at the two rows of one station
   * bracket.
   */
  export function validate(
    chain: IAutoMovieLoftChain,
    lo: number,
    hi: number,
  ): IAutoMovieLoftSectionSource.ISource | null {
    for (const index of [lo, hi])
      endpoint(chain.layers[index]!, 2 * chain.order);
    const source: IAutoMovieLoftSectionSource.ISource | null = original(chain);
    if (source !== null)
      for (const index of [lo, hi]) checkOriginal(chain, source, index);
    return source;
  }

  /**
   * Validate all layers at the boundary of an immutable chain reading. The
   * closure publishes the admitted original owner without comparing each
   * compatibility snapshot again when a bracket is read.
   */
  export function prepare(
    chain: IAutoMovieLoftChain,
  ): (lo: number, hi: number) => IAutoMovieLoftSectionSource.ISource | null {
    const source: IAutoMovieLoftSectionSource.ISource | null = original(chain);
    const invalid: ({ error: unknown } | null)[] = chain.layers.map(
      (
        layer: IAutoMovieLoftChain.ILayer,
        index: number,
      ): { error: unknown } | null => {
        try {
          endpoint(layer, 2 * chain.order);
          if (source !== null) checkOriginal(chain, source, index);
          return null;
        } catch (error: unknown) {
          return { error };
        }
      },
    );
    return (
      lo: number,
      hi: number,
    ): IAutoMovieLoftSectionSource.ISource | null => {
      for (const index of [lo, hi]) {
        const entry: { error: unknown } | null = invalid[index]!;
        if (entry !== null) throw entry.error;
      }
      return source;
    };
  }

  /** Validate the original source's shape independently of a layer bracket. */
  function original(
    chain: IAutoMovieLoftChain,
  ): IAutoMovieLoftSectionSource.ISource | null {
    const source: IAutoMovieLoftSectionSource.ISource | undefined =
      chain.nativeSource;
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
    return source;
  }

  /** Compare one principal row with the original snapshot at the same station. */
  function checkOriginal(
    chain: IAutoMovieLoftChain,
    source: IAutoMovieLoftSectionSource.ISource,
    index: number,
  ): void {
    const layer: IAutoMovieLoftChain.ILayer = chain.layers[index]!;
    if (layer.sectionSource !== undefined) return;
    const binding: IAutoMovieLoftSectionSourceBinding | null = find(
      source.rows,
      layer.y,
    );
    if (binding === null || !fits(layer, binding, 2 * chain.order))
      throw new Error(
        `Native compatibility rows of ${chain.name} at ${layer.y} were rewritten without re-expressing their source.`,
      );
  }

  /** Read a changed endpoint's explicit family or its genuine absence. */
  export function endpoint(
    layer: IAutoMovieLoftChain.ILayer,
    expectedWidth?: number,
  ): IAutoMovieLoftSectionSource.IEndpoint | null {
    const source: IAutoMovieLoftSectionSource.IEndpoint | undefined =
      layer.sectionSource;
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

  /** Attach actual oriented endpoint data to a newly transformed layer. */
  export function bind(
    layer: IAutoMovieLoftChain.ILayer,
    field: IAutoMovieLoftSectionSourceFamily,
  ): IAutoMovieLoftSectionSource.IEndpoint {
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
   * Presence/recorded availability of native physical2 at retained layer
   * boundaries.
   */
  export function regular(chain: IAutoMovieLoftChain): boolean {
    const source: IAutoMovieLoftSectionSource.ISource | undefined =
      chain.nativeSource;
    if (source === undefined) return true;
    if (
      source === null ||
      source.kind !== "view" ||
      !Array.isArray(source.rows)
    )
      throw new Error("The present native availability record is malformed.");
    return chain.layers.every(
      (layer: IAutoMovieLoftChain.ILayer, index: number): boolean =>
        layer.sectionSource !== undefined ||
        (source.rows[index]?.station === layer.y
          ? source.rows[index]!.unavailable === null
          : find(source.rows, layer.y)?.unavailable === null),
    );
  }
}

/**
 * Snapshot actual compatibility values; no missing physical jet is invented
 * here.
 */
function remember(
  layer: IAutoMovieLoftChain.ILayer,
  unavailable: string | null,
): IAutoMovieLoftSectionSourceBinding {
  return {
    station: layer.y,
    value: [...layer.coefficients],
    slope: [...layer.slopes],
    curvature: layer.curvatures === undefined ? null : [...layer.curvatures],
    unavailable,
  };
}

/**
 * Compare ordinary rows in their original getter order; every row must be dense
 * finite data at the same output width.
 */
function fits(
  layer: IAutoMovieLoftChain.ILayer,
  binding: IAutoMovieLoftSectionSourceBinding,
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
function find(
  rows: readonly IAutoMovieLoftSectionSourceBinding[],
  station: number,
): IAutoMovieLoftSectionSourceBinding | null {
  let low: number = 0;
  let high: number = rows.length;
  while (low < high) {
    const middle: number = (low + high) >> 1;
    if (rows[middle]!.station < station) low = middle + 1;
    else high = middle;
  }
  return rows[low]?.station === station ? rows[low]! : null;
}

/**
 * Whole phase functions require either eight native source2 inputs or complete
 * basis2 rows.
 */
function family(value: IAutoMovieLoftSectionSourceFamily): boolean {
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

/**
 * Native/basis family vectors require own finite numeric entries; sparse arrays
 * never become complete jets.
 */
function finiteRow(value: unknown, width: number): boolean {
  if (!Array.isArray(value) || value.length !== width) return false;
  for (let q: number = 0; q < width; q++)
    if (!Object.hasOwn(value, q) || !Number.isFinite(value[q])) return false;
  return true;
}

/**
 * Numeric rows and nested family tuples compare dense own entries in left/right
 * order. Matching array identity never skips admission. Optional undefined
 * record fields retain their existing absent-field meaning; unavailable
 * curvature remains null. First mismatch stops before later getters, while
 * reached getter failures propagate.
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
