import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieMotionHumanBody, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

/** The record of `IFrameGrip`'s site. */
type IFrameGrip = { side: AutoMovieHumanSide; bone?: AutoMovieHumanoidBone };

/**
 * Where a held prop is: the frame a hand holds it in, and a prop held in both
 * of a performer's hands as one rigid thing between them, each hand's grip
 * socket keeping its place on the prop, so neither hand alone turns it.
 *
 * Each grip has held the prop at a fixed offset since it closed, which puts
 * each hand's grip socket at a fixed point of the prop. The prop's frame is the
 * rigid one that lays the line between those two points on the line between the
 * two sockets, its middle on their middle, and its turn about that line halfway
 * between the turns the two hands give it: two points fix a rigid body but for
 * that one turn, which the two fists share.
 */
export namespace HumanPropHold {
  /**
   * One hand on the prop: its grip socket's frame and the prop's frame in it,
   * the offset its grip keeps.
   */
  export interface IHand {
    /** The hand's grip socket, world. */
    hand: IAutoMovieRigidTransform;

    /** The prop's frame in the hand's grip frame. */
    offset: IAutoMovieRigidTransform;
  }

  /**
   * The prop's frame held in two hands.
   *
   * @param a The hand that carries it.
   * @param b The other hand.
   * @returns The prop's world frame.
   */
  export function fit(a: IHand, b: IHand): IAutoMovieRigidTransform {
    const turn: (h: IHand) => IAutoMovieQuaternion = (
      h: IHand,
    ): IAutoMovieQuaternion =>
      Quaternion.normalize(
        Quaternion.multiply(h.hand.rotation, h.offset.rotation),
      );
    // Where each socket is on the prop: the hand's origin in the prop's frame.
    const local: (h: IHand) => IAutoMovieVector3 = (
      h: IHand,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        Quaternion.inverse(h.offset.rotation),
        Vector3.scale(h.offset.position, -1),
      );
    const blended: IAutoMovieQuaternion = Quaternion.slerp(
      turn(a),
      turn(b),
      0.5,
    );
    const along: IAutoMovieVector3 = Quaternion.rotateVector(
      blended,
      Vector3.subtract(local(b), local(a)),
    );
    const between: IAutoMovieVector3 = Vector3.subtract(
      b.hand.position,
      a.hand.position,
    );
    const axis: IAutoMovieVector3 = Vector3.cross(along, between);
    const sine: number = Vector3.length(axis);
    const cosine: number = Vector3.dot(along, between);
    const rotation: IAutoMovieQuaternion =
      Vector3.length(along) < 1e-9 ||
      Vector3.length(between) < 1e-9 ||
      (sine < 1e-9 && cosine > 0)
        ? blended
        : Quaternion.normalize(
            Quaternion.multiply(
              sine < 1e-9
                ? Quaternion.fromAxisAngle(across(blended, along), 180)
                : Quaternion.fromAxisAngle(
                    Vector3.scale(axis, 1 / sine),
                    (Math.atan2(sine, cosine) * 180) / Math.PI,
                  ),
              blended,
            ),
          );
    const middle: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(local(a), local(b)),
      0.5,
    );
    return {
      position: Vector3.subtract(
        Vector3.scale(Vector3.add(a.hand.position, b.hand.position), 0.5),
        Quaternion.rotateVector(rotation, middle),
      ),
      rotation,
    };
  }

  /**
   * The axis a prop whose line points opposite the sockets' turns half a turn
   * about: across the line, along the prop's up as the hands turn it (its `+Y`,
   * or its `+X` where the up lies on the line), so the half turn keeps that up
   * and the roll the two hands share.
   */
  function across(
    blended: IAutoMovieQuaternion,
    along: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const unit: IAutoMovieVector3 = Vector3.normalize(along);
    const off: (local: IAutoMovieVector3) => IAutoMovieVector3 = (
      local: IAutoMovieVector3,
    ): IAutoMovieVector3 => {
      const v: IAutoMovieVector3 = Quaternion.rotateVector(blended, local);
      return Vector3.subtract(v, Vector3.scale(unit, Vector3.dot(v, unit)));
    };
    const up: IAutoMovieVector3 = off({ x: 0, y: 1, z: 0 });
    return Vector3.normalize(
      Vector3.length(up) < 1e-9 ? off({ x: 1, y: 0, z: 0 }) : up,
    );
  }

  /**
   * Where a grip holds a prop on given bones: the hand's grip socket with the
   * hand bone's world rotation, or the bone a worn span rides.
   *
   * @param body The body the bones are of.
   * @param bones The bones.
   * @param grip The holding hand, and the bone of a worn span.
   * @returns The frame.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    grip: IFrameGrip,
  ): IAutoMovieRigidTransform {
    if (grip.bone !== undefined) {
      const bone: IAutoMovieResolvedBone = bones.get(grip.bone)!;
      return { position: bone.worldPosition, rotation: bone.worldRotation };
    }
    const socket: IAutoMovieMotionHumanBody["surfaces"]["sockets"]["gripLeft"] =
      body.surfaces.sockets[grip.side === "left" ? "gripLeft" : "gripRight"];
    const bone: IAutoMovieResolvedBone = bones.get(socket.bone)!;
    return {
      position: AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(socket, bone).point,
      rotation: bone.worldRotation,
    };
  }
}
