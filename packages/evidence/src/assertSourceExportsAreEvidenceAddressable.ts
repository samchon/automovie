import ts from "typescript-compiler";

/**
 * Refuse public source syntax the evidence graph cannot address as a host.
 *
 * @evidence contracts/common.md#principled-implementation TypeScript AST inspection rejects export and public-member forms that native Evidence cannot name; parsing is syntactic and does not prove runtime behavior.
 * @evidence contracts/common.md#clear-and-simple-design Export admission stays with the source population before host selection, including local aliases and class or interface members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Default expressions/aliases and anonymous declarations refuse; named default class/function declarations pass, while cross-module re-exports, accessors, computed names, namespaces and enums refuse.
 * @evidence contracts/common.md#meaningful-documentation The refusal identifies the source-relative path, unsupported syntax and a stable named replacement.
 * @evidence contracts/performance.md#efficient-algorithms Parsing and member traversal scale with source bytes and AST nodes; the local declaration set avoids rescanning names for each export.
 * @evidence contracts/performance.md#reuse-equivalent-work One parsed AST and local declaration set serve this admission; other host checks currently parse the same file again.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The AST and name sets live only during this synchronous call; source size has no fixed bound and no open handle escapes.
 */
export function assertSourceExportsAreEvidenceAddressable(relative: string, file: string, text: string): void {
  const source: ts.SourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const refuse: (form: string, replacement: string) => never = (form: string, replacement: string): never => {
    throw new Error(
      `${relative} ${form}, which no evidence type, function, or property selector can address. ${replacement}.`,
    );
  };
  const modifiersOf: (node: ts.Node) => readonly ts.Modifier[] = (node: ts.Node): readonly ts.Modifier[] =>
    ts.canHaveModifiers(node) ? (ts.getModifiers(node) ?? []) : [];
  const directlyExported: (node: ts.Node) => boolean = (node: ts.Node): boolean =>
    modifiersOf(node).some(
      (modifier: ts.Modifier): boolean => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
  const bindingNames: (name: ts.BindingName) => string[] = (name: ts.BindingName): string[] =>
    ts.isIdentifier(name)
      ? [name.text]
      : name.elements.flatMap((element: ts.ArrayBindingElement): string[] =>
          ts.isOmittedExpression(element) ? [] : bindingNames(element.name),
        );
  const declarationNames: (statement: ts.Statement) => string[] = (statement: ts.Statement): string[] => {
    if (ts.isVariableStatement(statement))
      return statement.declarationList.declarations.flatMap((declaration: ts.VariableDeclaration): string[] =>
        bindingNames(declaration.name),
      );
    if (
      ts.isClassDeclaration(statement) ||
      ts.isFunctionDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isEnumDeclaration(statement) ||
      ts.isModuleDeclaration(statement)
    )
      return statement.name === undefined
        ? []
        : [statement.name.getText(source)];
    return [];
  };
  const localDeclarations: Set<string> = new Set(
    source.statements.flatMap((statement: ts.Statement): string[] => declarationNames(statement)),
  );
  const namedExportsOf: (clause: ts.NamedExportBindings | undefined) => ts.NamedExports = (
    clause: ts.NamedExportBindings | undefined,
  ): ts.NamedExports => {
    if (clause === undefined)
      return refuse(
        "uses a barrel or namespace export",
        "Export a local named declaration",
      );
    if (!ts.isNamedExports(clause))
      return refuse(
        "uses a namespace export",
        "Export a local named declaration",
      );
    return clause;
  };
  const localExports: Set<string> = new Set<string>();
  for (const statement of source.statements) {
    if (!ts.isExportDeclaration(statement)) continue;
    const clause: ts.NamedExports = namedExportsOf(statement.exportClause);
    if (statement.moduleSpecifier !== undefined)
      refuse(
        "uses a barrel or cross-module re-export",
        "Export a named declaration owned by this module",
      );
    for (const element of clause.elements) {
      const local: string = (element.propertyName ?? element.name).text;
      if (element.name.text === "default" || !localDeclarations.has(local))
        refuse(
          "uses a default alias or imported re-export",
          "Export a stable declaration owned by this module",
        );
      localExports.add(local);
    }
  }
  const validateMembers: (owner: string, members: readonly ts.Declaration[]) => void = (
    owner: string,
    members: readonly ts.Declaration[],
  ): void => {
    for (const member of members) {
      const modifiers: readonly ts.Modifier[] = modifiersOf(member);
      if (
        modifiers.some(
          (modifier: ts.Modifier): boolean =>
            modifier.kind === ts.SyntaxKind.PrivateKeyword ||
            modifier.kind === ts.SyntaxKind.ProtectedKeyword,
        )
      )
        continue;
      const name: ts.DeclarationName | undefined = ts.getNameOfDeclaration(member);
      if (name !== undefined && ts.isPrivateIdentifier(name)) continue;
      const display: string = name?.getText(source) ?? "unnamed member";
      if (
        ts.isGetAccessorDeclaration(member) ||
        ts.isSetAccessorDeclaration(member) ||
        (ts.isPropertyDeclaration(member) &&
          modifiers.some(
            (modifier: ts.Modifier): boolean => modifier.kind === ts.SyntaxKind.AccessorKeyword,
          ))
      )
        refuse(
          `exports public accessor ${owner}.${display}`,
          "Use a plain readonly property or named method",
        );
      if (name !== undefined && ts.isComputedPropertyName(name))
        refuse(
          `exports computed public member ${owner}.${display}`,
          "Use a stable identifier",
        );
      if (
        name !== undefined &&
        ts.isStringLiteral(name) &&
        (name.text.length === 0 || /\s/u.test(name.text))
      )
        refuse(
          `exports unaddressable public literal member ${owner}.${display}`,
          "Use a non-empty, whitespace-free identifier",
        );
    }
  };

  for (const statement of source.statements) {
    if (ts.isExportDeclaration(statement)) continue;
    if (
      ts.isExportAssignment(statement) ||
      ts.isNamespaceExportDeclaration(statement)
    )
      refuse(
        "uses a default export expression or namespace export",
        "Export the named declaration directly from its owning module",
      );
    if (
      !directlyExported(statement) &&
      !declarationNames(statement).some((name: string): boolean => localExports.has(name))
    )
      continue;
    if (ts.isEnumDeclaration(statement))
      refuse(
        `exports enum ${statement.name.text}`,
        "Use a closed string-literal union",
      );
    if (ts.isModuleDeclaration(statement))
      refuse(
        `exports namespace ${statement.name.getText(source)}`,
        "Use direct named ES-module exports",
      );
    if (
      (ts.isClassDeclaration(statement) ||
        ts.isFunctionDeclaration(statement)) &&
      statement.name === undefined
    )
      refuse(
        "exports an anonymous default declaration",
        "Give the declaration a stable name and export it directly",
      );
    if (ts.isClassDeclaration(statement)) {
      validateMembers(statement.name!.text, statement.members);
      continue;
    }
    if (ts.isInterfaceDeclaration(statement)) {
      validateMembers(statement.name.text, statement.members);
      continue;
    }
    if (ts.isTypeAliasDeclaration(statement)) {
      if (ts.isTypeLiteralNode(statement.type))
        validateMembers(statement.name.text, statement.type.members);
      continue;
    }
    if (
      ts.isFunctionDeclaration(statement) ||
      ts.isVariableStatement(statement)
    )
      continue;
    refuse(
      `exports unsupported ${ts.SyntaxKind[statement.kind]} syntax`,
      "Use a named interface, type alias, class, function, or variable",
    );
  }
}
