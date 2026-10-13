import path from "node:path";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import type { IAutoMovieEvidenceTargetIdentityRegistry } from "./IAutoMovieEvidenceTargetIdentityRegistry";
import type { ITtscEvidenceGraphReference } from "@ttsc/evidence";
import { CONTRACTS } from "./CONTRACTS";
import { CONTRACT_INDEX } from "./CONTRACT_INDEX";
import { DOCS } from "./DOCS";
import { MARKDOWN } from "./MARKDOWN";
import { evidenceRoot } from "./evidenceRoot";
import { matchesGlob } from "./matchesGlob";
import { normalizeGlob } from "./normalizeGlob";
import { normalizeTargetTitle } from "./normalizeTargetTitle";
import { posix } from "./posix";
import { validateTargetForm } from "./validateTargetForm";
import { walkProjectFiles } from "./walkProjectFiles";

function matchesPatterns(file: string, patterns: readonly string[]): boolean {
  let selected: boolean = false;
  for (const source of patterns) {
    const negative: boolean = source.startsWith("!");
    const pattern: string = normalizeGlob(negative ? source.slice(1) : source);
    if (matchesGlob(file, pattern)) selected = !negative;
  }
  return selected;
}

function populationHasFiles(graph: IAutoMovieEvidenceConfigProps, type: "markdown" | "typescript", root: string, patterns: readonly string[]): boolean {
  const base: string = path.resolve(graph.location, root);
  return walkProjectFiles(graph, base, type === "markdown" ? ".md" : ".ts")
    .map((file: string): string => posix(path.relative(base, file)))
    .some((file: string): boolean => matchesPatterns(file, patterns));
}

/**
 * Admit flat local contract targets, exact target identity and additive claims with nonempty physical hosts and reference populations.
 *
 * @evidence contracts/common.md#principled-implementation Admit flat local contract targets, exact target identity and additive claims with nonempty physical hosts and reference populations.
 * @evidence contracts/common.md#clear-and-simple-design The gate extends the shared registry and uses ordered positive or negative glob semantics to match local references.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Package-based TypeScript references keep native resolution ownership; undeclared local target files and empty active selectors are explicitly rejected.
 * @evidence contracts/common.md#meaningful-documentation The supplied identity maps are extended in place, and a disabled declared reference can establish target ownership without active host enforcement.
 * @evidence contracts/performance.md#efficient-algorithms Target and selector scans may perform repeated physical walks and pairwise glob matching; maps grow with local target H2s.
 * @evidence contracts/performance.md#reuse-equivalent-work Compiled glob states are memoized only inside each match, while root walks are currently repeated for separate claims and references.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the extended identity maps; selector arrays and walk buffers are local and no filesystem handle survives rejection.
 */
