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
 * Riding a vehicle or travelling by one: a car, its exit and a leaf, a bicycle, a wheelchair and a spacecraft's handrails. The moving prop owns the course and the contacts, and every method here reads them at the film second it acts.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Ride family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Ride laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanRide<Chain> {
  /**
   * Getting into a car through its door: the person stands in the doorway with the back to the seat, sits down onto it sideways with the legs still outside, then swings round on the seat to face the way the seat faces, and the head is ducked under the door's top throughout.
   *
   * @param params The `seat`, `through` and `seconds` of `IAutoMovieMotionHumanTravelCar.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRide.travelCar is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRide.travelCar is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRide.travelCar is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRide.travelCar is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRide.travelCar is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRide.travelCar is provided by the chain that implements IAutoMovieMotionHumanRide.
   */
  travelCar(
    params: IAutoMovieMotionHumanRide.ITravelCar,
    anchor?: string,
  ): Chain;

  /**
   * Get out of a stationary car through its already open rear door: the legs swing out, the body ducks under the frame and stands clear of the door (the opt-in `HumanTravelCarExit.getOut` law).
   *
   * @param params The `bench`, `width`, `through`, `floor`, `turnSeconds`, `clearance`, `landingDistance`, `duckDegrees`, `stagger` and `liftShare` of `IAutoMovieMotionHumanTravelCarExit.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRide.travelCarExit is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRide.travelCarExit is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRide.travelCarExit is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRide.travelCarExit is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRide.travelCarExit is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRide.travelCarExit is provided by the chain that implements IAutoMovieMotionHumanRide.
   */
  travelCarExit(
    params: IAutoMovieMotionHumanRide.ITravelCarExit,
    anchor?: string,
  ): Chain;

  /**
   * Opening a door by its handle and holding it: the hand reaches the handle, closes on it and goes with it while the leaf swings, the person standing, and walking round with the leaf when the arm alone would lose the handle.
   *
   * @param params The `door`, `handle`, `seconds` and `side` of `IAutoMovieMotionHumanTravelLeaf.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRide.travelLeaf is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRide.travelLeaf is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRide.travelLeaf is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRide.travelLeaf is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRide.travelLeaf is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRide.travelLeaf is provided by the chain that implements IAutoMovieMotionHumanRide.
   */
  travelLeaf(
    params: IAutoMovieMotionHumanRide.ITravelLeaf,
    anchor?: string,
  ): Chain;

  /**
   * Riding a vehicle: a seated person carried by a support that moves by itself, such as a car or a bicycle given to the performance as a moving prop (`HumanObject.prop` with a motion).
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanRide.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRide.rideVehicle is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRide.rideVehicle is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRide.rideVehicle is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRide.rideVehicle is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRide.rideVehicle is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRide.rideVehicle is provided by the chain that implements IAutoMovieMotionHumanRide.
   */
  rideVehicle(
    params: IAutoMovieMotionHumanRide.IRideVehicle,
    anchor?: string,
  ): Chain;

  /**
   * Boarding a moving carrier's seat at speed: the performer leaves its support moving with the carrier and lands astride the named seat, optionally holding the carrier's horn or a partner's forearm on the way.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanBoard`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRide.board is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRide.board is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRide.board is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRide.board is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRide.board is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRide.board is provided by the chain that implements IAutoMovieMotionHumanRide.
   */
  board(params: IAutoMovieMotionHumanRide.IBoard, anchor?: string): Chain;

  /**
   * One single-handed or bilateral push and recovery by a rider already seated on a moving manual wheelchair.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanHandrimStroke`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRide.handrimStroke is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRide.handrimStroke is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRide.handrimStroke is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRide.handrimStroke is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRide.handrimStroke is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRide.handrimStroke is provided by the chain that implements IAutoMovieMotionHumanRide.
   */
  handrimStroke(
    params: IAutoMovieMotionHumanRide.IHandrimStroke,
    anchor?: string,
  ): Chain;

  /**
   * A seated cyclist rises against the pedals and returns to the saddle while the same bicycle continues along its authored course.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanBicycleEffort`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRide.bicycleEffort is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRide.bicycleEffort is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRide.bicycleEffort is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRide.bicycleEffort is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRide.bicycleEffort is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRide.bicycleEffort is provided by the chain that implements IAutoMovieMotionHumanRide.
   */
  bicycleEffort(
    params: IAutoMovieMotionHumanRide.IBicycleEffort,
    anchor?: string,
  ): Chain;

  /**
   * Wheeling a bicycle by hand: walk or run beside it with one hand on its near handlebar grip while the scene rolls it along its own course.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanBikeGuide`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRide.bikeGuide is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRide.bikeGuide is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRide.bikeGuide is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRide.bikeGuide is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRide.bikeGuide is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRide.bikeGuide is provided by the chain that implements IAutoMovieMotionHumanRide.
   */
  bikeGuide(
    params: IAutoMovieMotionHumanRide.IBikeGuide,
    anchor?: string,
  ): Chain;

  /**
   * A grounded high-seat mount or dismount on a stopped bicycle at an authored boundary.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanBikeTransfer`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRide.bikeTransfer is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRide.bikeTransfer is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRide.bikeTransfer is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRide.bikeTransfer is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRide.bikeTransfer is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRide.bikeTransfer is provided by the chain that implements IAutoMovieMotionHumanRide.
   */
  bikeTransfer(
    params: IAutoMovieMotionHumanRide.IBikeTransfer,
    anchor?: string,
  ): Chain;

  /**
   * One staged transfer between two fixed, parallel spacecraft handrails, the named hand delivering the departure impulse and absorbing the stop.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanSpacecraftGlide`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRide.spacecraftGlide is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRide.spacecraftGlide is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRide.spacecraftGlide is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRide.spacecraftGlide is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRide.spacecraftGlide is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRide.spacecraftGlide is provided by the chain that implements IAutoMovieMotionHumanRide.
   */
  spacecraftGlide(
    params: IAutoMovieMotionHumanRide.ISpacecraftGlide,
    anchor?: string,
  ): Chain;
}

