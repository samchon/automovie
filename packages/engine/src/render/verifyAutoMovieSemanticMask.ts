import { IAutoMovieSemanticMask } from "@automovie/interface";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { digestAutoMovieSemanticMask } from "./digestAutoMovieSemanticMask";

/** Current full-payload semantic-mask format. */
const SEMANTIC_MASK_VERSION = 2;

/** Domain separator for the current full-payload semantic-mask format. */
const SEMANTIC_MASK_PROTOCOL = "automovie.semantic-mask.v2";

/** A typed internal refusal carried across the verifier boundary. */
class AutoMovieSemanticMaskVerificationError extends Error {
  public constructor(
    public readonly reason: "unsupported" | "invalid" | "digest-mismatch",
    message: string,
  ) {
    super(message);
  }
}

/**
 * Refuse a historical, foreign, or self-inconsistent semantic mask.
 *
 * This verifies current format identity and the complete canonical payload
 * digest. Semantic graph validity remains the derivation owner's concern, so a
 * consumer cannot accidentally reinterpret a v1 sidecar as current v2 evidence.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Refuses an identity sidecar whose declared identity does not seal the mapping used to interpret its pixels.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Enforces the current semantic-channel compatibility and payload-identity boundary at consumption.
 */
export const verifyAutoMovieSemanticMask = (
  mask: IAutoMovieSemanticMask,
): void => {
  const record = semanticMaskRecord(mask, "mask");
  if (
    Object.hasOwn(record, "version") === false ||
    Object.hasOwn(record, "protocol") === false
  )
    invalidSemanticMask(
      "semantic mask requires explicit version and protocol fields",
    );
  const version = mask.version as number;
  const protocol = mask.protocol as string;
  if (version !== SEMANTIC_MASK_VERSION || protocol !== SEMANTIC_MASK_PROTOCOL)
    throw new AutoMovieSemanticMaskVerificationError(
      "unsupported",
      `unsupported semantic mask ${String(version)}/${protocol}; expected ${SEMANTIC_MASK_VERSION}/${SEMANTIC_MASK_PROTOCOL}`,
    );
  verifySemanticMaskSchema(record);
  const expected = digestAutoMovieSemanticMask(mask);
  if (mask.digest !== expected)
    throw new AutoMovieSemanticMaskVerificationError(
      "digest-mismatch",
      `semantic mask digest mismatch: declared ${mask.digest}, canonical ${expected}`,
    );
};

/** Refuse unknown or missing fields before canonical projection can erase them. */
const verifySemanticMaskSchema = (mask: Record<string, unknown>): void => {
  exactSemanticMaskKeys(
    mask,
    ["version", "protocol", "background", "entries", "unaddressed", "digest"],
    "mask",
  );
  const entries = semanticMaskArray(mask.entries, "entries");
  const unaddressed = semanticMaskArray(mask.unaddressed, "unaddressed gaps");
  for (const [index, value] of entries.entries()) {
    const entry = semanticMaskRecord(value, `entry ${index}`);
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
const semanticMaskArray = (value: unknown, name: string): unknown[] => {
  if (!Array.isArray(value))
    invalidSemanticMask(`semantic mask ${name} must be an array`);
  return value as unknown[];
};

/** Read one runtime semantic value as an exact record. */
const semanticMaskRecord = (
  value: unknown,
  name: string,
): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    invalidSemanticMask(`semantic mask ${name} must be an object`);
  return value as Record<string, unknown>;
};

/** Compare one semantic record's complete key set without normalizing it. */
const exactSemanticMaskKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
  name: string,
): void => {
  const actual = Object.keys(value).sort(compareAutoMovieRenderIds);
  const canonical = [...expected].sort(compareAutoMovieRenderIds);
  if (
    actual.length !== canonical.length ||
    actual.some((key, index) => key !== canonical[index])
  )
    invalidSemanticMask(
      `semantic mask ${name} keys are invalid; expected ${canonical.join(", ")}`,
    );
};

/** Raise one typed current-schema refusal. */
const invalidSemanticMask = (message: string): never => {
  throw new AutoMovieSemanticMaskVerificationError("invalid", message);
};
