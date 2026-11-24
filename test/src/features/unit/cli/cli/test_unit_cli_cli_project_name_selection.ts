import { TestValidator } from "@nestia/e2e";
import {
  AUTOMOVIE_DEFAULT_PROJECT_NAME,
  selectAutoMovieProjectName,
} from "automovie";
import * as path from "node:path";

/**
 * `create` takes a typed name, derives one from a new target directory, and asks only when the target is the working directory itself.
 *
 * Scenarios:
 *
 * 1. A typed name wins over every target, the working directory included.
 * 2. `.`, `./` and the absolute working directory return no name, so the CLI asks.
 * 3. A child or sibling target gives the derived basename name.
 * 4. The default offered for an asked name is `automovie-examples`.
 */
export function test_unit_cli_cli_project_name_selection(): void {
  const cwd: string = path.resolve("Workspace Root");
  for (const directory of [".", "./", cwd])
    TestValidator.equals(
      `${JSON.stringify(directory)} asks for a name`,
      selectAutoMovieProjectName({ directory, cwd }),
      undefined,
    );
  TestValidator.equals(
    "typed name for the working directory",
    selectAutoMovieProjectName({ directory: ".", cwd, name: "studio" }),
    "studio",
  );
  TestValidator.equals(
    "typed name for a new directory",
    selectAutoMovieProjectName({ directory: "films", cwd, name: "studio" }),
    "studio",
  );
  TestValidator.equals(
    "nested child",
    selectAutoMovieProjectName({ directory: "films/My Film", cwd }),
    "my-film",
  );
  TestValidator.equals(
    "sibling",
    selectAutoMovieProjectName({ directory: "../Other", cwd }),
    "other",
  );
  TestValidator.equals(
    "default name",
    AUTOMOVIE_DEFAULT_PROJECT_NAME,
    "automovie-examples",
  );
}
