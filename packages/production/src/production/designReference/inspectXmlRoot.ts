import { IXmlRoot } from "./IXmlRoot";
import { readStartTag } from "./readStartTag";
import { validateXmlClosure } from "./validateXmlClosure";
import { skipXmlMisc } from "./skipXmlMisc";
import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";
import { DesignReferenceXmlLexical } from "./DesignReferenceXmlLexical";

/**
 * Select and close an XML root using the admitted UTF-8 XML grammar. A noncandidate returns null; a candidate grammar error retains its typed family and stage.
 */
const XML_BASE_NAMESPACES = new Map<string, string>([["xml", DesignReferenceXmlLexical.XML_NAMESPACE]]);

/** Read a complete XML root with its resolved namespace and decoded attributes. */
export const inspectXmlRoot = (path: string, text: string): IXmlRoot | null => {
  const cursor = skipXmlMisc(path, text, 0, true);
  const leading = text.codePointAt(cursor);
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
  const root = readStartTag(path, text, cursor, XML_BASE_NAMESPACES);
  if (root === null) return null;
  validateXmlClosure(path, text, root);
  return {
    localName: root.localName,
    namespace: root.namespace,
    attributes: root.attributes,
  };
};
