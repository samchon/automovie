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
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieBone,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidation,
} from "@automovie/interface";

import { validateJointAxesBasis } from "../kinematics/validateJointAxesBasis";
import { ViolationCollector } from "./ViolationCollector";
import { collectNonEmptyId } from "./collectNonEmptyId";
import { finiteMinimum } from "./finiteMinimum";
import { finiteNumber } from "./finiteNumber";
import { materialTextureSlots } from "./materialTextureSlots";
import { validateAffordance } from "./validateAffordance";
import { validateBody } from "./validateBody";
import { validateColor } from "./validateColor";
import { validateExtents } from "./validateExtents";
import { validateJointConstraint } from "./validateJointConstraint";
import { validateLookAt } from "./validateLookAt";
import { validateMaterialLobes } from "./validateMaterialLobes";
import { validateMaterialOverlays } from "./validateMaterialOverlays";
import { validateMesh } from "./validateMesh";
import { validateModelImages } from "./validateModelImages";
import { validateProfileCapabilities } from "./validateProfileCapabilities";
import { validateSkeletonGraph } from "./validateSkeletonGraph";
import { validateTextureBinding } from "./validateTextureBinding";
import { validateTransformScalars } from "./validateTransformScalars";
import { validateUniqueValues } from "./validateUniqueValues";

/**
 * Assemble id/reference, primitive/mesh, skeleton (with declared joint axes), gaze, transform, body/profile/affordance and material checks in stable order.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Assemble id/reference, primitive/mesh, skeleton with declared joint-axes bases, the gaze declaration against the eye bones, transform (uniform scale under a dual-quaternion skin), body/profile/affordance and material checks in stable order.
 * @evidence contracts/common.md#clear-and-simple-design Leaf owners append to one local collector; model orchestration owns cross-reference sets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Typed record/list shape is a premise; scalar/reference success does not certify visual quality or repair bad geometry.
 * @evidence contracts/common.md#meaningful-documentation Empty parts, null optional metadata and exact field diagnostics are stated.
 * @evidence contracts/performance.md#efficient-algorithms Parts/bones/materials/attributes drive scans, skeleton graph and mesh topology costs; material id sets share repeated lookup work.
 * @evidence contracts/performance.md#reuse-equivalent-work Leaf validators and texture slot enumeration are reused within this current model request.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned report owns rows; temporary maps/sets release and no model loader, host task or geometry cache remains.
 */
export const validateModel: (props: {
  model: IAutoMovieModel;
}) => IAutoMovieValidation = (props: {
  /** Borrowed typed model; numeric/reference checks append faults without repairing it. */
  model: IAutoMovieModel;
}): IAutoMovieValidation => {
  const path: string = "$input";
  const collector: ViolationCollector = new ViolationCollector();
  const { model }: { model: IAutoMovieModel } = props;

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
    model.skeleton.bones.forEach((bone: IAutoMovieBone, i: number): void => {
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
        const unknown: { type: unknown } = part.geometry as { type: unknown };
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
  }

  validateModelImages(model.images, `${path}.images`, collector);

  model.materials.forEach((m: IAutoMovieMaterial, i: number): void => {
    const mp: string = `${path}.materials[${i}]`;
    collectNonEmptyId(m.id, `${mp}.id`, "material id", collector);
    for (const slot of materialTextureSlots(m))
      validateTextureBinding(
        slot.binding,
        `${mp}${slot.path}`,
        slot.colorSpace,
        collector,
      );
    if (m.detailNormalScale !== undefined)
      finiteMinimum(
        m.detailNormalScale,
        0,
        `${mp}.detailNormalScale`,
        "detail normal scale",
        collector,
      );
    validateMaterialOverlays(m.overlays, `${mp}.overlays`, collector);
    validateMaterialLobes({
      material: m,
      path: mp,
      parts: model.parts,
      partsPath: `${path}.parts`,
      collector,
    });
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
};
