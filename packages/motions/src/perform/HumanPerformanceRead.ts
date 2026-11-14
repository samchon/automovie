import {
  type IAutoMovieIntent,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import { HumanSegment } from "./HumanSegment";
import type { IHumanProp } from "./IHumanProp";

/**
 * What a performance is read by: a person's pose, posture and bones, a
 * prop's frame and the hands that hold it, the placed actions, a person's
 * root on the floor plan, and the refusals for what is missing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the functions return.
 * @evidence contracts/development/design.md#principled-representation Each is a function of the performance's state and film seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The readers `HumanPerformance` exposes and the ones its placing and contact work share (#3399).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No reader writes the state except the grip cache it owns.
 */
export namespace HumanPerformanceRead {
  /**
   * A person's displayed canonical pose at a film second.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns The pose.
   */
  export function pose(
    self: HumanPerformanceState,
    subject: string,
    seconds: number,
  ): IAutoMoviePose {
    return HumanSegment.displayed(
      HumanPerformanceRead.person(self, subject),
      seconds,
    );
  }

  /**
   * A person's active posture at a film second, before layers: the posture
   * the active action writes, or the standing posture before the first.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns The posture.
   */
  export function posture(
    self: HumanPerformanceState,
    subject: string,
    seconds: number,
  ): IHumanPosture {
    const person: HumanSegment.IPerson = HumanPerformanceRead.person(
      self,
      subject,
    );
    let active: HumanSegment.ISegment | undefined;
    for (const s of person.segments)
      if (s.entryTime <= seconds + 1e-12) active = s;
    return active === undefined
      ? person.initial
      : active.plan.posture(
          Math.min(active.plan.duration, Math.max(0, seconds - active.start)),
        );
  }

  /**
   * A person's world bones at a film second.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns Resolved bones by rig bone.
   */
  export function bones(
    self: HumanPerformanceState,
    subject: string,
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const person: HumanSegment.IPerson = HumanPerformanceRead.person(
      self,
      subject,
    );
    return poseBones(
      person.performer.body,
      HumanPerformanceRead.pose(self, subject, seconds),
    );
  }

  /**
   * A prop's world frame at a film second: its rest frame, or the bone it
   * is worn on, until a hand grips it, then carried by the gripping hand
   * with the offset it had when the grip closed, and left where the last
   * grip released it. A worn span is a grip by a bone: from the film's start
   * for a prop declared worn, from the instant an action puts it on
   * (`IHumanActionPlan.wears`), each to the next grip that takes it off.
   *
   * A grip is any action's contact window of kind `grip` on a hand whose
   * support is this prop. The hand's grip socket rides the hand bone, so the
   * prop is a child of the hand while held: the rigid coupling of the
   * engine's `IAutoMovieAttachment`, a bone plus an offset, with the offset
   * captured at the grip's start instead of authored. When grips overlap (a
   * handover), the one that closed last carries the prop, unless it is the
   * other hand of the performer already carrying it, which only steadies
   * it (a camera held in both hands). A hold an action
   * leaves (`IHumanActionPlan.holds`) is a grip lasting until a later action
   * takes that hand over. Released props stay where the last grip to end
   * released them; falling is the physics layer's.
   *
   * A grip carries the prop only after it closes: at its first second the
   * prop is where it was, which is where the offset the grip keeps puts it
   * then. The offset is read off the hand at that second, whose pose may be
   * an action reading the prop; read there by the closing grip, the frame
   * would wait on itself.
   *
   * A performer reading a prop they carry themselves (`own`) reads it on
   * their own body as the read gives it (an action's, as it entered the
   * action), as a performer reads their own region: their displayed bones
   * at that second are the posture still being solved, and through the
   * hand that carries the prop they read the action reading it (a reload
   * pressing the magazine of the gun the other hand holds).
   *
   * @param subject The prop.
   * @param seconds Film seconds.
   * @param own The performer reading the prop and their own bones, for a prop they may carry.
   * @returns Its frame.
   */
  export function prop(
    self: HumanPerformanceState,
    subject: string,
    seconds: number,
    own?: {
      subject: string;
      bones: () => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    },
  ): IHumanProp.IFrame {
    const prop: IHumanProp | undefined = self.props.get(subject);
    if (prop === undefined)
      throw HumanPerformanceRead.missing("prop", subject, [
        ...self.props.keys(),
      ]);
    if (prop.motion !== undefined) return prop.motion(seconds);
    const grips: HumanPerformanceState.IGrip[] = HumanPerformanceRead.grips(
      self,
      subject,
    );
    // The latest grip still holding carries it; with none holding, the one released last left it.
    let active: HumanPerformanceState.IGrip | undefined;
    let released: HumanPerformanceState.IGrip | undefined;
    for (const g of grips) {
      // A grip carries from after it closes; at its closing the prop is where it was.
      if (g.from >= seconds) continue;
      if (seconds <= g.to) {
        // A performer's other hand on a prop that performer already holds
        // steadies it and does not take it over: a camera's far end held
        // with the right hand on the grip.
        const steadies: boolean =
          active !== undefined &&
          active.bone === undefined &&
          g.bone === undefined &&
          active.subject === g.subject &&
          active.side !== g.side;
        if (!steadies) active = g;
      } else if (released === undefined || g.to >= released.to) released = g;
    }
    const window: HumanPerformanceState.IGrip | undefined = active ?? released;
    if (window === undefined) return prop.frame;
    const at: number = Math.min(seconds, window.to);
    // A window opening on a hand that already holds the prop (a put down
    // after a pick up) keeps that grip's offset: the hand never re-seats what
    // it holds, so no action boundary moves the prop in the hand.
    // A worn span rides its bone; a held one, its hand's grip socket.
    const carrier = (
      w: HumanPerformanceState.IGrip,
      at: number,
    ): IHumanProp.IFrame => {
      if (w.bone === undefined)
        return HumanPerformanceRead.hand(self, w.subject, w.side, at);
      const bone: IAutoMovieResolvedBone = HumanPerformanceRead.bones(
        self,
        w.subject,
        at,
      ).get(w.bone)!;
      return { position: bone.worldPosition, rotation: bone.worldRotation };
    };
    const seat = (w: HumanPerformanceState.IGrip): IHumanProp.IFrame => {
      if (w.offset !== undefined) return w.offset;
      const earlier: HumanPerformanceState.IGrip | undefined =
        w.bone !== undefined
          ? undefined
          : grips.find(
              (g: HumanPerformanceState.IGrip): boolean =>
                g !== w &&
                g.bone === undefined &&
                g.subject === w.subject &&
                g.side === w.side &&
                g.from < w.from &&
                g.to >= w.from - 1e-6,
            );
      if (earlier !== undefined) return (w.offset = seat(earlier));
      const before: IHumanProp.IFrame = HumanPerformanceRead.prop(
        self,
        subject,
        w.from - 1e-6,
      );
      const hand: IHumanProp.IFrame = carrier(w, w.from);
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(hand.rotation);
      return (w.offset = {
        position: Quaternion.rotateVector(
          inverse,
          Vector3.subtract(before.position, hand.position),
        ),
        rotation: Quaternion.multiply(inverse, before.rotation),
      });
    };
    const offset: IHumanProp.IFrame = seat(window);
    // Carried by the performer reading it: their own body as the read gives it.
    const hand: IHumanProp.IFrame =
      own !== undefined &&
      active !== undefined &&
      window.subject === own.subject
        ? held(
            HumanPerformanceRead.person(self, own.subject).performer.body,
            own.bones(),
            window,
          )
        : carrier(window, at);
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
   * A person's placed actions, in order.
   *
   * @param subject The person.
   * @returns The segments.
   */
  export function segments(
    self: HumanPerformanceState,
    subject: string,
  ): readonly HumanSegment.ISegment[] {
    return HumanPerformanceRead.person(self, subject).segments;
  }

  /**
   * The actions a person performs over their placed actions, in placement
   * order: each rides a carrier and takes only its claimed channels.
   *
   * @param subject The person.
   * @returns The overlays.
   */
  export function overlays(
    self: HumanPerformanceState,
    subject: string,
  ): readonly HumanSegment.IOverlay[] {
    return HumanPerformanceRead.person(self, subject).overlays;
  }

  /** Every grip window on a prop across every person, and every span it is worn on a bone, in film order, computed once after construction; none for a fixture, which no grip carries. */
  export function grips(
    self: HumanPerformanceState,
    subject: string,
  ): HumanPerformanceState.IGrip[] {
    const known: HumanPerformanceState.IGrip[] | undefined =
      self.gripCache.get(subject);
    if (known !== undefined) return known;
    const out: HumanPerformanceState.IGrip[] = [];
    const worn: HumanPerformanceState.IGrip[] = [];
    // A fixture bears the hands that grip it and is never carried by them.
    if (self.props.get(subject)?.fixed === true) {
      if (!self.resolving) self.gripCache.set(subject, out);
      return out;
    }
    const declared: IHumanProp.IWorn | undefined =
      self.props.get(subject)?.worn;
    if (declared !== undefined)
      worn.push({
        subject: declared.subject,
        side: "right",
        bone: declared.bone,
        from: -Infinity,
        to: Infinity,
        offset: declared.offset,
      });
    for (const person of self.people.values()) {
      for (const segment of [...person.segments, ...person.overlays])
        for (const w of segment.plan.wears ?? [])
          if (w.prop === subject) {
            const from: number = segment.start + w.from * segment.plan.duration;
            if (from >= segment.entryTime - 1e-9 && from <= segment.end + 1e-9)
              worn.push({
                subject: person.performer.subject,
                side: "right",
                bone: w.bone,
                from,
                to: Infinity,
              });
          }
      for (const held of person.holds)
        if (held.prop === subject)
          out.push({
            subject: person.performer.subject,
            side: held.side,
            from: held.from,
            to: held.until,
          });
      for (const segment of [...person.segments, ...person.overlays])
        for (const c of segment.plan.contacts)
          if (
            c.kind === "grip" &&
            c.support.kind === "prop" &&
            c.support.subject === subject &&
            (c.part === "leftHand" || c.part === "rightHand")
          ) {
            const from: number = Math.max(
              segment.entryTime,
              segment.start + c.from * segment.plan.duration,
            );
            const to: number = Math.min(
              segment.end,
              segment.start + c.to * segment.plan.duration,
            );
            if (to >= from)
              out.push({
                subject: person.performer.subject,
                side: c.part === "leftHand" ? "left" : "right",
                from,
                to,
              });
          }
    }
    // A worn span lasts until the first grip that starts after it.
    for (const w of worn) {
      for (const g of out)
        if (g.from > w.from + 1e-9 && g.from < w.to) w.to = g.from;
      out.push(w);
    }
    out.sort(
      (
        a: HumanPerformanceState.IGrip,
        b: HumanPerformanceState.IGrip,
      ): number => a.from - b.from,
    );
    if (!self.resolving) self.gripCache.set(subject, out);
    return out;
  }

  /** A hand's grip-socket frame: the socket's point with the hand bone's world rotation. */
  export function hand(
    self: HumanPerformanceState,
    subject: string,
    side: "left" | "right",
    seconds: number,
  ): IHumanProp.IFrame {
    return held(
      HumanPerformanceRead.person(self, subject).performer.body,
      HumanPerformanceRead.bones(self, subject, seconds),
      { side },
    );
  }

  /**
   * Where a person's placed actions put their root at a film second, for a
   * law that plans from another person's path.
   *
   * While the schedule is being placed the path is known only up to the
   * person's last placed action. A second beyond it is refused when the
   * composition still holds actions of theirs to place, because the answer
   * would change once they are placed; with none left, the person stays
   * where the last action put them.
   */
  export function root(
    self: HumanPerformanceState,
    subject: string,
    seconds: number,
    axis: string,
  ): IHumanActionContext.IRoot {
    const person: HumanSegment.IPerson = HumanPerformanceRead.person(
      self,
      subject,
    );
    const last: HumanSegment.ISegment | undefined = person.segments.at(-1);
    const left: number =
      (self.intended.get(subject) ?? 0) - person.segments.length;
    if (self.resolving && left > 0 && seconds > (last?.end ?? 0) + 1e-9)
      throw new HumanRefusal({
        kind: "participant",
        axis,
        value: subject,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: Math.floor((last?.end ?? 0) * 1000) / 1000,
          unit: "s",
        },
        reason: `where ${subject} is at ${seconds.toFixed(2)} s is not known yet: ${
          last === undefined
            ? "none of their actions is placed"
            : `their placed actions end at ${last.end.toFixed(2)} s with ${last.name}`
        }, and ${left} more of theirs come later in the composition`,
        fix: `compose ${subject}'s actions before self one: put their chain first in the parallel group, or join both chains with a mutual action`,
      });
    const posture: IHumanPosture = HumanPerformanceRead.posture(
      self,
      subject,
      seconds,
    );
    return { position: posture.root, yaw: posture.yaw };
  }

  /** A person by subject, or an error naming the performers. */
  export function person(
    self: HumanPerformanceState,
    subject: string,
  ): HumanSegment.IPerson {
    const person: HumanSegment.IPerson | undefined = self.people.get(subject);
    if (person === undefined)
      throw HumanPerformanceRead.missing("performer", subject, [
        ...self.people.keys(),
      ]);
    return person;
  }

  /** The place of an intent in the film: its performer, its action and which occurrence of the action's id this is. */
  export function where(
    self: HumanPerformanceState,
    intent: IAutoMovieIntent,
  ): HumanRefusal.IWhere {
    const id: string = intent.anchor ?? intent.capability;
    return {
      performer: intent.subject,
      act: intent.capability,
      instance:
        [
          ...(self.people.get(intent.subject)?.segments ?? []),
          ...(self.people.get(intent.subject)?.overlays ?? []),
        ].filter((s: HumanSegment.ISegment): boolean => s.id === id).length + 1,
    };
  }

  /** The refusal of a performer or prop the performance does not hold, listing the ones it does. */
  export function missing(
    what: "performer" | "prop",
    subject: string,
    known: readonly string[],
    axis: string = what,
  ): HumanRefusal {
    return new HumanRefusal({
      kind: what === "prop" ? "affordance" : "participant",
      axis,
      value: subject,
      feasible: { kind: "alternatives", values: known },
      reason: `the performance has no ${what} named ${subject}`,
      fix: `name one of the performance's ${what}s, or add ${subject} to them`,
    });
  }
}

/**
 * Where a grip holds a prop on given bones: the hand's grip socket with the
 * hand bone's world rotation, or the bone a worn span rides.
 *
 * @param body The body the bones are of.
 * @param bones The bones.
 * @param grip The holding hand, and the bone of a worn span.
 * @returns The frame.
 */
function held(
  body: IHumanBody,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  grip: Pick<HumanPerformanceState.IGrip, "side" | "bone">,
): IHumanProp.IFrame {
  if (grip.bone !== undefined) {
    const bone: IAutoMovieResolvedBone = bones.get(grip.bone)!;
    return { position: bone.worldPosition, rotation: bone.worldRotation };
  }
  const frame =
    body.surfaces.sockets[grip.side === "left" ? "gripLeft" : "gripRight"];
  const bone: IAutoMovieResolvedBone = bones.get(frame.bone)!;
  return {
    position: resolveAutoMovieHumanoidSurfaces.place(frame, bone).point,
    rotation: bone.worldRotation,
  };
}
