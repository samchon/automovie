import fs from "node:fs";
import path from "node:path";
import type { AutoMovieContractRuleApplication } from "./AutoMovieContractRuleApplication";
import type { AutoMovieProductionLanguage } from "./AutoMovieProductionLanguage";
import type { IAutoMovieContractRule } from "./IAutoMovieContractRule";
import type { IAutoMovieEvidenceHeadingIdentity } from "./IAutoMovieEvidenceHeadingIdentity";
import type { IAutoMovieEvidenceTargetIdentityRegistry } from "./IAutoMovieEvidenceTargetIdentityRegistry";
import type { IAutoMovieSharedContractReference } from "./IAutoMovieSharedContractReference";
import { EXPECTED_CONTRACTS } from "./EXPECTED_CONTRACTS";
import { compareCodeUnits } from "./compareCodeUnits";
import { isAutoMovieProductionLanguage } from "./isAutoMovieProductionLanguage";
import { normalizeTargetTitle } from "./normalizeTargetTitle";
import { parseAutoMovieEvidenceSyntax } from "./parseAutoMovieEvidenceSyntax";
import { posix } from "./posix";
import { readAutoMovieContractRules } from "./readAutoMovieContractRules";
import { sharedDocsRoot } from "./sharedDocsRoot";
import { validateTargetForm } from "./validateTargetForm";

function walkFiles(root: string, extension: ".md" | ".ts"): string[] {
  if (!fs.existsSync(root)) return [];
  const output: string[] = [];
  const visit: (directory: string) => void = (directory: string): void => {
    for (const entry of fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((left: fs.Dirent<string>, right: fs.Dirent<string>): number => compareCodeUnits(left.name, right.name))) {
      const absolute: string = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile() && entry.name.endsWith(extension))
        output.push(absolute);
    }
  };
  visit(root);
  return output;
}

/**
 * Compare the required project-owned file and H2 inventory, then reject duplicate target anchors or normalized titles and validate structured language routing.
 *
 * @evidence contracts/common.md#principled-implementation Resident file and H2 inventories must equal the configured contract addresses before unique identities and structured language routes are admitted.
 * @evidence contracts/common.md#clear-and-simple-design The returned identity registry lets production-only targets extend the same uniqueness pass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inventory constants define supported contracts rather than expected test answers; title normalization is identity admission, not prose grading.
 * @evidence contracts/common.md#meaningful-documentation The gate throws on missing, extra or malformed targets and checks route metadata rather than arbitrary narrative semantics.
 * @evidence contracts/performance.md#efficient-algorithms Filesystem walks and repeated document parses dominate; inventory sorting costs O(F log F) and identity maps grow with H2 count.
 * @evidence contracts/performance.md#reuse-equivalent-work Anchor and title maps are shared within admission and returned for local targets; mutable file contents are reread by several format helpers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous file reads close their handles; caller-owned registries retain one entry per target until the validation owner releases them.
 */
