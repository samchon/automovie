import { DesignReferenceXmlLexical } from "./DesignReferenceXmlLexical";

/**
 * Read SVG user-unit bounds from the root viewBox or unitless/px dimensions. Other units and invalid numeric spellings yield no measured extent.
 */
type IDesignReferenceExtent =
  | { width: number; height: number }
  | { width?: never; height?: never };

/** Derive only positive SVG user-unit bounds, never guessed physical units. */
export const svgExtent = (
  attributes: ReadonlyMap<string, string>,
): IDesignReferenceExtent => {
  const viewBox = attributes.get("viewBox");
  if (viewBox !== undefined) {
    const fields = DesignReferenceXmlLexical.trimXmlSpace(viewBox)
      .split(/[ \t\r\n,]+/)
      .map(svgNumber);
    if (
      fields.length === 4 &&
      fields.every((field) => field !== null) &&
      fields[2]! > 0 &&
      fields[3]! > 0
    )
      return { width: fields[2]!, height: fields[3]! };
    return {};
  }
  const width = svgLength(attributes.get("width"));
  const height = svgLength(attributes.get("height"));
  if (width !== null && height !== null) return { width, height };
  return {};
};

const svgLength = (raw: string | undefined): number | null => {
  if (raw === undefined) return null;
  const value = svgNumber(DesignReferenceXmlLexical.trimXmlSpace(raw).replace(/px$/, ""));
  return value !== null && value > 0 ? value : null;
};

const svgNumber = (spelling: string): number | null => {
  if (!/^[+-]?(?:\d+|\d*\.\d+)(?:[eE][+-]?\d+)?$/.test(spelling)) return null;
  const value = Number(spelling);
  return Number.isFinite(value) ? value : null;
};
