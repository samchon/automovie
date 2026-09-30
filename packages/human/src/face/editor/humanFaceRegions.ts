/**
 * Anatomical profile owners exposed by the document editor, excluding arbitrary
 * source-coordinate editing. Shared surface supplements remain in the document;
 * source geometry arrays may be retained or cleared, never replaced with new
 * guide, curve, section or displacement populations by an edit.
 */
export const humanFaceRegions = [
  "skin",
  "skinColour",
  "hair",
  "hairLayers",
  "frame",
  "eye",
  "nose",
  "mouth",
  "tongue",
  "cheek",
  "cranium",
  "ear",
  "neck",
  "dentition",
  "lowerDentition",
  "orbits",
  "relief",
  "curves",
] as const;
