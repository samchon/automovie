import { AutoMovieEngineKinematics, Vector3 } from "@automovie/engine";
import {
  type AutoMovieHumanSide,
  type AutoMovieHumanoidBone,
  type AutoMovieHumanoidRegion,
  type IAutoMovieHumanoidSurfaces,
  type IAutoMovieInteractionEvent,
  type IAutoMovieMotionHumanBody,
  type IAutoMovieMotionHumanPerformanceState,
  type IAutoMovieMotionHumanPropFlight,
  type IAutoMovieMotionHumanPropOutcome,
  type IAutoMovieMotionHumanSegment,
  type IAutoMovieResolvedBone,
  type IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { StrikingWeapon } from "../../striking/internal/StrikingWeapon";
import { HumanBlast } from "./HumanBlast";
import { HumanPerformanceContacts } from "./HumanPerformanceContacts";
import { HumanPerformanceLayers } from "./HumanPerformanceLayers";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPropFlight } from "./HumanPropFlight";
import { HumanPropOutcome } from "./HumanPropOutcome";

/**
 * The hit record of a performance: every contact that strikes a person or a
 * thing, as the one shared record (`IAutoMovieInteractionEvent`) a reaction, a
 * force, a breakage or a review reads. Three producers write it:
 *
 * - Melee stops: each weapon's resolved first contact with another person
 *   (`HumanPerformanceContacts`), its velocity the central difference of the
 *   weapon's free path over the contact scan's step, its mass the striking
 *   limb's distal long segment's from the striker's profile (the forearm or the
 *   shank; provisional, since no source on effective striking mass has been
 *   read, and Walilko, Viano and Bir 2005 measured far more for an Olympic
 *   punch), its outcome `stick`, the limb stopping on the body;
 * - Blasts: one hit per person within a blast's radius (`HumanBlast`), with an
 *   impulse along the line from the blast to the nearest point of their
 *   colliders and no mass;
 * - Flights: each first and continuation contact (`HumanPropFlight`), with the
 *   prop's incoming velocity and mass, its outcome and outgoing velocity.
 *
 * A hit on a person names the bone it struck and the region nearest the point;
 * its normal is the struck surface's outward normal. Hits are in time order,
 * with ties sorted by event id.
 */
export namespace HumanPerformanceHits {
  /**
   * Every hit of the performance in time order, or those on one subject.
   *
   * @param self The placed performance.
   * @param subject The struck person or prop; every hit when absent.
   * @returns The hits.
   */
  export function hits(
    self: IAutoMovieMotionHumanPerformanceState,
    subject?: string,
  ): readonly IAutoMovieInteractionEvent[] {
    // The hits the performance prepared, or, while the schedule is resolved,
    // those the placed performance gives now.
    const all: readonly IAutoMovieInteractionEvent[] = self.hits ?? solve(self);
    return subject === undefined
      ? all
      : all.filter(
          (h: IAutoMovieInteractionEvent): boolean => h.target === subject,
        );
  }

