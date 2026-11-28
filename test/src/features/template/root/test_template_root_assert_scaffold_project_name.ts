import { AutoMovieTemplateScaffold } from "@automovie/template";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieTemplateScaffold.assertProjectName` trims a name and refuses one
 * that is not a portable directory segment: empty, `.` or `..`, a trailing dot,
 * a reserved character `<>:"/\|?*` or control character, or a Windows device
 * name (Microsoft, "Naming Files, Paths, and Namespaces").
 *
 * Scenarios:
 *
 * 1. " my-film " is returned trimmed.
 * 2. "", "..", "film.", "a/b", "nul", "COM1.txt" refuse.
 * 3. "console" is not a device name and is admitted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines portable project segment admission, trimming and reserved filename recognition.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public validator on a padded normal name and reserved and nonreserved examples.
 * @evidence contracts/development/testing.md#independent-expectations The trimmed name is `my-film`. A trailing dot, a separator and `nul` or `COM1.txt` refuse, while `console` remains usable.
 */
export function test_template_root_assert_scaffold_project_name(): void {
  TestValidator.equals(
    "trimmed",
    AutoMovieTemplateScaffold.assertProjectName("  my-film  "),
    "my-film",
  );
  for (const name of ["", "..", "film.", "a/b", "nul", "COM1.txt"])
    TestValidator.error(`"${name}" refuses`, (): string =>
      AutoMovieTemplateScaffold.assertProjectName(name),
    );
  TestValidator.equals(
    "console",
    AutoMovieTemplateScaffold.assertProjectName("console"),
    "console",
  );
}
