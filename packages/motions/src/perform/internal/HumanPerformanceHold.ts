import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformanceHold,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSharedCarry,
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
    const custody: HumanPerformanceCustody.ICustody = HumanPerformanceCustody(
      HumanPerformanceRead.grips(self, subject),
      seconds,
      false,
    );
    const { active, since } = custody;
    return active?.mount !== undefined &&
      guided(self, subject, seconds, custody) === undefined &&
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
    const custody: HumanPerformanceCustody.ICustody = HumanPerformanceCustody(
      HumanPerformanceRead.grips(self, subject),
      seconds,
      false,
    );
    const { active, since } = custody;
    const episode: Episode | undefined = guided(
      self,
      subject,
      seconds,
      custody,
    );
    if (episode !== undefined) {
      let primary: IAutoMovieMotionHumanSharedCarry.IPreparedRole | undefined;
      for (const role of episode.roles)
        if (
          role.from < seconds &&
          seconds <= role.to &&
          (primary === undefined || primary.from <= role.from)
        )
          primary = role;
      return primary === undefined ||
        HumanPropFlight.active(self, subject, seconds, since) !== undefined
        ? undefined
        : { subject: primary.subject, side: primary.hand };
    }
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
    const custody: HumanPerformanceCustody.ICustody = HumanPerformanceCustody(
      grips,
      seconds,
      own !== undefined,
    );
    const { active, steady, released, since } = custody;

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
    const episode: Episode | undefined = guided(
      self,
      subject,
      seconds,
      custody,
    );
    if (episode !== undefined) return episode.frame(seconds);
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

  /* Index independent paths before the placed actions read them. */
  export function indexSharedCarry(
    input: IAutoMovieMotionHumanPerformance.IInput,
    props: ReadonlyMap<string, IAutoMovieMotionHumanProp>,
  ): IAutoMovieMotionHumanPerformanceState["sharedCarry"] {
    if ((input.sharedCarry?.length ?? 0) === 0) return undefined;
    const cast: Set<string> = new Set(
      input.performers.map(({ subject }) => subject),
    );
    const indexed: Map<string, Episode[]> = new Map();
    for (const episode of input.sharedCarry!) {
      const prop: IAutoMovieMotionHumanProp | undefined = props.get(
        episode.prop,
      );
      if (
        prop === undefined ||
        prop.fixed ||
        prop.motion !== undefined ||
        prop.soft !== undefined
      )
        HumanPerformanceHoldKit.sharedRefusal(
          episode,
          "name a movable rigid prop with no independent motion callback",
        );
      const [first, second] = episode.roles;
      if (
        episode.roles.length !== 2 ||
        first.subject === second.subject ||
        first.handle === second.handle ||
        first.anchor === second.anchor ||
        episode.roles.some(
          (role) =>
            !cast.has(role.subject) ||
            !prop.affordances?.some(
              (site) => site.id === role.handle && site.kind === "handle",
            ),
        )
      )
        HumanPerformanceHoldKit.sharedRefusal(
          episode,
          "name two performers, different handles and separate played anchors",
        );
      if (
        ![episode.from, episode.settled, episode.to].every(Number.isFinite) ||
        episode.from < 0 ||
        episode.from !== Math.min(first.from, second.from) ||
        episode.to !== Math.max(first.to, second.to) ||
        episode.roles.some(
          (role) =>
            ![role.from, role.to].every(Number.isFinite) ||
            role.from > episode.settled ||
            role.to < episode.settled,
        ) ||
        Math.max(first.from, second.from) >= Math.min(first.to, second.to)
      )
        HumanPerformanceHoldKit.sharedRefusal(
          episode,
          "give overlapping grip intervals through settling, with exact first and last seconds",
        );
      const rest: IAutoMovieRigidTransform = copySharedFrame(
        episode,
        episode.settled,
      );
      const settled: number = episode.settled;
      const prepared: Episode = {
        ...episode,
        roles: [{ ...first }, { ...second }],
        frame: (seconds): IAutoMovieRigidTransform =>
          seconds >= settled
            ? { position: { ...rest.position }, rotation: { ...rest.rotation } }
            : copySharedFrame(episode, seconds),
      };
      const episodes: Episode[] = indexed.get(episode.prop) ?? [];
      episodes.push(prepared);
      indexed.set(episode.prop, episodes);
    }
    for (const episodes of indexed.values()) {
      episodes.sort((a, b) => a.from - b.from);
      for (let i: number = 1; i < episodes.length; ++i)
        if (episodes[i - 1]!.to >= episodes[i]!.from)
          HumanPerformanceHoldKit.sharedRefusal(
            episodes[i]!,
            "place nonoverlapping episodes on separate intervals",
          );
    }
    return indexed;
  }
}

/* The first closure itself still reads the preceding carrier. After release,
 * a later ordinary custody operation supersedes the settled shared path. */
function guided(
  self: IAutoMovieMotionHumanPerformanceState,
  subject: string,
  seconds: number,
  custody: HumanPerformanceCustody.ICustody,
): Episode | undefined {
  const episodes: readonly Episode[] | undefined =
    self.sharedCarry?.get(subject);
  if (episodes === undefined) return undefined;
  for (let i: number = episodes.length - 1; i >= 0; --i) {
    const episode: Episode = episodes[i]!;
    if (!(episode.from < seconds)) continue;
    return seconds <= episode.to ||
      (custody.since < episode.to &&
        (custody.active === undefined || custody.active.from < episode.to))
      ? episode
      : undefined;
  }
  return undefined;
}

/* A fresh reader result cannot change the stored settled frame. */
function copySharedFrame(
  episode: Episode,
  seconds: number,
): IAutoMovieRigidTransform {
  const { position, rotation } = episode.frame(seconds);
  if (
    ![
      position.x,
      position.y,
      position.z,
      rotation.x,
      rotation.y,
      rotation.z,
      rotation.w,
    ].every(Number.isFinite) ||
    Math.abs(Math.hypot(rotation.x, rotation.y, rotation.z, rotation.w) - 1) >
      1e-8
  )
    HumanPerformanceHoldKit.sharedRefusal(
      episode,
      "supply finite world coordinates and a unit rotation",
    );
  return { position: { ...position }, rotation: { ...rotation } };
}

type Episode = IAutoMovieMotionHumanSharedCarry.IPreparedEpisode;

/*
 * The alternatives of `MountResult`'s site.
 */
type MountResult = "prop" | "point";
