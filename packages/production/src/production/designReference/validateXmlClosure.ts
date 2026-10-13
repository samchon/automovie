import { IStartTag } from "./IStartTag";
import { readStartTag } from "./readStartTag";
import { skipXmlMisc } from "./skipXmlMisc";
import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";
import { DesignReferenceXmlLexical } from "./DesignReferenceXmlLexical";

/**
 * Walk a document from its admitted root, tracking open tag identity and child namespace scope until the root closes with only legal XML epilog remaining.
 */
export const validateXmlClosure = (
  path: string,
  text: string,
  root: IStartTag,
): void => {
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
  const stack = [root];
  let cursor = root.end;
  while (cursor < text.length) {
    const open = text.indexOf("<", cursor);
    if (open < 0) {
      DesignReferenceXmlLexical.validateXmlCharacterData(path, text.slice(cursor));
      break;
    }
    DesignReferenceXmlLexical.validateXmlCharacterData(path, text.slice(cursor, open));
    if (text.startsWith("<!--", open)) {
      const end = text.indexOf("-->", open + 4);
      if (end < 0)
        throw invalidDesignReferenceContainer(path, "SVG", "closure", "unterminated comment");
      if (text.slice(open + 4, end).includes("--"))
        throw invalidDesignReferenceContainer(path, "SVG", "comment", "comment body contains --");
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
      const end = text.indexOf("]]>", open + 9);
      if (end < 0) throw invalidDesignReferenceContainer(path, "SVG", "closure", "unterminated CDATA");
      DesignReferenceXmlLexical.validateXmlCharacters(path, text.slice(open + 9, end));
      cursor = end + 3;
      continue;
    }
    if (text.startsWith("<?", open)) {
      const end = text.indexOf("?>", open + 2);
      if (end < 0)
        throw invalidDesignReferenceContainer(path, "SVG", "closure", "unterminated instruction");
      DesignReferenceXmlLexical.validateXmlInstruction(path, text.slice(open + 2, end), false);
      cursor = end + 2;
      continue;
    }
    const close = /^<\/([A-Za-z_][\w.:-]*)[ \t\r\n]*>/.exec(text.slice(open));
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
    const child = readStartTag(path, text, open, stack.at(-1)!.namespaces);
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
};
