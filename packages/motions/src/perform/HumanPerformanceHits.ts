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
import { StrikingWeapon } from "../striking/StrikingWeapon";
import { HumanBlast } from "./HumanBlast";
import { HumanPerformanceContacts } from "./HumanPerformanceContacts";
import { HumanPerformanceLayers } from "./HumanPerformanceLayers";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import { HumanPropFlight } from "./HumanPropFlight";
import { HumanPropOutcome } from "./HumanPropOutcome";
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States all-subject versus selected-target results; the namespace documents producer fields, units and ordering.
   * @evidence contracts/development/implementation.md#principled-implementation Actual melee stops, blast impulse geometry and prop-flight contacts produce the existing shared interaction records; time/id sorting defines deterministic order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three original producers share one synchronous per-person observation factory, then feed the original sort and optional target filter; each consumer requests profile-plus-region or region-only FK outputs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps central-difference velocity, provisional profile segment mass, nearest surface/region and producer outcomes; a complete-axis melee read changes no physical acceptance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cold work includes original producer queries and O(H log H) sorting for H hits; filtering is O(H). Each actually observed person/demand prepares static names and a synchronous unchanged-table ROM index once. Melee/blast FK returns the profile-plus-region owner union and flight region-only FK returns only region owners, preserving every required ancestry and original native solve; no query pose is reused. A registered melee capsule reads both contact ends in one actual chain evaluation; its two velocity times remain separate actual reads. R canonical region-entry pairs are prepared once per unchanged body instead of allocated at every nearest-region query. The four possible melee distal masses each scan their immutable profile at most once, retaining the original first matching segment and absent-mass behavior; every actual point placement/distance and strict first-minimum comparison still executes through the shared point owner, omitting only unused normal/forward rotations and their result wrapper. Scalar distance retains the same ordinary/extreme/nonfinite norm branches without a displacement allocation, and first-minimum selection retains only its current name and scalar instead of allocating a record per improvement.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The existing weak performance result is used only outside resolving; resolving always rebuilds from current state. Registered capsule constructor metadata shares its head/tail source only within one exact contact-time read. The body producer fixes region order and bone-local surface frames, so only that immutable entry table and the four fixed distal profile masses are shared; current posed bones and world region points are never retained. The constructor-fixed registry/body and one synchronous unchanged-table build justify per-person/demand prepareBones metadata only; each exact-time callback still observes current placement/stops and creates an independent current pose/FK workspace, sharing only genuine unchanged-table ROM metadata within this build.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Existing weak performance keys retain H immutable hit records for that placed performance; temporary producer arrays and endpoint frames end after the build. Separate weak body keys own only R fixed region-name/local-frame pairs and at most four distal scalar masses or absences until body release; at most two immutable profile/region owner-name sets also weakly follow that body. Lazy per-person/demand query producers exist only during one synchronous hit build and retain no prior pose, map, world point, endpoint history or external resource.
   */
  export function hits(
    self: HumanPerformanceState,
    subject?: string,
  ): readonly IAutoMovieInteractionEvent[] {
    let all: readonly IAutoMovieInteractionEvent[] | undefined = self.resolving
      ? undefined
      : KEPT.get(self);
    if (all === undefined) {
      const read: IReadBones = reading(self);
      all = [...melee(self, read), ...blasts(self, read), ...flights(self, read)].sort(
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
  function melee(self: HumanPerformanceState, read: IReadBones): IAutoMovieInteractionEvent[] {
    return self.strikes.map(
      (strike: HumanPerformanceState.IStrike): IAutoMovieInteractionEvent => {
        const t: number = strike.seconds;
        const [point, tail]: StrikingWeapon.IAxis = StrikingWeapon.read(strike.weapon, t);
        const end: IAutoMovieVector3 = tail ?? point;
        const velocity: IAutoMovieVector3 = Vector3.scale(
          Vector3.subtract(
            strike.weapon.path(t + HumanPerformanceContacts.STEP),
            strike.weapon.path(t - HumanPerformanceContacts.STEP),
          ),
          1 / (2 * HumanPerformanceContacts.STEP),
        );
        const struck = person(self, strike.against, t, point, end, read);
        const striker: IHumanBody = HumanPerformanceRead.person(
          self,
          strike.subject,
        ).performer.body;
        const side: "left" | "right" = strike.weapon.limb.startsWith("left")
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
  function blasts(self: HumanPerformanceState, read: IReadBones): IAutoMovieInteractionEvent[] {
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

  /** The flights' first contacts, with what each did and the velocity it left with. */
  function flights(self: HumanPerformanceState, read: IReadBones): IAutoMovieInteractionEvent[] {
    const out: IAutoMovieInteractionEvent[] = [];
    for (const prop of self.props.values())
      for (const f of HumanPropFlight.flights(self, prop.subject)) {
        const c: HumanPropFlight.IContact | undefined = f.contact;
        if (c === undefined) continue;
        const next: HumanPropOutcome.ILeg | undefined = f.legs?.[0];
        const struck: HumanSegment.IPerson | undefined = c.struck.kind === "person"
          ? HumanPerformanceRead.person(self, c.struck.subject) : undefined;
        const region: AutoMovieHumanoidRegion | undefined = struck === undefined
          ? undefined : nearestRegion(struck.performer.body, read(struck, f.end, "regions"), c.point);
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
          // What the contact did and the velocity it left with: the next
          // leg's at its start, at rest where it stays.
          outcome: c.outcome,
          exit:
            next === undefined
              ? { x: 0, y: 0, z: 0 }
              : HumanPropOutcome.at(next, next.from).velocity,
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
    read: IReadBones,
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
      read(who, seconds, "contact");
    const near = HumanColliders.nearest(who.performer.body, bones, a, b);
    const region: AutoMovieHumanoidRegion | undefined = nearestRegion(
      who.performer.body,
      bones,
      near.point,
    );
    return { ...near, ...(region === undefined ? {} : { region }) };
  }

  /** Actual per-person observation, with outputs dictated by the current hit consumer. */
  type IReadBones = (
    who: HumanSegment.IPerson,
    seconds: number,
    kind: "regions" | "contact",
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /** Static demand producers live only for this synchronous hit-record build, never their query results. */
  function reading(self: HumanPerformanceState): IReadBones {
    let readers: Map<HumanSegment.IPerson, Partial<Record<"regions" | "contact", ReturnType<typeof HumanPerformanceRead.prepareBones>>>> | undefined;
    return (who: HumanSegment.IPerson, seconds: number, kind: "regions" | "contact"): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      readers ??= new Map();
      let sources: Partial<Record<"regions" | "contact", ReturnType<typeof HumanPerformanceRead.prepareBones>>> | undefined = readers.get(who);
      if (sources === undefined) {
        sources = {};
        readers.set(who, sources);
      }
      let read: ReturnType<typeof HumanPerformanceRead.prepareBones> | undefined = sources[kind];
      if (read === undefined) {
        read = HumanPerformanceRead.prepareBones(self, who.performer.subject, demand(who.performer.body, kind));
        sources[kind] = read;
      }
      return read(seconds);
    };
  }

  /** Only immutable profile/region owner names, with no pose, ROM mapper or sampled point retained. */
  function demand(body: IHumanBody, kind: "regions" | "contact"): ReadonlySet<AutoMovieHumanoidBone> {
    let names: Partial<Record<"regions" | "contact", ReadonlySet<AutoMovieHumanoidBone>>> | undefined = DEMANDS.get(body);
    if (names === undefined) {
      names = {};
      DEMANDS.set(body, names);
    }
    let requested: ReadonlySet<AutoMovieHumanoidBone> | undefined = names[kind];
    if (requested === undefined) {
      const selected: Set<AutoMovieHumanoidBone> = new Set(
        kind === "contact" ? HumanColliders.bones(body) : undefined,
      );
      for (const [, frame] of regionFrames(body)) selected.add(frame.bone);
      requested = selected;
      names[kind] = requested;
    }
    return requested;
  }

  /** The body's named region whose point lies nearest a world point. */
  function nearestRegion(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    point: IAutoMovieVector3,
  ): AutoMovieHumanoidRegion | undefined {
    let best: AutoMovieHumanoidRegion | undefined;
    let nearest: number = Infinity;
    for (const [region, frame] of regionFrames(body)) {
      const bone: IAutoMovieResolvedBone | undefined = bones.get(frame.bone);
      if (bone === undefined) continue;
      const at: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.point(
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
  type IDistal = "leftLowerArm" | "rightLowerArm" | "leftLowerLeg" | "rightLowerLeg";

  /** First-declared canonical profile mass; no pose, time or hit outcome is retained. */
  function distalMass(body: IHumanBody, bone: IDistal): number | undefined {
    let masses: Map<IDistal, number | undefined> | undefined = MASSES.get(body);
    if (masses === undefined) {
      masses = new Map();
      MASSES.set(body, masses);
    }
    if (masses.has(bone)) return masses.get(bone);
    const mass: number | undefined = body.profile.segments.find(
      (segment: IHumanBody["profile"]["segments"][number]): boolean => segment.bone === bone,
    )?.mass;
    masses.set(bone, mass);
    return mass;
  }

  /** Immutable profile metadata has at most the four actual melee distal names per body. */
  const MASSES: WeakMap<IHumanBody, Map<IDistal, number | undefined>> = new WeakMap();

  /** Fixed canonical region order and bone-local frames, never world-posed answers. */
  function regionFrames(body: IHumanBody): IRegions {
    let regions: IRegions | undefined = REGIONS.get(body);
    if (regions === undefined) {
      regions = Object.entries(body.surfaces.regions) as IRegions;
      REGIONS.set(body, regions);
    }
    return regions;
  }

  /** The body's original entry order, used unchanged by strict first-minimum selection. */
  type IRegions = readonly (readonly [AutoMovieHumanoidRegion, resolveAutoMovieHumanoidSurfaces.IFrame])[];

  /** At most two actual profile/region FK name demands per immutable canonical body. */
  const DEMANDS: WeakMap<IHumanBody, Partial<Record<"regions" | "contact", ReadonlySet<AutoMovieHumanoidBone>>>> = new WeakMap();

  /** Weak immutable body metadata only; no posed bone, observation or time survives here. */
  const REGIONS: WeakMap<IHumanBody, IRegions> = new WeakMap();
  /** The hits kept per placed performance. */
  const KEPT: WeakMap<
    HumanPerformanceState,
    readonly IAutoMovieInteractionEvent[]
  > = new WeakMap();
}
