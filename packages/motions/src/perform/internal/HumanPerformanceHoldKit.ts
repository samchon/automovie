import {
  AutoMovieEngineMotionSampling,
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPerformanceHold,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSharedCarry,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanPerformanceCustody } from "./HumanPerformanceCustody";
import { HumanPerformanceHold } from "./HumanPerformanceHold";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/*
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
    // A held one rides the hand as the performance displays it at the second:
    // its prepared course once the performance is prepared, so no read of the
    // prop evaluates the holder's live posture.
    if (w.bone === undefined)
      return (
        w.hand?.(at) ?? HumanPerformanceRead.hand(self, w.subject, w.side, at)
      );
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
    const episodes = self.sharedCarry?.get(subject);
    const afterSharedCarry: boolean =
      w.bone === undefined &&
      w.mount === undefined &&
      episodes?.some((episode) => episode.to <= w.from) === true;
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
              g.to >= w.from - 1e-6 &&
              !episodes?.some(
                (episode) =>
                  episode.to <= w.from &&
                  episode.from <= g.from &&
                  g.from < episode.to,
              ),
          );
    if (earlier !== undefined) return inHand(earlier, earlier.to);

    // At closure the previous carrier supplies the frame on a separate path.
    const before: IAutoMovieRigidTransform = HumanPerformanceHold.prop(
      self,
      subject,
      w.capture === undefined && !afterSharedCarry ? w.from - 1e-6 : w.from,
    );
    const hand: IAutoMovieRigidTransform = carrier(w, w.from);
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
      hand.rotation,
    );
    return {
      position: AutoMovieEngineQuaternion.rotateVector(
        inverse,
        AutoMovieEngineVector3.subtract(before.position, hand.position),
      ),
      rotation: AutoMovieEngineQuaternion.multiply(inverse, before.rotation),
    };
  };
  // The offset at a second, with the grip's in-hand motion composed
  // before the stored one: R_d p + t_d and R_d R.
  const moved = (
    w: IAutoMovieMotionHumanPerformanceState.IGrip,
    at: number,
    displayed: IAutoMovieRigidTransform,
  ): IAutoMovieRigidTransform => {
    const kept: IAutoMovieRigidTransform = inHand(w, at, displayed);
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
      position: AutoMovieEngineVector3.add(
        receiving.position,
        AutoMovieEngineQuaternion.rotateVector(
          receiving.rotation,
          set.position,
        ),
      ),
      rotation: AutoMovieEngineQuaternion.multiply(
        receiving.rotation,
        set.rotation,
      ),
    };
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
      hand.rotation,
    );
    const k: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      Math.min(1, Math.max(0, (at - w.from) / (w.to - w.from))),
    );
    return {
      position: AutoMovieEngineVector3.lerp(
        kept.position,
        AutoMovieEngineQuaternion.rotateVector(
          inverse,
          AutoMovieEngineVector3.subtract(socketed.position, hand.position),
        ),
        k,
      ),
      rotation: AutoMovieEngineQuaternion.slerp(
        kept.rotation,
        AutoMovieEngineQuaternion.multiply(inverse, socketed.rotation),
        k,
      ),
    };
  };
  // The grip's offset at a second with its in-hand motion composed.
  const inHand = (
    w: IAutoMovieMotionHumanPerformanceState.IGrip,
    at: number,
    displayed?: IAutoMovieRigidTransform,
  ): IAutoMovieRigidTransform => {
    const stored: IAutoMovieRigidTransform = seat(w);
    if (w.inHand === undefined) return stored;
    const span: number = w.to - w.from;
    const d: IAutoMovieRigidTransform = w.inHand(
      span > 0 ? Math.min(1, Math.max(0, (at - w.from) / span)) : 1,
      displayed,
    );
    return {
      position: AutoMovieEngineVector3.add(
        d.position,
        AutoMovieEngineQuaternion.rotateVector(d.rotation, stored.position),
      ),
      rotation: AutoMovieEngineQuaternion.normalize(
        AutoMovieEngineQuaternion.multiply(d.rotation, stored.rotation),
      ),
    };
  };
  return { carrier, seat, moved };
}

/*
 * The readers of HumanPerformanceHoldKit.
 */
export namespace HumanPerformanceHoldKit {
  /* Admit the declared path against the realized segments and their custody. */
  export function admitSharedCarry(
    self: IAutoMovieMotionHumanPerformanceState,
  ): void {
    if (self.sharedCarry === undefined) return;
    const segments: IAutoMovieMotionHumanSegment[] = [
      ...self.people.values(),
    ].flatMap((person) => [...person.segments, ...person.overlays]);
    for (const episodes of self.sharedCarry.values())
      for (const episode of episodes) {
        for (const role of episode.roles) admitRole(self, episode, role);
        const grips: IAutoMovieMotionHumanPerformanceState.IGrip[] =
          HumanPerformanceRead.grips(self, episode.prop);
        if (
          grips.some(
            (grip) =>
              grip.from < episode.to &&
              grip.to > episode.from &&
              (grip.bone !== undefined ||
                grip.mount !== undefined ||
                grip.inHand !== undefined ||
                !episode.roles.some(
                  (role) =>
                    role.subject === grip.subject &&
                    role.hand === grip.side &&
                    role.from <= grip.from + SHARED_CLOCK &&
                    grip.to <= role.to + SHARED_CLOCK,
                )),
          )
        )
          sharedRefusal(
            episode,
            "remove the conflicting carrier from the shared interval",
          );
        if (
          segments.some((segment) =>
            segment.plan.launches?.some((launch) => {
              const seconds: number = segment.start + launch.seconds;
              return (
                launch.prop === episode.prop &&
                segment.entryTime <= seconds &&
                seconds <= segment.end &&
                episode.from <= seconds &&
                seconds < episode.to
              );
            }),
          )
        )
          sharedRefusal(
            episode,
            "place the prop's launch outside the shared interval",
          );
        const previous: IAutoMovieRigidTransform = HumanPerformanceHold.prop(
          self,
          episode.prop,
          episode.from,
        );
        const first: IAutoMovieRigidTransform = episode.frame(episode.from);
        if (
          AutoMovieEngineVector3.distance(previous.position, first.position) >
            1e-6 ||
          AutoMovieEngineQuaternion.angle(previous.rotation, first.rotation) >
            0.001
        )
          sharedRefusal(
            episode,
            "begin the prepared path at the prop's displayed closure frame",
          );
      }
  }

