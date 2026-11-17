import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanPropOutcome,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { HumanBlast } from "./HumanBlast";
import { HumanPerformanceContacts } from "./HumanPerformanceContacts";
import { HumanPerformanceLayers } from "./HumanPerformanceLayers";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPropFlight } from "./HumanPropFlight";
import { HumanPropOutcome } from "./HumanPropOutcome";

/**
 * The hit record of a performance: every contact that strikes a person or a
 * thing, as the one shared record (`IAutoMovieInteractionEvent`) a reaction,
 * a force, a breakage or a review reads. Three producers write it:
 *
 * - melee stops: each weapon's resolved first contact with another person
 *   (`HumanPerformanceContacts`), its velocity the central difference of the
 *   weapon's free path over the contact scan's step, its mass the striking
 *   limb's distal long segment's from the striker's profile (the forearm or
 *   the shank; provisional, since no source on effective striking mass has
 *   been read, and Walilko, Viano and Bir 2005 measured far more for an
 *   Olympic punch), its outcome `stick`, the limb stopping on the body;
 * - blasts: one hit per person within a blast's radius (`HumanBlast`), with
 *   an impulse along the line from the blast to the nearest point of their
 *   colliders and no mass;
 * - flights: each first and continuation contact (`HumanPropFlight`), with
 *   the prop's incoming velocity and mass, its outcome and outgoing velocity.
 *
 * A hit on a person names the bone it struck and the region nearest the
 * point; its normal is the struck surface's outward normal. Hits are in time
 * order, with ties sorted by event id.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three producers, how each fills velocity, mass and outcome, with the provisional mass and its source, and the order.
 * @evidence contracts/development/design.md#principled-representation One record for every contact, the interface's own; no second hit type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hits of a performance and of one subject.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each producer's numbers come from its own computed contact.
 */
export namespace HumanPerformanceHits {
  /**
   * Every hit of the performance in time order, or those on one subject.
   *
   * @param self The placed performance.
   * @param subject The struck person or prop; every hit when absent.
   * @returns The hits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the film time order and optional struck-subject filter; the namespace describes the producers and fields.
   * @evidence contracts/development/implementation.md#principled-implementation Projects observed melee, blast and flight contacts to the shared record and orders them by film time and event id.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Each producer supplies one shared list before sorting; the optional subject filter applies to the completed list.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the same recorded contacts and outcomes as the placed performance without adding a collision query or predicted contact.
   * @evidence contracts/development/implementation.md#efficient-algorithms Visits each recorded flight contact once across its continuation legs and sorts H event records in O(H log H), in addition to the existing producer work and any struck-region reads. Filtering is O(H).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The existing result is reused only for a finalized performance; during placement the list reflects current events and uses already resolved flight legs.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The existing weak performance entry retains H records until release of the performance. Traversal retains no new query, sampled pose or resource.
   */
  export function hits(
    self: IAutoMovieMotionHumanPerformanceState,
    subject?: string,
  ): readonly IAutoMovieInteractionEvent[] {
    let all: readonly IAutoMovieInteractionEvent[] | undefined = self.resolving
      ? undefined
      : KEPT.get(self);
    if (all === undefined) {
      all = [...melee(self), ...blasts(self), ...flights(self)].sort(
        (
          a: IAutoMovieInteractionEvent,
          b: IAutoMovieInteractionEvent,
        ): number =>
          a.time - b.time || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
      );
      if (!self.resolving) KEPT.set(self, all);
    }
    return subject === undefined
      ? all
      : all.filter(
          (h: IAutoMovieInteractionEvent): boolean => h.target === subject,
        );
  }

