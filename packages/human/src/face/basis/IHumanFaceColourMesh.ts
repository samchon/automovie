import type { IAutoMovieMeshGeometry } from "@automovie/interface";

/**
 * The mesh payload of a face part whose vertex colours can be folded into
 * its material. No geometry discriminator is required by this colour stage;
 * the caller retains the original mesh and its mutable colour buffer.
 *
 * @author Samchon
 */
export type IHumanFaceColourMesh = Pick<IAutoMovieMeshGeometry, "mesh">;
