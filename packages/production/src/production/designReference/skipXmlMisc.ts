import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";
import { DesignReferenceXmlLexical } from "./DesignReferenceXmlLexical";

/**
 * Advance over XML whitespace, comments and processing instructions. A declaration is legal only at the initial byte position; later instructions cannot reintroduce it.
 */
export const skipXmlMisc = (
  path: string,
  text: string,
  offset: number,
  allowDeclaration = false,
): number => {
  let cursor = DesignReferenceXmlLexical.skipXmlSpace(text, offset);
  if (cursor !== offset) allowDeclaration = false;
  while (text.startsWith("<?", cursor) || text.startsWith("<!--", cursor)) {
    const comment = text.startsWith("<!--", cursor);
    const closing = comment ? "-->" : "?>";
    const end = text.indexOf(closing, cursor + 2);
    if (end < 0) throw invalidDesignReferenceContainer(path, "XML", "misc", `unterminated ${closing}`);
    if (comment && text.slice(cursor + 4, end).includes("--"))
      throw invalidDesignReferenceContainer(path, "XML", "comment", "comment body contains --");
    if (comment) DesignReferenceXmlLexical.validateXmlCharacters(path, text.slice(cursor + 4, end));
    else {
      DesignReferenceXmlLexical.validateXmlInstruction(
        path,
        text.slice(cursor + 2, end),
        allowDeclaration,
      );
    }
    allowDeclaration = false;
    cursor = DesignReferenceXmlLexical.skipXmlSpace(text, end + closing.length);
  }
  return cursor;
};
