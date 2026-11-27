import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanEnvironmentRecovery } from "./IAutoMovieMotionHumanEnvironmentRecovery";
import type { IAutoMovieMotionHumanStuntFall } from "./IAutoMovieMotionHumanStuntFall";
import type { IAutoMovieMotionHumanCollapse } from "./IAutoMovieMotionHumanCollapse";
import type { IAutoMovieMotionHumanKnockdown } from "./IAutoMovieMotionHumanKnockdown";
import type { IAutoMovieMotionHumanPerturb } from "./IAutoMovieMotionHumanPerturb";
import type { IAutoMovieMotionHumanStagger } from "./IAutoMovieMotionHumanStagger";
import type { IAutoMovieMotionHumanThrown } from "./IAutoMovieMotionHumanThrown";
import type { IAutoMovieMotionHumanVehicleHit } from "./IAutoMovieMotionHumanVehicleHit";
import type { IAutoMovieMotionHumanWireFlight } from "./IAutoMovieMotionHumanWireFlight";

/**
 * The falls and the balance reactions: a collapse, a stagger, a knockdown, a
 * body thrown or hit by a car, a perturbation, a wire flight or arrest, a
 * staged stunt fall and the recovery from a trip or a slip. Each is planned by
 * physics of the body and its support, not by a fixed pose. A reaction that
 * leaves the feet where they are is a `IAutoMovieMotionHumanReaction`, not a
 * fall.
 *
 * `AutoMovieMotionHumanFall.GOALKEEPER_DIVE_LEFT` and `GOALKEEPER_DIVE_RIGHT`
 * (`IDivePreset`) are the one-side dives of a goalkeeper, data spread into the
 * dive law's parameters; a preset adds no method.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanFall` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanFall<Chain> {
  /**
   * A staged collapse: the body goes down to the floor in a chosen direction
   * and tone, for a faint or a fatal hit.
   *
   * Registered law: `registered("collapse", params)`; not a chain method.
   *
   * @param params The `direction`, `tone`, `side`, `target`, `sag` and `hold`
   *   of `IAutoMovieMotionHumanCollapse.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  collapse(
    params: IAutoMovieMotionHumanCollapse.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A stagger: a blow pushes the centre of mass past the base of support and
   * recovery steps catch it.
   *
   * @param params The `from`, `speed` and `manner` of
   *   `IAutoMovieMotionHumanStagger.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  stagger(params: IAutoMovieMotionHumanStagger.IParams, anchor?: string): Chain;

  /**
   * A knockdown: the legs give way and the body goes down away from the blow,
   * sitting onto the floor and falling back to lie supine.
   *
   * @param params The `target` and `hold` of
   *   `IAutoMovieMotionHumanKnockdown.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  knockdown(
    params: IAutoMovieMotionHumanKnockdown.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A struck body thrown clear of the floor by a blast or a jerk-back, then
   * landing on its back.
   *
   * Registered law: `registered("thrown", params)`; not a chain method.
   *
   * @param params The `rig`, `from`, `distance`, `height`, `hold` and `wall` of
   *   `IAutoMovieMotionHumanThrown.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  thrown(params: IAutoMovieMotionHumanThrown.IParams, anchor?: string): Chain;

  /**
   * One perturbation law whose response follows from the forces on its
   * performer: the body absorbs an impulse within its base, catches it with
   * capture steps, or falls, as the engine's balance outcome decides from the
   * impulse, the body's mass and its support
   * (`resolveAutoMovieBalanceOutcome`), or as the author fixes the outcome.
   *
   * @param params The `outcome`, `partner`, `fulcrum` and `on` of
   *   `IAutoMovieMotionHumanPerturb.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  perturb(params: IAutoMovieMotionHumanPerturb.IParams, anchor?: string): Chain;

  /**
   * A body flown on wires along an authored path that ignores gravity: a
   * superhero's flight, a wuxia leap, a levitation (wire work in Hong Kong
   * action cinema, David Bordwell, Planet Hong Kong, 2nd ed., 2011).
   *
   * Registered law: `registered("wireFlight", params)`; not a chain method.
   *
   * @param params The `to`, `via`, `duration`, `shape` and `touches` of
   *   `IAutoMovieMotionHumanWireFlight.IParams`.
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
   * Registered law: `registered("vehicleHit", params)`; not a chain method.
   *
   * @param params The `vehicle`, `edge`, `horizon` and `hold` of
   *   `IAutoMovieMotionHumanVehicleHit.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  vehicleHit(
    params: IAutoMovieMotionHumanVehicleHit.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A body held on a wire after a free drop: it falls `drop` metres, then the
   * wire decelerates it to rest at the height `stop`; a fall the wire cannot
   * stop above `stop` is refused.
   *
   * Registered law: `registered("wireArrest", params)`; not a chain method.
   *
   * @param params The `drop`, `stop` and `deceleration` of
   *   `IAutoMovieMotionHumanWireFlight.IArrest`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  wireArrest(
    params: IAutoMovieMotionHumanWireFlight.IArrest,
    anchor?: string,
  ): Chain;

  /**
   * A staged stunt fall: a tumble or a seat slide down a named staircase, or a
   * high fall from a named top onto a pad or the ground.
   *
   * Registered law: `registered("stuntFall", params)`; not a chain method.
   *
   * @param params The `kind` and its members of
   *   `IAutoMovieMotionHumanStuntFall.IParams`: `stairs` and `slide` for a
   *   staircase, `exit`, `pad`, `top` and `descender` for a high fall.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  stuntFall(
    params: IAutoMovieMotionHumanStuntFall.IParams,
    anchor?: string,
  ): Chain;

  /**
   * The answer to a staged trip or slip in a walk: the walk is cut at the
   * measured cue and continues into a capture step, a fall or a braced rail
   * catch.
   *
   * Registered law: `registered("environmentalRecovery", params)`; not a chain
   * method.
   *
   * @param params The `kind`, `foot`, `outcome` and `rail` of
   *   `IAutoMovieMotionHumanEnvironmentRecovery.IParams`, with `obstacle` for a
   *   trip and `coefficient` and `support` for a slip.
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
   * Registered law: `registered("vehicleDive", params)`; not a chain method.
   *
   * @param params The `vehicle`, `side` and `horizon` of
   *   `IAutoMovieMotionHumanVehicleHit.IDive`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  vehicleDive(
    params: IAutoMovieMotionHumanVehicleHit.IDive,
    anchor?: string,
  ): Chain;
}

/** The parameter types of the Fall methods. */
export namespace IAutoMovieMotionHumanFall {
  /**
   * The parameters of `environmentalRecovery`: the law's own
   * `IAutoMovieMotionHumanEnvironmentRecovery.IParams`, unchanged.
   */
  export type IEnvironmentRecovery =
    IAutoMovieMotionHumanEnvironmentRecovery.IParams;

  /**
   * The values a goalkeeper's dive fixes: the side the body dives to. It is
   * spread into the dive law's parameters, which add the kind of fall.
   */
  export interface IDivePreset {
    /** The side the body dives to, the person's own left or right. */
    side: AutoMovieHumanSide;
  }
}
