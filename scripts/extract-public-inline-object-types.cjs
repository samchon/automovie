"use strict";

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript-compiler");
const { createPublicSourceExportIndex } = require("./public-source-exports.cjs");

const root = path.resolve(__dirname, "..");
const requestPlans = process.argv.includes("--plans");
const index = createPublicSourceExportIndex({ root });
const inventory = [];
const plans = [];
const plannedEdits = new Map();
const excluded = /focus.?pull/iu;
const predicateText = new Map();

function modifier(node, kind) {
  return ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((item) => item.kind === kind);
}

function hidden(node) {
  return ts.getJSDocTags(node).some((tag) =>
    ["internal", "hidden", "ignore"].includes(tag.tagName.text));
}

function publicSignature(node, visit) {
  if (hidden(node) || modifier(node, ts.SyntaxKind.PrivateKeyword) ||
      modifier(node, ts.SyntaxKind.ProtectedKeyword) ||
      (node.name && ts.isPrivateIdentifier(node.name))) return;
  if (ts.isBlock(node)) return;
  if (ts.isExpression(node) && !ts.isExpressionWithTypeArguments(node) &&
      !ts.isArrowFunction(node) && !ts.isFunctionExpression(node)) return;
  if (ts.isTypeLiteralNode(node)) visit(node);
  if (ts.isModuleDeclaration(node)) {
    for (const item of node.body?.statements ?? []) {
      if (modifier(item, ts.SyntaxKind.ExportKeyword)) publicSignature(item, visit);
    }
    return;
  }
  ts.forEachChild(node, (child) => publicSignature(child, visit));
}

function containsThis(node) {
  return node.kind === ts.SyntaxKind.ThisType ||
    node.kind === ts.SyntaxKind.ThisKeyword ||
    ts.forEachChild(node, containsThis) === true;
}

function isNullish(node) {
  return node.kind === ts.SyntaxKind.UndefinedKeyword ||
    (ts.isLiteralTypeNode(node) && node.literal.kind === ts.SyntaxKind.NullKeyword);
}

function hasEvidenceAddress(relative, qualifiedProperty) {
  const [, packageName, ...sourceParts] = relative.split("/");
  const address = sourceParts.join("/") + "#" + qualifiedProperty;
  if (!predicateText.has(packageName)) {
    const directory = path.join(root, "packages", packageName, "predicate");
    const documents = [];
    function read(directoryPath) {
      for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
        const file = path.join(directoryPath, entry.name);
        if (entry.isDirectory()) read(file);
        else if (entry.isFile() && entry.name.endsWith(".md")) {
          documents.push(fs.readFileSync(file, "utf8"));
        }
      }
    }
    if (fs.existsSync(directory)) read(directory);
    predicateText.set(packageName, documents);
  }
  const escaped = address.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const references = new RegExp(escaped + "(?![\\w$])", "u");
  return predicateText.get(packageName).some((document) => references.test(document));
}

function reindentObjectType(node, source, indent) {
  const start = node.getStart(source);
  const closingLine = source.text.lastIndexOf("\n", node.end - 2) + 1;
  const oldIndent = source.text.slice(closingLine, node.end - 1);
  const raw = node.getText(source);
  if (closingLine <= start || !/^[ \t]+$/u.test(oldIndent) ||
      !oldIndent.startsWith(indent) || oldIndent === indent) return raw;

  const protectedRanges = [];
  function visit(child) {
    if (ts.isStringLiteralLike(child) || ts.isTemplateLiteralToken(child)) {
      const tokenStart = child.getStart(source);
      if (source.text.slice(tokenStart, child.end).includes("\n")) {
        protectedRanges.push([tokenStart, child.end]);
      }
    }
    ts.forEachChild(child, visit);
  }
  visit(node);

  const shift = oldIndent.slice(indent.length);
  let position = start;
  return raw.split(/(?<=\n)/u).map((line, index) => {
    const lineStart = position;
    position += line.length;
    if (index === 0 || !line.trim() || !line.startsWith(shift) ||
        protectedRanges.some(([begin, end]) => begin < lineStart && lineStart < end)) {
      return line;
    }
    return line.slice(shift.length);
  }).join("");
}

