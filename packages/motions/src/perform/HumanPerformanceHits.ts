import {
  type IAutoMovieResolvedBone,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieInteractionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanBlast } from "./HumanBlast";
import { HumanPerformanceContacts } from "./HumanPerformanceContacts";
import { HumanPerformanceLayers } from "./HumanPerformanceLayers";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import { HumanPropFlight } from "./HumanPropFlight";
import type { HumanSegment } from "./HumanSegment";

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
 * - flights: each flight's first contact (`HumanPropFlight`), with the
 *   prop's velocity and mass, and its outcome.
 *
 * A hit on a person names the bone it struck and the region nearest the
 * point; its normal is the struck surface's outward normal. Hits are in time
 * order, ties by producer and then by striker.
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
   */
  export function hits(
    self: HumanPerformanceState,
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
  function melee(self: HumanPerformanceState): IAutoMovieInteractionEvent[] {
    return self.strikes.map(
      (strike: HumanPerformanceState.IStrike): IAutoMovieInteractionEvent => {
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
        const striker: IHumanBody = HumanPerformanceRead.person(
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
  function blasts(self: HumanPerformanceState): IAutoMovieInteractionEvent[] {
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

  /** The flights' first contacts. */
  function flights(self: HumanPerformanceState): IAutoMovieInteractionEvent[] {
    const out: IAutoMovieInteractionEvent[] = [];
    for (const prop of self.props.values())
      for (const f of HumanPropFlight.flights(self, prop.subject)) {
        const c: HumanPropFlight.IContact | undefined = f.contact;
        if (c === undefined) continue;
        const region: AutoMovieHumanoidRegion | undefined =
          c.struck.kind === "person"
            ? nearestRegion(
                HumanPerformanceRead.person(self, c.struck.subject).performer
                  .body,
                HumanPerformanceRead.bones(self, c.struck.subject, f.end),
                c.point,
              )
            : undefined;
        out.push({
          id: `flight:${f.prop}:${f.launch.toFixed(6)}`,
          kind: c.struck.kind === "ground" ? "contact" : "hit",
          source: "collisionSolver",
          time: f.end,
          actor: f.source.subject,
          target: c.struck.kind === "ground" ? null : c.struck.subject,
          object: f.prop,
          point: c.point,
          actionIndex: f.source.entry,
          reaction: null,
          ...(c.struck.kind === "person" ? { bone: c.struck.bone } : {}),
          ...(region === undefined ? {} : { region }),
          velocity: c.velocity,
          normal: c.normal,
          ...(prop.body === undefined ? {} : { mass: prop.body.mass }),
          outcome: "stick",
          exit: { x: 0, y: 0, z: 0 },
        });
      }
    return out;
  }

  /** Where a segment meets a person at a second: the bone, the surface point, its normal and the nearest region. */
  function person(
    self: HumanPerformanceState,
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
    const who: HumanSegment.IPerson = HumanPerformanceRead.person(
      self,
      subject,
    );
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
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    point: IAutoMovieVector3,
  ): AutoMovieHumanoidRegion | undefined {
    let best: { region: AutoMovieHumanoidRegion; distance: number } | undefined;
    for (const [region, frame] of Object.entries(body.surfaces.regions) as [
      AutoMovieHumanoidRegion,
      resolveAutoMovieHumanoidSurfaces.IFrame,
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
    HumanPerformanceState,
    readonly IAutoMovieInteractionEvent[]
  > = new WeakMap();
}
