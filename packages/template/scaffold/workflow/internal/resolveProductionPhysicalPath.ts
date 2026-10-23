import fs from "node:fs";
import path from "node:path";

import { canonicalProductionPath } from "../canonicalProductionPath";

/** Resolves live aliases only while configuring or capturing an evaluation. */
export function resolveProductionPhysicalPath(filename: string): string {
  const portable: string = filename.replaceAll("\\", "/");
  const paths: typeof path = /^[A-Za-z]:\//u.test(portable) ? path.win32 : path;
  let current: string = paths.resolve(portable);
  const remaining: string[] = [];
  while (true) {
    try {
      return canonicalProductionPath(
        paths.join(fs.realpathSync.native(current), ...remaining),
      );
    } catch (error: unknown) {
      if (
        !(error instanceof Error) ||
        !["ENOENT", "ENOTDIR"].includes(
          (error as NodeJS.ErrnoException).code ?? "",
        )
      )
        throw error;
      const parent: string = paths.dirname(current);
      if (parent === current) return canonicalProductionPath(filename);
      remaining.unshift(paths.basename(current));
      current = parent;
    }
  }
}
