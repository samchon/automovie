import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanLexiconParams,
  IAutoMovieMotionHumanOperate,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanWeaponPresent,
  IAutoMovieMotionTarget,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { operate } from "../../affordance/internal/operate";
import { motionHumanHeld } from "../../compose/internal/motionHumanHeld";
import { pickUp } from "../../handling/internal/pickUp";
import "../../handling/internal/putDown";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HUMAN_ARCHERY_PRESENT_BOW } from "../../next/presets/HUMAN_ARCHERY_PRESENT_BOW";
import { HumanHand } from "../../posture/internal/HumanHand";
import { release } from "../../throwing/internal/release";
import { HumanArcheryCue } from "./HumanArcheryCue";
import { HumanWeaponPresent } from "./HumanWeaponPresent";
import { HumanArcheryData } from "./HumanArcheryData";

/*
 * Archery under its own names. Shared grasp and placement laws take the same
 * inert prop from its slot to a moving socket. The release rows can hand it off
 * to a scene-authored animation carrier on a film cue.
 *
 * The rows fix no time: the pick up, put down and operate laws time them, and
 * the release is handed to a scene-authored carrier on a film cue.
 *
 * - `takeArrow`: a pick up of the arrow by its shaft just ahead of the nock
 *   (`nockGrip`), where the fingers hold it to nock it, from where the
 *   composition says it lies (a quiver's slot site).
 * - `nockArrow`: a put down of the arrow's nock onto the bow's `nock` socket, its
 *   shaft on the bow's `rest`.
 * - `presentBow`: presenting the bow in one hand with the line of aim from the
 *   face (`HumanWeaponPresent`, anchor `face`), the bow's `rest` as the working
 *   point the line from `nock` passes through, independently of the rest's
 *   surface normal, the bow arm extended to its own reach along the line
 *   (`extended`), as the shot cycle's set-up raises it toward the target.
 * - `drawBow`: an operation of the bow's `string` slider by the drawing hand,
 *   performed over `presentBow` (`AutoMovieMotionHumanChain.over`) from the set-up, so the
 *   string is drawn while the bow rises and the bow arm extends (the shot
 *   cycle's set-up and pre-draw, KSL Shot Cycle); the hand takes the string
 *   where the bow arm carries the bow (`onBowArm`: the grip the bow arm's own
 *   goal asks, never the bow's displayed frame) and draws it to the anchor
 *   under the chin, at most the travel given (`toAnchor`), and the string's
 *   drive moves the nock and, by `follows`, bends the limbs.
 * - `loose`: a release of the drawing hand, or a staged hand-off at `open` and
 *   visible string recovery when a continuation is supplied.
 * - `spanCrossbow`: an operation of the crossbow's `string` (a straight pull with
 *   the foot in the `stirrup`) or its `crank`, to full travel.
 * - `presentCrossbow`: presenting the crossbow with the cheek anchor, fixed rail
 *   mark and separate support-hand contact.
 * - `shootCrossbow`: a staged trigger and string cue with a bolt hand-off at
 *   `strokeStart` when a continuation is supplied.
 *
 * The phases are Nishizono et al.'s as Simsek and Ertan cite them (bow hold,
 * drawing, full draw, aiming, release, follow-through); their durations are not
 * yet read at a source and are the shipped laws' own, provisional. A draw
 * tradition (the Mediterranean draw, the thumb draw of a horse bow) is the
 * composition's choice of hand and anchor, not a law.
 */
export namespace HumanArchery {
  /*
   * Take an arrow by its shaft.
   */
  export const takeArrow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["takeArrow"]
  > = AutoMovieMotionHumanActionRow.of("takeArrow", pickUp, {
    handle: "nockGrip",
  });

  /*
   * Set the arrow's nock on the bow's string: the arrow's own `nock` socket is
   * the one laid on the receiver when the composition names no other, so the
   * placement holds that socket on the string (a contact task) where the wrist
   * cannot keep the whole attitude.
   */
  export const nockArrow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["nockArrow"]
  > = {
    ...HumanArcheryData.nockRow,
    plan: (
      context: IAutoMovieMotionHumanActionContext<
        IAutoMovieMotionHumanLexiconParams["archery"]["nockArrow"]
      >,
    ): IAutoMovieMotionHumanActionPlan =>
      HumanArcheryData.nockRow.plan({ ...context, params: byNock(context.params) }),
    // The grasp that takes the arrow is weighed for the same socket.
    demands: (
      ahead: IAutoMovieMotionHumanActionLaw.IAhead<
        IAutoMovieMotionHumanLexiconParams["archery"]["nockArrow"]
      >,
    ): readonly IAutoMovieMotionHumanActionLaw.IDemand[] =>
      HumanArcheryData.nockRow.demands?.({ ...ahead, params: byNock(ahead.params) }) ?? [],
  };

