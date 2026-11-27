import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieBone,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidateModel,
  IAutoMovieValidation,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

/*
 * Assemble the model validation result in stable diagnostic order. IDs and
 * references precede parts, rigs, body/profile/affordance metadata and
 * materials. Cohesive leaf owners check their typed inputs and append to this
 * one local collector. Caller models are read-only; validation reports faults
 * rather than repairing geometry or binding external resources. Model
 * generators, authoring builders and static exporters all consume this same
 * public entry. Moving a leaf must preserve predicate arithmetic, paths and
 * ordering because downstream correction rounds present these diagnostics to
 * the author.
 */

import { admitAutoMovieBicubicAtlas } from "../../geometry/internal/admitAutoMovieBicubicAtlas";
import { validateJointAxesBasis } from "../../kinematics/internal/validateJointAxesBasis";
import { AutoMovieEngineViolationCollector } from "../AutoMovieEngineViolationCollector";
import { materialTextureSlots } from "./materialTextureSlots";
import { validateAffordance } from "./validateAffordance";
import { validateAffordanceArticulation } from "./validateAffordanceArticulation";
import { validateBody } from "./validateBody";
import { validateColor } from "./validateColor";
import { validateExtents } from "./validateExtents";
import { validateJointConstraint } from "./validateJointConstraint";
import { validateLookAt } from "./validateLookAt";
import { validateMaterialLobes } from "./validateMaterialLobes";
import { validateMaterialOverlays } from "./validateMaterialOverlays";
import { validateMaterialProcedural } from "./validateMaterialProcedural";
import { validateMaterialWear } from "./validateMaterialWear";
import { validateMesh } from "./validateMesh";
import { validateModelImages } from "./validateModelImages";
import { validateProfileCapabilities } from "./validateProfileCapabilities";
import { validateSkeletonGraph } from "./validateSkeletonGraph";
import { validateTextureBinding } from "./validateTextureBinding";
import { validateTransformScalars } from "./validateTransformScalars";
import { validateUniqueValues } from "./validateUniqueValues";

/*
 * Assemble id/reference, primitive/mesh, skeleton (with declared joint axes),
 * gaze, transform, body/profile/affordance and material checks in stable
 * order.
 */
