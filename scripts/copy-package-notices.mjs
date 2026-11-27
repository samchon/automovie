import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const packageDirectory = process.cwd();
const repositoryRoot = resolve(packageDirectory, "../..");
copyFileSync(resolve(repositoryRoot, "LICENSE"), resolve(packageDirectory, "LICENSE"));

const manifest = JSON.parse(
  readFileSync(resolve(packageDirectory, "package.json"), "utf8"),
);
if (manifest.name === "@automovie/engine") {
  const notices = resolve(repositoryRoot, "THIRD_PARTY_NOTICES.md");
  if (!existsSync(notices))
    throw new Error("Root THIRD_PARTY_NOTICES.md is required to pack @automovie/engine");
  copyFileSync(notices, resolve(packageDirectory, "THIRD_PARTY_NOTICES.md"));
}
