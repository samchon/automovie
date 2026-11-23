import type { IAutoMovieModelPart } from "@automovie/interface";

/** The array allocation rule for the native part map. */
const MAP: typeof Array.prototype.map = Array.prototype.map;
const SPECIES: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
  Array,
  Symbol.species,
);

type Parts = readonly IAutoMovieModelPart[];

/** One receipt contains identity only, never references to parts or models. */
interface IReceipt {
  readonly token: object;
  readonly stage: "requested" | "allocated" | "normalized" | "builder";
}
const RECEIPTS: WeakMap<object, IReceipt> = new WeakMap();
let observing: number = 0;

/** Physical part allocation provenance for the private native copy path. */
export namespace ArchetypePartOwnership {
  /** Observe the part allocation during one native construction. */
  export function observe<T extends { readonly parts: Parts }>(
    input: Parts,
    construct: () => T,
    report: (native: boolean) => void,
  ): T {
    const previous: IReceipt | undefined = RECEIPTS.get(input);
    const token: object = {};
    RECEIPTS.set(input, { token, stage: "requested" });
    ++observing;
    try {
      const model: T = construct();
      const found: IReceipt | undefined = RECEIPTS.get(model.parts);
      report(found?.stage === "normalized" && found.token === token);
      return model;
    } finally {
      --observing;
      if (previous === undefined) RECEIPTS.delete(input);
      else RECEIPTS.set(input, previous);
    }
  }

  /** Keep the original public builder identity without retaining its data. */
  export function remember(model: { readonly parts: Parts }): void {
    const receipt: IReceipt = { token: {}, stage: "builder" };
    RECEIPTS.set(model, receipt);
    RECEIPTS.set(model.parts, receipt);
  }

  /** Admit only a genuine builder and its original still-ordinary array. */
  export function owns(model: object, parts: Parts): boolean {
    const found: IReceipt | undefined = RECEIPTS.get(model);
    return (
      found?.stage === "builder" &&
      RECEIPTS.get(parts) === found &&
      ordinary(parts)
    );
  }

  /** Admit the input at the original native part map. */
  export function beforeMap(input: Parts): object | undefined {
    if (!active()) return undefined;
    const found: IReceipt | undefined = RECEIPTS.get(input);
    return found?.stage === "requested" && ordinary(input)
      ? found.token
      : undefined;
  }

  /** Certify the array emitted by the native part map. */
  export function afterMap(token: object | undefined, output: Parts): void {
    if (token !== undefined)
      RECEIPTS.set(output, { token, stage: "allocated" });
  }

  /** Certify only the unchanged allocation from the full native normalizers. */
  export function afterNormalization(
    input: Parts,
    articulated: Parts,
    output: Parts,
  ): void {
    if (output !== articulated) return;
    const found: IReceipt | undefined = RECEIPTS.get(input);
    const emitted: IReceipt | undefined = RECEIPTS.get(output);
    if (
      found?.stage === "requested" &&
      emitted?.stage === "allocated" &&
      emitted.token === found.token
    )
      RECEIPTS.set(output, { token: found.token, stage: "normalized" });
  }

  /**
   * Test whether a synchronous constructor currently requests an allocation
   * proof.
   */
  export function active(): boolean {
    return observing !== 0;
  }

  /** Native Array.map must select the intrinsic ordinary-array allocator. */
  function ordinary(array: Parts): boolean {
    const species: PropertyDescriptor | undefined =
      Object.getOwnPropertyDescriptor(Array, Symbol.species);
    return (
      Object.getPrototypeOf(array) === Array.prototype &&
      !Object.hasOwn(array, "map") &&
      !Object.hasOwn(array, "constructor") &&
      Object.getOwnPropertyDescriptor(Array.prototype, "map")?.value === MAP &&
      Object.getOwnPropertyDescriptor(Array.prototype, "constructor")?.value ===
        Array &&
      species?.get === SPECIES?.get &&
      species?.value === SPECIES?.value
    );
  }
}
