import { AutoMovieCaptureFolder } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createCaptureMemory } from "../../capture/createCaptureMemory";
import { rejectsError } from "../../internal/rejectsError";

/**
 * A capture folder owns exactly the files its record lists: it refuses a folder
 * holding anything else without touching it, replaces what an earlier or
 * interrupted capture owns, and writes only names it claimed.
 *
 * Scenarios:
 *
 * 1. A root holding a file no record lists is refused naming the file, and nothing
 *    is deleted or written.
 * 2. A root holding only a `rounds` folder opens, and the kept rounds stay.
 * 3. A folder whose `running` record lists two files, only one of which exists,
 *    opens and deletes the one, so an interrupted capture is replaced instead
 *    of refused.
 * 4. A round's folder holding a file no record lists is refused, and a `rounds`
 *    entry inside a round is not owned.
 * 5. A compared round that does not exist, or whose record is still running, is
 *    refused before the previous capture's files are deleted.
 * 6. A record that is not JSON is refused naming its path.
 * 7. A claim of a path with a separator, a relative step or the record's own name
 *    is refused, and a write of an unclaimed name is refused.
 */
export async function test_render_capture_capture_folder(): Promise<void> {
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
  const locations: Record<string, string> = {
    "out/rounds/before": "out/rounds/before",
    "out/rounds/Before": "out/rounds/before",
  };
  const aliases: createCaptureMemory.IMemory = createCaptureMemory({
    "out/rounds/before/record.json": complete(["prior.png", "record.json"]),
    "out/rounds/before/prior.png": "prior still",
    "out/rounds/Before/record.json": complete(["other.png", "record.json"]),
    "out/rounds/Before/other.png": "other still",
  });
  const storage = {
    ...aliases.storage,
    realpath: async (path: string): Promise<string> => locations[path]!,
  };
  const open = (round: string, compare: string | null): Promise<unknown> =>
    AutoMovieCaptureFolder.open({ storage, root: "out", round, compare });
  TestValidator.predicate(
    "using the same name twice is refused even without host resolution",
    await rejectsError(
      (): Promise<unknown> =>
        AutoMovieCaptureFolder.open({
          storage: aliases.storage,
          root: "out",
          round: "before",
          compare: "before",
        }),
      ["itself"],
    ),
  );
  TestValidator.predicate(
    "different spellings of the same folder are refused",
    await rejectsError(() => open("Before", "before"), ["same folder"]),
  );
  TestValidator.predicate(
    "a capture cannot replace a round under a different spelling",
    await rejectsError(() => open("Before", null), ['existing round "before"']),
  );
  TestValidator.equals(
    "neither round's files changed after the refusals",
    [
      aliases.text("out/rounds/before/prior.png"),
      aliases.text("out/rounds/Before/other.png"),
    ],
    ["prior still", "other still"],
  );
  locations["out/rounds/Before"] = "out/rounds/Before";
  await open("Before", "before");
  TestValidator.equals(
    "distinct directory spellings keep the earlier round and replace the output",
    [
      aliases.text("out/rounds/before/prior.png"),
      aliases.files.has("out/rounds/Before/other.png"),
    ],
    ["prior still", false],
  );

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
