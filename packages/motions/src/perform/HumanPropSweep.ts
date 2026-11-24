import {
  Quaternion,
  Vector3,
  physicalShapeNearest,
  projectileAt,
  projectileFirstContact,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHit,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanPropOutcome,
  IAutoMovieMotionHumanTether,
  IAutoMovieMotionPropLaunch,
  IAutoMoviePhysicalShape,
  IAutoMovieProjectile,
  IAutoMovieProjectileFirstContact,
  IAutoMovieProjectileState,
  IAutoMovieResolveContactEvents,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditLimits } from "../audit/AutoMovieMotionHumanAuditLimits";
import { AutoMovieMotionHumanBendRepeat } from "../compose/AutoMovieMotionHumanBendRepeat";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPropCatchHands } from "./HumanPropCatchHands";
import { HumanPropOutcome } from "./HumanPropOutcome";

/**
 * The one sweep of a flying prop (`HumanPropFlight`): its flight from a film
 * second against every person but the launcher, read on their displayed bones
 * at each second and passed over while a bound around their root shows them out
 * of reach (the bounding-sphere reject), the props that do not fly but those
 * the launcher holds or wears as the flight starts (they go with the launcher)
 * and, through its fitted approach, those a later launch that ends the flight
 * holds (a bat striking the incoming ball), and the floor, through the engine's
 * one resolver (`projectileFirstContact`). The step keeps the prop from
 * crossing the thinnest collider it may meet in one step, finger bones aside: a
 * finger is the stated blind spot. A person is read only as the gap to them
 * could close at the audit's part speed and the flight's own (conservative
 * advancement), the floor and a prop standing still only as the flight could
 * close on them. A hull counts by twice the depth of its vertices' centroid
 * inside it, the diameter of the largest ball about that point within it, which
 * no width of the hull is less than. A pass leaves the body it passes through
 * behind. A bounce separately names its resolved collider for the engine's
 * physical departure certificate; that collider stays eligible for later
 * entry.
 *
 * A prop that nothing grips, wears, mounts, tethers or moves over the sweep
 * stands in its frame at the sweep's start, a fixed frame whose shapes the
 * engine certifies a bounce's departure from by their supporting plane. A
 * person and a moving prop are opaque to the engine, so their own surface
 * motion classifies a contact at the sweep's start (Baraff 1989, SIGGRAPH,
 * "Analytical methods for dynamic simulation of non-penetrating rigid bodies":
 * colliding, resting or separating by the relative normal velocity): one the
 * prop leaves, its velocity relative to the surface's at the nearest point
 * pointing out along the normal, is no new impact, as Box2D's time of impact
 * treats a pair already touching (`b2TimeOfImpact`'s touching state), and the
 * pair is clear from the scan's own next grid second, where its gap is read
 * positive; an episode shorter than that step is the scan's stated blind spot.
 * A contact the prop does not leave stays a contact. A surface's velocity is
 * the central difference of its frame over a contact's time resolution
 * (`HumanPropOutcome.CONTACT_SECOND`), and the meeting carries it to the
 * bounce, which acts on the velocity relative to it.
 */
