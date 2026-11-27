import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedLimb } from "../AutoMovieArchetypeQuadrupedLimb";
import { AutoMovieArchetypeQuadrupedRootRange } from "../AutoMovieArchetypeQuadrupedRootRange";
import type { QuadrupedPosePlan } from "./QuadrupedPosePlan";
import { QuadrupedScapula } from "./QuadrupedScapula";

/*
 * The foot targets and body state used to settle a quadruped ride pose.
 */
export namespace QuadrupedRidePoseTypes {
  /*
   * The hind limbs, whose hips ride the pelvis.
   */
  export const HINDS: readonly AutoMovieArchetypeQuadrupedBody.Limb[] = [
    "leftHind",
    "rightHind",
  ];

  /*
   * One sample's unchanged endpoint, relative fold and fixed neutral attachment.
   */
  export interface Target {
    /*
     * Chain and terminal-axis binding used for this sample.
     */
    solver: AutoMovieArchetypeQuadrupedLimb.IOriented;
    /*
     * Terminal endpoint, already including its sole clearance.
     */
    endpoint: IAutoMovieVector3;
    /*
     * Declared relative carpus/hock fold, degrees.
     */
    fold: number;
    /*
     * Proximal joint before the common body-root displacement.
     */
    attachment: IAutoMovieVector3;
    /*
     * A fore limb's shoulder blade.
     */
    blade?: QuadrupedScapula.Bone;
    /*
     * The root constraint this target yields, read again once the root is chosen.
     */
    constraint: AutoMovieArchetypeQuadrupedRootRange.IConstraint;
  }

  /*
   * A contact a body bone carries, with its neutral frame.
   */
  export interface ICarried {
    /*
     * The carrying bone.
     */
    bone: AutoMovieArchetypeQuadrupedBody.Bone;

    /*
     * The contact's frame in the neutral model, metres.
     */
    frame: IAutoMovieTransform;
  }

  /*
   * What four goals settle under one nod before any chain is solved
   * (`QuadrupedRidePose.prepare`'s `settle`).
   */
  export interface ISettled {
    /*
     * The axial goals: the neck's nod.
     */
    axial: Map<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal>;

    /*
     * The body's frames at the nod, before the root is chosen.
     */
    preview: QuadrupedPosePlan.IState;

    /*
     * Each limb's target, its constraint relaxed.
     */
    targets: Map<AutoMovieArchetypeQuadrupedBody.Limb, Target>;

    /*
     * The body floor's lowest root translation, metres.
     */
    floor: number;

    /*
     * The coordinates' scale, metres, for the roundoff budgets.
     */
    coordinateScale: number;

    /*
     * The common root interval.
     */
    range: AutoMovieArchetypeQuadrupedRootRange.IRange;

    /*
     * An axial bar's goal turned by an angle about model X.
     */
    bar: (
      bone: QuadrupedPosePlan.Axial,
      angle: number,
    ) => QuadrupedPosePlan.Goal;

    /*
     * The pelvis's turn at a root height.
     */
    pelvis: (height: number) => number;
  }
}
