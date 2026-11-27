import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";

/*
 * A holding hand's affordance and resting geometry, fixed for this ride.
 */
export interface IHumanRideHandsHandle {
  /*
   * The holding hand.
   */
  side: AutoMovieHumanSide;

  /*
   * The hand's measured palm depth to the held surface, metres; absent until a
   * full articulated frame has been observed.
   */
  palmDepth?: number;
  /*
   * The canonical palm frame retained for a rein over all pose reads.
   */
  reinPalm?: IAutoMovieMotionHumanHand.IFrame;
  /*
   * The angle a rein crosses the palm at, degrees, chosen once where the ride
   * begins (`IMaterialGrip.cross`).
   */
  cross?: number;
  /*
   * The named point within the support.
   */
  id: string;

  /*
   * The point and normal in the support's frame at rest.
   */
  rest: IAutoMovieMotionHumanProp["points"][string];

  /*
   * The handle's own aperture and orientation, when published.
   */
  affordance?: IAutoMovieAffordance;
}
