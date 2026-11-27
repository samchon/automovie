import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
} from "../core";
import { AutoMovieArchetypeEquineStance } from "./AutoMovieArchetypeEquineStance";
import type { AutoMovieArchetypeEquineStanceCue } from "./AutoMovieArchetypeEquineStanceCue";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";

/** A named instant of a ride. */
type Instant = AutoMovieArchetypeRide.IRide<string, string>["instants"][number];

/** One rein's ride and the film second it takes over. */
interface ISegment<Id extends string, D extends string> {
  /** The film second the rein begins. */
  from: number;

  /** The rein's ride, its halt and turns included. */
  ride: AutoMovieArchetypeRide.IRide<Id, D>;
}

/**
 * An equid lunged on a circle round its handler: each rein a ride round the
 * circle at its gaits, a halt, a quarter turn in on the centre to stand facing
 * the handler, and, before the next rein, a further quarter turn on the centre
 * out onto the other rein.
 *
 * Each rein publishes `rein<k>:face` where it stands facing the handler, and
 * every instant of its ride and stance prefixed `rein<k>:`. A rein's course
 * starts on the circle at the equid's bearing from the centre, heading along it
 * with the centre on the rein's side: it moves off, takes each work's laps at
 * its gait and speed (the middle of the gait's admitted speeds when unstated),
 * changes speed between works over the distance its acceleration needs, and
 * brakes to a halt the same way. Its body leans into the circle by the ride's
 * own steady-turn balance (`AutoMovieArchetypeQuadruped.ride`). At the halt the stance turns it on
 * the centre toward the handler (`AutoMovieArchetypeEquineStance`, a spin
 * `about` the centre), holds it facing for `face` seconds, and, between reins,
 * turns it on to the opposite heading, the centre now on its other side, where
 * the next rein moves off. Two turns on the centre carry its root to the far
 * side of the hooves' middle, so each rein starts from where the turns put it.
 *
 * A circle is refused when it is tighter than a work's gait admits: on a circle
 * of radius r at speed v the hooves `d` either side of the path's line travel
 * at v(r ∓ d)/r, and both must stay within the gait's admitted speeds
 * (`AutoMovieArchetypeQuadrupedGait.range`), so r ≥ max(d·v/(v − v_min),
 * d·v/(v_max − v)), the bound a team horse's turn is held to. Two consecutive
 * reins on the same side, which no change of rein joins, are refused.
 *
 * `AutoMovieArchetypeEquineLungeLine` lays the equid's lead out as the lunge
 * line to the handler's line hand at the centre.
 */
export namespace AutoMovieArchetypeEquineLunge {
  /** A point on the floor. */
  export interface IPoint {
    /** World X, metres. */
    x: number;

    /** World Z, metres. */
    z: number;
  }

  /**
   * Which side the centre is on: the left rein circles with the centre on the
   * equid's left, turning left.
   */
  export type Side = "left" | "right";

  /** One work on a rein: laps at a gait. */
  export interface IWork {
    /** The gait. */
    gait: AutoMovieArchetypeQuadrupedGait.Gait;

    /** Laps of the circle, positive, fractions allowed. */
    laps: number;

    /**
     * The speed along the circle, metres per second, within the gait's admitted
     * speeds; their middle when absent.
     */
    speed?: number;
  }

  /** One rein: its side and its works in order. */
  export interface IRein {
    /** The side the centre is on. */
    side: Side;

    /** The works, at least one. */
    work: readonly IWork[];
  }

  /** A lunge. */
  export interface IParams {
    /** The circle's centre, where the handler stands. */
    centre: IPoint;

    /** The circle's radius, the equid's root path, metres. */
    radius: number;

    /**
     * The equid's bearing from the centre where it starts, degrees, 0 along +Z,
     * positive toward +X.
     */
    bearing: number;

    /** The reins in order, alternating sides, at least one. */
    reins: readonly IRein[];

    /** The rate it gathers and loses speed, metres per second squared, positive. */
    acceleration: number;

    /** Seconds each quarter turn on the centre takes, positive. */
    turn: number;

    /** Seconds it stands facing the handler at each halt, at least 0. */
    face: number;
  }

