import type {
  IAutoMovieMotionHumanCatchObject,
  IAutoMovieMotionHumanHandoverAction,
  IAutoMovieMotionHumanHandshake,
  IAutoMovieMotionHumanHighFive,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanMutual,
  IAutoMovieMotionHumanThrowObjectParams,
} from "@automovie/interface";

/**
 * The vocabulary's mutual actions, for `HumanChain.mutual`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds and who reads it.
 * @evidence contracts/development/design.md#principled-representation Each mutual action as its roles and each role's action, over the shipped laws.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The mutual actions the vocabulary ships; a production writes its own record the same way.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No law is duplicated: a role's action is a shipped law with the partner named from the cast.
 */
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

  /** One person hands an object to another: the giver performs `handOver`, the receiver `receive`. */
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
              from: cast.giver,
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
   * region; the kissed turns its gaze to the kisser's face with `look`,
   * the eyes and head meeting the approach as people do when kissed, while
   * its body stands.
   */
  export const kiss: IAutoMovieMotionHumanMutual<
    Omit<IAutoMovieMotionHumanKiss.IParams, "partner">,
    "kisser" | "kissed"
  > = {
    name: "kiss",
    roles: ["kisser", "kissed"],
    act: (
      role: "kisser" | "kissed",
      params: Omit<IAutoMovieMotionHumanKiss.IParams, "partner">,
      cast: Readonly<Record<"kisser" | "kissed", string>>,
    ): IAutoMovieMotionHumanMutual.IAct =>
      role === "kisser"
        ? { name: "kiss", params: { ...params, partner: cast.kissed } }
        : {
            name: "look",
            params: {
              target: { kind: "person", subject: cast.kisser, region: "face" },
            },
          },
  };

  /**
   * One person throws a ball to another, who catches it: the thrower
   * performs `throwObject` at the catcher's right palm with the ball it
   * holds, and the catcher `catchObject` of that throw, read through the
   * joined anchor (`${anchor}.thrower`), so the catch plans from the throw's
   * own flight. The join needs an anchor for that reason.
   */
  export const pass: IAutoMovieMotionHumanMutual<
    Omit<IAutoMovieMotionHumanCatchObject.IParams, "from"> &
      Pick<IAutoMovieMotionHumanThrowObjectParams, "style" | "manner">,
    "thrower" | "catcher"
  > = {
    name: "pass",
    roles: ["thrower", "catcher"],
    act: (
      role: "thrower" | "catcher",
      params: Omit<IAutoMovieMotionHumanCatchObject.IParams, "from"> &
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
              at: {
                kind: "person",
                subject: cast.catcher,
                region: params.side === "left" ? "palmLeft" : "palmRight",
              },
              prop: params.ball,
              ...(params.style === undefined ? {} : { style: params.style }),
              ...(params.manner === undefined ? {} : { manner: params.manner }),
            },
          }
        : {
            name: "catchObject",
            params: {
              from: `${anchor}.thrower`,
              ball: params.ball,
              ...(params.hands === undefined ? {} : { hands: params.hands }),
              ...(params.side === undefined ? {} : { side: params.side }),
              ...(params.glove === undefined ? {} : { glove: params.glove }),
            },
          };
    },
  };
}