export function validateModel(
  props: IAutoMovieValidateModel.IProps,
): IAutoMovieValidation {
  const path: string = "$input";
  const collector: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  const { model }: { model: IAutoMovieModel } = props;

  const materialIds: Set<string> = new Set(
    model.materials.map((m: IAutoMovieMaterial): string => m.id),
  );
  const boneNames: Set<AutoMovieHumanoidBone> = new Set(
    (model.skeleton?.bones ?? []).map(
      (b: IAutoMovieBone): AutoMovieHumanoidBone => b.bone,
    ),
  );

  validateUniqueValues(
    model.materials.map(
      (m: IAutoMovieMaterial, i: number): [string, string] => [
        m.id,
        `${path}.materials[${i}].id`,
      ],
    ),
    "material id",
    collector,
  );
  validateUniqueValues(
    model.parts.map((p: IAutoMovieModelPart, i: number): [string, string] => [
      p.id,
      `${path}.parts[${i}].id`,
    ]),
    "part id",
    collector,
  );
  validateUniqueValues(
    (model.skeleton?.bones ?? []).map(
      (b: IAutoMovieBone, i: number): [AutoMovieHumanoidBone, string] => [
        b.bone,
        `${path}.skeleton.bones[${i}].bone`,
      ],
    ),
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

  model.parts.forEach((part: IAutoMovieModelPart, i: number): void => {
    const pp: string = `${path}.parts[${i}]`;
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
      case "bicubic-atlas":
        try {
          for (const diagnostic of admitAutoMovieBicubicAtlas(part.geometry)
            .diagnostics)
            collector.push(
              "type",
              `${pp}.geometry`,
              diagnostic,
              part.geometry,
              undefined,
              "warning",
            );
        } catch (cause: unknown) {
          collector.push(
            "type",
            `${pp}.geometry`,
            cause instanceof Error ? cause.message : String(cause),
            part.geometry,
          );
        }
        break;
    }
    if (part.transform !== null)
      validateTransformScalars({
        transform: part.transform,
        path: `${pp}.transform`,
        label: "model part transform",
        collector,
      });
    if (
      part.transform !== null &&
      part.attachedBone === null &&
      part.geometry.type === "mesh" &&
      part.geometry.mesh.skin?.method === "dual-quaternion"
    ) {
      // The shader conjugates each joint transform by the part transform, which
      // stays rigid only under a uniform scale.
      const { x, y, z }: { x: number; y: number; z: number } =
        part.transform.scale;
      const tolerance: number =
        1e-9 * Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
      if (Math.abs(x - y) > tolerance || Math.abs(x - z) > tolerance)
        collector.push(
          "range",
          `${pp}.transform.scale`,
          "a dual-quaternion skinned part must scale uniformly",
          part.transform.scale,
        );
    }
  });

  model.skeleton?.bones.forEach((bone: IAutoMovieBone, i: number): void => {
    const bp: string = `${path}.skeleton.bones[${i}]`;
    validateTransformScalars({
      transform: bone.rest,
      path: `${bp}.rest`,
      label: "skeleton bone rest transform",
      collector,
    });
    if (bone.constraint !== null)
      validateJointConstraint(bone.constraint, `${bp}.constraint`, collector);
    if (bone.axes !== undefined)
      for (const issue of validateJointAxesBasis(bone.axes, `${bp}.axes`))
        collector.push("range", issue.path, issue.expected, issue.value);
  });

  if (model.lookAt !== undefined)
    validateLookAt(model.lookAt, model.skeleton, `${path}.lookAt`, collector);

  if (model.body !== null) validateBody(model.body, `${path}.body`, collector);

  const profileValidation: IAutoMovieValidation = validateProfileCapabilities({
    profiles: model.profiles ?? [],
  });
  collector.items.push(
    ...(profileValidation.success
      ? (profileValidation.warnings ?? [])
      : profileValidation.violations),
  );

  const affordances: IAutoMovieAffordance[] | null = model.affordances ?? null;
  if (affordances !== null) {
    validateUniqueValues(
      affordances.map(
        (a: IAutoMovieAffordance, i: number): [string, string] => [
          a.id,
          `${path}.affordances[${i}].id`,
        ],
      ),
      "affordance id",
      collector,
    );
    affordances.forEach((affordance: IAutoMovieAffordance, i: number): void =>
      validateAffordance(affordance, `${path}.affordances[${i}]`, collector),
    );
    validateAffordanceArticulation(
      affordances,
      new Set(model.parts.map((p: IAutoMovieModelPart): string => p.id)),
      `${path}.affordances`,
      collector,
    );
  }

  validateModelImages(model.images, `${path}.images`, collector);

  model.materials.forEach((m: IAutoMovieMaterial, i: number): void => {
    const mp: string = `${path}.materials[${i}]`;
    for (const slot of materialTextureSlots(m))
      validateTextureBinding(
        slot.binding,
        `${mp}${slot.path}`,
        slot.colorSpace,
        collector,
      );
    if (m.detailNormalScale !== undefined)
      collector.range(
        `${mp}.detailNormalScale`,
        m.detailNormalScale,
        0,
        Infinity,
        "detail normal scale",
      );
    validateMaterialOverlays(m.overlays, `${mp}.overlays`, collector);
    validateMaterialLobes({
      material: m,
      path: mp,
      parts: model.parts,
      partsPath: `${path}.parts`,
      collector,
    });
    validateMaterialProcedural({
      material: m,
      path: mp,
      parts: model.parts,
      partsPath: `${path}.parts`,
      collector,
    });
    validateMaterialWear(m.wear, `${mp}.wear`, collector);
    collector.range(`${mp}.metallic`, m.metallic, 0, 1, "metallic");
    collector.range(`${mp}.roughness`, m.roughness, 0, 1, "roughness");
    collector.range(`${mp}.opacity`, m.opacity, 0, 1, "opacity");
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
      collector.range(`${mp}.ior`, m.ior, 1, Infinity, "index of refraction");
    if (m.thickness !== undefined)
      collector.range(`${mp}.thickness`, m.thickness, 0, Infinity, "thickness");
    if (m.clearcoat !== undefined)
      collector.range(`${mp}.clearcoat`, m.clearcoat, 0, 1, "clearcoat");
    if (m.subsurfaceRadius !== undefined)
      for (const channel of ["r", "g", "b"] as const)
        collector.range(
          `${mp}.subsurfaceRadius.${channel}`,
          m.subsurfaceRadius[channel],
          0,
          Infinity,
          "subsurface radius",
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
    const effectiveAlphaMode: "opaque" | "mask" | "blend" =
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
}
