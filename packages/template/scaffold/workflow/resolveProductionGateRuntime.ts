import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { productionGateHash } from "./internal/productionGateHash";

/** Binds the actual executing config and compiler/plugin code, not a typed label. */
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
  const compiler: string[] = [
    loader.resolve("ttsc"),
    loader.resolve("@wrtnlabs/evidence"),
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
    harnessVersion: `sha256:${codeDigest(path.join(location, "workflow"))}`,
    compilerVersion: `sha256:${productionGateHash(compiler.map((entry: string): string => codeDigest(packageRoot(entry))).join("\n"))}`,
    runtimeProvenance: {
      platform: process.platform,
      architecture: process.arch,
      binarySha256: productionGateHash(fs.readFileSync(binary)),
    },
  };
}

/** Runtime source identity is portable; authored production input bytes remain exact. */
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
        Buffer.from(path.relative(root, a)),
        Buffer.from(path.relative(root, b)),
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

/** Package manifests and native/plugin sources are part of compiler identity. */
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
