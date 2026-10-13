import ts from "typescript-compiler";
import type { ISourceOwnerExport } from "./ISourceOwnerExport";
import { compareCodeUnits } from "./compareCodeUnits";


/** Enumerate named top-level exports with their evidence symbol identity.
 *
 * @evidence contracts/common.md#principled-implementation AST declarations and local named-export aliases map to their actual declaration nodes and native evidence symbol kinds.
 * @evidence contracts/common.md#clear-and-simple-design One export inventory combines overloaded declarations and exposed names without importing or executing source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Private locals enter only through actual exposure; named default function/type exports retain explicit default identity, while reexports from other modules are outside this owner scan.
 * @evidence contracts/common.md#meaningful-documentation The comment states named top-level export inventory and parser-owned symbol kind.
 * @evidence contracts/performance.md#efficient-algorithms For N top-level declarations and E exposed names, maps cost expected O(N+E) plus O(E log E) sorting; nodes remain supplied AST references.
 * @evidence contracts/performance.md#reuse-equivalent-work One local-declaration map serves aliases and overload groups, avoiding a source scan per export name.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned owner records retain their AST nodes for the caller's scan; no source module is executed or file handle acquired.
 */
export const exportedSourceOwners: (source: ts.SourceFile) => ISourceOwnerExport[] = (source: ts.SourceFile): ISourceOwnerExport[] => {
  const local: Map<string, { nodes: ts.Node[]; symbolKind: ISourceOwnerExport["symbolKind"]; }> = new Map<
    string,
    { nodes: ts.Node[]; symbolKind: ISourceOwnerExport["symbolKind"] }
  >();
  const exposed: Map<string, string> = new Map<string, string>();
  const modifiers: (node: ts.Node) => readonly ts.Modifier[] = (node: ts.Node): readonly ts.Modifier[] =>
    ts.canHaveModifiers(node) ? (ts.getModifiers(node) ?? []) : [];
  const directlyExported: (node: ts.Node) => boolean = (node: ts.Node): boolean =>
    modifiers(node).some(
      (modifier: ts.Modifier) : boolean => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
  const defaultExported: (node: ts.Node) => boolean = (node: ts.Node): boolean =>
    modifiers(node).some(
      (modifier: ts.Modifier) : boolean => modifier.kind === ts.SyntaxKind.DefaultKeyword,
    );
  const remember: (name: string, node: ts.Node, symbolKind: ISourceOwnerExport["symbolKind"]) => void = (
    name: string,
    node: ts.Node,
    symbolKind: ISourceOwnerExport["symbolKind"],
  ): void => {
    const present: { nodes: ts.Node[]; symbolKind: ISourceOwnerExport["symbolKind"]; } | undefined = local.get(name);
    if (present === undefined) local.set(name, { nodes: [node], symbolKind });
    else present.nodes.push(node);
  };
  for (const statement of source.statements) {
    if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier === undefined &&
      statement.exportClause !== undefined &&
      ts.isNamedExports(statement.exportClause)
    )
      for (const element of statement.exportClause.elements)
        if (!element.isTypeOnly)
          exposed.set(
            element.name.text,
            (element.propertyName ?? element.name).text,
          );
    if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations)
        if (ts.isIdentifier(declaration.name)) {
          remember(declaration.name.text, statement, "property");
          if (directlyExported(statement))
            exposed.set(declaration.name.text, declaration.name.text);
        }
    if (ts.isFunctionDeclaration(statement)) {
      const localName: string = statement.name?.text ?? `\0default:${statement.pos}`;
      remember(localName, statement, "function");
      if (directlyExported(statement))
        exposed.set(
          defaultExported(statement) ? "default" : localName,
          localName,
        );
    }
    if (
      ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement)
    ) {
      const localName: string = statement.name?.text ?? `\0default:${statement.pos}`;
      remember(localName, statement, "type");
      if (directlyExported(statement))
        exposed.set(
          defaultExported(statement) ? "default" : localName,
          localName,
        );
    }
  }
  return [...exposed]
    .flatMap(([exportName, localName]: [string, string]) : { exportName: string; nodes: ts.Node[]; symbolKind: ISourceOwnerExport["symbolKind"]; }[] => {
      const entry: { nodes: ts.Node[]; symbolKind: ISourceOwnerExport["symbolKind"]; } | undefined = local.get(localName);
      return entry === undefined ? [] : [{ ...entry, exportName }];
    })
    .sort((left: { exportName: string; nodes: ts.Node[]; symbolKind: ISourceOwnerExport["symbolKind"]; }, right: { exportName: string; nodes: ts.Node[]; symbolKind: ISourceOwnerExport["symbolKind"]; }) : number => compareCodeUnits(left.exportName, right.exportName));
};
