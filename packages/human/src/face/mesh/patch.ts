import { portraitPatch } from "./portraitPatch";

/**
 * A shorter name for {@link portraitPatch}, used where a construction samples
 * several surfaces in one expression.
 *
 * It samples nothing different. The alias exists so the lattice bounds stay the
 * visible part of the line.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Constructs connected sampled surfaces for ocular, oral and strand components.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Samples a shared unit-square lattice and emits one common normal field.
 * @author Samchon
 */
export const patch = portraitPatch;
