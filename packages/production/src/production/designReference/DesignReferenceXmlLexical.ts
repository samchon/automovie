import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";

/**
 * The shared XML lexical rules for character legality, qualified names, references, whitespace and processing instructions. Tag and closure readers use one grammar.
 */
const XML_NAMESPACE: string = "http://www.w3.org/XML/1998/namespace";

const XMLNS_NAMESPACE: string = "http://www.w3.org/2000/xmlns/";

/**
 * Admit ordinary XML character data without CDATA terminators or unescaped markup.
 *
 *
 * XML character data cannot contain the literal CDATA terminator; the common text decoder then checks legal scalars and only supported complete entity references.
 *
 * This ordinary-text boundary delegates scalar/entity rules instead of duplicating the attribute decoder.
 *
 * A literal terminator or malformed markup refuses rather than being removed to make closure appear valid.
 *
 * Throws a path-attributed text or lexical refusal and returns no decoded document; CDATA bodies use a different admission path.
 *
 * Searches the input then runs the full decoder, including intermediate strings and entity substitutions proportional to text and entity populations.
 *
 * One current span is admitted with no cached or cross-document work.
 *
 * No resource is acquired; the decoded temporary is discarded and no text span is retained.
 */
function validateXmlCharacterData(path: string, value: string): void {
  if (value.includes("]]>"))
    throw invalidDesignReferenceContainer(path, "SVG", "text", "invalid XML character data");
  decodeXmlText(path, value, "text");
}

/**
 * Require every decoded scalar to satisfy XML 1.0 character ranges.
 *
 *
 * JavaScript code-point iteration feeds the XML scalar predicate, rejecting illegal controls, surrogate scalars and out-of-range values before text is trusted.
 *
 * Comments, instructions, CDATA and entity decoding share the same scalar admission without an XML DOM.
 *
 * Delimiter closure never bypasses illegal characters and no replacement scalar repairs invalid input.
 *
 * Throws the XML character stage at the supplied diagnostic path; empty text is valid and no normalized text is returned.
 *
 * Visits up to C code points once with constant-size range checks and early refusal; it allocates no complete character inventory.
 *
 * Each span's current scalars are checked independently with no retained admission cache.
 *
 * Iterator temporaries are local and no payload, descriptor or task escapes.
 */
function validateXmlCharacters(path: string, value: string): void {
  for (const character of value)
    if (!isXmlCharacter(character.codePointAt(0)!))
      throw invalidDesignReferenceContainer(path, "XML", "character", "invalid XML character");
}

/**
 * Test the XML 1.0 allowed code-point ranges supplied by character iteration or numeric entity parsing.
 *
 *
 * Explicit XML Char ranges include tab, LF, CR and allowed BMP/supplementary intervals while excluding surrogate and forbidden control ranges; callers provide integer scalars.
 *
 * One scalar predicate serves literal and numeric-reference admission.
 *
 * No invalid scalar is clamped or replaced; integer admission belongs to the numeric-reference caller.
 *
 * States the integer-scalar premise and boolean legality result rather than certifying an entire text.
 *
 * A fixed number of comparisons takes constant work and no population storage.
 *
 * This pure scalar predicate coordinates no work or cache across callers.
 *
 * It acquires no resource and returns only a boolean.
 */
function isXmlCharacter(scalar: number): boolean {
  return scalar === 0x09 ||
  scalar === 0x0a ||
  scalar === 0x0d ||
  (scalar >= 0x20 && scalar <= 0xd7ff) ||
  (scalar >= 0xe000 && scalar <= 0xfffd) ||
  (scalar >= 0x10000 && scalar <= 0x10ffff);
}

