import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

/**
 * Install the actual workspace TypeScript version in the external type consumer.
 * Invoke only after the separate three-tarball offline runtime checks finish.
 * The normal development dependency includes its platform package; the compiler
 * owner still performs the actual strict declaration check against that consumer.
 *
 * @evidence contracts/common.md#principled-implementation Read the installed workspace version and normally install that exact TypeScript development dependency so project-relative compiler resolution has its own declared toolchain.
 * @evidence contracts/common.md#clear-and-simple-design This host owns development-tool installation and identity; the caller retains runtime isolation checks and the compiler owner performs declaration validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No repository source alias, ancestor dependency link, custom compiler binary, lifecycle script or relaxed TypeScript flag supplies the consumer.
 * @evidence contracts/common.md#meaningful-documentation States runtime-before-toolchain order, exact version selection, platform dependency and separate actual compilation.
 * @evidence contracts/performance.md#efficient-algorithms Two small manifests are read once; the package manager owns network, dependency resolution and installation costs proportional to the selected development-tool distribution.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing exact runtime tarballs and the run-owned store remain the same; no geometry is regenerated for toolchain installation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller's time-bounded synchronous runner owns the child. Reads close their descriptors; the consumer and store remain caller-owned verification artifacts without a retained worker.
 */
export function installAutoMovieRecoveryConsumerToolchain(input: {
  repository: string;
  consumer: string;
  dependencies: Record<string, string>;
  store: string;
  pnpm: (args: string[], cwd: string) => string;
}): {
  installation: string;
  version: string;
  manifest: string;
  manifestSha256: string;
} {
  const { repository, consumer, dependencies, store, pnpm }: typeof input =
    input;
  const compilerMetadata: { version: string } = JSON.parse(
    fs.readFileSync(
      path.join(repository, "node_modules/typescript/package.json"),
      "utf8",
    ),
  );
  fs.writeFileSync(
    path.join(consumer, "package.json"),
    JSON.stringify(
      {
        private: true,
        dependencies,
        devDependencies: { typescript: compilerMetadata.version },
        pnpm: { overrides: dependencies },
      },
      null,
      2,
    ),
  );
  pnpm(
    [
      "install",
      "--ignore-scripts",
      "--ignore-workspace",
      "--lockfile=false",
      "--store-dir",
      store,
    ],
    consumer,
  );
  const compilerManifest: string = createRequire(
    path.join(consumer, "package.json"),
  ).resolve("typescript/package.json");
  const compilerBytes: Buffer = fs.readFileSync(compilerManifest);
  const installedCompiler: { version: string } = JSON.parse(
    compilerBytes.toString("utf8"),
  );
  if (installedCompiler.version !== compilerMetadata.version)
    throw new Error("The consumer TypeScript development dependency differs");
  return {
    installation: "normal development dependency after offline runtime checks",
    version: installedCompiler.version,
    manifest: compilerManifest,
    manifestSha256: createHash("sha256").update(compilerBytes).digest("hex"),
  };
}
