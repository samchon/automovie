import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import { SKILLS_ROOT } from "./internal/SKILLS_ROOT";
import { STORY_CONTRACTS } from "./internal/STORY_CONTRACTS";

/**
 * Creates the claim that holds research studies to the story research
 * principles.
 *
 * Each study in `docs/research/`, apart from its index, answers every item of
 * `contracts/story/shared/principles/research.md`, read from the skills tree at
 * `skills`, by default the production's own `.agents/skills`. The citation
 * address, `shared/principles/research.md`, is the same wherever that tree
 * lives. Like the other story layers, the answers live apart from the study,
 * in `docs/evidence/construction/files/research/`, under an H1 naming the
 * study's path, so the study stays a plain synthesis its readers use.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A native Markdown file claim with detached evidence files keeps the study's text free of answers while each study still owes every research item; the reference root joins the given skills root with the installed `contracts/story` layout, which native Evidence resolves against the configuration directory.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One claim with fixed study and answer locations; the caller decides whether to enable it and where the shared skills tree is.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The study, index and answer paths are the scaffold layout's documented locations, not fixture paths; the default root is the standalone layout.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds one fixed-size claim tree in constant time; it performs no discovery or file I/O.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A fresh object is returned so one configuration's edits cannot reach another.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned claim; nothing is retained.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the respondents, the contract, which tree it is read from and where the answers live; the option states its form and default.
 */
export function createResearchClaims(
  props: {
    /**
     * Reference root of the skills tree holding the story contracts, relative
     * to the directory of `evidence.config.ts` with `/` separators; `..`
     * segments reach a workspace's shared tree.
     *
     * @default ".agents/skills"
     */
    skills?: string;
  } = {},
): IEvidenceClaim[] {
  return [
    {
      name: "research studies",
      type: "markdown",
      files: ["docs/research/**/*.md", "!docs/research/index.md"],
      evidenceFiles: ["docs/evidence/construction/files/research/**/*.md"],
      symbol: "file",
      reference: {
        type: "markdown",
        root: `${props.skills ?? SKILLS_ROOT}/${STORY_CONTRACTS}`,
        files: ["shared/principles/research.md"],
        symbol: "h2",
        checklist: true,
      },
    },
  ];
}
