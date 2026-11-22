import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type Archetype,
  ArchetypeCourse,
  ArchetypeFrame,
  ArchetypeRefusal,
  type ArchetypeRide,
} from "../core";
import { EquineLine } from "./EquineLine";
import { EquineStance } from "./EquineStance";
import type { EquineStanceCue } from "./EquineStanceCue";
import { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedGait } from "./QuadrupedGait";
import { createQuadruped } from "./createQuadruped";
import { rideQuadruped } from "./rideQuadruped";

/** A named instant of a ride. */
type Instant = ArchetypeRide.IRide<string, string>["instants"][number];

/** One rein's ride and the film second it takes over. */
interface ISegment<Id extends string, D extends string> {
  /** The film second the rein begins. */
  from: number;

  /** The rein's ride, its halt and turns included. */
  ride: ArchetypeRide.IRide<Id, D>;
}

/**
 * An equid lunged on a circle round its handler: each rein a ride round the circle at its gaits, a halt, a quarter turn in on the centre to stand facing the handler, and, before the next rein, a further quarter turn on the centre out onto the other rein.
 *
 * Each rein publishes `rein<k>:face` where it stands facing the handler, and every instant of its ride and stance prefixed `rein<k>:`. A rein's course starts on the circle at the equid's bearing from the centre, heading along it with the centre on the rein's side: it moves off, takes each work's laps at its gait and speed (the middle of the gait's admitted speeds when unstated), changes speed between works over the distance its acceleration needs, and brakes to a halt the same way. Its body leans into the circle by the ride's own steady-turn balance (`rideQuadruped`). At the halt the stance turns it on the centre toward the handler (`EquineStance`, a spin `about` the centre), holds it facing for `face` seconds, and, between reins, turns it on to the opposite heading, the centre now on its other side, where the next rein moves off. Two turns on the centre carry its root to the far side of the hooves' middle, so each rein starts from where the turns put it.
 *
 * A circle is refused when it is tighter than a work's gait admits: on a circle of radius r at speed v the hooves `d` either side of the path's line travel at v(r ∓ d)/r, and both must stay within the gait's admitted speeds (`QuadrupedGait.range`), so r ≥ max(d·v/(v − v_min), d·v/(v_max − v)), the bound a team horse's turn is held to. Two consecutive reins on the same side, which no change of rein joins, are refused.
 *
 * `line` lays the equid's lead out as the lunge line to the handler's line hand at the centre (`EquineLine`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each rein's course, the speeds, the lean, the halt, the turns and the refusals.
 * @evidence contracts/development/design.md#principled-representation A centre, a radius, a starting bearing and the reins with their works, in metres, seconds and degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The plan and its line; the gaits, lean and turns are the ride's and the stance's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The least radius is the gait's own speed bound; no circle is admitted by a table.
 */
export namespace EquineLunge {
  /**
   * A point on the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation World metres.
   * @evidence contracts/development/design.md#principled-representation Two coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The circle's centre.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPoint {
    /** World X, metres. */
    x: number;

