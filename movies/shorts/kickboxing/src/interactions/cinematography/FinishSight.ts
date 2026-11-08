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
import type { IFighterMeasure } from "../../laws/kickboxing/IFighterMeasure";
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
 * engine's native contact query, the film's own verification; `volumes`
 * reads measure-derived capsules at the schedule's floor points, so logic
 * units resolve the same law in milliseconds without posing a body.
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
      const weapons: string[] = weaponBones(spec);
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
      const carriers: string[] = weapons.map((b) => `${striker.id}.${b}`);
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
   * The scene from measure-derived capsules: each body a leg capsule from
   * ankle to hip, a torso capsule whose cap reaches the shoulder line and a
   * head-and-neck capsule from the shoulder line to the head centre; the struck region on the receiver's head on its side, and
   * the striking surface descending onto it from a lower leg above, on the
   * attacker's side of the receiver's head.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param referee The referee's resolved path.
   * @returns The reader.
   */
  export function volumes(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    referee: RefereeTrack.ITrack,
  ): Reader {
    return (entry: IAutoMovieSchedule.IEntry): SightLaw.IScene => {
      const { striker, receiver, spec, contact } = finish(cast, entry);
      const a = floor(cast, schedule, striker.id, contact);
      const b = floor(cast, schedule, receiver.id, contact);
      const m: IFighterMeasure = receiver.body.measure;
      const ahead = unit({ x: a.x - b.x, z: a.z - b.z });
      // The receiver's left is +Z of his own frame facing +X.
      const sign: number = KickboxingTechnique.region(spec).endsWith("-left")
        ? 1
        : -1;
      const lateral = { x: -ahead.z * sign, z: ahead.x * sign };
      const struck: IAutoMovieVector3 = {
        x: b.x + lateral.x * m.headRadius,
        y: m.head - m.headRadius,
        z: b.z + lateral.z * m.headRadius,
      };
      const times: number[] = descent(contact);
      const watched: SightLaw.IWatched[] = times.map(
        (seconds: number, k: number): SightLaw.IWatched => {
          const above: number =
            (m.headRadius + striker.body.measure.shank) *
            ((times.length - 1 - k) / Math.max(1, times.length - 1));
          return {
            point: {
              x: struck.x + ahead.x * m.headRadius,
              y: struck.y + above,
              z: struck.z + ahead.z * m.headRadius,
            },
            seconds,
            carriers: [],
          };
        },
      );
      watched.push({ point: struck, seconds: contact, carriers: [] });
      const bodies = (
        seconds: number,
      ): { a: IAutoMovieVector3; b: IAutoMovieVector3; radius: number }[] => {
        const r = RefereeTrack.at(referee, seconds).point;
        return [
          ...capsules(
            floor(cast, schedule, striker.id, seconds),
            striker.body.measure,
          ),
          ...capsules(floor(cast, schedule, receiver.id, seconds), m),
          ...capsules(r, cast.referee.body.measure),
        ];
      };
      return {
        contact: struck,
        attacker: a,
        receiver: b,
        seconds: contact,
        watched,
        neighbourhood: m.headRadius,
        separation: (from, to, seconds): number =>
          Math.min(
            ...bodies(seconds).map((c) =>
              SightLaw.capsule(from, to, c.a, c.b, c.radius),
            ),
          ),
      };
    };
  }

  /** The strike, its fighters and its contact. */
  function finish(
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

  /** The frames of the descent: from the chamber key to impact, one frame apart. */
  function descent(contact: number): number[] {
    const frame: number = RefereeTrack.STEP;
    const span: number =
      KickboxingTiming.KICK_IMPACT - KickboxingTiming.KICK_CHAMBER;
    const count: number = Math.round(span / frame);
    return Array.from(
      { length: count + 1 },
      (_, k: number): number => contact - (count - k) * frame,
    );
  }

  function floor(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    id: string,
    seconds: number,
  ): { x: number; z: number } {
    return BoutLaws.origin(schedule, id, seconds, cast).point;
  }

  /** A body's measure capsules at a floor point. */
  function capsules(
    p: { x: number; z: number },
    m: IFighterMeasure,
  ): { a: IAutoMovieVector3; b: IAutoMovieVector3; radius: number }[] {
    const at = (y: number): IAutoMovieVector3 => ({ x: p.x, y, z: p.z });
    return [
      { a: at(m.ankle), b: at(m.hip), radius: m.hipHalfWidth },
      {
        a: at(m.hip),
        b: at(m.shoulder - m.shoulderHalfWidth),
        radius: m.shoulderHalfWidth,
      },
      // The head on its neck: as wide as the head from the shoulder line up.
      { a: at(m.shoulder), b: at(m.head), radius: m.headRadius },
    ];
  }

  /** Segments carrying a technique's striking surface and lower leg. */
  function weaponBones(spec: KickboxingTechnique.ISpec): string[] {
    return spec.limb === "arm"
      ? [`${spec.side}Hand`, `${spec.side}LowerArm`]
      : [`${spec.side}LowerLeg`, `${spec.side}Foot`, `${spec.side}Midfoot`];
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

  function unit(v: { x: number; z: number }): { x: number; z: number } {
    const l: number = Math.hypot(v.x, v.z);
    return l === 0 ? { x: 1, z: 0 } : { x: v.x / l, z: v.z / l };
  }
}
