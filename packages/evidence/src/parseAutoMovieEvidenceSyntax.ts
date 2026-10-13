import ts from "typescript-compiler";
import type { IAutoMovieEvidenceSyntaxDocument } from "./IAutoMovieEvidenceSyntaxDocument";
import type { IAutoMovieEvidenceSyntaxAnnotation } from "./IAutoMovieEvidenceSyntaxAnnotation";
import { projectAutoMovieMarkdownSyntax } from "./projectAutoMovieMarkdownSyntax";
import { annotationLines } from "./parseAutoMovieEvidenceSyntaxInternal/annotationLines";


/**
 * Parses evidence declarations from Markdown comments or TypeScript JSDoc.
 *
 * Markdown fences retain their marker character and opening length, indented code never changes outer comment or fence state, and TypeScript strings and ordinary comments never become carriers. The result therefore supplies one structural owner to target validation and retained-pilot identity without reimplementing graph selection or judging prose quality.
 *
 *
 * @evidence contracts/common.md#principled-implementation Markdown uses live comment carriers and TypeScript uses scanner tokens plus AST-owned public JSDoc starts; strings and ordinary comments never become evidence declarations.
 * @evidence contracts/common.md#clear-and-simple-design One carrier parser supplies exact host and line addresses to structural validators without reproducing graph selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fenced and indented examples remain noncarriers, and exported/private ancestry controls TypeScript ownership; no lexical prose score is computed.
 * @evidence contracts/common.md#meaningful-documentation The comment states native carrier boundaries and source-address ownership; returned rows preserve joined declaration text.
 * @evidence contracts/performance.md#efficient-algorithms For L source characters and A annotations, TypeScript builds one AST and token scan; per-comment line lookup can add O(A L) character scans, a remaining repeated cost. Markdown projection costs are owned by its helper.
 * @evidence contracts/performance.md#reuse-equivalent-work One public-JSDoc set is shared by the TypeScript token scan; parsed answers are not cached across changed source text.
 * @evidence contracts/performance.md#bound-retention-and-release-resources AST nodes, token scanner and annotation arrays remain local until output transfers; complete input text has no size cap in this parser and is caller-owned.
 */
export function parseAutoMovieEvidenceSyntax(
  document: IAutoMovieEvidenceSyntaxDocument,
): readonly IAutoMovieEvidenceSyntaxAnnotation[] {
  return /\.md$/iu.test(document.path)
    ? projectAutoMovieMarkdownSyntax(document).annotations
    : typescriptAnnotations(document);
}


/** Extract TypeScript annotations from documentation comments only. */
function typescriptAnnotations(
  document: IAutoMovieEvidenceSyntaxDocument,
): IAutoMovieEvidenceSyntaxAnnotation[] {
  const publicStarts: Set<number> = publicTypeScriptJSDocStarts(document);
  const scanner: ts.Scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.Standard,
    document.source,
  );
  const output: IAutoMovieEvidenceSyntaxAnnotation[] = [];
  for (let token: ts.SyntaxKind = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; ) {
    if (token === ts.SyntaxKind.MultiLineCommentTrivia) {
      const text: string = scanner.getTokenText();
      if (text.startsWith("/**") && publicStarts.has(scanner.getTokenPos())) {
        const line: number = lineOf(document.source, scanner.getTokenPos());
        const host: string = `${document.path}::docblock@${line}`;
        output.push(
          ...annotationLines(text.slice(3, -2), line).map((annotation: { endLine: number; line: number; text: string; }) : { host: string; endLine: number; line: number; text: string; } => ({
            ...annotation,
            host,
          })),
        );
      }
    }
    token = scanner.scan();
  }
  return output;
}