  /**
   * Every hit of the performance as it is placed now, in time order with ties
   * by event id: what the performance prepares once every action, stop and
   * flight is resolved (`IAutoMovieMotionHumanPerformanceState.hits`).
   *
   * @param self The placed performance.
   * @returns The hits.
   */
  export function solve(
    self: IAutoMovieMotionHumanPerformanceState,
  ): IAutoMovieInteractionEvent[] {
    const read: IReadBones = reading(self);
    return [
      ...melee(self, read),
      ...blasts(self, read),
      ...flights(self, read),
    ].sort(
      (a: IAutoMovieInteractionEvent, b: IAutoMovieInteractionEvent): number =>
        a.time - b.time || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
  }

  /** The melee stops. */
  function melee(
    self: IAutoMovieMotionHumanPerformanceState,
    read: IReadBones,
  ): IAutoMovieInteractionEvent[] {
    return self.strikes.map(
      (
        strike: IAutoMovieMotionHumanPerformanceState.IStrike,
      ): IAutoMovieInteractionEvent => {
        const t: number = strike.seconds;
        const [point, tail]: StrikingWeapon.IAxis = StrikingWeapon.read(
          strike.weapon,
          t,
        );
        const end: IAutoMovieVector3 = tail ?? point;
        const velocity: IAutoMovieVector3 = Vector3.scale(
          Vector3.subtract(
            strike.weapon.path(t + HumanPerformanceContacts.STEP),
            strike.weapon.path(t - HumanPerformanceContacts.STEP),
          ),
          1 / (2 * HumanPerformanceContacts.STEP),
        );
        const struck = person(self, strike.against, t, point, end, read);
        const striker: IAutoMovieMotionHumanBody = HumanPerformanceRead.person(
          self,
          strike.subject,
        ).performer.body;
        const side: AutoMovieHumanSide = strike.weapon.limb.startsWith("left")
          ? "left"
          : "right";
        const distal: IDistal = strike.weapon.limb.endsWith("Arm")
          ? `${side}LowerArm`
          : `${side}LowerLeg`;
        const mass: number | undefined = distalMass(striker, distal);
        return {
          id: `hit:${strike.subject}:${strike.weapon.id}:${strike.against}:${t.toFixed(6)}`,
          kind: "hit",
          source: "collisionSolver",
          time: t,
          actor: strike.subject,
          target: strike.against,
          object: null,
          point: struck.point,
          actionIndex: strike.segment.entry,
          reaction: null,
          bone: struck.bone,
          region: struck.region,
          velocity,
          normal: struck.normal,
          ...(mass === undefined ? {} : { mass }),
          outcome: "stick",
          exit: { x: 0, y: 0, z: 0 },
        };
      },
    );
  }

  /** The blasts' hits. */
  function blasts(
    self: IAutoMovieMotionHumanPerformanceState,
    read: IReadBones,
  ): IAutoMovieInteractionEvent[] {
    const out: IAutoMovieInteractionEvent[] = [];
    for (const blast of self.blasts) {
      const t: number = HumanPerformanceLayers.instant(self, blast.at);
      for (const p of self.people.values()) {
        const subject: string = p.performer.subject;
        const struck = person(self, subject, t, blast.point, blast.point, read);
        if (struck.distance > blast.radius) continue;
        const away: IAutoMovieVector3 = Vector3.subtract(
          struck.point,
          blast.point,
        );
        const reach: number = Vector3.length(away);
        const along: IAutoMovieVector3 =
          reach > 0 ? Vector3.scale(away, 1 / reach) : struck.normal;
        out.push({
          id: `blast:${blast.id}:${subject}`,
          kind: "hit",
          source: "impactOutput",
          time: t,
          actor: null,
          target: subject,
          object: blast.id,
          point: struck.point,
          actionIndex: null,
          reaction: null,
          bone: struck.bone,
          region: struck.region,
          normal: struck.normal,
          impulse: Vector3.scale(along, HumanBlast.impulse(blast, reach)),
        });
      }
    }
    return out;
  }

  /**
   * Each recorded impact, with the departure from the following leg if one
   * exists.
   */
  function flights(
    self: IAutoMovieMotionHumanPerformanceState,
    read: IReadBones,
  ): IAutoMovieInteractionEvent[] {
    const out: IAutoMovieInteractionEvent[] = [];
    for (const prop of self.props.values()) {
      const launchIds: Map<string, number> = new Map();
      for (const f of HumanPropFlight.flights(self, prop.subject)) {
        let contact: IAutoMovieMotionHumanPropFlight.IContact | undefined =
          f.contact;
        let time: number = f.end;
        const base: string = `flight:${f.prop}:${f.launch.toFixed(6)}`;
        const occurrence: number = launchIds.get(base) ?? 0;
        launchIds.set(base, occurrence + 1);
        const id: string =
          occurrence === 0 ? base : `${base}:launch:${occurrence}`;
        for (let index: number = 0; contact !== undefined; ++index) {
          const next: IAutoMovieMotionHumanPropOutcome.ILeg | undefined =
            f.legs?.[index];
          const struck: IAutoMovieMotionHumanPropFlight.Struck = contact.struck;
          const who: IAutoMovieMotionHumanSegment.IPerson | undefined =
            struck.kind === "person"
              ? HumanPerformanceRead.person(self, struck.subject)
              : undefined;
          const region: AutoMovieHumanoidRegion | undefined =
            who === undefined
              ? undefined
              : nearestRegion(
                  who.performer.body,
                  read(who, time, "regions"),
                  contact.point,
                );
          out.push({
            id: index === 0 ? id : `${id}:${index}`,
            kind:
              struck.kind === "ground"
                ? "contact"
                : "hit",
            source: "collisionSolver",
            time,
            actor: f.source.subject,
            target: struck.kind === "ground" ? null : struck.subject,
            object: f.prop,
            point: contact.point,
            actionIndex: f.source.entry,
            reaction: null,
            ...(struck.kind === "person" ? { bone: struck.bone } : {}),
            ...(region === undefined ? {} : { region }),
            velocity: contact.velocity,
            normal: contact.normal,
            ...(prop.body === undefined ? {} : { mass: prop.body.mass }),
            outcome: contact.outcome,
            exit:
              next === undefined
                ? { x: 0, y: 0, z: 0 }
                : HumanPropOutcome.at(next, next.from).velocity,
          });

          // The outgoing leg's end carries the next impact on the launch clock.
          if (next === undefined) break;
          contact = next.contact;
          time = f.launch + next.end;
        }
      }
    }
    return out;
  }

  /**
   * Where a segment meets a person at a second: the bone, the surface point,
   * its normal and the nearest region.
   */
  function person(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    read: IReadBones,
  ): IPersonResult {
    const who: IAutoMovieMotionHumanSegment.IPerson =
      HumanPerformanceRead.person(self, subject);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = read(
      who,
      seconds,
      "contact",
    );
    const near = HumanColliders.nearest(who.performer.body, bones, a, b);
    const region: AutoMovieHumanoidRegion | undefined = nearestRegion(
      who.performer.body,
      bones,
      near.point,
    );
    return { ...near, ...(region === undefined ? {} : { region }) };
  }

  /**
   * Actual per-person observation, with outputs dictated by the current hit
   * consumer.
   */
  type IReadBones = (
    who: IAutoMovieMotionHumanSegment.IPerson,
    seconds: number,
    kind: ReadBonesKind,
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /**
   * Static demand producers live only for this synchronous hit-record build,
   * never their query results.
   */
  function reading(self: IAutoMovieMotionHumanPerformanceState): IReadBones {
    const readers: Map<
      IAutoMovieMotionHumanSegment.IPerson,
      Partial<
        Record<
          EntryItemEntry,
          ReturnType<typeof HumanPerformanceRead.prepareBones>
        >
      >
    > = new Map();
    return (
      who: IAutoMovieMotionHumanSegment.IPerson,
      seconds: number,
      kind: ReadingKind,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      let sources:
        | Partial<
            Record<
              SourcesEntryItem,
              ReturnType<typeof HumanPerformanceRead.prepareBones>
            >
          >
        | undefined = readers.get(who);
      if (sources === undefined) {
        sources = {};
        readers.set(who, sources);
      }
      let read:
        | ReturnType<typeof HumanPerformanceRead.prepareBones>
        | undefined = sources[kind];
      if (read === undefined) {
        read = HumanPerformanceRead.prepareBones(
          self,
          who.performer.subject,
          demand(who.performer.body, kind),
        );
        sources[kind] = read;
      }
      return read(seconds);
    };
  }

  /**
   * The bones a reading of one kind resolves: the regions' owners, and for
   * contact the colliders' too.
   */
  function demand(
    body: IAutoMovieMotionHumanBody,
    kind: DemandKind,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    const selected: Set<AutoMovieHumanoidBone> = new Set(
      kind === "contact" ? HumanColliders.bones(body) : undefined,
    );
    for (const [, frame] of regionFrames(body)) selected.add(frame.bone);
    return selected;
  }

  /** The body's named region whose point lies nearest a world point. */
  function nearestRegion(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    point: IAutoMovieVector3,
  ): AutoMovieHumanoidRegion | undefined {
    let best: AutoMovieHumanoidRegion | undefined;
    let nearest: number = Infinity;
    for (const [region, frame] of regionFrames(body)) {
      const bone: IAutoMovieResolvedBone | undefined = bones.get(frame.bone);
      if (bone === undefined) continue;
      const at: IAutoMovieVector3 =
        AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
          frame,
          bone,
        );
      const distance: number = Vector3.distance(at, point);
      if (best === undefined || distance < nearest) {
        best = region;
        nearest = distance;
      }
    }
    return best;
  }

  /** The four original distal source segments emitted by the melee limb mapping. */
  type IDistal =
    | "leftLowerArm"
    | "rightLowerArm"
    | "leftLowerLeg"
    | "rightLowerLeg";

  /**
   * The profile's mass of a distal segment, its first record of the bone; none
   * when the profile has none.
   */
  function distalMass(
    body: IAutoMovieMotionHumanBody,
    bone: IDistal,
  ): number | undefined {
    return body.profile.segments.find(
      (
        segment: IAutoMovieMotionHumanBody["profile"]["segments"][number],
      ): boolean => segment.bone === bone,
    )?.mass;
  }

  /**
   * The body's regions with their bone-local frames, in the body's entry order,
   * which strict first-minimum selection keeps.
   */
  function regionFrames(body: IAutoMovieMotionHumanBody): IRegions {
    return Object.entries(body.surfaces.regions) as IRegions;
  }

  /**
   * The body's original entry order, used unchanged by strict first-minimum
   * selection.
   */
  type IRegions = readonly (readonly [
    AutoMovieHumanoidRegion,
    IAutoMovieHumanoidSurfaces.IFrame,
  ])[];
}

/** The alternatives of `DemandKind`'s site. */
type DemandKind = "regions" | "contact";

/** The alternatives of `SourcesEntryItem`'s site. */
type SourcesEntryItem = "regions" | "contact";

/** The alternatives of `ReadingKind`'s site. */
type ReadingKind = "regions" | "contact";

/** The alternatives of `EntryItemEntry`'s site. */
type EntryItemEntry = "regions" | "contact";

/** The alternatives of `ReadBonesKind`'s site. */
type ReadBonesKind = "regions" | "contact";

/** The record of `IPersonResult`'s site. */
type IPersonResult = {
  distance: number;
  bone: AutoMovieHumanoidBone;
  point: IAutoMovieVector3;
  normal: IAutoMovieVector3;
  region?: AutoMovieHumanoidRegion;
};
