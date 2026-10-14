import { IStartTag } from "./IStartTag";
import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";
import { DesignReferenceXmlLexical } from "./DesignReferenceXmlLexical";

/**
 * Decode one start tag and apply its namespace declarations before resolving element and expanded attribute identities. Namespace scope belongs to the returned tag.
 *
 * @evidence contracts/common.md#principled-implementation XML 1.0 Start-tag production 40 requires XML whitespace before each attribute, quoted values and a closing delimiter; qualified-name and namespace checks resolve the decoded tag. The supported name profile is ASCII and narrower than XML's full Unicode Name grammar.
 * @evidence contracts/common.md#clear-and-simple-design One cursor owns attribute scanning and delegates namespace completion, supplying the same tag facts to root and nested closure readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing attribute whitespace and duplicate raw or expanded names refuse instead of being normalized; closing delimiters do not require preceding whitespace.
 * @evidence contracts/common.md#meaningful-documentation Null means no supported start-tag candidate; malformed candidate throws a path/family/stage refusal, and the returned UTF-16 cursor and namespace map belong to this parse.
 * @evidence contracts/performance.md#efficient-algorithms Cursor traversal processes attributes, but repeated remaining-text slices and regular-expression scans can copy overlapping suffixes; total allocation is not claimed linear. Value decoding and copied inherited namespace population contribute to cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Each decoded attribute is stored once and completion reuses the same map; inherited namespace bindings are copied before local declarations mutate scope.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned attribute and namespace maps scale with authored attributes and active bindings; failed-call temporaries become collectible and no descriptor, process or cache is retained.
 */
export function readStartTag(
  path: string,
  text: string,
  offset: number,
  inheritedNamespaces: ReadonlyMap<string, string>,
): IStartTag | null {
  const name: RegExpExecArray | null = /^<([A-Za-z_][\w.:-]*)/.exec(text.slice(offset));
  if (name === null) return null;
  if (!DesignReferenceXmlLexical.isXmlQualifiedName(name[1]!))
    throw invalidDesignReferenceContainer(path, "SVG", "name", `invalid qualified name ${name[1]}`);
  let cursor: number = offset + name[0].length;
  const attributes: Map<string, string> = new Map<string, string>();
  while (true) {
    const beforeSpace: number = cursor;
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
    if (cursor === beforeSpace)
      throw invalidDesignReferenceContainer(path, "SVG", "root", `attribute requires XML whitespace at character ${cursor}`);
    const attribute: RegExpExecArray | null =
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
}

/**
 * Resolve one completed tag under a detached inherited namespace scope.
 *
 *
 * Applies reserved-prefix and URI constraints, resolves the element using its default namespace and ordinary attributes without it, then refuses duplicate expanded attribute identities.
 *
 * Owns namespace completion independently of lexical attribute scanning so root and child tags share the same scope and duplicate policy.
 *
 * Empty prefixed bindings and unbound prefixes refuse; raw spelling differences cannot bypass expanded identity uniqueness.
 *
 * Returns copied namespace scope and the original decoded attribute map while preserving authored element spelling for exact closing-tag matching.
 *
 * Copies N inherited bindings and scans A attributes twice with name-length resolution and an O(A) expanded identity set; no complete document or payload is rescanned here.
 *
 * One detached namespace map is reused for every element/attribute resolution within this tag; parent scope is never modified.
 *
 * The returned tag owns its copied scope and borrows the supplied attribute map; the duplicate set is local and no resource handle or persistent cache is created.
 */
function finishStartTag(props: {
  path: string;
  name: string;
  attributes: Map<string, string>;
  end: number;
  selfClosing: boolean;
  inheritedNamespaces: ReadonlyMap<string, string>;
}): IStartTag {
  const namespaces: Map<string, string> = new Map<string, string>(props.inheritedNamespaces);
  for (const [name, namespace] of props.attributes) {
    const prefix: string | null =
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
  const element: { localName: string; namespace: string | undefined } = resolveXmlName(props.path, props.name, namespaces, true);
  const expandedAttributes: Set<string> = new Set<string>();
  for (const name of props.attributes.keys()) {
    if (name === "xmlns" || name.startsWith("xmlns:")) continue;
    const expanded: { localName: string; namespace: string | undefined } = resolveXmlName(props.path, name, namespaces, false);
    const identity: string = `${expanded.namespace ?? ""}\u0000${expanded.localName}`;
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
}

/**
 * Resolve an admitted qualified name using element or ordinary-attribute namespace rules.
 *
 *
 * Splits the already checked name at its colon and reads the supplied namespace map; default namespace applies only when the caller identifies an element, while any explicit prefix must be bound.
 *
 * A single name-resolution rule serves both completion passes without copying scope or resolving document nesting.
 *
 * The reserved xmlns prefix and unbound explicit prefixes refuse; a missing default namespace remains undefined rather than becoming the SVG URI.
 *
 * Requires an admitted qualified spelling and returns local name plus optional URI, preserving the distinction between no namespace and a named namespace.
 *
 * Colon search and substrings scale with name length, followed by one map lookup; supplied scope is borrowed without a binding scan.
 *
 * This pure per-name query coordinates no requests or retained validation result; the caller reuses its admitted scope.
 *
 * The helper opens no resource and retains no scope; its small name/URI result transfers to tag completion.
 */
function resolveXmlName(
  path: string,
  name: string,
  namespaces: ReadonlyMap<string, string>,
  defaultNamespace: boolean,
): { localName: string; namespace: string | undefined } {
  const separator: number = name.indexOf(":");
  const prefix: string = separator === -1 ? "" : name.slice(0, separator);
  const localName: string = separator === -1 ? name : name.slice(separator + 1);
  if (prefix === "xmlns")
    throw invalidDesignReferenceContainer(
      path,
      "XML",
      "namespace",
      "the xmlns prefix cannot name an element or ordinary attribute",
    );
  const namespace: string | undefined =
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
}