/**
 * Riding: a seated person carried by a support that moves by itself, such
 * as a car, a bicycle or a horse given to the performance as a moving prop
 * (`HumanObject.prop` with a motion).
 *
 * The rider sits down on the support first (`sit` on its seat where it
 * stands at that second; `HumanObject.seat` reads a saddle with its pedals
 * or stirrups) and then rides it: the seated posture is carried rigidly
 * with the support, turning, leaning and pitching as it does, the seat and
 * each foot that rested on it bearing on it, so nothing slides in the
 * support's frame. The arms, the hands, the head and the trunk's turn are
 * yielded, so steering, holding on, waving, looking and aiming from the
 * saddle are actions performed over the ride. Register `HumanRide.ride` to use it.
 *
 * With `rising` the rider posts to a trot, by a stride time or on the
 * strides of a cue track; with `feet` each foot stays on a part that moves
 * within the support, a pedal on its crank or a stirrup; with `hands` each
 * hand holds a grip, a rein or a wheel's rim and follows it the same way,
 * the trunk leaning forward at each instant as far as the hands need to
 * reach what they hold (`HumanMountReach.reach`), as a fixed-seat rower
 * leans to the catch the oar's handle comes to. First pass: the rider
 * leans exactly as the support does and absorbs no bump, a pedalling foot
 * keeps its pitch to the frame except where the leg would run short and it
 * points down about its ball (`HumanMountRider`), and mounting and dismounting are the
 * sitting actions. The ride passes on the seat it was entered on as its
 * base, so `rise` after it gets off a saddle to the left unasked.
 *
 * @evidence contracts/development/common.md#meaningful-documentation duration: Seconds ridden, more than none. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. rising: A rising trot: the mount's stride time, seconds, or the cue track of the performance that holds its strides (the footfalls of one diagonal, as the mount's own ride publishes them). The rider stands in the stirrups and sits again once a stride, the seat rising `POST` thigh lengths off the saddle, so both feet must rest on the support. On a cue track the seat is down at each of its instants and seated before the first and after the last. Seated throughout when absent. seat: The support's point the seat stays on, by its id, where the seat itself moves within the support: a saddle on a horse's trunk, which rises and falls with the stride over the course its root follows. The body is carried with the support alone when absent.
 * @evidence contracts/development/design.md#principled-representation duration: Seconds ridden, more than none. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. rising: A rising trot: the mount's stride time, seconds, or the cue track of the performance that holds its strides (the footfalls of one diagonal, as the mount's own ride publishes them). The rider stands in the stirrups and sits again once a stride, the seat rising `POST` thigh lengths off the saddle, so both feet must rest on the support. On a cue track the seat is down at each of its instants and seated before the first and after the last. Seated throughout when absent. seat: The support's point the seat stays on, by its id, where the seat itself moves within the support: a saddle on a horse's trunk, which rises and falls with the stride over the course its root follows. The body is carried with the support alone when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanRide.ts (HumanRide.ride, context); lexicon/HumanRide.ts (HumanRide.ride).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The rider names an existing support prop and its affordances; no mount geometry or gait is fabricated when the support lacks them.
 */