export function validateContracts(location: string, language: AutoMovieProductionLanguage): IAutoMovieEvidenceTargetIdentityRegistry {
  const root: string = path.resolve(location, sharedDocsRoot(location));
  const actual: string[] = [
    ...walkFiles(path.join(root, "discovery"), ".md"),
    ...walkFiles(path.join(root, "naturalness"), ".md"),
    ...walkFiles(path.join(root, "obligations"), ".md"),
    ...walkFiles(path.join(root, "principles"), ".md"),
    ...walkFiles(path.join(root, "upstream"), ".md"),
  ]
    .map((file: string): string => posix(path.relative(root, file)))
    .sort(compareCodeUnits);
  const expected: IAutoMovieSharedContractReference[] = [...EXPECTED_CONTRACTS].sort((left: IAutoMovieSharedContractReference, right: IAutoMovieSharedContractReference): number =>
    compareCodeUnits(left.file, right.file),
  );
  if (
    actual.length !== expected.length ||
    actual.some((file: string, index: number): boolean => file !== expected[index]!.file)
  )
    throw new Error(
      `Shared contract inventory changed without graph wiring. Received [${actual.join(", ")}], expected [${expected.map((contract: IAutoMovieSharedContractReference): string => contract.file).join(", ")}].`,
    );
  const anchors: Map<string, string> = new Map<string, string>();
  const titles: Map<string, string> = new Map<string, string>();
  for (const [index, relative] of actual.entries()) {
    const file: string = path.join(root, relative);
    const source: string = fs.readFileSync(file, "utf8");
    if (parseAutoMovieEvidenceSyntax({ path: relative, source }).length !== 0)
      throw new Error(
        `${relative} is a shared target and must not carry host-side @evidence tags.`,
      );
    const units: IAutoMovieEvidenceHeadingIdentity[] = validateTargetForm(relative, file);
    for (const unit of units) {
      const previousAnchor: string | undefined = anchors.get(unit.anchor);
      if (previousAnchor !== undefined)
        throw new Error(
          `${relative}#${unit.anchor} reuses shared H2 anchor already owned by ${previousAnchor}.`,
        );
      anchors.set(unit.anchor, `${relative}#${unit.anchor}`);
      const normalizedTitle: string = normalizeTargetTitle(unit.title);
      const previousTitle: string | undefined = titles.get(normalizedTitle);
      if (previousTitle !== undefined)
        throw new Error(
          `${relative}#${unit.anchor} repeats shared H2 title ${JSON.stringify(unit.title)} already owned by ${previousTitle}.`,
        );
      titles.set(normalizedTitle, `${relative}#${unit.anchor}`);
    }
    const expectedAnchors: readonly string[] = expected[index]!.anchors;
    const receivedAnchors: string[] = units.map((unit: IAutoMovieEvidenceHeadingIdentity): string => unit.anchor);
    if (
      receivedAnchors.length !== expectedAnchors.length ||
      receivedAnchors.some(
        (anchor: string, anchorIndex: number): boolean => anchor !== expectedAnchors[anchorIndex],
      )
    )
      throw new Error(
        `${relative} H2 inventory changed without graph wiring. Received [${receivedAnchors.join(", ")}], expected [${expectedAnchors.join(", ")}].`,
      );
  }
  validateStructuredSharedRules(root);
  // The retained blank-state exception can bypass language membership, after
  // the shared resident inventory has already been required above.
  if (isAutoMovieProductionLanguage(language))
    validateLanguageContract(root, language);
  return { anchors, titles };
}

/** Validate exact routing metadata for the shared rules whose timing is binding. */
function validateStructuredSharedRules(root: string): void {
  const naturalness: readonly IAutoMovieContractRule[] = readAutoMovieContractRules(
    path.join(root, "naturalness"),
    {
      requireEveryH2In: ["core/common.md", "story/screenplays.md"],
    },
  );
  const principles: readonly IAutoMovieContractRule[] = readAutoMovieContractRules(path.join(root, "principles"), {
    requireEveryH2In: [],
  });
  const obligations: readonly IAutoMovieContractRule[] = readAutoMovieContractRules(
    path.join(root, "obligations"),
    {
      requireEveryH2In: ["core/defaults.md"],
    },
  );
  const expected: Map<string, string> = new Map<string, string>([
    ["naturalness-earned-element", "revision-only"],
    ["naturalness-performed-whole", "revision-only"],
    ["naturalness-scene-pressure", "revision-only"],
    ["naturalness-spoken-narrated-yield", "revision-only"],
    ["sh-closing-line-contribution", "composition-safe"],
    ["sh-recurrent-frame-distribution", "post-draft-frequency"],
    ["sh-surface-cadence-distribution", "population-distribution"],
  ]);
  const received: Map<string, AutoMovieContractRuleApplication> = new Map(
    [...naturalness, ...principles, ...obligations].map((rule: IAutoMovieContractRule): [string, AutoMovieContractRuleApplication] => [
      rule.metadata.id,
      rule.metadata.safeApplication,
    ]),
  );
  for (const [id, application] of expected)
    if (received.get(id) !== application)
      throw new Error(
        `${id}: expected one structured ${application} contract rule.`,
      );
}

