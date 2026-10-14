import path from "node:path";
import type { EvidenceSeverity, IEvidenceConfig, IEvidenceReference } from "@wrtnlabs/evidence";


import type { ITtscEvidenceGraphClaim, ITtscEvidenceGraphConfig, ITtscEvidenceGraphReference } from "@ttsc/evidence";


import type { TtscLintSeverity } from "@ttsc/lint";

/**
 * Admit the production factory's graph into the standalone evaluator contract.
 *
 * Compiler lint accepts numeric severity and the `warn` alias; the standalone CLI accepts only named levels. This maps those supported representations on every claim and reference, and anchors roots to the compiler project location, retaining their populations, ordering, and relationship policies. Copies protect the project-owned declaration.
 *
 * @evidence contracts/common.md#principled-implementation Map compiler severity representations and resolve roots against location so standalone evaluation selects the same hosts and targets.
 * @evidence contracts/common.md#clear-and-simple-design Severity, reference and root conversion stay private to the adapter; native graph construction remains separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Package-only TypeScript references and blank or drive-relative roots are explicitly rejected instead of approximated.
 * @evidence contracts/common.md#meaningful-documentation Policies and order are retained through shallow copies; swagger uses the project root and nested populations remain caller-owned.
 * @evidence contracts/performance.md#efficient-algorithms Time and shallow record storage follow claim/reference counts, the total enumerable fields copied from those records including caller extensions, and root path lengths; content bytes are not evaluated here and nested values remain shared.
 * @evidence contracts/performance.md#reuse-equivalent-work Nested policy arrays are reused when unchanged; converted outer records are fresh for each graph and location.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the standalone declaration; no cache, handle or running evaluator is retained by conversion.
 */
export function createAutoMovieStandaloneEvidenceConfig(graph: ITtscEvidenceGraphConfig, location: string): IEvidenceConfig {
  return ({
  claims: graph.claims.map((claim: ITtscEvidenceGraphClaim): IEvidenceConfig["claims"][number] => ({
    ...claim,
    root: root(claim.root, location),
    severity: severity(claim.severity),
    reference: Array.isArray(claim.reference)
      ? claim.reference.map((value: ITtscEvidenceGraphReference): IEvidenceReference => reference(value, location))
      : reference(claim.reference, location),
  })),
});
}

/** Preserve inactive, warning, error, and inherited diagnostic semantics. */
function severity(value: TtscLintSeverity | undefined): EvidenceSeverity | undefined {
  if (value === 0) return "off";
  if (value === 1 || value === "warn") return "warning";
  if (value === 2) return "error";
  return value;
}

/** Normalize one independently evaluated reference without sharing its policy. */
function reference(value: ITtscEvidenceGraphReference, location: string): IEvidenceReference {
  if (value.type === "typescript") {
    if (value.package !== undefined || value.files === undefined)
      throw new Error(
        "Standalone TypeScript evidence requires explicit root/files instead of a compiler package population.",
      );
    const { package: _package, ...population }: Extract<ITtscEvidenceGraphReference, { type: "typescript" }> = value;
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
}

/** Retain native refusals before converting a configuration-relative root. */
function root(value: string | undefined, location: string): string {
  if (
    value !== undefined &&
    (value.trim().length === 0 || /^[A-Za-z]:(?![/\\])/u.test(value))
  )
    throw new Error(
      "Evidence roots must be nonblank directories without drive-relative paths.",
    );
  return path.resolve(location, value ?? ".");
}
