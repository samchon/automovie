import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import { HumanPropFlight } from "./HumanPropFlight";
import { HumanPropHold } from "./HumanPropHold";
import type { IHumanProp } from "./IHumanProp";

/**
 * A prop's world frame as the grips that hold it carry it: the reader
 * `HumanPerformanceRead.prop` documents and delegates to, split from it so
 * the hold's reading, with a grip's in-hand motion, has a file of its own.
 *
 * A grip window that declares an in-hand motion (`IHumanContactWindow.inHand`)
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
  /**
   * A prop's world frame at a film second (`HumanPerformanceRead.prop`).
   *
   * @param self The performance's state.
   * @param subject The prop.
   * @param seconds Film seconds.
   * @param own The performer reading the prop and their own bones, for a prop they may carry.
   * @returns Its frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Points to the reader's documentation and states the in-hand composition.
   * @evidence contracts/development/implementation.md#principled-implementation The parent constraint's offset stored at closure (inverse(hand) times prop), the latest grip carrying, two hands closing together holding one rigid body, and a grip's in-hand displacement composed before the offset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Choose the carrying grip, seat its offset once, compose any in-hand motion, place by the hand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The stored offset is never re-derived while held; an in-hand motion is the window's own pure function.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the prop's grips per read; the offset is memoized on the grip record.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Seated offsets are kept on the grip records the grip cache holds.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only the offsets on the grip records, released with the performance.
   */
  export function prop(
    self: HumanPerformanceState,
    subject: string,
    seconds: number,
    own?: {
      subject: string;
      bones: (
        requested?: ReadonlySet<AutoMovieHumanoidBone>,
      ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
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
    let steady: HumanPerformanceState.IGrip | undefined;
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

    // A launch after the latest grip's start sets the prop flying, and it
    // flies until a later grip takes it (#3479: a grip, then a worn bone,
    // then a flight or its rest).
    const since: number = grips.reduce(
      (latest: number, g: HumanPerformanceState.IGrip): number =>
        g.from < seconds ? Math.max(latest, g.from) : latest,
      -Infinity,
    );
    const flown: IHumanProp.IFrame | undefined = HumanPropFlight.frame(
      self,
      subject,
      seconds,
      since,
    );
    if (flown !== undefined) return flown;
    const window: HumanPerformanceState.IGrip | undefined = active ?? released;
    if (window === undefined) return prop.frame;
    const at: number = Math.min(seconds, window.to);
    // A window opening on a hand that already holds the prop (a put down
    // after a pick up) keeps that grip's offset: the hand never re-seats what
    // it holds, so no action boundary moves the prop in the hand.
    // A worn span rides its bone; a mounted one, the other prop's socket; a
    // held one, its hand's grip socket.
    const carrier = (
      w: HumanPerformanceState.IGrip,
      at: number,
      supplied?: typeof own,
    ): IHumanProp.IFrame => {
      if (w.mount !== undefined) return socket(self, w.mount, at, supplied);
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
    const seat = (w: HumanPerformanceState.IGrip): IHumanProp.IFrame => {
      if (w.offset !== undefined) return w.offset;
      const earlier: HumanPerformanceState.IGrip | undefined =
        w.bone !== undefined || w.mount !== undefined
          ? undefined
          : grips.find(
              (g: HumanPerformanceState.IGrip): boolean =>
                g !== w &&
                g.bone === undefined &&
                g.mount === undefined &&
                g.subject === w.subject &&
                g.side === w.side &&
                g.from < w.from &&
                g.to >= w.from - 1e-6,
            );
      if (earlier !== undefined) return (w.offset = moved(earlier, earlier.to));
      const before: IHumanProp.IFrame = HumanPerformanceHold.prop(
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
    // The offset at a second, with the grip's in-hand motion composed
    // before the stored one: R_d p + t_d and R_d R.
    const moved = (
      w: HumanPerformanceState.IGrip,
      at: number,
    ): IHumanProp.IFrame => {
      const stored: IHumanProp.IFrame = seat(w);
      if (w.inHand === undefined) return stored;
      const span: number = w.to - w.from;
      const d: IHumanProp.IFrame = w.inHand(
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
    const hold = (w: HumanPerformanceState.IGrip): HumanPropHold.IHand => {
      const offset: IHumanProp.IFrame = moved(w, at);
      if (own === undefined || active === undefined || w.mount !== undefined ||
          w.subject !== own.subject)
        return { offset, hand: carrier(w, at, own) };
      const body: IHumanBody = HumanPerformanceRead.person(self, own.subject).performer.body;
      const bone: AutoMovieHumanoidBone = w.bone ?? body.surfaces.sockets[
        w.side === "left" ? "gripLeft" : "gripRight"
      ].bone;
      return { offset, hand: HumanPropHold.frame(body, own.bones(new Set([bone])), w) };
    };
    // Taken in both of the performer's hands at once, it is one rigid thing
    // between the two fists; a hand closing on it later only steadies it.
    if (
      steady !== undefined &&
      window === active &&
      Math.abs(steady.from - active.from) <= 1e-6
    )
      return HumanPropHold.fit(hold(window), hold(steady));
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
    self: HumanPerformanceState,
    mount: { prop: string; point: string },
    seconds: number,
    own?: {
      subject: string;
      bones: (
        requested?: ReadonlySet<AutoMovieHumanoidBone>,
      ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    },
  ): IHumanProp.IFrame {
    const onto: IHumanProp | undefined = self.props.get(mount.prop);
    if (onto === undefined)
      throw HumanPerformanceRead.missing("prop", mount.prop, [
        ...self.props.keys(),
      ]);
    const frame: IHumanProp.IFrame = HumanPerformanceHold.prop(
      self,
      mount.prop,
      seconds,
      own,
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
