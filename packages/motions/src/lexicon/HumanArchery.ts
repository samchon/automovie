import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanLexiconParams,
  IAutoMovieMotionHumanWeaponPresent,
} from "@automovie/interface";

import { operate } from "../affordance/operate";
import { pickUp } from "../handling/pickUp";
import { putDown } from "../handling/putDown";
import { HumanActionRow } from "../law/HumanActionRow";
import { HumanRefusal } from "../law/HumanRefusal";
import { release } from "../throwing/release";
import { HumanArcheryCue } from "./HumanArcheryCue";
import { HumanWeaponPresent } from "./HumanWeaponPresent";

/**
 * Archery under its own names. Shared grasp and placement laws take the
 * same inert prop from its slot to a moving socket. The release rows can
 * hand it off to a scene-authored animation carrier on a film cue (#3713–3714).
 *
 * - `takeArrow`: a pick up of the arrow by its shaft, from where the
 *   composition says it lies (a quiver's slot site).
 * - `nockArrow`: a put down of the arrow's nock onto the bow's `nock`
 *   socket, its shaft on the bow's `rest`.
 * - `presentBow`: presenting the bow in one hand with the line of aim from
 *   the face (`HumanWeaponPresent`, anchor `face`), the bow's `rest` as the
 *   working point the line from `nock` passes through, independently of the
 *   rest's surface normal, the bow arm extended to its own
 *   reach along the line (`extended`), as the shot cycle's set-up raises it
 *   toward the target.
 * - `drawBow`: an operation of the bow's `string` slider by the drawing
 *   hand, performed over `presentBow` (`HumanChain.over`) from the set-up, so
 *   the string is drawn while the bow rises and the bow arm extends (the
 *   shot cycle's set-up and pre-draw, KSL Shot Cycle); the hand takes the
 *   string where the raised bow carries it (`operateDrive.IPart.place`), and
 *   the string's drive moves the nock and, by `follows`, bends the limbs
 *   (#3476).
 * - `loose`: a release of the drawing hand, or a staged hand-off at `open`
 *   and visible string recovery when a continuation is supplied.
 * - `spanCrossbow`: an operation of the crossbow's `string` (a straight pull
 *   with the foot in the `stirrup`) or its `crank`, to full travel.
 * - `presentCrossbow`: presenting the crossbow with the cheek anchor, fixed
 *   rail mark and separate support-hand contact.
 * - `shootCrossbow`: a staged trigger and string cue with a bolt hand-off at
 *   `strokeStart` when a continuation is supplied.
 *
 * The phases are Nishizono et al.'s as Simsek and Ertan cite them (bow
 * hold, drawing, full draw, aiming, release, follow-through); their
 * durations are not yet read at a source and are the shipped laws' own,
 * provisional. A draw tradition (the Mediterranean draw, the thumb draw of
 * a horse bow) is the composition's choice of hand and anchor, not a law.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is a row of, which affordances it reads, what the composition gives and what is provisional.
 * @evidence contracts/development/design.md#principled-representation Uses rows of shipped laws and one shared authored release cue for both prop families.
 * @evidence contracts/development/design.md#minimal-and-owned-surface #3487's rows; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The continuation uses the shared mount operation and existing prop articulation owners.
 */
export namespace HumanArchery {
  /** Take an arrow by its shaft. */
  export const takeArrow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["takeArrow"]
  > = HumanActionRow.of("takeArrow", pickUp, {
    handle: "shaft",
  });

  /** Set the arrow's nock on the bow's string. */
  export const nockArrow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["nockArrow"]
  > = HumanActionRow.of("nockArrow", putDown, {});

  /** Hold the bow out in one hand on the line from the face to the target. */
  export const presentBow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["presentBow"]
  > = HumanActionRow.of(
    "presentBow",
    HumanWeaponPresent.present,
    {
      anchor: "face",
      hands: 1,
      from: "nock",
      tip: "rest",
      edge: "grip",
      extended: true,
    },
  );

  /** Draw the string back to the anchor, over `presentBow`. */
  export const drawBow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["drawBow"]
  > = HumanActionRow.of("drawBow", operate, {});

  /** Open the drawing hand or perform the authored hand-off at the same named event. */
  export const loose: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["loose"]
  > = {
    ...HumanActionRow.of("loose", release, {}),
    plan: (context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLexiconParams["archery"]["loose"]>): IAutoMovieMotionHumanActionPlan => {
      const { continuation, prop, launch } = context.params;
      if (continuation === undefined) return release.plan(context);
      if (prop !== undefined || launch !== undefined)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "continuation",
          value: continuation.prop,
          reason: "the staged hand-off has its own prop and destination",
          fix: "supply continuation on its own or use the existing release parameters",
        });
      return HumanArcheryCue(context, continuation, false);
    },
  };

  /** Span a crossbow by its string or its crank. */
  export const spanCrossbow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["spanCrossbow"]
  > = HumanActionRow.of("spanCrossbow", operate, {});

  /** Present the crossbow at the cheek with the prop's fixed rail mark. */
  export const presentCrossbow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["presentCrossbow"]
  > = {
    ...HumanActionRow.of("presentCrossbow", HumanWeaponPresent.present, {
      anchor: "cheek",
    }),
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWeaponPresent.IPresent>,
    ): IAutoMovieMotionHumanActionPlan =>
      HumanWeaponPresent.present.plan({
        ...context,
        params: crossbowMarks(context),
      }),
    demands: (
      ahead: IAutoMovieMotionHumanActionLaw.IAhead<IAutoMovieMotionHumanWeaponPresent.IPresent>,
    ): readonly IAutoMovieMotionHumanActionLaw.IDemand[] =>
      HumanWeaponPresent.present.demands!({
        ...ahead,
        params: ahead.grip.prop === ahead.params.gun ? crossbowMarks(ahead) : ahead.params,
      }),
  };

  /** Play the crossbow cue and transfer the named bolt to its continuation. */
  export const shootCrossbow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["shootCrossbow"]
  > = {
    ...HumanActionRow.of("shootCrossbow", HumanWeaponPresent.fire, {}),
    plan: (context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLexiconParams["archery"]["shootCrossbow"]>): IAutoMovieMotionHumanActionPlan => {
      const { continuation, gun, shot } = context.params;
      if (continuation === undefined) return HumanWeaponPresent.fire.plan(context);
      if (shot !== undefined || (gun !== undefined && gun !== continuation.source))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "continuation",
          value: continuation.prop,
          reason: "the staged hand-off must identify a single source and destination",
          fix: "use continuation with the depicted crossbow and omit shot",
        });
      return HumanArcheryCue(context, continuation, true);
    },
  };
}

/** Read the modeled presentation marks when the caller leaves them open. Planning and grasp prediction see the same defaults. */
function crossbowMarks(
  context: Pick<
    IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWeaponPresent.IPresent>,
    "params" | "prop"
  >,
): IAutoMovieMotionHumanWeaponPresent.IPresent {
  const params: IAutoMovieMotionHumanWeaponPresent.IPresent = context.params;
  if (
    params.gun === undefined ||
    (params.tip !== undefined && params.edge !== undefined)
  )
    return params;

  const marks: readonly IAutoMovieAffordance[] =
    context.prop(params.gun).prop.affordances ?? [];
  if (!marks.some((a: IAutoMovieAffordance): boolean => a.id === "rail" && a.kind === "socket"))
    return params;
  return {
    ...params,
    tip: params.tip ?? "rail",
    ...(params.edge === undefined && marks.some((a: IAutoMovieAffordance): boolean => a.id === "rest" && a.kind === "surface")
      ? { edge: "rest" }
      : {}),
  };
}
