import type { IAutoMovieHumanBindingLimb } from "./IAutoMovieHumanBindingLimb";
import type { IAutoMovieHumanBindingPlane } from "./IAutoMovieHumanBindingPlane";
import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";
import { AutoMovieHumanJointTransition } from "./AutoMovieHumanJointTransition";
import { AutoMovieHumanLimbCapsule } from "./AutoMovieHumanLimbCapsule";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";
import { AutoMovieHumanSkinStep } from "./AutoMovieHumanSkinStep";

/**
 * The hinge piece: the cut between a bone and its parent, which the elbow,
 * wrist, knee, ankle, toes, thumb joints, finger joints and the spine share.
 *
 * A joint holds a plane at its centre, and a point's share in the child rises
 * over that plane on a compact ramp, so a hinge bends where the joint is.
 * The plane's normal is the parent's direction turned toward the child's by
 * the child's alignment with it, so a limb that leaves its parent sideways
 * keeps the parent's plane (the foot would otherwise cut the heel off along
 * its own length). The ramp's half width is read per sector round the joint
 * ({@link AutoMovieHumanJointTransition}) at the joint's whole turn.
 */
export namespace AutoMovieHumanHingeBinding {
  /** Least half of a joint's cut, in skin depths at the joint (convention: the depth at which a quintic ramp bends a limb's skin through its own radius). */
  export const CUT: number = 1.5;

  /**
   * Least skin depth at a joint, in the radius of the thinner limb there.
   * Rings that end inside the skin, as a thumb's first one does, read as skin.
   */
  export const SHALLOWEST: number = 0.6;

  /**
   * A hinge's capsule: the joint's girth the whole segment long.
   *
   * @param input What the region reads.
   * @returns The same radius at both ends.
   */
  export function radii(
    input: IAutoMovieHumanBindingRegion.IRadiiInput,
  ): IAutoMovieHumanBindingRegion.IRadii {
    return { radius: input.girth, near: input.girth, far: input.girth };
  }

  /**
   * A hinge's segment ends where the joint's own segment does.
   *
   * @param input What the region reads.
   * @returns The joint's own end.
   */
  export function end(
    input: IAutoMovieHumanBindingRegion.IEndInput,
  ): Math3D.Vector {
    return input.own;
  }

  /**
   * The skin depth a joint's cut is sized by.
   *
   * @param depth Distance from the joint to the nearest skin, metres.
   * @param parent The parent's radius at the joint, metres.
   * @param radius The child's own radius, metres.
   * @returns The reach, metres.
   */
  export function reach(depth: number, parent: number, radius: number): number {
    return Math.max(depth, SHALLOWEST * Math.min(parent, radius));
  }

  /**
   * The cut's unit normal toward the child.
   *
   * @param parent The parent's unit direction.
   * @param child The child's unit direction.
   * @param _side The limb's side, which a hinge does not read.
   * @returns The parent's direction plus the child's share along it, unitized.
   */
  export function normal(
    parent: Math3D.Vector,
    child: Math3D.Vector,
    _side?: number,
  ): Math3D.Vector {
    const along: number = Math.max(
      0,
      child[0] * parent[0] + child[1] * parent[1] + child[2] * parent[2],
    );
    return Math3D.unit(Math3D.add(parent, Math3D.times(child, along)));
  }

  /**
   * The joint's plane before its sectors are read.
   *
   * @param at The joint's centre, metres.
   * @param normal The cut's unit normal.
   * @param reach The skin depth the cut is sized by, metres.
   * @returns The plane with the least half width.
   */
  export function plane(
    at: Math3D.Vector,
    normal: Math3D.Vector,
    reach: number,
  ): IAutoMovieHumanBindingPlane {
    return { at, normal, half: CUT * reach, step: AutoMovieHumanSkinStep.slide };
  }

  /**
   * Read a joint's ramp per sector from the skin its two bones hold.
   *
   * A ramp spans at most half its segment. The muscles that cross a joint
   * attach within the near half of the next bone (the deltoid at mid-humerus,
   * the gluteals and iliopsoas on the femur's upper third), and past that the
   * skin rides the bone: a ramp reaching the next joint's bent the upper arm
   * and swelled the thigh of a flexed hip into a sack.
   *
   * @param limb The child limb; it has a parent and a plane.
   * @param skin Skin samples, metres, three numbers each.
   * @param holder The rig slot of the bone that leads each sample under the starting ramps.
   * @returns The sector profile; its `most` is the ramp's half.
   */
  export function size(
    limb: IAutoMovieHumanBindingLimb,
    skin: Float64Array,
    holder: Int32Array,
  ): AutoMovieHumanJointTransition.ISectors {
    const plane: IAutoMovieHumanBindingPlane = limb.planes[0]!;
    return AutoMovieHumanJointTransition.measure({
      points: skin,
      held: (i: number): boolean =>
        (holder[i] === limb.slot || holder[i] === limb.parent!.slot) &&
        limb.side * skin[3 * i + 2]! >= 0,
      at: plane.at,
      normal: plane.normal,
      turn: limb.turn,
      least: plane.half,
      most: AutoMovieHumanLimbCapsule.length(limb) / 2,
    });
  }
}
