import {
  IAutoMovieCamera,
  IAutoMovieConstraintViolation,
  type IAutoMovieFog,
  IAutoMovieLight,
  type IAutoMovieMedium,
  IAutoMovieSceneNode,
  IAutoMovieScript,
  IAutoMovieSpace,
  IAutoMovieStage,
  IAutoMovieStageActor,
  IAutoMovieStageCamera,
  IAutoMovieStageLight,
  IAutoMovieStageSetPiece,
  type IAutoMovieStagedSet,
  IAutoMovieValidation,
  IAutoMovieVector3,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Transform } from "../../math/Transform";
import { AutoMovieEngineViolationCollector } from "../../validation/AutoMovieEngineViolationCollector";
import { validateSceneEnvironment } from "../../validation/internal/validateSceneEnvironment";
import { validateSpace } from "../../validation/internal/validateSpace";
import { lookRotation } from "./lookRotation";
import { admitStageCast } from "../staging/internal/admitStageCast";
import { admitStageSupport } from "../staging/internal/admitStageSupport";
import { lightTypeOf } from "../staging/internal/lightTypeOf";
import { lowerCameraClearanceEnvelope } from "../staging/internal/lowerCameraClearanceEnvelope";
import { lowerLightPlacement } from "../staging/internal/lowerLightPlacement";
import { prepareStageNodeClaim } from "../staging/internal/prepareStageNodeClaim";
import { resolveStagedFog } from "../staging/internal/resolveStagedFog";
import { resolveStagedMedium } from "../staging/internal/resolveStagedMedium";
import { setPieceScale } from "../staging/internal/setPieceScale";
import { setPieceTransform } from "../staging/internal/setPieceTransform";
import { validateLightPlacementShape } from "../staging/internal/validateLightPlacementShape";
import { validateStageCamera } from "../staging/internal/validateStageCamera";

/**
 * The STAGING consumer: fold the script's cast and the staging write's
 * placements into the {@link IAutoMovieScene} every later stage performs into,
 * or return every violation for the correction round.
 *
 * Referential integrity is the core check: every placement names a cast member,
 * every cast member is placed, ids are unique across actors, set pieces,
 * cameras and lights, a mount rides another placed actor, and a camera's
 * `lookAt` node is a placed actor, set piece or camera, the same table the
 * performance stage resolves positional targets against. Scalars are
 * range-checked where a later stage could not use them: finite positions and
 * turns, a unit set rotation not combined with `facingDeg`, a positive finite
 * set scale, a field of view in `(0, 180)` degrees, `0 < near < far`, the
 * camera's depth precision and clearance envelope, a non-negative light
 * intensity, each light's shape, and a finite derived camera look direction
 * that does not collapse to its own position. Geometry is converted, not
 * judged: whether 0.7 m is striking range is the reviewer's business.
 *
 * Conversions: an actor's `facingDeg`, about `+Y` with 0 facing `+Z`, becomes
 * its rotation; a set piece becomes a static node through
 * {@link setPieceTransform}; a camera's `lookAt` resolves to a point and the
 * level-horizon look basis aims its `-Z` there; a light lowers through
 * {@link lowerLightPlacement} to the scene light its `type` names.
 *
 * The optional `space`, the ground's walkable meaning, is accepted by
 * {@link validateSpace} with its paths re-rooted under `$input.space`, and is
 * composed as `space: null` when omitted, the scalar ground plane. An authored
 * `fog` lowers verbatim, while `fogVisibility` solves the density from
 * camera-axis depth and transmittance. {@link resolveStagedFog} admits one form
 * and leaves fog absent when neither is authored. A `medium` is admitted by
 * {@link resolveStagedMedium}, refused beside either fog form, and lowered
 * verbatim. The optional `environment` is checked by
 * {@link validateSceneEnvironment} against the staged lights and lowered
 * verbatim.
 *
 * @param script The screenplay whose cast staging must place.
 * @param staging The staging write.
 * @returns The composed scene with its persistent mounts and authored actor
 *   support scopes, or every violation.
 */
