import { type IEvidenceConfig } from "@wrtnlabs/evidence";

import { requirePackagePublicSourceFiles } from "./publicSourceFiles";

type EvidenceScope = "functions" | "types";

/** Builds the shared published-contract claims while preserving package predicate ownership. */
export function createPackageEvidenceConfig(
  packageName: string,
  scope: EvidenceScope = "functions",
): IEvidenceConfig {
  const files: string[] = requirePackagePublicSourceFiles();
  const documentationSymbols: "type" | ["type", "function"] =
    scope === "types" ? "type" : ["type", "function"];
  const claims: IEvidenceConfig["claims"] = [
    {
      name: `${packageName} documentation`,
      type: "typescript",
      files,
      evidenceFiles: ["predicate/**/*.md"],
      symbol: documentationSymbols,
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: ["contracts/development/common.md"],
        symbol: "h2",
        checklist: true,
      },
    },
    {
      name: `${packageName} types`,
      type: "typescript",
      files,
      evidenceFiles: ["predicate/**/*.md"],
      symbol: "type",
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: ["contracts/development/design.md"],
        symbol: "h2",
        checklist: true,
      },
    },
  ];
  if (scope === "functions")
    claims.push({
      name: `${packageName} functions`,
      type: "typescript",
      files,
      evidenceFiles: ["predicate/**/*.md"],
      symbol: "function",
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: ["contracts/development/implementation.md"],
        symbol: "h2",
        checklist: true,
      },
    });
  return { severity: "error", claims };
}
