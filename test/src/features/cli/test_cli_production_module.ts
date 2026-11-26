import { AutoMovieCliProduction } from "automovie";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

/**
 * Distinguish dependency installation from initialization in the production.
 *
 * Scenarios:
 *
 * 1. A missing dependency reports which production must install it.
 * 2. An installed dependency throws its compiler failure as the cause.
 */
export async function test_cli_production_module(): Promise<void> {
  const root: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-production-module-"),
  );
  try {
    await fs.writeFile(path.join(root, "package.json"), "{}\n");
    const id: string = "renderer-fixture";
    assert.throws(
      (): unknown => AutoMovieCliProduction.loadModule(root, id),
      /renderer-fixture is not installed/u,
    );

    const installed: string = path.join(root, "node_modules", id);
    await fs.mkdir(installed, { recursive: true });
    await fs.writeFile(
      path.join(installed, "index.js"),
      'throw new Error("compiler changed during loading");\n',
    );
    assert.throws(
      (): unknown => AutoMovieCliProduction.loadModule(root, id),
      (error: unknown): boolean =>
        error instanceof Error &&
        error.message.includes("Could not load renderer-fixture") &&
        error.cause instanceof Error &&
        error.cause.message === "compiler changed during loading",
    );
  } finally {
    await fs.rm(root, { recursive: true, force: false });
  }
}
