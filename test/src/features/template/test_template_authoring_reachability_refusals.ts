import {
  AUTO_MOVIE_AUTHORING_REACHABILITY,
  type IAutoMovieAuthoringReachabilityRow,
  inspectAutoMovieAuthoringReachability,
} from "@automovie/template";
import { TestValidator } from "@nestia/e2e";

/**
 * Route admission rejects contradictions at their kind/capability addresses
 * while retaining the complete advertised population as the positive twin.
 *
 * Scenarios:
 *
 * 1. Duplicates, omitted rows, unknown grammars and invalid field addresses fail.
 * 2. Empty, blank or repeated choices and missing supported route facts fail.
 * 3. Unknown routes and repository-owned paths cannot pose as generated routes.
 * 4. Inapplicability has a concrete reason and cannot also advertise any route.
 */
export const test_template_authoring_reachability_refusals = (): void => {
  const rows = AUTO_MOVIE_AUTHORING_REACHABILITY;
  TestValidator.equals("positive complete plan", inspectAutoMovieAuthoringReachability(rows), []);
  const supported = rows.find((row) => row.kind === "film" && row.capability === "settings")!;
  const field = rows.find((row) => row.kind === "film" && row.capability === "production-design-field")!;
  const excluded = rows.find((row) => row.kind === "library" && row.capability === "camera-actions")!;
  TestValidator.predicate("subjects have intended states",
    supported.inapplicableReason === null && field.field !== null && excluded.inapplicableReason !== null);
  const replaced = (base: IAutoMovieAuthoringReachabilityRow,
    patch: Partial<IAutoMovieAuthoringReachabilityRow>): string[] =>
    inspectAutoMovieAuthoringReachability(rows.map((row) => row === base ? { ...base, ...patch } : row));
  const cases: Array<[IAutoMovieAuthoringReachabilityRow, Partial<IAutoMovieAuthoringReachabilityRow>, string]> = [
    [supported, { kind: "unknown" as IAutoMovieAuthoringReachabilityRow["kind"] }, "unknown production kind"],
    [supported, { capability: "unknown" as IAutoMovieAuthoringReachabilityRow["capability"] }, "unknown capability"],
    [field, { field: null }, "must name one production design field"],
    [field, { field: "unknown" as IAutoMovieAuthoringReachabilityRow["field"] }, "must name one production design field"],
    [supported, { field: field.field }, "takes no production design field"],
    [supported, { choices: [] }, "invalid closed choices"],
    [supported, { choices: [" "] }, "invalid closed choices"],
    [supported, { choices: ["a", "a"] }, "invalid closed choices"],
    [supported, { owner: null }, "no owner"],
    [supported, { input: " " }, "no input"],
    [supported, { consumer: null }, "no consumer"],
    [supported, { route: null }, "no route"],
    [supported, { route: "missing.md" as IAutoMovieAuthoringReachabilityRow["route"] }, "unknown generated-project route"],
    [supported, { owner: "packages/engine" }, "repository path"],
    [excluded, { inapplicableReason: " " }, "blank inapplicable reason"],
  ];
  for (const [base, patch, expected] of cases)
    TestValidator.predicate(expected, replaced(base, patch).some((text) => text.includes(expected)));
  for (const patch of [{ choices: ["a"] }, { owner: "src" }, { input: "value" },
    { consumer: "consumer" }, { route: "README.md" }] satisfies Partial<IAutoMovieAuthoringReachabilityRow>[])
    TestValidator.predicate("inapplicability cannot claim a route",
      replaced(excluded, patch).some((text) => text.includes("mixes an inapplicable reason")));
  TestValidator.predicate("duplicate address refused",
    inspectAutoMovieAuthoringReachability([...rows, supported]).some((text) => text.includes("is duplicated")));
  TestValidator.predicate("missing address refused",
    inspectAutoMovieAuthoringReachability(rows.filter((row) => row !== supported)).some((text) => text.includes("is missing")));
};