  /**
   * Plan the lunge.
   *
   * @param animal The equid at rest, as its producer built it.
   * @param params The lunge.
   * @returns The ride on the film clock from 0.
   * @throws {AutoMovieArchetypeRefusal} For malformed parameters, two reins on
   *   one side in a row, or a circle tighter than a work's gait admits; as the
   *   ride and the stance refuse.
   */
  export function ride<Id extends string, D extends string>(
    animal: AutoMovieArchetype<
      Id,
      D | AutoMovieArchetypeQuadrupedBody.Dimension
    >,
    params: IParams,
  ): AutoMovieArchetypeRide.IRide<
    Id,
    D | AutoMovieArchetypeQuadrupedBody.Dimension
  > {
    type Ride = AutoMovieArchetypeRide.IRide<
      Id,
      D | AutoMovieArchetypeQuadrupedBody.Dimension
    >;
    const { centre, radius, bearing, reins, acceleration, turn, face } = params;
    if (
      !(radius > 0 && acceleration > 0 && turn > 0 && face >= 0) ||
      reins.length === 0 ||
      reins.some((rein: IRein): boolean => rein.work.length === 0)
    )
      refuse(
        animal.archetype,
        "params",
        params,
        "a lunge needs a positive radius, acceleration and turn, a nonnegative face and reins with works",
      );
    reins.forEach((rein: IRein, k: number): void => {
      if (k > 0 && reins[k - 1]!.side === rein.side)
        refuse(
          animal.archetype,
          `reins[${k}].side`,
          rein.side,
          "consecutive reins change sides",
        );
    });
    const species: AutoMovieArchetypeQuadruped.ISpecies = AutoMovieArchetypeQuadruped.species(animal);
    const withers: number | undefined = animal.dimensions.withersHeight;
    const half: number = halfTrack(animal);

    // Each work's speed, admitted against the circle.
    const speeds: number[][] = reins.map((rein: IRein, k: number): number[] =>
      rein.work.map((work: IWork, w: number): number => {
        const range: ReturnType<typeof AutoMovieArchetypeQuadrupedGait.range> =
          AutoMovieArchetypeQuadrupedGait.range(species, work.gait, withers);
        const speed: number = work.speed ?? (range.minimum + range.maximum) / 2;
        if (
          !(work.laps > 0) ||
          !(speed >= range.minimum && speed <= range.maximum)
        )
          refuse(
            animal.archetype,
            `reins[${k}].work[${w}]`,
            work,
            `a work takes positive laps at a speed within the ${work.gait}'s admitted ${range.minimum} to ${range.maximum} m/s`,
          );
        const least: number = Math.max(
          speed > range.minimum
            ? (half * speed) / (speed - range.minimum)
            : Infinity,
          range.maximum > speed
            ? (half * speed) / (range.maximum - speed)
            : Infinity,
        );
        if (!(radius >= least))
          throw new AutoMovieArchetypeRefusal({
            kind: "parameter",
            archetype: animal.archetype,
            axis: "radius",
            value: radius,
            feasible: {
              kind: "range",
              minimum: least,
              maximum: Infinity,
              unit: "m",
            },
            reason: `on a ${radius} m circle at ${speed} m/s the inside or outside hooves would leave the ${work.gait}'s admitted speeds`,
            fix: "Widen the circle, or take the work at a speed nearer the middle of its gait.",
          });
        return speed;
      }),
    );

    const segments: ISegment<
      Id,
      D | AutoMovieArchetypeQuadrupedBody.Dimension
    >[] = [];
    let start: AutoMovieArchetypeQuadruped.IRideCourse["start"] = {
      x: centre.x + radius * Math.sin((bearing * Math.PI) / 180),
      z: centre.z + radius * Math.cos((bearing * Math.PI) / 180),
      heading: bearing + (reins[0]!.side === "left" ? 90 : -90),
    };
    let film: number = 0;
    const faces: Instant[] = [];
    reins.forEach((rein: IRein, k: number): void => {
      const sign: number = rein.side === "left" ? 1 : -1;
      const arc = (length: number): number =>
        (sign * length * 180) / (Math.PI * radius);
      const legs: AutoMovieArchetypeQuadruped.IRideLeg[] = [];
      const marks: number[] = [];
      let speed: number = 0;
      const shift = (to: number): void => {
        if (to === speed) return;
        legs.push({
          kind: "turn",
          radius,
          angle: arc(Math.abs(to * to - speed * speed) / (2 * acceleration)),
        });
        marks.push(to);
        speed = to;
      };
      rein.work.forEach((work: IWork, w: number): void => {
        shift(speeds[k]![w]!);
        legs.push({
          kind: "turn",
          radius,
          angle: sign * 360 * work.laps,
          gait: work.gait,
        });
        marks.push(speed);
      });
      shift(0);
      const going: Ride = AutoMovieArchetypeQuadruped.ride(animal, {
        start,
        at: film,
        cruise: Math.max(...speeds[k]!),
        acceleration,
        deceleration: acceleration,
        startSpeed: 0,
        startFromStanding: true,
        leanIn: true,
        legs,
        speeds: marks,
      });
      const halt: number = going.duration;
      const last: boolean = k === reins.length - 1;
      const settle: number = turn / 4;
      const cues: AutoMovieArchetypeEquineStanceCue.ISpin[] = [
        {
          kind: "spin",
          about: "centre",
          degrees: 90 * sign,
          from: halt,
          entry: turn,
          hold: face,
          exit: settle,
        },
      ];
      if (!last)
        cues.push({
          kind: "spin",
          about: "centre",
          degrees: 90 * sign,
          from: halt + turn + face + settle,
          entry: turn,
          hold: 0,
          exit: settle,
        });
      segments.push({
        from: film,
        ride: AutoMovieArchetypeEquineStance.after(animal, going, cues),
      });
      faces.push({ seconds: halt + turn, label: `rein${k + 1}:face` });
      film = cues.at(-1)!.from + turn + cues.at(-1)!.hold + settle;
      if (last) return;

      // Two turns on the centre carry the root through the hooves' middle to its far side.
      const stopped: AutoMovieArchetypeRide.ISample<
        Id,
        D | AutoMovieArchetypeQuadrupedBody.Dimension
      > = going.at(halt);
      const middle: IAutoMovieVector3 = Vector3.scale(
        AutoMovieArchetypeQuadrupedBody.LIMBS.reduce(
          (
            sum: IAutoMovieVector3,
            limb: AutoMovieArchetypeQuadrupedBody.Limb,
          ): IAutoMovieVector3 =>
            Vector3.add(sum, endpoint(stopped.archetype.parts, limb)),
          { x: 0, y: 0, z: 0 },
        ),
        1 / AutoMovieArchetypeQuadrupedBody.LIMBS.length,
      );
      const root: IAutoMovieVector3 = AutoMovieArchetypeFrame.compose(
        stopped.placement,
        AutoMovieArchetypeFrame.upright({
          x: 2 * middle.x,
          y: 0,
          z: 2 * middle.z,
        }),
      ).translation;
      start = {
        x: root.x,
        z: root.z,
        heading: headingOf(stopped.placement) + 180,
      };
    });

    const total: number = film;
    const find = (seconds: number): Ride => {
      for (let k: number = segments.length - 1; k > 0; --k)
        if (seconds >= segments[k]!.from) return segments[k]!.ride;
      return segments[0]!.ride;
    };
    const at = (
      seconds: number,
    ): AutoMovieArchetypeRide.ISample<
      Id,
      D | AutoMovieArchetypeQuadrupedBody.Dimension
    > => find(seconds).at(Math.min(seconds, total));
    const instants: Instant[] = segments
      .flatMap(
        (
          segment: ISegment<Id, D | AutoMovieArchetypeQuadrupedBody.Dimension>,
          k: number,
        ): Instant[] =>
          segment.ride.instants
            .filter(
              (instant: Instant): boolean =>
                instant.seconds >= segment.from &&
                (k === segments.length - 1 ||
                  instant.seconds < segments[k + 1]!.from),
            )
            .map(
              (instant: Instant): Instant => ({
                ...instant,
                label: `rein${k + 1}:${instant.label}`,
              }),
            ),
      )
      .concat(faces)
      .sort((p: Instant, q: Instant): number => p.seconds - q.seconds);
    const first: Ride = segments[0]!.ride;
    return {
      plan: {
        ...first.plan,
        duration: total,
        at: (seconds: number): AutoMovieArchetypeCourse.IState =>
          find(seconds).plan.at(seconds),
      },
      duration: total,
      instants,
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: AutoMovieArchetypeRide.ISample<
          Id,
          D | AutoMovieArchetypeQuadrupedBody.Dimension
        > = at(seconds);
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }

  /** Half the hooves' lateral spacing at rest, metres: the fore pair's. */
  function halfTrack<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
  ): number {
    return (
      Math.abs(
        endpoint(animal.parts, "leftFore").x -
          endpoint(animal.parts, "rightFore").x,
      ) / 2
    );
  }