export namespace HumanPropSweep {
  /**
   * Sweep a flight from a film second against everyone but the launcher, the
   * props that do not fly and the floor, leaving one collider behind.
   *
   * @param self The performance.
   * @param prop The flying prop.
   * @param launcher The launcher's subject, who is no collider.
   * @param seconds The film second of the flight's zero.
   * @param projectile The flight.
   * @param horizon Seconds after its zero the film still runs.
   * @param leave A collider's id to leave out: the body a pass goes through.
   * @param departing The collider whose existing support or rebound contact the
   *   projectile is leaving. Only the engine's certificate can defer its
   *   initial contact and it continues to check later entry.
   * @param radius An opt-in spherical radius in metres. Its supplied projectile
   *   travels by its centre. Absent, use the prop's point or tip.
   * @param captureHands Gripping hands owned by a staged capture during their
   *   final approach. The remaining body surfaces continue to participate.
   * @param handback The later launch that ends this flight, when one does. The
   *   props its performer holds at that launch are left out from the start of
   *   the launching action, whose own fit owns the meeting, to the end of the
   *   sweep, and the hands that hold or touch them through that action's
   *   approach.
   * @returns The first meeting, or null when it meets nothing before the
   *   horizon.
   */
  export function sweep(
    self: IAutoMovieMotionHumanPerformanceState,
    prop: IAutoMovieMotionHumanProp,
    launcher: string,
    seconds: number,
    projectile: IAutoMovieProjectile,
    horizon: number,
    leave: string | undefined,
    departing?: string,
    radius?: number,
    captureHands: readonly HumanPropCatchHands.IApproach[] = [],
    handback?: IHandback,
  ): IAutoMovieMotionHumanPropOutcome.IMeeting | null {
    const bend: AutoMovieMotionHumanBendRepeat =
      new AutoMovieMotionHumanBendRepeat();
    const colliders: IAutoMovieProjectileFirstContact.ICollider[] = [
      projectileFirstContact.plane(
        "ground",
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ),
    ];
    // A later launch's touching hands (a deliberate deflection) and the hands
    // holding its instrument (a racket's grip) are left to that launch through
    // its action, as a staged catch's hands are: its fit owns the meeting of
    // the instrument and the hand that carries it.
    const handedSides: readonly AutoMovieHumanSide[] =
      handback === undefined ? [] : handbackSides(self, handback);
    const approaches: readonly HumanPropCatchHands.IApproach[] =
      handback === undefined || handedSides.length === 0
        ? captureHands
        : [
            ...captureHands,
            ...handedSides.map(
              (side: AutoMovieHumanSide): HumanPropCatchHands.IApproach => ({
                subject: handback.subject,
                side,
                from: handback.from,
                until: handback.at,
              }),
            ),
          ];
    const maskedBones:
      | Map<string, ReturnType<typeof HumanPerformanceRead.prepareBones>>
      | undefined = approaches.length === 0 ? undefined : new Map();

    // How each opaque collider's surface moves at its point nearest a flight
    // segment, by the collider's id: a person's and a moving prop's.
    const surfaces: Map<string, Surface> = new Map();
    for (const person of self.people.values()) {
      const subject: string = person.performer.subject;
      if (subject === launcher || `person:${subject}` === leave) continue;
      const body: typeof person.performer.body = person.performer.body;
      const reach: number = body.measure.stature;
      const allBones: ReturnType<typeof HumanPerformanceRead.prepareBones> =
        HumanPerformanceRead.prepareBones(self, subject);
      const reserved: readonly HumanPropCatchHands.IApproach[] | undefined =
        maskedBones === undefined
          ? undefined
          : approaches.filter((grip): boolean => grip.subject === subject);
      const bones: typeof allBones =
        reserved === undefined || reserved.length === 0
          ? allBones
          : (at: number): ReturnType<typeof allBones> =>
              HumanPropCatchHands.omit(allBones(at), reserved, at);
      if (bones !== allBones) maskedBones?.set(subject, bones);
      /** The original root-based rejection, with its centre for a full witness. */
      const frame = (t: number): IAutoMovieVector3 =>
        HumanPerformanceRead.projectileRoot(self, subject, seconds + t, bend);
      /** The original signed lower bound before querying the collider union. */
      const distanceFromRoot = (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
        root: IAutoMovieVector3,
      ): number =>
        Math.min(
          Vector3.length(Vector3.subtract(a, root)),
          Vector3.length(Vector3.subtract(b, root)),
        ) - reach;
      // The struck bone's motion carries the surface point, read on the
      // displayed pose the sweep reads.
      const surface: Surface = (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
        t: number,
      ): ISurface => {
        const near: ReturnType<typeof HumanColliders.nearest> =
          HumanColliders.nearest(body, bones(seconds + t), a, b);
        const only: ReadonlySet<AutoMovieHumanoidBone> = new Set([near.bone]);
        return {
          normal: near.normal,
          velocity: pointVelocity(
            (at: number): IAutoMovieRigidTransform => {
              const bone: IAutoMovieResolvedBone = HumanPerformanceRead.bones(
                self,
                subject,
                at,
                only,
              ).get(near.bone)!;
              return {
                position: bone.worldPosition,
                rotation: bone.worldRotation,
              };
            },
            near.point,
            seconds + t,
          ),
        };
      };
      surfaces.set(`person:${subject}`, surface);
      colliders.push({
        id: `person:${subject}`,
        // No joint centre of a displayed body moves faster than the audit's
        // part speed, the one model the take is judged by, so the sweep reads
        // a person only as the gap to them could close at that speed and the
        // flight's own.
        speed: (): number => AutoMovieMotionHumanAuditLimits.speed,
        departure: (
          projectile: IAutoMovieProjectile,
          options: IAutoMovieProjectileFirstContact.IOptions,
          contact: IAutoMovieResolveContactEvents.IInitialContact,
        ): IAutoMovieResolveContactEvents.Departure | undefined =>
          separating(projectile, options, contact, surface),
        distance: (a, b, t): number => {
          const bound: number = distanceFromRoot(a, b, frame(t));
          if (bound > (radius ?? 0)) return bound;
          return HumanColliders.distanceToSegment(
            body,
            bones(seconds + t),
            a,
            b,
          ).distance;
        },
        nearest: (
          a: IAutoMovieVector3,
          b: IAutoMovieVector3,
          t: number,
        ): IAutoMovieProjectileFirstContact.INearest => {
          const root: IAutoMovieVector3 = frame(t);
          const bound: number = distanceFromRoot(a, b, root);
          if (bound > (radius ?? 0))
            return {
              distance: bound,
              point: root,
              normal: { x: 0, y: 1, z: 0 },
            };
          const near = HumanColliders.nearest(body, bones(seconds + t), a, b);
          return {
            distance: near.distance,
            point: near.point,
            normal: near.normal,
          };
        },
      });
    }
    const solid: IAutoMoviePhysicalShape[] = [];
    for (const other of self.props.values()) {
      if (other.subject === prop.subject || other.shapes === undefined)
        continue;
      if (launched(self, other.subject)) continue;

      // What the launcher holds or wears as the flight starts goes with the
      // launcher, who is no collider: a ball leaving a gun's muzzle starts
      // on the gun's own shape, and read as a collider the gun held the
      // sweep's step at the muzzle's zero gap, each step a fresh read of
      // the shooter's displayed pose (firearm_shot_launch ran 7 minutes).
      const grips: IAutoMovieMotionHumanPerformanceState.IGrip[] =
        HumanPerformanceRead.grips(self, other.subject);
      if (
        grips.some(
          (g): boolean =>
            g.subject === launcher &&
            g.from <= seconds &&
            g.to >= seconds - 1e-6,
        )
      )
        continue;

      // What the next launcher holds as its launch ends this flight is that
      // launch's own instrument: a bat fitted to the incoming ball at the
      // strike. Its fitted approach owns the meeting, as a staged catch's
      // hands own theirs, so the sweep leaves the instrument out from the
      // launching action's start. Read as a collider, it closed the gap at
      // the horizon itself, each step a fresh read of the striker's fitted
      // arm (baseball pitch to bat stalled past three minutes).
      const handedBack: boolean =
        handback !== undefined &&
        grips.some(
          (g): boolean =>
            g.subject === handback.subject &&
            g.from <= handback.at &&
            g.to >= handback.at - 1e-6,
        );
      const pose = (t: number): IAutoMovieRigidTransform =>
        HumanPerformanceRead.prop(self, other.subject, seconds + t);
      const fixed: IAutoMovieRigidTransform | undefined = still(
        self,
        other,
        grips,
        seconds,
        seconds + horizon,
      );
      // While a person holds or wears the prop, it lies within that person's
      // reach of their root and its own reach of the hand, twice its extent:
      // the same bounding-sphere reject the person's own collider uses, so a
      // flight far from the holder never reads the holder's pose for it.
      const carried: readonly IAutoMovieMotionHumanPerformanceState.IGrip[] =
        fixed === undefined
          ? carriers(self, other, grips, seconds, seconds + horizon)
          : [];
      const extent: number = 2 * reach(other.shapes);
      const bound: Bound = (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
        t: number,
      ): number => {
        const grip: IAutoMovieMotionHumanPerformanceState.IGrip | undefined =
          carried.find(
            (g: IAutoMovieMotionHumanPerformanceState.IGrip): boolean =>
              g.from <= seconds + t && g.to >= seconds + t,
          );
        if (grip === undefined) return -Infinity;
        const root: IAutoMovieVector3 = HumanPerformanceRead.projectileRoot(
          self,
          grip.subject,
          seconds + t,
          bend,
        );
        return (
          Math.min(
            Vector3.length(Vector3.subtract(a, root)),
            Vector3.length(Vector3.subtract(b, root)),
          ) -
          HumanPerformanceRead.person(self, grip.subject).performer.body.measure
            .stature -
          extent
        );
      };
      other.shapes.forEach(
        (shape: IAutoMoviePhysicalShape, k: number): void => {
          const id: string = `prop:${other.subject}:${k}`;
          if (id === leave) return;
          solid.push(shape);
          const shaped: IAutoMovieProjectileFirstContact.ICollider =
            projectileFirstContact.shape(id, shape, fixed ?? pose);
          const placed: IAutoMovieProjectileFirstContact.ICollider =
            carried.length === 0 ? shaped : culled(shaped, bound, radius ?? 0);

          // A moving prop's surface carries the point its frame carries.
          const surface: Surface = (
            a: IAutoMovieVector3,
            b: IAutoMovieVector3,
            t: number,
          ): ISurface => {
            const near: IAutoMovieProjectileFirstContact.INearest =
              placed.nearest(a, b, t);
            return {
              normal: near.normal,
              velocity: pointVelocity(
                (at: number): IAutoMovieRigidTransform =>
                  HumanPerformanceRead.prop(self, other.subject, at),
                near.point,
                seconds + t,
              ),
            };
          };
          if (fixed === undefined) surfaces.set(id, surface);
          const collider: IAutoMovieProjectileFirstContact.ICollider =
            fixed !== undefined
              ? placed
              : {
                  ...placed,
                  departure: (
                    projectile: IAutoMovieProjectile,
                    options: IAutoMovieProjectileFirstContact.IOptions,
                    contact: IAutoMovieResolveContactEvents.IInitialContact,
                  ): IAutoMovieResolveContactEvents.Departure | undefined =>
                    separating(projectile, options, contact, surface),
                };
          colliders.push(
            handedBack ? until(collider, handback!.from - seconds) : collider,
          );
        },
      );
    }
    const tip: IAutoMovieVector3 | undefined =
      radius === undefined ? prop.points["tip"]?.point : undefined;
    const hit: IAutoMovieHit | null = projectileFirstContact(
      projectile,
      colliders,
      { from: 0, to: horizon },
      {
        radius: radius ?? 0,
        ...(tip === undefined ? {} : { tail: tip }),
        ...(departing === undefined ? {} : { departing }),
        thickness: thinnest(self, launcher, solid),
      },
    );
    if (hit === null) return null;
    const id: string = hit.collider!;
    const at: number = seconds + hit.time;
    const struck: IAutoMovieMotionHumanPropFlight.Struck = id.startsWith(
      "person:",
    )
      ? {
          kind: "person",
          subject: id.slice("person:".length),
          bone: personBone(id.slice("person:".length), hit.point),
        }
      : id.startsWith("prop:")
        ? {
            kind: "prop",
            subject: id.slice("prop:".length, id.lastIndexOf(":")),
          }
        : { kind: "ground" };

    // A moving surface's velocity at the contact, which the bounce leaves
    // relative to; the floor and a prop standing still are at rest.
    const reader: Surface | undefined = surfaces.get(id);
    const state: IAutoMovieProjectileState = projectileAt(projectile, hit.time);
    return {
      hit,
      struck,
      collider: id,
      ...(reader === undefined
        ? {}
        : {
            surface: reader(state.position, end(state), hit.time).velocity,
          }),
    };

    /** The flight segment's far end: its tail, or its point. */
    function end(at: IAutoMovieProjectileState): IAutoMovieVector3 {
      return tip === undefined || at.rotation === undefined
        ? at.position
        : Vector3.add(at.position, Quaternion.rotateVector(at.rotation, tip));
    }

    /** Resolve the struck bone with the same receiving-hand filter as the sweep. */
    function personBone(
      subject: string,
      point: IAutoMovieVector3,
    ): AutoMovieHumanoidBone {
      return HumanColliders.nearest(
        HumanPerformanceRead.person(self, subject).performer.body,
        maskedBones?.get(subject)?.(at) ??
          HumanPerformanceRead.bones(self, subject, at),
        point,
        point,
      ).bone;
    }
  }

