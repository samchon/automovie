import type {
  IAutoMovieMotionHumanCatchObject,
  IAutoMovieMotionHumanHandoverAction,
  IAutoMovieMotionHumanHandshake,
  IAutoMovieMotionHumanHighFive,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanMutual,
  IAutoMovieMotionHumanThrowObjectParams,
} from "@automovie/interface";

/** The vocabulary's mutual actions, for `HumanChain.mutual`. */
export namespace HumanMutual {
  /** Two people shake hands; both perform `handshake`. */
  export const handshake: IAutoMovieMotionHumanMutual<
    Omit<IAutoMovieMotionHumanHandshake.IParams, "partner">,
    "one" | "other"
  > = {
    name: "handshake",
    roles: ["one", "other"],
    act: (
      role: "one" | "other",
      params: Omit<IAutoMovieMotionHumanHandshake.IParams, "partner">,
      cast: Readonly<Record<"one" | "other", string>>,
    ): IAutoMovieMotionHumanMutual.IAct => ({
      name: "handshake",
      params: { ...params, partner: cast[role === "one" ? "other" : "one"] },
    }),
  };

  /** Two people slap palms; both perform `highFive`. */
  export const highFive: IAutoMovieMotionHumanMutual<
    Omit<IAutoMovieMotionHumanHighFive.IParams, "partner">,
    "one" | "other"
  > = {
    name: "highFive",
    roles: ["one", "other"],
    act: (
      role: "one" | "other",
      params: Omit<IAutoMovieMotionHumanHighFive.IParams, "partner">,
      cast: Readonly<Record<"one" | "other", string>>,
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
    "giver" | "receiver"
  > = {
    name: "handOver",
    roles: ["giver", "receiver"],
    act: (
      role: "giver" | "receiver",
      params: Omit<IAutoMovieMotionHumanHandoverAction.IParams, "to">,
      cast: Readonly<Record<"giver" | "receiver", string>>,
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
    Omit<IAutoMovieMotionHumanKiss.IParams, "partner" | "handRole">,
    "kisser" | "kissed"
  > = {
    name: "kiss",
    roles: ["kisser", "kissed"],
    act: (
      role: "kisser" | "kissed",
      params: Omit<IAutoMovieMotionHumanKiss.IParams, "partner" | "handRole">,
      cast: Readonly<Record<"kisser" | "kissed", string>>,
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
      Pick<IAutoMovieMotionHumanThrowObjectParams, "style" | "manner">,
    "thrower" | "catcher"
  > = {
    name: "pass",
    roles: ["thrower", "catcher"],
    act: (
      role: "thrower" | "catcher",
      params: Omit<IAutoMovieMotionHumanCatchObject.IParams, "partner"> &
        Pick<IAutoMovieMotionHumanThrowObjectParams, "style" | "manner">,
      cast: Readonly<Record<"thrower" | "catcher", string>>,
      anchor?: string,
    ): IAutoMovieMotionHumanMutual.IAct => {
      if (anchor === undefined)
        throw new Error(
          "a pass joins a catch to its throw by the anchor; give HumanChain.mutual an anchor",
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
