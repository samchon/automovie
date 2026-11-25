import type {
  IAutoMovieMaterial,
  IAutoMovieModelPart,
  IAutoMovieValidateMaterialLobes,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { validateColor } from "./validateColor";

/**
 * Admit the optional anisotropy, sheen and specular-intensity lobes of one
 * material: record shapes, `[0, 1]` strengths and roughness, a finite rotation
 * and a linear sheen colour.
 *
 * Absent lobes are left alone, because omission is the renderer's neutral
 * response. The anisotropy direction image is admitted with every other binding
 * by `materialTextureSlots`, and a part citing an anisotropic material must be
 * a mesh carrying UV0, because the highlight direction is measured in that
 * tangent frame and tessellated primitives emit no texture coordinates.
 */
export const validateMaterialLobes: (
  props: IAutoMovieValidateMaterialLobes.IProps,
) => void = (props: IAutoMovieValidateMaterialLobes.IProps): void => {
  const {
    material,
    path,
    collector,
  }: {
    material: IAutoMovieMaterial;
    path: string;
    collector: IAutoMovieViolationCollector;
  } = props;
  const anisotropy: IAutoMovieMaterial["anisotropy"] = material.anisotropy;
  if (anisotropy !== undefined) {
    collector.range(
      `${path}.anisotropy.strength`,
      anisotropy.strength,
      0,
      1,
      "anisotropy strength",
    );
    // The highlight direction lives in the UV0 tangent frame.
    if (anisotropy.strength > 0)
      props.parts.forEach((part: IAutoMovieModelPart, index: number): void => {
        if (
          part.material === material.id &&
          (part.geometry.type !== "mesh" || part.geometry.mesh.uvs === null)
        )
          collector.push(
            "type",
            part.geometry.type === "mesh"
              ? `${props.partsPath}[${index}].geometry.mesh.uvs`
              : `${props.partsPath}[${index}].geometry`,
            `material "${material.id}" is anisotropic, so a part citing it needs a mesh with UV0 for its tangent frame`,
            part.geometry.type === "mesh" ? null : part.geometry.type,
          );
      });
  }
  const sheen: IAutoMovieMaterial["sheen"] = material.sheen;
  if (sheen !== undefined) {
    validateColor(sheen.color, `${path}.sheen.color`, collector);
    collector.range(
      `${path}.sheen.roughness`,
      sheen.roughness,
      0,
      1,
      "sheen roughness",
    );
  }
  if (material.specularIntensity !== undefined)
    collector.range(
      `${path}.specularIntensity`,
      material.specularIntensity,
      0,
      1,
      "specular intensity",
    );
};
