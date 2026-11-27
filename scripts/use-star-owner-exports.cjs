"use strict";

const path = require("node:path");
const ts = require("typescript-compiler");
const { run } = require("./export-refactor-worktree.cjs");

function hasModifier(statement, kind) {
  return ts.canHaveModifiers(statement) &&
    ts.getModifiers(statement)?.some((modifier) => modifier.kind === kind);
}

function addBindingNames(binding, names) {
  if (ts.isIdentifier(binding)) names.add(binding.text);
  else for (const element of binding.elements) {
    if (ts.isBindingElement(element)) addBindingNames(element.name, names);
  }
}

function localNames(statement) {
  const names = new Set();
  if (!hasModifier(statement, ts.SyntaxKind.ExportKeyword)) return names;
  if (hasModifier(statement, ts.SyntaxKind.DefaultKeyword)) names.add("default");
  else if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) addBindingNames(declaration.name, names);
  } else if (statement.name && ts.isIdentifier(statement.name)) names.add(statement.name.text);
  return names;
}

function emitsRuntime(statement) {
  if (hasModifier(statement, ts.SyntaxKind.DeclareKeyword) ||
      ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) return false;
  if (ts.isFunctionDeclaration(statement)) return Boolean(statement.body);
  if (ts.isEnumDeclaration(statement)) return !hasModifier(statement, ts.SyntaxKind.ConstKeyword);
  if (ts.isModuleDeclaration(statement)) {
    if (!ts.isIdentifier(statement.name) || !statement.body) return false;
    if (ts.isModuleDeclaration(statement.body)) return emitsRuntime(statement.body);
    return ts.isModuleBlock(statement.body) && statement.body.statements.some(emitsRuntime);
  }
  if (ts.isImportDeclaration(statement)) return !statement.importClause?.isTypeOnly;
  if (ts.isExportDeclaration(statement)) return !statement.isTypeOnly;
  return true;
}

function exportReader(reader) {
  const cache = new Map();

  function readStatement(statement, file, visiting) {
    if (ts.isExportAssignment(statement)) {
      return { names: new Set(["default"]), complete: !statement.isExportEquals };
    }
    if (!ts.isExportDeclaration(statement)) {
      return { names: localNames(statement), complete: true };
    }
    const clause = statement.exportClause;
    if (clause && ts.isNamedExports(clause)) {
      return { names: new Set(clause.elements.map((item) => item.name.text)), complete: true };
    }
    if (clause && ts.isNamespaceExport(clause)) {
      return { names: new Set([clause.name.text]), complete: true };
    }
    const target = reader.resolve(file, statement.moduleSpecifier?.text);
    const next = target && readModule(target, visiting);
    return {
      names: new Set(next ? [...next.names].filter((name) => name !== "default") : []),
      complete: Boolean(next?.complete),
    };
  }

  function readModule(file, visiting = new Set()) {
    if (visiting.has(file)) return { names: new Set(), complete: false };
    if (cache.has(file)) return cache.get(file);
    const tree = reader.read(file)?.tree;
    const names = new Set();
    let complete = Boolean(tree && !tree.parseDiagnostics.length);
    const next = new Set(visiting).add(file);
    for (const statement of tree?.statements ?? []) {
      const surface = readStatement(statement, file, next);
      for (const name of surface.names) names.add(name);
      complete &&= surface.complete;
    }
    const result = { names, complete };
    cache.set(file, result);
    return result;
  }

  return { readModule, readStatement };
}

function matchingOwner(statement) {
  if (!ts.isExportDeclaration(statement) || statement.isTypeOnly ||
      !statement.exportClause || !ts.isNamedExports(statement.exportClause)) return undefined;
  const entries = statement.exportClause.elements;
  if (entries.length !== 1) return undefined;
  const [entry] = entries;
  const route = statement.moduleSpecifier?.text;
  const name = entry.name.text;
  if (entry.isTypeOnly || entry.propertyName || !/^AutoMovie\w+$/u.test(name) ||
      !route?.startsWith(".") || path.basename(route).replace(/\.[cm]?[jt]sx?$/u, "") !== name) return undefined;
  return { name, route };
}

const readers = new WeakMap();

function planFile(source, reader) {
  let graph = readers.get(reader);
  if (!graph) {
    graph = exportReader(reader);
    readers.set(reader, graph);
  }
  const edits = [];
  const blocked = [];
  for (const statement of source.statements) {
    const match = matchingOwner(statement);
    if (!match) continue;
    const clause = statement.exportClause;
    const line = source.getLineAndCharacterOfPosition(clause.getStart(source)).line + 1;
    const target = reader.resolve(source.fileName, match.route);
    const owner = target && graph.readModule(target);
    const isRuntimeOwner = target && reader.read(target)?.tree.statements.some(
      (node) => localNames(node).has(match.name) && emitsRuntime(node),
    );
    if (!owner?.complete || owner.names.size !== 1 || !owner.names.has(match.name) || !isRuntimeOwner) {
      blocked.push({ line, reason: "The leaf is not a single runtime owner" });
      continue;
    }
    if (/\/[/*]/u.test(clause.getText(source))) {
      blocked.push({ line, reason: "Comment inside the named clause" });
      continue;
    }
    const peers = source.statements
      .filter((peer) => peer !== statement)
      .map((peer) => graph.readStatement(peer, source.fileName, new Set([source.fileName])));
    if (peers.some((peer) => !peer.complete || peer.names.has(match.name))) {
      blocked.push({ line, reason: "Another export might expose the same name" });
      continue;
    }
    edits.push({ start: clause.getStart(source), end: clause.end, text: "*" });
  }
  return { edits, count: edits.length, blocked };
}

function isPublicBarrel(relative) {
  return /(?:^|\/)index\.[cm]?tsx?$/u.test(relative) &&
    !/(?:^|\/)(?:internal|testing|executable)\//u.test(relative);
}

if (require.main === module) run("use-star-owner-exports", planFile, isPublicBarrel);
module.exports = { planFile };
