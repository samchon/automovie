import type { AutoMovieDerivedArtifactEncoding } from "@automovie/interface";

/**
 * Physical root, generator path, declared inputs, derived output, encoding and synchronous callback specify the owned generation attempt.
 *
 * @evidence contracts/common.md#principled-implementation Physical root, generator path, declared inputs, derived output, encoding and synchronous callback specify the owned generation attempt.
 * @evidence contracts/common.md#clear-and-simple-design generateAutoMovieDerivedArtifact owns path/basis/publication admission around the callback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Declared inputs do not prove complete dependency accounting; callback captures can hold independent mutable state or effects.
 * @evidence contracts/common.md#meaningful-documentation Documents callback invocation/isolation contract and canonical path/encoding responsibilities.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased operand shape performs no generation; generateAutoMovieDerivedArtifact owns path checks, copied callback runs, basis validation and publication.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape coordinates no shared callback work; generation intentionally invokes the supplied operation against fresh independent byte copies.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no lock or callback capture; generation releases its token and temporary descriptors, while the callback owner manages its own captures/resources.
 * @author Samchon
 */
export interface IGenerateAutoMovieDerivedArtifactProps {

    /**
     * Physical project root the operation admits; path text alone is not a root identity lease.
     */
    root: string;

    /**
     * Canonical declared generator path whose normalized source identity belongs to the basis.
     */
    generator: string;

    /**
     * Canonical declared dependency paths; the generator owns ordering and case-collision admission.
     */
    inputs: readonly string[];

    /**
     * Canonical output path below the owned derived namespace.
     */
    output: string;

    /**
     * utf8 requires fatal scalar decoding; base64 admits arbitrary exact bytes.
     */
    encoding: AutoMovieDerivedArtifactEncoding;

    /**
     * Caller-supplied operation whose effects and cleanup remain with its implementing owner.
     *
     * @evidence contracts/common.md#principled-implementation A synchronous callback consumes a frozen dictionary of fresh declared-input byte copies and must return Uint8Array.
     * @evidence contracts/common.md#clear-and-simple-design The generation owner invokes it twice before basis recheck and sequential publication.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Operand isolation does not isolate independently captured references or callback side effects; repeat output equality is a sample rather than a determinism proof.
     * @evidence contracts/common.md#meaningful-documentation States synchronous result, twice-invoked contract and copied operand ownership.
     * @evidence contracts/performance.md#efficient-algorithms Callback computation is caller-defined and unbounded; owning generation includes both runs and input/output copying.
     * @evidence contracts/performance.md#reuse-equivalent-work Fresh operands are intentional for each run, so mutable callback work is not shared as an equivalent completed result.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The callback owns its captures/resources; generation retains only copied results and does not cancel or clean independently started tasks.
     */
    generate: (inputs: Readonly<Record<string, Uint8Array>>) => Uint8Array;
}
