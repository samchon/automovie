import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanDisarm,
  IAutoMovieMotionHumanPlacedAction,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";

/**
 * The armed partner of a disarm (`IAutoMovieMotionHumanDisarm.IYield`). The
 * partner keeps the posture it entered with; its armed forearm turns with the
 * lever from the defender's grip to the take, and its hand opens at the
 * defender's `taken` instant, read from the disarm's own placed plan, where its
 * grip on the weapon ends, so the weapon passes to the defender's hand with one
 * owner at every instant.
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
   * When a placed action's named cue falls on the film clock.
   *
   * @param placed The placed action: its start and its plan's cues and length.
   * @param name The cue.
   * @returns Film seconds, or `undefined` when the plan has no such cue.
   */
  export function instant(
    placed: Pick<IAutoMovieMotionHumanPlacedAction, "start"> & {
      plan: Pick<
        IAutoMovieMotionHumanPlacedAction["plan"],
        "events" | "duration"
      >;
    },
    name: string,
  ): number | undefined {
    const event: IAutoMovieMotionEvent | undefined = placed.plan.events.find(
      (e: IAutoMovieMotionEvent): boolean => e.name === name,
    );
    return event === undefined
      ? undefined
      : placed.start + event.share * placed.plan.duration;
  }
  /**
   * Plan the partner's yield.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On `of` when no disarm by that defender is anchored
   *   there or it has no `taken` instant, and on `prop` when this performer
   *   holds nothing.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDisarm.IYield>,
  ): IAutoMovieMotionHumanActionPlan {
    const placed: IAutoMovieMotionHumanPlacedAction = context.action(
      context.params.of,
    );
    const instant: (name: string) => number | undefined = (
      name: string,
    ): number | undefined => disarmed.instant(placed, name);
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
