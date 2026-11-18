import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPrehension,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPrehension } from "./HumanPrehension";

/**
 * Time the loaded placement and the reverse of the empty-hand exit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Both paths share the resting wrist frame and optionally visit an aligned aperture.
 * @evidence contracts/development/implementation.md#principled-implementation Two direct minimum-jerk movements join at zero velocity with a shared attitude. Empty-hand withdrawal reverses the insertion movement.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build an ordinary path or join two movements, reusing the same builder.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The aperture supplies the direction and distance of insertion.
 * @evidence contracts/development/implementation.md#efficient-algorithms Plans a fixed number of movements and samples only the active one.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work HumanPrehension owns movement timing, paths and attitude interpolation.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Samplers retain only fixed movement data.
 */
export function putDownTravel(
  context: IAutoMovieMotionHumanActionContext,
  entry: IAutoMovieRigidTransform,
  rest: IAutoMovieRigidTransform,
  home: IAutoMovieRigidTransform,
  setback: number,
  mouth?: IAutoMovieVector3,
): putDownTravel.ITravel {
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(a, b));
  const transport = (
    from: IAutoMovieRigidTransform,
    to: IAutoMovieRigidTransform,
    seconds: number,
    finalStretch: number,
  ): IAutoMovieMotionHumanPrehension.ITransport =>
    HumanPrehension.transport(
      from.position,
      to.position,
      { x: 0, y: -1, z: 0 },
      finalStretch,
      { from: from.rotation, to: to.rotation },
      seconds,
    );
  const opening: IAutoMovieRigidTransform =
    mouth === undefined ? rest : { position: mouth, rotation: rest.rotation };
  const approach: number = HumanPrehension.duration(
    context.skill,
    context.random("place"),
    distance(entry.position, opening.position),
    0,
  );
  const back: number = HumanPrehension.nominal(
    distance(home.position, opening.position),
    0,
  );
  if (mouth === undefined)
    return {
      carry: transport(entry, rest, approach, setback),
      retreat: transport(home, rest, back, setback),
    };

  // An aligned hand enters and leaves along the same straight corridor.
  const insertion: IAutoMovieMotionHumanPrehension.ITransport = transport(
    opening,
    rest,
    HumanPrehension.carry(distance(mouth, rest.position)),
    0,
  );
  const join = (
    first: IAutoMovieMotionHumanPrehension.ITransport,
  ): IAutoMovieMotionHumanPrehension.ITransport => ({
    duration: first.duration + insertion.duration,
    wrist: (seconds: number): IAutoMovieVector3 =>
      seconds <= first.duration
        ? first.wrist(seconds)
        : insertion.wrist(seconds - first.duration),
    turn: (seconds: number): IAutoMovieRigidTransform["rotation"] =>
      seconds <= first.duration
        ? first.turn(seconds)
        : insertion.turn(seconds - first.duration),
  });
  return {
    carry: join(transport(entry, opening, approach, 0)),
    retreat: join(transport(home, opening, back, 0)),
    aperture: approach,
  };
}

/**
 * The loaded and unloaded transports and the aperture's clock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names both paths and the event.
 * @evidence contracts/development/design.md#principled-representation Both paths are action-local wrist samplers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the placement planner to emit events and sample the hand.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Distinguishes loaded transport from the reverse-sampled return.
 */
export namespace putDownTravel {
  /**
   * The two paths and optional aperture crossing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each direction and the crossing time unit.
   * @evidence contracts/development/design.md#principled-representation Local-time wrist samplers with an optional event in seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The placement planner reads these three fields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Ordinary placement has no aperture event.
   */
  export interface ITravel {
    /** From the displayed entry wrist to the resting wrist. */
    carry: IAutoMovieMotionHumanPrehension.ITransport;
    /** From the hanging wrist to the resting wrist, sampled backward on exit. */
    retreat: IAutoMovieMotionHumanPrehension.ITransport;
    /** Seconds from entry to the aperture when specified. */
    aperture?: number;
  }
}
