import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";

/**
 * The shared XML lexical rules for character legality, qualified names, references, whitespace and processing instructions. Tag and closure readers use one grammar.
 */
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";

const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";

const validateXmlCharacterData = (path: string, value: string): void => {
  if (value.includes("]]>"))
    throw invalidDesignReferenceContainer(path, "SVG", "text", "invalid XML character data");
  decodeXmlText(path, value, "text");
};

const validateXmlCharacters = (path: string, value: string): void => {
  for (const character of value)
    if (!isXmlCharacter(character.codePointAt(0)!))
      throw invalidDesignReferenceContainer(path, "XML", "character", "invalid XML character");
};

const isXmlCharacter = (scalar: number): boolean =>
  scalar === 0x09 ||
  scalar === 0x0a ||
  scalar === 0x0d ||
  (scalar >= 0x20 && scalar <= 0xd7ff) ||
  (scalar >= 0xe000 && scalar <= 0xfffd) ||
  (scalar >= 0x10000 && scalar <= 0x10ffff);

const isXmlQualifiedName = (value: string): boolean =>
  value.split(":").length <= 2 &&
  value.split(":").every((part) => /^[A-Za-z_][\w.-]*$/.test(part));

const validateXmlInstruction = (
  path: string,
  body: string,
  allowDeclaration: boolean,
): void => {
  validateXmlCharacters(path, body);
  const target = /^([A-Za-z_][\w.:-]*)(?:[ \t\r\n]|$)/.exec(body)?.[1];
  // XML 1.0 XMLDecl: the pseudo-attribute names, the version and the
  // standalone values are case-sensitive; only the encoding name is not.
  const declaration =
    /^xml[ \t\r\n]+version[ \t\r\n]*=[ \t\r\n]*(["'])1\.0\1(?:[ \t\r\n]+encoding[ \t\r\n]*=[ \t\r\n]*(["'])[Uu][Tt][Ff]-8\2)?(?:[ \t\r\n]+standalone[ \t\r\n]*=[ \t\r\n]*(["'])(?:yes|no)\3)?[ \t\r\n]*$/.test(
      body,
    );
  if (
    target === undefined ||
    (target.toLowerCase() === "xml" &&
      (target !== "xml" || !allowDeclaration || !declaration))
  )
    throw invalidDesignReferenceContainer(path, "XML", "instruction", "invalid processing instruction");
};

const decodeXmlAttribute = (path: string, value: string): string =>
  decodeXmlText(path, value, "attribute");

const decodeXmlText = (
  path: string,
  value: string,
  role: "attribute" | "text",
): string => {
  validateXmlCharacters(path, value);
  const entity = /&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g;
  if (/[<&]/.test(value.replace(entity, "")))
    throw invalidDesignReferenceContainer(path, "SVG", role, `unescaped markup in ${role}`);
  return value.replace(entity, (reference) => {
    const decoded: Record<string, string> = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&apos;": "'",
    };
    const named = decoded[reference];
    if (named !== undefined) return named;
    const scalar = Number.parseInt(
      reference.slice(reference.startsWith("&#x") ? 3 : 2, -1),
      reference.startsWith("&#x") ? 16 : 10,
    );
    if (!Number.isInteger(scalar) || !isXmlCharacter(scalar))
      throw invalidDesignReferenceContainer(
        path,
        "SVG",
        "entity",
        `invalid character reference ${reference}`,
      );
    return String.fromCodePoint(scalar);
  });
};

const skipXmlSpace = (text: string, offset: number): number => {
  while (
    text[offset] === " " ||
    text[offset] === "\t" ||
    text[offset] === "\r" ||
    text[offset] === "\n"
  )
    offset += 1;
  return offset;
};

const trimXmlSpace = (value: string): string =>
  value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "");

/** The lexical operations shared by tag and document readers. */
export const DesignReferenceXmlLexical = {
  XML_NAMESPACE,
  XMLNS_NAMESPACE,
  decodeXmlAttribute,
  isXmlCharacter,
  isXmlQualifiedName,
  skipXmlSpace,
  trimXmlSpace,
  validateXmlCharacterData,
  validateXmlCharacters,
  validateXmlInstruction,
};
