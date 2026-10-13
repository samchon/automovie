#!/usr/bin/env node
import {
  type IScaffoldPublicationReceipt,
  ScaffoldPublicationError,
  publishFiles,
  renderScaffold,
} from "@automovie/template";
import * as path from "node:path";

import {
  type AutoMovieCommand,
  readAutoMovieCommandArguments,
} from "./commandArguments";
import { renderAutoMovieScaffoldNextSteps } from "./scaffoldNextSteps";

const USAGE: string = `automovie: scaffold an automovie project

Usage:
  npx automovie start <directory> [--force]

Options:
  --force         Scaffold into a non-empty directory.
  -h, --help      Show this help as a standalone request.
  -v, --version   Print the version as a standalone request.
`;

/**
 * This package's version, read at runtime from the sibling `package.json`
 * (`require`, not an `import`, so it stays outside `rootDir`). `__dirname`
 * resolves to `src` under ttsx and `lib` when published; the file sits one
 * level up in both.
 */
function packageVersion(): string {
  const manifest: { version: string } = require(
    path.join(__dirname, "..", "package.json"),
  ) as { version: string };
  return manifest.version;
}

/** Derive a valid npm package name from the target directory's basename. */
function projectNameOf(targetDir: string): string {
  return (
    path
      .basename(targetDir)
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "") || "automovie-project"
  );
}

/**
 * The `automovie` CLI entry. `argv` is the full process vector; its first two
 * positions (executable and script) are skipped.
 *
 * - `help` and `version` write to stdout; the version is read from this
 *   package's `package.json`.
 * - `start` renders the scaffold and publishes it into the directory resolved
 *   against the working directory, refusing a non-empty one without
 *   `--force`. Files written before a failed publication stay.
 *
 * Returns the process exit code, 0 on success or 1 after writing the error's
 * message (without its stack) to stderr, rather than exiting, so queued output
 * drains before the process ends.
 *
 * @author Samchon
 */
export function run(argv: readonly string[]): number {
  try {
    const command: AutoMovieCommand = readAutoMovieCommandArguments(
      argv.slice(2),
    );
    if (command.command === "help") {
      process.stdout.write(USAGE);
      return 0;
    }
    if (command.command === "version") {
      process.stdout.write(`${packageVersion()}\n`);
      return 0;
    }
    const targetDir: string = path.resolve(process.cwd(), command.directory);
    const receipt: IScaffoldPublicationReceipt = publishFiles(
      targetDir,
      renderScaffold({ name: projectNameOf(targetDir) }),
      { force: command.force },
    );
    if (receipt.status !== "completed")
      throw new ScaffoldPublicationError(receipt);
    const written: string[] = receipt.completed.map(
      ({ entry }): string => entry.target,
    );
    process.stdout.write(
      `Scaffolded ${written.length} files into ${targetDir}\n\n` +
        written
          .map((file: string): string => `  ${path.relative(targetDir, file) || "."}`)
          .join("\n") +
        renderAutoMovieScaffoldNextSteps(targetDir),
    );
    return 0;
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 1;
  }
}

if (require.main === module) process.exitCode = run(process.argv);
