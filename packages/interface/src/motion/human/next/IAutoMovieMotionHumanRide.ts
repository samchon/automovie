import type { IAutoMovieMotionHumanSpacecraftGlide } from "../law/IAutoMovieMotionHumanSpacecraftGlide";
import type { IAutoMovieMotionHumanBicycleEffort } from "../lexicon/IAutoMovieMotionHumanBicycleEffort";
import type { IAutoMovieMotionHumanBikeGuide } from "../lexicon/IAutoMovieMotionHumanBikeGuide";
import type { IAutoMovieMotionHumanBikeTransfer } from "../lexicon/IAutoMovieMotionHumanBikeTransfer";
import type { IAutoMovieMotionHumanBoard } from "../lexicon/IAutoMovieMotionHumanBoard";
import type { IAutoMovieMotionHumanHandrimStroke } from "../lexicon/IAutoMovieMotionHumanHandrimStroke";
import type { IAutoMovieMotionHumanTravelCar } from "../lexicon/IAutoMovieMotionHumanTravelCar";
import type { IAutoMovieMotionHumanTravelCarExit } from "../lexicon/IAutoMovieMotionHumanTravelCarExit";
import type { IAutoMovieMotionHumanTravelLeaf } from "../lexicon/IAutoMovieMotionHumanTravelLeaf";

