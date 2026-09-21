/**
 * Anatomical profile owners exposed by the document editor, excluding arbitrary
 * source-coordinate editing. Shared surface supplements remain in the document.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Names the numerical editor's replaceable anatomical regions.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Keeps region selection on actual profile owners.
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
