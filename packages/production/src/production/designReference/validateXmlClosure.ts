import { IStartTag } from "./IStartTag";
import { readStartTag } from "./readStartTag";
import { skipXmlMisc } from "./skipXmlMisc";
import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";
import { DesignReferenceXmlLexical } from "./DesignReferenceXmlLexical";

/**
 * Walk a document from its admitted root, tracking open tag identity and child namespace scope until the root closes with only legal XML epilog remaining.
 *
 * @evidence contracts/common.md#principled-implementation An explicit tag stack enforces exact authored closing names and inherited namespace scope; character data, comments, CDATA and instructions pass their lexical checks, with Comment production 15 forbidding trailing body hyphens as well as double hyphens.
 * @evidence contracts/common.md#clear-and-simple-design Nesting stays in this whole-document reader while tag/namespace and lexical owners admit individual nodes; the same Misc reader validates the epilog of normal and self-closing roots.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A root token or found delimiter does not prove closure; mismatched/unclosed tags, malformed nodes and non-Misc trailing content refuse without repairing the document.
 * @evidence contracts/common.md#meaningful-documentation Requires an already admitted root from the same text and throws typed family/stage failures until complete closure and legal epilog are established; it creates no renderer or general XML DOM.
 * @evidence contracts/performance.md#efficient-algorithms A cursor and explicit stack avoid recursive nesting calls; tag readers still create remaining-text slices and copy active namespace maps, so time/allocation includes those overlapping text and binding populations rather than a blanket linear claim.
 * @evidence contracts/performance.md#reuse-equivalent-work Each opening tag carries its resolved namespace scope until its exact closing name pops it; CDATA/comments are not reparsed as element markup.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Open-tag maps remain on the stack proportional to nesting and binding/attribute population, without a fixed depth cap; they release after pop/return/refusal and no native resource or persistent parse cache is retained.
 */
export function validateXmlClosure(
  path: string,
  text: string,
  root: IStartTag,
): void {
  if (root.selfClosing) {
    if (skipXmlMisc(path, text, root.end) !== text.length)
      throw invalidDesignReferenceContainer(
        path,
        "SVG",
        "closure",
        "content follows the self-closed root",
      );
    return;
  }
  const stack: IStartTag[] = [root];
  let cursor: number = root.end;
  while (cursor < text.length) {
    const open: number = text.indexOf("<", cursor);
    if (open < 0) {
      DesignReferenceXmlLexical.validateXmlCharacterData(path, text.slice(cursor));
      break;
    }
    DesignReferenceXmlLexical.validateXmlCharacterData(path, text.slice(cursor, open));
    if (text.startsWith("<!--", open)) {
      const end: number = text.indexOf("-->", open + 4);
      if (end < 0)
        throw invalidDesignReferenceContainer(path, "SVG", "closure", "unterminated comment");
      const commentBody: string = text.slice(open + 4, end);
      if (commentBody.includes("--") || commentBody.endsWith("-"))
        throw invalidDesignReferenceContainer(path, "SVG", "comment", "comment body contains -- or ends in -");
      // Comments use the same XML character grammar inside and outside the
      // root. Delimiters alone do not make an illegal control scalar valid.
      DesignReferenceXmlLexical.validateXmlCharacters(
        path,
        text.slice(open + 4, end),
      );
      cursor = end + 3;
      continue;
    }
    if (text.startsWith("<![CDATA[", open)) {
      const end: number = text.indexOf("]]>", open + 9);
      if (end < 0) throw invalidDesignReferenceContainer(path, "SVG", "closure", "unterminated CDATA");
      DesignReferenceXmlLexical.validateXmlCharacters(path, text.slice(open + 9, end));
      cursor = end + 3;
      continue;
    }
    if (text.startsWith("<?", open)) {
      const end: number = text.indexOf("?>", open + 2);
      if (end < 0)
        throw invalidDesignReferenceContainer(path, "SVG", "closure", "unterminated instruction");
      DesignReferenceXmlLexical.validateXmlInstruction(path, text.slice(open + 2, end), false);
      cursor = end + 2;
      continue;
    }
    const close: RegExpExecArray | null = /^<\/([A-Za-z_][\w.:-]*)[ \t\r\n]*>/.exec(text.slice(open));
    if (close !== null) {
      if (!DesignReferenceXmlLexical.isXmlQualifiedName(close[1]!))
        throw invalidDesignReferenceContainer(
          path,
          "SVG",
          "name",
          `invalid qualified name ${close[1]}`,
        );
      if (stack.pop()?.name !== close[1])
        throw invalidDesignReferenceContainer(
          path,
          "SVG",
          "closure",
          `mismatched closing tag ${close[1]}`,
        );
      cursor = open + close[0].length;
      if (stack.length === 0) {
        if (skipXmlMisc(path, text, cursor) !== text.length)
          throw invalidDesignReferenceContainer(
            path,
            "SVG",
            "closure",
            "content follows the root element",
          );
        return;
      }
      continue;
    }
    const child: IStartTag | null = readStartTag(path, text, open, stack.at(-1)!.namespaces);
    if (child === null)
      throw invalidDesignReferenceContainer(
        path,
        "SVG",
        "closure",
        `malformed markup at character ${open}`,
      );
    if (!child.selfClosing) stack.push(child);
    cursor = child.end;
  }
  throw invalidDesignReferenceContainer(path, "SVG", "closure", "root element is not closed");
}