  /*
   * Hold the bow out in one hand on the line from the face to the target.
   */
  export const presentBow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["presentBow"]
  > = AutoMovieMotionHumanActionRow.of(
    "presentBow",
    HumanWeaponPresent.present,
    HUMAN_ARCHERY_PRESENT_BOW,
  );

  /*
   * Draw the string back to the anchor, over `presentBow`: the string is read
   * where the bow arm carries the bow (`onBowArm`).
   */
  export const drawBow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["drawBow"]
  > = {
    ...HumanArcheryData.drawRow,
    plan: (
      context: IAutoMovieMotionHumanActionContext<
        IAutoMovieMotionHumanLexiconParams["archery"]["drawBow"]
      >,
    ): IAutoMovieMotionHumanActionPlan =>
      HumanArcheryData.drawRow.plan(toAnchor(onBowArm(context))),
  };

  /*
   * Open the drawing hand or perform the authored hand-off at the same named
   * event.
   */
  export const loose: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["loose"]
  > = {
    ...AutoMovieMotionHumanActionRow.of("loose", release, {}),
    plan: (
      context: IAutoMovieMotionHumanActionContext<
        IAutoMovieMotionHumanLexiconParams["archery"]["loose"]
      >,
    ): IAutoMovieMotionHumanActionPlan => {
      const { continuation, prop, launch } = context.params;
      if (continuation === undefined) return release.plan(context);
      if (prop !== undefined || launch !== undefined)
        throw new AutoMovieMotionHumanRefusal({
          kind: "parameter",
          axis: "continuation",
          value: continuation.prop,
          reason: "the staged hand-off has its own prop and destination",
          fix: "supply continuation on its own or use the existing release parameters",
        });
      return HumanArcheryCue(context, continuation, false);
    },
  };

  /*
   * Span a crossbow by its string or its crank.
   */
  export const spanCrossbow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["spanCrossbow"]
  > = AutoMovieMotionHumanActionRow.of("spanCrossbow", operate, {});

  /*
   * Present the crossbow at the cheek with the prop's fixed rail mark.
   */
  export const presentCrossbow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["presentCrossbow"]
  > = {
    ...AutoMovieMotionHumanActionRow.of(
      "presentCrossbow",
      HumanWeaponPresent.present,
      {
        anchor: "cheek",
      },
    ),
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
        params:
          ahead.grip.prop === ahead.params.gun
            ? crossbowMarks(ahead)
            : ahead.params,
      }),
  };

  /*
   * Play the crossbow cue and transfer the named bolt to its continuation.
   */
  export const shootCrossbow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["shootCrossbow"]
  > = {
    ...AutoMovieMotionHumanActionRow.of(
      "shootCrossbow",
      HumanWeaponPresent.fire,
      {},
    ),
    plan: (
      context: IAutoMovieMotionHumanActionContext<
        IAutoMovieMotionHumanLexiconParams["archery"]["shootCrossbow"]
      >,
    ): IAutoMovieMotionHumanActionPlan => {
      const { continuation, gun, shot } = context.params;
      if (continuation === undefined)
        return HumanWeaponPresent.fire.plan(context);
      if (
        shot !== undefined ||
        (gun !== undefined && gun !== continuation.source)
      )
        throw new AutoMovieMotionHumanRefusal({
          kind: "parameter",
          axis: "continuation",
          value: continuation.prop,
          reason:
            "the staged hand-off must identify a single source and destination",
          fix: "use continuation with the depicted crossbow and omit shot",
        });
      return HumanArcheryCue(context, continuation, true);
    },
  };
}

/*
 * The draw's context with the string drawn to the anchor: the archer draws to
 * the face, never to the bow's own limit, the string to the chin with the index
 * finger under the jaw (the under-chin anchor of target archery), so the
 * drawing hand lies below the face rather than in it. The travel is the
 * string's run along its slider from where it rests to the chin's surface
 * point, at most the travel the composition gives; a chin not ahead along the
 * draw keeps the given travel.
 * Parameter context: The draw's context, its bow read off the bow arm.
 * Returns: The context whose slider travel ends at the anchor.
 */
