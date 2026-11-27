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

function declarationNames(statement) {
  if (ts.isVariableStatement(statement)) {
    const names = [];
    function visit(binding) {
      if (ts.isIdentifier(binding)) names.push(binding.text);
      else if (ts.isObjectBindingPattern(binding) || ts.isArrayBindingPattern(binding))
        for (const element of binding.elements)
          if (ts.isBindingElement(element)) visit(element.name);
    }
    for (const declaration of statement.declarationList.declarations)
      visit(declaration.name);
    return names;
  }
  return statement.name && ts.isIdentifier(statement.name)
    ? [statement.name.text]
    : [];
}

function isTypeOnly(statement) {
  return ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement);
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
    const nameCounts = new Map();
    for (const statement of statements)
      for (const name of declarationNames(statement))
        nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
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
      const duplicateMoved = original.some((item, slot) =>
        declarationNames(item).some((name) => nameCounts.get(name) > 1) &&
        sorted.indexOf(item) !== slot,
      );
      const runtimeOrderChanged = !sameOrder(evaluated(original), evaluated(sorted));
      if (unsafeTrivia) {
        blocked.push({ line, reason: "Comment or same-line boundary" });
        for (const entry of nested.values()) edits.push(...entry);
        continue;
      }

      let ordered = sorted;
      let blockedReason;
      if (runtimeOrderChanged || duplicateMoved) {
        const movable = new Set(original.filter((item) =>
          isTypeOnly(item) && declarationNames(item).length === 1 &&
          nameCounts.get(declarationNames(item)[0]) === 1,
        ));
        const partial = [
          ...original.filter((item) => movable.has(item) && isExported(item)),
          ...original.filter((item) => !movable.has(item)),
          ...original.filter((item) => movable.has(item) && !isExported(item)),
        ];
        const fixedOriginal = original.filter((item) => !movable.has(item));
        const fixedPartial = partial.filter((item) => !movable.has(item));
        if (!sameOrder(fixedOriginal, fixedPartial))
          throw new Error("Partial ordering changed a non-type declaration.");
        ordered = partial;
        blockedReason = runtimeOrderChanged
          ? "Runtime declaration order"
          : "Merged or duplicate lexical name";
      }

      if (sameOrder(original, ordered)) {
        for (const entry of nested.values()) edits.push(...entry);
        if (blockedReason) blocked.push({ line, reason: blockedReason });
        continue;
      }
      let text = "";
      for (let slot = 0; slot < ordered.length; ++slot) {
        const item = ordered[slot];
        const part = parts.get(item);
        const bodyStart = part.start + part.spacing.length;
        const body = source.text.slice(bodyStart, item.end);
        text += parts.get(original[slot]).spacing + applyEdits(body, nested.get(item), bodyStart);
        if (item !== original[slot]) count++;
      }
      edits.push({ start: original[0].getFullStart(), end: original.at(-1).end, text });
      if (blockedReason) blocked.push({ line, reason: blockedReason });
    }
    return edits;
  }

  const edits = planScope(source.statements, ts.isExternalModule(source));
  return { edits, count, blocked };
}

function selfTest() {
  const partialText = [
    "/** Public shape docs. */",
    "export interface PublicShape { value: number; }",
    "const seed = 3;",
    "/** Private shape rationale. */",
    "type PrivateShape = number;",
    "export const value = seed;",
  ].join("\n");
  const partialSource = ts.createSourceFile(
    "partial.ts",
    partialText,
    ts.ScriptTarget.Latest,
    true,
  );
  const partialPlan = planFile(partialSource);
  const partialAfter = applyEdits(partialText, partialPlan.edits);
  const originalRuntime = partialSource.statements.filter((item) =>
    isDeclaration(item) && executesInOrder(item, true),
  );
  const afterSource = ts.createSourceFile(
    "partial.ts",
    partialAfter,
    ts.ScriptTarget.Latest,
    true,
  );
  const afterRuntime = afterSource.statements.filter((item) =>
    isDeclaration(item) && executesInOrder(item, true),
  );
  if (!partialPlan.blocked.some((item) => item.reason === "Runtime declaration order"))
    throw new Error("Runtime-order dependency was not reported.");
  if (!sameOrder(
    originalRuntime.map((item) => item.getText(partialSource)),
    afterRuntime.map((item) => item.getText(afterSource)),
  ))
    throw new Error("Partial ordering changed runtime declaration order.");
  if (
    !partialAfter.includes("/** Public shape docs. */\nexport interface PublicShape") ||
    !partialAfter.includes("/** Private shape rationale. */\ntype PrivateShape")
  )
    throw new Error("Moved declaration comments were detached.");
  if (afterSource.parseDiagnostics.length) throw new Error("Partial ordering output does not parse.");

  const constDependency = ts.createSourceFile(
    "dependency.ts",
    "const seed = 3;\nexport namespace N { export const value = seed; }",
    ts.ScriptTarget.Latest,
    true,
  );
  const dependencyPlan = planFile(constDependency);
  if (
    dependencyPlan.count !== 0 ||
    !dependencyPlan.blocked.some((item) => item.reason === "Runtime declaration order")
  )
    throw new Error("Eager namespace dependency was not kept in source order.");

  const merged = ts.createSourceFile(
    "merged.ts",
    "interface Merge { first: string; }\nexport interface Merge { second: string; }",
    ts.ScriptTarget.Latest,
    true,
  );
  const mergedPlan = planFile(merged);
  if (
    mergedPlan.count !== 0 ||
    !mergedPlan.blocked.some((item) => item.reason === "Merged or duplicate lexical name")
  )
    throw new Error("Merged declarations were reordered.");

  const directiveText = [
    "const seed = 3;",
    "// eslint-disable-next-line",
    "export interface PublicShape {}",
    "type PrivateShape = number;",
    "export const value = seed;",
  ].join("\n");
  const directive = ts.createSourceFile(
    "directive.ts",
    directiveText,
    ts.ScriptTarget.Latest,
    true,
  );
  const directivePlan = planFile(directive);
  if (
    directivePlan.count !== 0 ||
    !directivePlan.blocked.some((item) => item.reason === "Comment or same-line boundary")
  )
    throw new Error("Special comment boundary was crossed.");

  console.log(JSON.stringify({ ok: true, partialMoves: partialPlan.count, checked: 4 }, null, 2));
}

if (require.main === module) {
  if (process.argv[2] === "--self-test") selfTest();
  else run("reorder-exported-declarations", planFile);
}
module.exports = { planFile, selfTest };
