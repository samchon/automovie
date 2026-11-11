import {
  type IAutoMovieLoftChain as Chain,
  AutoMovieLoftSectionSource as Source,
} from "@automovie/engine";

/** Numeric groups whose emitted rows and independent snapshots must remain finite, dense and width-compatible. */
type Field = "coefficients" | "slopes" | "curvatures";

/** Actual public validation of single sparse mutations and complete endpoint numeric-family admission, independent of private comparison implementation. */
export function ConstructionBindingDense(base: Chain): void {
  for (const index of [0, 1])
    for (const field of ["coefficients", "slopes", "curvatures"] as const) {
      const width: number = rows(base, index, field)[0].length;
      for (const position of [0, Math.floor(width / 2), width - 1])
        for (const side of ["left", "right", "both"] as const) {
          const chain: Chain = copy(base);
          const [left, right]: [number[], number[]] = rows(chain, index, field);
          if (side !== "right" && !Reflect.deleteProperty(left, position))
            throw new Error("Cannot prepare left-hole fixture");
          if (side !== "left" && !Reflect.deleteProperty(right, position))
            throw new Error("Cannot prepare right-hole fixture");
          refuse(chain);
        }
      for (const invalid of [
        undefined,
        null,
        false,
        "0",
        Infinity,
        -Infinity,
        [],
      ]) {
        const chain: Chain = copy(base);
        for (const row of rows(chain, index, field))
          Reflect.set(row, 0, invalid);
        refuse(chain);
      }
      for (const length of [0, 1, width - 1]) {
        const chain: Chain = copy(base);
        for (const row of rows(chain, index, field)) row.length = length;
        refuse(chain);
      }
      const aliased: Chain = copy(base);
      const aliasRow: number[] = rows(aliased, index, field)[0];
      const aliasBinding: NonNullable<Chain["nativeSource"]>["rows"][number] =
        aliased.nativeSource!.rows.find(
          (
            record: NonNullable<Chain["nativeSource"]>["rows"][number],
          ): boolean => record.station === aliased.layers[index]!.y,
        )!;
      const aliasKey: "value" | "slope" | "curvature" =
        field === "coefficients"
          ? "value"
          : field === "slopes"
            ? "slope"
            : "curvature";
      aliasBinding[aliasKey] = aliasRow;
      if (!Reflect.deleteProperty(aliasRow, 0))
        throw new Error("Cannot prepare aliased numeric hole");
      refuse(aliased);
      const inherited: Chain = copy(base);
      const left: number[] = rows(inherited, index, field)[0];
      const parent: object = Object.create(Array.prototype) as object;
      Object.defineProperty(parent, 0, { value: left[0], enumerable: true });
      if (!Reflect.deleteProperty(left, 0))
        throw new Error("Cannot prepare inherited fixture");
      Object.setPrototypeOf(left, parent);
      refuse(inherited);
    }
  endpoints(base);
}

/** Fresh numeric copies retain the actual immutable scalar owner and independent binding records. */
function copy(base: Chain): Chain {
  return {
    ...base,
    nativeSource: structuredClone(base.nativeSource),
    layers: base.layers.map(
      (row: Chain["layers"][number]): Chain["layers"][number] => ({
        ...row,
        coefficients: [...row.coefficients],
        slopes: [...row.slopes],
        ...(row.curvatures === undefined
          ? {}
          : { curvatures: [...row.curvatures] }),
      }),
    ),
  };
}

/** Select original numeric rows only; an absent fixture is a failure, never a fabricated zero row. */
function rows(chain: Chain, index: number, field: Field): [number[], number[]] {
  const layer: Chain["layers"][number] = chain.layers[index]!;
  const binding:
    | NonNullable<Chain["nativeSource"]>["rows"][number]
    | undefined = chain.nativeSource?.rows.find(
    (row: NonNullable<Chain["nativeSource"]>["rows"][number]): boolean =>
      row.station === layer.y,
  );
  const left: number[] | undefined = layer[field];
  const right: number[] | null | undefined =
    field === "coefficients"
      ? binding?.value
      : field === "slopes"
        ? binding?.slope
        : binding?.curvature;
  if (left === undefined || right === undefined || right === null)
    throw new Error("Incomplete original numeric fixture");
  return [left, right];
}

