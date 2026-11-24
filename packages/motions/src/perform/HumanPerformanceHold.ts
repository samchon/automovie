import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformanceHold,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPerformanceCustody } from "./HumanPerformanceCustody";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPropFlight } from "./HumanPropFlight";
import { HumanPropHold } from "./HumanPropHold";

/** The record of `ISocketMount`'s site. */
type ISocketMount = { prop: string; point: string };

/** The alternatives of `MountResult`'s site. */
type MountResult = "prop" | "point";

/**
 * A prop's world frame as the grips that hold it carry it: the reader
 * `HumanPerformanceRead.prop` documents and delegates to, split from it so the
 * hold's reading, with a grip's in-hand motion, has a file of its own.
 *
 * A grip window that declares an in-hand motion (`HumanContactWindow.inHand`)
 * moves the prop within the hand: at a share s of the window, the prop's frame
 * in the hand is the motion's displacement d(s) composed before the offset
 * stored at closure, its position R_d p + t_d and its rotation R_d R, so d(0),
 * the identity, leaves the stored offset unchanged and the prop never jumps
 * when the grip closes.
 */
export namespace HumanPerformanceHold {
  /** Active samples on one socket path. Each subject is indexed by film second. */
  type AutoMovieMountPath = Map<string, Set<number>>;

  /**
   * The hands being read in each performance, by performer and second: a
   * re-entrant read is a posture reading the prop its own hand holds. Keyed by
   * the performance that owns the reads, so no read of one performance sees
   * another's.
   */
  const HANDS: WeakMap<
    IAutoMovieMotionHumanPerformanceState,
    AutoMovieMountPath
  > = new WeakMap();

  /**
   * A prop's world frame at a film second (`HumanPerformanceRead.prop`).
   *
   * @param self The performance's state.
   * @param subject The prop.
   * @param seconds Film seconds.
   * @param own The performer reading the prop and their own bones, for a prop
   *   they may carry.
   * @returns Its frame.
   * @throws {HumanRefusal} If the selected socket chain revisits a prop at the
   *   same film second.
   */
  export function prop(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    own?: IAutoMovieMotionHumanPerformanceHold.IPropOwn,
  ): IAutoMovieRigidTransform {
    return read(self, subject, seconds, own);
  }

  /** The active mounted carrier, provided no newer flight has taken custody. */
  export function mount(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
  ): Pick<IAutoMovieMotionHumanProp.IMounted, MountResult> | undefined {
    if (self.props.get(subject)?.motion !== undefined) return undefined;
    const { active, since }: HumanPerformanceCustody.ICustody =
      HumanPerformanceCustody(
        HumanPerformanceRead.grips(self, subject),
        seconds,
        false,
      );
    return active?.mount !== undefined &&
      HumanPropFlight.active(self, subject, seconds, since) === undefined
      ? active.mount
      : undefined;
  }

  /**
   * The hand holding a prop at a film second, by the same custody the frame is
   * read by: the latest grip still holding it, when it is a hand's and no
   * flight has taken the prop since.
   *
   * @param self The performance's state.
   * @param subject The prop.
   * @param seconds Film seconds.
   * @returns The holding performer and hand, or none.
   */
  export function holder(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
  ): IAutoMovieMotionHumanPropReader.IHolder | undefined {
    if (self.props.get(subject)?.motion !== undefined) return undefined;
    const { active, since }: HumanPerformanceCustody.ICustody =
      HumanPerformanceCustody(
        HumanPerformanceRead.grips(self, subject),
        seconds,
        false,
      );
    return active === undefined ||
      active.bone !== undefined ||
      active.mount !== undefined ||
      HumanPropFlight.active(self, subject, seconds, since) !== undefined
      ? undefined
      : { subject: active.subject, side: active.side };
  }

