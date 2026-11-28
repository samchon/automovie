import { type IEvidenceConfig } from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript-compiler";

type EvidenceScope = "functions" | "types";
type EvidenceBinary = string | Record<string, string>;

interface IEvidencePublishManifest {
  bin?: EvidenceBinary;
  publishConfig?: {
    bin?: EvidenceBinary;
    exports?: Record<string, string | { types?: string }>;
  };
}

/**
 * Builds Evidence claims for the published entries and their local contracts.
 *
 * Resolve declarations through the package's compiler configuration so a moved
 * implementation stays private and a type exposed through a public signature
 * remains covered. Check the source path of each published executable.
 *
 * @param directory Directory containing the package manifest and TS config.
 * @param scope Defaults to type and function checks. Use `types` for type-only
 *   packages.
 * @returns Evidence claims whose paths are relative to the package directory.
 * @throws If the package or any declared entry cannot be resolved.
 */
export function createEvidenceConfig(
  directory: string,
  scope: EvidenceScope = "functions",
): IEvidenceConfig {
  const files: string[] = resolvePublicSourceFiles(directory);
  const claims: IEvidenceConfig["claims"] = [
    {
      name: "documentation",
      type: "typescript",
      files,
      evidenceFiles: ["predicate/**/*.md"],
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: ["contracts/development/common.md"],
        symbol: "h2",
        checklist: true,
      },
    },
    {
      name: "types",
      type: "typescript",
      files,
      evidenceFiles: ["predicate/**/*.md"],
      symbol: "type",
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: ["contracts/development/design.md"],
        symbol: "h2",
        checklist: true,
      },
    },
  ];
  if (scope === "functions")
    claims.push({
      name: "functions",
      type: "typescript",
      files,
      evidenceFiles: ["predicate/**/*.md"],
      symbol: "function",
      reference: {
        type: "markdown",
        root: "../../.agents/skills",
        files: ["contracts/development/implementation.md"],
        symbol: "h2",
        checklist: true,
      },
    });
  return { severity: "error", claims };
}

