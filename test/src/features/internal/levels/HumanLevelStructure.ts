import fs from "node:fs";
import path from "node:path";
import ts from "typescript-compiler";

/**
 * The Human source's structural debt, read from the files' syntax: the rules
 * of the `human` skill's construction (every piece in its own file with a
 * rule of its own, common mathematics in one shared module) and of the
 * testing skill (nothing outlives its test).
 *
 * Four kinds of finding:
 *
 * - `forward`: a file whose every function only returns one call of another
 *   function with its own parameters, so it adds no rule and belongs in its
 *   owner's table.
 * - `constant`: a file that holds one short constant and no function, so it
 *   belongs in its owner's table; a table (a part's prior, a list of rows) is
 *   its own owner.
 * - `twin`: two files whose code is the same once every name, number and
 *   string is masked, one rule written twice. Test entry files (`test_*.ts`)
 *   are not judged: each names one check and calls the rule its helper holds.
 * - `state`: in the tests and their helpers, a value at module scope written
 *   after load (a `let` assigned again, a `Map` or `Set` filled or emptied),
 *   a cache that outlives its test; a fixed lookup set is not, nor a
 *   `WeakMap` keyed by the test's own object, which dies with it. The
 *   library's own memos are not judged here: the testing skill binds what a
 *   test keeps.
 */
export namespace HumanLevelStructure {
  /** One source file. */
  export interface IFile {
    /** Path relative to the repository root, forward slashes. */
    name: string;

    /** The file's text. */
    text: string;
  }

  /** One finding. */
  export interface IFinding {
    /** The kind of debt. */
    kind: "forward" | "constant" | "twin" | "state";

    /** The file. */
    file: string;

    /** What was read. */
    detail: string;
  }

  /** The repository root. */
  export const REPOSITORY: string = path.resolve(__dirname, "../../../../..");

  /** The folders read: the Human library, its tests and the tests' Human helpers. */
  export const ROOTS: readonly string[] = ["packages/human/src", "test/src/features/human", "test/src/features/internal"];

  /** Masked tokens two files must share at least to be twins, so two small records of one shape do not count. */
  export const TWIN_TOKENS: number = 80;

  /** Masked tokens of a lone constant's initializer at most: a value or a short expression, where a longer one is a table, such as a part's prior, whose file is the table's owner. */
  export const SMALL: number = 20;

  /**
   * Every TypeScript file of the read folders that belongs to the Human: all
   * of the library and its tests, and the helpers named `Human...` or kept in
   * a Human helper folder.
   */
  export function read(): IFile[] {
    const out: IFile[] = [];
    for (const root of ROOTS) walk(path.join(REPOSITORY, root), out);
    return out
      .filter((f: IFile): boolean => !f.name.startsWith("test/src/features/internal/") || human(f.name))
      .sort((a: IFile, b: IFile): number => a.name.localeCompare(b.name));
  }

  /**
   * Every finding of the files, the twins listed once per group.
   *
   * @param files The files.
   * @returns The findings by file.
   */
  export function findings(files: readonly IFile[]): IFinding[] {
    const out: IFinding[] = [];
    const masks: Map<string, string[]> = new Map<string, string[]>();
    for (const file of files) {
      if (file.name.endsWith("/index.ts")) continue;
      const source: ts.SourceFile = ts.createSourceFile(file.name, file.text, ts.ScriptTarget.Latest, true);
      const shape: IShape = shapeOf(source);
      if (shape.functions.length !== 0 && shape.functions.every((f: ts.FunctionLikeDeclaration): boolean => forwards(f)) && shape.values === 0 && shape.classes === 0)
        out.push({ kind: "forward", file: file.name, detail: `${shape.functions.length} function(s), each one returned call of another` });
      if (shape.functions.length === 0 && shape.classes === 0 && shape.values === 1 && shape.small === 1)
        out.push({ kind: "constant", file: file.name, detail: "one constant and no function" });
      if (file.name.startsWith("test/")) for (const s of shape.state) out.push({ kind: "state", file: file.name, detail: s });
      if (path.posix.basename(file.name).startsWith("test_") || (shape.functions.length === 0 && shape.values === 0)) continue;
      const tokens: string[] = masked(file.text);
      if (tokens.length < TWIN_TOKENS) continue;
      const key: string = tokens.join(" ");
      masks.set(key, [...(masks.get(key) ?? []), file.name]);
    }
    for (const group of masks.values())
      if (group.length > 1) for (const name of group) out.push({ kind: "twin", file: name, detail: `same masked code as ${group.filter((g: string): boolean => g !== name).join(", ")}` });
    return out;
  }

  /**
   * The file's tokens with every name, number and string masked and every
   * comment dropped.
   *
   * @param text The file's text.
   * @returns The masked tokens.
   */
  export function masked(text: string): string[] {
    const scanner: ts.Scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, text);
    const out: string[] = [];
    for (let kind: ts.SyntaxKind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
      if (kind === ts.SyntaxKind.Identifier) out.push("I");
      else if (kind === ts.SyntaxKind.NumericLiteral) out.push("N");
      else if (kind === ts.SyntaxKind.StringLiteral || kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral || kind === ts.SyntaxKind.TemplateHead) out.push("S");
      else out.push(scanner.getTokenText());
    }

