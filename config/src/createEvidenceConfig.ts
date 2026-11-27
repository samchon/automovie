import { type IEvidenceConfig } from "@wrtnlabs/evidence";

type EvidenceScope = "functions" | "types";

/**
 * Builds the package Evidence claims for contracts at the root of `src` and in
 * its topic directories.
 */
export function createEvidenceConfig(
  scope: EvidenceScope = "functions",
): IEvidenceConfig {
  const files: string[] = ["src/*.ts", "src/*/*.ts"];
  const documentationSymbols: "type" | ["type", "function"] =
    scope === "types" ? "type" : ["type", "function"];
  const claims: IEvidenceConfig["claims"] = [
    {
      name: "documentation",
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
      name: "types",
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
      name: "functions",
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
