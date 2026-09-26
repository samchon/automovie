/**
 * Assemble the model validation result in stable diagnostic order. IDs and
 * references precede parts, rigs, body/profile/affordance metadata and materials.
 * Cohesive leaf owners check their typed inputs and append to this one local
 * collector. Caller models are read-only; validation reports faults rather than
 * repairing geometry or binding external resources. Human face construction,
 * authoring builders and static export all consume this same public entry.
 * Moving a leaf must preserve predicate arithmetic, paths and ordering because
 * downstream correction rounds present these diagnostics to the author.
 */
import type {
  IAutoMovieModel,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";
import { collectNonEmptyId } from "./collectNonEmptyId";
import { finiteMinimum } from "./finiteMinimum";
import { finiteNumber } from "./finiteNumber";
import { validateAffordance } from "./validateAffordance";
import { validateBody } from "./validateBody";
import { validateColor } from "./validateColor";
import { validateExtents } from "./validateExtents";
import { validateJointConstraint } from "./validateJointConstraint";
import { validateMesh } from "./validateMesh";
import { validateProfileCapabilities } from "./validateProfileCapabilities";
import { validateSkeletonGraph } from "./validateSkeletonGraph";
import { validateTextureBinding } from "./validateTextureBinding";
import { validateTransformScalars } from "./validateTransformScalars";
import { validateUniqueValues } from "./validateUniqueValues";

/**
 * Validate an {@link IAutoMovieModel}: Tier-1 structural/range checks over its
 * geometry and material wiring, the constraints the rough types don't encode.
 *
 * Checks: at least one part; primitive extents are strictly positive; material
 * references and attached-bone references resolve; skeleton graphs have one
 * connected root; material coefficients (`metallic`/`roughness`/`opacity`) and
 * color components sit in `[0, 1]`.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Rejects non-finite, degenerate, and structurally invalid model geometry.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Reports exact paths for numeric and structural model violations.
 * @evidence requirements/external-inputs/validation-and-quarantine.md#external-validation-structure-semantics `validateModel` checks resolved references, finite transforms and mesh values, ranges, topology, skeleton hierarchy, material wiring, and supported profile semantics after parsing.
 * @evidence specifications/interchange-and-adoption/validation-and-quarantine.md#interchange-layered-validation The model gate implements the Engine's structural and intended-consumer validation layers without claiming container integrity, quarantine state, or adoption authority.
 * @evidence requirements/asset-authoring/materials-and-textures.md#asset-material-image-independence `validateModel` keeps material properties separate from optional image-resource bindings and validates each binding independently.
 * @evidence requirements/asset-authoring/materials-and-textures.md#asset-material-composition `validateModel` validates the declared base color, emissive response, PBR coefficients, opacity, transmission, and texture-channel composition of each material.
 * @evidence requirements/asset-authoring/materials-and-textures.md#asset-texture-coordinates-scale `validateModel` checks the supported UV set, texture transform components, and slot-specific sampling interpretation rather than accepting arbitrary coordinate state.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-material-texture-relations The model gate enforces the Engine's bounded material-channel, image-binding, UV, transform, and color-space relation subset.
 * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-joint-control-invariants The model gate validates unique joint identities, parent resolution, acyclic hierarchy, finite rest transforms, and declared joint constraints without claiming a separate control graph.
 * @author Samchon
 */
export const validateModel = (props: {
  model: IAutoMovieModel;
}): IAutoMovieValidation => {
  const path = "$input";
  const collector = new ViolationCollector();
  const { model } = props;

  collectNonEmptyId(model.id, `${path}.id`, "model id", collector);
  if (model.asset !== null)
    collectNonEmptyId(
      model.asset,
      `${path}.asset`,
      "model asset id",
      collector,
    );
  if (model.skeleton !== null) {
    collectNonEmptyId(
      model.skeleton.id,
      `${path}.skeleton.id`,
      "skeleton id",
      collector,
    );
    model.skeleton.bones.forEach((bone, i) => {
      collectNonEmptyId(
        bone.bone,
        `${path}.skeleton.bones[${i}].bone`,
        "skeleton bone",
        collector,
      );
      if (bone.parent !== null)
        collectNonEmptyId(
          bone.parent,
          `${path}.skeleton.bones[${i}].parent`,
          "skeleton bone parent",
          collector,
        );
    });
  }

  const materialIds = new Set(model.materials.map((m) => m.id));
  const boneNames = new Set((model.skeleton?.bones ?? []).map((b) => b.bone));

  validateUniqueValues(
    model.materials.map((m, i) => [m.id, `${path}.materials[${i}].id`]),
    "material id",
    collector,
  );
  validateUniqueValues(
    model.parts.map((p, i) => [p.id, `${path}.parts[${i}].id`]),
    "part id",
    collector,
  );
  validateUniqueValues(
    (model.skeleton?.bones ?? []).map((b, i) => [
      b.bone,
      `${path}.skeleton.bones[${i}].bone`,
    ]),
    "skeleton bone",
    collector,
  );
  if (model.skeleton !== null)
    validateSkeletonGraph(model.skeleton, `${path}.skeleton`, collector);

  if (model.parts.length === 0)
    collector.push(
      "type",
      `${path}.parts`,
      "a model needs at least one part",
      model.parts,
    );

  model.parts.forEach((part, i) => {
    const pp = `${path}.parts[${i}]`;
    collectNonEmptyId(part.id, `${pp}.id`, "model part id", collector);
    if (part.material !== null)
      collectNonEmptyId(
        part.material,
        `${pp}.material`,
        "model part material id",
        collector,
      );
    if (part.material !== null && !materialIds.has(part.material))
      collector.push(
        "type",
        `${pp}.material`,
        `material id "${part.material}" does not resolve to any of the model's materials`,
        part.material,
      );
    if (part.attachedBone !== null && !boneNames.has(part.attachedBone))
      collector.push(
        "type",
        `${pp}.attachedBone`,
        `attachedBone "${part.attachedBone}" is not a bone of this model's skeleton`,
        part.attachedBone,
      );
    switch (part.geometry.type) {
      case "primitive":
        validateExtents(part.geometry.shape, `${pp}.geometry.shape`, collector);
        break;
      case "mesh":
        validateMesh(
          part.geometry.mesh,
          `${pp}.geometry.mesh`,
          boneNames,
          collector,
        );
        break;
      default: {
        const unknown = part.geometry as { type: unknown };
        collector.push(
          "type",
          `${pp}.geometry.type`,
          `unknown geometry type "${String(unknown.type)}"`,
          unknown.type,
        );
        break;
      }
    }
    if (part.transform !== null)
      validateTransformScalars({
        transform: part.transform,
        path: `${pp}.transform`,
        label: "model part transform",
        collector,
      });
  });

  model.skeleton?.bones.forEach((bone, i) => {
    const bp = `${path}.skeleton.bones[${i}]`;
    validateTransformScalars({
      transform: bone.rest,
      path: `${bp}.rest`,
      label: "skeleton bone rest transform",
      collector,
    });
    if (bone.constraint !== null)
      validateJointConstraint(bone.constraint, `${bp}.constraint`, collector);
  });

  if (model.body !== null) validateBody(model.body, `${path}.body`, collector);

  const profileValidation = validateProfileCapabilities({
    profiles: model.profiles ?? [],
  });
  collector.items.push(
    ...(profileValidation.success
      ? (profileValidation.warnings ?? [])
      : profileValidation.violations),
  );

  const affordances = model.affordances ?? null;
  if (affordances !== null) {
    validateUniqueValues(
      affordances.map((a, i) => [a.id, `${path}.affordances[${i}].id`]),
      "affordance id",
      collector,
    );
    affordances.forEach((affordance, i) =>
      validateAffordance(affordance, `${path}.affordances[${i}]`, collector),
    );
  }

  model.materials.forEach((m, i) => {
    const mp = `${path}.materials[${i}]`;
    collectNonEmptyId(m.id, `${mp}.id`, "material id", collector);
    validateTextureBinding(
      m.baseColorTexture,
      `${mp}.baseColorTexture`,
      "srgb",
      collector,
    );
    validateTextureBinding(
      m.metallicRoughnessTexture,
      `${mp}.metallicRoughnessTexture`,
      "linear",
      collector,
    );
    validateTextureBinding(
      m.normalTexture,
      `${mp}.normalTexture`,
      "linear",
      collector,
    );
    validateTextureBinding(
      m.occlusionTexture,
      `${mp}.occlusionTexture`,
      "linear",
      collector,
    );
    validateTextureBinding(
      m.emissiveTexture,
      `${mp}.emissiveTexture`,
      "srgb",
      collector,
    );
    collector.range(`${mp}.metallic`, m.metallic, 0, 1, "metallic");
    collector.range(`${mp}.roughness`, m.roughness, 0, 1, "roughness");
    collector.range(`${mp}.opacity`, m.opacity, 0, 1, "opacity");
    if (m.normalScale !== undefined)
      finiteNumber(
        m.normalScale,
        `${mp}.normalScale`,
        "normal scale",
        collector,
      );
    if (m.occlusionStrength !== undefined)
      collector.range(
        `${mp}.occlusionStrength`,
        m.occlusionStrength,
        0,
        1,
        "occlusion strength",
      );
    if (m.transmission !== undefined)
      collector.range(
        `${mp}.transmission`,
        m.transmission,
        0,
        1,
        "transmission",
      );
    if (m.ior !== undefined)
      finiteMinimum(m.ior, 1, `${mp}.ior`, "index of refraction", collector);
    if (m.thickness !== undefined)
      finiteMinimum(m.thickness, 0, `${mp}.thickness`, "thickness", collector);
    if (m.clearcoat !== undefined)
      collector.range(`${mp}.clearcoat`, m.clearcoat, 0, 1, "clearcoat");
    if (m.subsurfaceRadius !== undefined)
      for (const channel of ["r", "g", "b"] as const)
        finiteMinimum(
          m.subsurfaceRadius[channel],
          0,
          `${mp}.subsurfaceRadius.${channel}`,
          "subsurface radius",
          collector,
        );
    if (m.doubleSided !== undefined && typeof m.doubleSided !== "boolean")
      collector.push(
        "type",
        `${mp}.doubleSided`,
        "doubleSided must be boolean",
        m.doubleSided,
      );
    if (
      m.alphaMode !== undefined &&
      !["opaque", "mask", "blend"].includes(m.alphaMode)
    )
      collector.push(
        "type",
        `${mp}.alphaMode`,
        'alpha mode must be "opaque", "mask", or "blend"',
        m.alphaMode,
      );
    if (m.alphaCutoff !== undefined) {
      collector.range(`${mp}.alphaCutoff`, m.alphaCutoff, 0, 1, "alpha cutoff");
      if (m.alphaMode !== "mask")
        collector.push(
          "type",
          `${mp}.alphaCutoff`,
          'alpha cutoff is only meaningful when alphaMode is "mask"',
          m.alphaCutoff,
        );
    }
    if (m.alphaMode === "opaque" && m.opacity < 1)
      collector.push(
        "type",
        `${mp}.opacity`,
        "an opaque material must have opacity 1",
        m.opacity,
      );
    const effectiveAlphaMode =
      m.alphaMode ?? (m.opacity < 1 ? "blend" : "opaque");
    if ((m.transmission ?? 0) > 0 && effectiveAlphaMode !== "opaque")
      collector.push(
        "type",
        `${mp}.transmission`,
        "a transmissive material must use opaque alpha coverage",
        m.transmission,
      );
    validateColor(m.baseColor, `${mp}.baseColor`, collector);
    if (m.emissive !== null)
      validateColor(m.emissive, `${mp}.emissive`, collector);
  });

  return collector.toValidation();
};