/** Locate JSDoc attached to exported declarations and their public members. */
function publicTypeScriptJSDocStarts(
  document: IAutoMovieEvidenceSyntaxDocument,
): Set<number> {
  const sourceFile: ts.SourceFile = ts.createSourceFile(
    document.path,
    document.source,
    ts.ScriptTarget.Latest,
    true,
    /\.tsx$/iu.test(document.path) ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const localExports: Set<string> = new Set<string>();
  for (const statement of sourceFile.statements)
    if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier === undefined &&
      statement.exportClause !== undefined &&
      ts.isNamedExports(statement.exportClause)
    )
      for (const element of statement.exportClause.elements)
        localExports.add((element.propertyName ?? element.name).text);
  const output: Set<number> = new Set<number>();
  const visit: (node: ts.Node) => void = (node: ts.Node): void => {
    if (isPublicTypeScriptNode(node, localExports)) {
      const docs: readonly { end: number; pos: number; }[] | undefined = (
        node as ts.Node & {
          jsDoc?: readonly { end: number; pos: number }[];
        }
      ).jsDoc;
      for (const doc of docs ?? []) {
        const start: number = document.source.indexOf("/**", doc.pos);
        if (start !== -1 && start < doc.end) output.add(start);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return output;
}


/** Decide whether a declaration belongs to one exported, non-private surface. */
function isPublicTypeScriptNode(
  node: ts.Node,
  localExports: ReadonlySet<string>,
): boolean {
  let current: ts.Node = node;
  while (
    current.parent !== undefined &&
    current.parent.kind !== ts.SyntaxKind.SourceFile
  ) {
    if (
      current.kind === ts.SyntaxKind.Block ||
      (current.parent.kind === ts.SyntaxKind.ModuleBlock &&
        !hasModifier(current, ts.SyntaxKind.ExportKeyword)) ||
      isPrivateNamedNode(current) ||
      hasModifier(current, ts.SyntaxKind.PrivateKeyword) ||
      hasModifier(current, ts.SyntaxKind.ProtectedKeyword)
    )
      return false;
    current = current.parent;
  }
  return (
    current.parent?.kind === ts.SyntaxKind.SourceFile &&
    (hasModifier(current, ts.SyntaxKind.ExportKeyword) ||
      hasModifier(current, ts.SyntaxKind.DefaultKeyword) ||
      topLevelDeclarationNames(current).some((name: string) : boolean => localExports.has(name)))
  );
}


/** Recognize ECMAScript `#private` declarations without a private modifier. */
function isPrivateNamedNode(node: ts.Node): boolean {
  const name: ts.Node | undefined = (node as ts.Node & { name?: ts.Node }).name;
  return name !== undefined && ts.isPrivateIdentifier(name);
}


/** Read names that a local named-export declaration can expose. */
function topLevelDeclarationNames(node: ts.Node): string[] {
  if (ts.isVariableStatement(node))
    return node.declarationList.declarations.flatMap((declaration: ts.VariableDeclaration) : string[] =>
      bindingNames(declaration.name),
    );
  if (
    ts.isClassDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isModuleDeclaration(node) ||
    ts.isTypeAliasDeclaration(node)
  )
    return node.name === undefined ? [] : [node.name.getText()];
  return [];
}


/** Flatten a variable binding without consulting the type checker. */
function bindingNames(name: ts.BindingName): string[] {
  return ts.isIdentifier(name)
    ? [name.text]
    : name.elements.flatMap((element: ts.ArrayBindingElement) : string[] =>
        ts.isOmittedExpression(element) ? [] : bindingNames(element.name),
      );
}


/** Read declaration modifiers without assigning synthetic parents or symbols. */
function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  const modifiers: readonly { kind: ts.SyntaxKind; }[] | undefined = (
    node as ts.Node & {
      modifiers?: readonly { kind: ts.SyntaxKind }[];
    }
  ).modifiers;
  return modifiers?.some((modifier: { kind: ts.SyntaxKind; }) : boolean => modifier.kind === kind) === true;
}


/** Convert one UTF-16 offset to a one-based source line. */
function lineOf(source: string, offset: number): number {
  return source.slice(0, offset).split(/\r\n|\r|\n/u).length;
}
