import {
  AutoMovieLoftChain,
  AutoMovieLoftSectionSource,
  AutoMovieViewAxis,
  AutoMovieViewLoft,
  type IAutoMovieLoftChain,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { ConstructionBindingDense } from "../../internal/construction/ConstructionBindingDense";
import { nclose } from "../../internal/nclose";

/** Actual public chain, including its explicit original-source binding. */
type Chain = IAutoMovieLoftChain;
/** Compatibility groups checked for each selected principal row. */
type Field = "coefficients" | "slopes" | "curvatures";
/** The required comparison order, independent of coefficient count. */
const FIELDS: readonly Field[] = ["coefficients", "slopes", "curvatures"];

/**
 * Native source ownership keeps its public results while comparing numeric leaves directly.
 *
 * Scenarios:
 * 1. Actual constant ellipse producers at orders 8, 32 and 128 retain cold-copy
 *    ownership and the independent axis/diagonal ray intersections.
 * 2. First/middle/last rewrites of every compatibility group fail by name;
 *    NaN, unequal empty/short rows and right-side missing entries fail too.
 * 3. Signed zero, optional curvature absence, nested endpoint copies and
 *    undefined optional metadata preserve their declared equality meanings.
 * 4. Query-owned getters observe complete ordered reads, first-mismatch
 *    short circuit and original thrown-error identity without foreign patches.
 * 5. Caller-owned numeric getters count actual compatibility-leaf reads for
 *    both selected rows at all three orders. Ordered complete comparison
 *    visits each left/right leaf once; pure internal arithmetic cost remains
 *    a static review obligation, not a measured wall-time or complexity proof.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Exercises real ViewLoft chains through Source.validate/endpoint and LoftChain.point, including changed-copy rejection, independent ellipse values and observable ordered numeric getter effects. Does not expose or replace the private comparator.
 * @evidence contracts/development/testing.md#independent-expectations The ellipse x*x/9+z*z/4=1 intersects the axis rays at (3,0)/(0,2) and the diagonal at (6/sqrt(13),6/sqrt(13)). Ownership changes must fail; IEEE strict equality equates signed zeros and rejects NaN. Two selected rows have three binding groups each. One complete ordered comparison reads each supplied numeric pair once on either side, so the public getter budget is twice the actual pair count regardless of helper names or source layout. Getter effects are not a geometric oracle or a bound on unobserved internal arithmetic.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers three supported orders, cold identities, all group/row/position mutations, null-like optional absence, malformed lengths/NaN/right holes, nested endpoint snapshots and getter failure/short circuit. Single left/right/both holes at first/middle/last positions, same-reference tuples, invalid numeric leaves, inherited entries and paired wrong lengths are refused without a separate stale value. Native/basis endpoint factories reject sparse tuples and rows. Existing phase/conic tests own general source2 and continuation geometry.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable synchronous Node CPU question owns synthetic public producers and its own numeric array accessors. It opens no observer session, person, process, browser or GPU and replaces no producer method. Observable reads do not certify unobserved arithmetic cost; source-level complexity remains a separate static obligation.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Actual constant ellipse producers at orders 8, 32 and 128 retain cold-copy).
 */
export function test_construction_source_binding_equality(): void {
  const failures: string[] = [];
  const chains: Chain[] = [];
  for (const order of [8, 32, 128]) {
    check(
      "producer " + order,
      (): void => {
        const chain: Chain = made(order);
        chains.push(chain);
        equivalent(chain);
        mutations(chain);
        ConstructionBindingDense(chain);
      },
      failures,
    );
  }
  if (chains.length !== 0) {
    check("accessor order", (): void => accesses(chains[0]!), failures);
    check("endpoint copies", (): void => endpoints(chains[0]!), failures);
    check(
      "public numeric reads",
      (): void => {
        const readings: {
          order: number;
          pairs: number;
          reads: number;
          allowed: number;
        }[] = work(chains);
        console.log({
          sourceBindingNumericReads: readings,
          scope:
            "observable ordered leaf access only; internal arithmetic complexity remains a static review obligation",
        });
        for (const reading of readings)
          if (reading.reads !== reading.allowed)
            failures.push(
              "order " +
                reading.order +
                ": " +
                reading.reads +
                " observed numeric reads differ from " +
                reading.allowed +
                " ordered left/right leaf reads for " +
                reading.pairs +
                " pairs",
            );
      },
      failures,
    );
  }
  TestValidator.predicate(
    failures.join("\n"),
    (): boolean => failures.length === 0,
  );
}

/** Collect every owned scenario before reporting the complete question. */
function check(name: string, job: () => void, failures: string[]): void {
  try {
    job();
  } catch (error: unknown) {
    failures.push(name + ": " + detail(error));
  }
}

/** Preserve a thrown value's useful original description. */
function detail(error: unknown): string {
  return error instanceof Error
    ? (error.stack ?? error.message)
    : String(error);
}

/** Build an admitted ellipse with real source retention and ordinary horizontal frames. */
function made(order: number): Chain {
  const outline: (value: number) => IAutoMovieViewPart.IOutline = (
    value: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: [
      { site: "a", station: 0, value },
      { site: "b", station: 1, value },
    ],
  });
  const result: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create({
    name: "binding.ellipse",
    axis: AutoMovieViewAxis.horizontal(),
    stations: [0, 1],
    front: { positive: outline(3), negative: outline(-3) },
    side: { positive: outline(2), negative: outline(-2) },
    fullness: { kind: "shoulder", shoulder: outline(Math.SQRT2 - 1) },
    order,
    samples: 32,
  });
  if (result.chain === null || result.chain.nativeSource === undefined)
    throw new Error(JSON.stringify(result.diagnostics));
  return result.chain;
}

