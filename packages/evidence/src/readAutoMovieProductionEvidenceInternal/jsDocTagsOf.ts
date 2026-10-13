import ts from "typescript-compiler";


/** Read parser-owned custom JSDoc tags without scanning comment-shaped text.
 *
 * @evidence contracts/common.md#principled-implementation The TypeScript parser's public JSDoc tag API supplies tag names and trimmed comments, including parser-part arrays.
 * @evidence contracts/common.md#clear-and-simple-design One tag projection serves source-owner lineage rather than scanning arbitrary comment-shaped source text.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Strings and ordinary comments cannot become tags through a regex fallback.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies parser-owned custom JSDoc tags and normalized comment output.
 * @evidence contracts/performance.md#efficient-algorithms For T tags and C comment characters, mapping is O(T+C) and retains one projected record per tag.
 * @evidence contracts/performance.md#reuse-equivalent-work All owner nodes share this same projection, with their parsed AST reused by the caller.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only tag strings escape; AST ownership remains with the caller and no module is executed.
 */
export const jsDocTagsOf: (nodes: readonly ts.Node[]) => Array<{
    name: string;
    comment: string;
}> = (
  nodes: readonly ts.Node[],
): Array<{ name: string; comment: string }> =>
  nodes.flatMap((node: ts.Node) : { name: string; comment: string; }[] =>
    ts.getJSDocTags(node).map((tag: ts.JSDocTag) : { name: string; comment: string; } => ({
      name: tag.tagName.text,
      comment:
        typeof tag.comment === "string"
          ? tag.comment.trim()
          : (tag.comment ?? [])
              .map((part: ts.JSDocComment) : string => part.text)
              .join("")
              .trim(),
    })),
  );
