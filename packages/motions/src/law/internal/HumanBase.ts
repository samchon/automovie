import type {
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanEntryState,
} from "@automovie/interface";

/**
 * Companion types, the kinds as data and the passing-on rule of
 * {@link HumanBase}.
 */
export namespace HumanBase {
  /**
   * The base kinds, as data: the list a page, a test generator and a refusal's
   * alternatives read, from which {@link Kind} is derived. `airborne` is the
   * base between a take-off and a touchdown, which a shape laid over a flight
   * requires; `immersed` is a body the water carries, its root moved by the
   * water's forces.
   */
  export const KINDS = [
    "standing",
    "seated",
    "kneeling",
    "crouched",
    "lying",
    "leaning",
    "hanging",
    "airborne",
    "immersed",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanBase.Kind>[];

  /**
   * The sides a seat sat astride is got onto and off from, as data: `either`
   * takes both.
   */
  export const MOUNTS = [
    "left",
    "right",
    "either",
  ] as const satisfies readonly NonNullable<
    IAutoMovieMotionHumanBase.ISeat["mount"]
  >[];

  /**
   * The base a body is on as it leaves an action at a share of it.
   *
   * @param props The action's declared base, the base it was entered on, the
   *   supports open at the instant and the share of the action reached.
   * @returns The base the next action is entered on.
   */
  export function after(
    props: IAutoMovieMotionHumanBase.IAfterProps,
  ): IAutoMovieMotionHumanBase {
    if (props.declared !== undefined && props.share >= 1 - 1e-9)
      return props.declared;
    const shown: IAutoMovieMotionHumanBase.Kind = props.supports.some(
      (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
        s.kind === "seat",
    )
      ? "seated"
      : props.supports.some(
            (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
              s.kind === "lie",
          )
        ? "lying"
        : props.supports.some(
              (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
                s.kind === "bear" &&
                (s.part === "leftLowerLeg" || s.part === "rightLowerLeg"),
            )
          ? "kneeling"
          : "standing";
    if (props.declared?.kind === shown) return props.declared;

    // A base no contact shows (kneeling, crouched, leaning, hanging) is kept
    // by an action that declares none while the feet still bear.
    if (
      props.entered.kind === shown ||
      (props.declared === undefined &&
        shown === "standing" &&
        props.entered.kind !== "seated" &&
        props.entered.kind !== "lying")
    )
      return props.entered;
    return { kind: shown };
  }
}
