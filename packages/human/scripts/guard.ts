// Refuse external data before the Human build compiles anything. The person
// must come from typed parameters through code and formulas, so the package
// may hold only source, documentation and its own configuration, every file
// stays small, and no source embeds a long run of numbers.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript-compiler";

/** Package root, the parent of this script's directory. */
const ROOT: string = path.resolve(__dirname, "..");

/** Directories holding installed dependencies or ignored build output. */
const SKIPPED_DIRECTORIES: ReadonlySet<string> = new Set([
  "node_modules",
  "lib",
]);

/** Extensions any file of the package may have. */
const ALLOWED_EXTENSIONS: ReadonlySet<string> = new Set([".ts", ".md"]);

/** Exact files allowed at the package root besides the extensions above. */
const ROOT_FILES: ReadonlySet<string> = new Set(["package.json", "LICENSE"]);

/** Largest file the package may hold, in bytes. */
const MAX_FILE_BYTES: number = 256 * 1024;

/** Most numeric elements one array literal under `src` may hold. */
const MAX_NUMERIC_ELEMENTS: number = 64;

/**
 * Whether a root-level file name is the package's own configuration.
 *
 * @param name File name relative to the package root
 * @returns Whether the file is allowed regardless of its extension
 */
const isRootConfiguration: (name: string) => boolean = (
  name: string,
): boolean => ROOT_FILES.has(name) || /^tsconfig.*\.json$/.test(name);

/**
 * Every file of the package outside skipped directories, as paths relative
 * to the package root with forward slashes.
 *
 * @param directory Directory to list, relative to the package root
 * @returns Relative file paths in directory order
 */
const listFiles: (directory: string) => string[] = (
  directory: string,
): string[] => {
  const files: string[] = [];
  for (const entry of fs.readdirSync(path.join(ROOT, directory), {
    withFileTypes: true,
  })) {
    const relative: string =
      directory === "" ? entry.name : `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name))
        files.push(...listFiles(relative));
    } else files.push(relative);
  }
  return files;
};

/**
 * Whether an array element is a numeric literal, optionally signed.
 *
 * @param element Array literal element
 * @returns Whether the element spells a number directly
 */
const isNumericElement: (element: ts.Expression) => boolean = (
  element: ts.Expression,
): boolean =>
  ts.isNumericLiteral(element) ||
  (ts.isPrefixUnaryExpression(element) &&
    (element.operator === ts.SyntaxKind.MinusToken ||
      element.operator === ts.SyntaxKind.PlusToken) &&
    ts.isNumericLiteral(element.operand));

/**
 * Causes for every array literal in one source file holding more numeric
 * elements than the limit.
 *
 * @param file Source path relative to the package root
 * @returns One cause per offending array literal
 */
const findNumericArrays: (file: string) => string[] = (
  file: string,
): string[] => {
  const source: ts.SourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(path.join(ROOT, file), "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const causes: string[] = [];
  const visit: (node: ts.Node) => void = (node: ts.Node): void => {
    if (ts.isArrayLiteralExpression(node)) {
      const count: number = node.elements.filter(isNumericElement).length;
      if (count > MAX_NUMERIC_ELEMENTS) {
        const line: number =
          source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
        causes.push(
          `${file}:${line}: array literal holds ${count} numeric elements, above the limit of ${MAX_NUMERIC_ELEMENTS}; generate the values by a formula instead of embedding data`,
        );
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return causes;
};

const causes: string[] = [];
for (const file of listFiles("")) {
  const name: string = path.posix.basename(file);
  const atRoot: boolean = !file.includes("/");
  if (
    !ALLOWED_EXTENSIONS.has(path.posix.extname(name)) &&
    !(atRoot && isRootConfiguration(name))
  ) {
    causes.push(
      `${file}: file type is not allowed; the package holds only .ts and .md files, package.json, tsconfig*.json and LICENSE`,
    );
    continue;
  }
  const bytes: number = fs.statSync(path.join(ROOT, file)).size;
  if (bytes > MAX_FILE_BYTES)
    causes.push(
      `${file}: file holds ${bytes} bytes, above the limit of ${MAX_FILE_BYTES}`,
    );
  if (file.startsWith("src/") && name.endsWith(".ts"))
    causes.push(...findNumericArrays(file));
}
if (causes.length !== 0) {
  for (const cause of causes) console.error(`human guard: ${cause}`);
  process.exitCode = 1;
}