  /**
   * The later launch that ends a flight, as the sweep leaves out the props its
   * performer holds at that launch.
   */
  export interface IHandback {
    /** The performer whose later launch ends the flight. */
    subject: string;

    /** The film second of that launch, where its own fit meets the prop. */
    at: number;

    /**
     * The film second the launching action starts, from which its fit owns the
     * approach.
     */
    from: number;

    /**
     * The launcher's hands that meet the prop at that launch
     * (`IAutoMovieMotionPropLaunch.touching`); none for a launch made with a
     * held instrument, whose holding hands the sweep reads from the grips.
     */
    hands: readonly AutoMovieHumanSide[];
  }

  /**
   * A collider present only before a flight second: from it on, the handback's
   * fitted approach owns the meeting, so the collider is absent.
   */
  function until(
    collider: IAutoMovieProjectileFirstContact.ICollider,
    from: number,
  ): IAutoMovieProjectileFirstContact.ICollider {
    return {
      id: collider.id,
      ...(collider.departure === undefined
        ? {}
        : { departure: collider.departure }),
      distance: (a, b, t): number =>
        t >= from
          ? Infinity
          : collider.distance === undefined
            ? collider.nearest(a, b, t).distance
            : collider.distance(a, b, t),
      nearest: (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
        t: number,
      ): IAutoMovieProjectileFirstContact.INearest =>
        t >= from
          ? { distance: Infinity, point: a, normal: { x: 0, y: 1, z: 0 } }
          : collider.nearest(a, b, t),
    };
  }

