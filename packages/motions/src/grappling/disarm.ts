import { Vector3, minimumJerk } from "@automovie/engine";
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
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHand } from "../compose/AutoMovieMotionHumanHand";
import { handOver } from "../handling/handOver";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { touch } from "../touch/touch";

/**
 * A staged disarm (`IAutoMovieMotionHumanDisarm`). The defender's hands close
 * on the armed arm by the stage-fight grab (`touch`, both palms squeezing): for
 * a knife on the armed wrist and the forearm, for a handgun on the armed wrist
 * and the pistol's slide over the barrel. The grab holds for the lever, then
 * the hand on the wrist takes the weapon: from `taken` its grip carries the
 * weapon and it holds it after the action, while the other hand lets go. The
 * armed partner performs `disarmed`, whose hand opens at the same `taken`
 * instant, so the weapon has one owner at every instant. A partner who does not
 * hold the weapon is refused; a wrist out of reach is refused by the grab, with
 * the distance named.
 */
export namespace disarm {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "disarm";

  /** Cancel table: the grab's own. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    touch.interrupts;

  /**
   * How long the lever turns the armed hand before the grip opens, seconds:
   * authored.
   */
  export const LEVER: number = 0.5;

  /**
   * How long the defender holds the weapon in the action after taking it,
   * seconds: authored.
   */
  export const AFTER: number = 0.4;

  /**
   * How long the taking hand takes to close into its fist, seconds: the time a
   * hand-over's fingers take to open at the release (`handOver.OPEN`,
   * provisional).
   */
  export const CLOSE: number = handOver.OPEN;

  /**
   * A disarm's lever time: `LEVER` by default, and positive.
   *
   * @param asked The lever asked, seconds.
   * @returns The lever's seconds.
   * @throws {HumanRefusal} When the lever is not positive.
   */
  export function leverTime(asked: number | undefined): number {
    const lever: number = asked ?? LEVER;
    if (!(lever > 0))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "lever",
        value: lever,
        reason: "the lever takes a positive time",
        fix: "give the lever in seconds",
      });
    return lever;
  }
  /**
   * Plan a disarm.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On `prop` when the partner holds no such weapon, on
   *   `lever` when not positive and finite, and whatever the grab refuses.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDisarm.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const params: IAutoMovieMotionHumanDisarm.IParams = context.params;
    const lever: number = leverTime(params.lever);
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
      hand: side,
      effector: "palm",
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
    const closing: ReturnType<
      typeof AutoMovieMotionHumanHand.prepareFingerWriter
    > = AutoMovieMotionHumanHand.prepareFingerWriter(side, "fist");
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
        // The taking hand closes into a fist round the weapon's grip, from the
        // fingers the grab shows over `CLOSE` on a minimum-jerk share: a fist
        // written whole at `taken` snapped the fingers in one frame.
        if (seconds < taken) return shown;
        const joints: IAutoMovieMotionHumanPosture["joints"] = {
          ...shown.joints,
        };
        closing(
          joints,
          0,
          minimumJerk.share(Math.min(1, (seconds - taken) / CLOSE)),
        );
        return { ...shown, joints };
      },
    };
  }
}

/**
 * The hand of the partner that holds the prop as the disarm starts: the
 * performance's own grip custody (`IAutoMovieMotionHumanPropReader.holderAt`),
 * read after the partner is, so a partner placed on demand is placed first. A
 * reader that tracks no grips is read by the nearer hand to the prop.
 */
function holding(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDisarm.IParams>,
  partner: string,
  prop: string,
): AutoMovieHumanSide {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = context
    .performer(partner)
    .bones(
      context.start,
      new Set<AutoMovieHumanoidBone>(["leftHand", "rightHand"]),
    );
  const reader: IAutoMovieMotionHumanPropReader = context.prop(prop);
  if (reader.holderAt !== undefined) {
    const held: IAutoMovieMotionHumanPropReader.IHolder | undefined =
      reader.holderAt(context.start);
    if (held === undefined || held.subject !== partner)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "prop",
        value: prop,
        reason: `${partner} does not hold ${prop} as the disarm starts`,
        fix: "arm the partner with the weapon before the disarm",
      });
    return held.side;
  }
  const frame: IAutoMovieVector3 = reader.frame(context.start).position;
  return Vector3.distance(bones.get("leftHand")!.worldPosition, frame) <
    Vector3.distance(bones.get("rightHand")!.worldPosition, frame)
    ? "left"
    : "right";
}
