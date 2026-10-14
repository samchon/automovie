import {
  type IScaffoldPublicationEntry,
  type IScaffoldPublicationReceipt,
  type ScaffoldFilePublicationOutcome,
  ScaffoldPublicationError,
  planScaffoldPublication,
  publishScaffoldCandidate,
} from "@automovie/template";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { throwsError } from "../internal/predicates";

/**
 * A scaffold candidate is validated before mutation, published in order up to its first non-completed entry, and every adapter outcome outside the contract is refused.
 *
 * Scenarios:
 *
 * 1. Planning keeps insertion order, encodes UTF-8, resolves targets below the root, and freezes entries; it refuses the root itself, escapes, NUL, non-text content, case-only repeats, and a file below another file even when an unrelated path sorts between them, while siblings that share a prefix are admitted. On Windows, an absolute contained key whose root spelling differs only by case terminates the ancestor walk.
 * 2. Publishing reports `completed`, a first-entry `refused`, and `partial` for a refusal after a completion or a partial slot, and never calls the publisher after the stop.
 * 3. A frozen entry is reused by reference and an unfrozen one is copied, so a later mutation of the caller's array does not reach the receipt.
 * 4. Outcomes without a parent identity, with an unknown refusal reason, with a byte count outside the entry, or with an unknown status throw.
 * 5. `ScaffoldPublicationError` keeps the receipt, chains the stopping cause, and names the completed and stopping entries.
 *
 * @evidence contracts/testing.md#behavioral-verification The test calls `planScaffoldPublication`, `publishScaffoldCandidate`, and the `ScaffoldPublicationError` constructor and asserts their returned entries, receipts, thrown refusals, and error fields, catching a missed collision, a wrong candidate-wide status, a call after the stop, a shared mutable entry, or an adapter outcome accepted against the contract.
 * @evidence contracts/testing.md#independent-expectations U+00E9 encodes as the independently written UTF-8 bytes 0xc3,0xa9; targets come from path.join of literal root segments and statuses from the receipt's derivation rule. The Windows root-case expectation uses that platform's case-insensitive path identity without deriving termination from the planner; other hosts do not exercise Windows path semantics.
 * @evidence contracts/testing.md#distinguishing-cases Each refusal has an admitted neighbour: a-b beside a/c is admitted while adding a collides, A.txt collides with a.txt while ab and a/b coexist, and a partial count at entry length is admitted while one past it refuses. The empty candidate and first-versus-second refusal cover status boundaries; Windows alone exercises a case-equivalent absolute root spelling. Filesystem publication belongs to test_template_scaffold_publication_files and test_template_scaffold_publication_force.
 * @evidence contracts/testing.md#execution-ownership This unit test runs in-process with a recording callback as the publisher and touches no file system or native adapter; it is discovered as an exported `test_` function under `features/template`.
 */