  /**
   * The handback launcher's hands its fit owns at the launch: the hands that
   * touch the prop and the hands that hold a prop then (the instrument that
   * strikes), each side once.
   */
  function handbackSides(
    self: IAutoMovieMotionHumanPerformanceState,
    handback: IHandback,
  ): AutoMovieHumanSide[] {
    const sides: Set<AutoMovieHumanSide> = new Set(handback.hands);
    for (const other of self.props.values())
      for (const grip of HumanPerformanceRead.grips(self, other.subject))
        if (
          grip.subject === handback.subject &&
          grip.bone === undefined &&
          grip.mount === undefined &&
          grip.from <= handback.at &&
          grip.to >= handback.at - 1e-6
        )
          sides.add(grip.side);
    return [...sides];
  }

  /**
   * A prop's frame when it stands still over a sweep: nothing moves it by
   * itself, wears it, mounts it, pulls it on a line, and no grip holds it in
   * the span (a fixture's grips bear on it and never carry it). Undefined when
   * it may move.
   */
  function still(
    self: IAutoMovieMotionHumanPerformanceState,
    prop: IAutoMovieMotionHumanProp,
    grips: readonly IAutoMovieMotionHumanPerformanceState.IGrip[],
    from: number,
    to: number,
  ): IAutoMovieRigidTransform | undefined {
    if (
      prop.motion !== undefined ||
      prop.worn !== undefined ||
      prop.mounted !== undefined ||
      prop.soft !== undefined
    )
      return undefined;
    for (const other of self.props.values())
      if (
        other.tethers?.some(
          (line: IAutoMovieMotionHumanTether): boolean =>
            line.to.prop === prop.subject,
        )
      )
        return undefined;
    if (
      prop.fixed !== true &&
      grips.some(
        (grip: IAutoMovieMotionHumanPerformanceState.IGrip): boolean =>
          grip.from < to && grip.to > from,
      )
    )
      return undefined;
    return HumanPerformanceRead.prop(self, prop.subject, from);
  }

