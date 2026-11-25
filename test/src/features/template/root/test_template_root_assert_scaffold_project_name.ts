import { assertScaffoldProjectName } from "@automovie/template";
import { TestValidator } from "@nestia/e2e";

/**
 * `assertScaffoldProjectName` trims a name and refuses one that is not a
 * portable directory segment: empty, `.` or `..`, a trailing dot, a reserved
 * character `<>:"/\|?*` or control character, or a Windows device name
 * (Microsoft, "Naming Files, Paths, and Namespaces").
 *
 * Scenarios:
 *
 * 1. " my-film " is returned trimmed.
 * 2. "", "..", "film.", "a/b", "nul", "COM1.txt" refuse.
 * 3. "console" is not a device name and is admitted.
 */
export function test_template_root_assert_scaffold_project_name(): void {
  TestValidator.equals(
    "trimmed",
    assertScaffoldProjectName("  my-film  "),
    "my-film",
  );
  for (const name of ["", "..", "film.", "a/b", "nul", "COM1.txt"])
    TestValidator.error(`"${name}" refuses`, (): string =>
      assertScaffoldProjectName(name),
    );
  TestValidator.equals(
    "console",
    assertScaffoldProjectName("console"),
    "console",
  );
}
