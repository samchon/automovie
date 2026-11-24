import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCollapse,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRoot } from "../compose/AutoMovieMotionHumanRoot";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { StrikingTarget } from "../striking/StrikingTarget";
import { CollapseFold } from "./CollapseFold";
import { KnockdownFloor } from "./KnockdownFloor";
import { ReactionFeet } from "./ReactionFeet";
import { ReactionSource } from "./ReactionSource";
import { knockdown } from "./knockdown";

/**
 * A staged collapse in a chosen direction and tone, for a faint or a fatal hit
 * (`IAutoMovieMotionHumanCollapse`). `backward` is the knockdown itself; the
 * other directions drop onto the knees by `knockdown.SEATED`, about the
 * free-fall time of the pelvis slowed by the buckling legs, and lay the trunk
 * on the floor by `knockdown.DOWN`, while an optional sag softens the knees
 * first. The pelvis drops where it stood, the heading turns so the body falls
 * away from the blow, and the root height rests each pose's lowest collider on
 * the floor (`knockdown.rest`), so no pose penetrates it. The fold's angles are
 * `CollapseFold`'s.
 */
export namespace collapse {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "collapse";

  /**
   * A collapse is a staged fall, so its balance is judged over the fall
   * (`IAutoMovieMotionHumanActionLaw.physical`).
   */
  export const physical: boolean = true;

  /** Cancel table: none; a collapsed performer stays down. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /** A collapse interrupts whatever the body was doing, at any instant. */
  export const accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {
    any: [AutoMovieMotionHumanInterrupt.row("anytime", "reflex")],
  };

  /**
   * Plan a collapse.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On `sag` or `seconds` when negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCollapse.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const direction: IAutoMovieMotionHumanCollapse.Direction =
      context.params.direction ?? "forward";
    if (direction === "backward")
      return knockdown.plan({
        ...context,
        params: {
          ...(context.params.target === undefined
            ? {}
            : { target: context.params.target }),
          ...(context.params.hold === undefined
            ? {}
            : { hold: context.params.hold }),
        },
      });
    const sag: number = context.params.sag ?? 0;
    const lie: number = context.params.hold ?? 1;
    for (const [axis, value] of [
      ["sag", sag],
      ["hold", lie],
    ] as const)
      if (!(value >= 0) || !Number.isFinite(value))
        throw new HumanRefusal({
          kind: "parameter",
          axis,
          value,
          feasible: {
            kind: "range",
            unit: "s",
            minimum: 0,
            maximum: Number.MAX_VALUE,
          },
          reason: "a collapse's times are non-negative seconds",
          fix: `give a non-negative ${axis}`,
        });

    const body: IAutoMovieMotionHumanBody = context.body;
    const tone: IAutoMovieMotionHumanCollapse.Tone =
      context.params.tone ?? "limp";
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const kneel: number = sag + knockdown.SEATED;
    const down: number =
      sag + (direction === "inPlace" ? FOLDED : knockdown.DOWN);
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(down + lie, [
      { name: "sag", seconds: sag },
      { name: "knees", seconds: kneel },
      { name: "stroke", seconds: kneel },
      { name: "down", seconds: down },
    ]);
    const duration: number = clock.duration;
    const sagging: (seconds: number) => number = AutoMovieMotionClock.prepare(
      clock,
      AutoMovieMotionClock.START,
      "sag",
    ).progress;
    const drop: (seconds: number) => number = AutoMovieMotionClock.prepare(
      clock,
      "sag",
      "knees",
    ).progress;
    const lay: (seconds: number) => number = AutoMovieMotionClock.prepare(
      clock,
      "knees",
      "down",
    ).progress;

    // The direction the blow pushes the body, read once: the body falls that
    // way, turning to face it forward, or toppling to that side.
    const away: IAutoMovieVector3 = AutoMovieMotionHumanTarget.away(
      ReactionSource.at(
        context,
        context.params.target,
        context.start - StrikingTarget.LOOK,
        entry,
        AutoMovieMotionHumanTarget.DEFAULTS.ahead,
      ),
      entry.root,
      entry.yaw,
    );
    const local: IAutoMovieVector3 = HumanFrame.local(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      away,
    );
    const side: AutoMovieHumanSide =
      context.params.side ?? (local.x >= 0 ? "left" : "right");
    const turn: number =
      direction === "forward"
        ? angle((Math.atan2(away.x, away.z) * 180) / Math.PI - entry.yaw)
        : 0;
    const fold = (seconds: number): CollapseFold.IFold =>
      CollapseFold(
        direction,
        tone,
        side,
        sagging(seconds),
        drop(seconds),
        lay(seconds),
      );
    const rest: ReturnType<typeof knockdown.prepareRest> =
      knockdown.prepareRest(body);

    // The feet stay where they stood until the knees land: the root moves
    // back along the heading by the ankles' travel in the trunk's frame.
    const measure: ReturnType<typeof KnockdownFloor.prepareMeasure> =
      KnockdownFloor.prepareMeasure(body);
    const ankle = (seconds: number): number => {
      const now: CollapseFold.IFold = fold(seconds);
      return measure({ pitch: now.pitch, joints: now.joints }).ankle;
    };
    const standing: number = ankle(0);
    const landed: number = ankle(kneel);

    const plan: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: {
          ...AutoMovieMotionHumanBase.still(
            duration,
            {
              root: entry.root,
              yaw: entry.yaw,
              pitch: 0,
              roll: 0,
              joints: {},
              limbs: {},
            },
            [
              ...ReactionFeet.plants(kneel / duration),
              ...contacts(direction, tone, side, kneel, down, duration),
            ],
          ),
        },
        clock,
        primitives: [
          // The pelvis drops where it stood, the body turning away from the
          // blow; the height rests the pose of each second on the floor.
          {
            channels: ["root"],
            reads: ["root"],
            from: 0,
            to: duration,
            write: (
              posture: IAutoMovieMotionHumanPosture,
              seconds: number,
              _before?: IAutoMovieMotionHumanPrimitive.Reader,
              resolution?: Parameters<
                IAutoMovieMotionHumanActionPlan["posture"]
              >[2],
              projection?: Parameters<
                IAutoMovieMotionHumanActionPlan["posture"]
              >[3],
            ): IAutoMovieMotionHumanPosture => {
              const now: CollapseFold.IFold = fold(seconds);
              const shaped: IAutoMovieMotionHumanPosture = {
                ...posture,
                pitch: now.pitch,
                roll: now.roll,
                joints: { ...posture.joints, ...now.joints },
              };
              const back: number =
                standing -
                (seconds < kneel || direction === "inPlace"
                  ? ankle(seconds)
                  : landed);
              const yaw: number = entry.yaw + turn * drop(seconds);
              const world: IAutoMovieVector3 = HumanFrame.point(
                { origin: { x: 0, y: 0, z: 0 }, yaw },
                { x: 0, y: 0, z: back },
              );
              return AutoMovieMotionHumanRoot.place(posture, {
                point: {
                  ...HumanFrame.local(
                    { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
                    world,
                  ),
                  y: rest(shaped, resolution, projection) - entry.root.y,
                },
                yaw: turn * drop(seconds),
              });
            },
          },
          AutoMovieMotionHumanLean.tilt({
            from: 0,
            to: duration,
            angles: (seconds: number): IAutoMovieMotionHumanLean.IAngles => {
              const now: CollapseFold.IFold = fold(seconds);
              return { pitch: now.pitch, roll: now.roll };
            },
          }),
          AutoMovieMotionHumanJoints.add({
            channels: ["head", "leftLeg", "rightLeg", "leftArm", "rightArm"],
            from: 0,
            to: duration,
            delta: (seconds: number): IAutoMovieMotionHumanJoints.Angles =>
              fold(seconds).joints,
          }),
        ],
      });
    // The fold pitches and rolls the body about its root; the feet stay
    // flat where they stood until the knees land, so no heel skates.
    return {
      ...ReactionFeet.hold(
        plan,
        context.entry,
        context.body,
        kneel,
        0.5 * context.body.measure.hipHeight,
      ),
      physicalWindow: { from: 0, to: down },
    };
  }

  /**
   * How long an in-place collapse takes to fold into its heap after the knees
   * land, seconds, as the knockdown's roll-down measures it.
   */
  const FOLDED: number = knockdown.DOWN;

