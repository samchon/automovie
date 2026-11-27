import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(websiteRoot, "..");
const packageRoot = path.join(repositoryRoot, "packages", "archetypes");
const manifestPath = path.join(packageRoot, "package.json");
const rootEntryPath = path.join(packageRoot, "src", "index.ts");
const outputPath = path.join(
  websiteRoot,
  "src",
  "archetypes",
  "ArchetypeFamilyExports.generated.ts",
);

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const publishedExports = manifest.publishConfig?.exports;
if (publishedExports === null || typeof publishedExports !== "object")
  throw new Error(`${manifestPath} has no publishConfig.exports map.`);

function parse(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing TypeScript entry: ${filePath}`);
  return ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function moduleSpecifierOf(node) {
  return ts.isStringLiteral(node.moduleSpecifier)
    ? node.moduleSpecifier.text
    : undefined;
}

function resolveSource(fromPath, specifier) {
  if (!specifier.startsWith(".")) return undefined;
  const base = path.resolve(path.dirname(fromPath), specifier);
  for (const candidate of [
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.d.ts`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
    path.join(base, "index.d.ts"),
  ])
    if (fs.existsSync(candidate)) return candidate;
  throw new Error(`Cannot resolve ${specifier} from ${fromPath}`);
}

function sourceTargetFromPublishedTypes(entry) {
  const types = typeof entry === "string" ? entry : entry?.types;
  if (typeof types !== "string" || !types.startsWith("./lib/"))
    throw new Error(`Unsupported published category target: ${JSON.stringify(entry)}`);
  const sourceTarget = types.replace(/^\.\/lib\//, "./src/").replace(/\.d\.ts$/, ".ts");
  return path.resolve(packageRoot, sourceTarget);
}

const rootEntry = parse(rootEntryPath);
const rootStars = new Set(
  rootEntry.statements.flatMap((statement) => {
    if (!ts.isExportDeclaration(statement) || statement.exportClause !== undefined)
      return [];
    const specifier = moduleSpecifierOf(statement);
    return specifier?.startsWith("./") ? [specifier.slice(2)] : [];
  }),
);

function exportedNames(entryPath, visiting = new Set()) {
  const normalized = path.resolve(entryPath);
  if (visiting.has(normalized)) return [];
  const nextVisiting = new Set(visiting);
  nextVisiting.add(normalized);
  const source = parse(normalized);
  const names = [];
  const seen = new Set();
  const append = (name) => {
    if (name !== "default" && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  };

  for (const statement of source.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.isTypeOnly) continue;
      const specifier = moduleSpecifierOf(statement);
      if (statement.exportClause === undefined) {
        if (specifier === undefined) continue;
        for (const name of exportedNames(
          resolveSource(normalized, specifier),
          nextVisiting,
        )) append(name);
      } else if (ts.isNamedExports(statement.exportClause)) {
        const available =
          specifier === undefined
            ? undefined
            : new Set(
                exportedNames(
                  resolveSource(normalized, specifier),
                  nextVisiting,
                ),
              );
        for (const element of statement.exportClause.elements) {
          const sourceName = element.propertyName?.text ?? element.name.text;
          if (
            !element.isTypeOnly &&
            (available === undefined || available.has(sourceName))
          )
            append(element.name.text);
        }
      } else if (ts.isNamespaceExport(statement.exportClause)) {
        append(statement.exportClause.name.text);
      }
      continue;
    }

    if (
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    ) {
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations)
          if (ts.isIdentifier(declaration.name)) append(declaration.name.text);
      } else if (
        (ts.isFunctionDeclaration(statement) ||
          ts.isClassDeclaration(statement) ||
          ts.isEnumDeclaration(statement) ||
          ts.isModuleDeclaration(statement)) &&
        statement.name !== undefined
      ) append(statement.name.text);
    }
  }
  return names;
}

const families = [];
for (const [route, target] of Object.entries(publishedExports)) {
  const match = /^\.\/([^/]+)$/.exec(route);
  if (match === null) continue;
  const group = match[1];
  if (!rootStars.has(group)) continue;
  const names = exportedNames(sourceTargetFromPublishedTypes(target));
  families.push([group, names]);
}
if (families.length === 0)
  throw new Error("No published archetype family entrypoints intersect root topic exports.");

const body = [
  "/**",
  " * Generated from @automovie/archetypes publishConfig.exports and its root",
  " * topic re-exports. Run `pnpm run generate:archetype-family-exports` to refresh.",
  " */",
  "export const ARCHETYPE_FAMILY_EXPORTS = {",
  ...families.flatMap(([group, names]) => [
    `  ${JSON.stringify(group)}: [`,
    ...names.map((name) => `    ${JSON.stringify(name)},`),
    "  ],",
  ]),
  "} as const;",
  "",
].join("\n");

const current = fs.existsSync(outputPath)
  ? fs.readFileSync(outputPath, "utf8").replace(/^\uFEFF/, "")
  : undefined;
if (process.argv.includes("--check")) {
  if (current !== body) {
    console.error(
      `Stale generated archetype family exports: ${path.relative(repositoryRoot, outputPath)}. ` +
        "Run `pnpm run generate:archetype-family-exports`.",
    );
    process.exitCode = 1;
  } else console.log("archetype family exports: generated data is current");
} else {
  fs.writeFileSync(outputPath, body, "utf8");
  console.log(
    `generated ${path.relative(repositoryRoot, outputPath)} from ${families.length} published root categories`,
  );
}
