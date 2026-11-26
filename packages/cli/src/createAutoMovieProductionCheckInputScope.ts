import type { IAutoMovieProductionCheck } from "@automovie/interface";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { hashAutoMovieFile } from "./hashAutoMovieFile";

/**
 * Resolve explicitly named verification inputs to files in the production or
 * its Git checkout. Check the named path and the actual destination so a link
 * cannot redirect the verifier beyond those boundaries. Discover the checkout
 * only when a declared file or a legacy capture needs it.
 *
 * @param root The production directory.
 * @returns Lazy production and checkout directories and an input resolver.
 */
export function createAutoMovieProductionCheckInputScope(root: string): {
  /** Canonical production directory. */
  readonly project: () => Promise<string>;
  /** Canonical Git worktree containing the project, when there is one. */
  readonly checkout: () => Promise<string | null>;
  /** The normalized input name and its admitted filesystem location. */
  readonly verifySources: (
    sources: ReadonlyMap<string, string>,
  ) => Promise<void>;
  readonly identify: (
    check:
      | IAutoMovieProductionCheck.IMeasurement
      | IAutoMovieProductionCheck.ICapture,
    sources?: (file: string | undefined) => ReadonlyMap<string, string>,
  ) => Promise<string>;
} {
  let projectDirectory: Promise<string> | undefined;
  let checkoutDirectory: Promise<string | null> | undefined;
  const project = (): Promise<string> =>
    (projectDirectory ??= fs.realpath(root));
  const checkout = (): Promise<string | null> =>
    (checkoutDirectory ??= project().then(findCheckout));
  const admits = async (directory: string, file: string): Promise<boolean> => {
    if (contains(directory, file)) return true;
    const worktree: string | null = await checkout();
    return worktree !== null && contains(worktree, file);
  };
  const resolve = async (
    name: string,
  ): Promise<readonly [relative: string, actual: string]> => {
    if (path.isAbsolute(name) || path.win32.parse(name).root !== "")
      throw new Error(`Verification input must be project-relative: ${name}.`);
    const directory: string = await project();
    const file: string = path.resolve(directory, name);
    if (!(await admits(directory, file)))
      throw new Error(
        `Verification input is outside the project and its Git checkout: ${name}.`,
      );
    const actual: string = await fs.realpath(file);
    if (!(await admits(directory, actual)))
      throw new Error(
        `Verification input resolves outside the project and its Git checkout: ${name}.`,
      );
    return [path.relative(directory, file), actual];
  };
  return {
    project,
    checkout,
    verifySources: async (
      sources: ReadonlyMap<string, string>,
    ): Promise<void> => {
      for (const [name, loaded] of sources) {
        const [relative, actual] = await resolve(name);
        const current: string = await hashAutoMovieFile(actual);
        if (current !== loaded) throw changedSource(relative);
      }
    },
    /**
     * Hash a check definition and the exact named inputs without walking the
     * project.
     */
    identify: async (check, sources): Promise<string> => {
      const names: readonly string[] = check.inputs ?? [];
      const source: string | undefined =
        check.kind === "measure" ? check.source : undefined;
      const graph: ReadonlyMap<string, string> | undefined =
        check.kind === "measure" && sources !== undefined
          ? sources(
              source === undefined ? undefined : (await resolve(source))[1],
            )
          : undefined;
      if (
        !Array.isArray(names) ||
        (names.length === 0 && source === undefined && graph === undefined)
      )
        throw new Error(
          "Declare the scoped input files to establish result currentness.",
        );

      const inputs: [string, string][] = [];
      for (const name of new Set([
        ...names,
        ...(graph?.keys() ?? (source === undefined ? [] : [source])),
      ])) {
        const [relative, actual] = await resolve(name);
        const hash: string = await hashAutoMovieFile(actual);
        const loaded: string | undefined = graph?.get(relative);
        if (loaded !== undefined && hash !== loaded)
          throw changedSource(relative);
        inputs.push([relative, hash]);
      }
      return createHash("sha256")
        .update(
          JSON.stringify([
            { ...check, enabled: undefined },
            check.kind === "measure" ? String(check.measure) : null,
            inputs,
          ]),
        )
        .digest("hex");
    },
  };
}

function changedSource(relative: string): Error {
  return new Error(
    `Verification source changed after it loaded: ${relative}. Run check again.`,
  );
}

/** Locate the owning Git worktree without scanning its working files. */
async function findCheckout(project: string): Promise<string | null> {
  try {
    const top: string = execFileSync(
      "git",
      ["-C", project, "rev-parse", "--show-toplevel"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        windowsHide: true,
      },
    ).replace(/\r?\n$/u, "");
    if (!path.isAbsolute(top)) return null;
    const directory: string = await fs.realpath(top);
    return contains(directory, project) ? directory : null;
  } catch {
    return null;
  }
}

/** Resolve native case, separator and drive semantics through relative paths. */
function contains(directory: string, candidate: string): boolean {
  const relative: string = path.relative(directory, candidate);
  return (
    !path.isAbsolute(relative) &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`)
  );
}
