import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

/**
 * Pack recovery and its actual installed runtime dependency closure once.
 * Workspace packages use their built public distribution. External packages are
 * copied from the immutable installed distribution into run-owned staging before
 * lifecycle-disabled packing. Exact file overrides then allow a fresh offline
 * consumer store without registry metadata, ancestor dependencies or source aliases.
 * Already-published external distributions use the host package manager only for
 * packing; their original source-build manager is neither enforced nor downloaded.
 * Optional/platform dependencies are not silently omitted: this host refuses them.
 *
 * @evidence contracts/common.md#principled-implementation Declared runtime dependencies select the full closure, including ingest's external codec dependencies; every installed artifact is packed, hashed and pinned to its actual versioned bytes.
 * @evidence contracts/common.md#clear-and-simple-design One host traversal owns packaging; library source and the consumer retain their ordinary public imports without dependency-specific substitutions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts External installed bytes are copied before packing, never modified or linked into the consumer; package lifecycle scripts, implicit registry resolution and symlinked distribution files are refused.
 * @evidence contracts/common.md#meaningful-documentation States built workspace prerequisites, external distribution staging, exact offline overrides and the unsupported optional-dependency boundary.
 * @evidence contracts/performance.md#efficient-algorithms A visited-name map traverses each package and declared dependency once; copying, packing and hashing are linear in admitted distribution bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared dependencies are packed once and the same tarballs supply both installation and receipt hashes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous reads and the caller's bounded package runner retain no worker; the caller owns exact staging, tarballs and consumer cleanup after receipt collection.
 */
export function packAutoMovieRecoveryClosure(input: {
  repository: string;
  packs: string;
  pnpm: (args: string[], cwd: string) => string;
}): { name: string; file: string; bytes: number; sha256: string }[] {
  const queue: string[] = [path.join(input.repository, "packages", "recovery")];
  const seen: Map<string, string> = new Map();
  const result: {
    name: string;
    file: string;
    bytes: number;
    sha256: string;
  }[] = [];
  const staging: string = path.join(path.dirname(input.packs), "external");
  fs.mkdirSync(staging);
  for (let index: number = 0; index < queue.length; index++) {
    const directory: string = fs.realpathSync(queue[index]!);
    const manifest: string = path.join(directory, "package.json");
    const metadata: {
      name: string;
      version: string;
      dependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    } = JSON.parse(fs.readFileSync(manifest, "utf8"));
    if (seen.has(metadata.name)) {
      if (seen.get(metadata.name) !== metadata.version)
        throw new Error("The packed runtime requires conflicting versions");
      continue;
    }
    if (
      !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(metadata.name) ||
      !/^\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.-]+)?$/.test(metadata.version) ||
      Object.keys(metadata.optionalDependencies ?? {}).length
    )
      throw new Error("A versioned, non-optional runtime closure is required");
    seen.set(metadata.name, metadata.version);
    for (const name of Object.keys(metadata.dependencies ?? {})) {
      if (name.startsWith("@automovie/")) {
        queue.push(path.join(input.repository, "packages", name.slice(11)));
      } else {
        let dependency: string = path.dirname(
          createRequire(manifest).resolve(name),
        );
        while (!fs.existsSync(path.join(dependency, "package.json"))) {
          const parent: string = path.dirname(dependency);
          if (parent === dependency)
            throw new Error(`No installed runtime manifest for ${name}`);
          dependency = parent;
        }
        const resolved: { name: string } = JSON.parse(
          fs.readFileSync(path.join(dependency, "package.json"), "utf8"),
        );
        if (resolved.name !== name)
          throw new Error(`The installed runtime manifest differs: ${name}`);
        queue.push(dependency);
      }
    }
    let cwd: string = directory;
    if (!metadata.name.startsWith("@automovie/")) {
      cwd = path.join(staging, String(index));
      fs.cpSync(directory, cwd, {
        recursive: true,
        filter: (source: string): boolean => {
          if (path.basename(source) === "node_modules") return false;
          if (fs.lstatSync(source).isSymbolicLink())
            throw new Error("A runtime distribution file is a symlink");
          return true;
        },
      });
    }
    input.pnpm(
      [
        "--config.ignore-scripts=true",
        ...(metadata.name.startsWith("@automovie/")
          ? []
          : [
              "--config.package-manager-strict=false",
              "--config.manage-package-manager-versions=false",
            ]),
        "pack",
        "--pack-destination",
        input.packs,
      ],
      cwd,
    );
    const file: string = path.join(
      input.packs,
      `${metadata.name.replace(/^@/, "").replace("/", "-")}-${metadata.version}.tgz`,
    );
    const bytes: Buffer = fs.readFileSync(file);
    result.push({
      name: metadata.name,
      file,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
  return result;
}
