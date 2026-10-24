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
 *
 * @evidence contracts/common.md#principled-implementation Exact work-subtree paths and explicit file/H2 granularity are validated before building native Markdown references; principles remain per-H2 checklists, while population obligations are delegated to their dedicated factory.
 * @evidence contracts/common.md#clear-and-simple-design One factory owns local contract validation and detached construction evidence mapping; independent review remains a separate claim family.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reserved discovery carrier and obligation subtree are excluded because built-in discovery and once-per-population factories own those duties; these checks apply to every work document.
 * @evidence contracts/common.md#meaningful-documentation The comment explains per-host versus distributed duties, required symbol choice and independent review separation; errors identify unsupported document or host forms.
 * @evidence contracts/performance.md#efficient-algorithms For d document paths and f file globs, validation scans path characters and builds document references plus detached selectors in linear total input/output size; set construction detects duplicate documents without pairwise comparison.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This factory owns one claim build from current props and performs no coordinated request reuse; returned references and arrays belong to that build.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Temporary normalized documents and sets are released on return or throw; returned claim arrays reference caller file/symbol values where assigned and contain no open handle or task.
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
