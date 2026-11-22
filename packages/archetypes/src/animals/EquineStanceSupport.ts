import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetypeFrame } from "../core";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { EquineBodyPose } from "./EquineBodyPose";
import type { EquineStanceRows } from "./EquineStanceRows";

/** The proxy centre of mass's least distance inside the remaining supports before a hoof leaves the floor, metres: authored. */
const MARGIN: number = 0.03;

/**
 * The support rules every stance row shares: hooves on their anchors, a limb folded by a share of its turns, trunk shifts, and the weight transfer that must precede releasing a hoof.
 *
 * Before a hoof leaves the floor the trunk carries the proxy centre of mass (`EquineBodyPose`) at least `MARGIN` inside the triangle of the three hooves that stay: the motion skill's rule that weight moves to the next support before the current one is released, judged by the static-stability criterion that the centre of mass projects inside the support.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shared rules and the weight-transfer criterion with its authored margin.
 * @evidence contracts/development/design.md#principled-representation Pure functions over trunk motions, anchors and limb chains in the base model's space.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `EquineStanceRows` only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace EquineStanceSupport {
  /**
   * Four hooves on their anchors at zero fold.
   *
   * @param anchors Each hoof's terminal endpoint, base model space.
   * @returns The four placed limbs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation One placed limb per anchor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by every row.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function placed(
    anchors: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, IAutoMovieVector3>
    >,
  ): Record<AutoMovieArchetypeQuadrupedBody.Limb, EquineBodyPose.Limb> {
    const one = (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
    ): EquineBodyPose.IPlaced => ({
      kind: "placed",
      anchor: anchors[limb],
      fold: 0,
    });
    return {
      leftFore: one("leftFore"),
      rightFore: one("rightFore"),
      leftHind: one("leftHind"),
      rightHind: one("rightHind"),
    };
  }

  /**
   * A limb folded from its release chain by a share of its turns.
   *
   * @param chain The chain at release, the trunk's frame.
   * @param turns The full turns, degrees.
   * @param share 0 at release to 1 fully folded.
   * @returns The folded limb.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Scales every turn by the share, so share 0 is the release chain itself and the pose is continuous there.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the lifting rows.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the chain it is given.
   */
  export function folded(
    chain: readonly IAutoMovieVector3[],
    turns: readonly [number, number, number, number],
    share: number,
  ): EquineBodyPose.IFolded {
    return {
      kind: "folded",
      chain,
      turns: [
        turns[0] * share,
        turns[1] * share,
        turns[2] * share,
        turns[3] * share,
      ],
    };
  }

  /**
   * A trunk motion followed by a translation.
   *
   * @param motion The motion.
   * @param shift The translation, metres.
   * @returns The shifted motion.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation The rotation is kept and the shift added after it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by every row.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function moved(
    motion: AutoMovieArchetypeFrame.IMotion,
    shift: IAutoMovieVector3,
  ): AutoMovieArchetypeFrame.IMotion {
    return {
      rotation: motion.rotation,
      translation: Vector3.add(motion.translation, shift),
    };
  }

  /**
   * The yaw of a trunk motion: the turn about the vertical that carries +Z onto the trunk's forward direction projected on the floor.
   *
   * @param motion The trunk's motion.
   * @returns The heading rotation; the identity for an unturned trunk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the heading is and its identity case.
   * @evidence contracts/development/implementation.md#principled-implementation The bearing of the trunk's forward axis on the floor, as one turn about +Y; the trunk's own pitch and roll are left out, so turns and shifts authored in the horse's frame stay level.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bearing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by every row that turns or shifts in the horse's frame.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function heading(
    motion: AutoMovieArchetypeFrame.IMotion,
  ): IAutoMovieQuaternion {
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      motion.rotation,
      {
        x: 0,
        y: 0,
        z: 1,
      },
    );
    return Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      (Math.atan2(forward.x, forward.z) * 180) / Math.PI,
    );
  }

  /**
   * A vector authored in the horse's own frame (X to its left, Y up, Z forward) carried into the base model's space by a trunk's heading.
   *
   * @param motion The trunk's motion.
   * @param vector The vector in the horse's frame.
   * @returns The vector in the base model's space.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both frames.
   * @evidence contracts/development/implementation.md#principled-implementation The vector turned by `heading`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `heading`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function along(
    motion: AutoMovieArchetypeFrame.IMotion,
    vector: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(heading(motion), vector);
  }

  /**
   * A point on a lifted hoof path between two places: their blend raised by a half-sine of the given height.
   *
   * @param from The place at share 0, metres.
   * @param to The place at share 1, metres.
   * @param share The share.
   * @param height The path's rise at its middle, metres.
   * @returns The point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the rise's shape.
   * @evidence contracts/development/implementation.md#principled-implementation A linear blend plus a half-sine lift that is zero at both ends, so the hoof leaves and meets the floor at its places.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the comfort rows' swings.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function arc(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    share: number,
    height: number,
  ): IAutoMovieVector3 {
    return Vector3.add(Vector3.lerp(from, to, share), {
      x: 0,
      y: height * Math.sin(Math.PI * share),
      z: 0,
    });
  }

  /**
   * Two trunk motions of one rotation blended by their translations.
   *
   * @param from The motion at share 0.
   * @param to The motion at share 1.
   * @param share The share.
   * @returns The blended motion.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the premise that both share a rotation.
   * @evidence contracts/development/implementation.md#principled-implementation Linear interpolation of the translation; the rows only blend level shifts of one rotation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the lifting and stepping rows.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function blend(
    from: AutoMovieArchetypeFrame.IMotion,
    to: AutoMovieArchetypeFrame.IMotion,
    share: number,
  ): AutoMovieArchetypeFrame.IMotion {
    return {
      rotation: to.rotation,
      translation: Vector3.lerp(from.translation, to.translation, share),
    };
  }

  /**
   * The level shift carrying the proxy centre of mass `MARGIN` inside the triangle of the other three hooves, or none when it is already there.
   *
   * @param body The prepared solver, for the rest centre of mass.
   * @param state The stance before the release.
   * @param lifted The hoof about to leave the floor.
   * @returns The horizontal shift, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the margin and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each edge's inward signed distance is linear along the segment from the triangle's centroid to the centre of mass, so the farthest admitted point on it has a closed form; the shift moves the centre of mass there.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Centroid, three edge bounds, one point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The centroid of a nondegenerate triangle is always inside, so a solution exists; no search or clamp beyond the segment.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the hoof and step-aside rows.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function transfer<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    state: EquineStanceRows.IState,
    lifted: AutoMovieArchetypeQuadrupedBody.Limb,
  ): IAutoMovieVector3 {
    const centre: IAutoMovieVector3 = EquineBodyPose.point(
      state.trunk,
      body.centre,
    );
    const corners: IAutoMovieVector3[] =
      AutoMovieArchetypeQuadrupedBody.LIMBS.filter(
        (limb: AutoMovieArchetypeQuadrupedBody.Limb): boolean =>
          limb !== lifted,
      ).map(
        (limb: AutoMovieArchetypeQuadrupedBody.Limb): IAutoMovieVector3 =>
          state.anchors[limb],
      );
    const middle: IAutoMovieVector3 = Vector3.scale(
      corners.reduce(
        (sum: IAutoMovieVector3, p: IAutoMovieVector3): IAutoMovieVector3 =>
          Vector3.add(sum, p),
        { x: 0, y: 0, z: 0 },
      ),
      1 / 3,
    );
    let reach: number = 1;
    for (let k: number = 0; k < 3; k++) {
      const a: IAutoMovieVector3 = corners[k]!;
      const b: IAutoMovieVector3 = corners[(k + 1) % 3]!;
      const inward = (p: IAutoMovieVector3): number => {
        const ex: number = b.x - a.x;
        const ez: number = b.z - a.z;
        const side: number =
          ex * (middle.z - a.z) - ez * (middle.x - a.x) >= 0 ? 1 : -1;
        return (
          (side * (ex * (p.z - a.z) - ez * (p.x - a.x))) / Math.hypot(ex, ez)
        );
      };
      const inside: number = inward(middle);
      const there: number = inward(centre);
      if (there < MARGIN)
        reach = Math.min(reach, (inside - MARGIN) / (inside - there));
    }
    reach = Math.max(0, reach);
    return {
      x: middle.x + (centre.x - middle.x) * reach - centre.x,
      y: 0,
      z: middle.z + (centre.z - middle.z) * reach - centre.z,
    };
  }
}