  /** Resolve a frame while keeping the current chain of socket samples. */
  function read(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    own: IAutoMovieMotionHumanPerformanceHold.IPropOwn | undefined,
    path?: AutoMovieMountPath,
  ): IAutoMovieRigidTransform {
    if (path?.get(subject)?.has(seconds))
      throw new HumanRefusal({
        kind: "parameter",
        axis: `props.${subject}.mounted`,
        value: subject,
        reason: `the socket chain returns to ${subject} at ${seconds} s`,
        fix: "detach one prop from the chain before mounting its carrier",
      });

    const prop: IAutoMovieMotionHumanProp | undefined = self.props.get(subject);
    if (prop === undefined)
      throw HumanPerformanceRead.missing("prop", subject, [
        ...self.props.keys(),
      ]);
    if (prop.motion !== undefined) return prop.motion(seconds);
    const grips: IAutoMovieMotionHumanPerformanceState.IGrip[] =
      HumanPerformanceRead.grips(self, subject);
    const {
      active,
      steady,
      released,
      since,
    }: HumanPerformanceCustody.ICustody = HumanPerformanceCustody(
      grips,
      seconds,
      own !== undefined,
    );

    // A launch after the latest grip's start sets the prop flying, and it
    // flies until a later grip takes it (a grip, then a worn bone,
    // then a flight or its rest).
    const flown: IAutoMovieRigidTransform | undefined = HumanPropFlight.frame(
      self,
      subject,
      seconds,
      since,
    );
    if (flown !== undefined) return flown;
    const window: IAutoMovieMotionHumanPerformanceState.IGrip | undefined =
      active ?? released;
    if (window === undefined) return prop.frame;
    const at: number = Math.min(seconds, window.to);
    // A window opening on a hand that already holds the prop (a put down
    // after a pick up) keeps that grip's offset: the hand never re-seats what
    // it holds, so no action boundary moves the prop in the hand.
    // A worn span rides its bone; a mounted one, the other prop's socket; a
    // held one, its hand's grip socket.
    const carrier = (
      w: IAutoMovieMotionHumanPerformanceState.IGrip,
      at: number,
      supplied?: typeof own,
    ): IAutoMovieRigidTransform => {
      if (w.mount !== undefined) {
        const visited: AutoMovieMountPath = path ?? new Map();
        const times: Set<number> = visited.get(subject) ?? new Set();
        visited.set(subject, times);
        times.add(seconds);

        try {
          return socket(self, w.mount, at, supplied, visited);
        } finally {
          times.delete(seconds);
          if (times.size === 0) visited.delete(subject);
        }
      }
      if (w.bone === undefined) {
        // A posture that reads a prop its own performer holds would read the
        // very hand it is still placing: the read re-enters at the same
        // second. It reads the hand where the grip took the prop instead, an
        // earlier instant, never the fit in progress.
        let hands: AutoMovieMountPath | undefined = HANDS.get(self);
        if (hands === undefined) HANDS.set(self, (hands = new Map()));
        const reading: Set<number> = hands.get(w.subject) ?? new Set();
        if (reading.has(at)) {
          if (w.from < at && !reading.has(w.from)) return carrier(w, w.from);
          throw new HumanRefusal({
            kind: "parameter",
            axis: `props.${subject}.held`,
            value: subject,
            reason: `placing ${w.subject}'s ${w.side} hand at ${at} s reads ${subject}, which that hand holds`,
            fix: "build the goal from the law's own carrying hand, not from the held prop's displayed frame",
          });
        }
        hands.set(w.subject, reading);
        reading.add(at);
        try {
          return HumanPerformanceRead.hand(self, w.subject, w.side, at);
        } finally {
          reading.delete(at);
          if (reading.size === 0) hands.delete(w.subject);
        }
      }
      const bone: IAutoMovieResolvedBone = HumanPerformanceRead.bones(
        self,
        w.subject,
        at,
        new Set([w.bone]),
      ).get(w.bone)!;
      return { position: bone.worldPosition, rotation: bone.worldRotation };
    };
    const seat = (
      w: IAutoMovieMotionHumanPerformanceState.IGrip,
    ): IAutoMovieRigidTransform => {
      // A prop set exactly on its socket keeps the offset its action set it
      // at (`IAutoMovieMotionPropMount.offset`), as a parented node does.
      if (w.offset !== undefined) return w.offset;
      // A hand that takes the prop over from another carrier (a socket it
      // rode, a bone it was worn on: a blade the scabbard's slide guided out)
      // holds it where it actually closed on it, read from the displayed
      // frames at closure, never by an earlier grasp's offset, so the prop
      // does not step at the handover.
      const handed: IAutoMovieMotionHumanPerformanceState.IGrip | undefined =
        HumanPerformanceCustody(grips, w.from - 1e-6, false).active;
      const taken: boolean =
        handed !== undefined &&
        handed !== w &&
        (handed.mount !== undefined || handed.bone !== undefined);
      const earlier: IAutoMovieMotionHumanPerformanceState.IGrip | undefined =
        w.bone !== undefined ||
        w.mount !== undefined ||
        w.capture !== undefined ||
        taken
          ? undefined
          : grips.find(
              (g: IAutoMovieMotionHumanPerformanceState.IGrip): boolean =>
                g !== w &&
                g.bone === undefined &&
                g.mount === undefined &&
                g.subject === w.subject &&
                g.side === w.side &&
                g.from < w.from &&
                g.to >= w.from - 1e-6,
            );
      if (earlier !== undefined)
        return (w.offset = inHand(earlier, earlier.to));

      // At closure the previous carrier supplies the frame on a separate path.
      const before: IAutoMovieRigidTransform = HumanPerformanceHold.prop(
        self,
        subject,
        w.capture === undefined ? w.from - 1e-6 : w.from,
      );
      const hand: IAutoMovieRigidTransform = carrier(w, w.from);
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(hand.rotation);
      return (w.offset = {
        position: Quaternion.rotateVector(
          inverse,
          Vector3.subtract(before.position, hand.position),
        ),
        rotation: Quaternion.multiply(inverse, before.rotation),
      });
    };
    // The offset at a second, with the grip's in-hand motion composed
    // before the stored one: R_d p + t_d and R_d R.
    const moved = (
      w: IAutoMovieMotionHumanPerformanceState.IGrip,
      at: number,
    ): IAutoMovieRigidTransform => {
      const kept: IAutoMovieRigidTransform = inHand(w, at);
      // A hand that sets the prop exactly on a socket at its grip's end
      // brings it there over the grip, on a minimum-jerk share: its offset
      // moves from the one it holds to the one that puts the prop on the
      // socket as the grip ends, so the place shows no step however far the
      // hand's fit lies from its site.
      const next: IAutoMovieMotionHumanPerformanceState.IGrip | undefined =
        w.bone === undefined && w.mount === undefined
          ? grips.find(
              (g: IAutoMovieMotionHumanPerformanceState.IGrip): boolean =>
                g.mount?.seated === true && Math.abs(g.from - w.to) <= 1e-6,
            )
          : undefined;
      if (next === undefined || !(w.to > w.from)) return kept;
      const hand: IAutoMovieRigidTransform = carrier(w, w.to);
      const receiving: IAutoMovieRigidTransform = carrier(next, next.from);
      const set: IAutoMovieRigidTransform = seat(next);
      const socketed: IAutoMovieRigidTransform = {
        position: Vector3.add(
          receiving.position,
          Quaternion.rotateVector(receiving.rotation, set.position),
        ),
        rotation: Quaternion.multiply(receiving.rotation, set.rotation),
      };
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(hand.rotation);
      const k: number = minimumJerk.share(
        Math.min(1, Math.max(0, (at - w.from) / (w.to - w.from))),
      );
      return {
        position: Vector3.lerp(
          kept.position,
          Quaternion.rotateVector(
            inverse,
            Vector3.subtract(socketed.position, hand.position),
          ),
          k,
        ),
        rotation: Quaternion.slerp(
          kept.rotation,
          Quaternion.multiply(inverse, socketed.rotation),
          k,
        ),
      };
    };
    // The grip's offset at a second with its in-hand motion composed.
    const inHand = (
      w: IAutoMovieMotionHumanPerformanceState.IGrip,
      at: number,
    ): IAutoMovieRigidTransform => {
      const stored: IAutoMovieRigidTransform = seat(w);
      if (w.inHand === undefined) return stored;
      const span: number = w.to - w.from;
      const d: IAutoMovieRigidTransform = w.inHand(
        span > 0 ? Math.min(1, Math.max(0, (at - w.from) / span)) : 1,
      );
      return {
        position: Vector3.add(
          d.position,
          Quaternion.rotateVector(d.rotation, stored.position),
        ),
        rotation: Quaternion.normalize(
          Quaternion.multiply(d.rotation, stored.rotation),
        ),
      };
    };
    // Carried by the performer reading it: their own body as the read gives it.
    const hold = (
      w: IAutoMovieMotionHumanPerformanceState.IGrip,
    ): HumanPropHold.IHand => {
      const offset: IAutoMovieRigidTransform = moved(w, at);
      if (
        own === undefined ||
        active === undefined ||
        w.mount !== undefined ||
        w.subject !== own.subject
      )
        return { offset, hand: carrier(w, at, own) };
      const body: IAutoMovieMotionHumanBody = HumanPerformanceRead.person(
        self,
        own.subject,
      ).performer.body;
      const bone: AutoMovieHumanoidBone =
        w.bone ??
        body.surfaces.sockets[w.side === "left" ? "gripLeft" : "gripRight"]
          .bone;
      return {
        offset,
        hand: HumanPropHold.frame(body, own.bones(new Set([bone])), w),
      };
    };
    // Taken in both of the performer's hands at once, it is one rigid thing
    // between the two fists; a hand closing on it later only steadies it.
    if (
      steady !== undefined &&
      window === active &&
      Math.abs(steady.from - active.from) <= 1e-6
    )
      return HumanPropHold.fit(hold(window), hold(steady));

    // Freeze the same fitted pose when a simultaneous two-hand grip ends,
    // rather than changing to one hand's implied pose at the release.
    if (
      active === undefined &&
      window.bone === undefined &&
      window.mount === undefined
    ) {
      const ending: HumanPerformanceCustody.ICustody = HumanPerformanceCustody(
        grips,
        at,
        false,
      );
      if (
        ending.active?.to === at &&
        ending.steady?.to === at &&
        Math.abs(ending.active.from - ending.steady.from) <= 1e-6
      )
        return HumanPropHold.fit(hold(ending.active), hold(ending.steady));
    }
    const { offset, hand } = hold(window);
    return {
      position: Vector3.add(
        hand.position,
        Quaternion.rotateVector(hand.rotation, offset.position),
      ),
      rotation: Quaternion.normalize(
        Quaternion.multiply(hand.rotation, offset.rotation),
      ),
    };
  }

