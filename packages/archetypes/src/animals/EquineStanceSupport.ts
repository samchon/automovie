import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { ArchetypeFrame } from "../core";
import { EquineBodyPose } from "./EquineBodyPose";
import type { EquineStanceRows } from "./EquineStanceRows";
import { QuadrupedBody } from "./QuadrupedBody";

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
    anchors: Readonly<Record<QuadrupedBody.Limb, IAutoMovieVector3>>,
  ): Record<QuadrupedBody.Limb, EquineBodyPose.Limb> {
    const one = (limb: QuadrupedBody.Limb): EquineBodyPose.IPlaced => ({
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
    motion: ArchetypeFrame.IMotion,
    shift: IAutoMovieVector3,
  ): ArchetypeFrame.IMotion {
    return {
      rotation: motion.rotation,
      translation: Vector3.add(motion.translation, shift),
    };
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
    from: ArchetypeFrame.IMotion,
    to: ArchetypeFrame.IMotion,
    share: number,
  ): ArchetypeFrame.IMotion {
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
    lifted: QuadrupedBody.Limb,
  ): IAutoMovieVector3 {
    const centre: IAutoMovieVector3 = EquineBodyPose.point(
      state.trunk,
      body.centre,
    );
    const corners: IAutoMovieVector3[] = QuadrupedBody.LIMBS.filter(
      (limb: QuadrupedBody.Limb): boolean => limb !== lifted,
    ).map((limb: QuadrupedBody.Limb): IAutoMovieVector3 => state.anchors[limb]);
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
