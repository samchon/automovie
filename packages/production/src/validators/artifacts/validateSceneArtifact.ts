import { AUTO_MOVIE_LIGHT_TYPES, asArray, isAutoMovieLightType, isRecord, pushViolation, toValidation, validateNonEmptyId, validateObjectArtifact, validateRange, validateSceneEnvironment, validateSpace, validateUniqueIds } from "@automovie/engine";
import type { IAutoMovieConstraintViolation, IAutoMovieScene, IAutoMovieSpace, IAutoMovieValidation } from "@automovie/interface";
import type { IAutoMovieLegacyGeometryModel } from "../../project/legacyRecords";
import { appendValidation } from "../appendValidation";
import { validateColorArtifact } from "../validateColorArtifact";
import { validateTransformArtifact } from "../validateTransformArtifact";
import { validateSpaceShape } from "../validateSpaceShape";
import { remapSpaceViolations } from "./remapSpaceViolations";

/**
 * Validate a portable scene and its model registry before publication. Node, camera and light shape errors are collected together with spatial, fog and environment refusals. Environment shadow checks retain the original light row indices; authored inputs are read without mutation. Ordinary parsed JSON supplies dense arrays; direct host arrays receive no density admission and their missing slots can be skipped. Unguarded diagnostic conversion of malformed field values can throw before a complete report returns.
 *
 * @evidence contracts/common.md#principled-implementation Raw object and array admission establishes visited row shapes before dereference; one model-id set resolves references, the engine owns color, transform, space and environment semantics, and camera/shadow near-far intervals prevent inverted clipping volumes. Parsed JSON arrays are dense; host-array density is not established by the shallow array guard.
 * @evidence contracts/common.md#clear-and-simple-design Scene admission coordinates its fields and foreign model registry; shared engine gates own numerical semantics and path adapters place their findings under the owning scene field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No scene value is normalized or inferred from another field. Area-shadow refusal follows the renderer's supported source contract, and original light indices survive malformed rows. Sparse host-array slots can escape row checks, and direct diagnostic interpolation can throw on malformed JSON objects with unusable conversion members; both limitations remain.
 * @evidence contracts/common.md#meaningful-documentation States collective refusal, model-registry scope, original-index shadow diagnostics and unmodified authored input.
 * @evidence contracts/performance.md#efficient-algorithms Registry, node, camera and light scans use expected linear row-index work with a reusable model-id set, plus inspected ids and diagnostic text/conversion. Space validation additionally checks footprint edge pairs and hole relations, quadratic in each surface's total ring vertices, plus linear heightfield samples; findings and temporary indices scale with those inputs. Arbitrary host conversion hooks have no bounded execution cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One model-id index serves every node in this scene call; fresh mutable scene input is validated independently rather than cached across publications.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Indexes and helper collectors are call-local; returned findings retain original offending values under caller ownership without acquiring handles or tasks.
 */
