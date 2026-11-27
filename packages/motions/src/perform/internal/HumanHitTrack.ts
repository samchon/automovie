import { AutoMovieEngineCompositionContact } from "@automovie/engine";
import {
  type AutoMovieHumanoidBone,
  type IAutoMovieInteractionEvent,
  type IAutoMovieMotionHumanHitTrack,
  type IAutoMovieMotionHumanPerformanceState,
  type IAutoMovieMotionWeaponPath,
  type IAutoMovieResolveContactEvents,
  type IAutoMovieScheduleCue,
  type IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { StrikingWeapon } from "../../striking/internal/StrikingWeapon";
import { HumanPerformanceContacts } from "./HumanPerformanceContacts";
import { HumanPerformanceHits } from "./HumanPerformanceHits";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/**
 * A struck subject's hits as a track of named instants, so an action is synced
 * to a hit as to any instant (`sync({ hit })`).
 *
 * The track of `on` is named `hit:<on>`, or `hit:<on>:<by>` for the hits by one
 * striking prop or anchored striker; each hit is an instant named `hit`, in
 * time order. The schedule asks for it when an action is placed
 * (`resolveAutoMovieSchedule.ILaws.instants`), so the strikers must be composed
 * before the struck performer, as a pursuit is. While the schedule is being
 * placed the melee stops are not resolved yet, so each placed weapon of another
 * person is swept against the struck person alone, as their placed poses show
 * them (`resolveAutoMovieContactEvents`); the flights and the blasts are the
 * hit record's own. Once everything is placed the record's resolved hits are
 * read instead.
 */
export namespace HumanHitTrack {
  /** The instant name of every hit on a track. */
  export const EVENT: string = "hit";

  /** The prefix of a hit track's name. */
  export const PREFIX: string = "hit:";

  /**
   * The name of a hit's track.
   *
   * @param hit The hit.
   * @returns `hit:<on>` or `hit:<on>:<by>`.
   */
  export function name(hit: IAutoMovieMotionHumanHitTrack.IHit): string {
    return hit.by === undefined
      ? `${PREFIX}${hit.on}`
      : `${PREFIX}${hit.on}:${hit.by}`;
  }

  /**
   * A hit track's instants, or undefined for a name that is no hit track.
   *
   * @param self The performance being placed.
   * @param of The track's name.
   * @returns The instants.
   */
  export function instants(
    self: IAutoMovieMotionHumanPerformanceState,
    of: string,
  ): readonly IAutoMovieScheduleCue[] | undefined {
    if (!of.startsWith(PREFIX)) return undefined;
    const [on, by] = of.slice(PREFIX.length).split(":") as [
      string,
      string | undefined,
    ];
    const hits: readonly IAutoMovieInteractionEvent[] = self.resolving
      ? [...provisional(self, on), ...HumanPerformanceHits.hits(self, on)]
      : HumanPerformanceHits.hits(self, on);
    return hits
      .filter(
        (h: IAutoMovieInteractionEvent): boolean =>
          h.target === on &&
          (by === undefined || h.actor === by || h.object === by),
      )
      .map(
        (h: IAutoMovieInteractionEvent): IAutoMovieScheduleCue => ({
          name: EVENT,
          seconds: h.time,
        }),
      )
      .sort(
        (a: IAutoMovieScheduleCue, b: IAutoMovieScheduleCue) =>
          a.seconds - b.seconds,
      );
  }

  /**
   * The melee hits on a person while placing: each placed weapon of another
   * person swept against them alone.
   */
  function provisional(
    self: IAutoMovieMotionHumanPerformanceState,
    on: string,
  ): IAutoMovieInteractionEvent[] {
    const struck = self.people.get(on);
    if (struck === undefined) return [];
    const requested: ReadonlySet<AutoMovieHumanoidBone> = HumanColliders.bones(
      struck.performer.body,
    );
    // Nothing is placed during this call, so the struck body's pose at a
    // second is the same for every weapon swept: read once per exact second.
    let frames:
      | ReturnType<typeof HumanPerformanceRead.prepareBones>
      | undefined;
    const read: Map<
      number,
      ReturnType<typeof HumanPerformanceRead.bones>
    > = new Map();
    const readBones = (
      seconds: number,
    ): ReturnType<typeof HumanPerformanceRead.bones> => {
      let bones: ReturnType<typeof HumanPerformanceRead.bones> | undefined =
        read.get(seconds);
      if (bones === undefined) {
        if (frames === undefined)
          frames = HumanPerformanceRead.prepareBones(self, on, requested);
        bones = frames(seconds);
        read.set(seconds, bones);
      }
      return bones;
    };
    const out: IAutoMovieInteractionEvent[] = [];
    for (const person of self.people.values()) {
      if (person === struck) continue;
      for (const segment of person.segments) {
        // The weapons on one limb are the capsules of one striking part,
        // which stops as a whole at its first contact: one sweep, one hit.
        const limbs: Map<string, IAutoMovieMotionWeaponPath[]> = new Map();
        for (const w of segment.plan.weapons ?? []) {
          if (
            !(Math.min(w.to, segment.end) > Math.max(w.from, segment.entryTime))
          )
            continue;
          const group: IAutoMovieMotionWeaponPath[] | undefined = limbs.get(
            w.limb,
          );
          if (group === undefined) limbs.set(w.limb, [w]);
          else group.push(w);
        }
        for (const [limb, group] of limbs) {
          const from: number = Math.min(
            ...group.map((w: IAutoMovieMotionWeaponPath): number =>
              Math.max(w.from, segment.entryTime),
            ),
          );
          const to: number = Math.max(
            ...group.map((w: IAutoMovieMotionWeaponPath): number =>
              Math.min(w.to, segment.end),
            ),
          );
          const events: IAutoMovieResolveContactEvents.IEvent[] =
            AutoMovieEngineCompositionContact.resolveEvents({
              weapons: group.map(
                (
                  w: IAutoMovieMotionWeaponPath,
                ): IAutoMovieResolveContactEvents.IWeapon => {
                  const tail = w.tail;
                  return {
                    id: w.id,
                    owner: person.performer.subject,
                    group: limb,
                    radius: w.radius,
                    from: Math.max(w.from, segment.entryTime),
                    to: Math.min(w.to, segment.end),
                    position: (t: number): IAutoMovieVector3 => w.path(t),
                    sample: (
                      t: number,
                    ): IAutoMovieResolveContactEvents.IWeaponFrame => {
                      const [position, end]: StrikingWeapon.IAxis =
                        StrikingWeapon.read(w, t);
                      return {
                        position,
                        ...(end === undefined ? {} : { tail: end }),
                      };
                    },
                    ...(tail === undefined
                      ? {}
                      : {
                          tail: (t: number): IAutoMovieVector3 => tail(t),
                          ...(w.tailRadius === undefined
                            ? {}
                            : { tailRadius: w.tailRadius }),
                        }),
                  };
                },
              ),
              bodies: [
                {
                  id: on,
                  distance: (p: IAutoMovieVector3, t: number): number =>
                    HumanColliders.distance(
                      struck.performer.body,
                      readBones(t),
                      p,
                    ).distance,
                  axis: (
                    a: IAutoMovieVector3,
                    b: IAutoMovieVector3,
                    t: number,
                    _: IAutoMovieResolveContactEvents.IStops,
                    taper?: readonly [number, number],
                  ): number =>
                    HumanColliders.distanceToSegment(
                      struck.performer.body,
                      readBones(t),
                      a,
                      b,
                      taper,
                    ).distance,
                },
              ],
              from,
              to,
              step: HumanPerformanceContacts.STEP,
            });
          for (const e of events) {
            const w: IAutoMovieMotionWeaponPath = group.find(
              (weapon: IAutoMovieMotionWeaponPath): boolean =>
                weapon.id === e.weapon,
            )!;
            out.push({
              id: `hit:${person.performer.subject}:${w.id}:${on}:${e.seconds.toFixed(6)}`,
              kind: "hit",
              source: "collisionSolver",
              time: e.seconds,
              actor: person.performer.subject,
              target: on,
              object: null,
              point: w.path(e.seconds),
              actionIndex: segment.entry,
              reaction: null,
            });
          }
        }
      }
    }
    return out;
  }
}
