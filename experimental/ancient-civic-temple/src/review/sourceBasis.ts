import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { productionRoot } from "./productionRoot";

/**
 * Source identity recorded with observations and measurements
 * The basis is the first 16 sha256 characters of source, public, and package
 * input bytes; viewer and self-check display the same value.
 * Revision gives the last Git commit changing this production path and whether
 * its working tree changed. Uncommitted changes mean dirty; their result does
 * not belong to the recorded commit.
 */
export const sourceBasis = (): string => {
  const hash = createHash("sha256");
  const visit = (relative: string): void => {
    const entries = readdirSync(resolve(productionRoot, relative), {
      withFileTypes: true,
    });
    for (const item of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const child = `${relative}/${item.name}`;
      if (item.isDirectory()) visit(child);
      else if (item.isFile()) hash.update(child).update(
        readFileSync(resolve(productionRoot, child)),
      );
    }
  };
  for (const directory of [
    "src",
    "public",
  ]) visit(directory);
  for (const file of [
    "package.json",
  ]) hash.update(file).update(readFileSync(resolve(productionRoot, file)));
  return hash.digest("hex").slice(0, 16);
};