/**
 * Admit the supported ASCII qualified-name profile with at most one colon.
 *
 *
 * At most two nonempty ASCII Name-like components form an unprefixed name or prefix/local pair; this deliberately narrower profile does not admit all Unicode XML Name characters.
 *
 * Element, attribute and closing-tag readers share this spelling predicate before namespace or exact-name matching.
 *
 * Empty components and multiple colons refuse instead of being simplified into a plausible local name.
 *
 * Documents the ASCII subset and spelling-only result; namespace binding is a separate owner check.
 *
 * The two existing split operations and component regex scans cost O(L) text and storage for name length L; no unmeasured optimization is claimed.
 *
 * One name is checked per invocation without cross-tag or cross-document caching.
 *
 * Split arrays are temporary and no scope or native resource is retained.
 */
function isXmlQualifiedName(value: string): boolean {
  return value.split(":").length <= 2 &&
    value.split(":").every((part: string): boolean => /^[A-Za-z_][\w.-]*$/.test(part));
}

/**
 * Admit a processing instruction or the supported initial UTF-8 XML 1.0 declaration.
 *
 *
 * Scalar legality precedes target syntax; reserved xml targets require exact lowercase spelling, initial-position allowance and the supported ordered version/encoding/standalone declaration grammar.
 *
 * Misc and interior closure readers supply declaration allowance while this owner checks the common instruction body.
 *
 * A differently cased reserved target or later declaration refuses, and unsupported declaration syntax is not silently reinterpreted as an ordinary instruction.
 *
 * Requires a body already separated from its delimiters and permits only XML 1.0 with optional UTF-8 encoding and yes/no standalone fields.
 *
 * Scalar traversal and the target/declaration regular expressions inspect the instruction spelling; cost and temporary captures scale with body length, without document reparse.
 *
 * This body admission has no retained instruction result or cross-document coordination.
 *
 * Only successful return or typed refusal escapes; captures are temporary and no native resource is opened.
 */
function validateXmlInstruction(
  path: string,
  body: string,
  allowDeclaration: boolean,
): void {
  validateXmlCharacters(path, body);
  const target: string | undefined = /^([A-Za-z_][\w.:-]*)(?:[ \t\r\n]|$)/.exec(body)?.[1];
  // XML 1.0 XMLDecl: the pseudo-attribute names, the version and the
  // standalone values are case-sensitive; only the encoding name is not.
  const declaration: boolean =
    /^xml[ \t\r\n]+version[ \t\r\n]*=[ \t\r\n]*(["'])1\.0\1(?:[ \t\r\n]+encoding[ \t\r\n]*=[ \t\r\n]*(["'])[Uu][Tt][Ff]-8\2)?(?:[ \t\r\n]+standalone[ \t\r\n]*=[ \t\r\n]*(["'])(?:yes|no)\3)?[ \t\r\n]*$/.test(
      body,
    );
  if (
    target === undefined ||
    (target.toLowerCase() === "xml" &&
      (target !== "xml" || !allowDeclaration || !declaration))
  )
    throw invalidDesignReferenceContainer(path, "XML", "instruction", "invalid processing instruction");
}

/**
 * Decode the supported references of one already delimited XML attribute value.
 *
 *
 * Delegates scalar, escaped-markup and predefined/numeric-reference admission to the common decoder under the attribute diagnostic role; this does not perform full XML attribute whitespace normalization.
 *
 * The wrapper selects error attribution while one decoder owns the shared literal/reference grammar.
 *
 * Raw markup and invalid references refuse instead of being stripped; unsupported general entities are not expanded or fetched.
 *
 * Returns decoded current value text after lexical admission, with quote delimiting and namespace meaning owned by the tag reader.
 *
 * Adds one direct call to the full scalar/regex/replacement cost over value length and reference population.
 *
 * It coordinates no requests; the tag reader stores the one decoded result for its current attribute.
 *
 * The returned string transfers to tag storage and no handle, external fetch or parse cache is retained.
 */
function decodeXmlAttribute(path: string, value: string): string {
  return decodeXmlText(path, value, "attribute");
}

