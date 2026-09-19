/**
 * How much of the tongue's forward shaping reaches a given station.
 *
 * The smoothstep is inverted so the weight is one at the root and falls to zero
 * by the tip, with zero slope at both ends. That last part is why it is a cubic
 * rather than a straight line: a linear falloff leaves a crease where the
 * shaping stops, and the surface is sampled finely enough to show it.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Constructs independent lingual volume rather than colouring the cavity back wall.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Produces closed indexed rings, shared poles and geometric normals from named lingual dimensions.
 * @author Samchon
 */
export const frontWeight = (v: number): number => 1 - v * v * (3 - 2 * v);
