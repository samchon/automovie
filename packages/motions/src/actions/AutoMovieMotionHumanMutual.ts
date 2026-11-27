import type {
  IAutoMovieMotionHumanCatchObject,
  IAutoMovieMotionHumanHandoverAction,
  IAutoMovieMotionHumanHandshake,
  IAutoMovieMotionHumanHighFive,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanMutual,
  IAutoMovieMotionHumanThrowObjectParams,
} from "@automovie/interface";

/** The vocabulary's mutual actions, for `AutoMovieMotionHumanChain.mutual`. */
export namespace AutoMovieMotionHumanMutual {
  /** Two people shake hands; both perform `handshake`. */
  export const handshake: IAutoMovieMotionHumanMutual<
    Omit<IAutoMovieMotionHumanHandshake.IParams, "partner">,
    Handshake
  > = {
    name: "handshake",
    roles: ["one", "other"],
    act: (
      role: HandshakeRole,
      params: Omit<IAutoMovieMotionHumanHandshake.IParams, "partner">,
      cast: Readonly<Record<CastEntryItem, string>>,
    ): IAutoMovieMotionHumanMutual.IAct => ({
      name: "handshake",
      params: { ...params, partner: cast[role === "one" ? "other" : "one"] },
    }),
  };

  /** Two people slap palms; both perform `highFive`. */
  export const highFive: IAutoMovieMotionHumanMutual<
    Omit<IAutoMovieMotionHumanHighFive.IParams, "partner">,
    HighFive
  > = {
    name: "highFive",
    roles: ["one", "other"],
    act: (
      role: HighFiveRole,
      params: Omit<IAutoMovieMotionHumanHighFive.IParams, "partner">,
      cast: Readonly<Record<CastEntryItem2, string>>,
    ): IAutoMovieMotionHumanMutual.IAct => ({
      name: "highFive",
      params: { ...params, partner: cast[role === "one" ? "other" : "one"] },
    }),
  };

  /**
   * One person hands an object to another: the giver performs `handOver`, the
   * receiver `receive`.
   */
  export const handOver: IAutoMovieMotionHumanMutual<
    Omit<IAutoMovieMotionHumanHandoverAction.IParams, "to">,
    HandOver
  > = {
    name: "handOver",
    roles: ["giver", "receiver"],
    act: (
      role: HandOverRole,
      params: Omit<IAutoMovieMotionHumanHandoverAction.IParams, "to">,
      cast: Readonly<Record<CastEntryItem3, string>>,
    ): IAutoMovieMotionHumanMutual.IAct =>
      role === "giver"
        ? { name: "handOver", params: { ...params, to: cast.receiver } }
        : {
            name: "receive",
            params: {
              prop: params.prop,
              handle: params.handle,
              partner: cast.giver,
              ...(params.mass === undefined ? {} : { mass: params.mass }),
              ...(params.outcome === undefined
                ? {}
                : { outcome: params.outcome }),
              ...(params.receiverHand === undefined
                ? {}
                : { hand: params.receiverHand }),
              ...(params.hand === undefined ? {} : { giverHand: params.hand }),
            },
          },
  };

  /**
   * One person kisses another: the kisser performs `kiss` on the partner's
   * region. A hand kiss presents the named hand and brings both roles to a
   * shared point. For other regions the kissed turns its gaze with `look`.
   */
  export const kiss: IAutoMovieMotionHumanMutual<
    Omit<IAutoMovieMotionHumanKiss.IParams, Kiss>,
    Kiss2
  > = {
    name: "kiss",
    roles: ["kisser", "kissed"],
    act: (
      role: KissRole,
      params: Omit<IAutoMovieMotionHumanKiss.IParams, KissParams>,
      cast: Readonly<Record<CastEntryItem4, string>>,
    ): IAutoMovieMotionHumanMutual.IAct =>
      params.region === "handBackLeft" || params.region === "handBackRight"
        ? {
            name: "kiss",
            params: {
              ...params,
              handRole: role === "kisser" ? "kisser" : "presenter",
              partner: role === "kisser" ? cast.kissed : cast.kisser,
            },
          }
        : role === "kisser"
          ? { name: "kiss", params: { ...params, partner: cast.kissed } }
          : {
              name: "look",
              params: {
                target: {
                  kind: "person",
                  subject: cast.kisser,
                  region: "face",
                },
              },
            },
  };

