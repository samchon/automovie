/**
 * How many rings the lingual surface is sampled along, root to tip.
 *
 * The count is a tessellation choice, not a measurement: it decides how finely
 * the sampled surface follows the authored profile and nothing about the shape
 * that profile describes.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Constructs independent lingual volume rather than colouring the cavity back wall.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Produces closed indexed rings, shared poles and geometric normals from named lingual dimensions.
 * @author Samchon
 */
export const rows = 32;
