import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanEnvironmentRecovery } from "../lexicon/IAutoMovieMotionHumanEnvironmentRecovery";
import type { IAutoMovieMotionHumanStuntFall } from "../lexicon/IAutoMovieMotionHumanStuntFall";
import type { IAutoMovieMotionHumanCollapse } from "../reaction/IAutoMovieMotionHumanCollapse";
import type { IAutoMovieMotionHumanKnockdown } from "../reaction/IAutoMovieMotionHumanKnockdown";
import type { IAutoMovieMotionHumanPerturb } from "../reaction/IAutoMovieMotionHumanPerturb";
import type { IAutoMovieMotionHumanStagger } from "../reaction/IAutoMovieMotionHumanStagger";
import type { IAutoMovieMotionHumanThrown } from "../reaction/IAutoMovieMotionHumanThrown";
import type { IAutoMovieMotionHumanVehicleHit } from "../reaction/IAutoMovieMotionHumanVehicleHit";
import type { IAutoMovieMotionHumanWireFlight } from "../reaction/IAutoMovieMotionHumanWireFlight";

/**
 * The falls and the balance reactions: a collapse, a stagger, a knockdown, a body thrown or hit by a car, a perturbation, a wire flight or arrest, a staged stunt fall and the recovery from a trip or a slip. Each is planned by physics of the body and its support, not by a fixed pose. A reaction that leaves the feet where they are is a `IAutoMovieMotionHumanReaction`, not a fall.
 *
 * `AutoMovieMotionHumanFall.GOALKEEPER_DIVE_LEFT` and `GOALKEEPER_DIVE_RIGHT` (`IDivePreset`) are the one-side dives of a goalkeeper, data spread into the dive law's parameters; a preset adds no method.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Fall family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Fall laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanFall<Chain> {
  /**
   * A staged collapse: the body goes down to the floor in a chosen direction and tone, for a faint or a fatal hit.
   *
   * @param params The `direction`, `tone`, `side`, `from`, `sag` and `seconds` of `IAutoMovieMotionHumanCollapse.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  collapse(
    params: IAutoMovieMotionHumanCollapse.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A stagger: a blow pushes the centre of mass past the base of support and recovery steps catch it.
   *
   * @param params The `from`, `speed` and `manner` of `IAutoMovieMotionHumanStagger.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  stagger(params: IAutoMovieMotionHumanStagger.IParams, anchor?: string): Chain;

  /**
   * A knockdown: the legs give way and the body goes down away from the blow, sitting onto the floor and falling back to lie supine.
   *
   * @param params The `from` and `seconds` of `IAutoMovieMotionHumanKnockdown.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  knockdown(
    params: IAutoMovieMotionHumanKnockdown.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A struck body thrown clear of the floor by a blast or a jerk-back, then landing on its back.
   *
   * @param params The `rig`, `from`, `distance`, `height`, `seconds` and `wall` of `IAutoMovieMotionHumanThrown.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  thrown(params: IAutoMovieMotionHumanThrown.IParams, anchor?: string): Chain;

  /**
   * One perturbation law whose response follows from the forces on its performer (#3430): the body absorbs an impulse within its base, catches it with capture steps, or falls, as the engine's balance outcome decides from the impulse, the body's mass and its support (`resolveAutoMovieBalanceOutcome`), or as the author fixes the outcome.
   *
   * @param params The `outcome`, `by`, `fulcrum` and `on` of `IAutoMovieMotionHumanPerturb.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  perturb(params: IAutoMovieMotionHumanPerturb.IParams, anchor?: string): Chain;

  /**
   * A body flown on wires along an authored path that ignores gravity: a superhero's flight, a wuxia leap, a levitation (wire work in Hong Kong action cinema, David Bordwell, Planet Hong Kong, 2nd ed., 2011).
   *
   * @param params The `to`, `via`, `seconds`, `shape` and `touches` of `IAutoMovieMotionHumanWireFlight.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  wireFlight(
    params: IAutoMovieMotionHumanWireFlight.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A pedestrian struck by a moving car.
   *
   * @param params The `vehicle`, `edge`, `horizon` and `hold` of `IAutoMovieMotionHumanVehicleHit.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  vehicleHit(
    params: IAutoMovieMotionHumanVehicleHit.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A body held on a wire after a free drop: it falls `drop` metres, then the wire decelerates it to rest at the height `stop`; a fall the wire cannot stop above `stop` is refused.
   *
   * @param params The `drop`, `stop` and `deceleration` of `IAutoMovieMotionHumanWireFlight.IArrest`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  wireArrest(
    params: IAutoMovieMotionHumanWireFlight.IArrest,
    anchor?: string,
  ): Chain;

  /**
   * A staged stunt fall: a tumble or a seat slide down a named staircase, or a high fall from a named top onto a pad or the ground.
   *
   * @param params The `kind` and its members of `IAutoMovieMotionHumanStuntFall.IParams`: `stairs` and `slide` for a staircase, `exit`, `pad`, `top` and `descender` for a high fall.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  stuntFall(
    params: IAutoMovieMotionHumanStuntFall.IParams,
    anchor?: string,
  ): Chain;

  /**
   * The answer to a staged trip or slip in a walk: the walk is cut at the measured cue and continues into a capture step, a fall or a braced rail catch.
   *
   * @param params The `kind`, `foot`, `outcome` and `rail` of `IAutoMovieMotionHumanEnvironmentRecovery.IParams`, with `obstacle` for a trip and `coefficient` and `support` for a slip.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  environmentalRecovery(
    params: IAutoMovieMotionHumanFall.IEnvironmentRecovery,
    anchor?: string,
  ): Chain;

  /**
   * A pedestrian diving clear of a moving car to the side.
   *
   * @param params The `vehicle`, `side` and `horizon` of `IAutoMovieMotionHumanVehicleHit.IDive`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  vehicleDive(
    params: IAutoMovieMotionHumanVehicleHit.IDive,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Fall methods.
 */
export namespace IAutoMovieMotionHumanFall {
  /**
   * The parameters of `environmentalRecovery`: the law's own `IAutoMovieMotionHumanEnvironmentRecovery.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanEnvironmentRecovery` owns the type; the alias serves this family's `environmentalRecovery` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `environmentalRecovery` takes the type its law reads.
   */
  export type IEnvironmentRecovery =
    IAutoMovieMotionHumanEnvironmentRecovery.IParams;

  /**
   * The values a goalkeeper's dive fixes: the side the body dives to. It is spread into the dive law's parameters, which add the kind of fall.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the one value the preset fixes and how it is applied.
   * @evidence contracts/development/design.md#principled-representation `side` is an `AutoMovieHumanSide`, the person's own side, as the dive law reads it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the fixed key of the rows `goalkeeperDiveLeft` and `goalkeeperDiveRight`; the law's other parameters stay open.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the preset carries no value the law does not read.
   */
  export interface IDivePreset {
    /** The side the body dives to, the person's own left or right. */
    side: AutoMovieHumanSide;
  }
}