    // Imports name other files and say nothing of the rule.
    return out.filter((_: string, k: number): boolean => k >= importEnd(out));
  }
}

/** What a file declares at module and namespace scope. */
interface IShape {
  /** Functions declared at module or namespace scope. */
  functions: ts.FunctionLikeDeclaration[];

  /** Value declarations (`const`, `let`, `var`) at module or namespace scope. */
  values: number;

  /** Value declarations whose initializer is a short expression with no function, not a table: at most `SMALL` tokens. */
  small: number;

  /** Classes. */
  classes: number;

  /** Mutable module state, one line each. */
  state: string[];
}

/**
 * The declarations of a file at module scope and inside its namespaces.
 *
 * @param source The parsed file.
 * @returns Its shape.
 */
function shapeOf(source: ts.SourceFile): IShape {
  const shape: IShape = { functions: [], values: 0, small: 0, classes: 0, state: [] };
  const text: string = source.getFullText();
  const visit: (statements: ts.NodeArray<ts.Statement>) => void = (statements: ts.NodeArray<ts.Statement>): void => {
    for (const s of statements) {
      if (ts.isFunctionDeclaration(s) && s.body !== undefined) shape.functions.push(s);
      else if (ts.isClassDeclaration(s)) shape.classes++;
      else if (ts.isModuleDeclaration(s) && s.body !== undefined && ts.isModuleBlock(s.body)) visit(s.body.statements);
      else if (ts.isVariableStatement(s))
        for (const d of s.declarationList.declarations) {
          const init: ts.Expression | undefined = d.initializer;
          if (init !== undefined && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
            shape.functions.push(init);
            continue;
          }
          shape.values++;
          if (init === undefined || (HumanLevelStructure.masked(init.getText()).length <= HumanLevelStructure.SMALL && !/=>|function/.test(init.getText()))) shape.small++;
          const line: number = source.getLineAndCharacterOfPosition(d.getStart()).line + 1;
          const name: string = d.name.getText();

          // State is a value written after its declaration: a `let` assigned
          // again, or a `Map` or `Set` filled or emptied; a fixed lookup set is not.
          // Every declaration carries its type, so `name =` is never the declaration itself.
          const assigned: number = (text.match(new RegExp(`(?<![.\\w])${name}\\s*(?:\\?\\?|\\|\\||&&)?=(?!=)`, "g")) ?? []).length;
          const written: boolean = new RegExp(`(?<![.\\w])${name}\\.(?:set|add|delete|clear)\\(`).test(text);
          if ((s.declarationList.flags & ts.NodeFlags.Let) !== 0 && assigned > 0) shape.state.push(`line ${line}: module-scope let ${name}, assigned again`);
          else if (init !== undefined && ts.isNewExpression(init) && /^(Map|Set)$/.test(init.expression.getText()) && written)
            shape.state.push(`line ${line}: module-scope ${init.expression.getText()} ${d.name.getText()}`);
        }
    }
  };
  visit(source.statements);
  return shape;
}

/**
 * Whether a function only returns one call of another function whose
 * arguments are its own parameters, or plain reads of them, passed on as
 * they came.
 *
 * @param f The function.
 * @returns Whether it forwards.
 */
function forwards(f: ts.FunctionLikeDeclaration): boolean {
  const body: ts.ConciseBody | undefined = f.body;
  if (body === undefined) return false;
  const value: ts.Expression | undefined = ts.isBlock(body)
    ? body.statements.length === 1 && ts.isReturnStatement(body.statements[0]!)
      ? body.statements[0].expression
      : undefined
    : body;
  if (value === undefined || !ts.isCallExpression(value)) return false;
  const names: Set<string> = new Set(f.parameters.map((p: ts.ParameterDeclaration): string => p.name.getText()));
  const plain: (e: ts.Expression) => boolean = (e: ts.Expression): boolean =>
    ts.isIdentifier(e) ? names.has(e.text) : ts.isPropertyAccessExpression(e) ? plain(e.expression) : false;
  return value.arguments.every(plain);
}

/**
 * The index of the first masked token after the file's import statements.
 *
 * @param tokens The masked tokens.
 * @returns That index.
 */
function importEnd(tokens: readonly string[]): number {
  let k: number = 0;
  while (tokens[k] === "import") {
    while (k < tokens.length && tokens[k] !== ";") k++;
    k++;
  }
  return k;
}

/**
 * Whether a helper of the shared test folder belongs to the Human.
 *
 * @param name Its path from the repository root.
 * @returns Whether it does.
 */
function human(name: string): boolean {
  const rest: string = name.slice("test/src/features/internal/".length);
  return /^(Human|arm\/|foot\/|head\/|leg\/|levels\/|limbs\/|curves\/|reference\/|region\/|universality\/)/.test(rest) || /\/Human[A-Z]/.test(name);
}

/**
 * Collect every TypeScript file under a folder.
 *
 * @param directory The folder.
 * @param out The list the files are added to.
 */
function walk(directory: string, out: HumanLevelStructure.IFile[]): void {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const location: string = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(location, out);
    else if (entry.isFile() && /\.(?:ts|tsx|mts|cts)$/u.test(entry.name) && !entry.name.endsWith(".d.ts"))
      out.push({ name: path.relative(HumanLevelStructure.REPOSITORY, location).split(path.sep).join("/"), text: fs.readFileSync(location, "utf8") });
  }
}
