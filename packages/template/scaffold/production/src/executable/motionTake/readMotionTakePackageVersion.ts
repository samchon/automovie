import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Read the installed version of a package imported by the production source.
 * Looks up the nearest manifest from the importing module's directory.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which version is read and where lookup begins.
 * @evidence contracts/development/implementation.md#principled-implementation Searches the same ancestor node_modules directories as standard bare package resolution and reads the first manifest found. Global packages are outside this search, and private manifest exports do not hide the installed version.
 * @evidence contracts/development/implementation.md#efficient-algorithms Forms the package manifest address at each ancestor, then reads its recorded version. Checks at most one manifest per ancestor before returning. Each invocation obtains the current installed version. Manifest reads open no persistent handles and return just a version string.
 */
export async function readMotionTakePackageVersion(
  root: string,
  packageName: string,
  issuer: string,
): Promise<string> {
  const location: string = path.dirname(path.join(root, issuer));
  for (
    let directory: string = location;
    ;
    directory = path.dirname(directory)
  ) {
    const data: string | null = await readFile(
      path.join(directory, "node_modules", packageName, "package.json"),
      "utf8",
    ).catch((error: NodeJS.ErrnoException): null => {
      if (error.code !== "ENOENT") throw error;
      return null;
    });
    if (data !== null) {
      const manifest: { name?: unknown; version?: unknown } = JSON.parse(data);
      if (manifest.name !== packageName || typeof manifest.version !== "string")
        throw new Error(
          `Installed package identity is unavailable: ${packageName}`,
        );
      return manifest.version;
    }
    if (directory === path.dirname(directory)) break;
  }
  throw new Error(`Installed package version is unavailable: ${packageName}`);
}
