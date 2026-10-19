// Run every exported `test_*` function of each `test_*.ts` file under this
// directory through `node:test`. Exported functions keep each test addressable
// by the `@evidence` checklist; an empty directory passes with no tests.
import { readdirSync } from "node:fs";
import { basename, join, sep } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const root: string = import.meta.dirname;
const files: string[] = readdirSync(root, { recursive: true, encoding: "utf8" })
  .filter((file: string): boolean => /^test_.+\.ts$/.test(basename(file)))
  .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
for (const file of files) {
  const loaded: Record<string, unknown> = await import(
    pathToFileURL(join(root, file)).href
  );
  for (const [name, value] of Object.entries(loaded))
    if (name.startsWith("test_") && typeof value === "function")
      void test(
        `${file.split(sep).join("/")}: ${name}`,
        value as () => void | Promise<void>,
      );
}