export function validateProductionTargets(graph: IAutoMovieEvidenceConfigProps, identities: IAutoMovieEvidenceTargetIdentityRegistry): void {
  const root: string = path.join(graph.location, DOCS);
  const reserved: Set<string> = new Set<string>([
    "accounts",
    "discovery",
    "language",
    "naturalness",
    "obligations",
    "principles",
    "upstream",
    "final",
    ...Object.keys(MARKDOWN),
  ]);
  const targets: string[] = walkProjectFiles(graph, root, ".md")
    .map((file: string): string => posix(path.relative(root, file)))
    .filter(
      (file: string): boolean =>
        file !== "README.md" &&
        file !== CONTRACT_INDEX &&
        !reserved.has(file.split("/", 1)[0]!),
    );
  const selectors: Array<{
    disabled: boolean;
    h2: boolean;
    patterns: string[];
    root: string;
  }> = [];
  for (const claim of graph.claims ?? []) {
    const references: ITtscEvidenceGraphReference[] = Array.isArray(claim.reference)
      ? claim.reference
      : [claim.reference];
    for (const reference of references) {
      if (reference.type !== "markdown") continue;
      const referenceRoot: string = path.resolve(graph.location, reference.root ?? ".");
      selectors.push({
        disabled: claim.disabled === true,
        h2: Array.isArray(reference.symbol)
          ? reference.symbol.includes("h2")
          : reference.symbol === "h2",
        patterns: [...reference.files],
        root: referenceRoot,
      });
    }
    if (claim.disabled === true) continue;
    if (claim.type !== "markdown" && claim.type !== "typescript") continue;
    if (
      !populationHasFiles(graph, claim.type, evidenceRoot(claim), claim.files)
    )
      throw new Error(
        `Active production claim ${claim.name} selects no host file.`,
      );
    if (references.length === 0)
      throw new Error(
        `Active production claim ${claim.name} selects no reference population.`,
      );
    for (const reference of references) {
      if (reference.type !== "markdown" && reference.type !== "typescript")
        continue;
      if (reference.type === "typescript" && reference.package !== undefined)
        continue;
      if (
        !populationHasFiles(
          graph,
          reference.type,
          evidenceRoot(reference),
          reference.files ?? [],
        )
      )
        throw new Error(
          `Active production claim ${claim.name} has an empty reference population.`,
        );
    }
  }
  for (const target of targets) {
    const file: string = path.join(root, target);
    const localContract: boolean = target.startsWith(`${CONTRACTS}/`);
    if (!localContract)
      throw new Error(
        `${target} is a production-only target outside the flat docs/contracts inventory.`,
      );
    for (const unit of validateTargetForm(target, file, localContract)) {
      const previousAnchor: string | undefined = identities.anchors.get(unit.anchor);
      if (previousAnchor !== undefined)
        throw new Error(
          `${target}#${unit.anchor} duplicates target anchor already owned by ${previousAnchor}.`,
        );
      identities.anchors.set(unit.anchor, `${target}#${unit.anchor}`);
      const normalizedTitle: string = normalizeTargetTitle(unit.title);
      const previousTitle: string | undefined = identities.titles.get(normalizedTitle);
      if (previousTitle !== undefined)
        throw new Error(
          `${target}#${unit.anchor} duplicates target title ${JSON.stringify(unit.title)} already owned by ${previousTitle}.`,
        );
      identities.titles.set(normalizedTitle, `${target}#${unit.anchor}`);
    }
    if (
      !selectors.some((entry: { disabled: boolean; h2: boolean; patterns: string[]; root: string; }): boolean => {
        const relative: string = posix(path.relative(entry.root, file));
        return (
          entry.h2 &&
          relative !== ".." &&
          !relative.startsWith("../") &&
          matchesPatterns(relative, entry.patterns)
        );
      })
    )
      throw new Error(
        `${target} is a production target with no additive claim reference.`,
      );
  }
  for (const selector of selectors) {
    if (selector.disabled) continue;
    for (const sourcePattern of selector.patterns) {
      if (sourcePattern.startsWith("!")) continue;
      const pattern: string = normalizeGlob(sourcePattern);
      const wildcard: number = pattern.search(/[*?]/u);
      const concrete: string = (
        wildcard === -1 ? pattern : pattern.slice(0, wildcard)
      ).replace(/[/]+$/u, "");
      const prefix: string = path.resolve(selector.root, concrete);
      const relativePrefix: string = posix(path.relative(root, prefix));
      if (
        relativePrefix === ".." ||
        relativePrefix.startsWith("../") ||
        relativePrefix.length === 0
      )
        continue;
      const first: string = relativePrefix.split("/", 1)[0]!;
      if (reserved.has(first) || relativePrefix === "README.md") continue;
      if (
        !targets.some((target: string): boolean => {
          const absolute: string = path.join(root, target);
          const relative: string = posix(path.relative(selector.root, absolute));
          return (
            relative !== ".." &&
            !relative.startsWith("../") &&
            matchesGlob(relative, pattern)
          );
        })
      )
        throw new Error(
          `Active production target pattern ${pattern} selects no Markdown target.`,
        );
    }
  }
}
