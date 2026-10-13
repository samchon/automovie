import type { IGenerateAutoMovieDerivedArtifactProps } from "./IGenerateAutoMovieDerivedArtifactProps";
import { AutoMovieDerivedArtifactGenerationError } from "./AutoMovieDerivedArtifactGenerationError";
import { derivedArtifactErrorMessage } from "./derivedArtifactErrorMessage";

/**
 * A frozen null-prototype input dictionary contains fresh byte copies; synchronous Uint8Array output is copied before return, and callback throws become generator-failed.
 *
 * @evidence contracts/common.md#principled-implementation A frozen null-prototype input dictionary contains fresh byte copies; synchronous Uint8Array output is copied before return, and callback throws become generator-failed.
 * @evidence contracts/common.md#clear-and-simple-design Generation uses this boundary twice to isolate each supplied operand and retain detached outputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Dictionary freeze does not freeze typed-array elements or independently captured callback references; no asynchronous result or sandbox is accepted.
 * @evidence contracts/common.md#meaningful-documentation States input-copy isolation, output-copy ownership and typed output/callback refusals.
 * @evidence contracts/performance.md#efficient-algorithms Copies B input bytes and O output bytes plus I dictionary entries, then includes the callback's unknown cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh copies are intentional for each repeatability sample, so sharing a mutable operand would change the checked contract.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local copied operands become unreachable after the callback; detached output transfers to the caller, while callback-owned captures and side effects remain outside this owner's cleanup.
 */
export const derivedArtifactInvokeGenerator: (generate: IGenerateAutoMovieDerivedArtifactProps["generate"], inputs: Readonly<Record<string, Uint8Array>>) => Uint8Array = (generate: IGenerateAutoMovieDerivedArtifactProps["generate"], inputs: Readonly<Record<string, Uint8Array>>): Uint8Array => {
    const copied: Record<string, Uint8Array> = Object.create(null) as Record<string, Uint8Array>;
    for (const [input, bytes] of Object.entries(inputs))
        Object.defineProperty(copied, input, {
            enumerable: true,
            value: new Uint8Array(bytes),
        });
    let output: unknown;
    try {
        output = generate(Object.freeze(copied));
    }
    catch (error) {
        throw new AutoMovieDerivedArtifactGenerationError("generator-failed", `Derived artifact generator failed: ${derivedArtifactErrorMessage(error)}`, { cause: error });
    }
    if (output instanceof Uint8Array === false)
        throw new AutoMovieDerivedArtifactGenerationError("output-malformed", "Derived artifact generator must return one synchronous Uint8Array.");
    return new Uint8Array(output);
};
