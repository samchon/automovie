import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";
import { DesignReferenceXmlLexical } from "./DesignReferenceXmlLexical";

/**
 * Advance over XML whitespace, comments and processing instructions. A declaration is legal only at the initial text position; later instructions cannot reintroduce it.
 *
 * @evidence contracts/common.md#principled-implementation Cursor scanning follows XML Misc and Comment production 15: comments contain no double hyphen and cannot end their body in a hyphen; processing instruction admission owns declaration placement and XML scalar legality.
 * @evidence contracts/common.md#clear-and-simple-design The same prolog/epilog reader advances whitespace and miscellaneous nodes without interpreting elements or SVG extent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A malformed comment is refused even when its delimiter is found; whitespace or an earlier node prevents a later XML declaration from being treated as initial.
 * @evidence contracts/common.md#meaningful-documentation Returns a UTF-16 text cursor after admitted Misc, with declaration allowance supplied only for document start; unterminated or malformed candidates throw typed path/family/stage refusal.
 * @evidence contracts/performance.md#efficient-algorithms Scans each miscellaneous node to its delimiter and checks its body and intervening whitespace; temporary body slices scale with node length and no DOM is constructed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Misc admission processes one current text and cursor with no cross-document cache or asynchronous shared work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only a scalar cursor escapes; body slices are call-local and no handle, retained node population or running task is acquired.
 */
export function skipXmlMisc(
  path: string,
  text: string,
  offset: number,
  allowDeclaration: boolean = false,
): number {
  let cursor: number = DesignReferenceXmlLexical.skipXmlSpace(text, offset);
  if (cursor !== offset) allowDeclaration = false;
  while (text.startsWith("<?", cursor) || text.startsWith("<!--", cursor)) {
    const comment: boolean = text.startsWith("<!--", cursor);
    const closing: string = comment ? "-->" : "?>";
    const end: number = text.indexOf(closing, cursor + 2);
    if (end < 0) throw invalidDesignReferenceContainer(path, "XML", "misc", `unterminated ${closing}`);
    const commentBody: string = comment ? text.slice(cursor + 4, end) : "";
    if (comment && (commentBody.includes("--") || commentBody.endsWith("-")))
      throw invalidDesignReferenceContainer(path, "XML", "comment", "comment body contains -- or ends in -");
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
}
