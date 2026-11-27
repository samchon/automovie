import { readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

import { createPublicSourceExportIndex } from "../scripts/public-source-exports.cjs";

/** The published TypeScript source files reachable from this package's public exports. */
export function packagePublicSourceFiles(): string[] | undefined {
  const packageRoot: string = resolve(process.cwd());
  const repositoryRoot: string = resolve(packageRoot, "../..");
  const packagesRoot: string = resolve(repositoryRoot, "packages");
  const packagePath: string = relative(packagesRoot, packageRoot);
  if (
    packagePath === "" ||
    packagePath === ".." ||
    packagePath.startsWith(`..${sep}`) ||
    packagePath.includes(sep)
  )
    return undefined;

  const packageName: string = JSON.parse(
    readFileSync(resolve(packageRoot, "package.json"), "utf8"),
  ).name;
  const index = createPublicSourceExportIndex({ root: repositoryRoot });
  const sourceRoot: string = resolve(packageRoot, "src") + sep;
  const directFiles: string[] = [...index.publicFiles].filter(
    (file: string): boolean =>
      resolve(file).toLowerCase().startsWith(sourceRoot.toLowerCase()),
  );
  const contractFiles: string[] = [
    ...index.publicContractDeclarations(directFiles, packageName).keys(),
  ];
  const files: string[] = contractFiles
    .filter((file: string): boolean =>
      resolve(file).toLowerCase().startsWith(sourceRoot.toLowerCase()),
    )
    .filter((file: string): boolean => /\.tsx?$/iu.test(file))
    .map((file: string): string =>
      relative(packageRoot, resolve(file)).replaceAll("\\", "/"),
    )
    .sort();
  if (files.length === 0)
    throw new Error(
      `No public TypeScript exports were found for ${packageRoot}.`,
    );
  return files;
}
/** Requires the shared package configurations to be evaluated from a workspace package. */
export function requirePackagePublicSourceFiles(): string[] {
  const files: string[] | undefined = packagePublicSourceFiles();
  if (files === undefined)
    throw new Error(
      "Package Evidence configuration must run from packages/<name>.",
    );
  return files;
}