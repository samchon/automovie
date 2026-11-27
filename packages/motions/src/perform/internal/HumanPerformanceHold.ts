import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformanceHold,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanPerformanceCustody } from "./HumanPerformanceCustody";
import { HumanPerformanceHoldKit } from "./HumanPerformanceHoldKit";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPropFlight } from "./HumanPropFlight";
import { HumanPropHold } from "./HumanPropHold";

/*
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
  /*
   * A prop's world frame at a film second (`HumanPerformanceRead.prop`).
   * Parameter self: The performance's state.
   * Parameter subject: The prop.
   * Parameter seconds: Film seconds.
   * Parameter own: The performer reading the prop and their own bones, for a prop
   * they may carry.
   * Returns: Its frame.
   * If the selected socket chain revisits a prop at the
   * same film second.
   */
  export function prop(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    own?: IAutoMovieMotionHumanPerformanceHold.IPropOwn,
  ): IAutoMovieRigidTransform {
    return read(self, subject, seconds, own);
  }

  /*
   * The active mounted carrier, provided no newer flight has taken custody.
   */
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

  /*
   * The hand holding a prop at a film second, by the same custody the frame is
   * read by: the latest grip still holding it, when it is a hand's and no
   * flight has taken the prop since.
   * Parameter self: The performance's state.
   * Parameter subject: The prop.
   * Parameter seconds: Film seconds.
   * Returns: The holding performer and hand, or none.
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

  /*
   * Resolve a frame while keeping the current chain of socket samples, for a
   * mounted carrier read along that chain (`HumanPerformanceHoldKit`).
   * Parameter self: The performance's state.
   * Parameter subject: The prop.
   * Parameter seconds: Film seconds.
   * Parameter own: The performer reading the prop and their own bones, if any.
   * Parameter path: The socket chain's samples read so far.
   * Returns: Its frame.
   */
  export function frame(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    own: IAutoMovieMotionHumanPerformanceHold.IPropOwn | undefined,
    path?: HumanPerformanceHoldKit.IMountPath,
  ): IAutoMovieRigidTransform {
    return read(self, subject, seconds, own, path);
  }

  /*
   * The offset a span holds its prop at from its carrier, kept from the span's
   * start: the performance solves it once for every span, in film order, when
   * it is prepared (`IAutoMovieMotionHumanPerformanceState.IGrip.offset`).
   * Parameter self: The performance's state.
   * Parameter subject: The prop.
   * Parameter grips: The prop's spans in film order.
   * Parameter w: The span.
   * Returns: The prop's frame in the carrier's frame.
   */
  export function seat(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    grips: readonly IAutoMovieMotionHumanPerformanceState.IGrip[],
    w: IAutoMovieMotionHumanPerformanceState.IGrip,
  ): IAutoMovieRigidTransform {
    return HumanPerformanceHoldKit(
      self,
      subject,
      w.from,
      undefined,
      undefined,
      grips,
    ).seat(w);
  }

  /*
   * Resolve a frame while keeping the current chain of socket samples.
   */
  function read(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    own: IAutoMovieMotionHumanPerformanceHold.IPropOwn | undefined,
    path?: HumanPerformanceHoldKit.IMountPath,
  ): IAutoMovieRigidTransform {
    if (path?.get(subject)?.has(seconds))
      throw new AutoMovieMotionHumanRefusal({
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
    const { carrier, moved }: HumanPerformanceHoldKit.IKit =
      HumanPerformanceHoldKit(self, subject, seconds, own, path, grips);
    // Carried by the performer reading it: their own body as the read gives it.
    const hold = (
      w: IAutoMovieMotionHumanPerformanceState.IGrip,
    ): HumanPropHold.IHand => {
      if (
        own === undefined ||
        active === undefined ||
        w.mount !== undefined ||
        w.subject !== own.subject
      ) {
        const hand: IAutoMovieRigidTransform = carrier(w, at, own);
        return { offset: moved(w, at, hand), hand };
      }
      const body: IAutoMovieMotionHumanBody = HumanPerformanceRead.person(
        self,
        own.subject,
      ).performer.body;
      const bone: AutoMovieHumanoidBone =
        w.bone ??
        body.surfaces.sockets[w.side === "left" ? "gripLeft" : "gripRight"]
          .bone;
      const hand: IAutoMovieRigidTransform = HumanPropHold.frame(
        body,
        own.bones(new Set([bone])),
        w,
      );
      return { offset: moved(w, at, hand), hand };
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
      position: AutoMovieEngineVector3.add(
        hand.position,
        AutoMovieEngineQuaternion.rotateVector(hand.rotation, offset.position),
      ),
      rotation: AutoMovieEngineQuaternion.normalize(
        AutoMovieEngineQuaternion.multiply(hand.rotation, offset.rotation),
      ),
    };
  }
}

/*
 * The alternatives of `MountResult`'s site.
 */
type MountResult = "prop" | "point";
