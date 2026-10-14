import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { IHumanBuildFileHost } from "./IHumanBuildFileHost";
import { replaceHumanBuildFile } from "./replaceHumanBuildFile";

/**
 * Native file effects for staged Human output and rollback.
 *
 * The real package directory bounds every path, and linked descendants refuse
 * publication. Windows watchers may retain directory handles, so only
 * individual files are renamed; empty output directories remain ordinary
 * harmless containers. This is atomic per file, not an atomic import graph;
 * the build lock covers both compiler passes and publication for candidate
 * admission.
 *
 * @param directory Physical owning package directory.
 */
export function createHumanBuildFileHost(
  directory: string,
): IHumanBuildFileHost {
  const inside = (candidate: string): string => {
    const resolved: string = path.resolve(candidate);
    const relative: string = path.relative(directory, resolved);
    if (
      !relative ||
      relative === ".." ||
      relative.startsWith(".." + path.sep) ||
      path.isAbsolute(relative)
    )
      throw new Error(
        "Human file publication refuses a path outside its owning package: " +
          candidate,
      );
    for (
      let entry: string = resolved;
      entry !== directory;
      entry = path.dirname(entry)
    )
      if (fs.existsSync(entry) && fs.lstatSync(entry).isSymbolicLink())
        throw new Error(
          "Human file publication refuses a linked path: " + entry,
        );
    return resolved;
  };
  return {
    files(root: string): readonly IHumanBuildFileHost.IEntry[] {
      const base: string = inside(root);
      const files: IHumanBuildFileHost.IEntry[] = [];
      const walk = (current: string): void => {
        if (!fs.existsSync(current)) return;
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
          const file: string = inside(path.join(current, entry.name));
          if (entry.isDirectory()) walk(file);
          else if (entry.isFile())
            files.push({
              file: path.relative(base, file),
              digest: createHash("sha256")
                .update(fs.readFileSync(file))
                .digest("hex"),
            });
          else
            throw new Error(
              "Human output contains a non-ordinary file: " + file,
            );
        }
      };
      walk(base);
      return files.sort(
        (
          left: IHumanBuildFileHost.IEntry,
          right: IHumanBuildFileHost.IEntry,
        ): number =>
          left.file < right.file ? -1 : left.file > right.file ? 1 : 0,
      );
    },
    replace(source: string, output: string, file: string): void {
      const from: string = inside(path.join(source, file));
      const target: string = inside(path.join(output, file));
      fs.mkdirSync(inside(path.dirname(target)), { recursive: true });
      const temporary: string = inside(
        path.join(
          path.dirname(target),
          ".human-publish-" + randomUUID() + ".tmp",
        ),
      );
      replaceHumanBuildFile({
        reserve: (): (() => void) => {
          const handle: number = fs.openSync(temporary, "wx");
          return (): void => fs.closeSync(handle);
        },
        copy: (): void => fs.copyFileSync(from, temporary),
        publish: (): void => fs.renameSync(temporary, target),
        discard: (): void => fs.rmSync(temporary, { force: true }),
      });
    },
    remove(output: string, file: string): void {
      fs.unlinkSync(inside(path.join(output, file)));
    },
  };
}
