import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../../measure/IAutoMovieHumanLandmarks";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";

/**
 * The head's own frame and its landmarks in that frame, the coordinates the head generator shapes in.
 *
 * The origin is the midpoint of the two tragions, the ear canals' level, and the axes follow the skull rather than the model: `x` runs from the right tragion to the left, `y` is the head bone's direction from the atlanto-occipital joint to the vertex made perpendicular to `x`, and `z = x × y` points to the face. In the rest pose the head stands in the Frankfort plane, so these axes coincide with the model's, but every shape rule reads only this frame, so a skeleton that carries the head forward or tilts it moves the whole head with it.
 *
 * Bilateral landmarks are given for the person's left side only, with positive `x`; the head is built symmetric and mirrored.
 *
 * @param skeleton The person's skeleton at rest
 * @returns The frame and the head's landmarks in it, millimetres
 */
export function frameAutoMovieHumanHead(
  skeleton: IAutoMovieHumanSkeleton,
): frameAutoMovieHumanHead.IFrame {
  const landmarks: IAutoMovieHumanLandmarks = skeleton.landmarks;
  const joint = (bone: string): IAutoMovieHumanSkeleton.IJoint => {
    const found: IAutoMovieHumanSkeleton.IJoint | undefined =
      skeleton.joints.find(
        (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === bone,
      );
    if (found === undefined) throw new Error(`skeleton lacks bone ${bone}`);
    return found;
  };
  const left: IAutoMovieVector3 = landmarks.left.tragion.position;
  const right: IAutoMovieVector3 = landmarks.right.tragion.position;
  const origin: IAutoMovieVector3 = AutoMovieHumanVector.offset(
    AutoMovieHumanVector.of(0, 0, 0),
    [left, 0.5],
    [right, 0.5],
  );
  const x: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(left, [right, -1]),
  );
  const head: IAutoMovieHumanSkeleton.IJoint = joint("head");
  const up: IAutoMovieVector3 = AutoMovieHumanVector.offset(head.tail, [
    head.position,
    -1,
  ]);
  const y: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(up, [x, -AutoMovieHumanVector.dot(up, x)]),
  );
  const z: IAutoMovieVector3 = AutoMovieHumanVector.cross(x, y);
  const frame: frameAutoMovieHumanHead.IAxes = { origin, x, y, z };
  const local = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    frameAutoMovieHumanHead.toLocal(frame, p);
  const eye: IAutoMovieHumanSkeleton.IJoint = joint("leftEye");
  return {
    ...frame,
    vertex: local(landmarks.vertex.position),
    glabella: local(landmarks.glabella.position),
    nasion: local(landmarks.nasion.position),
    opisthocranion: local(landmarks.opisthocranion.position),
    stomion: local(landmarks.stomion.position),
    menton: local(landmarks.menton.position),
    tragion: local(left),
    eurion: local(landmarks.left.eurion.position),
    zygion: local(landmarks.left.zygion.position),
    frontotemporale: local(landmarks.left.frontotemporale.position),
    gonion: local(landmarks.left.gonion.position),
    eye: local(eye.position),
    cornea: local(eye.tail),
    headJoint: local(head.position),
    neckJoint: local(joint("neck").position),
    cervicale: local(landmarks.cervicale.position),
  };
}
/** The head frame {@link frameAutoMovieHumanHead} returns, and conversion between it and the model frame. */
export namespace frameAutoMovieHumanHead {
  /**
   * An orthonormal frame placed in the model.
   *
   * @author Samchon
   */
  export interface IAxes {
    /** Origin, model frame, millimetres. */
    origin: IAutoMovieVector3;

    /** Unit axis toward the person's left. */
    x: IAutoMovieVector3;

    /** Unit axis toward the vertex. */
    y: IAutoMovieVector3;

    /** Unit axis toward the face. */
    z: IAutoMovieVector3;
  }

  /**
   * The head frame with the head's landmarks in it, millimetres.
   *
   * @author Samchon
   */
  export interface IFrame extends IAxes {
    vertex: IAutoMovieVector3;
    glabella: IAutoMovieVector3;
    nasion: IAutoMovieVector3;
    opisthocranion: IAutoMovieVector3;
    stomion: IAutoMovieVector3;
    menton: IAutoMovieVector3;

    /** Left tragion. */
    tragion: IAutoMovieVector3;

    /** Left eurion. */
    eurion: IAutoMovieVector3;

    /** Left zygion. */
    zygion: IAutoMovieVector3;

    /** Left frontotemporale. */
    frontotemporale: IAutoMovieVector3;

    /** Left gonion. */
    gonion: IAutoMovieVector3;

    /** Centre of the left eyeball. */
    eye: IAutoMovieVector3;

    /** Front of the left cornea, the left eye bone's tail. */
    cornea: IAutoMovieVector3;

    /** Atlanto-occipital joint centre. */
    headJoint: IAutoMovieVector3;

    /** Lower end of the neck bone. */
    neckJoint: IAutoMovieVector3;

    /** Seventh cervical spinous process. */
    cervicale: IAutoMovieVector3;
  }

  /**
   * Express a model point in a frame.
   *
   * @param frame The frame
   * @param p Model point
   * @returns Local coordinates
   */
  export function toLocal(
    frame: IAxes,
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const d: IAutoMovieVector3 = AutoMovieHumanVector.offset(p, [
      frame.origin,
      -1,
    ]);
    return AutoMovieHumanVector.of(
      AutoMovieHumanVector.dot(d, frame.x),
      AutoMovieHumanVector.dot(d, frame.y),
      AutoMovieHumanVector.dot(d, frame.z),
    );
  }

  /**
   * Place a local point in the model.
   *
   * @param frame The frame
   * @param p Local coordinates
   * @returns Model point
   */
  export function toModel(
    frame: IAxes,
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return AutoMovieHumanVector.offset(
      frame.origin,
      [frame.x, p.x],
      [frame.y, p.y],
      [frame.z, p.z],
    );
  }
}