export function test_template_scaffold_publication_candidate(): void {
  const root: string = path.resolve("/scaffold-root");
  const plan: (
    files: Record<string, unknown>,
  ) => readonly IScaffoldPublicationEntry[] = (
    files: Record<string, unknown>,
  ): readonly IScaffoldPublicationEntry[] =>
    planScaffoldPublication({
      files: files as Record<string, string>,
      root,
    });

  // 1. planning
  const entries: readonly IScaffoldPublicationEntry[] = plan({
    "z.txt": "é",
    "a/b.txt": "",
  });
  TestValidator.equals(
    "insertion order and lexical targets",
    entries.map((entry: IScaffoldPublicationEntry): string => entry.target),
    [path.join(root, "z.txt"), path.join(root, "a", "b.txt")],
  );
  TestValidator.equals("UTF-8 bytes", [...entries[0]!.bytes], [0xc3, 0xa9]);
  TestValidator.equals("empty content", [...entries[1]!.bytes], []);
  TestValidator.predicate(
    "entries and bytes are frozen",
    Object.isFrozen(entries) &&
      entries.every(
        (entry: IScaffoldPublicationEntry): boolean =>
          Object.isFrozen(entry) && Object.isFrozen(entry.bytes),
      ),
  );
  TestValidator.equals("empty map", plan({}).length, 0);
  if (process.platform === "win32") {
    const upperRoot: string = root.toUpperCase();
    const lowerTarget: string = path.join(root.toLowerCase(), "nested", "file");
    const differentlyCased: readonly IScaffoldPublicationEntry[] =
      planScaffoldPublication({
        files: { [lowerTarget]: "case-equivalent root" },
        root: upperRoot,
      });
    TestValidator.equals(
      "Windows case-equivalent root terminates the ancestor walk",
      differentlyCased.map(
        (entry: IScaffoldPublicationEntry): string => entry.target,
      ),
      [lowerTarget],
    );
  }
  for (const relative of ["", ".", "..", "../x", "a/../../x"])
    TestValidator.predicate(
      `refuses escape ${JSON.stringify(relative)}`,
      throwsError(
        (): unknown => plan({ [relative]: "x" }),
        "refusing to write outside",
      ),
    );
  TestValidator.predicate(
    "refuses an absolute key outside the root",
    throwsError(
      (): unknown => plan({ [path.resolve("/elsewhere/x")]: "x" }),
      "refusing to write outside",
    ),
  );
  TestValidator.predicate(
    "refuses NUL",
    throwsError((): unknown => plan({ "a\0b": "x" }), "invalid scaffold path"),
  );
  TestValidator.predicate(
    "refuses non-text content",
    throwsError((): unknown => plan({ a: 1 }), "not text"),
  );
  TestValidator.predicate(
    "case-only repeat collides",
    throwsError(
      (): unknown => plan({ "A.txt": "1", "a.txt": "2" }),
      "scaffold paths collide: A.txt, a.txt",
    ),
  );
  TestValidator.predicate(
    "file below a file collides across an interleaved sibling",
    throwsError(
      (): unknown => plan({ "a/c": "1", "a-b": "2", a: "3" }),
      "scaffold paths collide: a, a/c",
    ),
  );
  TestValidator.predicate(
    "file below a case-variant file collides",
    throwsError(
      (): unknown => plan({ "Dir/x/y": "1", dir: "2" }),
      "scaffold paths collide: dir, Dir/x/y",
    ),
  );
  TestValidator.equals(
    "prefix-sharing siblings are admitted",
    plan({ "a-b": "1", "a/c": "2", ab: "3", "a/b": "4" }).length,
    4,
  );

  // 2. publication statuses and the stop rule
  const publish: (
    candidate: readonly IScaffoldPublicationEntry[],
    outcomes: readonly ScaffoldFilePublicationOutcome[],
  ) => IRecordedPublication = (
    candidate: readonly IScaffoldPublicationEntry[],
    outcomes: readonly ScaffoldFilePublicationOutcome[],
  ): IRecordedPublication => {
    let calls: number = 0;
    const receipt: IScaffoldPublicationReceipt = publishScaffoldCandidate({
      candidate,
      publish: (): ScaffoldFilePublicationOutcome => outcomes[calls++]!,
    });
    return { calls, receipt };
  };
  const three: readonly IScaffoldPublicationEntry[] = plan({
    one: "1",
    two: "22",
    three: "333",
  });
  const done: ScaffoldFilePublicationOutcome = {
    parentIdentity: "1:2",
    status: "completed",
  };
  const cause: Error = new Error("native cause");
  const refused: ScaffoldFilePublicationOutcome = {
    error: cause,
    reason: "target-competitor",
    status: "refused",
  };

  const all: IRecordedPublication = publish(three, [done, done, done]);
  TestValidator.equals("all completed", all.receipt.status, "completed");
  TestValidator.equals("no failure", all.receipt.failure, null);
  TestValidator.predicate(
    "completed list is the planned list",
    all.receipt.completed.length === 3 &&
      all.receipt.completed.every(
        (
          completed: IScaffoldPublicationReceipt["completed"][number],
          index: number,
        ): boolean =>
          completed.entry === all.receipt.planned[index] &&
          completed.parentIdentity === "1:2",
      ),
  );
  TestValidator.equals(
    "empty candidate completes",
    publish([], []).receipt.status,
    "completed",
  );

  const first: IRecordedPublication = publish(three, [refused]);
  TestValidator.equals("first refusal", first.receipt.status, "refused");
  TestValidator.equals("stops after the refusal", first.calls, 1);
  TestValidator.equals(
    "failure names the first entry",
    first.receipt.failure?.entry.relative,
    "one",
  );

  const second: IRecordedPublication = publish(three, [done, refused]);
  TestValidator.equals(
    "refusal after completion",
    second.receipt.status,
    "partial",
  );
  TestValidator.equals("stops at the second entry", second.calls, 2);
  TestValidator.equals("one completed", second.receipt.completed.length, 1);

  const partial: IRecordedPublication = publish(three, [
    { bytesWritten: 1, error: cause, parentIdentity: "1:2", status: "partial" },
  ]);
  TestValidator.equals(
    "first-entry partial",
    partial.receipt.status,
    "partial",
  );
  TestValidator.equals(
    "byte count at the entry length is admitted",
    publish(three, [
      done,
      {
        bytesWritten: 2,
        error: cause,
        parentIdentity: "1:2",
        status: "partial",
      },
    ]).receipt.status,
    "partial",
  );

  // 3. reuse of frozen entries, copy of mutable ones
  TestValidator.predicate(
    "frozen entries are reused",
    all.receipt.planned.every(
      (entry: IScaffoldPublicationEntry, index: number): boolean =>
        entry === three[index],
    ),
  );
  const mutableBytes: number[] = [1, 2];
  const mutable: IScaffoldPublicationEntry = {
    bytes: mutableBytes,
    relative: "m",
    target: path.join(root, "m"),
  };
  const copied: IRecordedPublication = publish([mutable], [done]);
  mutableBytes[0] = 9;
  TestValidator.predicate(
    "mutable entry is copied and frozen",
    copied.receipt.planned[0] !== mutable &&
      Object.isFrozen(copied.receipt.planned[0]) &&
      copied.receipt.planned[0]!.bytes[0] === 1,
  );

  // 4. outcomes outside the contract
  const invalid: readonly [string, ScaffoldFilePublicationOutcome][] = [
    ["completed without parent", { parentIdentity: "", status: "completed" }],
    [
      "unknown refusal reason",
      {
        error: cause,
        reason: "gone" as "create-failed",
        status: "refused",
      },
    ],
    [
      "partial without parent",
      { bytesWritten: 0, error: cause, parentIdentity: "", status: "partial" },
    ],
    [
      "partial past the entry",
      {
        bytesWritten: 2,
        error: cause,
        parentIdentity: "1:2",
        status: "partial",
      },
    ],
    [
      "negative partial",
      {
        bytesWritten: -1,
        error: cause,
        parentIdentity: "1:2",
        status: "partial",
      },
    ],
    [
      "fractional partial",
      {
        bytesWritten: 0.5,
        error: cause,
        parentIdentity: "1:2",
        status: "partial",
      },
    ],
    [
      "unknown status",
      {
        parentIdentity: "1:2",
        status: "pending",
      } as unknown as ScaffoldFilePublicationOutcome,
    ],
  ];
  for (const [title, outcome] of invalid)
    TestValidator.predicate(
      `refuses ${title}`,
      throwsError((): unknown => publish(three, [outcome]), "one"),
    );

  // 5. the throwing form's error
  const error: ScaffoldPublicationError = new ScaffoldPublicationError(
    second.receipt,
  );
  TestValidator.predicate(
    "error keeps the receipt and the cause",
    error.receipt === second.receipt &&
      error.cause === cause &&
      error.name === "ScaffoldPublicationError",
  );
  TestValidator.predicate(
    "error message names completed and stopping entries",
    error.message.startsWith("scaffold publication partial: ") &&
      error.message.includes(`"relative":"one"`) &&
      error.message.includes(`"reason":"target-competitor"`) &&
      error.message.includes(`"relative":"two"`),
  );
}

interface IRecordedPublication {
  calls: number;
  receipt: IScaffoldPublicationReceipt;
}