export namespace IAutoMovieMotionHumanRide {
  /**
   * The parameters of `travelCar`: `IAutoMovieMotionHumanTravelCar.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanTravelCar.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTravelCar.IParams` owns the shape; the alias serves `travelCar` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ITravelCar = IAutoMovieMotionHumanTravelCar.IParams;

  /**
   * The parameters of `travelCarExit`: `IAutoMovieMotionHumanTravelCarExit.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanTravelCarExit.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTravelCarExit.IParams` owns the shape; the alias serves `travelCarExit` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ITravelCarExit = IAutoMovieMotionHumanTravelCarExit.IParams;

  /**
   * The parameters of `travelLeaf`: `IAutoMovieMotionHumanTravelLeaf.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanTravelLeaf.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTravelLeaf.IParams` owns the shape; the alias serves `travelLeaf` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ITravelLeaf = IAutoMovieMotionHumanTravelLeaf.IParams;

  /**
   * The parameters of `rideVehicle`: `IAutoMovieMotionHumanRide.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanRide.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRide.IParams` owns the shape; the alias serves `rideVehicle` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IRideVehicle = IAutoMovieMotionHumanRide.IParams;

  /**
   * The parameters of `board`: `IAutoMovieMotionHumanBoard`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanBoard`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanBoard` owns the shape; the alias serves `board` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IBoard = IAutoMovieMotionHumanBoard;

  /**
   * The parameters of `handrimStroke`: `IAutoMovieMotionHumanHandrimStroke`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanHandrimStroke`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanHandrimStroke` owns the shape; the alias serves `handrimStroke` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IHandrimStroke = IAutoMovieMotionHumanHandrimStroke;

  /**
   * The parameters of `bicycleEffort`: `IAutoMovieMotionHumanBicycleEffort`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanBicycleEffort`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanBicycleEffort` owns the shape; the alias serves `bicycleEffort` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IBicycleEffort = IAutoMovieMotionHumanBicycleEffort;

  /**
   * The parameters of `bikeGuide`: `IAutoMovieMotionHumanBikeGuide`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanBikeGuide`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanBikeGuide` owns the shape; the alias serves `bikeGuide` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IBikeGuide = IAutoMovieMotionHumanBikeGuide;

  /**
   * The parameters of `bikeTransfer`: `IAutoMovieMotionHumanBikeTransfer`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanBikeTransfer`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanBikeTransfer` owns the shape; the alias serves `bikeTransfer` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IBikeTransfer = IAutoMovieMotionHumanBikeTransfer;

  /**
   * The parameters of `spacecraftGlide`: `IAutoMovieMotionHumanSpacecraftGlide`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanSpacecraftGlide`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSpacecraftGlide` owns the shape; the alias serves `spacecraftGlide` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ISpacecraftGlide = IAutoMovieMotionHumanSpacecraftGlide;

  /**
   * Parameters of a ride.
   *
   * @evidence contracts/development/common.md#meaningful-documentation duration: Seconds ridden, more than none. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. rising: A rising trot: the mount's stride time, seconds, or the cue track of the performance that holds its strides (the footfalls of one diagonal, as the mount's own ride publishes them). The rider stands in the stirrups and sits again once a stride, the seat rising `POST` thigh lengths off the saddle, so both feet must rest on the support. On a cue track the seat is down at each of its instants and seated before the first and after the last. Seated throughout when absent. seat: The support's point the seat stays on, by its id, where the seat itself moves within the support: a saddle on a horse's trunk, which rises and falls with the stride over the course its root follows. The body is carried with the support alone when absent.
   * @evidence contracts/development/design.md#principled-representation duration: Seconds ridden, more than none. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. rising: A rising trot: the mount's stride time, seconds, or the cue track of the performance that holds its strides (the footfalls of one diagonal, as the mount's own ride publishes them). The rider stands in the stirrups and sits again once a stride, the seat rising `POST` thigh lengths off the saddle, so both feet must rest on the support. On a cue track the seat is down at each of its instants and seated before the first and after the last. Seated throughout when absent. seat: The support's point the seat stays on, by its id, where the seat itself moves within the support: a saddle on a horse's trunk, which rises and falls with the stride over the course its root follows. The body is carried with the support alone when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanRide.ts (HumanRide.ride, context); lexicon/HumanRide.ts (HumanRide.ride).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional riding, restraint and rising choices refer to the support's declared affordances and cue tracks; the ride planner owns missing-support refusals.
   */
  export interface IParams {
    /** The moving prop ridden: its subject id in the performance. */
    on: string;

    /** Seconds ridden, more than none. */
    duration: number;

    /**
     * A rising trot: the mount's stride time, seconds, positive, or the cue
     * track of the performance that holds its strides (the footfalls of one
     * diagonal, as the mount's own ride publishes them; a trot's stride time
     * is on `IAutoMovieMotionHumanMounted.stride`). The rider stands in the
     * stirrups and sits again once a stride, the seat rising `POST` thigh
     * lengths (`HumanRide.POST`, 0.25, provisional) off the saddle, so both
     * feet must rest on the support. On a cue track the seat is down at each
     * of its instants and seated before the first and after the last. Seated
     * throughout when absent.
     */
    rising?:
      | number
      | {
          /** Performance cue-track id publishing one diagonal's footfalls; the rising rider sits at each instant and before the first and after the last. */
          cue: string;
        };

