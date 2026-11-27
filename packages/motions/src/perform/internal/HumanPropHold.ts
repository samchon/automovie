import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieMotionHumanBody, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

/*
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
  /*
   * One hand on the prop: its grip socket's frame and the prop's frame in it,
   * the offset its grip keeps.
   */
  export interface IHand {
    /*
     * The hand's grip socket, world.
     */
    hand: IAutoMovieRigidTransform;

    /*
     * The prop's frame in the hand's grip frame.
     */
    offset: IAutoMovieRigidTransform;
  }

  /*
   * The prop's frame held in two hands.
   * Parameter a: The hand that carries it.
   * Parameter b: The other hand.
   * Returns: The prop's world frame.
   */
  export function fit(a: IHand, b: IHand): IAutoMovieRigidTransform {
    const turn: (h: IHand) => IAutoMovieQuaternion = (
      h: IHand,
    ): IAutoMovieQuaternion =>
      AutoMovieEngineQuaternion.normalize(
        AutoMovieEngineQuaternion.multiply(h.hand.rotation, h.offset.rotation),
      );
    // Where each socket is on the prop: the hand's origin in the prop's frame.
    const local: (h: IHand) => IAutoMovieVector3 = (
      h: IHand,
    ): IAutoMovieVector3 =>
      AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.inverse(h.offset.rotation),
        AutoMovieEngineVector3.scale(h.offset.position, -1),
      );
    const blended: IAutoMovieQuaternion = AutoMovieEngineQuaternion.slerp(
      turn(a),
      turn(b),
      0.5,
    );
    const along: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      blended,
      AutoMovieEngineVector3.subtract(local(b), local(a)),
    );
    const between: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      b.hand.position,
      a.hand.position,
    );
    const axis: IAutoMovieVector3 = AutoMovieEngineVector3.cross(along, between);
    const sine: number = AutoMovieEngineVector3.length(axis);
    const cosine: number = AutoMovieEngineVector3.dot(along, between);
    const rotation: IAutoMovieQuaternion =
      AutoMovieEngineVector3.length(along) < 1e-9 ||
      AutoMovieEngineVector3.length(between) < 1e-9 ||
      (sine < 1e-9 && cosine > 0)
        ? blended
        : AutoMovieEngineQuaternion.normalize(
            AutoMovieEngineQuaternion.multiply(
              sine < 1e-9
                ? AutoMovieEngineQuaternion.fromAxisAngle(across(blended, along), 180)
                : AutoMovieEngineQuaternion.fromAxisAngle(
                    AutoMovieEngineVector3.scale(axis, 1 / sine),
                    (Math.atan2(sine, cosine) * 180) / Math.PI,
                  ),
              blended,
            ),
          );
    const middle: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
      AutoMovieEngineVector3.add(local(a), local(b)),
      0.5,
    );
    return {
      position: AutoMovieEngineVector3.subtract(
        AutoMovieEngineVector3.scale(AutoMovieEngineVector3.add(a.hand.position, b.hand.position), 0.5),
        AutoMovieEngineQuaternion.rotateVector(rotation, middle),
      ),
      rotation,
    };
  }

  /*
   * Where a grip holds a prop on given bones: the hand's grip socket with the
   * hand bone's world rotation, or the bone a worn span rides.
   * Parameter body: The body the bones are of.
   * Parameter bones: The bones.
   * Parameter grip: The holding hand, and the bone of a worn span.
   * Returns: The frame.
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

  /*
   * The axis a prop whose line points opposite the sockets' turns half a turn
   * about: across the line, along the prop's up as the hands turn it (its `+Y`,
   * or its `+X` where the up lies on the line), so the half turn keeps that up
   * and the roll the two hands share.
   */
  function across(
    blended: IAutoMovieQuaternion,
    along: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const unit: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(along);
    const off: (local: IAutoMovieVector3) => IAutoMovieVector3 = (
      local: IAutoMovieVector3,
    ): IAutoMovieVector3 => {
      const v: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(blended, local);
      return AutoMovieEngineVector3.subtract(v, AutoMovieEngineVector3.scale(unit, AutoMovieEngineVector3.dot(v, unit)));
    };
    const up: IAutoMovieVector3 = off({ x: 0, y: 1, z: 0 });
    return AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.length(up) < 1e-9 ? off({ x: 1, y: 0, z: 0 }) : up,
    );
  }
}

/*
 * The record of `IFrameGrip`'s site.
 */
type IFrameGrip = { side: AutoMovieHumanSide; bone?: AutoMovieHumanoidBone };
