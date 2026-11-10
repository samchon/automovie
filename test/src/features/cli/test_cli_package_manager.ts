import { TestValidator } from "@nestia/e2e";
import {
  renderAutoMovieScaffoldNextSteps,
  selectAutoMoviePackageManager,
} from "automovie";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * `create`'s next steps name the package manager in effect for the new production.
 *
 * Scenarios:
 *
 * 1. A target under a directory holding `pnpm-workspace.yaml` selects pnpm with that root, even when npm launched the CLI, and the text names pnpm install at that root and no npm command.
 * 2. Outside a workspace, a pnpm user agent selects pnpm without a root; an npm or absent agent selects npm.
 * 3. A lockfile already in the target outranks the launcher.
 * 4. The default production text keeps the documented npm steps, and a workspace production names pnpm scripts.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the exported selector over real temporary directories and the exported renderer, catching npm steps printed inside a pnpm workspace.
 * @evidence contracts/development/testing.md#independent-expectations Expectations come from the production README: inside an AutoMovie workspace install once with pnpm at the root, otherwise npm.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers an enclosing workspace against an npm launcher, pnpm, npm and absent agents outside a workspace, a target lockfile against the launcher, and every renderer branch.
 * @evidence contracts/development/testing.md#execution-ownership In-process over an owned temporary root removed in finally; no process is started.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the behavior under test and lists each scenario with the property it pins.
 */
export function test_cli_package_manager(): void {
  const root: string = fs.realpathSync.native(
    fs.mkdtempSync(path.join(os.tmpdir(), "automovie-cli-manager-")),
  );
  try {
    const workspace: string = path.join(root, "monorepo");
    const target: string = path.join(workspace, "movies", "shorts", "malfoy");
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(
      path.join(workspace, "pnpm-workspace.yaml"),
      "packages:\n  - movies/shorts/*\n",
    );
    const inside: { manager: "npm" | "pnpm"; workspace?: string } =
      selectAutoMoviePackageManager({
        directory: target,
        userAgent: "npm/10.9.0 node/v22.23.2 win32 x64",
      });
    TestValidator.equals("enclosing workspace", inside, {
      manager: "pnpm",
      workspace,
    });
    const text: string = renderAutoMovieScaffoldNextSteps(
      target,
      "production",
      inside,
    );
    TestValidator.predicate(
      "pnpm install at the root",
      text.includes(`pnpm install at the workspace root ${workspace}`),
    );
    TestValidator.predicate(
      "no npm command",
      !/\bnpm (install|run)/u.test(text),
    );

    const loose: string = path.join(root, "loose");
    fs.mkdirSync(loose);
    TestValidator.equals(
      "pnpm launcher",
      selectAutoMoviePackageManager({
        directory: loose,
        userAgent: "pnpm/10.6.4 npm/? node/v22.23.2 win32 x64",
      }),
      { manager: "pnpm" },
    );
    TestValidator.equals(
      "npm launcher",
      selectAutoMoviePackageManager({
        directory: loose,
        userAgent: "npm/10.9.0 node/v22.23.2 win32 x64",
      }),
      { manager: "npm" },
    );
    TestValidator.equals(
      "no launcher",
      selectAutoMoviePackageManager({ directory: loose }),
      { manager: "npm" },
    );

    fs.writeFileSync(path.join(loose, "package-lock.json"), "{}\n");
    TestValidator.equals(
      "target lockfile",
      selectAutoMoviePackageManager({
        directory: loose,
        userAgent: "pnpm/10.6.4 npm/? node/v22.23.2 win32 x64",
      }),
      { manager: "npm" },
    );

    TestValidator.predicate(
      "default npm steps",
      renderAutoMovieScaffoldNextSteps(loose, "production").includes(
        "npm install --package-lock=false",
      ),
    );
    TestValidator.predicate(
      "workspace production scripts",
      renderAutoMovieScaffoldNextSteps(target, "workspace-production").includes(
        "pnpm run lint and pnpm run evidence",
      ),
    );
  } finally {
    fs.rmSync(root, { recursive: true });
  }
}
