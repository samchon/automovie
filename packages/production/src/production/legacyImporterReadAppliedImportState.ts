import typia from "typia";
import { legacyImporterImportStatePath } from "./legacyImporterImportStatePath";
import type { legacyImporterAppliedImportState } from "./legacyImporterAppliedImportState";
import { legacyImporterValidatePlan } from "./legacyImporterValidatePlan";
import { legacyImporterInvalidLegacyImportJsonError } from "./legacyImporterInvalidLegacyImportJsonError";
import { legacyImporterReadJson } from "./legacyImporterReadJson";

/**
 * Admit applied-state JSON only when the plan is valid, fingerprints match and incarnation is a lowercase version-four UUID. Malformed import JSON returns null; other read failures propagate to the verification owner.
 *
 * @evidence contracts/common.md#principled-implementation Runtime exact-shape validation and explicit plan-fingerprint/UUID checks bind the persisted state to one admitted import incarnation.
 * @evidence contracts/common.md#clear-and-simple-design Separates applied-state schema admission from whole-tree/byte verification so publication and rollback can reuse the same state facts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No malformed JSON or invalid UUID becomes a replacement incarnation; null states remain refusal evidence, never authorization to overwrite production work.
 * @evidence contracts/common.md#meaningful-documentation States fingerprint binding, v4 lowercase UUID shape, null refusal and the narrower malformed-JSON catch.
 * @evidence contracts/performance.md#efficient-algorithms Plan admission includes full semantic canonical hashing; state parsing follows J bytes and fixed fingerprint/UUID checks, with temporary decoded and encoded population-sized values.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses shared plan admission and parsed current state within one verification attempt; no filename-only state cache survives later file changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only admitted state scalar fields escape; descriptors remain with the reader and errors other than malformed import JSON remain visible to the enclosing owner.
 */
export const legacyImporterReadAppliedImportState: (stateRoot: string, planValue: unknown) => legacyImporterAppliedImportState | null = (
  stateRoot: string,
  planValue: unknown,
): legacyImporterAppliedImportState | null => {
  try {
    if (legacyImporterValidatePlan(planValue) === false) return null;
    const value: unknown = legacyImporterReadJson<unknown>(stateRoot, legacyImporterImportStatePath);
    const validation: typia.IValidation<legacyImporterAppliedImportState> = typia.validateEquals<legacyImporterAppliedImportState>(value);
    if (
      validation.success === false ||
      validation.data.fingerprint !== planValue.fingerprint ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(
        validation.data.incarnation,
      ) === false
    )
      return null;
    return validation.data;
  } catch (error) {
    if (error instanceof legacyImporterInvalidLegacyImportJsonError) return null;
    throw error;
  }
};
