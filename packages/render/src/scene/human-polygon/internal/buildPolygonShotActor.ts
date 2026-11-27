import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieHumanSkeleton,
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionRenderLayer,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieShot,
  IAutoMovieVector3,
} from "@automovie/interface";
import { Quaternion, Vector3 } from "three";

import type { AutoMovieHumanPolygon } from "../../AutoMovieHumanPolygon.js";
import { buildHumanPolygon } from "./buildHumanPolygon.js";

/**
 * Build a polygon actor and its source-frame sampler for a compiled shot. A
 * film host mounts the drawing in the shot scene and supplies `drawLayer` as a
 * layer preparation callback. Its source frame accounts for cuts and trims. If
 * an actor frame is supplied, the sampler also places the drawing at that world
 * frame under its rigid parent. Without a supplied frame the cue's shot axes
 * coincide with the drawing's axes at the origin. Dispose the drawing with the
 * usual polygon drawing owner.
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
  /**
   * Deterministic, synchronous actor rigid frame at shot-local time in
   * scene-world axes. Detach sampling can read the same time again.
   */
  actorFrameAt?: (seconds: number) => IAutoMovieRigidTransform;
  /** Production frame grid used by the layer's source frame. */
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
      const seconds: number = AutoMovieEngineFilm.productionFrameBoundaryToSeconds({
        frame: layer.sourceFrame,
        frameRate,
      });
      if (actorFrameAt === undefined) {
        drawing.drawAt!(seconds);
        return;
      }
      const {
        position: translation,
        rotation: orientation,
      }: IAutoMovieRigidTransform = actorFrameAt(seconds);
      const { x: tx, y: ty, z: tz }: IAutoMovieVector3 = translation;
      const { x, y, z, w }: IAutoMovieQuaternion = orientation;
      if (Math.abs(x ** 2 + y ** 2 + z ** 2 + w ** 2 - 1) > 1e-6)
        throw new Error(`Invalid staging frame for polygon actor ${subject}`);
      const position: Vector3 = new Vector3(tx, ty, tz);
      const rotation: Quaternion = new Quaternion(x, y, z, w).normalize();
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
