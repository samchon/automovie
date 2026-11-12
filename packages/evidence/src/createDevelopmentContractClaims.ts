import type {
  EvidenceProgrammingSymbol,
  IEvidenceClaim,
  IEvidenceMarkdownReference,
} from "@wrtnlabs/evidence";

import type { IAutoMovieDevelopmentProps } from "./IAutoMovieDevelopmentProps";
import { SKILLS_ROOT } from "./internal/SKILLS_ROOT";

/**
 * Creates the claims of the enabled production-specific development contracts.
 *
 * Each enabled stage selects the exported declarations of its source folders
 * and requires each to answer every item of
 * `contracts/development/<stage>.md` in its doc comment, read from the skills
 * tree at `props.skills`, by default the production's own `.agents/skills`.
 * Entities answer with their types, classes, functions and methods, because an
 * entity is a class whose methods are its capabilities. Behaviors (laws,
 * interactions and consequences) also cite the research studies they follow,
 * and every study in `docs/research/` apart from its index must be cited, so a
 * behavior cannot be written without its study and no study goes unused.
 * Scenes cite the screenplay scenes and beats they realize, and every H2 scene
 * and H3 beat must be realized; films cite the screenplay file they deliver,
 * and every screenplay file must become a film. With `instructions`,
 * composition must also realize every instruction section, which no narrative
 * layer then cites. Entities answer their checklist alone, because their settings citations are judged by review
 * rather than required for every settings heading.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Native TypeScript claims carry the checklist, and a second Markdown reference uses native target coverage to make the study-to-behavior, screenplay-to-scene and screenplay-to-film relations mechanical; `instructions` adds the instruction-to-composition relation with the same coverage and no checklist.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One table maps each checklist population to its stage, folders, symbol kinds and cited population, and the one instruction relation, which has no checklist, follows it; disabled stages produce no claim, and the one props object carries the stages, the instruction switch and where the checklists are read.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Source folders are the scaffold layout's documented locations, not fixture paths; nothing is inferred from file presence.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states each stage's respondents, the relation it enforces and which skills tree holds the checklists; the `skills` member states its form and default, and `instructions` when composition must realize every instruction section.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds at most five fixed-size claim trees in constant time; it performs no discovery or file I/O.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Fresh objects are returned so one configuration's edits cannot reach another; there is no expensive shared work.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned claims; nothing is retained.
 */
export function createDevelopmentContractClaims(
  props: IAutoMovieDevelopmentProps & {
    /**
     * Reference root of the skills tree holding the stage checklists, relative
     * to the directory of `evidence.config.ts` with `/` separators; `..`
     * segments reach a workspace's shared tree.
     *
     * @default ".agents/skills"
     */
    skills?: string;

    /**
     * Whether an enabled composition stage must also realize every instruction
     * section, as under narrative mode none, where no narrative layer cites
     * them.
     */
    instructions?: boolean;
  } = {},
): IEvidenceClaim[] {
  const screenplay: string[] = ["docs/body/screenplay/**/*.md"];
  const populations: {
    stage: keyof IAutoMovieDevelopmentProps;
    name: string;
    files: string[];
    symbol: EvidenceProgrammingSymbol[];
    cited?: IEvidenceMarkdownReference;
  }[] = [
    {
      stage: "entities",
      name: "entities",
      files: ["src/entities/**/*.ts"],
      symbol: ["type", "function"],
    },
    {
      stage: "behaviors",
      name: "behaviors",
      files: [
        "src/laws/**/*.ts",
        "src/interactions/**/*.ts",
        "src/consequences/**/*.ts",
      ],
      symbol: ["function"],
      cited: {
        type: "markdown",
        files: ["docs/research/**/*.md", "!docs/research/index.md"],
        symbol: "file",
      },
    },
    {
      stage: "composition",
      name: "scenes",
      files: ["src/composition/scenes/**/*.ts"],
      symbol: ["function"],
      cited: { type: "markdown", files: screenplay, symbol: ["h2", "h3"] },
    },
    {
      stage: "composition",
      name: "films",
      files: ["src/composition/films/**/*.ts"],
      symbol: ["function"],
      cited: { type: "markdown", files: screenplay, symbol: "file" },
    },
  ];
  const claims: IEvidenceClaim[] = populations
    .filter((entry): boolean => props[entry.stage] === "evidence")
    .map(
      (entry): IEvidenceClaim => ({
        name: entry.name,
        type: "typescript",
        files: [...entry.files],
        symbol: [...entry.symbol],
        reference: [
          {
            type: "markdown",
            root: props.skills ?? SKILLS_ROOT,
            files: [`contracts/development/${entry.stage}.md`],
            symbol: "h2",
            checklist: true,
          },
          ...(entry.cited === undefined ? [] : [structuredClone(entry.cited)]),
        ],
      }),
    );
  if (props.instructions === true && props.composition === "evidence")
    claims.push({
      name: "composition realizes every instruction section",
      type: "typescript",
      files: ["src/composition/**/*.ts"],
      symbol: ["function"],
      reference: {
        type: "markdown",
        files: ["docs/instructions/*.md"],
        symbol: "h2",
      },
    });
  return claims;
}
