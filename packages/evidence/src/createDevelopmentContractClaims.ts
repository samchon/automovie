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
 * and requires each to answer every item of its checklist under
 * `contracts/development/` in its doc comment, read from the skills tree at
 * `props.skills`, by default the production's own `.agents/skills`. Entities
 * answer `entities.md` with their types, classes, functions and methods,
 * because an entity is a class whose methods are its capabilities. Behaviors
 * (laws, interactions and consequences) answer `behaviors.md`. For skilled
 * practice, the studied laws answer cites the observations used to coordinate
 * even installed actions. A study can also serve the screenplay alone. Scenes
 * answer `composition.md` and cite the screenplay scene file, or the sections
 * and beats of it they realize, and every H2 section and H3 beat must be
 * realized; screenplay films answer `films.md` and cite each scene file they
 * order, and every scene file must belong to a film. Catalog cases and the
 * catalog film answer `catalog.md` alone. With `instructions`, the composition
 * and entities must also realize every instruction section, which no narrative
 * layer then cites, with no exclusion. The public configuration adds coverage
 * of the route's subject records when entities or composition are submitted.
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
     * Whether, with an enabled composition stage, the composition and entities
     * must also realize every instruction section, as under narrative mode
     * none, where no narrative layer cites them. The caller passes it only when
     * `docs/instructions/` exists, because an empty reference fails the graph.
     */
    instructions?: boolean;
  } = {},
): IEvidenceClaim[] {
  const screenplay: string[] = ["docs/body/screenplay/**/*.md"];
  const populations: {
    stage: keyof IAutoMovieDevelopmentProps;
    name: string;
    checklist: string;
    files: string[];
    symbol: EvidenceProgrammingSymbol[];
    cited?: IEvidenceMarkdownReference;
  }[] = [
    {
      stage: "entities",
      name: "entities",
      checklist: "entities",
      files: ["src/entities/**/*.ts"],
      symbol: ["type", "function"],
    },
    {
      stage: "behaviors",
      name: "behaviors",
      checklist: "behaviors",
      files: [
        "src/laws/**/*.ts",
        "src/interactions/**/*.ts",
        "src/consequences/**/*.ts",
      ],
      symbol: ["function"],
    },
    {
      stage: "composition",
      name: "scenes",
      checklist: "composition",
      files: [
        "src/composition/scenes/**/*.ts",
        "!src/composition/scenes/catalog/**",
      ],
      symbol: ["function"],
      cited: { type: "markdown", files: screenplay, symbol: ["h2", "h3"] },
    },
    {
      stage: "composition",
      name: "films",
      checklist: "films",
      files: [
        "src/composition/films/**/*.ts",
        "!src/composition/films/catalog.ts",
      ],
      symbol: ["function"],
      cited: { type: "markdown", files: screenplay, symbol: "file" },
    },
    {
      stage: "composition",
      name: "review catalog",
      checklist: "catalog",
      files: [
        "src/composition/scenes/catalog/**/*.ts",
        "src/composition/films/catalog.ts",
      ],
      symbol: ["function"],
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
            files: [`contracts/development/${entry.checklist}.md`],
            symbol: "h2",
            checklist: true,
          },
          ...(entry.cited === undefined ? [] : [structuredClone(entry.cited)]),
        ],
      }),
    );
  if (props.instructions === true && props.composition === "evidence")
    claims.push({
      name: "the code realizes every instruction section",
      type: "typescript",
      files: [
        "src/composition/**/*.ts",
        "!src/composition/scenes/catalog/**",
        "!src/composition/films/catalog.ts",
        "src/entities/**/*.ts",
      ],
      symbol: ["type", "function"],
      reference: {
        type: "markdown",
        files: ["docs/instructions/*.md"],
        symbol: "h2",
        noEvidenceExclude: true,
      },
    });
  return claims;
}
