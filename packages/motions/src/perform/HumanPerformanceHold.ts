import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformanceHold,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPropFlight } from "./HumanPropFlight";
import { HumanPropHold } from "./HumanPropHold";

/**
 * A prop's world frame as the grips that hold it carry it: the reader
 * `HumanPerformanceRead.prop` documents and delegates to, split from it so
 * the hold's reading, with a grip's in-hand motion, has a file of its own.
 *
 * A grip window that declares an in-hand motion (`HumanContactWindow.inHand`)
 * moves the prop within the hand: at a share s of the window, the prop's
 * frame in the hand is the motion's displacement d(s) composed before the
 * offset stored at closure, its position R_d p + t_d and its rotation
 * R_d R, so d(0), the identity, leaves the stored offset unchanged and the
 * prop never jumps when the grip closes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is split out and how the in-hand motion composes on the stored offset.
 * @evidence contracts/development/design.md#principled-representation A function of the performance's state, a prop and film seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hold's reading only; `HumanPerformanceRead` keeps every other reader.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parent-constraint offset is still stored once at closure; the in-hand motion composes on it rather than re-deriving it.
 */
export namespace HumanPerformanceHold {
  /** Active samples on one socket path. Each subject is indexed by film second. */
  type AutoMovieMountPath = Map<string, Set<number>>;

  /**
   * A prop's world frame at a film second (`HumanPerformanceRead.prop`).
   *
   * @param self The performance's state.
   * @param subject The prop.
   * @param seconds Film seconds.
   * @param own The performer reading the prop and their own bones, for a prop they may carry.
   * @returns Its frame.
   * @throws {HumanRefusal} If the selected socket chain revisits a prop at the same film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Points to the reader's documentation and states the in-hand composition.
   * @evidence contracts/development/implementation.md#principled-implementation The parent constraint's offset stored at closure (inverse(hand) times prop), the latest grip carrying, two hands closing together holding and releasing one rigid body, and a grip's in-hand displacement composed before the offset. A world-frame read preserves the previous carrier at hand or socket closure. A supplied performer pose can read the authored socket chain at closure while fitting its attached prop.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Choose the carrying grip, seat its offset once, compose any in-hand motion, place by the hand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The stored offset is never re-derived while held; an in-hand motion is the window's own pure function.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans each visited prop's grips and reads the final shared grip once more when resting after a hand release. Map and set work per socket hop is constant. The offset is memoized on the grip record.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Seated offsets are kept on the grip records the grip cache holds.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The socket path keeps one entry per active sample and releases entries as each hop returns. Only offsets on grip records persist with the performance.
   */
  export function prop(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    own?: IAutoMovieMotionHumanPerformanceHold.IPropOwn,
  ): IAutoMovieRigidTransform {
    return read(self, subject, seconds, own);
  }

  /**
   * The active mounted carrier, provided no newer flight has taken custody.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reports a mount carrying the prop on the film clock, with the same closure and precedence as a displayed frame.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the existing grip and mount spans and rules out a later flight before returning the socket identity.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shares carrier selection with frame reads and leaves flight precedence to HumanPropFlight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither an inactive mount declaration nor spatial coincidence takes custody.
   * @evidence contracts/development/implementation.md#efficient-algorithms One grip scan and, only for an active mount, a flight selection bounded by the requested time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the same grip records and flight selection used to display the prop.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a borrowed socket identity without retaining any query.
   */
  export function mount(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
  ): Pick<IAutoMovieMotionHumanProp.IMounted, "prop" | "point"> | undefined {
    if (self.props.get(subject)?.motion !== undefined) return undefined;
    const { active, since }: ICustody = custody(
      HumanPerformanceRead.grips(self, subject),
      seconds,
      false,
    );
    return active?.mount !== undefined &&
      HumanPropFlight.active(self, subject, seconds, since) === undefined
      ? active.mount
      : undefined;
  }

  /** The carriers picked by the frame's usual grip and flight precedence. */
  interface ICustody {
    /** The latest carrier that still holds the prop. */
    active: IAutoMovieMotionHumanPerformanceState.IGrip | undefined;
    /** The other hand when it steadies the active carrier's grip. */
    steady: IAutoMovieMotionHumanPerformanceState.IGrip | undefined;
    /** The last carrier to let go, whose final frame supplies unlaunched rest. */
    released: IAutoMovieMotionHumanPerformanceState.IGrip | undefined;
    /** Film second of the last closure before the query, which overrides older flights. */
    since: number;
  }

  /** Select displayed grip, second hand, rest and the flight cutoff once from the sorted spans. */
  function custody(
    grips: readonly IAutoMovieMotionHumanPerformanceState.IGrip[],
    seconds: number,
    takeSocket: boolean,
  ): ICustody {
    // The latest grip still holding carries it; with none holding, the one released last left it.
    let active: IAutoMovieMotionHumanPerformanceState.IGrip | undefined;
    let steady: IAutoMovieMotionHumanPerformanceState.IGrip | undefined;
    let released: IAutoMovieMotionHumanPerformanceState.IGrip | undefined;
    let since: number = -Infinity;
    for (const g of grips) {
      // At closure the world frame comes from the previous carrier. A supplied
      // pose used for aiming can take the authored socket chain at that instant.
      const from: number = g.from;
      if (
        from > seconds ||
        (from === seconds &&
          g.bone === undefined &&
          (g.mount === undefined || !takeSocket))
      )
        continue;
      if (from < seconds) since = Math.max(since, from);
      if (seconds <= g.to) {
        // A performer's other hand on a prop that performer already holds
        // steadies it and does not take it over: a camera's far end held
        // with the right hand on the grip.
        const steadies: boolean =
          active !== undefined &&
          active.bone === undefined &&
          active.mount === undefined &&
          g.bone === undefined &&
          g.mount === undefined &&
          active.subject === g.subject &&
          active.side !== g.side;
        if (!steadies) {
          active = g;
          steady = undefined;
        } else steady = g;
      } else if (released === undefined || g.to >= released.to) released = g;
    }
    return { active, steady, released, since };
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
    const { active, steady, released, since }: ICustody = custody(
      grips,
      seconds,
      own !== undefined,
    );

    // A launch after the latest grip's start sets the prop flying, and it
    // flies until a later grip takes it (#3479: a grip, then a worn bone,
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
      if (w.bone === undefined)
        return HumanPerformanceRead.hand(self, w.subject, w.side, at);
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
      if (w.offset !== undefined) return w.offset;
      const earlier: IAutoMovieMotionHumanPerformanceState.IGrip | undefined =
        w.bone !== undefined || w.mount !== undefined || w.capture !== undefined
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
      if (earlier !== undefined) return (w.offset = moved(earlier, earlier.to));

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
      const ending: ICustody = custody(grips, at, false);
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
   * A prop's socket in the world at a film second: the prop's own frame and
   * the socket as the prop's articulations pose it then (a bow's nocking
   * point drawn back with its string). The performer's supplied bones stay
   * the source of every worn or held ancestor's frame, as for a direct hold.
   */
  function socket(
    self: IAutoMovieMotionHumanPerformanceState,
    mount: { prop: string; point: string },
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
