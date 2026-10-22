import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/** Share exact source-byte identity between the HTTP owner and its isolated child.
 * No watcher timing or filesystem timestamp substitutes for content equality.
 */
export class HumanImageSourceIdentity {
  /** Hash the loaded host implementation and its dependency configuration. */
  public static async host(root: string): Promise<string> {
    const digest: ReturnType<typeof createHash> = createHash("sha256");
    for (const name of [
      "pnpm-lock.yaml",
      "packages/playground/vite.config.ts",
      "packages/playground/scripts/playgroundViteConfig.ts",
      ...HumanImageSourceIdentity.runtime(),
      "packages/playground/src/human-images/HumanImageArchive.ts",
      "packages/playground/src/human-images/HumanImageRegistry.ts",
      "packages/playground/src/human-images/createHumanImagePlugin.ts",
    ])
      digest.update(await fs.readFile(path.join(root, name)));
    return digest.digest("hex");
  }

  /** Bind current maintained geometry, renderer and worker code in one order. */
  public static async source(root: string): Promise<string> {
    const digest: ReturnType<typeof createHash> = createHash("sha256");
    const names: string[] = [];
    const visit: (directory: string) => Promise<void> = async (
      directory: string,
    ): Promise<void> => {
      for (const entry of await fs.readdir(directory, {
        withFileTypes: true,
      })) {
        const name: string = path.join(directory, entry.name);
        if (entry.isDirectory()) await visit(name);
        else if (entry.isFile() && /\.(?:ts|json)$/.test(entry.name))
          names.push(name);
      }
    };
    for (const pack of ["human", "viewer", "engine", "interface", "recovery"])
      await visit(path.join(root, "packages", pack, "src"));
    for (const name of [
      "pnpm-lock.yaml",
      "packages/playground/vite.config.ts",
      ...HumanImageSourceIdentity.runtime(),
    ])
      names.push(path.join(root, name));
    for (const name of names.sort((a: string, b: string): number =>
      a < b ? -1 : a > b ? 1 : 0,
    )) {
      digest.update(name);
      digest.update(await fs.readFile(name));
    }
    return digest.digest("hex");
  }

  /** Fixed worker/HTTP implementation closure, with no specimen discovery. */
  private static runtime(): string[] {
    return [
      "HumanImageSession.ts",
      "HumanImageSourceIdentity.ts",
      "HumanImageProcess.ts",
      "humanImageProcessEntry.ts",
    ].map(
      (name: string): string => "packages/playground/src/human-images/" + name,
    );
  }
}
