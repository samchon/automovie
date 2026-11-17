import type {
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanEntryState,
} from "@automovie/interface";

/** Companion types, the kinds as data and the passing-on rule of {@link HumanBase}. */
export namespace HumanBase {
  /**
   * The base kinds, as data: the list a page, a test generator and a
   * refusal's alternatives read, from which {@link Kind} is derived.
   * `airborne` is the base between a take-off and a touchdown, which a
   * shape laid over a flight requires (#3427); `immersed` is a body the water
   * carries, its root moved by the water's forces (#3432).
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

  /** The sides a seat sat astride is got onto and off from, as data: `either` takes both. */
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
   * @param props The action's declared base, the base it was entered on, the supports open at the instant and the share of the action reached.
   * @returns The base the next action is entered on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation An action that ran to its end left the body on the base it declares. Cut earlier, or declaring none, the open supports say what bears the body (a seat contact is seated, a lying contact is lying, a bearing lower leg is kneeling, otherwise the feet): the declared base where it agrees with them, else the entered base where that agrees, else the kind the supports show alone.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading of the supports and three ordered choices.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A lower leg bearing on its window (a knee or a shin, #3425) shows kneeling; crouched, leaning and hanging show no contact of their own in a plan's windows, nor does a kneel whose law declares no such window, so a cut inside the action that reaches one of them is read as the base it was entered on until its end; stated here as the remaining gap.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the supports, which are a handful.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function with nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
