import { IAutoMovieSemanticMask } from "@automovie/interface";

import { AutoMovieSemanticMaskVerificationError } from "./AutoMovieSemanticMaskVerificationError";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { digestAutoMovieSemanticMask } from "./digestAutoMovieSemanticMask";

/** Current full-payload semantic-mask format. */
const SEMANTIC_MASK_VERSION: number = 2;

/** Domain separator for the current full-payload semantic-mask format. */
const SEMANTIC_MASK_PROTOCOL: string = "automovie.semantic-mask.v2";

/**
 * Refuse a historical, foreign, or self-inconsistent semantic mask.
 *
 * This verifies current format identity and the complete canonical payload
 * digest. Semantic graph validity remains the derivation owner's concern, so a
 * consumer cannot accidentally reinterpret a v1 sidecar as current v2 evidence.
 *
 * @evidence contracts/common.md#principled-implementation Require explicit current version/protocol, exact record key sets and collection/member container shapes, then recompute the complete canonical payload digest; historical format, invalid shape and mismatch have distinct typed refusals.
 * @evidence contracts/common.md#clear-and-simple-design Runtime schema admission precedes projection so unknown/missing fields cannot disappear into a valid-looking hash; scalar value/semantic graph validity remains the derivation/caller responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A recomputed digest cannot authorize extra fields or wrong containers, and historical masks are not normalized into v2. This guard does not rederive FNV colors or prove owner links merely from a hash.
 * @evidence contracts/common.md#meaningful-documentation Docs state current identity, complete payload and the structural versus graph/value boundary; all failures use the canonical error class for receipt classification.
 * @evidence contracts/performance.md#efficient-algorithms Record-key/container checks scan E entries and G gaps, then canonical sorting/SHA consumes payload bytes B; temporary storage includes sorted keys, projected records and hash bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work The verifier reuses canonical payload and digest owners; mutable supplied masks are rehashed on each evidence admission instead of trusting cached identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Verification retains no mask or bytes after success/failure; the catcher owns errors, and no pixel buffer, renderer resource or task is opened.
 */
export const verifyAutoMovieSemanticMask: (
  mask: IAutoMovieSemanticMask,
) => void = (mask: IAutoMovieSemanticMask): void => {
  const record: Record<string, unknown> = semanticMaskRecord(mask, "mask");
  if (
    Object.hasOwn(record, "version") === false ||
    Object.hasOwn(record, "protocol") === false
  )
    invalidSemanticMask(
      "semantic mask requires explicit version and protocol fields",
    );
  const version: number = mask.version as number;
  const protocol: string = mask.protocol as string;
  if (version !== SEMANTIC_MASK_VERSION || protocol !== SEMANTIC_MASK_PROTOCOL)
    throw new AutoMovieSemanticMaskVerificationError(
      "unsupported",
      `unsupported semantic mask ${String(version)}/${protocol}; expected ${SEMANTIC_MASK_VERSION}/${SEMANTIC_MASK_PROTOCOL}`,
    );
  verifySemanticMaskSchema(record);
  const expected: string = digestAutoMovieSemanticMask(mask);
  if (mask.digest !== expected)
    throw new AutoMovieSemanticMaskVerificationError(
      "digest-mismatch",
      `semantic mask digest mismatch: declared ${mask.digest}, canonical ${expected}`,
    );
};

/** Refuse unknown or missing fields before canonical projection can erase them. */
const verifySemanticMaskSchema: (mask: Record<string, unknown>) => void = (
  mask: Record<string, unknown>,
): void => {
  exactSemanticMaskKeys(
    mask,
    ["version", "protocol", "background", "entries", "unaddressed", "digest"],
    "mask",
  );
  const entries: unknown[] = semanticMaskArray(mask.entries, "entries");
  const unaddressed: unknown[] = semanticMaskArray(
    mask.unaddressed,
    "unaddressed gaps",
  );
  for (const [index, value] of entries.entries()) {
    const entry: Record<string, unknown> = semanticMaskRecord(
      value,
      `entry ${index}`,
    );
    exactSemanticMaskKeys(
      entry,
      ["id", "kind", "label", "color", "owner", "nodes", "slot"],
      `entry ${index}`,
    );
    if (!Array.isArray(entry.nodes))
      invalidSemanticMask(
        `semantic mask entry ${index} nodes must be an array`,
      );
    if (entry.slot !== null)
      exactSemanticMaskKeys(
        semanticMaskRecord(entry.slot, `entry ${index} slot`),
        ["instanceSet", "index"],
        `entry ${index} slot`,
      );
  }
  for (const [index, value] of unaddressed.entries())
    exactSemanticMaskKeys(
      semanticMaskRecord(value, `gap ${index}`),
      ["instanceSet", "slots", "reason", "remedy"],
      `gap ${index}`,
    );
};

/** Read one runtime semantic collection without letting a cast erase shape. */
const semanticMaskArray: (value: unknown, name: string) => unknown[] = (
  value: unknown,
  name: string,
): unknown[] => {
  if (!Array.isArray(value))
    invalidSemanticMask(`semantic mask ${name} must be an array`);
  return value as unknown[];
};

/** Read one runtime semantic value as an exact record. */
const semanticMaskRecord: (
  value: unknown,
  name: string,
) => Record<string, unknown> = (
  value: unknown,
  name: string,
): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    invalidSemanticMask(`semantic mask ${name} must be an object`);
  return value as Record<string, unknown>;
};

/** Compare one semantic record's complete key set without normalizing it. */
const exactSemanticMaskKeys: (
  value: Record<string, unknown>,
  expected: readonly string[],
  name: string,
) => void = (
  value: Record<string, unknown>,
  expected: readonly string[],
  name: string,
): void => {
  const actual: string[] = Object.keys(value).sort(compareAutoMovieRenderIds);
  const canonical: string[] = [...expected].sort(compareAutoMovieRenderIds);
  if (
    actual.length !== canonical.length ||
    actual.some(
      (key: string, index: number): boolean => key !== canonical[index],
    )
  )
    invalidSemanticMask(
      `semantic mask ${name} keys are invalid; expected ${canonical.join(", ")}`,
    );
};

/** Raise one typed current-schema refusal. */
const invalidSemanticMask: (message: string) => never = (
  message: string,
): never => {
  throw new AutoMovieSemanticMaskVerificationError("invalid", message);
};
