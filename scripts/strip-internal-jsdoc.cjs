"use strict";

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript-compiler");
const { run } = require("./export-refactor-worktree.cjs");

const root = path.resolve(__dirname, "..");
const provenance = /(?:copyright|SPDX-License-Identifier|@license|modified\s+(?:by|on)|https?:\/\/|www\.)/iu;
const narrativeTags = new Set(["remarks", "example", "deprecated", "throws", "see", "todo"]);

function declarationName(node) {
  return node.name && (ts.isIdentifier(node.name) || ts.isPrivateIdentifier(node.name))
    ? node.name.text
    : undefined;
}

function declarationNames(node) {
  if (!ts.isVariableStatement(node)) {
    const name = declarationName(node);
    return name ? [name] : [];
  }
  const names = [];
  function visitBinding(binding) {
    if (ts.isIdentifier(binding)) names.push(binding.text);
    else if (ts.isObjectBindingPattern(binding) || ts.isArrayBindingPattern(binding))
      for (const element of binding.elements)
        if (ts.isBindingElement(element)) visitBinding(element.name);
  }
  for (const declaration of node.declarationList.declarations)
    visitBinding(declaration.name);
  return names;
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
  return value.map((item) => typeof item === "string" ? item : item.text ?? "").join("");
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

function ordinaryBlock(lines) {
  const content = lines.flatMap((line) => line.split(/\r?\n/u)).map((line) => line.trimEnd());
  while (content.length && !content[0].trim()) content.shift();
  while (content.length && !content.at(-1).trim()) content.pop();
  return content.length ? "/*\n" + content.map((line) => " * " + line).join("\n") + "\n */" : "";
}

function preservedComment(doc, sourceFile) {
  const narrative = [];
  const description = cleanNarrative(doc.comment);
  if (description) narrative.push(description);
  for (const tag of doc.tags ?? []) {
    if (!narrativeTags.has(tag.tagName.text)) continue;
    const body = cleanNarrative(tag.comment);
    if (body) narrative.push(body);
  }
  const keep = provenanceLines(doc, sourceFile);
  const tags = doc.tags?.filter((tag) => tag.tagName.text === "internal").map((tag) => "@internal") ?? [];
  const comments = [];
  if (tags.length) comments.push("/** " + [...new Set(tags)].join(" ") + " */");
  const ordinary = ordinaryBlock([...narrative, ...keep]);
  if (ordinary) comments.push(ordinary);
  return comments.join("\n");
}

function contractDeclarationNames(index) {
  return index.publicContractDeclarations();
}

function isPublicNode(node, sourceFile, publicNames) {
  let current = node;
  while (current && current !== sourceFile) {
    if (declarationNames(current).some((name) => publicNames.has(name))) return true;
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
  const edits = [];
  let count = 0;
  let preservedNarrative = 0;
  let preservedProvenance = 0;
  let retainedInternal = 0;
  for (const node of declarationNodes(sourceFile)) {
    if (isPublicNode(node, sourceFile, names)) continue;
    for (const doc of node.jsDoc ?? []) {
      const replacement = preservedComment(doc, sourceFile);
      edits.push({ start: doc.getStart(sourceFile), end: doc.end, text: replacement });
      const description = cleanNarrative(doc.comment);
      const taggedNarrative = (doc.tags ?? []).some((tag) => narrativeTags.has(tag.tagName.text) && cleanNarrative(tag.comment));
      if (description || taggedNarrative) preservedNarrative++;
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
    plan.index = createPublicSourceExportIndex({ root });
  }
  if (plan.index.publicFiles.size === 0) throw new Error("Public export index is empty; refusing to plan destructive edits.");
  if (!plan.contractNames) plan.contractNames = contractDeclarationNames(plan.index);
  const file = fs.existsSync(sourceFile.fileName)
    ? fs.realpathSync(sourceFile.fileName)
    : path.resolve(sourceFile.fileName);
  const contractNames = plan.contractNames.get(file) ?? new Set();
  const index = { contractNamesByFile: new Map([[file, contractNames]]) };
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
  if (output.includes("A small internal wrapper.")) throw new Error("Redundant internal summary was retained.");
  if (!output.includes("/*\n * Preserve the prior key") || !output.includes("because a held interval") || !output.includes("downstream solver relies on that identity")) throw new Error("Internal rationale was not retained as an ordinary comment.");
  if (!output.includes("https://example.test/source") || output.includes("@source")) throw new Error("Source link preservation failed.");
  if (!output.includes("/** @internal */")) throw new Error("@internal marker was not retained.");
  if (!output.includes("Copyright 2026 Example.") || output.includes("@evidence source") || output.includes("@evidence internal") || output.includes("@evidence hidden")) throw new Error("Provenance preservation failed.");
  if (ts.createSourceFile("fixture.ts", output, ts.ScriptTarget.Latest, true).parseDiagnostics.length) throw new Error("Fixture output does not parse.");
  console.log(JSON.stringify({ ok: true, edits: result.count }, null, 2));
}

if (require.main === module) {
  if (process.argv[2] === "--self-test") selfTest();
  else run("strip-internal-jsdoc", plan, (relative) => /^packages\/[^/]+\/src\//u.test(relative));
}

module.exports = { contractDeclarationNames, declarationNodes, planFile, preservedComment };
