"use strict";

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript-compiler");
const { run } = require("./export-refactor-worktree.cjs");

const root = path.resolve(__dirname, "..");
const provenance = /(?:copyright|SPDX-License-Identifier|@license|modified\s+(?:by|on)|https?:\/\/|www\.)/iu;
const narrativeTags = new Set(["remarks", "example", "deprecated", "throws", "see", "todo"]);
const semanticTags = new Set([
  "alpha",
  "beta",
  "deprecated",
  "experimental",
  "internal",
  "module",
  "override",
  "packageDocumentation",
  "jsx",
  "jsxFrag",
  "jsxImportSource",
  "private",
  "protected",
  "public",
  "readonly",
  "sealed",
  "virtual",
]);
const compilerPragmaTags = new Set(["jsx", "jsxFrag", "jsxImportSource", "jsxRuntime"]);
const linkKinds = new Set([
  ts.SyntaxKind.JSDocLink,
  ts.SyntaxKind.JSDocLinkCode,
  ts.SyntaxKind.JSDocLinkPlain,
]);

function declarationName(node) {
  return node.name && (ts.isIdentifier(node.name) || ts.isPrivateIdentifier(node.name))
    ? node.name.text
    : undefined;
}

function bindingNames(binding, names) {
  if (ts.isIdentifier(binding)) names.push(binding.text);
  else if (ts.isObjectBindingPattern(binding) || ts.isArrayBindingPattern(binding))
    for (const element of binding.elements)
      if (ts.isBindingElement(element)) bindingNames(element.name, names);
}

function declarationNames(node) {
  if (ts.isVariableStatement(node) || ts.isVariableDeclaration(node)) {
    const declarations = ts.isVariableStatement(node)
      ? node.declarationList.declarations
      : [node];
    const names = [];
    for (const declaration of declarations) bindingNames(declaration.name, names);
    return names;
  }
  const name = declarationName(node);
  return name ? [name] : [];
}

function publicLocalDeclarations(sourceFile, symbols) {
  const declarations = new Map();
  function add(namespace, node, name, isNamespace = false) {
    const declarationPath = [...namespace, name].join(".");
    let candidates = declarations.get(declarationPath);
    if (!candidates) declarations.set(declarationPath, candidates = []);
    candidates.push({ path: declarationPath, namespace: isNamespace, node });
  }
  function visitNamespace(node, parent) {
    const name = declarationName(node);
    if (!name) return;
    const namespace = [...parent, name];
    add(parent, node, name, true);
    if (node.body && ts.isModuleBlock(node.body)) visitScope(node.body, namespace);
    else if (node.body && ts.isModuleDeclaration(node.body)) visitNamespace(node.body, namespace);
  }
  function visitScope(scope, namespace) {
    for (const statement of scope.statements) {
      if (ts.isModuleDeclaration(statement)) {
        visitNamespace(statement, namespace);
        continue;
      }
      for (const name of declarationNames(statement)) add(namespace, statement, name);
    }
  }
  visitScope(sourceFile, []);

  const alias = new Map();
  const routes = [...(symbols ?? new Map())].sort(([left], [right]) => left.split(".").length - right.split(".").length);
  function resolvePrefix(prefix) {
    if (!prefix) return "";
    const resolved = [];
    const accumulated = [];
    for (const segment of prefix.split(".")) {
      accumulated.push(segment);
      const mapped = alias.get(accumulated.join("."));
      if (mapped) resolved.splice(0, resolved.length, ...mapped.split("."));
      else resolved.push(segment);
    }
    return resolved.join(".");
  }
  for (const [route, localNames] of routes) {
    const separator = route.lastIndexOf(".");
    const parent = separator < 0 ? "" : route.slice(0, separator);
    const actualParent = resolvePrefix(parent);
    const localPath = actualParent ? actualParent.split(".") : [];
    for (const localName of localNames) {
      for (const candidate of declarations.get([...localPath, localName].join(".")) ?? [])
        if (candidate.namespace) alias.set(route, candidate.path);
    }
  }

  const result = new Set();
  for (const [route, localNames] of routes) {
    const separator = route.lastIndexOf(".");
    const parent = separator < 0 ? "" : route.slice(0, separator);
    const actualParent = resolvePrefix(parent);
    const prefix = actualParent ? actualParent.split(".") : [];
    for (const localName of localNames) {
      for (const candidate of declarations.get([...prefix, localName].join(".")) ?? [])
        result.add(candidate.node);
    }
  }

  function exported(node) {
    return ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((modifier) =>
      modifier.kind === ts.SyntaxKind.ExportKeyword || modifier.kind === ts.SyntaxKind.DefaultKeyword,
    );
  }
  const visitedNamespaces = new Set();
  function addExportedNamespaceMembers(namespace) {
    if (visitedNamespaces.has(namespace)) return;
    visitedNamespaces.add(namespace);
    if (!namespace.body || !ts.isModuleBlock(namespace.body)) return;
    for (const statement of namespace.body.statements) {
      if (!exported(statement)) continue;
      result.add(statement);
      if (!ts.isModuleDeclaration(statement)) continue;
      addExportedNamespaceMembers(statement);
    }
  }
  for (const localPath of alias.values()) {
    for (const candidate of declarations.get(localPath) ?? [])
      if (candidate.namespace) addExportedNamespaceMembers(candidate.node);
  }
  return result;
}