  /**
   * The people's grips that carry a prop over a sweep, when people's grips are
   * all that move it: none when it moves by itself, rides another prop or a
   * line pulls it.
   */
  function carriers(
    self: IAutoMovieMotionHumanPerformanceState,
    prop: IAutoMovieMotionHumanProp,
    grips: readonly IAutoMovieMotionHumanPerformanceState.IGrip[],
    from: number,
    to: number,
  ): IAutoMovieMotionHumanPerformanceState.IGrip[] {
    if (
      prop.motion !== undefined ||
      prop.mounted !== undefined ||
      prop.soft !== undefined ||
      [...self.props.values()].some(
        (other: IAutoMovieMotionHumanProp): boolean =>
          other.tethers?.some(
            (line: IAutoMovieMotionHumanTether): boolean =>
              line.to.prop === prop.subject,
          ) === true,
      )
    )
      return [];
    const spanned: IAutoMovieMotionHumanPerformanceState.IGrip[] = grips.filter(
      (grip: IAutoMovieMotionHumanPerformanceState.IGrip): boolean =>
        grip.from < to && grip.to > from,
    );
    return spanned.some(
      (grip: IAutoMovieMotionHumanPerformanceState.IGrip): boolean =>
        grip.mount !== undefined,
    )
      ? []
      : spanned;
  }