/**
 * Riding a vehicle or travelling by one: a car, its exit and a leaf, a bicycle,
 * a wheelchair and a spacecraft's handrails. The moving prop owns the course
 * and the contacts, and every method here reads them at the film second it
 * acts.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanRide` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanRide<Chain> {
  /**
   * Getting into a car through its door: the person stands in the doorway with
   * the back to the seat, sits down onto it sideways with the legs still
   * outside, then swings round on the seat to face the way the seat faces, and
   * the head is ducked under the door's top throughout.
   *
   * Registered law: `registered("travelCar", params)`; not a chain method.
   *
   * @param params The `seat`, `through` and `hold` of
   *   `IAutoMovieMotionHumanTravelCar.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  travelCar(
    params: IAutoMovieMotionHumanTravelCar.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Get out of a stationary car through its already open rear door: the legs
   * swing out, the body ducks under the frame and stands clear of the door (the
   * opt-in `HumanTravelCarExit.getOut` law).
   *
   * Registered law: `registered("travelCarExit", params)`; not a chain method.
   *
   * @param params The `bench`, `width`, `through`, `floor`, `turnSeconds`,
   *   `clearance`, `landingDistance`, `duckDegrees`, `stagger` and `liftShare`
   *   of `IAutoMovieMotionHumanTravelCarExit.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  travelCarExit(
    params: IAutoMovieMotionHumanTravelCarExit.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Opening a door by its handle and holding it: the hand reaches the handle,
   * closes on it and goes with it while the leaf swings, the person standing,
   * and walking round with the leaf when the arm alone would lose the handle.
   *
   * Registered law: `registered("travelLeaf", params)`; not a chain method.
   *
   * @param params The `door`, `handle`, `duration` and `hand` of
   *   `IAutoMovieMotionHumanTravelLeaf.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  travelLeaf(
    params: IAutoMovieMotionHumanTravelLeaf.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Riding a vehicle: a seated person carried by a support that moves by
   * itself, such as a car or a bicycle given to the performance as a moving
   * prop (`HumanObject.prop` with a motion).
   *
   * Registered law: `registered("rideVehicle", params)`; not a chain method.
   *
   * @param params The parameters of the law,
   *   `IAutoMovieMotionHumanRide.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  rideVehicle(
    params: IAutoMovieMotionHumanRide.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Boarding a moving carrier's seat at speed: the performer leaves its support
   * moving with the carrier and lands astride the named seat, optionally
   * holding the carrier's horn or a partner's forearm on the way.
   *
   * Registered law: `registered("board", params)`; not a chain method.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanBoard`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  board(params: IAutoMovieMotionHumanBoard, anchor?: string): Chain;

  /**
   * One single-handed or bilateral push and recovery by a rider already seated
   * on a moving manual wheelchair.
   *
   * Registered law: `registered("handrimStroke", params)`; not a chain method.
   *
   * @param params The parameters of the law,
   *   `IAutoMovieMotionHumanHandrimStroke`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  handrimStroke(
    params: IAutoMovieMotionHumanHandrimStroke,
    anchor?: string,
  ): Chain;

  /**
   * A seated cyclist rises against the pedals and returns to the saddle while
   * the same bicycle continues along its authored course.
   *
   * Registered law: `registered("bicycleEffort", params)`; not a chain method.
   *
   * @param params The parameters of the law,
   *   `IAutoMovieMotionHumanBicycleEffort`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  bicycleEffort(
    params: IAutoMovieMotionHumanBicycleEffort,
    anchor?: string,
  ): Chain;

  /**
   * Wheeling a bicycle by hand: walk or run beside it with one hand on its near
   * handlebar grip while the scene rolls it along its own course.
   *
   * Registered law: `registered("bikeGuide", params)`; not a chain method.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanBikeGuide`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  bikeGuide(params: IAutoMovieMotionHumanBikeGuide, anchor?: string): Chain;

  /**
   * A grounded high-seat mount or dismount on a stopped bicycle at an authored
   * boundary.
   *
   * Registered law: `registered("bikeTransfer", params)`; not a chain method.
   *
   * @param params The parameters of the law,
   *   `IAutoMovieMotionHumanBikeTransfer`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  bikeTransfer(
    params: IAutoMovieMotionHumanBikeTransfer,
    anchor?: string,
  ): Chain;

  /**
   * One staged transfer between two fixed, parallel spacecraft handrails, the
   * named hand delivering the departure impulse and absorbing the stop.
   *
   * Registered law: `registered("spacecraftGlide", params)`; not a chain
   * method.
   *
   * @param params The parameters of the law,
   *   `IAutoMovieMotionHumanSpacecraftGlide`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  spacecraftGlide(
    params: IAutoMovieMotionHumanSpacecraftGlide,
    anchor?: string,
  ): Chain;
}

/**
 * Riding: a seated person carried by a support that moves by itself, such as a
 * car, a bicycle or a horse given to the performance as a moving prop
 * (`HumanObject.prop` with a motion).
 *
 * The rider sits down on the support first (`sit` on its seat where it stands
 * at that second; `HumanObject.seat` reads a saddle with its pedals or
 * stirrups) and then rides it: the seated posture is carried rigidly with the
 * support, turning, leaning and pitching as it does, the seat and each foot
 * that rested on it bearing on it, so nothing slides in the support's frame.
 * The arms, the hands, the head and the trunk's turn are yielded, so steering,
 * holding on, waving, looking and aiming from the saddle are actions performed
 * over the ride. Register `HumanRide.ride` to use it.
 *
 * With `rising` the rider posts to a trot, by a stride time or on the strides
 * of a cue track; with `feet` each foot stays on a part that moves within the
 * support, a pedal on its crank or a stirrup; with `hands` each hand holds a
 * grip, a rein or a wheel's rim and follows it the same way, the trunk leaning
 * forward at each instant as far as the hands need to reach what they hold
 * (`HumanMountReach.reach`), as a fixed-seat rower leans to the catch the oar's
 * handle comes to. First pass: the rider leans exactly as the support does and
 * absorbs no bump, a pedalling foot keeps its pitch to the frame except where
 * the leg would run short and it points down about its ball
 * (`HumanMountRider`), and mounting and dismounting are the sitting actions.
 * The ride passes on the seat it was entered on as its base, so `rise` after it
 * gets off a saddle to the left unasked.
 */
export namespace IAutoMovieMotionHumanRide {
  /** Parameters of a ride. */
  export interface IParams {
    /** The moving prop ridden: its subject id in the performance. */
    on: string;

    /** Seconds ridden, more than none. */
    duration: number;

