import ts from "typescript-compiler";

import type { IHumanViewerResolveIo } from "./IHumanViewerResolveIo.js";
import type { IHumanViewerRevisionReadIo } from "./IHumanViewerRevisionReadIo.js";
import { resolveHumanViewerImport } from "./resolveHumanViewerImport.js";

/**
 * Collect statically named source dependencies, including entry files, every import/re-export, literal dynamic/CommonJS imports, import types and literal URLs relative to import.meta.url. Named imports still load their complete barrel's module dependencies; unrelated re-export initialization cannot be discarded safely. Type dependencies remain relevant to generated validators. Workspace manifests consulted during resolution join the graph, and unreadable entries remain watched. Dynamically computed paths require the caller's checked-input authority; this static graph does not infer their values. Results are sorted and registry/Node modules end their branches.
 *
 * @evidence contracts/common.md#principled-implementation Compiler AST nodes distinguish module syntax from prose, strings and comments; full module traversal preserves barrel initialization dependencies and tracked manifest reads preserve public-export resolution authority.
 * @evidence contracts/common.md#clear-and-simple-design One graph walk coordinates memoized text access and the existing workspace resolver; export-name ownership guesses are removed instead of maintained as an unsafe optimization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named imports cannot skip other re-exported modules' initialization, and regular expressions no longer strip code-like text or invent dependencies inside ordinary strings.
 * @evidence contracts/common.md#meaningful-documentation Documentation lists supported static syntax, full-barrel semantics, type/manifest dependencies, unreadable entry tracking and the dynamically computed-path limitation.
 * @evidence contracts/performance.md#efficient-algorithms For V reached files, E static edges and B source characters, text is read and AST-parsed once per file in O(B + V + E) work plus resolver costs; sorting V output paths costs O(V log V), and memo/AST/work-list state is graph-sized.
 * @evidence contracts/performance.md#reuse-equivalent-work This invocation shares one text result per path, including consulted manifests; cross-batch text reuse and invalidation remain with createHumanViewerRevisions rather than a filename-only global cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed ASTs and text references live only during this graph walk and no filesystem handle escapes; the caller receives path strings and owns any longer-lived revision memo.
 */
export function collectHumanViewerImports(props: {
  entries: readonly string[];
  root: string;
  io: IHumanViewerResolveIo & IHumanViewerRevisionReadIo;
}): string[] {
  const code: Map<string, string | undefined> = new Map<
    string,
    string | undefined
  >();
  const resolutionInputs: Set<string> = new Set<string>();
  const io: IHumanViewerResolveIo & IHumanViewerRevisionReadIo = {
    exists: props.io.exists,
    read: (file: string): string | undefined => {
      if (file.endsWith("/package.json")) resolutionInputs.add(file);
      if (!code.has(file)) code.set(file, props.io.read(file));
      return code.get(file);
    },
  };
  const resolution: {
    root: string;
    io: IHumanViewerResolveIo & IHumanViewerRevisionReadIo;
  } = { root: props.root, io };
  const seen: Set<string> = new Set<string>();
  const pending: string[] = [...props.entries];
  while (pending.length !== 0) {
    const file: string = pending.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const text: string | undefined = io.read(file);
    if (
      text === undefined ||
      !/\.(?:ts|mts|cts|tsx|js|mjs|cjs|jsx)$/.test(file)
    )
      continue;
    const source: ts.SourceFile = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
    );
    function add(value: ts.Node | undefined): void {
      if (value === undefined || !ts.isStringLiteralLike(value)) return;
      const target: string | null = resolveHumanViewerImport(
        value.text,
        file,
        resolution,
      );
      if (target !== null && !seen.has(target)) pending.push(target);
    }
    function visit(node: ts.Node): void {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
        add(node.moduleSpecifier);
      else if (
        ts.isImportEqualsDeclaration(node) &&
        ts.isExternalModuleReference(node.moduleReference)
      )
        add(node.moduleReference.expression);
      else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
        add(node.argument.literal);
      else if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === "require"))
      )
        add(node.arguments[0]);
      else if (
        ts.isNewExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "URL"
      ) {
        const base: ts.Expression | undefined = node.arguments?.[1];
        if (
          base !== undefined &&
          ts.isPropertyAccessExpression(base) &&
          base.name.text === "url" &&
          ts.isMetaProperty(base.expression) &&
          base.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
          base.expression.name.text === "meta"
        )
          add(node.arguments?.[0]);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return [...new Set<string>([...seen, ...resolutionInputs])].sort(
    (left: string, right: string): number =>
      left < right ? -1 : left > right ? 1 : 0,
  );
}