  /**
   * How far a prop's shapes reach from its frame's origin, metres: the largest
   * over its shapes of the shape's offset and its own bounding radius.
   */
  function reach(shapes: readonly IAutoMoviePhysicalShape[]): number {
    let far: number = 0;
    for (const shape of shapes) {
      const own: number =
        shape.kind === "sphere"
          ? shape.radius
          : shape.kind === "capsule"
            ? shape.halfLength + shape.radius
            : shape.kind === "box"
              ? Vector3.length(shape.halfExtents)
              : Math.max(
                  0,
                  ...shape.points.map((point: IAutoMovieVector3): number =>
                    Vector3.length(point),
                  ),
                );
      far = Math.max(far, Vector3.length(shape.transform.position) + own);
    }
    return far;
  }

  /**
   * A collider read only where a cheap lower bound on its distance allows a
   * contact: farther than the projectile's radius by the bound, the bound
   * stands for the distance, as the person's root reject does.
   */
  function culled(
    collider: IAutoMovieProjectileFirstContact.ICollider,
    bound: Bound,
    radius: number,
  ): IAutoMovieProjectileFirstContact.ICollider {
    return {
      ...collider,
      distance: (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
        t: number,
      ): number => {
        const far: number = bound(a, b, t);
        return far > radius
          ? far
          : collider.distance === undefined
            ? collider.nearest(a, b, t).distance
            : collider.distance(a, b, t);
      },
      nearest: (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
        t: number,
      ): IAutoMovieProjectileFirstContact.INearest => {
        const far: number = bound(a, b, t);
        return far > radius
          ? { distance: far, point: a, normal: { x: 0, y: 1, z: 0 } }
          : collider.nearest(a, b, t);
      },
    };
  }

  /**
   * A contact at the sweep's start that the flight leaves, classified by the
   * surface's own motion: the flight's velocity relative to the surface's at
   * its nearest point points out along the normal (a separating contact, Baraff
   * 1989), and the pair's gap reads positive at the scan's next grid second,
   * where the pair is clear. Undefined for a colliding or resting contact, or
   * one still closed a step on, which stays a contact.
   */
  function separating(
    projectile: IAutoMovieProjectile,
    options: IAutoMovieProjectileFirstContact.IOptions,
    contact: IAutoMovieResolveContactEvents.IInitialContact,
    surface: Surface,
  ): IAutoMovieResolveContactEvents.Departure | undefined {
    const state: IAutoMovieProjectileState = projectileAt(
      projectile,
      contact.from,
    );
    const end: IAutoMovieVector3 =
      options.tail === undefined || state.rotation === undefined
        ? state.position
        : Vector3.add(
            state.position,
            Quaternion.rotateVector(state.rotation, options.tail),
          );
    const at: ISurface = surface(state.position, end, contact.from);
    if (
      !(
        Vector3.dot(Vector3.subtract(state.velocity, at.velocity), at.normal) >
        0
      )
    )
      return undefined;
    const seconds: number =
      contact.from +
      projectileFirstContact.step(
        projectile,
        { from: contact.from, to: contact.to },
        options,
      );
    if (!(seconds > contact.from && seconds <= contact.to)) return undefined;
    const gap: number = contact.at(seconds);
    return Number.isFinite(gap) && gap > 0
      ? { kind: "clearance", seconds }
      : undefined;
  }

