import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPrehension,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPrehension } from "./HumanPrehension";

/** Time the loaded placement and the reverse of the empty-hand exit. */
export function putDownTravel(
  context: IAutoMovieMotionHumanActionContext,
  entry: IAutoMovieRigidTransform,
  rest: IAutoMovieRigidTransform,
  home: IAutoMovieRigidTransform,
  setback: number,
  mouth?: IAutoMovieVector3,
  route?: putDownTravel.IRoute,
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
  if (route !== undefined) {
    const frame: (offset: IAutoMovieVector3) => IAutoMovieRigidTransform = (
      offset: IAutoMovieVector3,
    ): IAutoMovieRigidTransform => ({
      position: Vector3.add(rest.position, offset),
      rotation: rest.rotation,
    });
    const openings: readonly IAutoMovieRigidTransform[] = [
      ...route.approach.map(frame),
      opening,
      ...route.insertion.map(frame),
      rest,
    ];
    const first: IAutoMovieRigidTransform = openings[0]!;
    const along: IAutoMovieMotionHumanPrehension.ITransport[] = openings
      .slice(1)
      .map(
        (
          to: IAutoMovieRigidTransform,
          index: number,
        ): IAutoMovieMotionHumanPrehension.ITransport => {
          const from: IAutoMovieRigidTransform = openings[index]!;
          return transport(
            from,
            to,
            HumanPrehension.carry(distance(from.position, to.position)),
            0,
          );
        },
      );
    const approach: number = HumanPrehension.duration(
      context.skill,
      context.random("place"),
      distance(entry.position, first.position),
      0,
    );
    const withdraw: number = HumanPrehension.nominal(
      distance(home.position, first.position),
      0,
    );
    return {
      carry: joinRoute([transport(entry, first, approach, 0), ...along]),
      retreat: joinRoute([transport(home, first, withdraw, 0), ...along]),
      aperture: along
        .slice(0, route.approach.length)
        .reduce(
          (
            time: number,
            span: IAutoMovieMotionHumanPrehension.ITransport,
          ): number => time + span.duration,
          approach,
        ),
    };
  }

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

/** The route segment active at a path second and the second on its own clock. */
interface IActiveSpan {
  /** The active segment. */
  span: IAutoMovieMotionHumanPrehension.ITransport;

  /** Seconds since that segment began. */
  local: number;
}

/** Read the active minimum-jerk span on the local clock of the whole path. */
function joinRoute(
  spans: readonly IAutoMovieMotionHumanPrehension.ITransport[],
): IAutoMovieMotionHumanPrehension.ITransport {
  const duration: number = spans.reduce(
    (sum: number, span: IAutoMovieMotionHumanPrehension.ITransport): number =>
      sum + span.duration,
    0,
  );
  const active = (seconds: number): IActiveSpan => {
    let local: number = seconds;
    for (const span of spans) {
      if (local <= span.duration) return { span, local };
      local -= span.duration;
    }
    const last: IAutoMovieMotionHumanPrehension.ITransport =
      spans[spans.length - 1]!;
    return { span: last, local: last.duration };
  };
  return {
    duration,
    wrist: (seconds: number): IAutoMovieVector3 => {
      const { span, local }: IActiveSpan = active(seconds);
      return span.wrist(local);
    },
    turn: (seconds: number): IAutoMovieRigidTransform["rotation"] => {
      const { span, local }: IActiveSpan = active(seconds);
      return span.turn(local);
    },
  };
}

/** The loaded and unloaded transports and the aperture's clock. */
export namespace putDownTravel {
  /** Seat-relative waypoint offsets in world metres, in travel order. */
  export interface IRoute {
    /** Optional stops before the compulsory aperture. */
    approach: readonly IAutoMovieVector3[];
    /** Optional stops between the aperture and seat. */
    insertion: readonly IAutoMovieVector3[];
  }

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
