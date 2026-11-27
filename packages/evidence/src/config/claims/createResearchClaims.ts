import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import { SKILLS_ROOT } from "../../internal/SKILLS_ROOT";
import { STORY_CONTRACTS } from "../../internal/STORY_CONTRACTS";

/*
 * Creates the claim that holds research studies to the story research
 * principles.
 *
 * Each study in `docs/research/`, apart from its index, answers every item of
 * `contracts/story/principles/research.md`, read from the skills tree at
 * `skills`, by default the production's own `.agents/skills`. The citation
 * address, `principles/research.md`, is the same wherever that tree lives. Like
 * the other story layers, the answers live apart from the study, in
 * `docs/evidence/construction/files/research/`, under an H1 naming the study's
 * path, so the study stays a plain synthesis its readers use.
 */
export function createResearchClaims(
  props: {
    /*
     * Reference root of the skills tree holding the story contracts, relative
     * to the directory of `evidence.config.ts` with `/` separators; `..`
     * segments reach a workspace's shared tree.
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
        files: ["principles/research.md"],
        symbol: "h2",
        checklist: true,
      },
    },
  ];
}
