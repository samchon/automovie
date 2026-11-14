import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanProp } from "./IHumanProp";

/**
 * Where a held prop is: the frame a hand holds it in, and a prop held in
 * both of a performer's hands as one rigid thing between them, each hand's
 * grip socket keeping its place on the prop, so neither hand alone turns it.
 *
 * Each grip has held the prop at a fixed offset since it closed, which puts
 * each hand's grip socket at a fixed point of the prop. The prop's frame is
 * the rigid one that lays the line between those two points on the line
 * between the two sockets, its middle on their middle, and its turn about
 * that line halfway between the turns the two hands give it: two points fix a
 * rigid body but for that one turn, which the two fists share.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is fitted and why the turn about the line is shared.
 * @evidence contracts/development/design.md#principled-representation A rigid frame from two held points and two hand turns.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hand's holding frame and the two-hand fit, used by the prop reader.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop kind is named; the points are the grips' own offsets.
 */
export namespace HumanPropHold {
  /** One hand on the prop: its grip socket's frame and the prop's frame in it, the offset its grip keeps. */
  export interface IHand {
    /** The hand's grip socket, world. */
    hand: IHumanProp.IFrame;

    /** The prop's frame in the hand's grip frame. */
    offset: IHumanProp.IFrame;
  }

  /**
   * The prop's frame held in two hands.
   *
   * @param a The hand that carries it.
   * @param b The other hand.
   * @returns The prop's world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each hand's grip socket in the prop's frame from its offset; the hands' two implied turns blended halfway; the least turn laying the prop's line between the sockets on the world's; the middles matched.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two points, one blend, one alignment, one translation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Two sockets at one point leave the blend alone, never dividing by nothing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function fit(a: IHand, b: IHand): IHumanProp.IFrame {
    const turn = (h: IHand): IAutoMovieQuaternion =>
      Quaternion.normalize(
        Quaternion.multiply(h.hand.rotation, h.offset.rotation),
      );
    // Where each socket is on the prop: the hand's origin in the prop's frame.
    const local = (h: IHand): IAutoMovieVector3 =>
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
      sine < 1e-9 || Vector3.length(along) < 1e-9
        ? blended
        : Quaternion.normalize(
            Quaternion.multiply(
              Quaternion.fromAxisAngle(
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
   * Where a grip holds a prop on given bones: the hand's grip socket with the
   * hand bone's world rotation, or the bone a worn span rides.
   *
   * @param body The body the bones are of.
   * @param bones The bones.
   * @param grip The holding hand, and the bone of a worn span.
   * @returns The frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two frames and the inputs.
   * @evidence contracts/development/implementation.md#principled-implementation The grip socket placed on its bone by the body's own surfaces, with the hand bone's rotation, the frame a held prop rides.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function frame(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    grip: { side: "left" | "right"; bone?: AutoMovieHumanoidBone },
  ): IHumanProp.IFrame {
    if (grip.bone !== undefined) {
      const bone: IAutoMovieResolvedBone = bones.get(grip.bone)!;
      return { position: bone.worldPosition, rotation: bone.worldRotation };
    }
    const socket: IHumanBody["surfaces"]["sockets"]["gripLeft"] =
      body.surfaces.sockets[grip.side === "left" ? "gripLeft" : "gripRight"];
    const bone: IAutoMovieResolvedBone = bones.get(socket.bone)!;
    return {
      position: resolveAutoMovieHumanoidSurfaces.place(socket, bone).point,
      rotation: bone.worldRotation,
    };
  }
}