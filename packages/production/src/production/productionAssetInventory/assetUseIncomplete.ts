import { IAutoMovieAssetProvenance } from "@automovie/interface";

/**
 * Recognize a blank production, consumer id or reason in a declared asset use.
 *
 * @evidence contracts/common.md#principled-implementation Trimmed nonemptiness checks the three required text roles without rewriting their accepted spelling.
 * @evidence contracts/common.md#clear-and-simple-design Ledger provenance admission owns these text obligations while consumer existence and reverse bindings stay with their actual graph/compiled gates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonblank labels do not prove the consumer exists or justify the reason's semantics; those checks are separate.
 * @evidence contracts/common.md#meaningful-documentation Documents the boolean incomplete meaning and preservation of supplied text.
 * @evidence contracts/performance.md#efficient-algorithms Three trims scan/allocate according to supplied text lengths; no asset bytes are read.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No prior label result is cached across distinct uses.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The boolean retains no use, string history or external resource.
 *
 * @author Samchon
 */
export function assetUseIncomplete(
  use: IAutoMovieAssetProvenance["uses"][number],
): boolean { return use.production.trim().length === 0 ||
  use.consumer.id.trim().length === 0 ||
  use.reason.trim().length === 0; }
