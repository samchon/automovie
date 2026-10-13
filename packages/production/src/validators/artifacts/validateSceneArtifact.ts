import { AUTO_MOVIE_LIGHT_TYPES, asArray, isAutoMovieLightType, isRecord, pushViolation, toValidation, validateNonEmptyId, validateObjectArtifact, validateRange, validateSceneEnvironment, validateSpace, validateUniqueIds } from "@automovie/engine";
import type { IAutoMovieConstraintViolation, IAutoMovieScene, IAutoMovieSpace, IAutoMovieValidation } from "@automovie/interface";
import type { IAutoMovieLegacyGeometryModel } from "../../project/legacyRecords";
import { appendValidation, validateColorArtifact, validateTransformArtifact } from "../primitives";
import { validateSpaceShape } from "../space";
import { remapSpaceViolations } from "./remapSpaceViolations";

/**
 * Validate a portable scene and its model registry before publication. Node, camera and light shape errors are collected together with spatial, fog and environment refusals. Environment shadow checks retain the original light row indices; authored inputs are read without mutation.
 */
export const validateSceneArtifact = (
  scene: IAutoMovieScene,
  models: IAutoMovieLegacyGeometryModel[],
): IAutoMovieValidation => {
  const violations: IAutoMovieConstraintViolation[] = [];
  if (!validateObjectArtifact(scene, "$input", "scene", violations))
    return toValidation(violations);
  validateNonEmptyId(scene.id, "$input.id", "scene id", violations);
  validateUniqueIds(scene.nodes, "$input.nodes", "scene node id", violations);
  validateUniqueIds(scene.cameras, "$input.cameras", "camera id", violations);
  validateUniqueIds(scene.lights, "$input.lights", "light id", violations);
  validateUniqueIds(models, "$models", "model id", violations);
  asArray(models).forEach((model, i) => {
    const path = `$models[${i}]`;
    if (!validateObjectArtifact(model, path, "model", violations)) return;
    validateNonEmptyId(model.id, `${path}.id`, "model id", violations);
  });

  const modelIds = new Set(
    asArray(models)
      .filter(isRecord)
      .map((model) => model.id)
      .filter((id): id is string => typeof id === "string"),
  );
  asArray(scene.nodes).forEach((node, i) => {
    const path = `$input.nodes[${i}]`;
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

  asArray(scene.cameras).forEach((camera, i) => {
    const path = `$input.cameras[${i}]`;
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
    const near = typeof camera.near === "number" ? camera.near : NaN;
    const far = typeof camera.far === "number" ? camera.far : NaN;
    if (!Number.isFinite(far) || far <= near)
      pushViolation(
        violations,
        "range",
        `${path}.far`,
        `camera far must be finite and greater than near (${camera.near}), but was ${camera.far}`,
        camera.far,
      );
  });

  asArray(scene.lights).forEach((light, i) => {
    const path = `$input.lights[${i}]`;
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
    const lightType = light.type;
    const validLightType = isAutoMovieLightType(lightType);
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
    // The one kind with extent. Both axes are gated, and gated exclusively, so
    // an artifact cannot describe a panel with only a width nor a punctual
    // light that quietly carries one.
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
    // `three.js` renders no shadow map for a rectangular area source, so the
    // artifact may not claim one; the whole point of the gate is that a
    // declared capability is a rendered capability.
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
    const shadow = light.shadow;
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
      const mapSize = typeof shadow.mapSize === "number" ? shadow.mapSize : NaN;
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
      const near = typeof shadow.near === "number" ? shadow.near : NaN;
      const far = typeof shadow.far === "number" ? shadow.far : NaN;
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

  // The ground the feet obey (#1173). Absent or null is the pre-space scalar
  // plane, so only a declared space is checked, and it needs NO model: a
  // surface is semantics plus, in the viewer, generated geometry, never a
  // registry entry, so the model-resolution gate above deliberately ignores it.
  const space = scene.space ?? null;
  if (space !== null && validateSpaceShape(space, "$input.space", violations))
    appendValidation(
      violations,
      remapSpaceViolations(validateSpace({ space: space as IAutoMovieSpace })),
    );

  // The atmosphere the frame is read through. Absent or null is a scene with
  // none, so only a declared fog is checked, and like a space it needs no
  // model: fog is a property of the scene, not an object in it.
  //
  // Both facts are gated because both can silently ruin a render rather than
  // fail it: a negative or non-finite `density` feeds `exp(-(density*d)^2)` a
  // value the shader will happily paint as a uniformly dead frame, and an
  // out-of-range color leaves the horizon a color no light in the scene can
  // produce. Density is unbounded above on purpose; a wall of cloud is a look.
  const fog = scene.fog ?? null;
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

  const environment = scene.environment ?? null;
  if (environment !== null) {
    const validated = validateSceneEnvironment({
      environment,
      // Shape errors are already collected above; retain original row indices
      // when the independent shadow-profile check locates another light.
      lights: asArray(scene.lights) as IAutoMovieScene["lights"],
    });
    if (validated.success === false)
      violations.push(
        ...validated.violations.map((item) => ({
          ...item,
          path: item.path.startsWith("$input.lights[") ? item.path :
            item.path.replace("$input", "$input.environment"),
        })),
      );
  }

  return toValidation(violations);
};
