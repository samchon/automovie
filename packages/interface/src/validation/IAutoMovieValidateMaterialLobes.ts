import type { IAutoMovieMaterial } from "../material/IAutoMovieMaterial";
import type { IAutoMovieModelPart } from "../model/IAutoMovieModelPart";
import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/**
 * Data and callback contracts shared by the ValidateMaterialLobes operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Admit the optional anisotropy, sheen and specular-intensity lobes of one material: record shapes, `[0, 1]` strengths and roughness, a finite rotation and a linear sheen colour. Member documentation states the supplied records, units and absence meanings used by validateMaterialLobes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent lobes remain neutral rather than fabricated records; the existing material/part shapes carry the supported UV0 tangent-frame requirement.
 * @evidence contracts/development/design.md#principled-representation material supplies optional anisotropy, sheen and specular lobes while parts resolves UV-bearing meshes; path and partsPath locate diagnostics in the caller-owned collector.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateMaterialLobes, used by validateMaterialLobes. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateMaterialLobes {
  /**
   * Admit the optional anisotropy, sheen and specular-intensity lobes of one material: record shapes, `[0, 1]` strengths and roughness, a finite rotation and a linear sheen colour.
   *
   * Absent lobes are left alone, because omission is the renderer's neutral response. The anisotropy direction image is admitted with every other binding by `materialTextureSlots`, and a part citing an anisotropic material must be a mesh carrying UV0, because the highlight direction is measured in that tangent frame and tessellated primitives emit no texture coordinates.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Admit the optional anisotropy, sheen and specular-intensity lobes of one material: record shapes, `[0, 1]` strengths and roughness, a finite rotation and a linear sheen colour. Member documentation states the supplied records, units and absence meanings used by validateMaterialLobes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent lobes remain neutral rather than fabricated records; the existing material/part shapes carry the supported UV0 tangent-frame requirement.
   * @evidence contracts/development/design.md#principled-representation material supplies optional anisotropy, sheen and specular lobes while parts resolves UV-bearing meshes; path and partsPath locate diagnostics in the caller-owned collector.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateMaterialLobes.IProps, used by validateMaterialLobes. Its material, path, parts, partsPath, collector members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** The material whose lobes are admitted. */
    material: IAutoMovieMaterial;

    /** Diagnostic path of the material. */
    path: string;

    /** The model's parts, searched for meshes that cite the material. */
    parts: readonly IAutoMovieModelPart[];

    /** Diagnostic path of the parts list. */
    partsPath: string;

    /** Collector receiving findings. */
    collector: IAutoMovieViolationCollector;
  };
}
