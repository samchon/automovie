import { EVIDENCE_STAGES } from "./EVIDENCE_STAGES";
import { describeDeclarationValue } from "./describeDeclarationValue";

/**
 * Validate the explicit, closed stage map for the final audience-language pass.
 *
 * @evidence contracts/common.md#principled-implementation Admit an unknown object only when it has exactly one screenplays key with a supported lifecycle value.
 * @evidence contracts/common.md#clear-and-simple-design The independent revision map has one closed admission boundary before typed stage access.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null, arrays, omitted keys, additional keys and unsupported values are rejected uniformly.
 * @evidence contracts/common.md#meaningful-documentation Errors distinguish map shape from stage vocabulary; successful admission returns no transformed value.
 * @evidence contracts/performance.md#efficient-algorithms Object key enumeration is linear in supplied key count; supported-stage lookup has fixed size.
 * @evidence contracts/performance.md#reuse-equivalent-work The static lifecycle vocabulary is shared with declaration admission, without caching unknown objects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a temporary key array is allocated and no input object is retained.
 */
export function validateAutoMovieNaturalnessStages(value: unknown): void {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error(
      `Production evidence naturalness must be an explicit stage map; received ${describeDeclarationValue(value)}.`,
    );
  const keys: string[] = Object.keys(value);
  if (keys.length !== 1 || keys[0] !== "screenplays")
    throw new Error(
      "Production evidence naturalness must contain exactly the screenplays stage.",
    );
  const stage: unknown = (value as Record<string, unknown>).screenplays;
  if (!EVIDENCE_STAGES.includes(stage))
    throw new Error(
      `screenplayNaturalness has unsupported evidence stage ${describeDeclarationValue(stage)}.`,
    );
}
