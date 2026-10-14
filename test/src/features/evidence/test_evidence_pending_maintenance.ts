import { assertAutoMovieProductionMaintenanceComplete } from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Legacy pending maintenance blocks admission for every observed marker shape.
 *
 * Scenarios:
 *
 * 1. An absent state directory or absent pending marker allows admission.
 * 2. Directory, ordinary-file and symbolic-link pending observations all refuse.
 * 3. A non-directory or symbolic-link state parent refuses before marker admission.
 * 4. Errors other than ENOENT, including non-Error throws, propagate unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls assertAutoMovieProductionMaintenanceComplete through its declared stat seam and observes permitted absence, pending and parent-shape refusals, and exact propagation of observation failures, catching an interrupted tree admitted as complete or an I/O failure treated as absence.
 * @evidence contracts/testing.md#independent-expectations ENOENT is the only absent observation; any resident pending entry blocks admission and the state parent must be an ordinary directory. Literal observation records establish those cases, and identity comparisons pin failure propagation independently of a native filesystem.
 * @evidence contracts/testing.md#distinguishing-cases Covers absence at both metadata reads, three pending shapes, two invalid parent shapes and four thrown failures including EACCES, null and a string; these scalar seams do not prove actual lstat or operating-system link behavior.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_evidence_pending_maintenance entry owns all injected metadata observations through the product's stat parameter, replacing no foreign method and creating no files, installed consumer, native artifact or process.
 */
export function test_evidence_pending_maintenance(): void {
  const directory: ReturnType<NonNullable<Parameters<typeof assertAutoMovieProductionMaintenanceComplete>[1]>> = { isDirectory: (): boolean => true, isSymbolicLink: (): boolean => false };
  const absent: Error & { code: string } = Object.assign(new Error("absent"), { code: "ENOENT" });
  assertAutoMovieProductionMaintenanceComplete("project", (): never => {
    throw absent;
  });
  assertAutoMovieProductionMaintenanceComplete("project", (file: string): typeof directory => {
    if (file.endsWith(".pending.json")) throw absent;
    return directory;
  });
  for (const entry of [
    directory,
    { isDirectory: (): boolean => false, isSymbolicLink: (): boolean => false },
    { isDirectory: (): boolean => false, isSymbolicLink: (): boolean => true },
  ])
    TestValidator.predicate(
      "every pending entry refuses",
      throwsError((): void =>
        assertAutoMovieProductionMaintenanceComplete("project", (file: string): typeof directory =>
          file.endsWith(".pending.json") ? entry : directory,
        ),
      ),
    );
  for (const entry of [
    { isDirectory: (): boolean => false, isSymbolicLink: (): boolean => false },
    { isDirectory: (): boolean => true, isSymbolicLink: (): boolean => true },
  ])
    TestValidator.predicate(
      "unsafe state parent refuses",
      throwsError((): void =>
        assertAutoMovieProductionMaintenanceComplete("project", (): typeof directory => entry),
      ),
    );
  for (const cause of [
    new Error("denied"),
    Object.assign(new Error("denied"), { code: "EACCES" }),
    null,
    "failure",
  ]) {
    let observed: unknown = "not thrown";
    try {
      assertAutoMovieProductionMaintenanceComplete("project", (): never => {
        // eslint-disable-next-line typescript/only-throw-error -- injected host failures must propagate without becoming absence
        throw cause;
      });
    } catch (error) {
      observed = error;
    }
    TestValidator.predicate(
      "observation failures are not absence",
      observed === cause,
    );
  }
}