/** Refuse an omitted, residual, or metadata-mismatched selected language pack. */
function validateLanguageContract(root: string, language: AutoMovieProductionLanguage): void {
  const languageRoot: string = path.join(root, "language");
  const expectedFiles: string[] = [
    "discovery/signals.md",
    "naturalness/screenplays.md",
    "obligations/common.md",
  ];
  const actualFiles: string[] = walkFiles(languageRoot, ".md")
    .map((file: string): string => posix(path.relative(languageRoot, file)))
    .sort(compareCodeUnits);
  if (
    actualFiles.length !== expectedFiles.length ||
    actualFiles.some((file: string, index: number): boolean => file !== expectedFiles[index])
  )
    throw new Error(
      `Selected ${language} language contract must contain exactly [${expectedFiles.join(", ")}]; received [${actualFiles.join(", ")}].`,
    );
  const expectedRules: readonly [readonly ["chinese-work-specific-conditions" | "english-work-specific-conditions" | "japanese-work-specific-conditions" | "korean-work-specific-conditions", "observation-only"], readonly ["chinese-population-register-frame-account" | "chinese-population-interference-account" | "english-population-register-frame-account" | "english-population-interference-account" | "japanese-population-register-frame-account" | "japanese-population-interference-account" | "korean-population-register-frame-account" | "korean-population-interference-account", "population-distribution"], readonly ["chinese-audience-language-access" | "english-audience-language-access" | "japanese-audience-language-access" | "korean-audience-language-access", "population-distribution"], readonly [string, "revision-only"], readonly ["chinese-register-ownership" | "english-register-ownership" | "japanese-register-ownership" | "korean-register-ownership", "revision-only"]] = [
    [`${language}-work-specific-conditions`, "observation-only"],
    [
      `${language}-population-${language === "english" ? "register-frame" : "interference"}-account`,
      "population-distribution",
    ],
    [`${language}-audience-language-access`, "population-distribution"],
    [
      language === "english"
        ? "english-idiomatic-relation"
        : `${language}-contextual-relation`,
      "revision-only",
    ],
    [`${language}-register-ownership`, "revision-only"],
  ] as const;
  const rules: readonly IAutoMovieContractRule[] = readAutoMovieContractRules(languageRoot, {
    requireEveryH2In: expectedFiles,
  });
  const routes: Map<string, AutoMovieContractRuleApplication> = new Map(
    rules.map((rule: IAutoMovieContractRule): [string, AutoMovieContractRuleApplication] => [rule.metadata.id, rule.metadata.safeApplication]),
  );
  if (
    rules.length !== expectedRules.length ||
    expectedRules.some(([id, application]: readonly ["chinese-work-specific-conditions" | "english-work-specific-conditions" | "japanese-work-specific-conditions" | "korean-work-specific-conditions", "observation-only"] | readonly ["chinese-population-register-frame-account" | "chinese-population-interference-account" | "english-population-register-frame-account" | "english-population-interference-account" | "japanese-population-register-frame-account" | "japanese-population-interference-account" | "korean-population-register-frame-account" | "korean-population-interference-account", "population-distribution"] | readonly ["chinese-audience-language-access" | "english-audience-language-access" | "japanese-audience-language-access" | "korean-audience-language-access", "population-distribution"] | readonly [string, "revision-only"] | readonly ["chinese-register-ownership" | "english-register-ownership" | "japanese-register-ownership" | "korean-register-ownership", "revision-only"]): boolean => routes.get(id) !== application)
  )
    throw new Error(
      `Selected ${language} language contract carries an incomplete or mismatched structured rule identity.`,
    );
}
