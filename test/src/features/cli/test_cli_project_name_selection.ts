import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliScaffold } from "automovie";
import * as path from "node:path";

/**
 * `create` takes a typed name, derives one from a new target directory, and
 * asks only when the target is the working directory itself.
 *
 * Scenarios:
 *
 * 1. A typed name wins over every target, the working directory included.
 * 2. `.`, `./` and the absolute working directory return no name, so the CLI asks.
 * 3. A child or sibling target gives the derived basename name.
 * 4. The default offered for an asked name is `automovie-examples`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names explicit name precedence, current-directory prompting, child and sibling names and the offered default.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the selector with a typed name and with three current-directory spellings, a child and a sibling. Checks the optional result for each path and reads the default constant.
 * @evidence contracts/development/testing.md#independent-expectations Compares literal typed, derived and default names. The fixture's relative and absolute paths independently identify which targets resolve to the working directory.
 */
export function test_cli_project_name_selection(): void {
  const cwd: string = path.resolve("Workspace Root");
  for (const directory of [".", "./", cwd])
    TestValidator.equals(
      `${JSON.stringify(directory)} asks for a name`,
      AutoMovieCliScaffold.selectProjectName({ directory, cwd }),
      undefined,
    );
  TestValidator.equals(
    "typed name for the working directory",
    AutoMovieCliScaffold.selectProjectName({
      directory: ".",
      cwd,
      name: "studio",
    }),
    "studio",
  );
  TestValidator.equals(
    "typed name for a new directory",
    AutoMovieCliScaffold.selectProjectName({
      directory: "films",
      cwd,
      name: "studio",
    }),
    "studio",
  );
  TestValidator.equals(
    "nested child",
    AutoMovieCliScaffold.selectProjectName({
      directory: "films/My Film",
      cwd,
    }),
    "my-film",
  );
  TestValidator.equals(
    "sibling",
    AutoMovieCliScaffold.selectProjectName({
      directory: "../Other",
      cwd,
    }),
    "other",
  );
  TestValidator.equals(
    "default name",
    AutoMovieCliScaffold.DEFAULT_PROJECT_NAME,
    "automovie-examples",
  );
}