function eligibility(node, file, relative) {
  if (excluded.test(relative) || excluded.test(node.parent.name?.getText(file) ?? "")) {
    return { reason: "focus-pull-owner" };
  }
  if (node.members.length === 0) return { reason: "empty-object" };
  if (containsThis(node)) return { reason: "this-type-or-expression" };
  let slot = node;
  while (ts.isParenthesizedTypeNode(slot.parent)) slot = slot.parent;
  if (ts.isUnionTypeNode(slot.parent)) {
    if (!slot.parent.types.every((part) => part === slot || isNullish(part))) {
      return { reason: "ambiguous-union-or-intersection" };
    }
    slot = slot.parent;
    while (ts.isParenthesizedTypeNode(slot.parent)) slot = slot.parent;
  }
  if (ts.isUnionTypeNode(slot.parent) || ts.isIntersectionTypeNode(slot.parent)) {
    return { reason: "ambiguous-union-or-intersection" };
  }
  const property = slot.parent;
  if (!ts.isPropertySignature(property) || property.type !== slot ||
      !ts.isIdentifier(property.name)) return { reason: "no-named-containing-property" };
  if (excluded.test(property.name.text)) return { reason: "focus-pull-owner" };
  const host = ts.isTypeLiteralNode(property.parent) ? property.parent.parent : property.parent;
  if ((!ts.isInterfaceDeclaration(host) && !ts.isTypeAliasDeclaration(host)) ||
      !/^I[A-Z]/u.test(host.name.text)) {
    return { reason: "generic-or-unnamed-contract" };
  }
  if (host.typeParameters?.length) return { reason: "generic-host" };
  if (ts.isTypeAliasDeclaration(host) && host.type !== property.parent) {
    return { reason: "outer-type-scope" };
  }
  const owner = host.parent.parent;
  if (!ts.isModuleBlock(host.parent) || !ts.isModuleDeclaration(owner) ||
      !ts.isSourceFile(owner.parent) || !ts.isIdentifier(owner.name) ||
      !modifier(owner, ts.SyntaxKind.ExportKeyword) ||
      !modifier(host, ts.SyntaxKind.ExportKeyword)) {
    return { reason: "no-one-level-public-owner" };
  }
  const field = property.name.text;
  const qualifiedProperty = owner.name.text + "." + host.name.text + "." + field;
  if (/@evidence\w*\b/u.test(node.getText(file)) ||
      hasEvidenceAddress(relative, qualifiedProperty)) {
    return { reason: "existing-evidence-address" };
  }
  if (!/^[a-z][a-zA-Z0-9]+$/u.test(field) ||
      /^(value|data|type|kind|item|entry|payload|result|props|options|input|output)$/u.test(field)) {
    return { reason: "ambiguous-name" };
  }
  const name = host.name.text + field[0].toUpperCase() + field.slice(1);
  const collision = new RegExp("\\b" + name + "\\b", "u");
  if (collision.test(file.text)) return { reason: "existing-name" };
  const hosts = file.statements.filter((statement) => ts.isModuleDeclaration(statement) &&
    statement.name.text === owner.name.text);
  if (hosts.length !== 1) return { reason: "merged-owner" };
  const hostIndent = /^[ \t]*/u.exec(file.text.slice(
    file.text.lastIndexOf("\n", host.getStart(file) - 1) + 1, host.getStart(file)))[0];
  const eol = file.text.includes("\r\n") ? "\r\n" : "\n";
  const original = node.getText(file);
  const reference = name;
  // Preserve the original member and docs bytes. Keep an object alias so
  // interfaces' declaration merging and implicit-index rules do not alter it.
  const doc = "/** The " + field + " object of {@link " + host.name.text + "}. */";
  const insertion = eol + eol + hostIndent + doc +
    eol + hostIndent + "export type " + name + " = " +
    reindentObjectType(node, file, hostIndent) + ";";
  return { name, reference, start: node.getStart(file), end: node.end, insertAt: host.end, insertion, original };
}