function resolvePublicSourceFiles(directory: string): string[] {
  const configPath: string = path.join(directory, "tsconfig.json");
  const config = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        );
      },
    },
  );
  if (config === undefined || config.errors.length > 0)
    throw new Error(
      `Cannot resolve Evidence package ${directory}: ${config?.errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n") ?? "missing TypeScript configuration"}`,
    );
  const source: string = config.options.rootDir ?? path.join(directory, "src");
  const output: string = config.options.outDir ?? path.join(directory, "lib");
  const manifest: IEvidencePublishManifest = JSON.parse(
    fs.readFileSync(path.join(directory, "package.json"), "utf8"),
  );
  const entries: string[] = [];
  for (const [name, target] of Object.entries(
    manifest.publishConfig?.exports ?? {},
  )) {
    if (name === "./package.json" && target === "./package.json") continue;
    const declaration: string | undefined =
      typeof target === "string" ? target : target.types;
    if (declaration === undefined || !/\.d\.[cm]?ts$/.test(declaration))
      throw new Error(
        `Cannot resolve Evidence declaration entry ${name} in ${directory}`,
      );
    entries.push(sourceEntry(declaration, name));
  }
  if (entries.length === 0)
    throw new Error(
      `No published Evidence declaration entries in ${directory}`,
    );
  const binary: EvidenceBinary | undefined =
    manifest.publishConfig?.bin ?? manifest.bin;
  const executables: string[] = (
    typeof binary === "string" ? [binary] : Object.values(binary ?? {})
  ).map((file) => sourceEntry(file, file));

  const program: ts.Program = ts.createProgram(
    [...entries, ...executables],
    config.options,
  );
  const checker: ts.TypeChecker = program.getTypeChecker();
  const files: Set<string> = new Set();
  const symbols: Set<ts.Symbol> = new Set();
  const types: Set<ts.Type> = new Set();

  function sourceEntry(target: string, label: string): string {
    const relative: string | undefined = inside(
      output,
      path.resolve(directory, target),
    );
    if (relative === undefined)
      throw new Error(`Evidence entry ${label} is outside ${output}`);
    const extension: string = path.extname(relative);
    const candidates: readonly string[] =
      extension === ".mts" || extension === ".mjs"
        ? [".mts"]
        : extension === ".cts" || extension === ".cjs"
          ? [".cts"]
          : [".ts", ".tsx"];
    const stem: string = path.join(
      source,
      relative.replace(/(?:\.d)?\.[cm]?[jt]s$/, ""),
    );
    const file: string | undefined = candidates
      .map((suffix) => stem + suffix)
      .find(ts.sys.fileExists);
    if (file === undefined)
      throw new Error(
        `Missing source for Evidence entry ${label} in ${directory}`,
      );
    return file;
  }

  function visitExport(symbol: ts.Symbol): void {
    const target: ts.Symbol =
      symbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol;
    if (symbols.has(target)) return;
    symbols.add(target);
    for (const declaration of target.declarations ?? []) {
      const file: ts.SourceFile = declaration.getSourceFile();
      if (
        inside(source, file.fileName) === undefined ||
        hidden(declaration) ||
        ambientModuleDeclaration(declaration)
      )
        continue;
      if (ts.isSourceFile(declaration) || ts.isModuleDeclaration(declaration)) {
        for (const member of checker.getExportsOfModule(target))
          visitExport(member);
        if (ts.isSourceFile(declaration)) continue;
      }
      files.add(
        path.relative(directory, file.fileName).split(path.sep).join("/"),
      );
      visitSignature(declaration);
      if (
        ts.isVariableDeclaration(declaration) &&
        declaration.type === undefined
      )
        visitType(checker.getTypeOfSymbolAtLocation(target, declaration));
      if (
        ts.isFunctionDeclaration(declaration) &&
        declaration.type === undefined
      ) {
        const signature: ts.Signature | undefined =
          checker.getSignatureFromDeclaration(declaration);
        if (signature !== undefined) visitType(signature.getReturnType());
      }
    }
  }

  function visitSignature(node: ts.Node): void {
    if (hidden(node)) return;
    if (ts.isModuleDeclaration(node) || ts.isBlock(node)) return;
    let name: ts.Node | undefined;
    if (ts.isTypeReferenceNode(node)) name = node.typeName;
    else if (ts.isTypeQueryNode(node)) name = node.exprName;
    else if (ts.isExpressionWithTypeArguments(node)) name = node.expression;
    else if (ts.isImportTypeNode(node)) {
      name = node.qualifier;
      if (name === undefined && ts.isLiteralTypeNode(node.argument))
        name = node.argument.literal;
    }
    if (name !== undefined) {
      const symbol: ts.Symbol | undefined = checker.getSymbolAtLocation(name);
      if (symbol !== undefined) visitExport(symbol);
    }
    if (
      (ts.isPropertyDeclaration(node) || ts.isParameter(node)) &&
      node.type === undefined &&
      node.initializer !== undefined
    ) {
      visitType(checker.getTypeAtLocation(node));
    }
    if (ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node)) {
      const signature: ts.Signature | undefined =
        checker.getSignatureFromDeclaration(node);
      if (node.type === undefined && signature !== undefined)
        visitType(signature.getReturnType());
    }
    ts.forEachChild(node, (child) => {
      if (
        ts.isExpression(child) &&
        !ts.isTypeNode(child) &&
        !ts.isExpressionWithTypeArguments(child)
      )
        return;
      visitSignature(child);
    });
  }

  function visitType(type: ts.Type): void {
    if (types.has(type)) return;
    types.add(type);
    if (type.aliasSymbol !== undefined) visitExport(type.aliasSymbol);
    const symbol: ts.Symbol | undefined = type.getSymbol();
    if (symbol !== undefined) visitExport(symbol);
    for (const argument of type.aliasTypeArguments ?? []) visitType(argument);
    if (type.isUnionOrIntersection()) {
      for (const variant of type.types) visitType(variant);
    }
    if (type.flags & ts.TypeFlags.Object) {
      const object: ts.ObjectType = type as ts.ObjectType;
      if (object.objectFlags & ts.ObjectFlags.Reference)
        for (const argument of checker.getTypeArguments(
          object as ts.TypeReference,
        ))
          visitType(argument);
      if (
        object.objectFlags & ts.ObjectFlags.Anonymous &&
        symbol?.declarations?.some(
          (declaration) =>
            inside(source, declaration.getSourceFile().fileName) !== undefined,
        )
      ) {
        for (const signature of type.getCallSignatures()) {
          visitType(signature.getReturnType());
          for (const parameter of signature.getParameters()) {
            const declaration: ts.Declaration | undefined =
              parameter.valueDeclaration;
            if (declaration !== undefined)
              visitType(
                checker.getTypeOfSymbolAtLocation(parameter, declaration),
              );
          }
        }
        for (const property of type.getProperties()) {
          const declaration: ts.Declaration | undefined =
            property.valueDeclaration;
          if (declaration !== undefined && !hidden(declaration))
            visitType(checker.getTypeOfSymbolAtLocation(property, declaration));
        }
      }
    }
  }

  for (const entry of entries) {
    const file: ts.SourceFile | undefined = program.getSourceFile(entry);
    const symbol: ts.Symbol | undefined =
      file === undefined ? undefined : checker.getSymbolAtLocation(file);
    if (symbol === undefined)
      throw new Error(`Cannot read public Evidence exports in ${entry}`);
    visitExport(symbol);
  }
  if (files.size === 0)
    throw new Error(`No public Evidence declarations found in ${directory}`);
  return [...files].sort();
}

function inside(directory: string, file: string): string | undefined {
  const relative: string = path.relative(directory, file);
  return relative === ".." ||
    relative.startsWith(".." + path.sep) ||
    path.isAbsolute(relative)
    ? undefined
    : relative;
}

// The adapter gives ambient augmentations no file-qualified hosts. Their
// emitted declaration effects are reviewed under the shared contracts.
function ambientModuleDeclaration(node: ts.Node): boolean {
  for (
    let owner: ts.Node | undefined = node;
    owner !== undefined && !ts.isSourceFile(owner);
    owner = owner.parent
  )
    if (
      ts.isModuleDeclaration(owner) &&
      (ts.isStringLiteral(owner.name) ||
        Boolean(owner.flags & ts.NodeFlags.GlobalAugmentation))
    )
      return true;
  return false;
}

function hidden(node: ts.Node): boolean {
  return (
    (ts.canHaveModifiers(node) &&
      (ts
        .getModifiers(node)
        ?.some(
          (modifier) =>
            modifier.kind === ts.SyntaxKind.PrivateKeyword ||
            modifier.kind === ts.SyntaxKind.ProtectedKeyword,
        ) ??
        false)) ||
    ts.getJSDocTags(node).some((tag) => tag.tagName.text === "internal") ||
    ("name" in node &&
      node.name !== undefined &&
      ts.isPrivateIdentifier(node.name as ts.Node))
  );
}