    /** World Z, metres. */
    z: number;
  }

  /**
   * Which side the centre is on: the left rein circles with the centre on the equid's left, turning left.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The equid's side facing the centre.
   * @evidence contracts/development/design.md#principled-representation Closed literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A rein's side.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Side = "left" | "right";

  /**
   * One work on a rein: laps at a gait.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The gait, the laps and the speed in metres per second.
   * @evidence contracts/development/design.md#principled-representation A gait, a positive lap count and an optional speed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What a rein's course is made of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IWork {
    /** The gait. */
    gait: QuadrupedGait.Gait;

    /** Laps of the circle, positive, fractions allowed. */
    laps: number;

    /** The speed along the circle, metres per second, within the gait's admitted speeds; their middle when absent. */
    speed?: number;
  }

  /**
   * One rein: its side and its works in order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names its side and works.
   * @evidence contracts/development/design.md#principled-representation A side and at least one work.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One ride of the lunge.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IRein {
    /** The side the centre is on. */
    side: Side;

    /** The works, at least one. */
    work: readonly IWork[];
  }

  /**
   * A lunge.
   *
   * @evidence contracts/development/common.md#meaningful-documentation World metres, degrees and seconds.
   * @evidence contracts/development/design.md#principled-representation The circle, the start, the reins and the authored rates and times.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `ride` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IParams {
    /** The circle's centre, where the handler stands. */
    centre: IPoint;

    /** The circle's radius, the equid's root path, metres. */
    radius: number;

    /** The equid's bearing from the centre where it starts, degrees, 0 along +Z, positive toward +X. */
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
   * The handler's line hand: where the lunge line leaves it, in the frame of the handler at the centre facing the equid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Metres: up from the floor, out toward the equid and aside toward the rein's side.
   * @evidence contracts/development/design.md#principled-representation Three distances.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `line` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IHand {
    /** Height above the floor, metres. */
    height: number;

    /** Distance out from the centre toward the equid, metres. */
    reach: number;

    /** Distance aside toward the rein's side, the side the equid's head is on, metres. */
    spread: number;
  }

  /**
   * A change of the line from one hand to the other at a change of rein, on the film clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Film seconds; three phases of equal seconds: in to the middle, held there while the other hand takes it, out to the other side.
   * @evidence contracts/development/design.md#principled-representation A start and a phase length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `line` reads; the handler's law changes hands on the same clock.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IChange {
    /** Film second the line hand starts in to the middle. */
    from: number;

    /** Seconds each of the three phases takes, positive. */
    phase: number;
  }

  /**
   * Plan the lunge.
   *
   * @param animal The equid at rest, as its producer built it.
   * @param params The lunge.
   * @returns The ride on the film clock from 0.
   * @throws {ArchetypeRefusal} For malformed parameters, two reins on one side in a row, or a circle tighter than a work's gait admits; as the ride and the stance refuse.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the output and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Per rein a course of turn legs round the centre, its halt continued by the stance's turns on the centre, the next rein starting where they leave the root; a sample finds its rein by film second.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, one ride per rein, one dispatching sampler.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every rein is the ride's own course; nothing is blended between reins.
   * @evidence contracts/development/implementation.md#efficient-algorithms One ride and one stance per rein; a sample scans the reins.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the ride, its lean and the stance's turns.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the reins' rides.
   */
  export function ride<Id extends string, D extends string>(
    animal: Archetype<Id, D | QuadrupedBody.Dimension>,
    params: IParams,
  ): ArchetypeRide.IRide<Id, D | QuadrupedBody.Dimension> {
    type Ride = ArchetypeRide.IRide<Id, D | QuadrupedBody.Dimension>;
    const { centre, radius, bearing, reins, acceleration, turn, face } = params;
    if (
      ![centre.x, centre.z, radius, bearing, acceleration, turn, face].every(
        Number.isFinite,
      ) ||
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
    const species: createQuadruped.ISpecies = createQuadruped.species(animal);
    const withers: number | undefined = animal.dimensions.withersHeight;
    const half: number = halfTrack(animal);

    // Each work's speed, admitted against the circle.
    const speeds: number[][] = reins.map((rein: IRein, k: number): number[] =>
      rein.work.map((work: IWork, w: number): number => {
        const range: ReturnType<typeof QuadrupedGait.range> =
          QuadrupedGait.range(species, work.gait, withers);
        const speed: number = work.speed ?? (range.minimum + range.maximum) / 2;
        if (
          !(Number.isFinite(work.laps) && work.laps > 0) ||
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
          throw new ArchetypeRefusal({
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

    const segments: ISegment<Id, D | QuadrupedBody.Dimension>[] = [];
    let start: rideQuadruped.ICourse["start"] = {
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
      const legs: rideQuadruped.ILeg[] = [];
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
      const going: Ride = rideQuadruped(animal, {
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
      const cues: EquineStanceCue.ISpin[] = [
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
        ride: EquineStance.after(animal, going, cues),
      });
      faces.push({ seconds: halt + turn, label: `rein${k + 1}:face` });
      film = cues.at(-1)!.from + turn + cues.at(-1)!.hold + settle;
      if (last) return;

      // Two turns on the centre carry the root through the hooves' middle to its far side.
      const stopped: ArchetypeRide.ISample<Id, D | QuadrupedBody.Dimension> =
        going.at(halt);
      const middle: IAutoMovieVector3 = Vector3.scale(
        QuadrupedBody.LIMBS.reduce(
          (
            sum: IAutoMovieVector3,
            limb: QuadrupedBody.Limb,
          ): IAutoMovieVector3 =>
            Vector3.add(sum, endpoint(stopped.archetype.parts, limb)),
          { x: 0, y: 0, z: 0 },
        ),
        1 / QuadrupedBody.LIMBS.length,
      );
      const root: IAutoMovieVector3 = ArchetypeFrame.compose(
        stopped.placement,
        ArchetypeFrame.upright({ x: 2 * middle.x, y: 0, z: 2 * middle.z }),
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
    ): ArchetypeRide.ISample<Id, D | QuadrupedBody.Dimension> =>
      find(seconds).at(Math.min(seconds, total));
    const instants: Instant[] = segments
      .flatMap(
        (
          segment: ISegment<Id, D | QuadrupedBody.Dimension>,
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
        at: (seconds: number): ArchetypeCourse.IState =>
          find(seconds).plan.at(seconds),
      },
      duration: total,
      instants,
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: ArchetypeRide.ISample<Id, D | QuadrupedBody.Dimension> =
          at(seconds);
        return ArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }

  /**
   * Lay the equid's lead out as the lunge line to the handler's line hand at the centre.
   *
   * @param ride The lunge, after any layer that moves the head's contacts.
   * @param lead The lead's held-run contact.
   * @param centre Where the handler stands.
   * @param side The side of the handler the line hand is on at the start.
   * @param hand Where the line leaves the hand.
   * @param length The line's whole length, metres.
   * @param change When the line passes to the other hand at a change of rein; kept in the one hand when absent.
   * @returns The ride with the line laid.
   * @throws {ArchetypeRefusal} As `EquineLine.layer` refuses a stretched line.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame the hand is read in.
   * @evidence contracts/development/implementation.md#principled-implementation The hand stands out from the centre toward the equid's root, aside toward the line hand's side and up by its height; across a change it comes in to the middle over one phase on a minimum-jerk share, stays there through the second while the other hand takes it, and goes out to the other side over the third; the line runs from there to the halter.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One held point per sample.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One placement read per sample beyond the layer's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `EquineLine`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the ride and the hand.
   */
  export function line<Id extends string, D extends string>(
    ride: ArchetypeRide.IRide<Id, D>,
    lead: Id,
    centre: IPoint,
    side: Side,
    hand: IHand,
    length: number,
    change?: IChange,
  ): ArchetypeRide.IRide<Id, D> {
    const sign: number = side === "left" ? 1 : -1;
    const aside = (seconds: number): number => {
      if (change === undefined) return sign;
      const local: number = (seconds - change.from) / change.phase;
      if (local <= 0) return sign;
      if (local < 1) return sign * (1 - minimumJerk.share(local));
      if (local < 2) return 0;
      return -sign * minimumJerk.share(Math.min(1, local - 2));
    };
    return EquineLine.layer(
      ride,
      lead,
      (
        seconds: number,
        sample: ArchetypeRide.ISample<Id, D>,
      ): IAutoMovieVector3 => {
        const root: IAutoMovieVector3 = sample.placement.translation;
        const out: IAutoMovieVector3 = Vector3.normalize({
          x: root.x - centre.x,
          y: 0,
          z: root.z - centre.z,
        });
        const across: number = hand.spread * aside(seconds);
        return {
          x: centre.x + out.x * hand.reach + out.z * across,
          y: hand.height,
          z: centre.z + out.z * hand.reach - out.x * across,
        };
      },
      length,
    );
  }

  /** Half the hooves' lateral spacing at rest, metres: the fore pair's. */
  function halfTrack<Id extends string, D extends string>(
    animal: Archetype<Id, D>,
  ): number {
    return (
      Math.abs(
        endpoint(animal.parts, "leftFore").x -
          endpoint(animal.parts, "rightFore").x,
      ) / 2
    );
  }

  /** A limb's terminal endpoint in the model's space: the far end of its last bar. */
  function endpoint(
    parts: readonly IAutoMovieModelPart[],
    limb: QuadrupedBody.Limb,
  ): IAutoMovieVector3 {
    const pastern: IAutoMovieModelPart = parts.find(
      (part: IAutoMovieModelPart): boolean =>
        part.id === QuadrupedBody.BONES[limb][3],
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
    throw new ArchetypeRefusal({
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