function isAmbientAugmentation(node) {
  if (!ts.isModuleDeclaration(node)) return false;
  if (node.flags & ts.NodeFlags.GlobalAugmentation) return true;
  return ts.isStringLiteral(node.name) && ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword);
}
function declarationNodes(sourceFile) {
  const nodes = [];
  function visit(node) {
    if (node.jsDoc?.length) nodes.push(node);
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return nodes;
}

function commentText(doc, sourceFile) {
  return sourceFile.text.slice(doc.getStart(sourceFile), doc.end);
}

function commentValue(value) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((item) => {
    if (typeof item === "string") return item;
    const name = linkKinds.has(item.kind)
      ? item.name?.getText?.() ?? item.name?.text ?? ""
      : "";
    const text = item.text ?? "";
    return name + (text.startsWith("|") ? " " : "") + text;
  }).join("");
}

function cleanNarrative(value) {
  return commentValue(value)
    .replace(/\{@(?:link|linkplain|linkcode|code|literal)\s+([^}]+)\}/gu, "$1")
    .replace(/\{@inheritDoc\}/giu, "")
    .replace(/\s+@evidence(?:Exclude)?\b.*$/gimu, "")
    .trim();
}

function provenanceLines(doc, sourceFile) {
  return commentText(doc, sourceFile)
    .split(/\r?\n/u)
    .map((line) => line.replace(/^\s*\/\*\*?\s?/u, "").replace(/\s*\*\/\s*$/u, "").replace(/^\s*\*\s?/u, "").trim())
    .filter((line) => provenance.test(line))
    .map((line) => line
      .replace(/^@(?:source|license|modified|copyright)\b\s*/iu, "")
      .replace(/\s+@evidence(?:Exclude)?\b.*$/iu, "")
      .trim())
    .filter(Boolean);
}

function commentLayout(doc, sourceFile) {
  const start = doc.getStart(sourceFile);
  const lineStart = sourceFile.text.lastIndexOf("\n", start - 1) + 1;
  const prefix = sourceFile.text.slice(lineStart, start);
  const indent = /^[\t ]*$/u.test(prefix) ? prefix : "";
  const lineEnding = sourceFile.text.includes("\r\n") ? "\r\n" : "\n";
  return { indent, lineEnding };
}

function ordinaryBlock(lines, indent, lineEnding) {
  const content = lines.flatMap((line) => line.split(/\r?\n/u)).map((line) => line.trimEnd());
  while (content.length && !content[0].trim()) content.shift();
  while (content.length && !content.at(-1).trim()) content.pop();
  return content.length
    ? "/*" + lineEnding + content.map((line) => line.trim() ? indent + " * " + line : indent + " *").join(lineEnding) + lineEnding + indent + " */"
    : "";
}

