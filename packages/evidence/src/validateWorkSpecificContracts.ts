import fs from "node:fs";
import path from "node:path";
import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import type { IAutoMovieEvidenceMarkdownHeading } from "./IAutoMovieEvidenceMarkdownHeading";
import type { IAutoMovieEvidenceSyntaxAnnotation } from "./IAutoMovieEvidenceSyntaxAnnotation";
import { CONTRACTS } from "./CONTRACTS";
import { CONTRACT_INDEX } from "./CONTRACT_INDEX";
import { DOCS } from "./DOCS";
import { MARKDOWN } from "./MARKDOWN";
import { isActive } from "./isActive";
import { markdownHeadings } from "./markdownHeadings";
import { parseAutoMovieEvidenceSyntax } from "./parseAutoMovieEvidenceSyntax";

const POSITIVE_EVIDENCE_TAG: RegExp = /@evidence(?!Exclude)[A-Za-z]*\b/u;

const EXCLUSION_TAG: RegExp = /@evidenceExclude[A-Za-z]*\b/u;

const DISCOVERY_EVIDENCE_TAG: RegExp =
  /@evidence\s+(?:language\/)?discovery\/[\w./#-]+/u;

const DISCOVERY_EXCLUSION_TAG: RegExp =
  /@evidenceExclude\s+(?:language\/)?discovery\/[\w./#-]+/u;

const EVIDENCE_TARGET: RegExp = /@evidence[A-Za-z]*\s+([^\s]+)/gu;

/**
 * Refuses a work-specific contract that the flat discovery host cannot see.
 *
 * Local rules live directly under docs/contracts so the flat discovery population can address them. The index carries discovery exclusions; retained contract files carry positive discovery adoption before their H1.
 *
 * @evidence contracts/common.md#principled-implementation Require a flat local Markdown rule inventory and keep positive discovery on retained rules while exclusions live in its index ledger.
 * @evidence contracts/common.md#clear-and-simple-design Discovery carriers and canonical annotations are checked here before target coverage admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nested or non-contract entries, active layers without a rule or ledger and discovery carriers in the wrong document are rejected.
 * @evidence contracts/common.md#meaningful-documentation Checks concern retained rule ownership, annotation addresses and H1 form; this function does not grade substantive prose.
 * @evidence contracts/performance.md#efficient-algorithms Directory enumeration is linear in entries, with annotation and heading parsing proportional to total local contract bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work One annotations array per file serves carrier checks; heading parsing currently performs a separate read.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Read buffers and annotation arrays are released after the synchronous pass; no discovery ledger cache or task is retained.
 */
export function validateWorkSpecificContracts(graph: IAutoMovieEvidenceConfigProps): void {
  const root: string = path.join(graph.location, DOCS, CONTRACTS);
  const entries: fs.Dirent<string>[] = fs.existsSync(root)
    ? fs.readdirSync(root, { withFileTypes: true })
    : [];
  const invalidEntry: fs.Dirent<string> | undefined = entries.find(
    (entry: fs.Dirent<string>): boolean =>
      !(
        (entry.isFile() && path.extname(entry.name) === ".md") ||
        (entry.isFile() && entry.name === ".gitkeep")
      ),
  );
  if (invalidEntry !== undefined)
    throw new Error(
      `${CONTRACTS}/${invalidEntry.name}: contracts are Markdown files directly under docs/contracts, and a nested or non-contract entry is claimed by nothing.`,
    );
  const markdown: fs.Dirent<string>[] = entries.filter(
    (entry: fs.Dirent<string>): boolean => entry.isFile() && path.extname(entry.name) === ".md",
  );
  if (
    (Object.keys(MARKDOWN) as AutoMovieAuthoredDocumentLayer[]).some((layer: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments"): boolean =>
      isActive(graph[layer]),
    ) &&
    markdown.length === 0
  )
    throw new Error(
      "An active authored layer requires a retained docs/contracts rule or a truthful-negative contracts/index.md ledger.",
    );
  for (const entry of markdown) {
    const relative: string = `${CONTRACTS}/${entry.name}`;
    const file: string = path.join(root, entry.name);
    const source: string = fs.readFileSync(file, "utf8");
    const annotations: readonly IAutoMovieEvidenceSyntaxAnnotation[] = parseAutoMovieEvidenceSyntax({
      path: relative,
      source,
    });
    const evidence: string = annotations
      .map((annotation: IAutoMovieEvidenceSyntaxAnnotation): string => annotation.text)
      .join("\n");
    const headings: IAutoMovieEvidenceMarkdownHeading[] = markdownHeadings(file);
    const h1: IAutoMovieEvidenceMarkdownHeading[] = headings.filter((heading: IAutoMovieEvidenceMarkdownHeading): boolean => heading.depth === 1);
    const h1Offset: number = source.search(/^#(?!#)[ \t]+\S/mu);
    const preamble: string = h1Offset === -1 ? source : source.slice(0, h1Offset);
    if (
      h1.length !== 1 ||
      headings[0]?.depth !== 1 ||
      preamble.replace(/<!--[\s\S]*?-->/gu, "").trim().length !== 0
    )
      throw new Error(
        `${relative} must begin with one H1 after a comment-only evidence preamble.`,
      );
    if (annotations.some((annotation: IAutoMovieEvidenceSyntaxAnnotation): boolean => annotation.line >= h1[0]!.line))
      throw new Error(
        `${relative} may carry discovery host tags only in its comment preamble before H1.`,
      );
    for (const match of evidence.matchAll(EVIDENCE_TARGET))
      if (!/^(?:language\/)?discovery\//u.test(match[1] ?? ""))
        throw new Error(
          `${relative} may host only discovery evidence before its H1; received ${match[1]}.`,
        );
    if (relative === CONTRACT_INDEX) {
      if (POSITIVE_EVIDENCE_TAG.test(evidence))
        throw new Error(
          `${CONTRACT_INDEX} carries truthful discovery negatives and nothing positive.`,
        );
      if (headings.some((heading: IAutoMovieEvidenceMarkdownHeading): boolean => heading.depth >= 2))
        throw new Error(
          `${CONTRACT_INDEX} carries the truthful negative ledger and no contract target H2.`,
        );
      if (!DISCOVERY_EXCLUSION_TAG.test(evidence))
        throw new Error(
          `${CONTRACT_INDEX} must record at least one truthful discovery negative.`,
        );
    } else {
      if (EXCLUSION_TAG.test(evidence))
        throw new Error(
          `${relative} cannot scatter a discovery exclusion outside ${CONTRACT_INDEX}.`,
        );
      if (!DISCOVERY_EVIDENCE_TAG.test(evidence))
        throw new Error(
          `${relative} must adopt at least one retained discovery rule.`,
        );
    }
  }
}
