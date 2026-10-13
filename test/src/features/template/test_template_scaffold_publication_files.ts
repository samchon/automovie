import { writeFiles } from "@automovie/template";
import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Publishing a rendered map into a missing root creates the root and every
 * subdirectory and writes each file's exact bytes.
 *
 * Scenarios:
 *
 * 1. A missing nested root is created and every file, including one in a new
 *    subdirectory, holds its exact UTF-8 text; `writeFiles` returns the
 *    absolute paths sorted by code unit, not in map order.
 * 2. An empty map completes with no paths and does not create its root.
 *
 * @evidence contracts/testing.md#behavioral-verification The test runs `writeFiles` against a fresh temporary directory and asserts the returned paths and the text read back from disk, catching a missing nested directory, wrong or re-encoded content, unsorted results, or a root created for an empty map.
 * @evidence contracts/testing.md#independent-expectations Expected text is the literal input, and expected paths are `path.join` of the temporary root and the map keys in an order sorted by hand; nothing is derived from the function's own output.
 * @evidence contracts/testing.md#distinguishing-cases The map lists `src/index.ts` before `README.md` so the sorted result differs from map order, a non-ASCII character checks encoding, and the empty map is the boundary that must touch nothing. A populated root and `force` are owned by `test_template_scaffold_publication_force`, and candidate validation by `test_template_scaffold_publication_candidate`.
 * @evidence contracts/testing.md#execution-ownership This unit test uses the real file system only under a fresh `os.tmpdir()` directory that it removes in `finally`, and loads the package's prebuilt native publication adapter without building or starting another process; it is discovered as an exported `test_` function under `features/template`.
 */
export function test_template_scaffold_publication_files(): void {
  const temporary: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "automovie-scaffold-"),
  );
  try {
    const root: string = path.join(temporary, "fresh", "project");
    TestValidator.equals(
      "written paths are sorted",
      writeFiles(root, {
        "src/index.ts": "export {};\n",
        "README.md": "# é\n",
      }),
      [path.join(root, "README.md"), path.join(root, "src", "index.ts")],
    );
    TestValidator.equals(
      "content read back",
      [
        fs.readFileSync(path.join(root, "src", "index.ts"), "utf8"),
        fs.readFileSync(path.join(root, "README.md"), "utf8"),
      ],
      ["export {};\n", "# é\n"],
    );

    const empty: string = path.join(temporary, "empty");
    TestValidator.equals("empty map writes nothing", writeFiles(empty, {}), []);
    TestValidator.equals(
      "empty map creates no root",
      fs.existsSync(empty),
      false,
    );
  } finally {
    fs.rmSync(temporary, { force: true, recursive: true });
  }
}