  /** The melee stops. */
  function melee(
    self: IAutoMovieMotionHumanPerformanceState,
  ): IAutoMovieInteractionEvent[] {
    return self.strikes.map(
      (
        strike: IAutoMovieMotionHumanPerformanceState.IStrike,
      ): IAutoMovieInteractionEvent => {
        const t: number = strike.seconds;
        const point: IAutoMovieVector3 = strike.weapon.path(t);
        const end: IAutoMovieVector3 = strike.weapon.tail?.(t) ?? point;
        const velocity: IAutoMovieVector3 = Vector3.scale(
          Vector3.subtract(
            strike.weapon.path(t + HumanPerformanceContacts.STEP),
            strike.weapon.path(t - HumanPerformanceContacts.STEP),
          ),
          1 / (2 * HumanPerformanceContacts.STEP),
        );
        const struck = person(self, strike.against, t, point, end);
        const striker: IAutoMovieMotionHumanBody = HumanPerformanceRead.person(
          self,
          strike.subject,
        ).performer.body;
        const side: string = strike.weapon.limb.startsWith("left")
          ? "left"
          : "right";
        const distal: string = strike.weapon.limb.endsWith("Arm")
          ? `${side}LowerArm`
          : `${side}LowerLeg`;
        const mass: number | undefined = striker.profile.segments.find(
          (s): boolean => s.bone === distal,
        )?.mass;
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
  ): IAutoMovieInteractionEvent[] {
    const out: IAutoMovieInteractionEvent[] = [];
    for (const blast of self.blasts) {
      const t: number = HumanPerformanceLayers.instant(self, blast.at);
      for (const p of self.people.values()) {
        const subject: string = p.performer.subject;
        const struck = person(self, subject, t, blast.point, blast.point);
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

  /** Each recorded impact, with the departure from the following leg if one exists. */
  function flights(
    self: IAutoMovieMotionHumanPerformanceState,
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
          const region: AutoMovieHumanoidRegion | undefined =
            struck.kind === "person"
              ? nearestRegion(
                  HumanPerformanceRead.person(self, struck.subject).performer
                    .body,
                  HumanPerformanceRead.bones(self, struck.subject, time),
                  contact.point,
                )
              : undefined;
          out.push({
            id: index === 0 ? id : `${id}:${index}`,
            kind: struck.kind === "ground" ? "contact" : "hit",
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

  /** Where a segment meets a person at a second: the bone, the surface point, its normal and the nearest region. */
  function person(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): {
    distance: number;
    bone: AutoMovieHumanoidBone;
    point: IAutoMovieVector3;
    normal: IAutoMovieVector3;
    region?: AutoMovieHumanoidRegion;
  } {
    const who: IAutoMovieMotionHumanSegment.IPerson =
      HumanPerformanceRead.person(self, subject);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanPerformanceRead.bones(self, subject, seconds);
    const near = HumanColliders.nearest(who.performer.body, bones, a, b);
    const region: AutoMovieHumanoidRegion | undefined = nearestRegion(
      who.performer.body,
      bones,
      near.point,
    );
    return { ...near, ...(region === undefined ? {} : { region }) };
  }

  /** The body's named region whose point lies nearest a world point. */
  function nearestRegion(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    point: IAutoMovieVector3,
  ): AutoMovieHumanoidRegion | undefined {
    let best: { region: AutoMovieHumanoidRegion; distance: number } | undefined;
    for (const [region, frame] of Object.entries(body.surfaces.regions) as [
      AutoMovieHumanoidRegion,
      IAutoMovieHumanoidSurfaces.IFrame,
    ][]) {
      const bone: IAutoMovieResolvedBone | undefined = bones.get(frame.bone);
      if (bone === undefined) continue;
      const at: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        frame,
        bone,
      ).point;
      const distance: number = Vector3.length(Vector3.subtract(at, point));
      if (best === undefined || distance < best.distance)
        best = { region, distance };
    }
    return best?.region;
  }

  /** The hits kept per placed performance. */
  const KEPT: WeakMap<
    IAutoMovieMotionHumanPerformanceState,
    readonly IAutoMovieInteractionEvent[]
  > = new WeakMap();
}
