import { IStartTag } from "./IStartTag";
import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";
import { DesignReferenceXmlLexical } from "./DesignReferenceXmlLexical";

/**
 * Decode one start tag and apply its namespace declarations before resolving element and expanded attribute identities. Namespace scope belongs to the returned tag.
 */
export const readStartTag = (
  path: string,
  text: string,
  offset: number,
  inheritedNamespaces: ReadonlyMap<string, string>,
): IStartTag | null => {
  const name = /^<([A-Za-z_][\w.:-]*)/.exec(text.slice(offset));
  if (name === null) return null;
  if (!DesignReferenceXmlLexical.isXmlQualifiedName(name[1]!))
    throw invalidDesignReferenceContainer(path, "SVG", "name", `invalid qualified name ${name[1]}`);
  let cursor = offset + name[0].length;
  const attributes = new Map<string, string>();
  while (true) {
    cursor = DesignReferenceXmlLexical.skipXmlSpace(text, cursor);
    if (text.startsWith("/>", cursor))
      return finishStartTag({
        path,
        name: name[1]!,
        attributes,
        end: cursor + 2,
        selfClosing: true,
        inheritedNamespaces,
      });
    if (text[cursor] === ">")
      return finishStartTag({
        path,
        name: name[1]!,
        attributes,
        end: cursor + 1,
        selfClosing: false,
        inheritedNamespaces,
      });
    const attribute =
      /^([A-Za-z_][\w.:-]*)[ \t\r\n]*=[ \t\r\n]*(["'])([\s\S]*?)\2/.exec(
        text.slice(cursor),
      );
    if (attribute === null)
      throw invalidDesignReferenceContainer(
        path,
        "SVG",
        "root",
        `malformed root attribute at character ${cursor}`,
      );
    if (!DesignReferenceXmlLexical.isXmlQualifiedName(attribute[1]!))
      throw invalidDesignReferenceContainer(
        path,
        "SVG",
        "name",
        `invalid qualified name ${attribute[1]}`,
      );
    if (attributes.has(attribute[1]!))
      throw invalidDesignReferenceContainer(
        path,
        "SVG",
        "root",
        `duplicate root attribute ${attribute[1]}`,
      );
    attributes.set(attribute[1]!, DesignReferenceXmlLexical.decodeXmlAttribute(path, attribute[3]!));
    cursor += attribute[0].length;
  }
};

const finishStartTag = (props: {
  path: string;
  name: string;
  attributes: Map<string, string>;
  end: number;
  selfClosing: boolean;
  inheritedNamespaces: ReadonlyMap<string, string>;
}): IStartTag => {
  const namespaces = new Map(props.inheritedNamespaces);
  for (const [name, namespace] of props.attributes) {
    const prefix =
      name === "xmlns"
        ? ""
        : name.startsWith("xmlns:")
          ? name.slice("xmlns:".length)
          : null;
    if (prefix === null) continue;
    if (
      prefix === "xmlns" ||
      namespace === DesignReferenceXmlLexical.XMLNS_NAMESPACE ||
      (prefix === "xml" && namespace !== DesignReferenceXmlLexical.XML_NAMESPACE) ||
      (prefix !== "xml" && namespace === DesignReferenceXmlLexical.XML_NAMESPACE) ||
      (prefix !== "" && namespace === "")
    )
      throw invalidDesignReferenceContainer(
        props.path,
        "XML",
        "namespace",
        `invalid namespace binding ${name}`,
      );
    if (namespace === "") namespaces.delete(prefix);
    else namespaces.set(prefix, namespace);
  }
  const element = resolveXmlName(props.path, props.name, namespaces, true);
  const expandedAttributes = new Set<string>();
  for (const name of props.attributes.keys()) {
    if (name === "xmlns" || name.startsWith("xmlns:")) continue;
    const expanded = resolveXmlName(props.path, name, namespaces, false);
    const identity = `${expanded.namespace ?? ""}\u0000${expanded.localName}`;
    if (expandedAttributes.has(identity))
      throw invalidDesignReferenceContainer(
        props.path,
        "XML",
        "namespace",
        `duplicate expanded attribute name ${name}`,
      );
    expandedAttributes.add(identity);
  }
  return {
    name: props.name,
    localName: element.localName,
    namespace: element.namespace,
    namespaces,
    attributes: props.attributes,
    end: props.end,
    selfClosing: props.selfClosing,
  };
};

const resolveXmlName = (
  path: string,
  name: string,
  namespaces: ReadonlyMap<string, string>,
  defaultNamespace: boolean,
): { localName: string; namespace: string | undefined } => {
  const separator = name.indexOf(":");
  const prefix = separator === -1 ? "" : name.slice(0, separator);
  const localName = separator === -1 ? name : name.slice(separator + 1);
  if (prefix === "xmlns")
    throw invalidDesignReferenceContainer(
      path,
      "XML",
      "namespace",
      "the xmlns prefix cannot name an element or ordinary attribute",
    );
  const namespace =
    prefix === ""
      ? defaultNamespace
        ? namespaces.get("")
        : undefined
      : namespaces.get(prefix);
  if (prefix !== "" && namespace === undefined)
    throw invalidDesignReferenceContainer(
      path,
      "XML",
      "namespace",
      `unbound namespace prefix ${prefix}`,
    );
  return { localName, namespace };
};
