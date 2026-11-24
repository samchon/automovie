import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import { SKILLS_ROOT } from "./internal/SKILLS_ROOT";

/**
 * Creates fresh source/test claims against the project's own checklists.
 *
 * Use the result when extending, rather than replacing, the default engineering
 * population. Every exported source declaration and test answers the common
 * checklist, except scenes, films and catalog cases under `src/composition/`,
 * which realize a screenplay rather than serve callers and document that
 * realization under their own composition, films and catalog contracts;
 * exported types, interfaces and classes also answer the design
 * checklist, exported functions and class methods the implementation checklist,
 * and exported test functions the testing checklist. The paths are read from
 * the skills tree at `skills`, by default the production's own
 * `.agents/skills`; a workspace production names the shared tree at the
 * workspace root instead, such as `../../../.agents/skills`. By default the
 * paths are the scaffold's
 * `contracts/development/{common,design,implementation,testing}.md`.
 *
 * Each claim selects exactly the declarations that owe its checklists, so tests
 * answer common and testing in one claim, while source types and functions,
 * which owe different checklists, share common through a separate claim; a
 * claim reports an answer on a declaration outside its population as unhosted. A production created before that layout passes its
 * own paths instead, such as `common: null` with one `contracts/common.md` for
 * both design and implementation, which then selects types and functions in a
 * single claim as before.
 */
export function createEngineeringClaims(
  props: {
    /**
     * Shared documentation checklist path from `skills`, answered by every
     * selected source declaration and test; `null` selects none.
     */
    common?: string | null;

    /** Design checklist path from `skills`, answered by source types. */
    design?: string;

    /**
     * Implementation checklist path from `skills`, answered by source
     * functions.
     */
    implementation?: string;

    /** Testing checklist path from `skills`, answered by tests. */
    tests?: string;

    /**
     * Reference root of the skills tree holding the checklists, relative to
     * the directory of `evidence.config.ts` with `/` separators; `..` segments
     * reach a workspace's shared tree.
     *
     * @default ".agents/skills"
     */
    skills?: string;
  } = {},
): IEvidenceClaim[] {
  const common: string | null =
    props.common === undefined
      ? "contracts/development/common.md"
      : props.common;
  const design: string = props.design ?? "contracts/development/design.md";
  const implementation: string =
    props.implementation ?? "contracts/development/implementation.md";
  const checklist = (...files: string[]): IEvidenceClaim["reference"] => ({
    type: "markdown",
    root: props.skills ?? SKILLS_ROOT,
    files,
    symbol: "h2",
    checklist: true,
  });
  const tests: string = props.tests ?? "contracts/development/testing.md";
  return [
    ...(design === implementation
      ? [
          {
            name: "production source",
            type: "typescript",
            files: ["src/**/*.ts"],
            symbol: ["type", "function"],
            reference: checklist(design),
          } satisfies IEvidenceClaim,
        ]
      : [
          {
            name: "production types",
            type: "typescript",
            files: ["src/**/*.ts"],
            symbol: "type",
            reference: checklist(design),
          } satisfies IEvidenceClaim,
          {
            name: "production functions",
            type: "typescript",
            files: ["src/**/*.ts"],
            symbol: "function",
            reference: checklist(implementation),
          } satisfies IEvidenceClaim,
        ]),
    {
      name: "production tests",
      type: "typescript",
      files: ["test/**/test_*.ts"],
      symbol: "function",
      reference: common === null ? checklist(tests) : checklist(common, tests),
    },
    ...(common === null
      ? []
      : [
          {
            name: "production documentation",
            type: "typescript",
            files: ["src/**/*.ts", "!src/composition/**"],
            symbol: ["type", "function"],
            reference: checklist(common),
          } satisfies IEvidenceClaim,
        ]),
  ];
}
