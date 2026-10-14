import {
  IAutoMovieCamera,
  IAutoMovieConstraintViolation,
  IAutoMovieLight,
  IAutoMovieSceneNode,
  IAutoMovieScript,
  IAutoMovieStage,
  IAutoMovieStageActor,
  IAutoMovieStageCamera,
  IAutoMovieStageLight,
  IAutoMovieStageSetPiece,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";
import { collectNonEmptyId } from "../validation/collectNonEmptyId";
import { describeInvalidValue } from "../validation/describeInvalidValue";
import { validateSceneEnvironment } from "../validation/validateSceneEnvironment";
import { validateSpace } from "../validation/validateSpace";
import { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";
import { lookRotation } from "./lookRotation";
import { isFiniteStageVector3 } from "./staging/isFiniteStageVector3";
import { lightTypeOf } from "./staging/lightTypeOf";
import { lowerCameraClearanceEnvelope } from "./staging/lowerCameraClearanceEnvelope";
import { lowerLightPlacement } from "./staging/lowerLightPlacement";
import { setPieceScale } from "./staging/setPieceScale";
import { setPieceTransform } from "./staging/setPieceTransform";
import { validateCameraClearanceEnvelope } from "./staging/validateCameraClearanceEnvelope";
import { validateCameraDepthPrecision } from "./staging/validateCameraDepthPrecision";
import { validateFogPlacement } from "./staging/validateFogPlacement";
import { validateLightPlacementShape } from "./staging/validateLightPlacementShape";

/** World up, the axis an actor's `facingDeg` turns about. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** Largest accepted deviation of a set rotation's length from one. */
const UNIT_QUATERNION_TOLERANCE: number = 1e-6;

/** A camera and its target closer than this, in metres, have no look axis. */
const LOOK_DISTANCE_EPSILON: number = 1e-9;

/**
 * The STAGING consumer: fold the script's cast and the staging write's placements into the {@link IAutoMovieScene} every later stage performs into, or return every violation for the correction round.
 *
 * Referential integrity is the core check: every placement names a cast member, every cast member is placed, ids are non-blank and unique across actors, set pieces, cameras and lights, a mount rides another placed actor, and a camera's `lookAt` node is a placed actor, set piece or camera, the same table the performance stage resolves positional targets against. Scalars are range-checked where a later stage could not use them: finite positions and turns, a unit set rotation not combined with `facingDeg`, a positive finite set scale, a field of view in `(0, 180)` degrees, `0 < near < far`, the camera's depth precision and clearance envelope, a non-negative light intensity, each light's shape, and a finite derived camera look direction that does not collapse to its own position. Geometry is converted, not judged: whether 0.7 m is striking range is the reviewer's business.
 *
 * Conversions: an actor's `facingDeg`, about `+Y` with 0 facing `+Z`, becomes its rotation; a set piece becomes a static node through {@link setPieceTransform}; a camera's `lookAt` resolves to a point and the level-horizon look basis aims its `-Z` there; a light lowers through {@link lowerLightPlacement} to the scene light its `type` names.
 *
 * The optional `space`, the ground's walkable meaning, is accepted by {@link validateSpace} with its paths re-rooted under `$input.space`, and is composed as `space: null` when omitted, the scalar ground plane. The optional `fog` is range-checked by {@link validateFogPlacement} and lowered verbatim, and is omitted from the scene when unstaged so scenes that never mention fog keep their bytes. The optional `environment` is checked by {@link validateSceneEnvironment} against the staged lights and lowered verbatim.
 *
 * @param script The screenplay whose cast staging must place.
 * @param staging The staging write.
 * @returns The composed scene with its persistent mounts, or every violation.
 *
 * @evidence contracts/common.md#principled-implementation Validates the whole write before composing; conversions use quaternion axis-angle, the level-horizon lookRotation basis and light lowering. The camera target table lays cameras down first so a repeated id resolves to the actor, matching scenePlacements.
 * @evidence contracts/common.md#clear-and-simple-design The rung that owns scene composition delegates each field family to its staging validator and lowering helper, the space, fog and environment gates to their shared validators, and set-piece placement to `setPieceTransform`, so the same rule is never stated twice and the function reads as the list of checks and conversions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cast member, model or camera is special-cased; geometry is not judged beyond what a later stage cannot use, and the fog omission is a stated byte-stability rule for every scene rather than a fixture exception.
 * @evidence contracts/common.md#meaningful-documentation States every reference and range check, every conversion with its axis and unit, how space, fog and environment are validated and composed, and what the success and failure branches carry.
 * @evidence contracts/performance.md#efficient-algorithms Local joins visit cast, actor, set-piece, camera and light lists with maps/sets, plus inspected identity/diagnostic text and delegated space, environment, fog, clearance and light-shape validation. Ordinary populated typed records are premises; throwing accessors and nonterminating conversion hooks are outside the located-finding guarantee.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares placement indexes and admitted camera directions between validation and composition during one unchanged staging write. The script and write may change between correction rounds, so nothing is kept across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The indexes, id set and collector are released on return; a success holds one node per actor and set piece, one camera and one light per placement, and the authored space, fog and environment objects by reference, and a failure holds the violation list.
 */
export function stageScene(
  script: IAutoMovieScript,
  staging: IAutoMovieStage,
): IAutoMovieStagedSet {
  const out: ViolationCollector = new ViolationCollector();
  const set: IAutoMovieStageSetPiece[] = staging.set ?? [];
  const cast: Map<string, IAutoMovieScript["cast"][number]> = new Map();
  const castIndex: Map<string, number> = new Map();
  script.cast.forEach(
    (member: IAutoMovieScript["cast"][number], index: number): void => {
      const existing: number | undefined = castIndex.get(member.node);
      if (existing !== undefined) {
        out.push(
          "type",
          `$script.cast[${index}].node`,
          `script cast node "${describeInvalidValue(member.node)}" is duplicated; first declared at $script.cast[${existing}].node`,
          member.node,
        );
        return;
      }
      cast.set(member.node, member);
      castIndex.set(member.node, index);
    },
  );
  const placed: Set<string> = new Set(
    staging.actors.map((actor: IAutoMovieStageActor): string => actor.node),
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

  collectNonEmptyId(staging.scene.id, "$input.scene.id", "scene id", out);
  script.cast.forEach(
    (member: IAutoMovieScript["cast"][number], i: number): void => {
      if (member.modelRef !== null)
        collectNonEmptyId(
          member.modelRef,
          `$script.cast[${i}].modelRef`,
          "cast model reference",
          out,
        );
      if (!placed.has(member.node))
        out.push(
          "type",
          "$input.actors",
          `cast node "${describeInvalidValue(member.node)}" (cast[${i}]) must be placed by staging`,
          member.node,
        );
    },
  );

  const ids: Set<string> = new Set();
  function claim(id: string, path: string, label: string): void {
    collectNonEmptyId(id, path, label, out);
    if (ids.has(id))
      out.push(
        "type",
        path,
        `id "${describeInvalidValue(id)}" must be unique in the scene`,
        id,
      );
    ids.add(id);
  }

  staging.actors.forEach((actor: IAutoMovieStageActor, i: number): void => {
    const path: string = `$input.actors[${i}]`;
    claim(actor.node, `${path}.node`, "actor node id");
    if (!cast.has(actor.node))
      out.push(
        "type",
        `${path}.node`,
        `placement must name a script cast node, but "${describeInvalidValue(actor.node)}" is not in the cast`,
        actor.node,
      );
    if (!isFiniteStageVector3(actor.position))
      out.push(
        "range",
        `${path}.position`,
        "actor position must be a finite vector",
        actor.position,
      );
    if (!Number.isFinite(actor.facingDeg))
      out.push(
        "range",
        `${path}.facingDeg`,
        `actor facingDeg must be finite, but was ${describeInvalidValue(actor.facingDeg)}`,
        actor.facingDeg,
      );
    if (actor.attach === undefined) return;
    if (actor.attach.parent === actor.node)
      out.push(
        "type",
        `${path}.attach.parent`,
        "a node cannot ride itself",
        actor.attach.parent,
      );
    else if (!placed.has(actor.attach.parent))
      out.push(
        "type",
        `${path}.attach.parent`,
        `mount parent "${describeInvalidValue(actor.attach.parent)}" must be a placed actor`,
        actor.attach.parent,
      );
  });

  set.forEach((piece: IAutoMovieStageSetPiece, i: number): void => {
    const path: string = `$input.set[${i}]`;
    claim(piece.node, `${path}.node`, "set node id");
    collectNonEmptyId(piece.model, `${path}.model`, "set model id", out);
    if (!isFiniteStageVector3(piece.position))
      out.push(
        "range",
        `${path}.position`,
        "set position must be a finite vector",
        piece.position,
      );
    if (piece.facingDeg !== undefined && !Number.isFinite(piece.facingDeg))
      out.push(
        "range",
        `${path}.facingDeg`,
        `set facingDeg must be finite when present, but was ${describeInvalidValue(piece.facingDeg)}`,
        piece.facingDeg,
      );
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
      if (
        !components.every(Number.isFinite) ||
        Math.abs(length - 1) > UNIT_QUATERNION_TOLERANCE
      )
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
        ![scale.x, scale.y, scale.z].every(
          (axis: number): boolean => Number.isFinite(axis) && axis > 0,
        )
      )
        out.push(
          "range",
          `${path}.scale`,
          "set scale must be finite and greater than zero on every axis",
          piece.scale,
        );
    }
  });

  if (staging.space !== undefined) {
    const validated: IAutoMovieValidation = validateSpace({
      space: staging.space,
    });
    if (validated.success === false)
      for (const item of validated.violations)
        out.items.push(reRooted(item, "$input.space"));
  }
  if (staging.fog !== undefined)
    validateFogPlacement(staging.fog, "$input.fog", out);
  if (staging.environment !== undefined) {
    const validated: IAutoMovieValidation = validateSceneEnvironment({
      environment: staging.environment,
      lights: staging.lights.map(
        (
          light: IAutoMovieStageLight,
        ): Pick<IAutoMovieLight, "id" | "type" | "castShadow"> => ({
          id: light.node,
          // A light of an unknown type is refused by its own shape check.
          type: lightTypeOf(light) ?? "directional",
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
    claim(camera.node, `${path}.node`, "camera node id");
    const positionFinite: boolean = isFiniteStageVector3(camera.position);
    if (!positionFinite)
      out.push(
        "range",
        `${path}.position`,
        "camera position must be a finite vector",
        camera.position,
      );
    if (
      typeof camera.fovDeg !== "number" ||
      !(camera.fovDeg > 0 && camera.fovDeg < 180)
    )
      out.push(
        "range",
        `${path}.fovDeg`,
        `vertical field of view must be within (0, 180)°, but was ${describeInvalidValue(camera.fovDeg)}`,
        camera.fovDeg,
      );
    if (!Number.isFinite(camera.near) || camera.near <= 0)
      out.push(
        "range",
        `${path}.near`,
        "camera near distance must be finite and greater than zero metres",
        camera.near,
      );
    if (
      !Number.isFinite(camera.far) ||
      (Number.isFinite(camera.near) &&
        camera.near > 0 &&
        camera.far <= camera.near)
    )
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
        `${path}.lookAt.node`,
        `camera target "${describeInvalidValue(camera.lookAt.node)}" must be a placed actor, set piece, or camera`,
        camera.lookAt.node,
      );
    if (
      camera.lookAt.kind === "point" &&
      !isFiniteStageVector3(camera.lookAt.point)
    )
      out.push(
        "range",
        `${path}.lookAt.point`,
        "camera point target must be a finite vector",
        camera.lookAt.point,
      );
    const target: IAutoMovieVector3 | undefined =
      camera.lookAt.kind === "node"
        ? placedPoints.get(camera.lookAt.node)
        : camera.lookAt.point;
    if (
      target !== undefined &&
      positionFinite &&
      isFiniteStageVector3(target)
    ) {
      const direction: IAutoMovieVector3 = Vector3.subtract(
        target,
        camera.position,
      );
      if (!isFiniteStageVector3(direction))
        out.push(
          "range",
          `${path}.lookAt`,
          "camera look direction must have finite components",
          camera.lookAt,
        );
      else if (Vector3.length(direction) < LOOK_DISTANCE_EPSILON)
        out.push(
          "range",
          `${path}.lookAt`,
          "camera lookAt must not equal the camera position",
          camera.lookAt,
        );
      else cameraDirections.set(camera, direction);
    }
    if (camera.clearance !== undefined)
      validateCameraClearanceEnvelope(
        camera.clearance,
        `${path}.clearance`,
        out,
      );
  });

  staging.lights.forEach((light: IAutoMovieStageLight, i: number): void => {
    const path: string = `$input.lights[${i}]`;
    claim(light.node, `${path}.node`, "light node id");
    if (!Number.isFinite(light.intensity) || light.intensity < 0)
      out.push(
        "range",
        `${path}.intensity`,
        `intensity must be a finite number >= 0, but was ${describeInvalidValue(light.intensity)}`,
        light.intensity,
      );
    validateLightPlacementShape(light, path, out);
  });

  if (out.items.length > 0) return { success: false, violations: out.items };

  const nodes: IAutoMovieSceneNode[] = [
    ...staging.actors.map(
      (actor: IAutoMovieStageActor): IAutoMovieSceneNode => ({
        id: actor.node,
        model: cast.get(actor.node)!.modelRef ?? actor.node,
        transform: {
          translation: actor.position,
          rotation: Quaternion.fromAxisAngle(UP, actor.facingDeg),
          scale: { x: 1, y: 1, z: 1 },
        },
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
        transform: {
          translation: camera.position,
          rotation: lookRotation(cameraDirections.get(camera)!),
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
      ...(staging.fog === undefined ? {} : { fog: staging.fog }),
      ...(staging.environment === undefined
        ? {}
        : { environment: staging.environment }),
    },
    mounts,
  };
}

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
