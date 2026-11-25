import {
  Quaternion,
  Vector3,
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
import { HumanColliders } from "../posture/HumanColliders";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPropCatchHands } from "./HumanPropCatchHands";
import { HumanPropSweepColliders } from "./HumanPropSweepColliders";
import { HumanPropSweepHands } from "./HumanPropSweepHands";

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
      handback === undefined
        ? []
        : HumanPropSweepHands.handbackSides(self, handback);
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
    const surfaces: Map<string, HumanPropSweepColliders.Surface> = new Map();
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
        HumanPerformanceRead.projectileRoot(self, subject, seconds + t);
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
      const surface: HumanPropSweepColliders.Surface = (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
        t: number,
      ): HumanPropSweepColliders.ISurface => {
        const near: ReturnType<typeof HumanColliders.nearest> =
          HumanColliders.nearest(body, bones(seconds + t), a, b);
        const only: ReadonlySet<AutoMovieHumanoidBone> = new Set([near.bone]);
        return {
          normal: near.normal,
          velocity: HumanPropSweepColliders.pointVelocity(
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
          HumanPropSweepColliders.separating(
            projectile,
            options,
            contact,
            surface,
          ),
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
      if (HumanPropSweepHands.launched(self, other.subject)) continue;

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
      const fixed: IAutoMovieRigidTransform | undefined =
        HumanPropSweepHands.still(
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
          ? HumanPropSweepHands.carriers(
              self,
              other,
              grips,
              seconds,
              seconds + horizon,
            )
          : [];
      const extent: number = 2 * HumanPropSweepColliders.reach(other.shapes);
      const bound: HumanPropSweepColliders.Bound = (
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
            carried.length === 0
              ? shaped
              : HumanPropSweepColliders.culled(shaped, bound, radius ?? 0);

          // A moving prop's surface carries the point its frame carries.
          const surface: HumanPropSweepColliders.Surface = (
            a: IAutoMovieVector3,
            b: IAutoMovieVector3,
            t: number,
          ): HumanPropSweepColliders.ISurface => {
            const near: IAutoMovieProjectileFirstContact.INearest =
              placed.nearest(a, b, t);
            return {
              normal: near.normal,
              velocity: HumanPropSweepColliders.pointVelocity(
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
                    HumanPropSweepColliders.separating(
                      projectile,
                      options,
                      contact,
                      surface,
                    ),
                };
          colliders.push(
            handedBack
              ? HumanPropSweepHands.until(collider, handback!.from - seconds)
              : collider,
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
        thickness: HumanPropSweepColliders.thinnest(self, launcher, solid),
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
    const reader: HumanPropSweepColliders.Surface | undefined =
      surfaces.get(id);
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
}
