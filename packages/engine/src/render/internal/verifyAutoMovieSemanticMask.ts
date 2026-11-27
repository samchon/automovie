import { IAutoMovieSemanticMask } from "@automovie/interface";

import { AutoMovieSemanticMaskVerificationError } from "../AutoMovieSemanticMaskVerificationError";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { digestAutoMovieSemanticMask } from "./digestAutoMovieSemanticMask";

/**
 * Refuse a historical, foreign, or self-inconsistent semantic mask.
 *
 * This verifies current format identity and the complete canonical payload
 * digest. Semantic graph validity remains the derivation owner's concern, so a
 * consumer cannot accidentally reinterpret a v1 sidecar as current v2
 * evidence.
 */
export function verifyAutoMovieSemanticMask(
  mask: IAutoMovieSemanticMask,
): void {
  if (
    Object.hasOwn(mask, "version") === false ||
    Object.hasOwn(mask, "protocol") === false
  )
    invalidSemanticMask(
      "semantic mask requires explicit version and protocol fields",
    );
  const version: number = mask.version;
  const protocol: string = mask.protocol;
  if (version !== SEMANTIC_MASK_VERSION || protocol !== SEMANTIC_MASK_PROTOCOL)
    throw new AutoMovieSemanticMaskVerificationError(
      "unsupported",
      `unsupported semantic mask ${String(version)}/${protocol}; expected ${SEMANTIC_MASK_VERSION}/${SEMANTIC_MASK_PROTOCOL}`,
    );
  verifySemanticMaskSchema(mask);
  const expected: string = digestAutoMovieSemanticMask(mask);
  if (mask.digest !== expected)
    throw new AutoMovieSemanticMaskVerificationError(
      "digest-mismatch",
      `semantic mask digest mismatch: declared ${mask.digest}, canonical ${expected}`,
    );
}

/** Current full-payload semantic-mask format. */
const SEMANTIC_MASK_VERSION: number = 2;

/** Domain separator for the current full-payload semantic-mask format. */
const SEMANTIC_MASK_PROTOCOL: string = "automovie.semantic-mask.v2";

/** Refuse unknown or missing fields before canonical projection can erase them. */
const verifySemanticMaskSchema: (mask: IAutoMovieSemanticMask) => void = (
  mask: IAutoMovieSemanticMask,
): void => {
  exactSemanticMaskKeys(
    mask,
    ["version", "protocol", "background", "entries", "unaddressed", "digest"],
    "mask",
  );
  for (const [index, entry] of mask.entries.entries()) {
    exactSemanticMaskKeys(
      entry,
      ["id", "kind", "label", "color", "owner", "nodes", "slot"],
      `entry ${index}`,
    );
    if (entry.slot !== null)
      exactSemanticMaskKeys(
        entry.slot,
        ["instanceSet", "index"],
        `entry ${index} slot`,
      );
  }
  for (const [index, gap] of mask.unaddressed.entries())
    exactSemanticMaskKeys(
      gap,
      ["instanceSet", "slots", "reason", "remedy"],
      `gap ${index}`,
    );
};

/** Compare one semantic record's complete key set without normalizing it. */
const exactSemanticMaskKeys: (
  value: object,
  expected: readonly string[],
  name: string,
) => void = (
  value: object,
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
