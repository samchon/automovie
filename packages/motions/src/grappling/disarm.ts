import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDisarm,
  IAutoMovieMotionHumanPlacedAction,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { touch } from "../touch/touch";

/** The hand of a performer that holds a prop, by the nearest hand to its frame. */
function holding(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDisarm.IParams>,
  partner: string,
  prop: string,
): AutoMovieHumanSide {
  const frame: IAutoMovieVector3 = context
    .prop(prop)
    .frame(context.start).position;
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = context
    .performer(partner)
    .bones(
      context.start,
      new Set<AutoMovieHumanoidBone>(["leftHand", "rightHand"]),
    );
  return Vector3.distance(bones.get("leftHand")!.worldPosition, frame) <
    Vector3.distance(bones.get("rightHand")!.worldPosition, frame)
    ? "left"
    : "right";
}

/**
 * A staged disarm (`IAutoMovieMotionHumanDisarm`). The defender's hands close
 * on the armed arm by the stage-fight grab (`touch`, both palms squeezing):
 * for a knife on the armed wrist and the forearm, for a handgun on the armed
 * wrist and the pistol's slide over the barrel. The grab holds for the
 * lever, then the hand on the wrist takes the weapon: from `taken` its grip
 * carries the weapon and it holds it after the action, while the other hand
 * lets go. The armed partner performs `disarmed`, whose hand opens at the
 * same `taken` instant, so the weapon has one owner at every instant. A
 * partner who does not hold the weapon is refused; a wrist out of reach is
 * refused by the grab, with the distance named.
 */
export namespace disarm {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "disarm";

  /** Cancel table: the grab's own. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    touch.interrupts;

  /** How long the lever turns the armed hand before the grip opens, seconds: authored. */
  export const LEVER: number = 0.5;

  /** How long the defender holds the weapon in the action after taking it, seconds: authored. */
  export const AFTER: number = 0.4;

  /**
   * Plan a disarm.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On `prop` when the partner holds no such weapon, on `lever` when not positive and finite, and whatever the grab refuses.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDisarm.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const params: IAutoMovieMotionHumanDisarm.IParams = context.params;
    const lever: number = params.lever ?? LEVER;
    if (!(lever > 0 && Number.isFinite(lever)))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "lever",
        value: lever,
        reason: "the lever takes a positive time",
        fix: "give the lever in seconds",
      });
    const armed: AutoMovieHumanSide = holding(
      context,
      params.partner,
      params.prop,
    );
    const side: AutoMovieHumanSide = params.hand ?? "right";
    const suffix: string = armed === "left" ? "Left" : "Right";
    const wrist: AutoMovieHumanoidRegion =
      `wrist${suffix}` as AutoMovieHumanoidRegion;
    const forearm: AutoMovieHumanoidRegion =
      `forearm${suffix}` as AutoMovieHumanoidRegion;
    const other: IAutoMovieMotionTarget =
      params.kind === "handgun"
        ? { kind: "prop", subject: params.prop, point: "slide" }
        : { kind: "person", subject: params.partner, region: forearm };

    // The grab on the armed arm, held through the lever and the take.
    const grab: IAutoMovieMotionHumanTouch.IParams = {
      target: { kind: "person", subject: params.partner, region: wrist },
      other,
      side,
      with: "palm",
      kind: "squeeze",
      count: 1,
      hold: lever + AFTER,
    };
    const grabbed: IAutoMovieMotionHumanActionPlan = touch.plan({
      ...context,
      params: grab,
    });
    const duration: number = grabbed.duration;
    const closed: number =
      grabbed.contact ??
      duration *
        (grabbed.events.find(
          (e: IAutoMovieMotionEvent): boolean => e.name === "stroke",
        )?.share ?? 0.5);
    const taken: number = Math.min(duration, closed + lever);
    const share: number = taken / duration;
    const part: IAutoMovieMotionHumanContactWindow["part"] = `${side}Hand`;
    return {
      ...grabbed,
      events: [
        ...grabbed.events,
        { name: "gripped", share: closed / duration },
        { name: "taken", share },
      ],
      contacts: [
        // The taking hand's hold on the wrist ends as it takes the weapon.
        ...grabbed.contacts.map(
          (
            c: IAutoMovieMotionHumanContactWindow,
          ): IAutoMovieMotionHumanContactWindow =>
            c.part === part && c.kind !== "plant" && c.to > share
              ? { ...c, to: share }
              : c,
        ),
        {
          part,
          kind: "grip",
          from: share,
          to: 1,
          support: { kind: "prop", subject: params.prop },
        },
      ],
      holds: [
        ...(grabbed.holds ?? []),
        {
          side,
          prop: params.prop,
          from: 1,
          fingers: HumanHand.shape(side, "fist"),
        },
      ],
      posture: (
        seconds: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const shown: IAutoMovieMotionHumanPosture = grabbed.posture(
          seconds,
          channels,
          resolution,
          projection,
        );
        // The taking hand closes into a fist round the weapon's grip.
        return seconds < taken
          ? shown
          : {
              ...shown,
              joints: { ...shown.joints, ...HumanHand.shape(side, "fist") },
            };
      },
    };
  }
}

/**
 * The armed partner of a disarm (`IAutoMovieMotionHumanDisarm.IYield`). The
 * partner keeps the posture it entered with; its armed forearm turns with
 * the lever from the defender's grip to the take, and its hand opens at the
 * defender's `taken` instant, read from the disarm's own placed plan, where
 * its grip on the weapon ends, so the weapon passes to the defender's hand
 * with one owner at every instant.
 */
export namespace disarmed {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "disarmed";