export function validateSceneArtifact(scene: IAutoMovieScene, models: IAutoMovieLegacyGeometryModel[]): IAutoMovieValidation {
  const violations: IAutoMovieConstraintViolation[] = [];
  if (!validateObjectArtifact(scene, "$input", "scene", violations))
    return toValidation(violations);
  validateNonEmptyId(scene.id, "$input.id", "scene id", violations);
  validateUniqueIds(scene.nodes, "$input.nodes", "scene node id", violations);
  validateUniqueIds(scene.cameras, "$input.cameras", "camera id", violations);
  validateUniqueIds(scene.lights, "$input.lights", "light id", violations);
  validateUniqueIds(models, "$models", "model id", violations);
  asArray(models).forEach((model: unknown, i: number): void => {
    const path: string = `$models[${i}]`;
    if (!validateObjectArtifact(model, path, "model", violations)) return;
    validateNonEmptyId(model.id, `${path}.id`, "model id", violations);
  });

  const modelIds: ReadonlySet<string> = new Set(
    asArray(models)
      .filter(isRecord)
      .map((model: Record<string, unknown>): unknown => model.id)
      .filter((id: unknown): id is string => typeof id === "string"),
  );
  asArray(scene.nodes).forEach((node: unknown, i: number): void => {
    const path: string = `$input.nodes[${i}]`;
    if (!validateObjectArtifact(node, path, "scene node", violations)) return;
    validateNonEmptyId(node.id, `${path}.id`, "scene node id", violations);
    validateNonEmptyId(
      node.model,
      `${path}.model`,
      "scene node model",
      violations,
    );
    if (typeof node.model === "string" && !modelIds.has(node.model))
      pushViolation(
        violations,
        "type",
        `${path}.model`,
        `scene node model "${node.model}" must reference an available model id`,
        node.model,
      );
    validateTransformArtifact(
      node.transform,
      `${path}.transform`,
      "scene node transform",
      violations,
    );
  });

  asArray(scene.cameras).forEach((camera: unknown, i: number): void => {
    const path: string = `$input.cameras[${i}]`;
    if (!validateObjectArtifact(camera, path, "camera", violations)) return;
    validateNonEmptyId(camera.id, `${path}.id`, "camera id", violations);
    validateTransformArtifact(
      camera.transform,
      `${path}.transform`,
      "camera transform",
      violations,
    );
    validateRange(
      camera.fovY,
      `${path}.fovY`,
      0,
      180,
      "camera fovY",
      violations,
      false,
      false,
    );
    validateRange(
      camera.near,
      `${path}.near`,
      0,
      Infinity,
      "camera near",
      violations,
      false,
    );
    const near: number = typeof camera.near === "number" ? camera.near : NaN;
    const far: number = typeof camera.far === "number" ? camera.far : NaN;
    if (!Number.isFinite(far) || far <= near)
      pushViolation(
        violations,
        "range",
        `${path}.far`,
        `camera far must be finite and greater than near (${camera.near}), but was ${camera.far}`,
        camera.far,
      );
  });

  asArray(scene.lights).forEach((light: unknown, i: number): void => {
    const path: string = `$input.lights[${i}]`;
    if (!validateObjectArtifact(light, path, "light", violations)) return;
    validateNonEmptyId(light.id, `${path}.id`, "light id", violations);
    validateTransformArtifact(
      light.transform,
      `${path}.transform`,
      "light transform",
      violations,
    );
    validateColorArtifact(light.color, `${path}.color`, violations);
    validateRange(
      light.intensity,
      `${path}.intensity`,
      0,
      Infinity,
      "light intensity",
      violations,
    );
    const lightType: unknown = light.type;
    const validLightType: boolean = isAutoMovieLightType(lightType);
    if (!validLightType)
      pushViolation(
        violations,
        "type",
        `${path}.type`,
        `light type must be one of ${[...AUTO_MOVIE_LIGHT_TYPES].join(", ")}`,
        lightType,
      );
    if (validLightType && (lightType === "point" || lightType === "spot"))
      validateRange(
        light.range,
        `${path}.range`,
        0,
        Infinity,
        "light range",
        violations,
      );
    if (validLightType && lightType === "spot")
      validateRange(
        light.coneAngle,
        `${path}.coneAngle`,
        0,
        90,
        "spot coneAngle",
        violations,
        false,
      );
    // Area sources require both positive extents; other kinds ignore these fields here.
    if (validLightType && lightType === "area")
      for (const axis of ["width", "height"] as const)
        validateRange(
          light[axis],
          `${path}.${axis}`,
          0,
          Infinity,
          `area ${axis}`,
          violations,
          false,
        );
    if (light.castShadow !== undefined && typeof light.castShadow !== "boolean")
      pushViolation(
        violations,
        "type",
        `${path}.castShadow`,
        "castShadow must be boolean",
        light.castShadow,
      );
    // The supported rectangular area source has no shadow-map capability.
    else if (light.castShadow === true && lightType === "area") {
      pushViolation(
        violations,
        "type",
        `${path}.castShadow`,
        "an area light is analytically integrated and casts no shadow map",
        light.castShadow,
      );
      return;
    }
    const shadow: unknown = light.shadow;
    if (light.castShadow === true && shadow === undefined)
      pushViolation(
        violations,
        "type",
        `${path}.shadow`,
        "a shadow-casting light requires deterministic shadow settings",
        shadow,
      );
    if (shadow !== undefined) {
      if (light.castShadow !== true)
        pushViolation(
          violations,
          "type",
          `${path}.shadow`,
          "shadow settings require castShadow to be true",
          shadow,
        );
      if (
        !validateObjectArtifact(shadow, `${path}.shadow`, "shadow", violations)
      )
        return;
      const mapSize: number = typeof shadow.mapSize === "number" ? shadow.mapSize : NaN;
      if (!Number.isSafeInteger(mapSize) || mapSize <= 0)
        pushViolation(
          violations,
          "range",
          `${path}.shadow.mapSize`,
          "shadow mapSize must be a positive safe integer",
          shadow.mapSize,
        );
      for (const key of ["bias", "normalBias"] as const)
        if (!Number.isFinite(shadow[key]))
          pushViolation(
            violations,
            "range",
            `${path}.shadow.${key}`,
            `shadow ${key} must be finite`,
            shadow[key],
          );
      validateRange(
        shadow.near,
        `${path}.shadow.near`,
        0,
        Infinity,
        "shadow near",
        violations,
        false,
      );
      const near: number = typeof shadow.near === "number" ? shadow.near : NaN;
      const far: number = typeof shadow.far === "number" ? shadow.far : NaN;
      if (!Number.isFinite(far) || far <= near)
        pushViolation(
          violations,
          "range",
          `${path}.shadow.far`,
          "shadow far must be finite and greater than near",
          shadow.far,
        );
    }
  });

  // Declared space owns ground metadata outside the model registry; null or absence skips its gate.
  const space: IAutoMovieScene["space"] = scene.space ?? null;
  if (space !== null && validateSpaceShape(space, "$input.space", violations))
    appendValidation(
      violations,
      remapSpaceViolations(validateSpace({ space: space as IAutoMovieSpace })),
    );

  // Fog is scene metadata outside the model registry. Density is finite and nonnegative with no finite upper bound; color uses the shared linear-channel rule.
  const fog: IAutoMovieScene["fog"] = scene.fog ?? null;
  if (
    fog !== null &&
    validateObjectArtifact(fog, "$input.fog", "fog", violations)
  ) {
    validateRange(
      fog.density,
      "$input.fog.density",
      0,
      Infinity,
      "fog density",
      violations,
    );
    validateColorArtifact(fog.color, "$input.fog.color", violations);
  }

  const environment: IAutoMovieScene["environment"] = scene.environment ?? null;
  if (environment !== null) {
    const validated: IAutoMovieValidation = validateSceneEnvironment({
      environment,
      // Shape errors are already collected above; retain original row indices
      // when the independent shadow-profile check locates another light.
      lights: asArray(scene.lights) as IAutoMovieScene["lights"],
    });
    const findings: readonly IAutoMovieConstraintViolation[] = validated.success
      ? validated.warnings ?? []
      : validated.violations;
    violations.push(
        ...findings.map((item: IAutoMovieConstraintViolation): IAutoMovieConstraintViolation => ({
          ...item,
          path: item.path.startsWith("$input.lights[") ? item.path :
            item.path.replace("$input", "$input.environment"),
        })),
      );
  }

  return toValidation(violations);
}
