import { DesignReferenceXmlLexical } from "./DesignReferenceXmlLexical";

/**
 * Read SVG user-unit bounds from the root viewBox or unitless/px dimensions. Other units and invalid numeric spellings yield no measured extent.
 *
 *
 * The union represents either two positive user-unit dimensions or no supported measurement, preventing a partial width-only or height-only result.
 *
 * One internal result shape supplies optional bounds directly to the SVG container inspector.
 *
 * Unsupported units and malformed numeric extent do not become guessed physical dimensions.
 *
 * Distinguishes supported user-unit bounds from absent measurement without implying document admission failed.
 *
 * The type executes no measurement; the extent and numeric readers own text scanning.
 *
 * The shape defines no cached document or cross-request equivalence.
 *
 * Only numeric facts are represented; no bytes, parser or native resource is owned by the type.
 */
type IDesignReferenceExtent =
  | { width: number; height: number }
  | { width?: never; height?: never };

/**
 * Derive only positive SVG user-unit bounds, never guessed physical units.
 *
 * @evidence contracts/common.md#principled-implementation A present viewBox takes precedence and must decode exactly four finite numbers with positive third/fourth fields; otherwise both unitless or lowercase px dimensions must be positive. The separator split currently tolerates repeated comma/space runs and is not a complete SVG number-list grammar validator.
 * @evidence contracts/common.md#clear-and-simple-design Root attribute facts feed one extent projection while XML well-formedness remains with document admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A present malformed viewBox does not fall back to dimensions, and physical units, missing sides or nonpositive/nonfinite values produce no bounds instead of conversions or default sizes.
 * @evidence contracts/common.md#meaningful-documentation Defines viewBox precedence, supported user-unit profiles and empty-result meaning; root origin fields are parsed but the returned values represent width and height only.
 * @evidence contracts/performance.md#efficient-algorithms Splits and decodes the complete viewBox spelling or scans two dimension strings, with text length and token population driving temporary strings/number arrays; no geometry or pixel decode is performed.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses already decoded root attributes without rereading bytes or reparsing the XML tree; no result is retained across documents.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned pair or empty object owns no resource; spelling/token temporaries release after the synchronous projection.
 */
export function svgExtent(
  attributes: ReadonlyMap<string, string>,
): IDesignReferenceExtent {
  const viewBox: string | undefined = attributes.get("viewBox");
  if (viewBox !== undefined) {
    const fields: (number | null)[] = DesignReferenceXmlLexical.trimXmlSpace(viewBox)
      .split(/[ \t\r\n,]+/)
      .map(svgNumber);
    if (
      fields.length === 4 &&
      fields.every((field: number | null): boolean => field !== null) &&
      fields[2]! > 0 &&
      fields[3]! > 0
    )
      return { width: fields[2]!, height: fields[3]! };
    return {};
  }
  const width: number | null = svgLength(attributes.get("width"));
  const height: number | null = svgLength(attributes.get("height"));
  if (width !== null && height !== null) return { width, height };
  return {};
}

/**
 * Admit one positive unitless or lowercase-px length spelling.
 *
 *
 * Trims only XML whitespace, removes an exact trailing px suffix and delegates finite number spelling before testing strict positivity.
 *
 * One dimension rule serves width and height without estimating physical-unit conversion.
 *
 * Undefined, nonpositive and unsupported-unit spellings remain null and are not coerced to a default dimension.
 *
 * Null denotes unsupported user-unit measurement, while a returned number is finite and strictly positive.
 *
 * Trimming, suffix replacement and numeric admission scan the supplied spelling and create local strings proportional to its length.
 *
 * A pure spelling check coordinates no cross-document work or cached result.
 *
 * Only a numeric optional fact escapes and no handle, parser population or task is acquired.
 */
function svgLength(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const value: number | null = svgNumber(DesignReferenceXmlLexical.trimXmlSpace(raw).replace(/px$/, ""));
  return value !== null && value > 0 ? value : null;
}

/**
 * Decode a finite signed decimal or exponent spelling under the supported SVG profile.
 *
 *
 * Exact regular-expression spelling admission precedes Number conversion and finite-value checking; the profile accepts decimal integers/fractions and decimal exponents, with no hexadecimal or Infinity spelling.
 *
 * Shares one numeric profile between viewBox fields and optional dimension readers.
 *
 * Number conversion alone never admits spelling, and exponent overflow returns null rather than a finite clamp.
 *
 * Null means unsupported syntax or nonfinite result; positivity belongs to the extent/dimension consumers, allowing signed viewBox origins.
 *
 * One syntax test and conversion scale with spelling length and retain only a scalar result, without a token inventory or XML rescan.
 *
 * This pure per-field conversion coordinates no work across callers or documents.
 *
 * No resource is acquired or retained and only an optional number transfers to the caller.
 */
function svgNumber(spelling: string): number | null {
  if (!/^[+-]?(?:\d+|\d*\.\d+)(?:[eE][+-]?\d+)?$/.test(spelling)) return null;
  const value: number = Number(spelling);
  return Number.isFinite(value) ? value : null;
}