  /**
   * The velocity of a point a moving frame carries, world metres per second:
   * the point fixed in the frame where it lies at a second, its central
   * difference over a contact's time resolution.
   */
  function pointVelocity(
    frame: (seconds: number) => IAutoMovieRigidTransform,
    point: IAutoMovieVector3,
    seconds: number,
  ): IAutoMovieVector3 {
    const now: IAutoMovieRigidTransform = frame(seconds);
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(now.rotation),
      Vector3.subtract(point, now.position),
    );
    const placed: (at: number) => IAutoMovieVector3 = (
      at: number,
    ): IAutoMovieVector3 => {
      const carried: IAutoMovieRigidTransform = frame(at);
      return Vector3.add(
        carried.position,
        Quaternion.rotateVector(carried.rotation, local),
      );
    };
    const h: number = HumanPropOutcome.CONTACT_SECOND;
    return Vector3.scale(
      Vector3.subtract(placed(seconds + h), placed(seconds - h)),
      1 / (2 * h),
    );
  }

  /** Whether any action launches a prop. */
  function launched(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
  ): boolean {
    for (const person of self.people.values())
      for (const segment of [...person.segments, ...person.overlays])
        if (
          (segment.plan.launches ?? []).some(
            (l: IAutoMovieMotionPropLaunch): boolean => l.prop === subject,
          )
        )
          return true;
    return false;
  }

  /**
   * The thinnest collider a flight may meet, metres: the least diameter of a
   * round shape, least full extent of a box or inscribed width of a hull among
   * the people but the launcher, finger bones aside, and the props that do not
   * fly.
   */
  function thinnest(
    self: IAutoMovieMotionHumanPerformanceState,
    launcher: string,
    props: readonly IAutoMoviePhysicalShape[],
  ): number {
    let least: number = Infinity;
    for (const shape of props) least = Math.min(least, size(shape));
    for (const person of self.people.values()) {
      if (person.performer.subject === launcher) continue;
      for (const segment of person.performer.body.profile.segments) {
        if (FINGER.test(segment.bone)) continue;
        for (const shape of segment.shapes ?? [])
          least = Math.min(least, size(shape));
      }
    }

    // With no thin collider, the floor permits a whole-span scan. A resolved
    // departure's engine certificate still exposes its later plane entry.
    return Number.isFinite(least) ? least : Number.MAX_VALUE;
  }

  /**
   * A shape's least thickness, metres: a round shape's diameter, a box's least
   * full extent, a hull's inscribed width (`width`).
   */
  function size(shape: IAutoMoviePhysicalShape): number {
    return shape.kind === "sphere" || shape.kind === "capsule"
      ? 2 * shape.radius
      : shape.kind === "box"
        ? 2 *
          Math.min(
            shape.halfExtents.x,
            shape.halfExtents.y,
            shape.halfExtents.z,
          )
        : width(shape);
  }

  /**
   * A hull's least width bound, metres: twice its vertices' centroid's depth
   * inside it, the diameter of the largest ball about that point within the
   * hull, which no width of the hull is less than. A flat hull, whose centroid
   * lies on its surface, is not counted, as a finger is not. Read once per
   * sweep (`thinnest`).
   */
  function width(shape: IAutoMoviePhysicalShape): number {
    let found: number = Infinity;
    if (shape.kind === "hull" && shape.points.length !== 0) {
      let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      for (const point of shape.points) sum = Vector3.add(sum, point);
      const centre: IAutoMovieVector3 = Vector3.add(
        shape.transform.position,
        Quaternion.rotateVector(
          shape.transform.rotation,
          Vector3.scale(sum, 1 / shape.points.length),
        ),
      );
      const depth: number = -physicalShapeNearest(ORIGIN, shape, centre, centre)
        .distance;
      if (depth > 0) found = 2 * depth;
    }
    return found;
  }

  /** The world frame, a shape's parent placed at the origin unturned. */
  const ORIGIN: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };

  /** A surface's outward normal and velocity at its point nearest a segment. */
  interface ISurface {
    /** The outward unit normal there, world. */
    normal: IAutoMovieVector3;

    /** The surface point's velocity, world metres per second. */
    velocity: IAutoMovieVector3;
  }

  /**
   * A lower bound on a collider's distance from a flight segment at seconds
   * since the sweep's zero, metres; minus infinity where none is known.
   */
  type Bound = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    seconds: number,
  ) => number;

  /**
   * Read a collider's surface at its point nearest a flight segment, at seconds
   * since the sweep's zero.
   */
  type Surface = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    seconds: number,
  ) => ISurface;

  /** The finger bones, whose colliders a fast flight may pass. */
  const FINGER: RegExp = /(Thumb|Index|Middle|Ring|Little)/;
}