function normalizedProvenanceText(value) {
  return commentValue(value)
    .replace(/^@see\b\s*/iu, "")
    .replace(/\{@(?:link|linkplain|linkcode)\s+([^}|]+?)(?:\s*\|[^}]*)?\}/gu, "$1")
    .replace(/\s+/gu, " ")
    .trim();
}
function preservedComment(doc, sourceFile) {
  const narrative = [];
  const description = cleanNarrative(doc.comment);
  if (description) narrative.push(description);
  for (const tag of doc.tags ?? []) {
    const tagName = tag.tagName.text;
    const body = cleanNarrative(tag.comment);
    if (!body) continue;
    if (narrativeTags.has(tagName)) narrative.push(body);
    else if (tagName === "param") {
      const name = tag.name?.getText?.(sourceFile) ?? tag.name?.text ?? "";
      narrative.push(name ? `Parameter ${name}: ${body}` : `Parameter: ${body}`);
    } else if (tagName === "return" || tagName === "returns")
      narrative.push(`Returns: ${body}`);
    else if (semanticTags.has(tagName)) narrative.push(`@${tagName}: ${body}`);
  }
  const preservedNarrative = narrative.map(normalizedProvenanceText).join(" ");
  const keep = provenanceLines(doc, sourceFile).filter((line) => {
    const normalized = normalizedProvenanceText(line);
    return !normalized || !preservedNarrative.includes(normalized);
  });
  const tags = doc.tags?.filter((tag) => semanticTags.has(tag.tagName.text)).map((tag) => "@" + tag.tagName.text) ?? [];
  const comments = [];
  if (tags.length) comments.push("/** " + [...new Set(tags)].join(" ") + " */");
  const { indent, lineEnding } = commentLayout(doc, sourceFile);
  const ordinary = ordinaryBlock([...narrative, ...keep], indent, lineEnding);
  if (ordinary) comments.push(ordinary);
  return comments.map((comment, index) => index === 0 ? comment : indent + comment).join(lineEnding);
}

function hasPreservedNarrativeTag(doc) {
  return (doc.tags ?? []).some((tag) => {
    const name = tag.tagName.text;
    return (
      narrativeTags.has(name) ||
      name === "param" ||
      name === "return" ||
      name === "returns"
    ) && cleanNarrative(tag.comment);
  });
}

function contractDeclarationNames(index) {
  return index.publicContractDeclarations();
}

function hasTag(node, name) {
  return node.jsDoc?.some((doc) => doc.tags?.some((tag) => tag.tagName.text === name)) ?? false;
}

function hasPrivateBoundary(node) {
  return (
    (ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword)) ||
    hasTag(node, "internal") ||
    hasTag(node, "private")
  );
}

function publicRoutePaths(node, sourceFile) {
  let declaration = node;
  if (ts.isVariableDeclaration(node)) {
    const statement = node.parent.parent;
    if (!ts.isVariableStatement(statement)) return [];
    declaration = statement;
  }
  const parent = declaration.parent;
  if (!(ts.isSourceFile(parent) || ts.isModuleBlock(parent))) return [];

  const namespaces = [];
  let current = parent;
  while (current && current !== sourceFile) {
    if (ts.isModuleDeclaration(current) && current.name) {
      const name = declarationName(current);
      if (name) namespaces.unshift(name);
    }
    current = current.parent;
  }
  if (ts.isModuleDeclaration(declaration)) {
    const name = declarationName(declaration);
    return name ? [[...namespaces, name].join(".")] : [];
  }
  const isDefault = ts.canHaveModifiers(declaration) &&
    ts.getModifiers(declaration)?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword);
  let names = isDefault ? ["default"] : declarationNames(node);
  return names.map((name) => [...namespaces, name].join("."));
}

function isTypeDeclaration(node) {
  return ts.isClassLike(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node);
}

function isPublicSignatureContainer(node) {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isMethodSignature(node) ||
    ts.isCallSignatureDeclaration(node) ||
    ts.isConstructSignatureDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isVariableDeclaration(node) ||
    ts.isVariableStatement(node)
  );
}

function hasCompilerPragma(node) {
  return node.jsDoc?.some((doc) => doc.tags?.some((tag) => compilerPragmaTags.has(tag.tagName.text))) ?? false;
}

function isPublicNode(node, sourceFile, publicNames, publicRoutes, publicLocals) {
  let current = node;
  while (current && current !== sourceFile) {
    if (hasPrivateBoundary(current) || ts.isBlock(current)) return false;
    if (isAmbientAugmentation(current)) return true;
    const route = publicLocals
      ? publicLocals.has(current)
      : publicRoutePaths(current, sourceFile).some((name) => publicRoutes.has(name));
    if (current === node && route) return true;
    if (
      isTypeDeclaration(current) &&
      (publicLocals ? publicLocals.has(current) || (ts.isSourceFile(current.parent) && declarationNames(current).some((name) => publicNames.has(name))) : declarationNames(current).some((name) => publicNames.has(name)))
    ) return true;
    if (isPublicSignatureContainer(current) && route) return true;
    if (ts.isModuleDeclaration(current)) return false;
    current = current.parent;
  }
  return false;
}

