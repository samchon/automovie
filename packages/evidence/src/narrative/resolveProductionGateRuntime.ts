import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { productionGateHash } from "./internal/productionGateHash";

/**
 * Binds the executing library and compiler code independently of project options.
 *
 * @evidence contracts/common.md#principled-implementation Resolves the project's compiler and this library's actual Evidence dependency, hashes the executing src/lib tree and dependency implementation, and records the real platform binary digest; unverified binary overrides are rejected.
 * @evidence contracts/common.md#clear-and-simple-design The package owns implementation identity while the project location selects its compiler; authoring stages never become library source identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hashes come from resolved files rather than version labels, fixture strings or a removed project-local workflow directory.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes library implementation from author choices; return fields describe portable identity and platform-specific provenance.
 * @evidence contracts/performance.md#efficient-algorithms Traverses each executing implementation/dependency file tree and hashes selected bytes, with sorting proportional to file count and total byte reading proportional to implementation size. The fixed binary is read once per call.
 * @evidence contracts/performance.md#reuse-equivalent-work Each config creation observes the current installed code and binary; no stale cross-creation digest cache is assumed valid after a rebuild or dependency edit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous reads close their handles; intermediate buffers and file lists are local and only digest strings and platform fields remain in the config.
 */
export function resolveProductionGateRuntime(location: string): {
  /** Actual config source semantic identity, with portable text encoding. */
  harnessVersion: string;
  /** Actual compiler/plugin release and semantic source identity. */
  compilerVersion: string;
  /** Exact executing native binary provenance for original submission audit. */
  runtimeProvenance: {
    /** Native operating system. */
    platform: string;
    /** Native processor architecture. */
    architecture: string;
    /** Exact executing platform binary bytes. */
    binarySha256: string;
  };
} {
  const loader: NodeJS.Require = createRequire(
    path.join(location, "package.json"),
  );
  const implementation: NodeJS.Require = createRequire(__filename);
  const compiler: string[] = [
    loader.resolve("ttsc"),
    implementation.resolve("@wrtnlabs/evidence"),
  ];
  const ttscRoot: string = packageRoot(compiler[0]);
  const binaryLoader: NodeJS.Require = createRequire(
    path.join(ttscRoot, "package.json"),
  );
  if (process.env.TTSC_BINARY)
    throw new Error("Evidence gates reject unverified TTSC_BINARY overrides.");
  const binary: string = binaryLoader.resolve(
    `@ttsc/${process.platform}-${process.arch}/bin/${process.platform === "win32" ? "ttsc.exe" : "ttsc"}`,
  );
  return {
    harnessVersion: `sha256:${codeDigest(path.dirname(__dirname))}`,
    compilerVersion: `sha256:${productionGateHash(compiler.map((entry: string): string => codeDigest(packageRoot(entry))).join("\n"))}`,
    runtimeProvenance: {
      platform: process.platform,
      architecture: process.arch,
      binarySha256: productionGateHash(fs.readFileSync(binary)),
    },
  };
}

/**
 * Hashes portable runtime source paths and UTF-8 text, leaving authored input bytes untouched.
 *
 * Principled implementation: Sorts selected implementation paths bytewise, separates names and content with NUL bytes and normalizes CRLF only in implementation text before SHA-256 hashing.
 * Clear and simple design: One digest owns recursive selection and canonical byte framing for library/compiler identity.
 * Prohibited implementation shortcuts: Dependency, git and test directories are excluded as nonexecuting implementation inputs; package manifests and executable source formats remain included.
 * Meaningful documentation: The comment states the portable source boundary; inline selection and framing show which formats and bytes enter the digest.
 * Efficient algorithms: Visits the directory tree once, sorts F selected paths in O(F log F), then reads B source bytes with O(B+F) retained buffers; the complete read is needed to identify changed implementation bytes.
 * Reuse equivalent work: Each selected file is read once for this digest. Calls do not share a cache because rebuilds can replace files without changing the requested root.
 * Bound retention and release resources: File reads are synchronous and closed before return; path lists and concatenated buffers are released after the returned hash is produced.
 */
function codeDigest(root: string): string {
  const collect: (directory: string) => string[] = (
    directory: string,
  ): string[] =>
    fs
      .readdirSync(directory, { withFileTypes: true })
      .flatMap((entry: fs.Dirent<string>): string[] => {
        const target: string = path.join(directory, entry.name);
        if (["node_modules", ".git", "test", "tests"].includes(entry.name))
          return [];
        return entry.isDirectory()
          ? collect(target)
          : entry.isFile() &&
              (/\.(?:ts|js|cjs|mjs|go|mod|sum)$/u.test(entry.name) ||
                entry.name === "package.json")
            ? [target]
            : [];
      });
  const entries: string[] = collect(root).sort(
    (a: string, b: string): 0 | 1 | -1 =>
      Buffer.compare(
        Buffer.from(path.relative(root, a).replaceAll(path.sep, "/")),
        Buffer.from(path.relative(root, b).replaceAll(path.sep, "/")),
      ),
  );
  return productionGateHash(
    Buffer.concat(
      entries.flatMap((file: string): Buffer<ArrayBuffer>[] => [
        Buffer.from(path.relative(root, file).replaceAll(path.sep, "/")),
        Buffer.from([0]),
        Buffer.from(
          new TextDecoder("utf-8", { fatal: true })
            .decode(fs.readFileSync(file))
            .replaceAll("\r\n", "\n"),
        ),
        Buffer.from([0]),
      ]),
    ),
  );
}

/**
 * Finds the nearest package manifest owning an executing dependency entry.
 *
 * Principled implementation: Ascends directory parents until package.json exists, rejecting filesystem-root exhaustion rather than guessing a package boundary.
 * Clear and simple design: This helper owns only dependency-root discovery for the implementation digest.
 * Prohibited implementation shortcuts: It uses actual resolved entries without package-name or fixture-path special cases.
 * Meaningful documentation: The comment states nearest-manifest ownership, and exhaustion throws an explicit identification failure.
 * Efficient algorithms: Performs one existence check per ancestor with O(depth) time and constant additional storage.
 * Reuse equivalent work: Roots are discovered for the fixed dependency set of one runtime capture; no persistent filesystem result is assumed fresh.
 * Bound retention and release resources: Existence checks retain no handles; only the returned directory string escapes.
 */
function packageRoot(entry: string): string {
  let current: string = path.dirname(entry);
  while (!fs.existsSync(path.join(current, "package.json"))) {
    const next: string = path.dirname(current);
    if (next === current)
      throw new Error("Cannot identify the executing compiler package.");
    current = next;
  }
  return current;
}
