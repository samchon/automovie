import {
  resolveAutoMovieContactEvents,
  type resolveAutoMovieSchedule,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieInteractionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanColliders } from "../posture/HumanColliders";
import { StrikingWeapon } from "../striking/StrikingWeapon";
import { HumanPerformanceContacts } from "./HumanPerformanceContacts";
import { HumanPerformanceHits } from "./HumanPerformanceHits";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import type { HumanPerformanceState } from "./HumanPerformanceState";

/**
 * A struck subject's hits as a track of named instants, so an action is
 * synced to a hit as to any instant (#3480: `sync({ hit })`).
 *
 * The track of `on` is named `hit:<on>`, or `hit:<on>:<by>` for the hits by
 * one striking prop or anchored striker; each hit is an instant named
 * `hit`, in time order. The schedule asks for it when an action is placed
 * (`resolveAutoMovieSchedule.ILaws.instants`), so the strikers must be
 * composed before the struck performer, as a pursuit is. While the schedule
 * is being placed the melee stops are not resolved yet, so each placed
 * weapon of another person is swept against the struck person alone, as
 * their placed poses show them (`resolveAutoMovieContactEvents`); the
 * flights and the blasts are the hit record's own. Once everything is
 * placed the record's resolved hits are read instead.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States track naming and provisional/committed sources; EVENT is the hit instant label and PREFIX is hit:, the routing prefix recognized by instants.
 * @evidence contracts/development/design.md#principled-representation A track of the schedule's own named instants, so a hit is addressed exactly as a cue is.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hit's address, the track's name and its instants.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The hits are the record's; the provisional sweep uses the one contact resolver.
 */
export namespace HumanHitTrack {
  /**
   * A hit to sync to.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines struck subject, optional producer filter and zero-based hit selection.
   * @evidence contracts/development/design.md#principled-representation Addresses the existing interaction track by plain subject strings and an optional numeric event index.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only target, optional striker/prop and occurrence are authored.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the shared track rather than introducing another physical hit model.
   */
  export interface IHit {
    /** The struck subject, a performer or a prop. */
    on: string;

    /** The striking prop, or the striker's subject; any striker when absent. */
    by?: string;

    /** Which of the matching hits, from 0; the first when absent. */
    index?: number;
  }

  /**
   * The instant name of every hit on a track.

   */
  export const EVENT: string = "hit";

  /**
   * The prefix of a hit track's name.

   */
  export const PREFIX: string = "hit:";

  /**
   * The name of a hit's track.
   *
   * @param hit The hit.
   * @returns `hit:<on>` or `hit:<on>:<by>`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States exact generated track forms and optional producer suffix.
   * @evidence contracts/development/implementation.md#principled-implementation Concatenates the declared target and optional producer in the hit-track address convention.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional-producer branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves plain authored ids without guessing an actor or prop.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work and output space scale with address string length.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure address formatting.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function name(hit: IHit): string {
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States unknown-prefix behavior and the namespace documents provisional versus committed sources.
   * @evidence contracts/development/implementation.md#principled-implementation During placement actual per-limb sweeps supply provisional melee contacts, each limb's capsules stopping together at the first contact; the common hit record supplies blasts/flights and committed contacts, filtered by target/producer and ordered by time.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Parses one hit-track address, selects current producers, then filters/maps/sorts cue records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every provisional live window, original STEP/bisections/taper and actual struck-body distance; no event is fabricated or skipped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Provisional work sweeps each striking limb's capsules together, so a limb costs one scan that ends at its first contact instead of one full-window scan per capsule; registered head/tail reads share one exact chain evaluation, and the struck body is read once per exact second for every sweep of the call. H selected records cost O(H log H) sorting and O(H) temporary space, with no measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The common record owns committed reuse. Within one provisional call nothing is placed, so the struck body's bones at an exact second are one pure value shared by every limb's sweep; the call's map ends with it. A limb's capsules form one engine group, so its part stops at its first contact and gives one provisional hit, as the committed resolution and the striking laws' first-contact stop do.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Per-call sweep inputs/events, cue arrays, at most one fixed-name struck-actor query producer and one bones map per exact second read end on return or throw. Each actual query owns its own FK/projector/pose scope; returned cues keep only names/seconds and retain no callbacks, bodies, readers or sampled poses.
   */
  export function instants(
    self: HumanPerformanceState,
    of: string,
  ): readonly resolveAutoMovieSchedule.ICue[] | undefined {
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
        (h: IAutoMovieInteractionEvent): resolveAutoMovieSchedule.ICue => ({
          name: EVENT,
          seconds: h.time,
        }),
      )
      .sort(
        (a: resolveAutoMovieSchedule.ICue, b: resolveAutoMovieSchedule.ICue) =>
          a.seconds - b.seconds,
      );
  }

  /** The melee hits on a person while placing: each placed weapon of another person swept against them alone. */
  function provisional(
    self: HumanPerformanceState,
    on: string,
  ): IAutoMovieInteractionEvent[] {
    const struck = self.people.get(on);
    if (struck === undefined) return [];
    const requested: ReadonlySet<AutoMovieHumanoidBone> =
      HumanColliders.bones(struck.performer.body);
    // Nothing is placed during this call, so the struck body's pose at a
    // second is the same for every weapon swept: read once per exact second.
    let frames: ReturnType<typeof HumanPerformanceRead.prepareBones> | undefined;
    const read: Map<number, ReturnType<typeof HumanPerformanceRead.bones>> = new Map();
    const readBones = (seconds: number): ReturnType<typeof HumanPerformanceRead.bones> => {
      let bones: ReturnType<typeof HumanPerformanceRead.bones> | undefined = read.get(seconds);
      if (bones === undefined) {
        if (frames === undefined) frames = HumanPerformanceRead.prepareBones(self, on, requested);
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
        const limbs: Map<string, IHumanActionPlan.IWeapon[]> = new Map();
        for (const w of segment.plan.weapons ?? []) {
          if (!(Math.min(w.to, segment.end) > Math.max(w.from, segment.entryTime))) continue;
          const group: IHumanActionPlan.IWeapon[] | undefined = limbs.get(w.limb);
          if (group === undefined) limbs.set(w.limb, [w]);
          else group.push(w);
        }
        for (const [limb, group] of limbs) {
          const from: number = Math.min(...group.map((w: IHumanActionPlan.IWeapon): number => Math.max(w.from, segment.entryTime)));
          const to: number = Math.max(...group.map((w: IHumanActionPlan.IWeapon): number => Math.min(w.to, segment.end)));
          const events: resolveAutoMovieContactEvents.IEvent[] =
            resolveAutoMovieContactEvents({
              weapons: group.map((w: IHumanActionPlan.IWeapon): resolveAutoMovieContactEvents.IWeapon => {
                const tail = w.tail;
                return {
                  id: w.id,
                  owner: person.performer.subject,
                  group: limb,
                  radius: w.radius,
                  from: Math.max(w.from, segment.entryTime),
                  to: Math.min(w.to, segment.end),
                  position: (t: number): IAutoMovieVector3 => w.path(t),
                  sample: (t: number): resolveAutoMovieContactEvents.IWeaponFrame => {
                    const [position, end]: StrikingWeapon.IAxis = StrikingWeapon.read(w, t);
                    return { position, ...(end === undefined ? {} : { tail: end }) };
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
              }),
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
                    _: resolveAutoMovieContactEvents.IStops,
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
            const w: IHumanActionPlan.IWeapon = group.find(
              (weapon: IHumanActionPlan.IWeapon): boolean => weapon.id === e.weapon,
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
