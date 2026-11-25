import { parse } from "@babel/parser";
import fs from "node:fs";
import path from "node:path";

import { hasMatchingFile } from "./hasMatchingFile";

/**
 * Check the inputs for a separate catalog. An explicit selection always
 * requires its inputs. With composition alone, existing catalog artifacts
 * retain the catalog check. The director verifies registration, playback and
 * the tested conditions at the handoff.
 *
 * @param location Absolute production directory.
 * @param required Whether the production selected the catalog explicitly.
 * @returns Whether the production selected the catalog.
 * @throws Error listing the missing film, record or case sources.
 */
export function assertFilmCatalogLayout(
  location: string,
  required: boolean,
): boolean {
  const catalog: string = "src/composition/films/catalog.ts";
  const record: string = "docs/acceptance/catalog.md";
  const cases: string = "src/composition/scenes/catalog/**/*.ts";
  const hasFilm: boolean = hasMatchingFile(location, catalog, []);
  const sources: string[] = fs
    .globSync(cases, { cwd: location, exclude: ["**/*.d.ts"] })
    .map((file: string): string => path.join(location, file))
    .filter(
      (file: string): boolean =>
        fs.statSync(file, { throwIfNoEntry: false })?.isFile() === true,
    );
  if (!required && !hasFilm && sources.length === 0) return false;

  const missing: string[] = [];
  if (!hasFilm || !hasCatalogFunction(path.join(location, catalog)))
    missing.push(catalog);
  if (!hasMatchingFile(location, record, [])) missing.push(record);
  if (!sources.some(hasCatalogFunction)) missing.push(cases);
  if (missing.length !== 0)
    throw new Error(
      `Review catalog is incomplete. Missing: ${missing.join(", ")}`,
    );
  return true;
}

/** Top-level declarations and publication statements in a catalog module. */
type CatalogStatement = ReturnType<typeof parse>["program"]["body"][number];

/** An expression assigned to a variable or class field. */
type CatalogExpression = NonNullable<
  Extract<
    CatalogStatement,
    { type: "VariableDeclaration" }
  >["declarations"][number]["init"]
>;

/** Checks the source-owned function surface without executing the production. */
function hasCatalogFunction(file: string): boolean {
  const source: string = fs.readFileSync(file, "utf8");
  let module: ReturnType<typeof parse>;
  try {
    module = parse(source, {
      sourceType: "module",
      plugins: ["typescript", "decorators-legacy"],
    });
  } catch {
    return false;
  }
  return hasExportedCatalogFunction(module.program.body);
}

/** Finds a callable declaration directly exported or published by local name. */
function hasExportedCatalogFunction(statements: CatalogStatement[]): boolean {
  const local: Set<string> = new Set();
  const exported: Set<string> = new Set();
  for (const statement of statements) {
    if (statement.type === "ExportNamedDeclaration") {
      if (statement.exportKind === "type" || statement.source) continue;
      if (
        statement.declaration &&
        callableNames(statement.declaration).length !== 0
      )
        return true;
      for (const specifier of statement.specifiers)
        if (
          specifier.type === "ExportSpecifier" &&
          specifier.exportKind !== "type"
        )
          exported.add(specifier.local.name);
    } else if (statement.type === "ExportDefaultDeclaration") {
      const declaration: typeof statement.declaration = statement.declaration;
      if (declaration.type === "Identifier") exported.add(declaration.name);
      else if (
        declaration.type === "FunctionDeclaration" ||
        (declaration.type === "ClassDeclaration" &&
          hasPublicCaseMethod(declaration)) ||
        (declaration.type !== "ClassDeclaration" &&
          declaration.type !== "TSDeclareFunction" &&
          isCallableExpression(declaration))
      )
        return true;
    } else {
      for (const name of callableNames(statement)) local.add(name);
    }
  }
  return [...exported].some((name: string): boolean => local.has(name));
}

/** Returns names with function implementations in a local declaration. */
function callableNames(statement: CatalogStatement): string[] {
  if (statement.type === "FunctionDeclaration")
    return statement.id ? [statement.id.name] : [];
  if (statement.type === "ClassDeclaration")
    return statement.id && !statement.declare && hasPublicCaseMethod(statement)
      ? [statement.id.name]
      : [];
  if (statement.type === "TSModuleDeclaration")
    return !statement.declare &&
      statement.id.type === "Identifier" &&
      statement.body?.type === "TSModuleBlock" &&
      hasExportedCatalogFunction(statement.body.body)
      ? [statement.id.name]
      : [];
  if (statement.type !== "VariableDeclaration" || statement.kind !== "const")
    return [];
  return statement.declarations.flatMap((binding): string[] =>
    binding.id.type === "Identifier" && isCallableExpression(binding.init)
      ? [binding.id.name]
      : [],
  );
}

/** Recognizes publicly callable methods and function-valued fields. */
function hasPublicCaseMethod(
  declaration: Extract<CatalogStatement, { type: "ClassDeclaration" }>,
): boolean {
  return declaration.body.body.some((member): boolean => {
    if (
      (member.type !== "ClassMethod" && member.type !== "ClassProperty") ||
      member.accessibility === "private" ||
      member.accessibility === "protected"
    )
      return false;
    if (member.type === "ClassMethod") return member.kind === "method";

    const annotation: typeof member.typeAnnotation = member.typeAnnotation;
    if (annotation?.type !== "TSTypeAnnotation")
      return isCallableExpression(member.value);
    let type: typeof annotation.typeAnnotation = annotation.typeAnnotation;
    while (type.type === "TSParenthesizedType") type = type.typeAnnotation;
    return isCallableExpression(member.value, type.type === "TSFunctionType");
  });
}

/** Looks through type annotations to the attached function expression. */
function isCallableExpression(
  expression: CatalogExpression | null | undefined,
  allowFactory: boolean = false,
): boolean {
  while (
    expression?.type === "TSAsExpression" ||
    expression?.type === "TSNonNullExpression" ||
    expression?.type === "TSSatisfiesExpression" ||
    expression?.type === "TSTypeAssertion"
  )
    expression = expression.expression;
  return (
    expression?.type === "ArrowFunctionExpression" ||
    expression?.type === "FunctionExpression" ||
    (allowFactory && expression?.type === "CallExpression")
  );
}