function toAnchor(
  context: IAutoMovieMotionHumanActionContext<
    IAutoMovieMotionHumanLexiconParams["archery"]["drawBow"]
  >,
): IAutoMovieMotionHumanActionContext<
  IAutoMovieMotionHumanLexiconParams["archery"]["drawBow"]
> {
  const mechanism: IAutoMovieMotionHumanOperate.Mechanism = context.params.kind;
  if (mechanism.kind !== "slider" || mechanism.at.kind !== "prop")
    return context;
  const point: string = mechanism.at.point;
  const reader: IAutoMovieMotionHumanPropReader = context.prop(
    mechanism.at.subject,
  );
  const articulate: IAutoMovieMotionHumanProp["articulate"] =
    reader.prop.articulate;
  if (articulate === undefined) return context;
  const state: Readonly<Record<string, number>> =
    reader.state?.(context.start) ?? {};
  const rest: number = state[point] ?? 0;
  const frame: IAutoMovieRigidTransform = reader.frame(context.start);
  // The string's world point at a travel from its rest.
  const at: (travel: number) => IAutoMovieVector3 | undefined = (
    travel: number,
  ): IAutoMovieVector3 | undefined => {
    const posed: IAutoMovieAffordance | undefined = articulate({
      ...state,
      [point]: rest + travel,
    }).affordances.find((a: IAutoMovieAffordance): boolean => a.id === point);
    return posed === undefined
      ? undefined
      : AutoMovieEngineVector3.add(
          frame.position,
          AutoMovieEngineQuaternion.rotateVector(frame.rotation, posed.frame.translation),
        );
  };
  const start: IAutoMovieVector3 | undefined = at(0);
  const along: IAutoMovieVector3 | undefined = at(mechanism.travel);
  if (start === undefined || along === undefined) return context;
  const run: number = AutoMovieEngineVector3.distance(start, along);
  if (!(run > Number.EPSILON)) return context;
  const chin: IAutoMovieVector3 = context.aim(
    { kind: "self", region: "chin" },
    context.start,
  ).point;
  // The drawing hand comes to rest against the chin: the string stops the
  // hand's thumb reach from its grip (in the operation's relaxed slider
  // grip) short of the chin, so the hand meets the jaw rather than entering
  // it.
  const side: AutoMovieHumanSide = context.params.hand ?? "right";
  const thumb: number = AutoMovieEngineVector3.distance(
    HumanHand.offset(context.body, side, "thumbTip", "relaxed", DRAW_CURL)
      .point,
    HumanHand.offset(context.body, side, "grip").point,
  );
  const toChin: number =
    AutoMovieEngineVector3.dot(
      AutoMovieEngineVector3.subtract(chin, start),
      AutoMovieEngineVector3.scale(AutoMovieEngineVector3.subtract(along, start), 1 / run),
    ) - thumb;
  if (!(toChin > 0) || toChin >= run) return context;
  return {
    ...context,
    params: {
      ...context.params,
      kind: { ...mechanism, travel: mechanism.travel * (toChin / run) },
    },
  };
}

/*
 * The finger curl over the relaxed shape the drawing hand holds the string in,
 * degrees: the slider grip `operate` takes a slider with (`operateHand`).
 */
const DRAW_CURL: number = 40;

/*
 * The nocking's parameters with the arrow's own `nock` socket laid on the
 * receiver when the composition names none.
 * Parameter params: The nocking's parameters.
 * Returns: The parameters naming the arrow's socket.
 */
function byNock(
  params: IAutoMovieMotionHumanLexiconParams["archery"]["nockArrow"],
): IAutoMovieMotionHumanLexiconParams["archery"]["nockArrow"] {
  return params.onto === undefined || params.onto.via !== undefined
    ? params
    : { ...params, onto: { ...params.onto, via: "nock" } };
}

/*
 * The draw's context with the bow read off the bow arm, never off the bow's
 * displayed frame. The bow is rigid in the other hand's grip frame
 * (`motionHumanHeld`, read at the entry), so the string the drawing
 * hand takes rides that grip. Over a carrier (the draw over `presentBow`), the
 * grip is the one the carrier's own bow-arm goal asks at the same instant, so
 * the string is where the raised arm puts the bow. On its own, the draw holds
 * the entry's posture, so the bow stays where the entry held it. Reading the
 * displayed bow instead would read the very posture being fitted, since the bow
 * hangs on this performer's own hand. A draw on a prop the other hand does not
 * hold is left as it is.
 * Parameter context: The draw's context.
 * Returns: The context whose bow reader and aim read the bow arm's grip.
 */