  export function sharedRefusal(episode: Episode, reason: string): never {
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: `sharedCarry.${episode.prop}`,
      value: episode.prop,
      reason,
      fix: "prepare the same rigid episode and place its declared material roles",
    });
  }

  /*
   * Active samples on one socket path. Each subject is indexed by film second.
   */
  export type IMountPath = Map<string, Set<number>>;

  /*
   * A read's carrier, offset and in-hand readers.
   */
  export interface IKit {
    /*
     * A span's carrier frame at a film second: the hand's grip socket, the bone
     * it is worn on or the other prop's socket it is mounted on.
     */
    carrier(
      w: IAutoMovieMotionHumanPerformanceState.IGrip,
      at: number,
      supplied?: IAutoMovieMotionHumanPerformanceHold.IPropOwn,
    ): IAutoMovieRigidTransform;

    /*
     * The offset a span keeps its prop at from its carrier.
     */
    seat(
      w: IAutoMovieMotionHumanPerformanceState.IGrip,
    ): IAutoMovieRigidTransform;

    /*
     * The span's offset at a film second, its in-hand motion composed.
     */
    moved(
      w: IAutoMovieMotionHumanPerformanceState.IGrip,
      at: number,
      displayed: IAutoMovieRigidTransform,
    ): IAutoMovieRigidTransform;
  }
}

/*
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
    position: AutoMovieEngineVector3.add(
      frame.position,
      AutoMovieEngineQuaternion.rotateVector(
        frame.rotation,
        at.frame.translation,
      ),
    ),
    rotation: AutoMovieEngineQuaternion.normalize(
      AutoMovieEngineQuaternion.multiply(frame.rotation, at.frame.rotation),
    ),
  };
}

/*
 * The record of `ISocketMount`'s site.
 */
type ISocketMount = { prop: string; point: string };

/* Use the realized segment and its named material grip, not a nominal event. */
function admitRole(
  self: IAutoMovieMotionHumanPerformanceState,
  episode: Episode,
  role: IAutoMovieMotionHumanSharedCarry.IPreparedRole,
): void {
  const person = HumanPerformanceRead.person(self, role.subject);
  const matches: IAutoMovieMotionHumanSegment[] = [
    ...person.segments,
    ...person.overlays,
  ].filter((segment) => segment.id === role.anchor);
  const segment: IAutoMovieMotionHumanSegment | undefined = matches[0];
  if (
    matches.length !== 1 ||
    segment === undefined ||
    segment.plan.verifyDisplayed === undefined ||
    role.from < segment.entryTime - SHARED_CLOCK ||
    role.to > segment.end + SHARED_CLOCK
  )
    HumanPerformanceHoldKit.sharedRefusal(
      episode,
      "play each named role through its complete grip and displayed verification",
    );
  const contacts = segment.plan.contacts.filter(
    (contact) =>
      contact.kind === "grip" &&
      contact.part === `${role.hand}Hand` &&
      contact.support.kind === "prop" &&
      contact.support.carries !== false &&
      contact.support.subject === episode.prop &&
      contact.support.point === role.handle &&
      sameSharedSecond(
        Math.max(
          segment.entryTime,
          segment.start + contact.from * segment.plan.duration,
        ),
        role.from,
      ) &&
      sameSharedSecond(
        Math.min(
          segment.end,
          segment.start + contact.to * segment.plan.duration,
        ),
        role.to,
      ),
  );
  const cues = [
    ["gripClosed", role.from],
    ["settled", episode.settled],
    ["release", role.to],
  ] as const;
  if (
    contacts.length !== 1 ||
    cues.some(
      ([name, seconds]) =>
        segment.plan.events.filter(
          (event) =>
            event.name === name &&
            sameSharedSecond(
              segment.start + event.share * segment.plan.duration,
              seconds,
            ),
        ).length !== 1,
    )
  )
    HumanPerformanceHoldKit.sharedRefusal(
      episode,
      "match the played hand, handle and closure, settle and release seconds",
    );
}

/* Placed event shares and grip shares use the same film clock tolerance. */
function sameSharedSecond(a: number, b: number): boolean {
  return Math.abs(a - b) <= SHARED_CLOCK;
}

type Episode = IAutoMovieMotionHumanSharedCarry.IPreparedEpisode;
const SHARED_CLOCK: number = 1e-9;