  /**
   * A prop's socket in the world at a film second: the prop's own frame and the
   * socket as the prop's articulations pose it then (a bow's nocking point
   * drawn back with its string). The performer's supplied bones stay the source
   * of every worn or held ancestor's frame, as for a direct hold.
   */
  function socket(
    self: IAutoMovieMotionHumanPerformanceState,
    mount: ISocketMount,
    seconds: number,
    own: IAutoMovieMotionHumanPerformanceHold.IPropOwn | undefined,
    path: AutoMovieMountPath,
  ): IAutoMovieRigidTransform {
    const onto: IAutoMovieMotionHumanProp | undefined = self.props.get(
      mount.prop,
    );
    if (onto === undefined)
      throw HumanPerformanceRead.missing("prop", mount.prop, [
        ...self.props.keys(),
      ]);

    // A receiver that publishes its contacts' displayed frames carries the socket where it displays it, as a put-down onto it aimed.
    const placed: IAutoMovieMotionHumanProp.IPlacedPoint | undefined =
      onto.point?.(mount.point, seconds);
    if (placed?.rotation !== undefined)
      return { position: placed.point, rotation: placed.rotation };
    const frame: IAutoMovieRigidTransform = read(
      self,
      mount.prop,
      seconds,
      own,
      path,
    );
    const affordances: readonly IAutoMovieAffordance[] =
      onto.articulate === undefined
        ? (onto.affordances ?? [])
        : HumanPerformanceObject.pose(self, onto, seconds).affordances;
    const at: IAutoMovieAffordance | undefined = affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === mount.point,
    );
    if (at === undefined)
      throw HumanPerformanceRead.missing(
        "prop",
        `${mount.prop}.${mount.point}`,
        affordances.map((a: IAutoMovieAffordance): string => a.id),
        "point",
      );
    return {
      position: Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, at.frame.translation),
      ),
      rotation: Quaternion.normalize(
        Quaternion.multiply(frame.rotation, at.frame.rotation),
      ),
    };
  }
}
