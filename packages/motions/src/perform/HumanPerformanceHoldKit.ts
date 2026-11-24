import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPerformanceHold,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { HumanPerformanceCustody } from "./HumanPerformanceCustody";
import { HumanPerformanceHold } from "./HumanPerformanceHold";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/** The record of `ISocketMount`'s site. */
type ISocketMount = { prop: string; point: string };

/**
 * The readers one prop read shares: the carrier of a span, the offset it seats
 * the prop at and that offset moved within the hand.
 */
export function HumanPerformanceHoldKit(
  self: IAutoMovieMotionHumanPerformanceState,
  subject: string,
  seconds: number,
  own: IAutoMovieMotionHumanPerformanceHold.IPropOwn | undefined,
  path: HumanPerformanceHoldKit.IMountPath | undefined,
  grips: readonly IAutoMovieMotionHumanPerformanceState.IGrip[],
): HumanPerformanceHoldKit.IKit {
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
      const visited: HumanPerformanceHoldKit.IMountPath = path ?? new Map();
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
    // A held one rides the hand as the performance displays it at the second.
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
    if (earlier !== undefined) return inHand(earlier, earlier.to);

    // At closure the previous carrier supplies the frame on a separate path.
    const before: IAutoMovieRigidTransform = HumanPerformanceHold.prop(
      self,
      subject,
      w.capture === undefined ? w.from - 1e-6 : w.from,
    );
    const hand: IAutoMovieRigidTransform = carrier(w, w.from);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(hand.rotation);
    return {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(before.position, hand.position),
      ),
      rotation: Quaternion.multiply(inverse, before.rotation),
    };
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
  return { carrier, seat, moved };
}

/**
 * A prop's socket in the world at a film second: the prop's own frame and the
 * socket as the prop's articulations pose it then (a bow's nocking point drawn
 * back with its string). The performer's supplied bones stay the source of
 * every worn or held ancestor's frame, as for a direct hold.
 */
function socket(
  self: IAutoMovieMotionHumanPerformanceState,
  mount: ISocketMount,
  seconds: number,
  own: IAutoMovieMotionHumanPerformanceHold.IPropOwn | undefined,
  path: HumanPerformanceHoldKit.IMountPath,
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
  const frame: IAutoMovieRigidTransform = HumanPerformanceHold.frame(
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

/** The readers of {@link HumanPerformanceHoldKit}. */
export namespace HumanPerformanceHoldKit {
  /** Active samples on one socket path. Each subject is indexed by film second. */
  export type IMountPath = Map<string, Set<number>>;

  /** A read's carrier, offset and in-hand readers. */
  export interface IKit {
    /**
     * A span's carrier frame at a film second: the hand's grip socket, the bone
     * it is worn on or the other prop's socket it is mounted on.
     */
    carrier(
      w: IAutoMovieMotionHumanPerformanceState.IGrip,
      at: number,
      supplied?: IAutoMovieMotionHumanPerformanceHold.IPropOwn,
    ): IAutoMovieRigidTransform;

    /** The offset a span keeps its prop at from its carrier. */
    seat(
      w: IAutoMovieMotionHumanPerformanceState.IGrip,
    ): IAutoMovieRigidTransform;

    /** The span's offset at a film second, its in-hand motion composed. */
    moved(
      w: IAutoMovieMotionHumanPerformanceState.IGrip,
      at: number,
    ): IAutoMovieRigidTransform;
  }
}