    /**
     * A rising trot: the mount's stride time, seconds, positive, or the cue
     * track of the performance that holds its strides (the footfalls of one
     * diagonal, as the mount's own ride publishes them; a trot's stride time is
     * on `IAutoMovieMotionHumanMounted.stride`). The rider stands in the
     * stirrups and sits again once a stride, the seat rising `POST` thigh
     * lengths (`HumanRide.POST`, 0.25, provisional) off the saddle, so both
     * feet must rest on the support. On a cue track the seat is down at each of
     * its instants and seated before the first and after the last. Seated
     * throughout when absent.
     */
    rising?:
      | number
      | {
          /**
           * Performance cue-track id publishing one diagonal's footfalls; the
           * rising rider sits at each instant and before the first and after
           * the last.
           */
          cue: string;
        };

    /**
     * The support's point each foot stays on, by its id, for a part that moves
     * within the support: a pedal on its turning crank, a stirrup on a trotting
     * horse (`IAutoMovieMotionHumanProp.point`). The foot keeps the place it
     * had on that point when the ride began. A foot not named, or a point that
     * only moves with the support, is carried rigidly.
     */
    feet?: Partial<Record<"left" | "right", string>>;

    /**
     * Acquire each named foot support over the first 0.6 seconds of the ride,
     * then follow its actual material point. By default the feet keep the
     * offset they had on the named rests when the ride began.
     */
    placeFeet?: boolean;

    /**
     * The support's point the seat stays on, by its id, where the seat itself
     * moves within the support: a saddle on a horse's trunk, which rises and
     * falls with the stride over the course its root follows. The body is
     * carried with the support alone when absent.
     */
    seat?: string;

    /**
     * The support's point each hand holds, by its id: a handlebar grip, a rein,
     * a wheel's rim. The hand goes to it over `TAKE` seconds from the ride's
     * start and stays on it, following a part that moves within the support.
     * The arms are still yielded, so an arm action over the ride takes a hand
     * off for as long as it lasts. The hand turns to the point and closes on it
     * (`HumanMountRider.hold`).
     */
    hands?: Partial<Record<"left" | "right", string>>;

    /**
     * Optional saddle-relative movement on the named seat point. Cue ids refer
     * to tracks in the performance and their instants are film seconds. At
     * least one of stride, jump and lookBack must be set.
     */
    equestrian?: {
      /**
       * One touchdown track, or ordered nonoverlapping tracks that change gait
       * or lead where one track ends and the next begins.
       */
      stride?: EquestrianStrides;

      /**
       * Follow an authored jumping support from approach through recovery. Each
       * track must publish exactly one instant within the ride, in the order
       * below. Both feet must enter on their named stirrups. Compose a jump in
       * a ride without rising trot.
       */
      jump?: {
        /** The beginning of the rider's approach posture. */
        approach: string;
        /** The horse's last hind-hoof liftoff. */
        takeoff: string;
        /** The horse's first forehoof landing. */
        landing: string;
        /** The end of the rider's recovery. */
        recovery: string;
      };

      /**
       * An over-shoulder film pose centred on a single cue. The pelvis remains
       * with the saddle.
       */
      lookBack?: {
        /** The track with one instant inside the ride, at the fullest turn. */
        cue: string;
        /** Which shoulder the rider looks over. */
        side: "left" | "right";
        /**
         * Total seconds of the turn and return, within the ride. Greater than
         * zero.
         */
        duration: number;
      };
    };
  }

  /** One saddle-relative response over consecutive real carrier touchdowns. */
  export interface IEquestrianStride {
    /**
     * Performance cue-track id holding consecutive landings, in film seconds,
     * of one hind hoof for walk, one diagonal for trot or the leading fore hoof
     * for canter and gallop.
     */
    cue: string;

    /** The carrier's gait over this track. */
    gait: EquestrianGait;

    /**
     * Canter or gallop lead, which sets the sign of the pelvic roll. Left when
     * absent; not read for walk or trot.
     */
    lead?: EquestrianLead;
  }

  /**
   * The stride clock of a ride: one touchdown track, or an ordered list whose
   * tracks do not overlap in time.
   */
  export type EquestrianStrides =
    | IEquestrianStride
    | readonly IEquestrianStride[];

  /** A mounted gait the rider's saddle response distinguishes. */
  export type EquestrianGait = "walk" | "trot" | "canter" | "gallop";

  /**
   * A canter or gallop lead: the side whose fore hoof lands last and reaches
   * farthest.
   */
  export type EquestrianLead = "left" | "right";
}