    /**
     * The support's point each foot stays on, by its id, for a part that
     * moves within the support: a pedal on its turning crank, a stirrup on
     * a trotting horse (`IAutoMovieMotionHumanProp.point`). The foot keeps the place it
     * had on that point when the ride began. A foot not named, or a point
     * that only moves with the support, is carried rigidly.
     */
    feet?: Partial<Record<"left" | "right", string>>;

    /**
     * Acquire each named foot support over the first 0.6 seconds of the ride,
     * then follow its actual material point. By default the feet keep the
     * offset they had on the named rests when the ride began.
     */
    placeFeet?: boolean;

    /**
     * The support's point the seat stays on, by its id, where the seat
     * itself moves within the support: a saddle on a horse's trunk, which
     * rises and falls with the stride over the course its root follows.
     * The body is carried with the support alone when absent.
     */
    seat?: string;

    /**
     * The support's point each hand holds, by its id: a handlebar grip, a
     * rein, a wheel's rim. The hand goes to it over `TAKE` seconds from the
     * ride's start and stays on it, following a part that moves within the
     * support. The arms are still yielded, so an arm action over the ride
     * takes a hand off for as long as it lasts. The hand turns to the
     * point and closes on it (`HumanMountRider.hold`).
     */
    hands?: Partial<Record<"left" | "right", string>>;

    /**
     * Optional saddle-relative movement on the named seat point. Cue ids
     * refer to tracks in the performance and their instants are film seconds.
     * At least one of stride, jump and lookBack must be set.
     */
    equestrian?: {
      /** One touchdown track, or ordered nonoverlapping tracks that change gait or lead where one track ends and the next begins. */
      stride?: EquestrianStrides;

      /**
       * Follow an authored jumping support from approach through recovery.
       * Each track must publish exactly one instant within the ride, in the
       * order below. Both feet must enter on their named stirrups. Compose
       * a jump in a ride without rising trot.
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

      /** An over-shoulder film pose centred on a single cue. The pelvis remains with the saddle. */
      lookBack?: {
        /** The track with one instant inside the ride, at the fullest turn. */
        cue: string;
        /** Which shoulder the rider looks over. */
        side: "left" | "right";
        /** Total seconds of the turn and return, within the ride. Greater than zero. */
        duration: number;
      };
    };
  }

  /**
   * One saddle-relative response over consecutive real carrier touchdowns.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies actual hoof cue tracks, their film clock, three admitted body responses and canter lead.
   * @evidence contracts/development/design.md#principled-representation A named cue track and gait select the response. Canter lead controls lateral sign. Runtime planning orders authored windows and verifies coverage.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Track cues keep the existing performance time owner. The rider reads this selected response without owning any animal geometry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No inferred horse motion, reassigned contact or invented touchdown is supplied by this interface.
   */
  export interface IEquestrianStride {
    /** Performance cue-track id holding consecutive landings, in film seconds, of one hind hoof for walk, one diagonal for trot or the leading fore hoof for canter and gallop. */
    cue: string;

    /** The carrier's gait over this track. */
    gait: EquestrianGait;

    /** Canter or gallop lead, which sets the sign of the pelvic roll. Left when absent; not read for walk or trot. */
    lead?: EquestrianLead;
  }

  /**
   * The stride clock of a ride: one touchdown track, or an ordered list whose tracks do not overlap in time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two accepted forms and the ordering rule.
   * @evidence contracts/development/design.md#principled-representation A single record keeps the original one-gait form; a list carries gait and lead changes. Overlap is checked when the ride is planned, since it depends on the cue tracks' film seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read only by the ride's equestrian preparation and its generated schema.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The list is not a map keyed by gait, so the same gait can recur after a change.
   */
  export type EquestrianStrides =
    | IEquestrianStride
    | readonly IEquestrianStride[];

  /**
   * A mounted gait the rider's saddle response distinguishes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the four gaits whose pelvic response the ride models; the gallop, like the canter, rocks once per stride and rolls to its lead, its amplitudes the canter's, provisional.
   * @evidence contracts/development/design.md#principled-representation A closed literal union; the gaited breeds' clocks have no modeled rider response.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `IEquestrianStride.gait` and the ride's pitch and roll response.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type EquestrianGait = "walk" | "trot" | "canter" | "gallop";

  /**
   * A canter or gallop lead: the side whose fore hoof lands last and reaches farthest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a lead is.
   * @evidence contracts/development/design.md#principled-representation A closed literal union of the two sides.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `IEquestrianStride.lead`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type EquestrianLead = "left" | "right";
}
