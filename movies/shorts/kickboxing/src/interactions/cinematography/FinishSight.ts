import {
  type IAutoMovieSchedule,
  Quaternion,
  Vector3,
  type preparePhysicalGeometry,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { Fighter } from "../../entities/cast/fighter/Fighter";
import { CoverageLaw } from "../../laws/cinematography/CoverageLaw";
import { SightLaw } from "../../laws/cinematography/SightLaw";
import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";
import { KickboxingTiming } from "../../laws/kickboxing/KickboxingTiming";
import { BoutLaws } from "../kickboxing/BoutLaws";
import type { BoutPerformance } from "../kickboxing/BoutPerformance";
import type { IRingCast } from "../kickboxing/IRingCast";
import { RefereePerformance } from "../officiating/RefereePerformance";
import { RefereeTrack } from "../officiating/RefereeTrack";

/**
 * The finishing strike's sight scene for the visibility law: the watched
 * points (the striking surface over the descent from the chamber key to
 * contact, and the struck region at contact) and the occluders around them.
 * `colliders` reads the displayed bodies' declared colliders through the
 * engine's native contact query, the film's own verification;
 * `FinishVolumes` resolves the same law from the shape laws and measure
 * capsules for the logic units.
 *
 * ```ts
 * const sight = FinishSight.colliders(cast, schedule, referee, performance, queries);
 * CameraTrack.resolve(cast, schedule, referee, 180, sight);
 * ```
 *
 * @evidence docs/research/cinematography/fight-coverage.md#targets The finishing strike's surface, contact and descending path stay unoccluded.
 * @evidence docs/research/kickboxing/brazilian-kick.md#law The lower leg descends from the chamber over the lowered arm onto the region.
 */
export namespace FinishSight {
  /** Builds the scene of a finishing strike entry. */
  export type Reader = (entry: IAutoMovieSchedule.IEntry) => SightLaw.IScene;

  /**
   * The scene from the displayed bodies' colliders.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param referee The referee's resolved path.
   * @param performance The fighters' displayed bodies.
   * @param queries The engine's geometric queries.
   * @returns The reader.
   */
  export function colliders(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    referee: RefereeTrack.ITrack,
    performance: BoutPerformance,
    queries: preparePhysicalGeometry.IQueries,
  ): Reader {
    return (entry: IAutoMovieSchedule.IEntry): SightLaw.IScene => {
      const { striker, receiver, spec, contact } = finish(cast, entry);
      const weapons: string[] = weaponBones(striker, spec);
      const region = receiver.body.regions[KickboxingTechnique.region(spec)]!;
      const bodies = (seconds: number): preparePhysicalGeometry.ICollider[] => {
        const fighters = performance.at(seconds);
        const official = RefereePerformance.at(
          cast,
          schedule,
          referee,
          seconds,
        );
        const of = (
          id: string,
          profile: P,
          segments: Record<string, P.ITransform>,
        ): preparePhysicalGeometry.ICollider[] =>
          profile.segments.flatMap((s: P.ISegment) =>
            s.shapes.map((shape: P.IShape) => ({
              body: id,
              bone: s.bone,
              shape,
              pose: segments[s.bone]!,
            })),
          );
        return [
          ...of(cast.a.id, cast.a.body.profile, fighters[cast.a.id]!.segments),
          ...of(cast.b.id, cast.b.body.profile, fighters[cast.b.id]!.segments),
          ...of(cast.referee.id, cast.referee.body.profile, official.segments),
        ];
      };
      const world = (
        subject: string,
        bone: string,
        local: IAutoMovieVector3,
        seconds: number,
      ): IAutoMovieVector3 => {
        const s: P.ITransform =
          performance.at(seconds)[subject]!.segments[bone]!;
        return Vector3.add(
          s.position,
          Quaternion.rotateVector(s.rotation, local),
        );
      };
      // The weapon descends over the receiver's defending arm, so that arm
      // belongs to the watched event with the weapon itself.
      const guarding: string[] = defending(schedule, entry, receiver, spec);
      // The kick guard's forward arm reaches along the head line over the
      // kicking leg on its own side (techniques.md#guard-during-kicks), so it
      // travels with the watched leg as part of the striking form.
      const reaching: string[] =
        spec.limb === "leg" ? arm(striker, spec.side, false) : [];
      const carriers: string[] = [
        ...weapons.map((b) => `${striker.id}.${b}`),
        ...reaching.map((b) => `${striker.id}.${b}`),
        ...guarding.map((b) => `${receiver.id}.${b}`),
      ];
      const watched: SightLaw.IWatched[] = descent(contact).flatMap(
        (seconds: number): SightLaw.IWatched[] =>
          [`${spec.surface}-${spec.side}`, `shin-${spec.side}`].map((id) => {
            const weapon = striker.body.weapons[id]!;
            return {
              point: world(striker.id, weapon.bone, weapon.localPoint, seconds),
              seconds,
              carriers,
            };
          }),
      );
      const struck: IAutoMovieVector3 = world(
        receiver.id,
        region.bone,
        region.localPoint,
        contact,
      );
      watched.push({
        point: struck,
        seconds: contact,
        carriers: [...carriers, `${receiver.id}.${region.bone}`],
      });
      const cache: Map<number, preparePhysicalGeometry.ICollider[]> = new Map();
      return {
        contact: struck,
        attacker: floor(cast, schedule, striker.id, contact),
        receiver: floor(cast, schedule, receiver.id, contact),
        seconds: contact,
        watched,
        neighbourhood: receiver.body.measure.headRadius,
        separation: (from, to, seconds, ignored): number => {
          let colliders = cache.get(seconds);
          if (!colliders) {
            colliders = bodies(seconds);
            cache.set(seconds, colliders);
          }
          const sight = sightline(from, to);
          let least: number = Infinity;
          for (const c of colliders) {
            if (ignored.includes(`${c.body}.${c.bone}`)) continue;
            const r = queries.contact(sight, c, seconds, sight.reach);
            least = Math.min(least, r ? r.separation : sight.reach);
          }
          return least;
        },
      };
    };
  }

  /**
   * The finishing strike, its fighters, technique and contact second.
   *
   * @param cast The cast.
   * @param entry The finishing strike's entry.
   * @returns The striker, receiver, technique and contact.
   */
  export function finish(
    cast: IRingCast,
    entry: IAutoMovieSchedule.IEntry,
  ): {
    striker: Fighter;
    receiver: Fighter;
    spec: KickboxingTechnique.ISpec;
    contact: number;
  } {
    const action: KickboxingAction.IAction = KickboxingAction.read(
      entry.intent,
    );
    if (action.kind !== "strike" || entry.contact === undefined)
      throw new Error("The finish names a strike with a contact");
    const striker: Fighter = entry.subject === cast.a.id ? cast.a : cast.b;
    return {
      striker,
      receiver: striker === cast.a ? cast.b : cast.a,
      spec: KickboxingTechnique.table[action.technique],
      contact: entry.contact,
    };
  }

  /**
   * The frames of the descent: from the chamber key to impact, one frame apart.
   *
   * @param contact The contact second.
   * @returns Film seconds.
   */
  export function descent(contact: number): number[] {
    const frame: number = RefereeTrack.STEP;
    const span: number =
      KickboxingTiming.KICK_IMPACT - KickboxingTiming.KICK_CHAMBER;
    const count: number = Math.round(span / frame);
    return Array.from(
      { length: count + 1 },
      (_, k: number): number => contact - (count - k) * frame,
    );
  }

  /**
   * A fighter's stance origin on the floor at a second.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param id The fighter's id.
   * @param seconds Film seconds.
   * @returns The floor point.
   */
  export function floor(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    id: string,
    seconds: number,
  ): { x: number; z: number } {
    return BoutLaws.origin(schedule, id, seconds, cast).point;
  }

  /**
   * The receiver's arm his answer puts in the strike's path: for a block,
   * cover or parry, the arm on the attacked side, which the weapon meets or
   * passes over; nothing for an evasion or a taken blow.
   */
  function defending(
    schedule: IAutoMovieSchedule,
    entry: IAutoMovieSchedule.IEntry,
    receiver: Fighter,
    spec: KickboxingTechnique.ISpec,
  ): string[] {
    const answer = schedule.entries.find((e) => {
      if (e.intent.capability !== "answer") return false;
      const action = KickboxingAction.read(e.intent);
      return action.kind === "answer" && action.strike === entry.intent.anchor;
    });
    const action = answer ? KickboxingAction.read(answer.intent) : undefined;
    if (
      action?.kind !== "answer" ||
      !["elbow-block", "cover", "parry", "high-block"].includes(action.answer)
    )
      return [];
    return arm(receiver, KickboxingTechnique.opposite(spec.side), true);
  }

  /** A fighter's arm segments on a side: the forearm and hand, with the upper arm when asked. */
  function arm(fighter: Fighter, side: string, upper: boolean): string[] {
    const segment: RegExp = upper
      ? /^(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Pinky)/
      : /^(LowerArm|Hand|Thumb|Index|Middle|Ring|Pinky)/;
    return fighter.body.profile.segments
      .map((s: P.ISegment) => s.bone)
      .filter(
        (bone: string) =>
          bone.startsWith(side) && segment.test(bone.slice(side.length)),
      );
  }

  /** Segments carrying a technique's striking surface: the limb from the elbow or knee to its tip. */
  function weaponBones(
    striker: Fighter,
    spec: KickboxingTechnique.ISpec,
  ): string[] {
    const distal: RegExp =
      spec.limb === "arm"
        ? /^(LowerArm|Hand|Thumb|Index|Middle|Ring|Pinky)/
        : /^(LowerLeg|Ankle|Subtalar|Midfoot|Foot|Toe)/;
    return striker.body.profile.segments
      .map((s: P.ISegment) => s.bone)
      .filter(
        (bone: string) =>
          bone.startsWith(spec.side) &&
          distal.test(bone.slice(spec.side.length)),
      );
  }

  /**
   * A thin capsule collider along a sightline: its radius is one pixel of
   * the 720-line frame at the sightline's length through the coverage lens,
   * the finest width the delivered image resolves.
   */
  function sightline(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): preparePhysicalGeometry.ICollider & { reach: number } {
    const d: IAutoMovieVector3 = Vector3.subtract(to, from);
    const length: number = Vector3.length(d);
    const axis: IAutoMovieVector3 = Vector3.normalize(d);
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const cross: IAutoMovieVector3 = Vector3.cross(up, axis);
    const angle: number =
      (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(up, axis)))) * 180) /
      Math.PI;
    const rotation =
      Vector3.length(cross) > 1e-9
        ? Quaternion.fromAxisAngle(Vector3.normalize(cross), angle)
        : Quaternion.identity();
    const radius: number =
      (length * 2 * Math.tan(CoverageLaw.FIELD_OF_VIEW / 2)) / FRAME_LINES;
    return {
      body: "sight",
      bone: "sight",
      shape: {
        id: "sight",
        material: "sight",
        kind: "capsule",
        radius,
        halfLength: Math.max(0, length / 2 - radius),
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: Quaternion.identity(),
        },
      },
      pose: {
        position: Vector3.scale(Vector3.add(from, to), 0.5),
        rotation,
      },
      reach: length,
    };
  }

  /** Lines of the 1280x720 delivery frame. */
  const FRAME_LINES: number = 720;
}
