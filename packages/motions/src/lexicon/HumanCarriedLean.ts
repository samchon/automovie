import type { IHumanLayer } from "../law/IHumanLayer";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { HumanCarried } from "./HumanCarried";

/**
 * The carrier's lean against the load of a carried person (#3349): a load
 * on the back brings the trunk forward, a load before the chest or pulled
 * from ahead brings it back, so the carrier's and the load's common centre
 * of mass stays over the feet.
 *
 * The lean is an additive layer, as breath and affect are: it adds flexion
 * to the spine and the chest, half each, onto whatever the carrier's own
 * action holds there, so a walk keeps its counter-rotation and its pelvis
 * and legs are left alone. A walk keeps its trunk for itself, so the lean
 * cannot be part of `bearing`, which is an overlay; the composition
 * schedules the layer over the carry:
 * `layers: { carrier: [{ layer: HumanCarriedLean.layer("piggyback"), from: { of: "carry" }, to: { of: "carry", event: "end" }, fade: HumanCarried.TAKE }] }`,
 * with `carry` the anchor of the carrier's action.
 *
 * The direction is the mechanics' and the load-carriage literature's: the
 * trunk's forward lean grows with a load carried on the back (Knapik,
 * Harman and Reynolds 1996, "Load carriage using packs", Applied Ergonomics
 * 27, a review). The sizes are provisional: no study of carrying a whole
 * person was read for them. A piggyback leans 20 degrees forward, a load
 * over the shoulder 10; a cradle and the drags lean back 10.
 *
 * First pass: the lean is a constant of the carry, coming in over the
 * window's fade; it does not follow the carried body's mass or the
 * carrier's stride, and a supported walk's sideways lean toward the
 * supported person is not written.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, why it is a layer and how it is scheduled, the cited direction, which sizes are provisional and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One angle per carry as data and one additive layer, the form every trunk addition over a running action has.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table and the layer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The lean is added to what the carrier's action holds, never set over it.
 */
export namespace HumanCarriedLean {
  /** The carrier's trunk flexion against each carry's load, degrees; positive leans forward. */
  export const LEANS: Readonly<Record<HumanCarried.Carry, number>> = {
    piggyback: 20,
    cradle: -10,
    overShoulder: 10,
    supported: 0,
    supportedLeft: 0,
    armpitDrag: -10,
    collarDrag: -10,
    ankleDrag: -10,
  };

  /**
   * The lean of a carry as a layer.
   *
   * @param carry The carry.
   * @returns The layer, named `carryLean`; schedule it over the carry, with the take-up as its fade.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the layer's name and how it is used.
   * @evidence contracts/development/implementation.md#principled-implementation Half the carry's angle is added to the spine's flexion and half to the chest's, onto the posture's own joints, so the base action's trunk is kept and the lean summed; limb goals are untouched, so the holding arms are solved after the leaned trunk.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two joint sums.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A carry with no lean still returns a layer that adds nothing, so every carry composes the same way.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Postures are evaluated independently; nothing is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The layer closes over one angle.
   */
  export function layer(carry: HumanCarried.Carry): IHumanLayer {
    const half: number = LEANS[carry] / 2;
    return {
      name: "carryLean",
      channels: ["trunk"],
      apply: (posture: IHumanPosture): IHumanPosture => {
        const spine: readonly [number, number, number] = posture.joints
          .spine ?? [0, 0, 0];
        const chest: readonly [number, number, number] = posture.joints
          .chest ?? [0, 0, 0];
        return {
          ...posture,
          joints: {
            ...posture.joints,
            spine: [spine[0] + half, spine[1], spine[2]],
            chest: [chest[0] + half, chest[1], chest[2]],
          },
        };
      },
    };
  }
}
