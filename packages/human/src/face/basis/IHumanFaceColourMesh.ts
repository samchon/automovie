import type { IAutoMovieMeshGeometry } from "@automovie/interface";

/**
 * The mesh payload of a face part whose vertex colours can be folded into
 * its material. No geometry discriminator is required by this colour stage;
 * the caller retains the original mesh and its mutable colour buffer.
 *
 * @evidence contracts/common.md#principled-implementation Pick retains the existing geometry's exact mesh member without narrowing the historical wrapper input.
 * @evidence contracts/common.md#clear-and-simple-design One payload for the colour-fold owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometry is rebuilt or substituted by the alias.
 * @evidence contracts/common.md#meaningful-documentation States purpose, ownership and the absent discriminator requirement.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The payload identifies no new part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The payload moves no geometric channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The payload emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It transports existing mesh coordinates without conversion.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The payload creates no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The colour consumer displays the result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The payload introduces no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The colour consumer admits its range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This transport payload authors no geometry.
 * @author Samchon
 */
export type IHumanFaceColourMesh = Pick<IAutoMovieMeshGeometry, "mesh">;
