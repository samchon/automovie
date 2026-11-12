import * as motions from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import LEDGER from "../internal/MOTION_HUMAN_LEDGER.json";

/**
 * The coverage ledger of the motions safety net names everything there is
 * to cover: every action law, and every function and constant of the
 * composition and posture owners.
 *
 * The ledger lists, per symbol and per law row, the tests that exercise it,
 * so a line without a test is open work that can be read off. That reading
 * is only worth something while no law and no member is missing from the
 * list, which is what this case pins against the package's own registry and
 * its own runtime members.
 *
 * Scenarios:
 * 1. The ledger's laws are exactly the registry's action names, each once
 *    and each with its `default` row.
 * 2. Every symbol the ledger names exists in the package, so no line is
 *    stale.
 * 3. Every runtime member of an `AutoMovieMotion` composition owner, and of
 *    every posture owner the ledger names, is a line of the ledger.
 * 4. Every check a law states is defined, a check with a detector names the
 *    test that proves the detector complains, and every test named anywhere
 *    is a test's name.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the package's registry and namespaces at run time; a law added without a ledger line, a member added without one, or a line left behind by a removal fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected lists are the package's own keys, never a copy kept beside the ledger.
 * @evidence contracts/development/testing.md#distinguishing-cases Laws, namespace members, owners that are one function, checks and test names are each compared on their own.
 * @evidence contracts/development/testing.md#execution-ownership In memory on the imported package and one JSON file.
 * @evidence contracts/development/common.md#meaningful-documentation States why completeness is what makes the ledger readable and lists the 4 scenarios.
 */
export function test_motion_human_ledger(): void {
  const order = (a: string, b: string): number => a.localeCompare(b);
  const exported: Record<string, unknown> = motions as unknown as Record<
    string,
    unknown
  >;
  const members = (owner: string): string[] => {
    const value: unknown = exported[owner];
    const keys: string[] =
      (typeof value === "object" || typeof value === "function") &&
      value !== null
        ? Object.keys(value)
        : [];
    return [
      ...(typeof value === "function" ? [owner] : []),
      ...keys.map((key: string): string => `${owner}.${key}`),
    ];
  };

  // 1. The laws.
  TestValidator.equals(
    "the ledger's laws are the registry's",
    LEDGER.laws.map((law: { law: string }): string => law.law).sort(order),
    Object.keys(motions.HUMAN_ACTIONS).sort(order),
  );
  TestValidator.equals(
    "every law has its default row",
    LEDGER.laws
      .filter(
        (law: { rows: { row: string }[] }): boolean =>
          law.rows.filter(
            (row: { row: string }): boolean => row.row === "default",
          ).length !== 1,
      )
      .map((law: { law: string }): string => law.law),
    [],
  );

  // 2. No stale line.
  const listed: string[] = LEDGER.primitives.map(
    (line: { symbol: string }): string => line.symbol,
  );
  TestValidator.equals(
    "every symbol of the ledger exists",
    listed.filter((symbol: string): boolean => {
      const [owner, member] = symbol.split(".") as [string, string?];
      const value: unknown = exported[owner];
      return member === undefined
        ? typeof value !== "function"
        : value === null ||
            value === undefined ||
            !(member in (value as Record<string, unknown>));
    }),
    [],
  );

  // 3. No missing member.
  const owners: string[] = [
    ...new Set<string>([
      ...Object.keys(exported).filter(
        (key: string): boolean =>
          /^(compose)?AutoMovieMotion/u.test(key) &&
          !key.startsWith("AutoMovieMotionHumanAudit"),
      ),
      ...LEDGER.primitives
        .filter((line: { layer: string }): boolean => line.layer === "posture")
        .map((line: { symbol: string }): string => line.symbol.split(".")[0]!),
    ]),
  ];
  TestValidator.equals(
    "every member of an owner is a line",
    owners
      .flatMap(members)
      .filter((symbol: string): boolean => !listed.includes(symbol))
      .sort(order),
    [],
  );

  // 4. Checks and test names.
  const checks: Record<
    string,
    { detector: string | null; proof: string | null }
  > = LEDGER.checks;
  TestValidator.equals(
    "every check a law states is defined",
    [
      ...new Set<string>(
        LEDGER.laws.flatMap(
          (law: { checks: string[] }): string[] => law.checks,
        ),
      ),
    ].filter((check: string): boolean => !(check in checks)),
    [],
  );
  TestValidator.equals(
    "a check with a detector names its proof",
    Object.entries(checks)
      .filter(
        ([, check]: [
          string,
          { detector: string | null; proof: string | null },
        ]): boolean => (check.detector === null) !== (check.proof === null),
      )
      .map(([name]: [string, unknown]): string => name),
    [],
  );
  const named: string[] = [
    ...LEDGER.primitives.flatMap(
      (line: { tests: string[] }): string[] => line.tests,
    ),
    ...LEDGER.laws.flatMap(
      (law: { rows: { tests: string[]; audit: string[] }[] }): string[] =>
        law.rows.flatMap(
          (row: { tests: string[]; audit: string[] }): string[] => [
            ...row.tests,
            ...row.audit,
          ],
        ),
    ),
    ...Object.values(checks).flatMap(
      (check: { proof: string | null }): string[] =>
        check.proof === null ? [] : [check.proof],
    ),
  ];
  TestValidator.equals(
    "every test named is a test's name",
    named.filter(
      (name: string): boolean => !/^test_(human_)?motion_[a-z_]+$/u.test(name),
    ),
    [],
  );
}