function planFile(sourceFile, index) {
  const file = fs.existsSync(sourceFile.fileName)
    ? fs.realpathSync(sourceFile.fileName)
    : path.resolve(sourceFile.fileName);
  const names = index.contractNamesByFile?.get(file) ?? new Set(
    [...(index.symbolsByFile.get(file)?.values() ?? [])].flatMap((items) => [...items]),
  );
  const publicRoutes = index.publicRoutesByFile?.get(file) ?? new Set(
    index.exportsByFile?.get(file) ?? index.symbolsByFile?.get(file)?.keys() ?? [],
  );
  const publicLocals = index.publicLocalPathsByFile?.get(file) ?? (
    index.symbolsByFile?.has(file)
      ? publicLocalDeclarations(sourceFile, index.symbolsByFile.get(file))
      : undefined
  );
  const edits = [];
  let count = 0;
  let preservedNarrative = 0;
  let preservedProvenance = 0;
  let retainedInternal = 0;
  for (const node of declarationNodes(sourceFile)) {
    if (ts.isSourceFile(node) || hasCompilerPragma(node) || isPublicNode(node, sourceFile, names, publicRoutes, publicLocals)) continue;
    for (const doc of node.jsDoc ?? []) {
      const replacement = preservedComment(doc, sourceFile);
      let start = doc.getStart(sourceFile);
      let end = doc.end;
      if (!replacement) {
        const lineStart = sourceFile.text.lastIndexOf("\n", start - 1) + 1;
        if (/^[\t ]*$/u.test(sourceFile.text.slice(lineStart, start))) {
          start = lineStart;
          if (sourceFile.text.slice(end, end + 2) === "\r\n") end += 2;
          else if (sourceFile.text[end] === "\n") end++;
        }
      }
      edits.push({ start, end, text: replacement });
      const description = cleanNarrative(doc.comment);
      if (description || hasPreservedNarrativeTag(doc)) preservedNarrative++;
      if (provenanceLines(doc, sourceFile).length) preservedProvenance++;
      if (doc.tags?.some((tag) => tag.tagName.text === "internal")) retainedInternal++;
      count++;
    }
  }
  return { edits, count, blocked: [], preview: { preservedNarrative, preservedProvenance, retainedInternal } };
}

function plan(sourceFile) {
  if (!plan.index) {
    const { createPublicSourceExportIndex } = require("./public-source-exports.cjs");
    plan.index = createPublicSourceExportIndex({ root, includeWorkspaceExports: true });
  }
  if (plan.index.publicFiles.size === 0) throw new Error("Public export index is empty; refusing to plan destructive edits.");
  if (!plan.contractNames) plan.contractNames = contractDeclarationNames(plan.index);
  const file = fs.existsSync(sourceFile.fileName)
    ? fs.realpathSync(sourceFile.fileName)
    : path.resolve(sourceFile.fileName);
  const contractNames = plan.contractNames.get(file) ?? new Set();
  const publicRoutes = plan.index.exportsByFile.get(file) ?? new Set();
  const publicSymbols = plan.index.symbolsByFile.get(file) ?? new Map();
  const index = {
    contractNamesByFile: new Map([[file, contractNames]]),
    publicRoutesByFile: new Map([[file, publicRoutes]]),
    symbolsByFile: new Map([[file, publicSymbols]]),
  };
  return planFile(sourceFile, index);
}

