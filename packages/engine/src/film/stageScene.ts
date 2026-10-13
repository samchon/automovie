import { IAutoMovieLight, IAutoMovieSceneNode, IAutoMovieScript, IAutoMovieStage, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";
import { validateSceneEnvironment } from "../validation/validateSceneEnvironment";
import { validateSpace } from "../validation/validateSpace";
import { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";
import { lookRotation } from "./lookRotation";
import { isFiniteStageVector3 } from "./staging/isFiniteStageVector3";
import { validateCameraClearanceEnvelope } from "./staging/validateCameraClearanceEnvelope";
import { lowerCameraClearanceEnvelope } from "./staging/lowerCameraClearanceEnvelope";
import { validateCameraDepthPrecision } from "./staging/validateCameraDepthPrecision";
import { setPieceScale } from "./staging/setPieceScale";
import { lightTypeOf } from "./staging/lightTypeOf";
import { validateLightPlacementShape } from "./staging/validateLightPlacementShape";
import { validateFogPlacement } from "./staging/validateFogPlacement";
import { lowerLightPlacement } from "./staging/lowerLightPlacement";

/**
 * The STAGING consumer, fold the script's cast and the staging stage's
 * placements into the {@link IAutoMovieScene} every later stage performs into.
 * This is the first rung of the film pipeline: coding-agent stage payloads in,
 * a validated engine artifact or a violation list out.
 *
 * Referential integrity is the whole check: every placement must name a cast
 * member, every cast member must be placed (an unplaced character can never
 * appear on screen), ids must not collide, and a camera aimed at a node or a
 * mount riding a parent must point at something that exists. A camera's target
 * may be any staged placement, another camera included, the same table the
 * performance stage resolves its positional targets against (#1294). Geometry
 * is converted, not judged, whether 0.7 m is striking range is the reviewer's
 * business, not a constraint.
 *
 * Conversions: `facingDeg` (about +Y, 0 = facing +Z) becomes the node's
 * rotation; a set piece's optional `scale` becomes the node transform's scale
 * (one primitive at many sizes); a camera's `lookAt` resolves to a point and
 * the shortest-arc rotation aims its −Z there; a light placement lowers to the
 * scene light its `type` names (directional, point, spot, or area), aimed by
 * `direction` and placed at `position`, in its authored color.
 *
 * The environment is two halves of one thing (#1173): `set` pieces are the
 * visible geometry the guide passes draw, and the optional `space` is the
 * ground's meaning, standable surfaces and walkability, copied onto the
 * composed scene after {@link validateSpace} accepts it. Omitting `space`
 * composes `space: null`, the scalar ground plane the engine assumed before.
 *
 * A set may also declare its `fog`, the scene's atmosphere and the depth cue an
 * exterior otherwise has no way to state: it is range-checked here and lowered
 * verbatim. Omitting it composes a scene with no `fog` at all, which renders
 * exactly as every staged scene did before atmospheres existed.
 */
export const stageScene = (
  script: IAutoMovieScript,
  staging: IAutoMovieStage,
): IAutoMovieStagedSet => {
  const out = new ViolationCollector();
  const cast = new Map<
    string,
    {
      member: IAutoMovieScript["cast"][number];
      index: number;
    }
  >();
  script.cast.forEach((member, index) => {
    const existing = cast.get(member.node);
    if (existing !== undefined) {
      out.push(
        "type",
        `$script.cast[${index}].node`,
        `script cast node "${member.node}" is duplicated; first declared at $script.cast[${existing.index}].node`,
        member.node,
      );
      return;
    }
    cast.set(member.node, { member, index });
  });
  const placed = new Map(staging.actors.map((a) => [a.node, a]));
  // What a camera may aim at: any placed point, an actor, a set piece (an
  // establishing frame on a doorway is as legitimate as one on a duellist), or
  // another camera. The camera entry is what makes this rung agree with the
  // rest: `performShot` resolves a positional target against every staged
  // placement, cameras included (#1294), so a subject the performance stage
  // accepts must be a subject staging can aim at. A camera naming itself is
  // still refused, by the zero-length look-vector check below.
  //
  // Cameras are laid down FIRST, the same precedence `scenePlacements` uses, so
  // an (illegal) id repeated between a camera and an actor still resolves to the
  // actor and the two tables cannot disagree about a malformed scene.
  const placedPoints = new Map<string, IAutoMovieVector3>([
    ...staging.cameras.map((camera) => [camera.node, camera.position] as const),
    ...staging.actors.map((a) => [a.node, a.position] as const),
    ...(staging.set ?? []).map(
      (piece) => [piece.node, piece.position] as const,
    ),
  ]);

  const validateNonEmptyId = (
    id: string,
    path: string,
    label: string,
  ): void => {
    if (id.trim().length === 0)
      out.push("type", path, `${label} must be a non-empty id`, id);
  };

  validateNonEmptyId(staging.scene.id, `$input.scene.id`, "scene id");

  script.cast.forEach((member, i) => {
    if (member.modelRef !== null)
      validateNonEmptyId(
        member.modelRef,
        `$script.cast[${i}].modelRef`,
        "cast model reference",
      );
    if (!placed.has(member.node))
      out.push(
        "type",
        `$input.actors`,
        `cast node "${member.node}" (cast[${i}]) must be placed by staging`,
        member.node,
      );
  });

  const ids = new Set<string>();
  const claim = (id: string, path: string, label: string): void => {
    validateNonEmptyId(id, path, label);
    if (ids.has(id))
      out.push("type", path, `id "${id}" must be unique in the scene`, id);
    ids.add(id);
  };

  staging.actors.forEach((placement, i) => {
    claim(placement.node, `$input.actors[${i}].node`, "actor node id");
    if (!cast.has(placement.node))
      out.push(
        "type",
        `$input.actors[${i}].node`,
        `placement must name a script cast node, but "${placement.node}" is not in the cast`,
        placement.node,
      );
    if (!isFiniteStageVector3(placement.position))
      out.push(
        "range",
        `$input.actors[${i}].position`,
        "actor position must be a finite vector",
        placement.position,
      );
    if (!Number.isFinite(placement.facingDeg))
      out.push(
        "range",
        `$input.actors[${i}].facingDeg`,
        `actor facingDeg must be finite, but was ${placement.facingDeg}`,
        placement.facingDeg,
      );
    if (placement.attach !== undefined) {
      if (placement.attach.parent === placement.node)
        out.push(
          "type",
          `$input.actors[${i}].attach.parent`,
          `a node cannot ride itself`,
          placement.attach.parent,
        );
      else if (!placed.has(placement.attach.parent))
        out.push(
          "type",
          `$input.actors[${i}].attach.parent`,
          `mount parent "${placement.attach.parent}" must be a placed actor`,
          placement.attach.parent,
        );
    }
  });

  (staging.set ?? []).forEach((piece, i) => {
    claim(piece.node, `$input.set[${i}].node`, "set node id");
    validateNonEmptyId(piece.model, `$input.set[${i}].model`, "set model id");
    if (!isFiniteStageVector3(piece.position))
      out.push(
        "range",
        `$input.set[${i}].position`,
        "set position must be a finite vector",
        piece.position,
      );
    if (piece.facingDeg !== undefined && !Number.isFinite(piece.facingDeg))
      out.push(
        "range",
        `$input.set[${i}].facingDeg`,
        `set facingDeg must be finite when present, but was ${piece.facingDeg}`,
        piece.facingDeg,
      );
    if (piece.facingDeg !== undefined && piece.rotation !== undefined)
      out.push(
        "type",
        `$input.set[${i}].rotation`,
        "set rotation and facingDeg are mutually exclusive",
        piece.rotation,
      );
    if (piece.rotation !== undefined) {
      const length = Math.hypot(
        piece.rotation.x,
        piece.rotation.y,
        piece.rotation.z,
        piece.rotation.w,
      );
      if (
        ![
          piece.rotation.x,
          piece.rotation.y,
          piece.rotation.z,
          piece.rotation.w,
        ].every(Number.isFinite) ||
        Math.abs(length - 1) > 1e-6
      )
        out.push(
          "range",
          `$input.set[${i}].rotation`,
          `set rotation must be a finite unit quaternion, but length was ${length}`,
          piece.rotation,
        );
    }
    if (piece.scale !== undefined) {
      const scale = setPieceScale(piece.scale);
      // Zero collapses the piece to nothing (a set piece that draws no pixels
      // is a staging mistake, not a style); a negative axis mirrors it, which
      // flips the winding the normal and outline passes read.
      if (
        ![scale.x, scale.y, scale.z].every(
          (axis) => Number.isFinite(axis) && axis > 0,
        )
      )
        out.push(
          "range",
          `$input.set[${i}].scale`,
          "set scale must be finite and greater than zero on every axis",
          piece.scale,
        );
    }
  });

  // The space is the ground's meaning, gated by the shared surface validator so
  // staging and a hand-authored scene can never disagree about what a
  // well-formed space is (#1173). Its own `$input` paths are re-rooted under
  // `$input.space` so the correction round points at the submitted field.
  if (staging.space !== undefined) {
    const validated = validateSpace({ space: staging.space });
    if (validated.success === false)
      for (const item of validated.violations)
        out.items.push({
          ...item,
          path: item.path.replace("$input", "$input.space"),
        });
  }

  // The atmosphere is gated at its submitted field. Fog has no placement references;
  // its dedicated field validator reports scalar and color failures directly.
  if (staging.fog !== undefined)
    validateFogPlacement(staging.fog, "$input.fog", out);
  if (staging.environment !== undefined) {
    const validated = validateSceneEnvironment({
      environment: staging.environment,
      lights: staging.lights.map((light) => ({
        id: light.node, type: lightTypeOf(light) ?? "directional",
        castShadow: light.castShadow,
      })),
    });
    if (validated.success === false)
      for (const item of validated.violations)
        out.items.push({
          ...item,
          path: item.path.startsWith("$input.lights[") ? item.path :
            item.path.replace("$input", "$input.environment"),
        });
  }

  staging.cameras.forEach((camera, i) => {
    const path = `$input.cameras[${i}]`;
    claim(camera.node, `$input.cameras[${i}].node`, "camera node id");
    const positionFinite = isFiniteStageVector3(camera.position);
    if (!positionFinite)
      out.push(
        "range",
        `$input.cameras[${i}].position`,
        "camera position must be a finite vector",
        camera.position,
      );
    if (!(camera.fovDeg > 0 && camera.fovDeg < 180))
      out.push(
        "range",
        `$input.cameras[${i}].fovDeg`,
        `vertical field of view must be within (0, 180)°, but was ${camera.fovDeg}`,
        camera.fovDeg,
      );
    if (!Number.isFinite(camera.near) || camera.near <= 0)
      out.push(
        "range",
        `${path}.near`,
        "camera near distance must be finite and greater than zero metres",
        camera.near,
      );
    if (!Number.isFinite(camera.far) || camera.far <= camera.near)
      out.push(
        "range",
        `${path}.far`,
        "camera far distance must be finite and greater than near",
        camera.far,
      );
    validateCameraDepthPrecision(
      camera.depthPrecision,
      `${path}.depthPrecision`,
      out,
    );
    if (camera.lookAt.kind === "node" && !placedPoints.has(camera.lookAt.node))
      out.push(
        "type",
        `$input.cameras[${i}].lookAt.node`,
        `camera target "${camera.lookAt.node}" must be a placed actor, set piece, or camera`,
        camera.lookAt.node,
      );
    if (camera.lookAt.kind === "point" && !isFiniteStageVector3(camera.lookAt.point))
      out.push(
        "range",
        `$input.cameras[${i}].lookAt.point`,
        "camera point target must be a finite vector",
        camera.lookAt.point,
      );
    const target =
      camera.lookAt.kind === "node"
        ? placedPoints.get(camera.lookAt.node)
        : camera.lookAt.point;
    if (
      target !== undefined &&
      positionFinite &&
      isFiniteStageVector3(target) &&
      Vector3.length(Vector3.subtract(target, camera.position)) < 1e-9
    )
      out.push(
        "range",
        `$input.cameras[${i}].lookAt`,
        "camera lookAt must not equal the camera position",
        camera.lookAt,
      );
    if (camera.clearance !== undefined)
      validateCameraClearanceEnvelope(
        camera.clearance,
        `${path}.clearance`,
        out,
      );
  });

  staging.lights.forEach((light, i) => {
    const path = `$input.lights[${i}]`;
    claim(light.node, `${path}.node`, "light node id");
    if (!Number.isFinite(light.intensity) || light.intensity < 0)
      out.push(
        "range",
        `${path}.intensity`,
        `intensity must be a finite number >= 0, but was ${light.intensity}`,
        light.intensity,
      );
    validateLightPlacementShape(light, path, out);
  });

  if (out.items.length > 0) return { success: false, violations: out.items };

  const nodes: IAutoMovieSceneNode[] = [
    ...staging.actors.map(
      (placement): IAutoMovieSceneNode => ({
        id: placement.node,
        model: cast.get(placement.node)!.member.modelRef ?? placement.node,
        transform: {
          translation: placement.position,
          rotation: Quaternion.fromAxisAngle(
            { x: 0, y: 1, z: 0 },
            placement.facingDeg,
          ),
          scale: { x: 1, y: 1, z: 1 },
        },
        motion: null,
        pose: null,
      }),
    ),
    // Set pieces are scenery: static nodes realising skeleton-less models
    // (#1173), so the guide passes describe a world, not a void.
    ...(staging.set ?? []).map(
      (piece): IAutoMovieSceneNode => ({
        id: piece.node,
        model: piece.model,
        transform: {
          translation: piece.position,
          rotation:
            piece.rotation ??
            Quaternion.fromAxisAngle(
              { x: 0, y: 1, z: 0 },
              piece.facingDeg ?? 0,
            ),
          scale: setPieceScale(piece.scale),
        },
        motion: null,
        pose: null,
      }),
    ),
  ];

  const cameras = staging.cameras.map((camera) => {
    const target: IAutoMovieVector3 =
      camera.lookAt.kind === "node"
        ? placedPoints.get(camera.lookAt.node)!
        : camera.lookAt.point;
    return {
      id: camera.node,
      transform: {
        translation: camera.position,
        rotation: lookRotation(Vector3.subtract(target, camera.position)),
        scale: { x: 1, y: 1, z: 1 },
      },
      fovY: camera.fovDeg,
      near: camera.near,
      far: camera.far,
      depthPrecision: { ...camera.depthPrecision },
      ...(camera.clearance === undefined
        ? {}
        : { clearance: lowerCameraClearanceEnvelope(camera.clearance) }),
    };
  });

  const lights: IAutoMovieLight[] = staging.lights.map(lowerLightPlacement);

  const mounts: IAutoMovieStagedSet.IMount[] = staging.actors
    .filter((placement) => placement.attach !== undefined)
    .map((placement) => ({ node: placement.node, binding: placement.attach! }));

  return {
    success: true,
    scene: {
      id: staging.scene.id,
      name: staging.scene.name,
      nodes,
      cameras,
      lights,
      // Emitted explicitly (not omitted) so a staged scene always states
      // whether it has a ground: `null` is "no space, fall back to the scalar
      // plane", which is a decision, not an absent field.
      space: staging.space ?? null,
      // Fog goes the other way and is OMITTED when unstaged, deliberately.
      // A ground is something every set has, so stating `null` says "this one
      // is the scalar plane"; an atmosphere is something most sets simply do
      // not have, and writing `fog: null` onto every staged scene ever composed
      // would change the bytes, and therefore the content digest, of every
      // production that never mentioned fog. Absent already means none.
      ...(staging.fog === undefined ? {} : { fog: staging.fog }),
      ...(staging.environment === undefined
        ? {}
        : { environment: staging.environment }),
    },
    mounts,
  };
};
