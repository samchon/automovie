import {
  HUMAN_LEXICON,
  HUMAN_LEXICON_SCHEMAS,
  HumanPerformanceParams,
  HumanRefusal,
} from "@automovie/motions";

import { LexiconRowNet } from "./LexiconRowNet";

/** Families whose positive tests cover defaults by staging the row or verifying its exact dispatch to a tested law. */
const BARE_FIXTURES: readonly string[] = [
  "blade",
  "carried",
  "drill",
  "emblem",
  "firearm",
  "floorFall",
  "floorRoll",
  "gait",
  "gymnastics",
  "habit",
  "labour",
  "pose",
  "pursuit",
  "social",
  "sport",
  "sportCarry",
  "sportGym",
  "sportSwing",
  "sportThrow",
  "sportWorkout",
  "stageFight",
  "stance",
  "sword",
  "weaponFirearm",
  "weaponMelee",
];

/** A region no humanoid declares. */
const NOWHERE: string = "chest";

/**
 * Missing and invalid-region inputs to the lexicon, verified at the seam
 * that actually observes each fault.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two authoring failures and the seam that judges each.
 * @evidence contracts/development/design.md#principled-representation Parameter admission and law planning are distinct calls, so a refusal of an input shape does not require a prepared performer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One cast for absent input and one for a wrong region on a valid scene.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every row reaches schema admission. A schema refusal ends a probe. Bare rows already covered by positive placement tests or by their default resolver and underlying law are not staged here.
 */
export namespace LexiconAbsentNet {
  /**
   * Exercise absent input for every row, including the rows with no usable
   * bare-parameter planning case in the positive row tests.
   *
   * @returns One complaint per missing schema or invalid refusal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is omitted and what a complaint means.
   * @evidence contracts/development/implementation.md#principled-implementation A schema refusal ends parameter admission before a law runs. For admitted inputs, positive tests cover the default placement or the resolved sport alias and its underlying action. Other admitted rows are planned alone with the omitted parameters.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over families and rows, with one schema probe and at most one plan per row.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The branch that omits planning is restricted to a refusal before planning or a matching positive case.
   * @evidence contracts/development/implementation.md#efficient-algorithms No performer or performance is created for rows a schema refuses. Other skipped plans have an identical positive counterpart.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Positive row cases cover default placements or the default parameter mapping to a tested sport law.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each probe holds its outcome only to build its complaint.
   */
  export function bare(): string[] {
    const complaints: string[] = [];
    for (const [family, rows] of Object.entries(HUMAN_LEXICON)) {
      for (const law of rows) {
        const row: string = law.name;
        if (HUMAN_LEXICON_SCHEMAS.rows[row] === undefined)
          complaints.push(`${row} has no parameter schema`);
        const rejected: unknown = admission(row, {});
        const covered: boolean =
          BARE_FIXTURES.includes(family) &&
          !LexiconRowNet.STAGED.includes(row) &&
          LexiconRowNet.given(row) === undefined;
        const result: unknown =
          rejected === null && !covered
            ? LexiconRowNet.attempt(row, {}, false)
            : rejected;
        const defect: string | null = judge(result);
        if (defect !== null)
          complaints.push(`${row} with no parameters: ${defect}`);
      }
    }
    return complaints;
  }

  /**
   * Substitute an unknown region wherever the authored positive fixture
   * supplies a region. Run the actual law if the shape check admits it.
   *
   * @returns One complaint per invalid refusal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the mutation, when a plan runs and what a complaint means.
   * @evidence contracts/development/implementation.md#principled-implementation Changes only the region strings in the valid scene, using the same partner where there is one. A refused shape and a law's refusal both pass through the same diagnostic check.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One mutation, one admission probe and at most one plan per targeted row.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Skips only rows whose authored fixture supplies no region or whose parameter admission already refuses.
   * @evidence contracts/development/implementation.md#efficient-algorithms One walk over fixture inputs and no plan for an already refused shape.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the positive fixture's parameter record and performer staging.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only local copies and diagnostic strings survive their probe.
   */
  export function regions(): string[] {
    const complaints: string[] = [];
    for (const law of Object.values(HUMAN_LEXICON).flat()) {
      const row: string = law.name;
      const given: object | undefined = LexiconRowNet.given(row);
      const wrong: object | null = misplaced(given);
      if (wrong === null) continue;
      const rejected: unknown = admission(row, wrong);
      const outcome: unknown =
        rejected === null ? LexiconRowNet.attempt(row, wrong) : rejected;
      const defect: string | null = judge(outcome);
      if (defect !== null)
        complaints.push(`${row} on the region ${NOWHERE}: ${defect}`);
    }
    return complaints;
  }
}

/** The shape admission used in performance placement, or its thrown refusal. */
function admission(row: string, given: object): unknown {
  try {
    HumanPerformanceParams.check(row, given);
    return null;
  } catch (error) {
    return error;
  }
}

/** A copy with authored regions replaced, or null if the value supplies none. */
function misplaced(value: unknown): object | null {
  if (typeof value !== "object" || value === null) return null;
  if (Array.isArray(value)) {
    const replacements: (object | null)[] = value.map(misplaced);
    return replacements.some((item: object | null): boolean => item !== null)
      ? replacements.map(
          (item: object | null, index: number): unknown => item ?? value[index],
        )
      : null;
  }
  const replacement: Record<string, unknown> = {};
  let found: boolean = false;
  for (const [key, item] of Object.entries(value)) {
    if (key === "region" && typeof item === "string") {
      replacement[key] = NOWHERE;
      found = true;
    } else {
      const nested: object | null = misplaced(item);
      replacement[key] = nested ?? item;
      found ||= nested !== null;
    }
  }
  return found ? replacement : null;
}

/** A program error or an incomplete refusal is a defect even for bad input. */
function judge(thrown: unknown): string | null {
  if (thrown === null) return null;
  if (!(thrown instanceof HumanRefusal))
    return thrown instanceof Error
      ? `${thrown.name}: ${thrown.message}`
      : String(thrown);
  if (
    thrown.axis.length === 0 ||
    /\bundefined\b/.test(`${thrown.reason} ${thrown.fix}`)
  )
    return thrown.message;
  return null;
}