export function stageScene(
  script: IAutoMovieScript,
  staging: IAutoMovieStage,
): IAutoMovieStagedSet {
  const out: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  const set: IAutoMovieStageSetPiece[] = staging.set ?? [];
  const claim: ReturnType<typeof prepareStageNodeClaim> =
    prepareStageNodeClaim(out);
  const cast: Map<string, IAutoMovieScript["cast"][number]> = admitStageCast(
    script.cast,
    staging.actors,
    claim,
    out,
  );
  // What a camera may aim at: an actor, a set piece, or another camera, the
  // table `performShot` resolves positional targets against. Cameras go in
  // first, the precedence `scenePlacements` uses, so an id illegally repeated
  // between a camera and an actor resolves to the actor in both tables. A
  // camera naming itself is refused by the zero-length look check below.
  const placedPoints: Map<string, IAutoMovieVector3> = new Map([
    ...staging.cameras.map(
      (camera: IAutoMovieStageCamera): [string, IAutoMovieVector3] => [
        camera.node,
        camera.position,
      ],
    ),
    ...staging.actors.map(
      (actor: IAutoMovieStageActor): [string, IAutoMovieVector3] => [
        actor.node,
        actor.position,
      ],
    ),
    ...set.map(
      (piece: IAutoMovieStageSetPiece): [string, IAutoMovieVector3] => [
        piece.node,
        piece.position,
      ],
    ),
  ]);

  set.forEach((piece: IAutoMovieStageSetPiece, i: number): void => {
    const path: string = `$input.set[${i}]`;
    claim(piece.node, `${path}.node`);

    if (piece.facingDeg !== undefined && piece.rotation !== undefined)
      out.push(
        "type",
        `${path}.rotation`,
        "set rotation and facingDeg are mutually exclusive",
        piece.rotation,
      );
    if (piece.rotation !== undefined) {
      const components: number[] = [
        piece.rotation.x,
        piece.rotation.y,
        piece.rotation.z,
        piece.rotation.w,
      ];
      const length: number = Math.hypot(...components);
      if (Math.abs(length - 1) > UNIT_QUATERNION_TOLERANCE)
        out.push(
          "range",
          `${path}.rotation`,
          `set rotation must be a finite unit quaternion, but length was ${length}`,
          piece.rotation,
        );
    }
    if (piece.scale !== undefined) {
      // A zero axis collapses volume and can leave planar geometry; a negative
      // axis mirrors the piece and reverses its orientation.
      const scale: IAutoMovieVector3 = setPieceScale(piece.scale);
      if (
        ![scale.x, scale.y, scale.z].every((axis: number): boolean => axis > 0)
      )
        out.push(
          "range",
          `${path}.scale`,
          "set scale must be finite and greater than zero on every axis",
          piece.scale,
        );
    }
  });

  let supportSpace: IAutoMovieSpace | undefined;
  if (staging.space !== undefined) {
    const validated: IAutoMovieValidation = validateSpace({
      space: staging.space,
    });
    if (validated.success === false)
      for (const item of validated.violations)
        out.items.push(reRooted(item, "$input.space"));
    else supportSpace = staging.space;
  }
  const supports: NonNullable<IAutoMovieStagedSet.ISuccess["supports"]> =
    admitStageSupport(staging.actors, supportSpace, out);
  const fog: IAutoMovieFog | undefined = resolveStagedFog(
    staging.fog,
    staging.fogVisibility,
    out,
  );
  const medium: IAutoMovieMedium | undefined = resolveStagedMedium(
    staging,
    out,
  );
  if (staging.environment !== undefined) {
    const validated: IAutoMovieValidation = validateSceneEnvironment({
      environment: staging.environment,
      lights: staging.lights.map(
        (
          light: IAutoMovieStageLight,
        ): Pick<IAutoMovieLight, "id" | "type" | "castShadow"> => ({
          id: light.node,
          type: lightTypeOf(light),
          castShadow: light.castShadow,
        }),
      ),
    });
    // Light paths already name the staged lights, which share their indexes.
    if (validated.success === false)
      for (const item of validated.violations)
        out.items.push(
          item.path.startsWith("$input.lights[")
            ? item
            : reRooted(item, "$input.environment"),
        );
  }

  const cameraDirections: Map<IAutoMovieStageCamera, IAutoMovieVector3> =
    new Map();
  staging.cameras.forEach((camera: IAutoMovieStageCamera, i: number): void => {
    const path: string = `$input.cameras[${i}]`;
    claim(camera.node, `${path}.node`);
    const direction: IAutoMovieVector3 | undefined = validateStageCamera(
      camera,
      path,
      placedPoints,
      out,
    );
    if (direction !== undefined) cameraDirections.set(camera, direction);
  });

  staging.lights.forEach((light: IAutoMovieStageLight, i: number): void => {
    const path: string = `$input.lights[${i}]`;
    claim(light.node, `${path}.node`);
    validateLightPlacementShape(light, path, out);
  });

  if (out.items.length > 0) return { success: false, violations: out.items };

  const nodes: IAutoMovieSceneNode[] = [
    ...staging.actors.map(
      (actor: IAutoMovieStageActor): IAutoMovieSceneNode => ({
        id: actor.node,
        model: cast.get(actor.node)!.modelRef ?? actor.node,
        transform: Transform.of(
          actor.position,
          Quaternion.fromAxisAngle(UP, actor.facingDeg),
        ),
        motion: null,
        pose: null,
      }),
    ),
    // Set pieces are scenery: static nodes of skeleton-less models, so the
    // guide passes describe a world, not a void.
    ...set.map(
      (piece: IAutoMovieStageSetPiece): IAutoMovieSceneNode => ({
        id: piece.node,
        model: piece.model,
        transform: setPieceTransform(piece),
        motion: null,
        pose: null,
      }),
    ),
  ];
  const cameras: IAutoMovieCamera[] = staging.cameras.map(
    (camera: IAutoMovieStageCamera): IAutoMovieCamera => {
      return {
        id: camera.node,
        transform: Transform.of(
          camera.position,
          lookRotation(cameraDirections.get(camera)!),
        ),
        fovY: camera.fovDeg,
        near: camera.near,
        far: camera.far,
        depthPrecision: { ...camera.depthPrecision },
        ...(camera.clearance === undefined
          ? {}
          : { clearance: lowerCameraClearanceEnvelope(camera.clearance) }),
      };
    },
  );
  const lights: IAutoMovieLight[] = staging.lights.map(lowerLightPlacement);
  const mounts: IAutoMovieStagedSet.IMount[] = staging.actors.flatMap(
    (actor: IAutoMovieStageActor): IAutoMovieStagedSet.IMount[] =>
      actor.attach === undefined
        ? []
        : [{ node: actor.node, binding: actor.attach }],
  );

  return {
    success: true,
    scene: {
      id: staging.scene.id,
      name: staging.scene.name,
      nodes,
      cameras,
      lights,
      // Always stated: `null` is the decision "no space, use the scalar
      // ground plane", not an absent field.
      space: staging.space ?? null,
      // Omitted when unstaged: most sets have no atmosphere, and writing
      // `fog: null` would change the bytes, and so the content digest, of
      // every production that never mentioned fog.
      ...(fog === undefined ? {} : { fog }),
      ...(medium === undefined ? {} : { medium }),
      ...(staging.environment === undefined
        ? {}
        : { environment: staging.environment }),
    },
    mounts,
    ...(supports.length === 0 ? {} : { supports }),
  };
}

/** World up, the axis an actor's `facingDeg` turns about. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** Largest accepted deviation of a set rotation's length from one. */
const UNIT_QUATERNION_TOLERANCE: number = 1e-6;

/** A delegated validator's violation with its `$input` root moved to `root`. */
function reRooted(
  item: IAutoMovieConstraintViolation,
  root: string,
): IAutoMovieConstraintViolation {
  return {
    ...item,
    path: item.path.replace("$input", root),
  };
}