/**
 * Validate current XML text and replace only the five predefined or legal numeric references.
 *
 *
 * Literal scalar admission precedes exact complete reference matching, residual markup refusal and replacement; numeric decimal/hex values must be integer legal XML scalars before fromCodePoint.
 *
 * One decoder serves character-data validation and returned attribute values, with the caller's role retaining diagnostic ownership.
 *
 * Malformed or unknown entities never become empty text; no DTD, external entity, network lookup or replacement character is introduced.
 *
 * Documents the narrow reference profile, decoded-string transfer and typed role/entity refusals; delimiter handling and full attribute normalization remain outside this helper.
 *
 * Scalar checking, residual-markup replacement/search and final substitution scan the value; output/intermediate strings grow with input length, and each reference callback creates the existing fixed five-entry lookup plus numeric parsing when needed.
 *
 * Literal and reference paths share one legal-scalar predicate; the local regex is reused for both replacements within the call and no decoded text is cached across inputs.
 *
 * Only the decoded string transfers; intermediate strings and fixed per-reference lookups are local and no external resource or task is retained.
 */
function decodeXmlText(
  path: string,
  value: string,
  role: "attribute" | "text",
): string {
  validateXmlCharacters(path, value);
  const entity: RegExp = /&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g;
  if (/[<&]/.test(value.replace(entity, "")))
    throw invalidDesignReferenceContainer(path, "SVG", role, `unescaped markup in ${role}`);
  return value.replace(entity, (reference: string): string => {
    const decoded: Record<string, string> = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&apos;": "'",
    };
    const named: string | undefined = decoded[reference];
    if (named !== undefined) return named;
    const scalar: number = Number.parseInt(
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
}

/**
 * Advance a UTF-16 cursor over XML's four whitespace characters.
 *
 *
 * The exact space, tab, CR and LF comparisons implement XML S without treating unrelated JavaScript whitespace as XML grammar.
 *
 * Tag and Misc readers share the same cursor-based whitespace boundary.
 *
 * No broad whitespace regex admits extra Unicode separators, and the returned cursor is never a content-admission verdict.
 *
 * Returns the first non-XML-space position from the supplied in-text cursor, including end-of-text.
 *
 * Visits W consecutive whitespace code units with O(1) additional storage and does not slice the remaining document.
 *
 * Current cursor advancement has no cached or cross-document work.
 *
 * Only a scalar cursor escapes and no resource or text buffer is retained.
 */
function skipXmlSpace(text: string, offset: number): number {
  while (
    text[offset] === " " ||
    text[offset] === "\t" ||
    text[offset] === "\r" ||
    text[offset] === "\n"
  )
    offset += 1;
  return offset;
}

/**
 * Remove only XML whitespace from the ends of a numeric spelling.
 *
 *
 * Anchored character classes strip XML S at each edge while leaving interior text and non-XML Unicode whitespace unchanged for numeric admission.
 *
 * SVG extent readers use this spelling projection rather than JavaScript's broader trim policy.
 *
 * Interior separators and unsupported characters are not repaired into valid number spellings.
 *
 * Returns a new logical spelling with XML-only edge trimming, without proving it is numeric or positive.
 *
 * Anchored regex search and replacement cost depend on spelling length and may create one returned string; no token population is retained.
 *
 * This pure spelling projection coordinates no work across consumers or documents.
 *
 * Only the string result transfers and no native resource or cache is acquired.
 */
function trimXmlSpace(value: string): string {
  return value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "");
}

/** The lexical operations shared by tag and document readers. */
export const DesignReferenceXmlLexical: {
  XML_NAMESPACE: string;
  XMLNS_NAMESPACE: string;
  decodeXmlAttribute: typeof decodeXmlAttribute;
  isXmlCharacter: typeof isXmlCharacter;
  isXmlQualifiedName: typeof isXmlQualifiedName;
  skipXmlSpace: typeof skipXmlSpace;
  trimXmlSpace: typeof trimXmlSpace;
  validateXmlCharacterData: typeof validateXmlCharacterData;
  validateXmlCharacters: typeof validateXmlCharacters;
  validateXmlInstruction: typeof validateXmlInstruction;
} = {
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
