import { productionFrameBoundaryToSeconds } from "@automovie/engine";
import type {
  IAutoMovieHumanSkeleton,
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionRenderLayer,
  IAutoMovieRigidTransform,
  IAutoMovieShot,
} from "@automovie/interface";
import { Quaternion, Vector3 } from "three";

import type { AutoMovieHumanPolygon } from "./AutoMovieHumanPolygon.js";
import { buildHumanPolygon } from "./buildHumanPolygon.js";

/**
 * Build a polygon actor and its source-frame sampler for a compiled shot.
 * A film host mounts the drawing in the shot scene and supplies `drawLayer`
 * as a layer preparation callback. Its source frame accounts for cuts and
 * trims. If an actor frame is supplied, the sampler also places the drawing
 * at that world frame under its rigid parent. Without a supplied frame the
 * cue's shot axes coincide with the drawing's axes at the origin.
 * Dispose the drawing with the usual polygon drawing owner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the host's mounting, sampling and disposal responsibilities, along with the source time and frame conventions.
 * @evidence contracts/development/implementation.md#principled-implementation All passes read the same polygon node transform at the exact shot-local frame boundary.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build the existing drawing with its shot cues, then convert each layer's source frame through the production clock.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a layer from another shot and uses the timeline's source frame directly.
 * @evidence contracts/development/implementation.md#efficient-algorithms The polygon drawing and cue plan are built once. Each layer converts one frame and applies one sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the regular polygon drawing and the same rational clock as other production render passes.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned drawing owns the render resources. The sampler retains that drawing and the shot's fixed source clock.
 */
export function buildPolygonShotActor(input: {
  /** Compiled shot and its optional body presentation cues. */
  shot: Pick<IAutoMovieShot, "id" | "polygonBodyCues">;
  /** Staged actor id. */
  subject: string;
  /** Bind bones and placements used to build the polygon drawing. */
  opening: Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed">;
  /** Canonical body-frame pose at a shot-local time. */
  poseAt: (seconds: number) => Pick<IAutoMovieHumanSkeleton.IOutput, "posed">;
  /** Actor's scene-world rigid frame at shot-local time, including a static placement away from the origin. */
  actorFrameAt?: (seconds: number) => IAutoMovieRigidTransform;
  /** Compiled shot's exact frame rate. */
  frameRate: IAutoMovieProductionFrameRate;
  /** Optional palette by emitted bone name. */
  partColors?: Readonly<Record<string, number>>;
}): {
  /** Drawing to mount in the shot scene and dispose when finished. */
  drawing: AutoMovieHumanPolygon.IDrawing;
  /** Evaluate the visible actor for an admitted render layer of this shot. */
  drawLayer: (layer: IAutoMovieProductionRenderLayer) => void;
} {
  const {
    shot,
    subject,
    opening,
    poseAt,
    actorFrameAt,
    frameRate,
    partColors,
  } = input;
  const drawing: AutoMovieHumanPolygon.IDrawing = buildHumanPolygon(opening, {
    ...(partColors === undefined ? {} : { partColors }),
    presentation: {
      subject,
      cues: shot.polygonBodyCues ?? [],
      poseAt,
      ...(actorFrameAt === undefined ? {} : { actorFrameAt }),
    },
  });
  const shotId: string = shot.id;
  return {
    drawing,
    drawLayer: (layer: IAutoMovieProductionRenderLayer): void => {
      if (layer.shot !== shotId)
        throw new Error(`Polygon actor ${subject} belongs to shot ${shotId}`);
      const seconds: number = productionFrameBoundaryToSeconds({
        frame: layer.sourceFrame,
        frameRate,
      });
      const frame: IAutoMovieRigidTransform | undefined =
        actorFrameAt?.(seconds);
      if (frame === undefined) {
        drawing.drawAt!(seconds);
        return;
      }
      const position: Vector3 = new Vector3().copy(frame.position);
      const rotation: Quaternion = new Quaternion().copy(frame.rotation);
      const squaredNorm: number = rotation.lengthSq();
      if (
        ![position.x, position.y, position.z].every(Number.isFinite) ||
        !Number.isFinite(squaredNorm) ||
        Math.abs(squaredNorm - 1) > 1e-6
      )
        throw new Error(`Invalid staging frame for polygon actor ${subject}`);
      rotation.normalize();
      const parent = drawing.object.parent;
      if (parent !== null) {
        parent.worldToLocal(position);
        rotation.premultiply(
          parent.getWorldQuaternion(new Quaternion()).invert(),
        );
      }
      drawing.drawAt!(seconds);
      drawing.object.position.copy(position);
      drawing.object.quaternion.copy(rotation);
      drawing.object.updateWorldMatrix(true, true);
    },
  };
}