function selfTest() {
  const text = [
    "/** Public API docs. @evidence public */",
    "export function PublicThing(): HiddenThing { return hiddenThing(); }",
    "/** Public type contract. */",
    "export interface PublicContract {",
    "  /** Public member contract. */",
    "  value: string;",
    "}",
    "/** A small internal wrapper. @evidence hidden */",
    "function hiddenThing(): HiddenThing { return new HiddenThing(); }",
    "/**",
    " * Preserve the prior key when the same inputs were read, because a held interval",
    " * can then keep its stationary course and identity.",
    " * @remarks The downstream solver relies on that identity to skip redundant fits.",
    " * @source https://example.test/source",
    " * @evidence internal",
    " */",
    "function explainableInternal(): void {}",
    "/**",
    " * The core planner runs {@linkcode Core.solve | solve(...)} and {@linkplain Scalar.normalize}, then {@link Core.finish}.",
    " * @internal",
    " */",
    "function linkedInternal(): void {}",
    "/** @param width Refuse zero width before normalizing the line. @returns The value remains in metres. @evidence internal */",
    "function taggedInternal(width: number): number { return width; }",
    "/** @internal @evidence internal */",
    "export class HiddenThing {}",
    "/** Copyright 2026 Example. @evidence source */",
    "function sourced(): void {}",
  ].join("\n");
  const tree = ts.createSourceFile("fixture.ts", text, ts.ScriptTarget.Latest, true);
  const fakeIndex = { symbolsByFile: new Map([[path.resolve("fixture.ts"), new Map([
    ["PublicThing", new Set(["PublicThing"])],
    ["PublicContract", new Set(["PublicContract"])],
  ])]]) };
  const result = planFile(tree, fakeIndex);
  const output = require("./export-refactor-worktree.cjs").applyEdits(text, result.edits);
  if (!output.includes("Public API docs. @evidence public")) throw new Error("Public docs were not preserved.");
  if (!output.includes("Public member contract.")) throw new Error("Public member docs were not preserved.");
  if (!output.includes("/*\n * A small internal wrapper.\n */") || output.includes("@evidence hidden")) throw new Error("Short internal rationale was not preserved as an ordinary comment.");
  if (!output.includes("/*\n * Preserve the prior key") || !output.includes("because a held interval") || !output.includes("downstream solver relies on that identity")) throw new Error("Internal rationale was not retained as an ordinary comment.");
  if (!output.includes("The core planner runs Core.solve | solve(...) and Scalar.normalize, then Core.finish.") || !output.includes("/** @internal */")) throw new Error("Private link text or @internal marker was not retained.");
  if (!output.includes("Parameter width: Refuse zero width before normalizing the line.") || !output.includes("Returns: The value remains in metres.")) throw new Error("Private parameter/return rationale lost its identity or description.");
  if (!output.includes("https://example.test/source") || output.includes("@source")) throw new Error("Source link preservation failed.");
  if (!output.includes("/** @internal */")) throw new Error("@internal marker was not retained.");
  if (!output.includes("Copyright 2026 Example.") || output.includes("@evidence source") || output.includes("@evidence internal") || output.includes("@evidence hidden")) throw new Error("Provenance preservation failed.");
  if (ts.createSourceFile("fixture.ts", output, ts.ScriptTarget.Latest, true).parseDiagnostics.length) throw new Error("Fixture output does not parse.");

  const nestedText = [
    "/** Public owner contract. */",
    "export namespace PublicOwner {",
    "  /** Public function contract. */",
    "  export function publicCall(input: number): number {",
    "    /** A local value keeps the input's unit. */",
    "    const localValue = input;",
    "    return localValue;",
    "  }",
    "  /** A private namespace helper keeps its own cache. */",
    "  function privateHelper(): void {}",
    "  namespace PrivateOwner {",
    "    /** A private nested owner keeps its own lock. */",
    "    export function acquire(): void {}",
    "  }",
    "  /** Internal operation summary. @internal */",
    "  export function internalCall(): void {}",
    "  /** A retired private helper. @deprecated Use publicCall. */",
    "  function retiredHelper(): void {}",
    "  /** @beta A preview-only internal helper. */",
    "  function betaHelper(): void {}",
    "  /** Public options contract. */",
    "  export interface IOptions {",
    "    /** The public value remains in metres. */",
    "    value: number;",
    "  }",
    "  /** Public class contract. */",
    "  export class PublicClass {",
    "    /** Public method contract. */",
    "    public read(): void {}",
    "    /** A private member invariant. */",
    "    private secret(): void {}",
    "  }",
    "  namespace LocalAliasOwner {",
    "    /** Public descendant reached through an exported namespace alias. */",
    "    export function aliasedPublic(): void {}",
    "  }",
    "  export { LocalAliasOwner as PublicAliasOwner };",
    "  namespace PrivateAliasOwner {",
    "    /** Same-named private sibling. */",
    "    export function aliasedPublic(): void {}",
    "  }",
    "}",
    "/** Public alias of a local declaration. */",
    "function localPublicOperation(): void {}",
    "export { localPublicOperation as PublicOperation };",
  ].join("\n");
  const nestedTree = ts.createSourceFile("nested.ts", nestedText, ts.ScriptTarget.Latest, true);
  const nestedPath = path.resolve("nested.ts");
  const nestedIndex = {
    contractNamesByFile: new Map([[nestedPath, new Set([
      "PublicOwner",
      "publicCall",
      "internalCall",
      "IOptions",
      "PublicClass",
      "LocalAliasOwner",
      "aliasedPublic",
      "localPublicOperation",
    ])]]),
    publicRoutesByFile: new Map([[nestedPath, new Set([
      "PublicOwner",
      "PublicOwner.publicCall",
      "PublicOwner.internalCall",
      "PublicOwner.IOptions",
      "PublicOwner.PublicClass",
      "PublicOwner.PublicAliasOwner",
      "PublicOwner.PublicAliasOwner.aliasedPublic",
      "PublicOperation",
    ])]]),
    symbolsByFile: new Map([[nestedPath, new Map([
      ["PublicOwner", new Set(["PublicOwner"])],
      ["PublicOwner.publicCall", new Set(["publicCall"])],
      ["PublicOwner.internalCall", new Set(["internalCall"])],
      ["PublicOwner.IOptions", new Set(["IOptions"])],
      ["PublicOwner.PublicClass", new Set(["PublicClass"])],
      ["PublicOwner.PublicAliasOwner", new Set(["LocalAliasOwner"])],
      ["PublicOwner.PublicAliasOwner.aliasedPublic", new Set(["aliasedPublic"])],
      ["PublicOperation", new Set(["localPublicOperation"])],
    ])]]),
  };
  const nestedPlan = planFile(nestedTree, nestedIndex);
  const nestedOutput = require("./export-refactor-worktree.cjs").applyEdits(nestedText, nestedPlan.edits);
  if (!nestedOutput.includes("/** Public owner contract. */") || !nestedOutput.includes("/** Public function contract. */")) throw new Error("Public namespace or exported member docs were stripped.");
  if (!nestedOutput.includes("/** The public value remains in metres. */") || !nestedOutput.includes("/** Public method contract. */")) throw new Error("Public type-member docs were stripped.");
  if (!nestedOutput.includes("  /*\n   * A private namespace helper keeps its own cache.\n   */") || !nestedOutput.includes("    /*\n     * A private nested owner keeps its own lock.\n     */") || !nestedOutput.includes("     * A local value keeps the input's unit.")) throw new Error("Private namespace or function-local docs were not narrowed and indented.");
  if (!nestedOutput.includes("/** @internal */") || !nestedOutput.includes("Internal operation summary.")) throw new Error("@internal metadata or its rationale was lost.");
  if (!nestedOutput.includes("/** @deprecated */") || !nestedOutput.includes("A retired private helper.") || !nestedOutput.includes("Use publicCall.")) throw new Error("Deprecated compiler metadata or rationale was lost.");
  if (!nestedOutput.includes("/** @beta */") || !nestedOutput.includes("@beta: A preview-only internal helper.")) throw new Error("Publishing metadata was lost.");
  if (nestedOutput.includes("/** A private member invariant.") || !nestedOutput.includes("    /*\n     * A private member invariant.\n     */")) throw new Error("Private class-member JSDoc was not demoted to an ordinary comment.");
  if (!nestedOutput.includes("/** Public descendant reached through an exported namespace alias. */") || !nestedOutput.includes("/** Public alias of a local declaration. */")) throw new Error("Public local declarations were not retained through export aliases.");
  if (nestedOutput.includes("/** Same-named private sibling.") || !nestedOutput.includes("    /*\n     * Same-named private sibling.\n     */")) throw new Error("An unrelated same-named private sibling was treated as public.");
  if (ts.createSourceFile("nested.ts", nestedOutput, ts.ScriptTarget.Latest, true).parseDiagnostics.length) throw new Error("Nested fixture output does not parse.");

  const nestedOutputTree = ts.createSourceFile("nested.ts", nestedOutput, ts.ScriptTarget.Latest, true);
  function declaration(name) {
    let found;
    function visit(node) {
      if (ts.isFunctionDeclaration(node) && node.name?.text === name) found = node;
      ts.forEachChild(node, visit);
    }
    visit(nestedOutputTree);
    return found;
  }
  const internalTags = ts.getJSDocTags(declaration("internalCall") ?? nestedOutputTree).map((tag) => tag.tagName.text);
  const deprecatedTags = ts.getJSDocTags(declaration("retiredHelper") ?? nestedOutputTree).map((tag) => tag.tagName.text);
  if (!internalTags.includes("internal") || !deprecatedTags.includes("deprecated")) throw new Error("Compiler-recognized @internal/@deprecated markers were lost.");

const emptyLfText = "namespace PrivateOwner {\n  /** @evidence internal */\n  function helper(): void {}\n}\n";
  const emptyLfTree = ts.createSourceFile("empty-lf.ts", emptyLfText, ts.ScriptTarget.Latest, true);
  const emptyLfOut = require("./export-refactor-worktree.cjs").applyEdits(
    emptyLfText,
    planFile(emptyLfTree, { symbolsByFile: new Map([[path.resolve("empty-lf.ts"), new Map()]]) }).edits,
  );
  const emptyCrLfText = emptyLfText.replace(/\n/gu, "\r\n");
  const emptyCrLfTree = ts.createSourceFile("empty-crlf.ts", emptyCrLfText, ts.ScriptTarget.Latest, true);
  const emptyCrLfOut = require("./export-refactor-worktree.cjs").applyEdits(
    emptyCrLfText,
    planFile(emptyCrLfTree, { symbolsByFile: new Map([[path.resolve("empty-crlf.ts"), new Map()]]) }).edits,
  );
  if (emptyLfOut !== "namespace PrivateOwner {\n  function helper(): void {}\n}\n") throw new Error("Empty LF evidence-only docs left a whitespace-only line.");
  if (emptyCrLfOut !== emptyLfOut.replace(/\n/gu, "\r\n")) throw new Error("Empty CRLF docs do not produce the LF-equivalent result.");
  const reachableText = [
    "/** Public operation. */",
    "export function consume(options: IOptions): void {}",
    "/** Reachable public contract. */",
    "interface IOptions {",
    "  /** Reachable public field. */",
    "  width: number;",
    "}",
    "/** Same-named private namespace type stays private. */",
    "namespace PrivateSibling {",
    "  interface IOptions { secret: string; }",
    "}",
  ].join("\n");
  const reachablePath = path.resolve("reachable.ts");
  const reachableTree = ts.createSourceFile(reachablePath, reachableText, ts.ScriptTarget.Latest, true);
  const reachableOutput = require("./export-refactor-worktree.cjs").applyEdits(
    reachableText,
    planFile(reachableTree, {
      contractNamesByFile: new Map([[reachablePath, new Set(["consume", "IOptions"])]]),
      symbolsByFile: new Map([[reachablePath, new Map([["consume", new Set(["consume"]) ]])]]),
    }).edits,
  );
  if (!reachableOutput.includes("/** Reachable public contract. */") || !reachableOutput.includes("/** Reachable public field. */")) throw new Error("Top-level signature-reachable type docs were stripped.");
  if (reachableOutput.includes("/** Same-named private namespace type stays private.") || !reachableOutput.includes("Same-named private namespace type stays private.")) throw new Error("A private same-named namespace type was promoted by signature reachability.");

  const duplicateSourceText = [
    "/**",
    " * Source credit: Clarabel reference https://example.test/clarabel.",
    " * @see {@link https://example.test/clarabel}",
    " * @see {@link https://example.test/second-source}",
    " */",
    "function citedInternal(): void {}",
  ].join("\n");
  const duplicateSourceTree = ts.createSourceFile("duplicate-source.ts", duplicateSourceText, ts.ScriptTarget.Latest, true);
  const duplicateSourceOutput = require("./export-refactor-worktree.cjs").applyEdits(
    duplicateSourceText,
    planFile(duplicateSourceTree, { symbolsByFile: new Map([[path.resolve("duplicate-source.ts"), new Map()]]) }).edits,
  );
  if (duplicateSourceOutput.split("https://example.test/clarabel").length - 1 !== 2 || duplicateSourceOutput.split("https://example.test/second-source").length - 1 !== 1 || !duplicateSourceOutput.includes("Source credit: Clarabel reference")) throw new Error("Duplicate provenance was not deduplicated without losing credits or distinct sources.");
  const forwardedText = [
    "/** Public owner comment. */",
    "namespace LocalOwner {",
    "  /** Public child contract reached through the root-only alias. */",
    "  export namespace Types {",
    "    /** Public IProps contract. */",
    "    export interface IProps {",
    "      /** Public field contract. */",
    "      value: string;",
    "    }",
    "    /** Unexported sibling remains private. */",
    "    interface HiddenProps { secret: string; }",
    "  }",
    "  /** Unexported owner helper remains private. */",
    "  function hiddenHelper(): void {}",
    "}",
    "export { LocalOwner as PublicOwner };",
  ].join("\n");
  const forwardedPath = path.resolve("forwarded.ts");
  const forwardedTree = ts.createSourceFile(forwardedPath, forwardedText, ts.ScriptTarget.Latest, true);
  const forwardedOutput = require("./export-refactor-worktree.cjs").applyEdits(
    forwardedText,
    planFile(forwardedTree, {
      symbolsByFile: new Map([[forwardedPath, new Map([["PublicOwner", new Set(["LocalOwner"]) ]])]]),
    }).edits,
  );
  if (!forwardedOutput.includes("/** Public child contract reached through the root-only alias. */") || !forwardedOutput.includes("/** Public IProps contract. */") || !forwardedOutput.includes("/** Public field contract. */")) throw new Error("Exported namespace descendants were not retained through a root-only alias.");
  if (forwardedOutput.includes("/** Unexported sibling remains private.") || !forwardedOutput.includes("Unexported sibling remains private.")) throw new Error("An unexported namespace sibling was promoted to public.");
  if (forwardedOutput.includes("/** Unexported owner helper remains private.") || !forwardedOutput.includes("Unexported owner helper remains private.")) throw new Error("An unexported owner helper was promoted to public.");

  const augmentationText = [
    "/** @jsxRuntime automatic */",
    "export {};",
    "declare global {",
    "  interface HTMLElementEventMap {",
    "    /** Public event contract. */",
    "    \"automovie:completed-frame\": CustomEvent<void>;",
    "  }",
    "}",
    "declare module \"external-module\" {",
    "  interface ExternalEventMap {",
    "    /** Public module augmentation member. */",
    "    ready: boolean;",
    "  }",
    "}",
  ].join("\n");
  const augmentationPath = path.resolve("augmentation.ts");
  const augmentationTree = ts.createSourceFile(augmentationPath, augmentationText, ts.ScriptTarget.Latest, true);
  const augmentationOutput = require("./export-refactor-worktree.cjs").applyEdits(
    augmentationText,
    planFile(augmentationTree, { symbolsByFile: new Map([[augmentationPath, new Map()]]) }).edits,
  );
  if (!augmentationOutput.includes("/** Public event contract. */") || !augmentationOutput.includes("/** Public module augmentation member. */")) throw new Error("Ambient global/module augmentation docs were stripped.");
  if (!augmentationOutput.startsWith("/** @jsxRuntime automatic */")) throw new Error("A source-file JSX pragma was altered.");
  const crlfText = "namespace PrivateOwner {\r\n  /** A short CRLF invariant. */\r\n  function helper(): void {}\r\n}\r\n";
  const crlfPath = path.resolve("crlf.ts");
  const crlfTree = ts.createSourceFile(crlfPath, crlfText, ts.ScriptTarget.Latest, true);
  const crlfOutput = require("./export-refactor-worktree.cjs").applyEdits(
    crlfText,
    planFile(crlfTree, { symbolsByFile: new Map([[crlfPath, new Map()]]) }).edits,
  );
  if (!crlfOutput.includes("  /*\r\n   * A short CRLF invariant.\r\n   */") || /(^|[^\r])\n/u.test(crlfOutput)) throw new Error("Ordinary comments lost source indentation or CRLF style.");
  if (ts.createSourceFile(crlfPath, crlfOutput, ts.ScriptTarget.Latest, true).parseDiagnostics.length) throw new Error("CRLF fixture output does not parse.");
  console.log(JSON.stringify({ ok: true, edits: result.count }, null, 2));
}

if (require.main === module) {
  if (process.argv[2] === "--self-test") selfTest();
  else run("strip-internal-jsdoc", plan, (relative) => /^packages\/[^/]+\/src\//u.test(relative));
}

module.exports = { contractDeclarationNames, declarationNodes, planFile, preservedComment };
