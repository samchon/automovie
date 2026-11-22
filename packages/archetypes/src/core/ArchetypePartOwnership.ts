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

/**
 * Physical part allocation provenance for the private native copy path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes constructor-local observation from long-lived original allocation identity.
 * @evidence contracts/development/design.md#principled-representation Real allocation and normalizer dispatch establish ownership of part records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the native constructor and private neutral snapshot preparation use these receipts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Weak associations retain no array, model, pose or recipe value.
 */
export namespace ArchetypePartOwnership {
  /**
   * Observe the part allocation during one native construction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States owned input and synchronous output admission.
   * @evidence contracts/development/implementation.md#principled-implementation Both native map allocation and normalizer completion must attest the exact returned parts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Open one token, call the constructor once and restore the prior scope.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Constructor errors and original opaque effects propagate without replay.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant weak metadata work beyond the original construction.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing normalizers notify the allocation instead of rebuilding any part.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only weak token associations survive, including when the constructor throws.
   */
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

  /**
   * Keep the original public builder identity without retaining its data.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The certified builder result and its original array identify each other.
   * @evidence contracts/development/implementation.md#principled-implementation A shared bare token connects two weak keys after constructor observation succeeded.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two insertions.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No structure or name can substitute for the authorized model.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant metadata work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Part preparation can use the prior production allocation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Replacing the public array cannot keep the old one alive.
   */
  export function remember(model: { readonly parts: Parts }): void {
    const receipt: IReceipt = { token: {}, stage: "builder" };
    RECEIPTS.set(model, receipt);
    RECEIPTS.set(model.parts, receipt);
  }

  /**
   * Admit only a genuine builder and its original still-ordinary array.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States original model and current array identity admission.
   * @evidence contracts/development/implementation.md#principled-implementation Confirm matching weak keys before inspecting known ordinary array descriptors.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One token comparison, then original map allocation checks.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An opaque proxy or replacement array incurs no new descriptor observations.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time and space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the allocation proof.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a decision and retains no query resources.
   */
  export function owns(model: object, parts: Parts): boolean {
    const found: IReceipt | undefined = RECEIPTS.get(model);
    return (
      found?.stage === "builder" &&
      RECEIPTS.get(parts) === found &&
      ordinary(parts)
    );
  }

  /**
   * Admit the input at the original native part map.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The input array supplies a current authorized map ticket.
   * @evidence contracts/development/implementation.md#principled-implementation Only a known input with native ordinary species dispatch can allocate the certified output.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scope lookup followed by native descriptor checks.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No descriptor checks on unregistered receivers.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant proof work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The existing part map is the exact allocation to observe.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the synchronous owner uses the token.
   */
  export function beforeMap(input: Parts): object | undefined {
    if (!active()) return undefined;
    const found: IReceipt | undefined = RECEIPTS.get(input);
    return found?.stage === "requested" && ordinary(input)
      ? found.token
      : undefined;
  }

  /**
   * Certify the array emitted by the native part map.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The token names the current original map, and output is its real result.
   * @evidence contracts/development/implementation.md#principled-implementation Associates the map's native allocation with its active proof only.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Optional single weak entry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An ordinary call with no proof retains nothing.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time and space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the original emitted part array.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak keys retain no allocated data.
   */
  export function afterMap(token: object | undefined, output: Parts): void {
    if (token !== undefined)
      RECEIPTS.set(output, { token, stage: "allocated" });
  }

  /**
   * Certify only the unchanged allocation from the full native normalizers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the original input, articulation array and original span result.
   * @evidence contracts/development/implementation.md#principled-implementation Scope, native map and the final output must match, leaving a rebuilt or opaque array in the ordinary path.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two identity checks and one optional weak record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not infer allocation from object shape or assume span rebuilding preserves part ownership.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant metadata cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Validates the constructor's existing final array without a second pass.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Records only weak allocation identity, never model data.
   */
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
   * Test whether a synchronous constructor currently requests an allocation proof.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Separates the active preparation scope from ordinary model construction.
   * @evidence contracts/development/implementation.md#principled-implementation Count only the active native construction calls under observation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One numeric comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts This gate alone never admits any constructor or output.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time and space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Ordinary calls avoid provenance dispatch entirely.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources An integer retains no caller or model data.
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