/** Malformed compatibility rows must fail by their public named ownership refusal. */
function refuse(chain: Chain): void {
  try {
    Source.validate(chain, 0, 1);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("rewritten")) return;
    throw error;
  }
  throw new Error("Sparse or nonnumeric compatibility rows were admitted");
}

/** Both endpoint snapshots and initial native/basis family factories reject incomplete numeric tuples, including identical array references. */
function endpoints(base: Chain): void {
  const field: Source.IEndpoint["field"] = {
    kind: "native",
    inputs: {
      extents: [
        [3, 0, 0],
        [2, 0, 0],
        [3, 0, 0],
        [2, 0, 0],
      ],
      shoulders: Array.from({ length: 4 }, (): [number, number, number] => [
        Math.SQRT2 - 1,
        0,
        0,
      ]),
    },
  };
  for (const both of [false, true]) {
    const layer: Chain["layers"][number] = copy(base).layers[0]!;
    const source: Source.IEndpoint = Source.bind(layer, field);
    if (source.field.kind !== "native" || source.snapshot.kind !== "native")
      throw new Error("Wrong family fixture");
    if (!Reflect.deleteProperty(source.field.inputs.extents[0], 1))
      throw new Error("Cannot prepare endpoint hole");
    if (both && !Reflect.deleteProperty(source.snapshot.inputs.extents[0], 1))
      throw new Error("Cannot prepare paired endpoint hole");
    layer.sectionSource = source;
    let refused: boolean = false;
    try {
      Source.endpoint(layer);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes("stale or malformed")
      )
        refused = true;
      else throw error;
    }
    if (!refused)
      throw new Error("An incomplete endpoint numeric tuple was admitted");
  }
  const malformed: typeof field = structuredClone(field);
  if (malformed.kind !== "native")
    throw new Error("Wrong malformed family fixture");
  if (!Reflect.deleteProperty(malformed.inputs.extents[0], 1))
    throw new Error("Cannot prepare original tuple hole");
  let refused: boolean = false;
  try {
    Source.bind(copy(base).layers[0]!, malformed);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("complete generating family")
    )
      refused = true;
    else throw error;
  }
  if (!refused)
    throw new Error("An incomplete original native family was bound");
  const basis: Source.IEndpoint["field"] = {
    kind: "basis",
    order: base.order,
    rows: [
      ...rows(base, 0, "coefficients").slice(0, 1),
      ...rows(base, 0, "slopes").slice(0, 1),
      ...rows(base, 0, "curvatures").slice(0, 1),
    ] as [number[], number[], number[]],
  };
  if (!Reflect.deleteProperty(basis.rows, 1))
    throw new Error("Cannot prepare basis row hole");
  refused = false;
  try {
    Source.bind(copy(base).layers[0]!, basis);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("complete generating family")
    )
      refused = true;
    else throw error;
  }
  if (!refused)
    throw new Error("An incomplete original basis matrix was bound");
  const wrongWidth: Chain = copy(base);
  const layer: Chain["layers"][number] = wrongWidth.layers[0]!;
  layer.coefficients.length -= 2;
  layer.slopes.length -= 2;
  if (layer.curvatures !== undefined) layer.curvatures.length -= 2;
  layer.sectionSource = Source.bind(layer, field);
  refused = false;
  try {
    Source.validate(wrongWidth, 0, 1);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("stale or malformed"))
      refused = true;
    else throw error;
  }
  if (!refused)
    throw new Error(
      "An endpoint binding at the wrong chain output width was admitted",
    );
}