  /**
   * A limb's terminal endpoint in the model's space: the far end of its last
   * bar.
   */
  function endpoint(
    parts: readonly IAutoMovieModelPart[],
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
  ): IAutoMovieVector3 {
    const pastern: IAutoMovieModelPart = parts.find(
      (part: IAutoMovieModelPart): boolean =>
        part.id === AutoMovieArchetypeQuadrupedBody.BONES[limb][3],
    )!;
    const frame: IAutoMovieTransform = pastern.transform!;
    const height: number =
      pastern.geometry.type === "primitive" &&
      (pastern.geometry.shape.type === "capsule" ||
        pastern.geometry.shape.type === "cylinder")
        ? pastern.geometry.shape.height
        : NaN;
    return Vector3.add(
      frame.translation,
      Quaternion.rotateVector(frame.rotation, { x: 0, y: height / 2, z: 0 }),
    );
  }

  /** A placement's heading, degrees, 0 along +Z, positive toward +X. */
  function headingOf(placement: IAutoMovieTransform): number {
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      placement.rotation,
      { x: 0, y: 0, z: 1 },
    );
    return (Math.atan2(forward.x, forward.z) * 180) / Math.PI;
  }

  /** A refusal of a malformed lunge. */
  function refuse(
    archetype: string,
    axis: string,
    value: unknown,
    reason: string,
  ): never {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis,
      value,
      feasible: null,
      reason,
      fix: "Give a positive radius, acceleration and turn, reins that alternate sides, and works of positive laps within their gaits' speeds.",
    });
  }
}
