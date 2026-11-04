import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import type { IHumanDebugEnvironment } from "./IHumanDebugEnvironment";

/**
 * SHA-256 of the source a viewer frame can depend on, as stored on disk.
 *
 * The inventory is the package's own `src` and `debug` trees, the `src` tree of every workspace
 * package `packages/human/package.json` depends on, the typed people, and the page and
 * configuration files at the package root. Paths and bytes of every `.ts`, `.json` and `.html`
 * file enter the digest in sorted order, so an edit, an addition, a removal or a rename changes it;
 * modification times are never trusted. The capture session compares this disk inventory before
 * and after page loading to detect source edits. Freshness of Vite's served transformed modules
 * requires separate verification. Reads run 64 at a time, since sequential reads of some three thousand
 * files take seconds on Windows.
 *
 * @param environment The server environment.
 * @returns The lower-case hex digest.
 */
export async function HumanDebugSourceHash(environment: IHumanDebugEnvironment): Promise<string> {
  const names: string[] = [];
  const visit: (directory: string) => Promise<void> = async (directory: string): Promise<void> => {
    const nested: Promise<void>[] = [];
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const name: string = path.join(directory, entry.name);
      if (entry.isDirectory()) nested.push(visit(name));
      else if (entry.isFile() && /\.(?:ts|json|html)$/.test(entry.name)) names.push(name);
    }
    await Promise.all(nested);
  };
  await Promise.all([
    visit(path.join(environment.directory, "src")),
    visit(path.join(environment.directory, "debug")),
    visit(environment.people),
    ...(await dependencies(environment.directory)).map((directory: string): Promise<void> => visit(directory)),
  ]);
  for (const entry of await fs.readdir(environment.directory, { withFileTypes: true }))
    if (entry.isFile() && /\.(?:ts|json|html)$/.test(entry.name)) names.push(path.join(environment.directory, entry.name));
  names.sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));

  const digest: ReturnType<typeof createHash> = createHash("sha256");
  for (let start: number = 0; start < names.length; start += 64) {
    const window: string[] = names.slice(start, start + 64);
    const contents: Buffer[] = await Promise.all(window.map((name: string): Promise<Buffer> => fs.readFile(name)));
    window.forEach((name: string, index: number): void => {
      digest.update(path.relative(environment.repository, name));
      digest.update(contents[index]!);
    });
  }
  return digest.digest("hex");
}

/** The `src` directories of the package's workspace dependencies, resolved through Node's resolver. */
async function dependencies(directory: string): Promise<string[]> {
  const manifest: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> } = JSON.parse(
    await fs.readFile(path.join(directory, "package.json"), "utf8"),
  );
  const require: NodeRequire = createRequire(path.join(directory, "package.json"));
  return Object.entries({ ...manifest.dependencies, ...manifest.devDependencies })
    .filter(([, version]: [string, string]): boolean => version.startsWith("workspace:"))
    .map(([name]: [string, string]): string => path.join(path.dirname(require.resolve(name + "/package.json")), "src"));
}