for (const [filename, symbols] of index.symbolsByFile) {
  const text = fs.readFileSync(filename, "utf8");
  const relative = path.relative(root, filename).split(path.sep).join("/");
  const file = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true);
  if (file.parseDiagnostics.length) continue;
  const names = new Set([...symbols.values()].flatMap((set) => [...set]));
  const candidates = [];
  const inspect = (node) => {
    const one = node.members.length === 1 && ts.isPropertySignature(node.members[0]);
    const result = eligibility(node, file, relative);
    const line = file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;
    const item = { file: relative, line, one, reason: result.reason ?? "candidate" };
    inventory.push(item);
    if (!result.reason) candidates.push({ ...result, item });
  };
  for (const node of file.statements) {
    if (ts.isVariableStatement(node)) {
      if (!hidden(node)) for (const declaration of node.declarationList.declarations) {
        if (names.has(declaration.name.text)) publicSignature(declaration, inspect);
      }
    } else if (names.has(node.name?.text) ||
        modifier(node, ts.SyntaxKind.DefaultKeyword) && names.has("default")) {
      publicSignature(node, inspect);
    }
  }
  const approved = candidates.filter((candidate) => {
    if (candidates.some((other) => other !== candidate && other.name === candidate.name)) {
      candidate.item.reason = "candidate-name-collision";
      return false;
    }
    if (candidates.some((other) => other !== candidate &&
        candidate.start < other.end && other.start < candidate.end)) {
      candidate.item.reason = "overlapping-candidates";
      return false;
    }
    return true;
  });
  if (!approved.length) continue;
  const edits = approved.flatMap((item) => [
    { start: item.start, end: item.end, text: item.reference },
    { start: item.insertAt, end: item.insertAt, text: item.insertion },
  ]).sort((a, b) => b.start - a.start);
  let after = text;
  for (const edit of edits) after = after.slice(0, edit.start) + edit.text + after.slice(edit.end);
  const parsed = ts.createSourceFile(filename, after, ts.ScriptTarget.Latest, true);
  const tags = (value) => value.match(/^.*@evidence.*$/gmu) ?? [];
  if (parsed.parseDiagnostics.length || JSON.stringify(tags(text)) !== JSON.stringify(tags(after))) {
    for (const item of approved) item.item.reason = "postcondition-failed";
    continue;
  }
  const beforeHash = require("node:crypto").createHash("sha256").update(text).digest("hex");
  plannedEdits.set(relative, { text, edits, count: approved.length });
  plans.push({ file: relative, beforeHash, names: approved.map((item) => item.name), after });
}

const reasons = {};
const packages = {};
for (const item of inventory) {
  reasons[item.reason] = (reasons[item.reason] ?? 0) + 1;
  const name = item.file.split("/")[1];
  packages[name] = (packages[name] ?? 0) + 1;
}
if (process.argv.includes("--apply") || process.argv.includes("--check") ||
    process.argv.includes("--help")) {
  const { run } = require("./export-refactor-worktree.cjs");
  run("extract-public-inline-object-types", (source) => {
    const relative = path.relative(root, source.fileName).split(path.sep).join("/");
    const change = plannedEdits.get(relative);
    if (!change || source.text !== change.text) {
      throw new Error("Source changed since extraction inventory: " + relative);
    }
    return { edits: change.edits, count: change.count, blocked: [] };
  }, (relative) => plannedEdits.has(relative));
} else console.log(JSON.stringify({
  total: inventory.length,
  files: new Set(inventory.map((item) => item.file)).size,
  singleProperty: inventory.filter((item) => item.one).length,
  reasons,
  packages,
  candidateFiles: plans.length,
  ...(requestPlans ? { inventory, plans } : {}),
}, null, 2));