/** Copy numerical ownership while preserving the separately owned callable frame source. */
function copied(chain: Chain): Chain {
  return {
    ...chain,
    nativeSource: structuredClone(chain.nativeSource),
    layers: chain.layers.map(
      (layer: Chain["layers"][number]): Chain["layers"][number] => ({
        ...layer,
        coefficients: [...layer.coefficients],
        slopes: [...layer.slopes],
        ...(layer.curvatures === undefined
          ? {}
          : { curvatures: [...layer.curvatures] }),
      }),
    ),
  };
}

/** Select one complete actual row, never fabricate missing compatibility values. */
function row(chain: Chain, index: number, field: Field): number[] {
  const value: number[] | undefined = chain.layers[index]![field];
  if (value === undefined)
    throw new Error("The admitted fixture omitted " + field);
  return value;
}

/** Locate the producer's independent snapshot for the selected layer. */
function binding(chain: Chain, index: number, field: Field): number[] {
  const record: NonNullable<Chain["nativeSource"]>["rows"][number] | undefined =
    chain.nativeSource?.rows.find(
      (entry: NonNullable<Chain["nativeSource"]>["rows"][number]): boolean =>
        entry.station === chain.layers[index]!.y,
    );
  const value: number[] | null | undefined =
    field === "coefficients"
      ? record?.value
      : field === "slopes"
        ? record?.slope
        : record?.curvature;
  if (value === undefined || value === null)
    throw new Error("The admitted fixture omitted a binding " + field);
  return value;
}

/** Cold public values follow the implicit ellipse, independently of the private equality code. */
function equivalent(base: Chain): void {
  const chain: Chain = copied(base);
  if (AutoMovieLoftSectionSource.validate(chain, 0, 1) !== chain.nativeSource)
    throw new Error("Cold equal-value source was not retained");
  const diagonal: number = 6 / Math.sqrt(13);
  for (const [phi, x, z] of [
    [0, 3, 0],
    [Math.PI / 4, diagonal, diagonal],
    [Math.PI / 2, 0, 2],
  ]) {
    const point: [number, number, number] = AutoMovieLoftChain.point(
      chain,
      0.375,
      phi!,
    );
    const expected: number[] = [x!, 0.375, z!];
    if (
      !point.every((value: number, index: number): boolean =>
        nclose(value, expected[index]!, 1e-10),
      )
    )
      throw new Error("The independent ellipse ray intersection changed");
  }
  chain.layers[0]!.slopes[0] = -0;
  binding(chain, 0, "slopes")[0] = 0;
  AutoMovieLoftSectionSource.validate(chain, 0, 1);
  delete chain.layers[0]!.curvatures;
  const retained: Chain = AutoMovieLoftSectionSource.retain(
    chain,
    chain.nativeSource!.data,
  );
  AutoMovieLoftSectionSource.validate(retained, 0, 1);
}

/** A malformed or changed copy cannot silently choose original or legacy geometry. */
function refused(chain: Chain): void {
  try {
    AutoMovieLoftSectionSource.validate(chain, 0, 1);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("rewritten")) return;
    throw error;
  }
  throw new Error("Changed compatibility rows were admitted");
}

/** Test every numeric group and both selected rows, including comparison short circuits. */
function mutations(base: Chain): void {
  for (const index of [0, 1])
    for (const field of FIELDS) {
      const width: number = row(base, index, field).length;
      for (const position of [0, Math.floor(width / 2), width - 1]) {
        const chain: Chain = copied(base);
        row(chain, index, field)[position]! += 1;
        refused(chain);
      }
      for (const length of [0, 1, width - 1]) {
        const chain: Chain = copied(base);
        row(chain, index, field).length = length;
        refused(chain);
      }
      const nan: Chain = copied(base);
      row(nan, index, field)[0] = NaN;
      binding(nan, index, field)[0] = NaN;
      refused(nan);
      const missing: Chain = copied(base);
      if (!Reflect.deleteProperty(binding(missing, index, field), "0"))
        throw new Error(
          "The missing-entry fixture could not remove its own property",
        );
      refused(missing);
    }
}

