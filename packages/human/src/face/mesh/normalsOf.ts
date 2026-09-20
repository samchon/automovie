import { portraitNormals } from "./portraitNormals";

/**
 * A shorter name for {@link portraitNormals}, used where a patch or a tube
 * finishes a mesh and the surrounding expression is already dense.
 *
 * It computes nothing different. The alias exists because the construction
 * reads better when the interesting part is the geometry rather than the call.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Derives the shared geometric normals the anatomical surfaces are finished with.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Reuses one normal derivation across the sampled surface constructions.
 * @author Samchon
 */
export const normalsOf = portraitNormals;