  /**
   * One person throws a ball to another, who catches it: the thrower performs
   * `throwObject` at the catcher's right palm with the ball it holds, and the
   * catcher `catchObject` of that throw, read through the joined anchor
   * (`${anchor}.thrower`), so the catch plans from the throw's own flight. The
   * join needs an anchor for that reason.
   */
  export const pass: IAutoMovieMotionHumanMutual<
    Omit<IAutoMovieMotionHumanCatchObject.IParams, "partner"> &
      Pick<IAutoMovieMotionHumanThrowObjectParams, Pass>,
    Pass2
  > = {
    name: "pass",
    roles: ["thrower", "catcher"],
    act: (
      role: PassRole,
      params: Omit<IAutoMovieMotionHumanCatchObject.IParams, "partner"> &
        Pick<IAutoMovieMotionHumanThrowObjectParams, PassParams>,
      cast: Readonly<Record<CastEntryItem5, string>>,
      anchor?: string,
    ): IAutoMovieMotionHumanMutual.IAct => {
      if (anchor === undefined)
        throw new Error(
          "a pass joins a catch to its throw by the anchor; give AutoMovieMotionHumanChain.mutual an anchor",
        );
      return role === "thrower"
        ? {
            name: "throwObject",
            params: {
              target: {
                kind: "person",
                subject: cast.catcher,
                region: params.hand === "left" ? "palmLeft" : "palmRight",
              },
              prop: params.ball,
              ...(params.style === undefined ? {} : { style: params.style }),
              ...(params.manner === undefined ? {} : { manner: params.manner }),
            },
          }
        : {
            name: "catchObject",
            params: {
              partner: `${anchor}.thrower`,
              ball: params.ball,
              ...(params.hands === undefined ? {} : { hands: params.hands }),
              ...(params.hand === undefined ? {} : { hand: params.hand }),
              ...(params.glove === undefined ? {} : { glove: params.glove }),
            },
          };
    },
  };
}

/** The alternatives of `CastEntryItem5`'s site. */
type CastEntryItem5 = "thrower" | "catcher";

/** The alternatives of `PassParams`'s site. */
type PassParams = "style" | "manner";

/** The alternatives of `PassRole`'s site. */
type PassRole = "thrower" | "catcher";

/** The alternatives of `Pass2`'s site. */
type Pass2 = "thrower" | "catcher";

/** The alternatives of `Pass`'s site. */
type Pass = "style" | "manner";

/** The alternatives of `CastEntryItem4`'s site. */
type CastEntryItem4 = "kisser" | "kissed";

/** The alternatives of `KissParams`'s site. */
type KissParams = "partner" | "handRole";

/** The alternatives of `KissRole`'s site. */
type KissRole = "kisser" | "kissed";

/** The alternatives of `Kiss2`'s site. */
type Kiss2 = "kisser" | "kissed";

/** The alternatives of `Kiss`'s site. */
type Kiss = "partner" | "handRole";

/** The alternatives of `CastEntryItem3`'s site. */
type CastEntryItem3 = "giver" | "receiver";

/** The alternatives of `HandOverRole`'s site. */
type HandOverRole = "giver" | "receiver";

/** The alternatives of `HandOver`'s site. */
type HandOver = "giver" | "receiver";

/** The alternatives of `CastEntryItem2`'s site. */
type CastEntryItem2 = "one" | "other";

/** The alternatives of `HighFiveRole`'s site. */
type HighFiveRole = "one" | "other";

/** The alternatives of `HighFive`'s site. */
type HighFive = "one" | "other";

/** The alternatives of `CastEntryItem`'s site. */
type CastEntryItem = "one" | "other";

/** The alternatives of `HandshakeRole`'s site. */
type HandshakeRole = "one" | "other";

/** The alternatives of `Handshake`'s site. */
type Handshake = "one" | "other";
