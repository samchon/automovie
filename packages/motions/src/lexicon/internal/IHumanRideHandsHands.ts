import type { AutoMovieEngineRigidCarrierSample } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import type { HumanRideHands } from "./HumanRideHands";
import type { fixedSeatWorkingPostures } from "./fixedSeatWorkingPostures";

/*
 * The ride's holding hands.
 */
export interface IHumanRideHandsHands {
  /*
   * The planted working-seat alternatives when pelvic inclination exceeds the
   * legs' reach.
   */
  alternatives?: NonNullable<ReturnType<typeof fixedSeatWorkingPostures>>;
  /*
   * The trunk's forward lean that brings the holding hands in reach of what
   * they hold, read by `gripAt` at a film second, the support in its frame
   * then, degrees: the grips are followed as they move, as a rower leans to the
   * catch the oar's handle comes to (`HumanMountReach.reach`).
   */
  posture(
    grips: Grips,
    frame: IAutoMovieRigidTransform,
    taken: number,
    heldAt?: number,
  ): IAutoMovieMotionHumanPosture;

  /*
   * What each holding hand holds, where the support has it at a film second in
   * its frame then.
   */
  gripsAt: (
    film: number,
    frame: IAutoMovieRigidTransform,
    sample?: AutoMovieEngineRigidCarrierSample.IRead,
  ) => Grips;

  /*
   * Each holding hand's fingers, closed on the support's colliders.
   */
  closures: Partial<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanPosture["joints"]>
  >;
}

/*
 * Each hand's current, complete support-relative hold.
 */
type Grips = Partial<Record<AutoMovieHumanSide, HumanRideHands.IMaterialGrip>>;
