import type { IAutoMovieMotionHumanTravelCar } from "../lexicon/IAutoMovieMotionHumanTravelCar";
import type { IAutoMovieMotionHumanTravelCarExit } from "../lexicon/IAutoMovieMotionHumanTravelCarExit";
import type { IAutoMovieMotionHumanTravelLeaf } from "../lexicon/IAutoMovieMotionHumanTravelLeaf";

/**
 * Mechanism: Riding a vehicle or travelling by one: a car, its exit and a leaf.
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
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanRide.travelCar: Getting into a car through its door: the person stands in the doorway with the back to the seat, sits down onto it sideways with the legs still outside, then swings round on the seat to face the way the seat faces, and the head is ducked under the door's top throughout.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRide.travelCar is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRide.travelCar is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRide.travelCar is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRide.travelCar is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRide.travelCar is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRide.travelCar is provided by the chain that implements IAutoMovieMotionHumanRide.
   */
  travelCar(params: IAutoMovieMotionHumanRide.ITravelCar, anchor?: string): Chain;

  /**
   * Parameters of the opt-in `HumanTravelCarExit.getOut` law for a stationary car with an already-open rear door.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanRide.travelCarExit: Parameters of the opt-in `HumanTravelCarExit.getOut` law for a stationary car with an already-open rear door.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRide.travelCarExit is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRide.travelCarExit is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRide.travelCarExit is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRide.travelCarExit is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRide.travelCarExit is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRide.travelCarExit is provided by the chain that implements IAutoMovieMotionHumanRide.
   */
  travelCarExit(params: IAutoMovieMotionHumanRide.ITravelCarExit, anchor?: string): Chain;

  /**
   * Opening a door by its handle and holding it: the hand reaches the handle, closes on it and goes with it while the leaf swings, the person standing, and walking round with the leaf when the arm alone would lose the handle.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanRide.travelLeaf: Opening a door by its handle and holding it: the hand reaches the handle, closes on it and goes with it while the leaf swings, the person standing, and walking round with the leaf when the arm alone would lose the handle.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRide.travelLeaf is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRide.travelLeaf is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRide.travelLeaf is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRide.travelLeaf is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRide.travelLeaf is provided by the chain that implements IAutoMovieMotionHumanRide.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRide.travelLeaf is provided by the chain that implements IAutoMovieMotionHumanRide.
   */
  travelLeaf(params: IAutoMovieMotionHumanRide.ITravelLeaf, anchor?: string): Chain;
}

/**
 * The parameter types of the Ride methods.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of each Ride method.
 * @evidence contracts/development/design.md#principled-representation Each parameter type is the law's existing type, named once here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One parameter type per method.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is redefined: every name aliases the type its law already reads.
 */
export namespace IAutoMovieMotionHumanRide {
  /** The parameters of `travelCar`. */
  export type ITravelCar = IAutoMovieMotionHumanTravelCar.IParams;

  /** The parameters of `travelCarExit`. */
  export type ITravelCarExit = IAutoMovieMotionHumanTravelCarExit.IParams;

  /** The parameters of `travelLeaf`. */
  export type ITravelLeaf = IAutoMovieMotionHumanTravelLeaf.IParams;
}
