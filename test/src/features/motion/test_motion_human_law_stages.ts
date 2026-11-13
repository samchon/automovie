import { HUMAN_ACTIONS } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MOTION_HUMAN_LAW_STAGES } from "../internal/MOTION_HUMAN_LAW_STAGES";
import { motionHumanLawSweep } from "../internal/motionHumanLawSweep";

/**
 * The law sweep leaves no law and no row out: every action of the registry
 * is staged by exactly one family, and every row the coverage ledger lists
 * for it is staged with the parameter the row sets.
 *
 * The sweep tests are only a safety net while this holds, because a law
 * without a stage is never performed and a row whose parameter its stage
 * ignores is performed as the default under another name.
 *
 * Scenarios:
 * 1. The laws staged over all families are exactly the registry's actions,
 *    each once.
 * 2. Staging every ledger row of every law, without performing it, leaves no
 *    law without a stage, no row whose parameter was never asked for and no
 *    stage that throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds every row's real scene; a law added to the registry, a row added to the ledger or a stage that drops a parameter fails with its name.
 * @evidence contracts/development/testing.md#independent-expectations The expected laws are the package's registry keys and the rows are the ledger's, neither kept beside the stages.
 * @evidence contracts/development/testing.md#distinguishing-cases Missing laws, doubled laws and unstaged rows are compared separately.
 * @evidence contracts/development/testing.md#execution-ownership In memory; no film is performed.
 * @evidence contracts/development/common.md#meaningful-documentation States why completeness makes the sweep a safety net and lists the 2 scenarios.
 */
export function test_motion_human_law_stages(): void {
  const order = (a: string, b: string): number => a.localeCompare(b);
  const staged: string[] = Object.values(MOTION_HUMAN_LAW_STAGES).flatMap(
    (table: Readonly<Record<string, motionHumanLawSweep.Stage>>): string[] =>
      Object.keys(table),
  );

  // 1. Every law once.
  TestValidator.equals(
    "the staged laws are the registry's, each once",
    [...staged].sort(order),
    Object.keys(HUMAN_ACTIONS).sort(order),
  );

  // 2. Every row staged.
  TestValidator.equals(
    "every ledger row is staged with its parameter",
    motionHumanLawSweep.unstaged(
      Object.assign({}, ...Object.values(MOTION_HUMAN_LAW_STAGES)) as Record<
        string,
        motionHumanLawSweep.Stage
      >,
    ),
    [],
  );
}
