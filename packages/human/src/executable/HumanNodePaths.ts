import path from "node:path";
import fs from "node:fs";

/** Node-only workspace paths shared by direct package executables. */
export namespace HumanNodePaths {
  /** Finds the actual caller workspace, independent of ttsx's private emitted module directory. */
  export function root(): string {
    let directory: string = process.cwd();
    while (!fs.existsSync(path.join(directory, "pnpm-workspace.yaml"))) {
      const parent: string = path.dirname(directory);
      if (parent === directory) throw new Error("Run the Human Node executable inside the AutoMovie workspace");
      directory = parent;
    }
    return directory;
  }

  /** Resolves repository-relative input and ignored output paths independently of the caller cwd. */
  export function resolve(file: string): string { return path.resolve(root(), file); }
}
