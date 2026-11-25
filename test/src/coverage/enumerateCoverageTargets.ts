import ts from "typescript-compiler";

/**
 * Every function and branch arm of a parsed source, with the offsets a block
 * coverage reads to decide whether each was reached.
 *
 * A function is reached when the count at the first character of its body is
 * positive. An explicit arm (an `if`'s then and else, a conditional's two
 * results, the right operand of `&&`, `||`, `??` and their assignments, a
 * non-empty `case`) is reached when the count at its first character is
 * positive. An implicit arm (an `if` without `else` not taken, a logical
 * operator that short-circuits) is reached when the count where the whole
 * statement or expression starts exceeds the explicit arm's: V8's block counts
 * are exact, so the difference is how often the implicit arm ran. These are the
 * arms Istanbul counts for those constructs; loops, default parameters and
 * optional chains are not counted.
 *
 * Code esbuild writes around a module rather than from it is skipped: the
 * immediately invoked function and the `X || (X = {})` argument of a namespace
 * or an enum, the getters of an `__export` record and the wrapper method of
 * `__esm` or `__commonJS`. Their bodies' own code is still read.
 *
 * @param source The parsed source: a bundle chunk as JavaScript or a module as
 *   TypeScript.
 * @param lines Whether a target's name ends with its source line, which is
 *   meaningful only for a module's own source.
 * @returns The targets in source order.
 */
export function enumerateCoverageTargets(
  source: ts.SourceFile,
  lines: boolean,
): enumerateCoverageTargets.ITarget[] {
  const targets: enumerateCoverageTargets.ITarget[] = [];
  const label: (name: string, at: number) => string = (
    name: string,
    at: number,
  ): string =>
    lines
      ? `${name}:${source.getLineAndCharacterOfPosition(at).line + 1}`
      : name;
  const arm: (
    scope: string,
    kind: string,
    at: number,
    minus: number | null,
  ) => void = (
    scope: string,
    kind: string,
    at: number,
    minus: number | null,
  ): void => {
    targets.push({
      kind: "branch",
      name: label(`${scope || "<module>"}: ${kind}`, at),
      at,
      minus,
    });
  };

  const visit: (node: ts.Node, scope: string) => void = (
    node: ts.Node,
    scope: string,
  ): void => {
    // esbuild's wrappers: skip the wrapper, read what it wraps.
    if (ts.isCallExpression(node)) {
      const wrapped: IWrapped | null = wrapper(node);
      if (wrapped !== null) {
        for (const body of wrapped.bodies) visit(body, wrapped.scope ?? scope);
        return;
      }
    }

    if (isFunction(node) && node.body !== undefined) {
      const name: string = `${scope === "" ? "" : `${scope}.`}${functionName(node)}`;
      const at: number = node.body.getStart(source);
      targets.push({
        kind: "function",
        name: label(name, at),
        at,
        minus: null,
      });
      ts.forEachChild(node, (child: ts.Node): void => visit(child, name));
      return;
    }
    if (
      (ts.isClassDeclaration(node) || ts.isClassExpression(node)) &&
      node.name !== undefined
    ) {
      const name: string = `${scope === "" ? "" : `${scope}.`}${node.name.text}`;
      ts.forEachChild(node, (child: ts.Node): void => visit(child, name));
      return;
    }
    if (ts.isModuleDeclaration(node)) {
      const name: string = `${scope === "" ? "" : `${scope}.`}${node.name.getText(source)}`;
      ts.forEachChild(node, (child: ts.Node): void => visit(child, name));
      return;
    }

    if (ts.isIfStatement(node)) {
      const then: number = probe(node.thenStatement, source);
      arm(scope, "if", then, null);
      if (node.elseStatement !== undefined)
        arm(scope, "else", probe(node.elseStatement, source), null);
      else arm(scope, "implicit else", node.getStart(source), then);
    } else if (ts.isConditionalExpression(node)) {
      arm(scope, "? true", node.whenTrue.getStart(source), null);
      arm(scope, ": false", node.whenFalse.getStart(source), null);
    } else if (
      ts.isBinaryExpression(node) &&
      LOGICAL.has(node.operatorToken.kind)
    ) {
      const operator: string = node.operatorToken.getText(source);
      const right: number = node.right.getStart(source);
      arm(scope, `${operator} right`, right, null);
      arm(scope, `${operator} short-circuit`, node.getStart(source), right);
    } else if (
      (ts.isCaseClause(node) || ts.isDefaultClause(node)) &&
      node.statements.length !== 0
    )
      arm(
        scope,
        ts.isCaseClause(node) ? "case" : "default",
        node.statements[0]!.getStart(source),
        null,
      );
    ts.forEachChild(node, (child: ts.Node): void => visit(child, scope));
  };
  visit(source, "");
  return targets;
}

/** Companion types of {@link enumerateCoverageTargets}. */
export namespace enumerateCoverageTargets {
  /** One function or branch arm and the offsets that decide it. */
  export interface ITarget {
    /** A function or a branch arm. */
    kind: "function" | "branch";

    /** Its qualified name, or the holding function's name and the arm's kind. */
    name: string;

    /** The offset whose count must be positive, or exceed `minus`'s. */
    at: number;

    /** For an implicit arm, the explicit arm's offset; otherwise null. */
    minus: number | null;
  }
}

