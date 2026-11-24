import { AutoMovieCaptureFolder } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { rejectsError } from "../internal/rejectsError";
import { createCaptureMemory } from "./createCaptureMemory";

/**
 * A capture folder owns exactly the files its record lists: it refuses a folder holding anything else without touching it, replaces what an earlier or interrupted capture owns, and writes only names it claimed.
 *
 * Scenarios:
 *
 * 1. A root holding a file no record lists is refused naming the file, and nothing is deleted or written.
 * 2. A root holding only a `rounds` folder opens, and the kept rounds stay.
 * 3. A folder whose `running` record lists two files, only one of which exists, opens and deletes the one, so an interrupted capture is replaced instead of refused.
 * 4. A round's folder holding a file no record lists is refused, and a `rounds` entry inside a round is not owned.
 * 5. A compared round that does not exist, or whose record is still running, is refused before the previous capture's files are deleted.
 * 6. A record that is not JSON is refused naming its path.
 * 7. A claim of a path with a separator, a relative step or the record's own name is refused, and a write of an unclaimed name is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Opens folders through the public class over seeded in-memory storage and reads the refusals, the remaining files and the calls; a folder that deleted foreign files, kept an interrupted capture's leftovers, or deleted before confirming the compared round fails.
 * @evidence contracts/development/testing.md#independent-expectations Ownership is the record's file list, as the class documents; every seeded file is written by this test, so which must remain is known by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases A foreign file against an owned one, the root's `rounds` against a round's, complete against running records, a missing compared round against a present one, and valid against escaping names. The full order of a run is owned by `test_capture_run_order`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_folder_ownership`; it touches only in-memory storage.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_capture_folder_ownership(): Promise<void> {
  const complete: (files: string[]) => string = (files: string[]): string =>
    JSON.stringify({ state: "complete", files, rows: [] });

  // 1. A foreign file.
  const foreign: createCaptureMemory.IMemory = createCaptureMemory({
    "out/record.json": complete(["a.png", "record.json"]),
    "out/a.png": "a",
    "out/notes.txt": "mine",
  });
  TestValidator.predicate(
    "a foreign file refuses the folder",
    await rejectsError(
      (): Promise<unknown> =>
        AutoMovieCaptureFolder.open({
          storage: foreign.storage,
          root: "out",
          round: null,
          compare: null,
        }),
      ["notes.txt"],
    ),
  );
  TestValidator.equals(
    "nothing is deleted or written",
    [
      [...foreign.files.keys()].sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      ),
      foreign.log.filter(
        (call: string): boolean => !/^(mkdir|readdir|readFile) /u.test(call),
      ),
    ],
    [["out/a.png", "out/notes.txt", "out/record.json"], []],
  );

  // 2. Kept rounds.
  const rounds: createCaptureMemory.IMemory = createCaptureMemory({
    "out/rounds/before/record.json": complete([]),
  });
  await AutoMovieCaptureFolder.open({
    storage: rounds.storage,
    root: "out/",
    round: null,
    compare: null,
  });
  TestValidator.predicate(
    "the rounds folder stays",
    rounds.files.has("out/rounds/before/record.json"),
  );

  // 3. An interrupted capture.
  const interrupted: createCaptureMemory.IMemory = createCaptureMemory({
    "out/record.json": JSON.stringify({
      state: "running",
      files: ["a.png", "b.png"],
    }),
    "out/a.png": "a",
  });
  await AutoMovieCaptureFolder.open({
    storage: interrupted.storage,
    root: "out",
    round: null,
    compare: null,
  });
  TestValidator.equals(
    "its files are deleted",
    [...interrupted.files.keys()],
    ["out/record.json"],
  );

  // 4. A round's folder.
  const round: createCaptureMemory.IMemory = createCaptureMemory({
    "out/rounds/r1/stray.png": "x",
    "out/rounds/r2/rounds/x": "x",
  });
  TestValidator.predicate(
    "a foreign file in a round is refused",
    await rejectsError(
      (): Promise<unknown> =>
        AutoMovieCaptureFolder.open({
          storage: round.storage,
          root: "out",
          round: "r1",
          compare: null,
        }),
      ["stray.png"],
    ),
  );
  TestValidator.predicate(
    "rounds inside a round is not owned",
    await rejectsError(
      (): Promise<unknown> =>
        AutoMovieCaptureFolder.open({
          storage: round.storage,
          root: "out",
          round: "r2",
          compare: null,
        }),
      ["rounds"],
    ),
  );

  // 5. The compared round is confirmed before anything is deleted.
  for (const [title, seed] of [
    ["missing", {}],
    [
      "running",
      {
        "out/rounds/before/record.json": JSON.stringify({
          state: "running",
          files: [],
        }),
      },
    ],
  ] as const) {
    const memory: createCaptureMemory.IMemory = createCaptureMemory({
      ...seed,
      "out/record.json": complete(["a.png", "record.json"]),
      "out/a.png": "a",
    });
    TestValidator.predicate(
      `a ${title} compared round is refused`,
      await rejectsError(
        (): Promise<unknown> =>
          AutoMovieCaptureFolder.open({
            storage: memory.storage,
            root: "out",
            round: null,
            compare: "before",
          }),
        ['"before"'],
      ),
    );
    TestValidator.predicate(
      `the previous capture stays when the round is ${title}`,
      memory.files.has("out/a.png"),
    );
  }

  // 6. A malformed record.
  const broken: createCaptureMemory.IMemory = createCaptureMemory({
    "out/record.json": "{ not json",
  });
  TestValidator.predicate(
    "a malformed record is refused",
    await rejectsError(
      (): Promise<unknown> =>
        AutoMovieCaptureFolder.open({
          storage: broken.storage,
          root: "out",
          round: null,
          compare: null,
        }),
      ["out/record.json"],
    ),
  );

  // 7. Names.
  const folder: AutoMovieCaptureFolder = await AutoMovieCaptureFolder.open({
    storage: createCaptureMemory().storage,
    root: "out",
    round: null,
    compare: null,
  });
  for (const name of ["../x.png", "a/b.png", "..", "record.json"])
    TestValidator.predicate(
      `claiming ${name} is refused`,
      await rejectsError((): Promise<unknown> => folder.claim([name]), [name]),
    );
  TestValidator.predicate(
    "an unclaimed write is refused",
    await rejectsError(
      (): Promise<unknown> => folder.write("t.png", "x"),
      ["t.png"],
    ),
  );
}