  /** Cancel table: none; the partner yields to the end. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /** How far the lever turns the armed forearm, degrees of twist: authored. */
  export const TWIST: number = 70;

  /** How long the partner stays after the take, seconds: authored. */
  export const AFTER: number = 0.4;

  /**
   * Plan the partner's yield.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On `of` when no disarm by that defender is anchored there or it has no `taken` instant, and on `prop` when this performer holds nothing.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDisarm.IYield>,
  ): IAutoMovieMotionHumanActionPlan {
    const placed: IAutoMovieMotionHumanPlacedAction = context.action(
      context.params.of,
    );
    const instant: (name: string) => number | undefined = (
      name: string,
    ): number | undefined => {
      const event: IAutoMovieMotionEvent | undefined = placed.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      );
      return event === undefined
        ? undefined
        : placed.start + event.share * placed.plan.duration;
    };
    const taken: number | undefined = instant("taken");
    const gripped: number | undefined = instant("gripped");
    if (
      placed.subject !== context.params.partner ||
      taken === undefined ||
      gripped === undefined
    )
      throw new HumanRefusal({
        kind: "participant",
        axis: "of",
        value: context.params.of,
        reason: `${context.params.of} is not ${context.params.partner}'s disarm`,
        fix: "name the anchor of the defender's disarm",
      });
    const prop: string = (placed.params as IAutoMovieMotionHumanDisarm.IParams)
      .prop;
    const side: AutoMovieHumanSide | undefined =
      context.entry.holds.left === prop
        ? "left"
        : context.entry.holds.right === prop
          ? "right"
          : undefined;
    if (side === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "prop",
        value: prop,
        reason: `${context.subject} does not hold ${prop}`,
        fix: "arm the partner with the weapon before the disarm",
      });
    const release: number = Math.max(0, taken - context.start);
    const from: number = Math.max(0, gripped - context.start);
    const duration: number = release + AFTER;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const forearm: AutoMovieHumanoidBone = `${side}LowerArm`;
    const held: readonly [number, number, number] = entry.joints[forearm] ?? [
      0, 0, 0,
    ];
    return {
      duration,
      events: [
        { name: "gripped", share: from / duration },
        { name: "released", share: release / duration },
      ],
      contacts: [
        {
          part: "leftFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: "rightFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        },
        // The armed hand keeps the weapon until the take, then lets go.
        {
          part: `${side}Hand`,
          kind: "grip",
          from: 0,
          to: release / duration,
          support: { kind: "prop", subject: prop },
        },
      ],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const turn: number =
          t <= from
            ? 0
            : Math.min(1, (t - from) / Math.max(1e-6, release - from));
        return {
          ...entry,
          joints: {
            ...entry.joints,
            [forearm]: [
              held[0],
              held[1],
              held[2] + (side === "right" ? -1 : 1) * TWIST * turn,
            ],
            ...(t >= release ? HumanHand.shape(side, "relaxed") : {}),
          },
        };
      },
    };
  }
}