  /**
   * The floor contacts a collapse declares: the knees from their landing, a
   * protective body's hands before its trunk, and the trunk's lie.
   */
  function contacts(
    direction: IAutoMovieMotionHumanCollapse.Direction,
    tone: IAutoMovieMotionHumanCollapse.Tone,
    side: AutoMovieHumanSide,
    kneel: number,
    down: number,
    duration: number,
  ): IAutoMovieMotionHumanContactWindow[] {
    const knees: IAutoMovieMotionHumanContactWindow[] = (
      ["leftLowerLeg", "rightLowerLeg"] as const
    ).map(
      (
        part: IAutoMovieMotionHumanContactWindow["part"],
      ): IAutoMovieMotionHumanContactWindow => ({
        part,
        kind: "bear",
        from: kneel / duration,
        to: direction === "inPlace" ? 1 : down / duration,
        support: { kind: "ground" },
      }),
    );
    const hands: IAutoMovieMotionHumanContactWindow[] =
      tone === "protective" && direction !== "inPlace"
        ? (direction === "forward"
            ? (["leftHand", "rightHand"] as const)
            : ([side === "left" ? "leftHand" : "rightHand"] as const)
          ).map(
            (
              part: IAutoMovieMotionHumanContactWindow["part"],
            ): IAutoMovieMotionHumanContactWindow => ({
              part,
              kind: "plant",
              from: (kneel + (down - kneel) * CollapseFold.HANDS) / duration,
              to: 1,
              support: { kind: "ground" },
            }),
          )
        : [];
    const trunk: IAutoMovieMotionHumanContactWindow[] =
      direction === "inPlace"
        ? []
        : [
            {
              part: "back",
              kind: "lie",
              from: down / duration,
              to: 1,
              support: { kind: "ground" },
            },
          ];
    return [...knees, ...hands, ...trunk];
  }

  /** A heading difference wrapped into (-180, 180]. */
  function angle(degrees: number): number {
    return ((((degrees + 180) % 360) + 360) % 360) - 180;
  }
}
