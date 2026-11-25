import {
  AutoMovieHumanoidSurfaceRays,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanHand } from "@automovie/motions/internal";

/**
 * How far a rider's displayed palm is from a horse's held contact: a round bar
 * such as the mane, or a rein-kind line.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two measures and who reads them.
 * @evidence contracts/development/design.md#principled-representation Two distance readers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the ford rider and float specs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace equineRiderContacts {
  /**
   * How far the palm's skin is from a round bar's skin, metres, signed: the
   * body's own palm skin under its palm socket (a ray from the socket along the
   * palm's normal to where it leaves the hand's surface, measured once at
   * rest), carried by the displayed hand, against the bar's axis segment along
   * its `+X`, less the bar's radius; negative inside the bar.
   *
   * @param body The body.
   * @param bones The displayed bones.
   * @param side The hand.
   * @param contact The bar's world frame.
   * @param affordance The bar's declaration.
   * @returns The gap, metres.
   * @evidence contracts/development/common.md#meaningful-documentation States the measure, its sign and its unit.
   * @evidence contracts/development/implementation.md#principled-implementation The palm's skin is found on the body's own surface; the bar's skin is its declared radius about its declared run.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One skin point, one closest point on a segment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Read from the displayed bones and the body's surface, never from a hold's goal or its authored palm depth.
   * @evidence contracts/development/implementation.md#efficient-algorithms One surface ray per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The engine's surface rays.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing across calls.
   */
  export function bar(
    body: IAutoMovieMotionHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: AutoMovieHumanSide,
    contact: IAutoMovieTransform,
    affordance: IAutoMovieAffordance,
  ): number {
    const socket: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.sockets[side === "left" ? "palmLeft" : "palmRight"];
    // The palm skin under the socket, in the socket bone's frame, at rest.
    const rays: ReturnType<typeof AutoMovieHumanoidSurfaceRays.tools> =
      AutoMovieHumanoidSurfaceRays.tools(body.skeleton, body.profile);
    const rest: IAutoMovieResolvedBone = rays.at(socket.bone);
    const skin: IAutoMovieVector3 = rays.exit(
      socket.bone,
      Vector3.add(
        rest.worldPosition,
        Quaternion.rotateVector(rest.worldRotation, socket.point),
      ),
      Quaternion.rotateVector(rest.worldRotation, socket.normal),
    );
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(rest.worldRotation),
      Vector3.subtract(skin, rest.worldPosition),
    );
    const hand: IAutoMovieResolvedBone = bones.get(socket.bone)!;
    const palm: IAutoMovieVector3 = Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(hand.worldRotation, local),
    );
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(contact.rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    const half: number = (affordance.length ?? 0) / 2;
    const along: number = Math.max(
      -half,
      Math.min(
        half,
        Vector3.dot(Vector3.subtract(palm, contact.translation), axis),
      ),
    );
    return (
      Vector3.distance(
        palm,
        Vector3.addScaled(contact.translation, axis, along),
      ) -
      (affordance.aperture ?? 0) / 2
    );
  }
  /**
   * How far a rein-kind contact's skin is from the palm's own contact point,
   * metres, as the seated rider specs check a rein.
   *
   * @param body The body.
   * @param bones The displayed bones.
   * @param side The hand.
   * @param contact The contact's world frame.
   * @param affordance The contact's declaration.
   * @returns The miss, metres.
   * @evidence contracts/development/common.md#meaningful-documentation States the measure and its unit.
   * @evidence contracts/development/implementation.md#principled-implementation The rein's skin lies along the contact's +Y by its radius.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One distance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One palm offset.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `HumanHand.offset`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources None retained.
   */
  export function rein(
    body: IAutoMovieMotionHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: AutoMovieHumanSide,
    contact: IAutoMovieTransform,
    affordance: IAutoMovieAffordance,
  ): number {
    const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
    const palm: IAutoMovieVector3 = Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(
        hand.worldRotation,
        HumanHand.offset(body, side, "palm").point,
      ),
    );
    return Vector3.distance(
      palm,
      Vector3.addScaled(
        contact.translation,
        Quaternion.rotateVector(contact.rotation, { x: 0, y: 1, z: 0 }),
        (affordance.aperture ?? 0) / 2,
      ),
    );
  }
}
