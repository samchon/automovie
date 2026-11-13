// Refuse an import that reaches inside a workspace package.
//
// The site may import a package only through an entry its `exports` names,
// such as `@automovie/motions` or `@automovie/archetypes/furniture`. A deep
// import (`@automovie/motions/src/...`) or a relative path into `packages/`
// would let a package's internal change break the site, which is how the
// previous playground stopped compiling. `pnpm build` runs this before Next.
import fs from "node:fs";
import path from "node:path";

const root: string = path.resolve(__dirname, "..");
const packages: string = path.resolve(root, "..", "packages");

/** An import, a dynamic import or a require with a literal specifier. */
const IMPORT: RegExp =
  /(?:from\s+|import\s*\(\s*|require\s*\(\s*|import\s+)["']([^"']+)["']/g;

/** The subpaths each `@automovie/*` package exports, by package name, read from the packages' manifests. */
const exported: Map<string, Set<string>> = new Map();
for (const dir of fs.readdirSync(packages)) {
  const file: string = path.join(packages, dir, "package.json");
  if (!fs.existsSync(file)) continue;
  const manifest: { name?: string; exports?: Record<string, unknown> } =
    JSON.parse(fs.readFileSync(file, "utf8"));
  if (manifest.name === undefined) continue;
  exported.set(
    manifest.name,
    new Set(
      Object.keys(manifest.exports ?? { ".": "" }).map((key: string): string =>
        key.replace(/^\.\/?/, ""),
      ),
    ),
  );
}

/** Every source file under a directory, skipping dependencies and build output. */
const walk = (dir: string): string[] =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry: fs.Dirent): string[] => {
      const full: string = path.join(dir, entry.name);
      if (entry.isDirectory())
        return ["node_modules", ".next", "out", ".shots"].includes(entry.name)
          ? []
          : walk(full);
      return /\.(ts|tsx|js|jsx|mjs|mdx)$/.test(entry.name) ? [full] : [];
    });

const violations: string[] = [];
for (const file of walk(root)) {
  if (file === __filename) continue;
  const text: string = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(IMPORT)) {
    const specifier: string = match[1]!;
    const scoped: RegExpExecArray | null =
      /^(@automovie\/[^/]+)(?:\/(.+))?$/.exec(specifier);

    // A package this repository does not hold, or the bare package name, is
    // not a deep import.
    const deep: boolean =
      scoped !== null &&
      exported.has(scoped[1]!) &&
      !exported.get(scoped[1]!)!.has(scoped[2] ?? "");
    const relative: boolean =
      specifier.startsWith(".") &&
      path
        .resolve(path.dirname(file), specifier)
        .startsWith(packages + path.sep);
    if (deep || relative)
      violations.push(`${path.relative(root, file)}: ${specifier}`);
  }
}

if (violations.length !== 0) {
  console.error(
    "The site imports a workspace package past its public entry:\n" +
      violations.map((line: string): string => `  ${line}`).join("\n"),
  );
  process.exit(1);
}
console.log("imports: every @automovie import uses a public entry");
