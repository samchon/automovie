import { createEvidenceConfig } from "@automovie/evidence";
import type {
  IEvidenceClaim,
  IEvidenceMarkdownReference,
} from "@wrtnlabs/evidence";
import { resolve } from "node:path";

/** The bundled story contracts, as a reference root relative to this file. */
const STORY_CONTRACTS: string = ".agents/skills/contracts/story";

/** The settings canon in the scaffold's domain layout, relative to `docs/body`. */
const DOMAIN_SETTINGS: string[] = ["settings/*/*.md"];

/**
 * One reference against a shared story contract document.
 *
 * @param file Path under `shared/`, such as `principles/settings.md`.
 * @param mode `checklist` makes every host answer every item; `unique` lets
 *   exactly one host answer each item once.
 */
const shared = (
  file: string,
  mode: "checklist" | "unique",
): IEvidenceMarkdownReference => ({
  type: "markdown",
  root: STORY_CONTRACTS,
  files: [`shared/${file}`],
  symbol: "h2",
  noEvidenceExclude: true,
  ...(mode === "checklist" ? { checklist: true } : { uniqueEvidence: true }),
});

/**
 * Settings construction claims for the domain layout
 * `docs/body/settings/<domain>/<subject>.md`.
 *
 * The installed `@automovie/evidence` selects settings only as flat
 * `settings/*.md` or numbered `settings/NNN-subject/*.md` files, so its own
 * settings claims select nothing in the domain layout the story skill
 * prescribes (reported as BLOCKED-CAPABILITY in the campaign run record).
 * These claims ask the same shared questions of the actual files: every H2
 * answers the common and settings principles, every adopted instruction is
 * realized by some settings H2, and each population obligation is answered
 * once. Remove them when the package selects the domain layout itself.
 */
const domainSettingsClaims: IEvidenceClaim[] = [
  {
    name: "settings H2 units (domain layout) answer their principle checklists",
    type: "markdown",
    root: "docs/body",
    files: DOMAIN_SETTINGS,
    symbol: "h2",
    evidenceFiles: ["docs/evidence/construction/units/settings/*/*.md"],
    reference: [
      shared("principles/common.md", "checklist"),
      shared("principles/settings.md", "checklist"),
    ],
  },
  {
    name: "the settings canon (domain layout) realizes every user instruction",
    type: "markdown",
    root: "docs/body",
    files: DOMAIN_SETTINGS,
    symbol: "h2",
    evidenceFiles: ["docs/evidence/construction/units/settings/*/*.md"],
    reference: {
      type: "markdown",
      root: "docs",
      files: ["instructions/*.md"],
      symbol: "h2",
      noEvidenceExclude: true,
    },
  },
  ...["obligations/common.md", "obligations/settings.md"].map(
    (file: string): IEvidenceClaim => ({
      name: `settings documents (domain layout) answer each shared/${file} item once`,
      type: "markdown",
      root: "docs/body",
      files: DOMAIN_SETTINGS,
      symbol: "file",
      evidenceFiles: ["docs/evidence/construction/files/settings/*/*.md"],
      reference: shared(file, "unique"),
    }),
  ),
  {
    name: "the settings work-specific contract accounts for its open-world discovery duties",
    type: "markdown",
    root: "docs/contracts",
    files: ["work/**/*.md"],
    evidenceExcludeCarriers: ["work/discovery/results.md"],
    symbol: "file",
    reference: ["discovery/common.md", "discovery/settings.md"].map(
      (file: string): IEvidenceMarkdownReference => ({
        type: "markdown",
        root: STORY_CONTRACTS,
        files: [`shared/${file}`],
        symbol: "h2",
      }),
    ),
  },
];

/**
 * Four vertical shorts run settings → screenplay (`short-with-settings`).
 *
 * Settings construction is in its evidence stage through
 * `domainSettingsClaims`, which also carry its discovery duty. The package's
 * own settings stage stays unset because its claims select no domain-layout
 * file and fail on their empty flat evidence globs; set
 * `construction: { settings: "evidence" }` and drop the bridging claims once
 * the package selects the domain layout. The research studies are answered;
 * the screenplay stages stay disabled drafts until their complete bodies
 * exist. `skills` names this production's own `.agents/skills` tree, whose
 * bundled contracts the answers cite.
 */
export default createEvidenceConfig({
  location: import.meta.dirname,
  skills: resolve(import.meta.dirname, ".agents/skills"),
  research: "evidence",
  narrative: {
    mode: "short-with-settings",
    claims: domainSettingsClaims,
  },
});
