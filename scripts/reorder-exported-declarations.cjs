"use strict";

const ts = require("typescript-compiler");
const { applyEdits, run } = require("./export-refactor-worktree.cjs");

function modifiers(statement) {
  return ts.canHaveModifiers(statement) ? (ts.getModifiers(statement) ?? []) : [];
}

function hasModifier(statement, kind) {
  return modifiers(statement).some((modifier) => modifier.kind === kind);
}

function isDeclaration(statement) {
  return ts.isFunctionDeclaration(statement) ||
    ts.isInterfaceDeclaration(statement) ||
    ts.isTypeAliasDeclaration(statement) ||
    ts.isVariableStatement(statement) ||
    ts.isClassDeclaration(statement) ||
    ts.isEnumDeclaration(statement) ||
    ts.isModuleDeclaration(statement);
}

function isExported(statement) {
  return hasModifier(statement, ts.SyntaxKind.ExportKeyword);
}

function executesInOrder(statement, atModuleRoot) {
  if (hasModifier(statement, ts.SyntaxKind.DeclareKeyword) ||
      ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) return false;
  if (ts.isFunctionDeclaration(statement)) {
    if (!statement.body) return false;
    // An exported namespace function emits a property assignment in declaration order.
    return !atModuleRoot && isExported(statement);
  }
  return true;
}

function namespaceBlock(statement) {
  if (!ts.isModuleDeclaration(statement) || !ts.isIdentifier(statement.name) ||
      hasModifier(statement, ts.SyntaxKind.DeclareKeyword)) return undefined;
  let body = statement.body;
  while (body && ts.isModuleDeclaration(body)) body = body.body;
  return body && ts.isModuleBlock(body) ? body : undefined;
}

function trivia(source, statement) {
  const start = statement.getFullStart();
  const prefix = source.text.slice(start, statement.getStart(source));
  const spacing = /^\s*/u.exec(prefix)[0];
  return { start, spacing, comments: prefix.slice(spacing.length) };
}

function hasSpecialComment(info) {
  return /^\s*\/\/\//u.test(info.comments) ||
    /@(?:ts-\w+|fileoverview|license|preserve)|copyright|prettier-ignore|eslint|istanbul|#(?:end)?region/iu.test(info.comments);
}

function sameOrder(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function planFile(source) {
  const blocked = [];
  let count = 0;

  function planScope(statements, atModuleRoot) {
    const edits = [];
    let index = 0;
    while (index < statements.length) {
      if (!isDeclaration(statements[index])) {
        index++;
        continue;
      }
      const start = index;
      while (index < statements.length && isDeclaration(statements[index])) index++;
      const original = statements.slice(start, index);
      const nested = new Map();
      for (const statement of original) {
        const body = namespaceBlock(statement);
        nested.set(statement, body ? planScope(body.statements, false) : []);
      }
      const sorted = [...original.filter(isExported), ...original.filter((item) => !isExported(item))];
      if (sameOrder(original, sorted)) {
        for (const entry of nested.values()) edits.push(...entry);
        continue;
      }
      const line = source.getLineAndCharacterOfPosition(original[0].getStart(source)).line + 1;
      const evaluated = (items) => items.filter((item) => executesInOrder(item, atModuleRoot));
      const parts = new Map(original.map((item) => [item, trivia(source, item)]));
      const trailing = source.text.slice(original.at(-1).end);
      const unsafeTrivia = /^[ \t]*\/[/*]/u.test(trailing) || original.some((item, slot) => {
        const info = parts.get(item);
        const lineBreak = /\r|\n/u.test(info.spacing);
        return hasSpecialComment(info) || (!lineBreak && (slot > 0 || (start > 0 && info.comments)));
      });
      if (!sameOrder(evaluated(original), evaluated(sorted)) || unsafeTrivia) {
        blocked.push({ line, reason: unsafeTrivia ? "Comment or same-line boundary" : "Runtime declaration order" });
        for (const entry of nested.values()) edits.push(...entry);
        continue;
      }

      let text = "";
      for (let slot = 0; slot < sorted.length; ++slot) {
        const item = sorted[slot];
        const part = parts.get(item);
        const bodyStart = part.start + part.spacing.length;
        const body = source.text.slice(bodyStart, item.end);
        text += parts.get(original[slot]).spacing + applyEdits(body, nested.get(item), bodyStart);
        if (item !== original[slot]) count++;
      }
      edits.push({ start: original[0].getFullStart(), end: original.at(-1).end, text });
    }
    return edits;
  }

  const edits = planScope(source.statements, ts.isExternalModule(source));
  return { edits, count, blocked };
}

if (require.main === module) run("reorder-exported-declarations", planFile);
module.exports = { planFile };
