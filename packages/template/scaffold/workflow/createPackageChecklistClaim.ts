import type {
  EvidenceMarkdownSymbol,
  IEvidenceClaim,
} from "@wrtnlabs/evidence";

import type { IPackageChecklistClaimProps } from "./IPackageChecklistClaimProps";
import { createEvidenceFiles } from "./internal/utilities/createEvidenceFiles";
import { passRoot } from "./internal/utilities/passRoot";

/**
 * Creates one work-local contract claim.
 *
 * Every selected host answers every H2 item of the document and may not exclude
 * one. Independent review is represented by the separate review family.
 * Set `checklist: false` for a role the population distributes
 * among its hosts rather than one every host repeats.
 *
 * `symbol` is required rather than defaulted, because it is the same choice:
 * `"h2"` binds the condition to every unit, `"file"` binds it once per file.
 */
export function createPackageChecklistClaim(
  props: IPackageChecklistClaimProps,
): IEvidenceClaim {
  const documents: string[] = Array.isArray(props.document)
    ? props.document
    : [props.document];
  const canonicalDocuments: string[] = documents.map(
    (document: string): string => document.replaceAll("\\", "/"),
  );
  if (canonicalDocuments.length === 0)
    throw new Error("A package contract requires at least one work document.");
  if (new Set(canonicalDocuments).size !== canonicalDocuments.length)
    throw new Error(
      "A package contract cannot select the same work document twice.",
    );
  const foreign: string | undefined = canonicalDocuments.find(
    (document: string): boolean => !isWorkDocument(document),
  );
  if (foreign !== undefined)
    throw new Error(
      `${foreign}: package contracts require one exact work/{principles,naturalness,obligations,discovery,targets}/...md address.`,
    );
  const obligation: string | undefined = canonicalDocuments.find(
    (document: string): boolean => document.startsWith("work/obligations/"),
  );
  if (obligation !== undefined)
    throw new Error(
      `${obligation}: work obligations require createPackagePopulationContract, answered once per duty by the layer's documents.`,
    );
  if (canonicalDocuments.includes("work/discovery/results.md"))
    throw new Error(
      "work/discovery/results.md: the built-in discovery claim owns this negative carrier; a package claim would duplicate it.",
    );
  const principles: string[] = canonicalDocuments.filter(
    (document: string): boolean =>
      /(?:^|[\\/])principles(?:[\\/]|-)/u.test(document),
  );
  const symbols: EvidenceMarkdownSymbol[] = Array.isArray(props.symbol)
    ? props.symbol
    : [props.symbol];
  if (symbols.length !== 1 || (symbols[0] !== "file" && symbols[0] !== "h2"))
    throw new Error(
      "Work claims on the manuscript require one file or H2 host kind.",
    );
  if (
    principles.length !== 0 &&
    (props.checklist === false || symbols.length !== 1 || symbols[0] !== "h2")
  )
    throw new Error(
      `${principles.join(", ")}: principles require an H2 checklist whose selected hosts each answer independently.`,
    );
  return {
    name: props.name,
    type: "markdown",
    root: passRoot(props.pass ?? "draft"),
    files: props.files,
    symbol: props.symbol,
    ...(props.pass === "final"
      ? {}
      : {
          evidenceFiles: createEvidenceFiles(symbols[0], props.files),
        }),
    disabled: props.stage === "disabled" || props.inapplicable === true,
    reference: canonicalDocuments.map(
      (
        document: string,
      ): {
        noEvidenceExclude: true;
        checklist?: true | undefined;
        type: "markdown";
        root: string;
        files: string[];
        symbol: "h2";
      } => ({
        type: "markdown" as const,
        root: ".agents/skills/contracts/story",
        files: [document],
        symbol: "h2" as const,
        ...(props.checklist === false ? {} : { checklist: true as const }),
        noEvidenceExclude: true,
      }),
    ),
  };
}

/**
 * Keeps the package API on the tracked work-owned contract subtree.
 *
 * `naturalness` is admitted for the same reason the shared and language trees
 * carry one: a work's own observable form is a question its finished text
 * answers. The caller selects `pass: "final"` and the layer's naturalness stage
 * explicitly; the document directory alone never chooses its host population.
 */
function isWorkDocument(document: string): boolean {
  const normalized: string = document.replaceAll("\\", "/");
  const parts: string[] = normalized.split("/");
  return (
    parts.length >= 3 &&
    parts[0] === "work" &&
    [
      "principles",
      "naturalness",
      "obligations",
      "discovery",
      "targets",
    ].includes(parts[1]) &&
    parts.every(
      (part: string): boolean => part !== "" && part !== "." && part !== "..",
    ) &&
    !/[[\]*?#]/u.test(normalized) &&
    normalized.endsWith(".md") &&
    !normalized.toLowerCase().endsWith("/skill.md")
  );
}
