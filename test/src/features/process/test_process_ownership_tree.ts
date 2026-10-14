import { ProcessOwnership } from "@automovie/viewer/process/ProcessOwnership";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * A creation-ordered ownership tree excludes stale parent links caused by PID
 * reuse while retaining genuine descendants independently of snapshot order.
 * This pure admission test performs no process discovery or termination.
 *
 * Scenarios:
 *
 * 1. A root, child and grandchild are admitted parent first; an unrelated
 *    process, an older child and its later child stay outside that boundary.
 * 2. An equal creation stamp cannot establish a child edge, and a child of a
 *    newer reused intermediate PID remains excluded.
 * 3. Missing or reused roots, duplicate PIDs, malformed stamps and invalid
 *    positive-integer PID inputs refuse before producing a termination plan.
 * 4. Adjacent large creation ticks remain distinct beyond Number's exact range.
 * 5. Public discovery and stop refuse malformed authority before any OS effect.
 * 6. Siblings preserve snapshot order ahead of their descendants, so an indexed
 *    traversal must keep the same parent-first breadth order.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the production pure ownership-tree facade and checks admitted records/order, unchanged input and exact refusal boundaries; invalid public discovery/stop selectors are exercised before any native transport can run.
 * @evidence contracts/testing.md#independent-expectations Authored pid/parent/birth facts independently define strictly-newer ancestry, exact root identity and breadth order; literal expected descendants catch stale links, rounded ticks and sibling-order drift. These immutable value cases do not prove a live OS snapshot, namespace locking or termination.
 * @evidence contracts/testing.md#distinguishing-cases Covers reordered snapshot, genuine child/grandchild, unrelated/older/equal/newer-reused edges, adjacent beyond-safe-integer births, singleton/missing/reused root, duplicates, malformed birth and invalid numeric/empty-authority inputs; native transport and capture-object authority are covered by neighboring process units.
 * @evidence contracts/testing.md#execution-ownership The named exported unit entry invokes maintained production source with literal record arrays and invalid pre-effect selectors; it starts no child process, OS host, browser or GPU and creates no dynamically registered case.
 */
export function test_process_ownership_tree(): void {
  const root: { pid: number; createdAt: string } = { pid: 10, createdAt: "100" };
  const snapshot: Array<{ pid: number; parentPid: number; createdAt: string }> = [
    { pid: 30, parentPid: 20, createdAt: "300" },
    { pid: 10, parentPid: 1, createdAt: "100" },
    { pid: 50, parentPid: 40, createdAt: "200" },
    { pid: 40, parentPid: 10, createdAt: "90" },
    { pid: 20, parentPid: 10, createdAt: "200" },
    { pid: 60, parentPid: 1, createdAt: "250" },
    { pid: 70, parentPid: 10, createdAt: "100" },
    { pid: 80, parentPid: 20, createdAt: "150" },
  ];
  const before: typeof snapshot = structuredClone(snapshot);
  TestValidator.equals("creation-ordered descendants", ProcessOwnership.tree(snapshot, root), [
    root, { pid: 20, createdAt: "200" }, { pid: 30, createdAt: "300" },
  ]);
  TestValidator.equals("snapshot remains owned by caller", snapshot, before);
  const largeRoot: typeof root = { pid: 10, createdAt: "63927358885700106" };
  TestValidator.equals("adjacent microseconds preserve ancestry", ProcessOwnership.tree([
    { ...largeRoot, parentPid: 1 },
    { pid: 20, parentPid: 10, createdAt: "63927358885700107" },
    { pid: 30, parentPid: 10, createdAt: "63927358885700105" },
    { pid: 40, parentPid: 10, createdAt: "63927358885700106" },
  ], largeRoot), [largeRoot, { pid: 20, createdAt: "63927358885700107" }]);
  TestValidator.equals("sibling snapshot order precedes every descendant", ProcessOwnership.tree([
    { pid: 30, parentPid: 20, createdAt: "300" },
    { ...root, parentPid: 1 },
    { pid: 20, parentPid: 10, createdAt: "200" },
    { pid: 40, parentPid: 10, createdAt: "150" },
  ], root), [root, { pid: 20, createdAt: "200" }, { pid: 40, createdAt: "150" }, { pid: 30, createdAt: "300" }]);
  TestValidator.equals("a root with no children", ProcessOwnership.tree([snapshot[1]!], root), [root]);
  TestValidator.predicate("missing root refused", throwsError((): ReturnType<typeof ProcessOwnership.tree> => ProcessOwnership.tree([], root), "exited"));
  TestValidator.predicate("reused root refused", throwsError((): ReturnType<typeof ProcessOwnership.tree> => ProcessOwnership.tree(snapshot, { pid: 10, createdAt: "99" }), "reused"));
  TestValidator.predicate("duplicate PID refused", throwsError((): ReturnType<typeof ProcessOwnership.tree> => ProcessOwnership.tree([...snapshot, snapshot[1]!], root), "ambiguous"));
  for (const createdAt of ["", "-1", "1.2", "NaN", "Infinity"])
    TestValidator.predicate("invalid creation stamp refused", throwsError((): ReturnType<typeof ProcessOwnership.tree> => ProcessOwnership.tree([{ pid: 10, parentPid: 1, createdAt }], root), "ambiguous"));
  for (const pid of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    TestValidator.predicate("invalid root PID refused", throwsError((): ReturnType<typeof ProcessOwnership.tree> => ProcessOwnership.tree(snapshot, { pid, createdAt: "100" }), "integer"));
    TestValidator.predicate("invalid snapshot PID refused", throwsError((): ReturnType<typeof ProcessOwnership.tree> => ProcessOwnership.tree([{ pid, parentPid: 1, createdAt: "100" }], root), "integer"));
  }
  TestValidator.predicate("public discovery refuses invalid selector", throwsError((): string | null => ProcessOwnership.read(0), "integer"));
  TestValidator.predicate("public stop refuses invalid selector", throwsError((): void => ProcessOwnership.stop(0, "birth"), "integer"));
  TestValidator.predicate("public stop refuses absent authority", throwsError((): void => ProcessOwnership.stop(10, ""), "identity"));
}
