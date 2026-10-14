import { IXmlRoot } from "./IXmlRoot";
import type { IStartTag } from "./IStartTag";
import { readStartTag } from "./readStartTag";
import { validateXmlClosure } from "./validateXmlClosure";
import { skipXmlMisc } from "./skipXmlMisc";
import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";
import { DesignReferenceXmlLexical } from "./DesignReferenceXmlLexical";

/**
 * Select and close an XML root using the admitted UTF-8 XML grammar. A noncandidate returns null; a candidate grammar error retains its typed family and stage.
 */
const XML_BASE_NAMESPACES: ReadonlyMap<string, string> = new Map<string, string>([["xml", DesignReferenceXmlLexical.XML_NAMESPACE]]);

/**
 * Read a complete XML root with its resolved namespace and decoded attributes.
 *
 * @evidence contracts/common.md#principled-implementation Initial Misc and leading scalar admission precede a supported start-tag parse under the reserved xml binding, then full closure is required before resolved root facts escape. The callers supply strictly decoded UTF-8 text and the lexical name profile is ASCII.
 * @evidence contracts/common.md#clear-and-simple-design Coordinates lexical prolog, tag/namespace and whole-document owners once, leaving SVG family identity and user-unit extent to the consuming inspector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts DTD/declaration candidates refuse and a root token alone never produces complete-document facts; a noncandidate returns null without guessing SVG from a substring.
 * @evidence contracts/common.md#meaningful-documentation Null distinguishes no supported root candidate from typed malformed-candidate refusal; returned resolved identity and decoded attributes come from the same closed current text.
 * @evidence contracts/performance.md#efficient-algorithms Includes all Misc, tag/namespace and closure scanning, remaining-text slices and inherited namespace copies; nesting and authored text/attribute/binding populations drive total work and no blanket linear allocation claim is made.
 * @evidence contracts/performance.md#reuse-equivalent-work One completed parse supplies the returned root identity/attributes, and the immutable base binding map is copied by each tag scope instead of mutated across documents.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The root attribute map transfers to the consumer; closure stacks and child scopes release locally, while the module retains only its fixed xml namespace basis with no handle or task.
 */
export function inspectXmlRoot(path: string, text: string): IXmlRoot | null {
  const cursor: number = skipXmlMisc(path, text, 0, true);
  const leading: number | undefined = text.codePointAt(cursor);
  if (leading !== undefined && !DesignReferenceXmlLexical.isXmlCharacter(leading))
    throw invalidDesignReferenceContainer(path, "XML", "character", "invalid leading XML character");
  if (text[cursor] !== "<") return null;
  if (text.startsWith("<!", cursor))
    throw invalidDesignReferenceContainer(
      path,
      "XML",
      "prolog",
      "declarations and external entities are not admitted",
    );
  const root: IStartTag | null = readStartTag(path, text, cursor, XML_BASE_NAMESPACES);
  if (root === null) return null;
  validateXmlClosure(path, text, root);
  return {
    localName: root.localName,
    namespace: root.namespace,
    attributes: root.attributes,
  };
}