/** The logical operators whose right operand is a branch arm. */
const LOGICAL: ReadonlySet<ts.SyntaxKind> = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

/** What an esbuild wrapper holds: the bodies to read, under which scope. */
interface IWrapped {
  /** The nodes holding the module's own code. */
  bodies: ts.Node[];

  /** The namespace or enum the wrapper builds, or null to keep the scope. */
  scope: string | null;
}

/** A node that is a function with an optional body. */
type FunctionNode =
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.ArrowFunction
  | ts.MethodDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration
  | ts.ConstructorDeclaration;

/** Whether a node is a function, a method, an accessor or a constructor. */
function isFunction(node: ts.Node): node is FunctionNode {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isConstructorDeclaration(node)
  );
}

/**
 * A function's own name, or the name it is bound to: the variable, property or
 * member it initializes, else `<anonymous>`.
 *
 * Esbuild renames a namespace member's declaration that collides with another
 * by appending a number (`place2`) and exports it with `NS.place = place2`; a
 * declaration so exported from its own block takes the exported name.
 */
function functionName(node: FunctionNode): string {
  if (ts.isConstructorDeclaration(node)) return "constructor";
  if (ts.isFunctionDeclaration(node) && node.name !== undefined) {
    const own: string = node.name.text;
    if (
      /\d$/u.test(own) &&
      (ts.isBlock(node.parent) || ts.isSourceFile(node.parent))
    )
      for (const statement of node.parent.statements)
        if (
          ts.isExpressionStatement(statement) &&
          ts.isBinaryExpression(statement.expression) &&
          statement.expression.operatorToken.kind ===
            ts.SyntaxKind.EqualsToken &&
          ts.isPropertyAccessExpression(statement.expression.left) &&
          ts.isIdentifier(statement.expression.right) &&
          statement.expression.right.text === own
        )
          return statement.expression.left.name.text;
    return own;
  }
  if (node.name !== undefined) return node.name.getText();
  const parent: ts.Node = node.parent;
  if (
    (ts.isVariableDeclaration(parent) ||
      ts.isPropertyAssignment(parent) ||
      ts.isPropertyDeclaration(parent)) &&
    parent.name !== undefined
  )
    return parent.name.getText();
  if (
    ts.isBinaryExpression(parent) &&
    parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isPropertyAccessExpression(parent.left)
  )
    return parent.left.name.text;
  return "<anonymous>";
}

/**
 * The first character inside a branch's statement: a block's first statement,
 * or just inside an empty block's brace, or the statement itself.
 */
function probe(statement: ts.Statement, source: ts.SourceFile): number {
  if (!ts.isBlock(statement)) return statement.getStart(source);
  return statement.statements.length === 0
    ? statement.getStart(source) + 1
    : statement.statements[0]!.getStart(source);
}

/** The wrapper esbuild wrote at a call, or null for an ordinary call. */
function wrapper(call: ts.CallExpression): IWrapped | null {
  const callee: ts.Expression = unparenthesized(call.expression);

  // `((X2) => { ... })(X || (X = {}))` and `((E2) => { ... })(E || {})`.
  if (
    (ts.isArrowFunction(callee) || ts.isFunctionExpression(callee)) &&
    call.arguments.length === 1
  ) {
    const built: string | null = namespaceArgument(call.arguments[0]!);
    if (built !== null) return { bodies: [callee.body], scope: built };
    return null;
  }
  if (!ts.isIdentifier(callee)) return null;

  // `__export(target, { a: () => a })`: getters esbuild writes.
  if (callee.text === "__export") return { bodies: [], scope: null };

  // `__esm({ "path"() { ... } })` and `__commonJS({ ... })`: the module body.
  if (callee.text === "__esm" || callee.text === "__commonJS") {
    const bodies: ts.Node[] = [];
    for (const argument of call.arguments)
      if (ts.isObjectLiteralExpression(argument))
        for (const property of argument.properties)
          if (ts.isMethodDeclaration(property) && property.body !== undefined)
            bodies.push(property.body);
          else if (
            ts.isPropertyAssignment(property) &&
            (ts.isArrowFunction(property.initializer) ||
              ts.isFunctionExpression(property.initializer))
          )
            bodies.push(property.initializer.body);
    return { bodies, scope: null };
  }
  return null;
}

/**
 * The name a namespace or enum argument builds, `X` of `X || (X = {})` or `X ||
 * {}`, or null for any other argument.
 */
function namespaceArgument(argument: ts.Expression): string | null {
  const node: ts.Expression = unparenthesized(argument);
  if (
    !ts.isBinaryExpression(node) ||
    node.operatorToken.kind !== ts.SyntaxKind.BarBarToken ||
    !ts.isIdentifier(node.left)
  )
    return null;
  const right: ts.Expression = unparenthesized(node.right);
  if (ts.isObjectLiteralExpression(right) && right.properties.length === 0)
    return node.left.text;
  if (
    ts.isBinaryExpression(right) &&
    right.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isIdentifier(right.left) &&
    right.left.text === node.left.text &&
    ts.isObjectLiteralExpression(unparenthesized(right.right))
  )
    return node.left.text;
  return null;
}

/** An expression without its enclosing parentheses. */
function unparenthesized(expression: ts.Expression): ts.Expression {
  let node: ts.Expression = expression;
  while (ts.isParenthesizedExpression(node)) node = node.expression;
  return node;
}
