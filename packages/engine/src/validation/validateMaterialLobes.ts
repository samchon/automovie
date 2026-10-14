import type {
  IAutoMovieMaterial,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";
import { finiteNumber } from "./finiteNumber";
import { isRecord } from "./isRecord";
import { validateColor } from "./validateColor";

/**
 * Admit the optional anisotropy, sheen and specular-intensity lobes of one material: record shapes, `[0, 1]` strengths and roughness, a finite rotation and a linear sheen colour.
 *
 * Absent lobes are left alone, because omission is the renderer's neutral response. The anisotropy direction image is admitted with every other binding by `materialTextureSlots`, and a part citing an anisotropic material must be a mesh carrying UV0, because the highlight direction is measured in that tangent frame and tessellated primitives emit no texture coordinates.
 *
 * @evidence contracts/common.md#principled-implementation The domains are those of the glTF `KHR_materials_anisotropy`, `KHR_materials_sheen` and `KHR_materials_specular` factors these fields restate: strength, roughness and intensity in the closed unit interval, a finite angle and a linear colour.
 * @evidence contracts/common.md#clear-and-simple-design Lobe metadata admission lives here beside overlay admission, while binding admission stays with the shared slot enumeration; the UV requirement reads the parts because it joins a material to the meshes citing it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Values are reported, never clamped; a non-record lobe is reported once at its path instead of being dereferenced or skipped.
 * @evidence contracts/common.md#meaningful-documentation States the admitted domains, the meaning of omission, where the image binding is admitted and the UV0 requirement on citing parts.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of scalar and colour checks per material plus one scan of P parts for an anisotropic material, with diagnostics proportional to faults.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the collector's interval check and the shared colour validator rather than restating their rules.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the collector and its findings; nothing else is retained.
 */
export const validateMaterialLobes: (props: {
  material: IAutoMovieMaterial;
  path: string;
  parts: readonly IAutoMovieModelPart[];
  partsPath: string;
  collector: ViolationCollector;
}) => void = (props: {
  /** The material whose lobes are admitted. */
  material: IAutoMovieMaterial;

  /** Diagnostic path of the material. */
  path: string;

  /** The model's parts, searched for meshes that cite the material. */
  parts: readonly IAutoMovieModelPart[];

  /** Diagnostic path of the parts list. */
  partsPath: string;

  /** Collector receiving findings. */
  collector: ViolationCollector;
}): void => {
  const {
    material,
    path,
    collector,
  }: {
    material: IAutoMovieMaterial;
    path: string;
    collector: ViolationCollector;
  } = props;
  const anisotropy: unknown = material.anisotropy;
  if (anisotropy !== undefined)
    if (!isRecord(anisotropy))
      collector.push(
        "type",
        `${path}.anisotropy`,
        "anisotropy must be a record",
        anisotropy,
      );
    else {
      collector.range(
        `${path}.anisotropy.strength`,
        anisotropy.strength,
        0,
        1,
        "anisotropy strength",
      );
      finiteNumber(
        anisotropy.rotationDeg as number,
        `${path}.anisotropy.rotationDeg`,
        "anisotropy rotation",
        collector,
      );
      if (anisotropy.texture === undefined)
        collector.push(
          "type",
          `${path}.anisotropy.texture`,
          "anisotropy texture must be a binding or null",
          anisotropy.texture,
        );
      // The highlight direction lives in the UV0 tangent frame.
      if (typeof anisotropy.strength === "number" && anisotropy.strength > 0)
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
  const sheen: unknown = material.sheen;
  if (sheen !== undefined)
    if (!isRecord(sheen))
      collector.push("type", `${path}.sheen`, "sheen must be a record", sheen);
    else {
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
