import type {
  ITtscEvidenceGraphConfig,
  ITtscEvidenceGraphReference,
} from "@ttsc/evidence";
import type { TtscLintSeverity } from "@ttsc/lint";
import type {
  EvidenceSeverity,
  IEvidenceConfig,
  IEvidenceReference,
} from "@wrtnlabs/evidence";
import path from "node:path";

/**
 * Admit the production factory's graph into the standalone evaluator contract.
 *
 * Compiler lint accepts numeric severity and the `warn` alias; the standalone
 * CLI accepts only named levels. This maps those supported representations on
 * every claim and reference, and anchors roots to the compiler project location,
 * retaining their populations, ordering,
 * and relationship policies. Copies protect the project-owned declaration.
 *
 * @evidence requirements/production-evidence/native-input.md#agent-production-evidence-native-boundary Converts lint severity representations and anchors roots to the declared project location while preserving the admitted production graph for standalone evaluation.
 * @evidence specifications/production-evidence/native-input.md#spec-authoring-production-evidence-native-boundary Produces typed standalone claims and references without altering selection, ownership, or structural policy.
 */
export const createAutoMovieStandaloneEvidenceConfig = (
  graph: ITtscEvidenceGraphConfig,
  location: string,
): IEvidenceConfig => ({
  claims: graph.claims.map((claim) => ({
    ...claim,
    root: root(claim.root, location),
    severity: severity(claim.severity),
    reference: Array.isArray(claim.reference)
      ? claim.reference.map((value) => reference(value, location))
      : reference(claim.reference, location),
  })),
});

/** Preserve inactive, warning, error, and inherited diagnostic semantics. */
const severity = (
  value: TtscLintSeverity | undefined,
): EvidenceSeverity | undefined => {
  if (value === 0) return "off";
  if (value === 1 || value === "warn") return "warning";
  if (value === 2) return "error";
  return value;
};

/** Normalize one independently evaluated reference without sharing its policy. */
const reference = (
  value: ITtscEvidenceGraphReference,
  location: string,
): IEvidenceReference => {
  if (value.type === "typescript") {
    if (value.package !== undefined || value.files === undefined)
      throw new Error(
        "Standalone TypeScript evidence requires explicit root/files instead of a compiler package population.",
      );
    const { package: _package, ...population } = value;
    return {
      ...population,
      files: value.files,
      root: root(value.root, location),
      severity: severity(value.severity),
    };
  }
  return {
    ...value,
    root: root(value.type === "swagger" ? undefined : value.root, location),
    severity: severity(value.severity),
  };
};

/** Retain native refusals before converting a configuration-relative root. */
const root = (value: string | undefined, location: string): string => {
  if (
    value !== undefined &&
    (value.trim().length === 0 || /^[A-Za-z]:(?![/\\])/u.test(value))
  )
    throw new Error(
      "Evidence roots must be nonblank directories without drive-relative paths.",
    );
  return path.resolve(location, value ?? ".");
};