/** Query-owned accessors preserve the existing left/right order and original failures. */
function accesses(base: Chain): void {
  const chain: Chain = copied(base);
  const trace: string[] = [];
  const expected: string[] = [];
  for (const index of [0, 1])
    for (const field of FIELDS) {
      const left: number[] = row(chain, index, field);
      const right: number[] = binding(chain, index, field);
      for (let q: number = 0; q < left.length; q++) {
        const a: number = left[q]!;
        const b: number = right[q]!;
        const label: string = `${index}/${field}/${q}`;
        expected.push("left " + label, "right " + label);
        Object.defineProperty(left, q, {
          configurable: true,
          enumerable: true,
          get: (): number => {
            trace.push("left " + label);
            return a;
          },
        });
        Object.defineProperty(right, q, {
          configurable: true,
          enumerable: true,
          get: (): number => {
            trace.push("right " + label);
            return b;
          },
        });
      }
    }
  AutoMovieLoftSectionSource.validate(chain, 0, 1);
  if (
    trace.length !== expected.length ||
    trace.some(
      (value: string, index: number): boolean => value !== expected[index],
    )
  )
    throw new Error("Compatibility getters changed evaluation order");
  const marker: Error = new Error("owned binding getter");
  const throwing: Chain = copied(base);
  Object.defineProperty(binding(throwing, 0, "coefficients"), 1, {
    get: (): never => {
      throw marker;
    },
  });
  let caught: unknown;
  try {
    AutoMovieLoftSectionSource.validate(throwing, 0, 1);
  } catch (error: unknown) {
    caught = error;
  }
  if (caught !== marker)
    throw new Error("A getter's original failure was replaced");
  const early: Chain = copied(base);
  row(early, 0, "coefficients")[0]! += 1;
  Object.defineProperty(binding(early, 0, "coefficients"), 1, {
    get: (): never => {
      throw marker;
    },
  });
  refused(early);
  const sparse: Chain = copied(base);
  if (!Reflect.deleteProperty(row(sparse, 0, "coefficients"), "1"))
    throw new Error("The sparse fixture could not remove its own property");
  row(sparse, 0, "coefficients")[row(sparse, 0, "coefficients").length - 1]! +=
    1;
  Object.defineProperty(binding(sparse, 0, "coefficients"), 1, {
    get: (): never => {
      throw marker;
    },
  });
  refused(sparse);
}

/** Nested native endpoint snapshots preserve value-copy and optional-field equality. */
function endpoints(base: Chain): void {
  const layer: Chain["layers"][number] = copied(base).layers[0]!;
  const field: AutoMovieLoftSectionSource.IEndpoint["field"] = {
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
  layer.sectionSource = structuredClone(
    AutoMovieLoftSectionSource.bind(layer, field),
  );
  Object.assign(layer.sectionSource.field, { optional: undefined });
  if (AutoMovieLoftSectionSource.endpoint(layer) !== layer.sectionSource)
    throw new Error(
      "A cold endpoint or undefined optional field changed ownership",
    );
  if (layer.sectionSource.field.kind !== "native")
    throw new Error("The fixture lost its native family");
  (layer.sectionSource.field.inputs.extents[0] as [number, number, number])[1] =
    1;
  try {
    AutoMovieLoftSectionSource.endpoint(layer);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("stale or malformed"))
      return;
    throw error;
  }
  throw new Error("A changed nested endpoint snapshot was admitted");
}

/** Count only effects on the caller's actual numeric rows; no implementation function name, URL or private instrumentation supplies an expectation. */
function work(
  chains: readonly Chain[],
): { order: number; pairs: number; reads: number; allowed: number }[] {
  return chains.map(
    (
      base: Chain,
    ): { order: number; pairs: number; reads: number; allowed: number } => {
      const chain: Chain = copied(base);
      let pairs: number = 0;
      let reads: number = 0;
      for (const index of [0, 1])
        for (const field of FIELDS) {
          const left: number[] = row(chain, index, field);
          const right: number[] = binding(chain, index, field);
          if (left.length !== right.length)
            throw new Error("Original binding widths disagree");
          pairs += left.length;
          for (const values of [left, right])
            for (let k: number = 0; k < values.length; k++) {
              const value: number = values[k]!;
              Object.defineProperty(values, k, {
                configurable: true,
                enumerable: true,
                get: (): number => {
                  reads++;
                  return value;
                },
              });
            }
        }
      AutoMovieLoftSectionSource.validate(chain, 0, 1);
      return { order: chain.order, pairs, reads, allowed: 2 * pairs };
    },
  );
}