function onBowArm(
  context: IAutoMovieMotionHumanActionContext<
    IAutoMovieMotionHumanLexiconParams["archery"]["drawBow"]
  >,
): IAutoMovieMotionHumanActionContext<
  IAutoMovieMotionHumanLexiconParams["archery"]["drawBow"]
> {
  const mechanism: IAutoMovieMotionHumanOperate.Mechanism = context.params.kind;
  if (mechanism.kind === "insert" || mechanism.at.kind !== "prop")
    return context;
  const bow: string = mechanism.at.subject;
  const side: AutoMovieHumanSide =
    (context.params.hand ?? "right") === "left" ? "right" : "left";
  if (context.entry.holds[side] !== bow) return context;
  const reader: IAutoMovieMotionHumanPropReader = context.prop(bow);
  const held: IAutoMovieMotionHumanHeld.IHeld = motionHumanHeld(
    context,
    side,
    bow,
  );
  const entered: IAutoMovieRigidTransform = reader.frame(context.entry.seconds);
  const grip: IAutoMovieVector3 = HumanHand.offset(
    context.body,
    side,
    "grip",
  ).point;
  const limb: AutoMovieHumanLimb = `${side}Arm`;
  const carrier: IAutoMovieMotionHumanActionContext.ICarrier | undefined =
    context.carrier;
  const frame: (seconds: number) => IAutoMovieRigidTransform = (
    seconds: number,
  ): IAutoMovieRigidTransform => {
    if (carrier === undefined) return entered;
    const goal: IAutoMovieHumanLimbGoal | undefined = carrier.posture(
      seconds - context.start,
    ).limbs[limb];
    // A goal in a bone's frame or without a turn names no world grip; the
    // bow is then kept where the entry held it.
    if (
      goal === undefined ||
      goal.on !== undefined ||
      goal.rotation === undefined
    )
      return entered;
    const socket: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      goal.point,
      AutoMovieEngineQuaternion.rotateVector(goal.rotation, grip),
    );
    return {
      position: AutoMovieEngineVector3.add(
        socket,
        AutoMovieEngineQuaternion.rotateVector(goal.rotation, held.frame.position),
      ),
      rotation: AutoMovieEngineQuaternion.normalize(
        AutoMovieEngineQuaternion.multiply(goal.rotation, held.frame.rotation),
      ),
    };
  };
  return {
    ...context,
    prop: (subject: string): IAutoMovieMotionHumanPropReader =>
      subject === bow ? { ...reader, frame } : context.prop(subject),
    aim: (
      target: IAutoMovieMotionTarget,
      seconds: number,
    ): ReturnType<IAutoMovieMotionHumanActionContext["aim"]> => {
      if (target.kind !== "prop" || target.subject !== bow)
        return context.aim(target, seconds);
      const posed: readonly IAutoMovieAffordance[] =
        reader.prop.articulate?.(reader.state?.(seconds) ?? {}).affordances ??
        reader.prop.affordances ??
        [];
      const contact: IAutoMovieAffordance | undefined = posed.find(
        (a: IAutoMovieAffordance): boolean => a.id === target.point,
      );
      if (contact === undefined) return context.aim(target, seconds);
      const shown: IAutoMovieRigidTransform = frame(seconds);
      return {
        point: AutoMovieEngineVector3.add(
          shown.position,
          AutoMovieEngineQuaternion.rotateVector(shown.rotation, contact.frame.translation),
        ),
        normal: AutoMovieEngineQuaternion.rotateVector(
          AutoMovieEngineQuaternion.multiply(shown.rotation, contact.frame.rotation),
          { x: 0, y: 1, z: 0 },
        ),
      };
    },
  };
}
/*
 * The alternatives of `CrossbowMarksContext`'s site.
 */
type CrossbowMarksContext = "params" | "prop";

/*
 * Read the modeled presentation marks when the caller leaves them open.
 * Planning and grasp prediction see the same defaults.
 */
function crossbowMarks(
  context: Pick<
    IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWeaponPresent.IPresent>,
    CrossbowMarksContext
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
  if (
    !marks.some(
      (a: IAutoMovieAffordance): boolean =>
        a.id === "rail" && a.kind === "socket",
    )
  )
    return params;
  return {
    ...params,
    tip: params.tip ?? "rail",
    ...(params.edge === undefined &&
    marks.some(
      (a: IAutoMovieAffordance): boolean =>
        a.id === "rest" && a.kind === "surface",
    )
      ? { edge: "rest" }
      : {}),
  };
}
