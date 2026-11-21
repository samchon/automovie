import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanCloseStrike,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { clinch } from "../grappling/clinch";
import { poseBones } from "../posture/poseBones";

/**
 * A headbutt's hands on the partner's neck: each palm reaches the opposite
 * side of the neck by the take, the elbows tucked, and holds it, following
 * the displayed partner, to the end of the strike.
 *
 * @param props The strike's context, the partner, the take and the duration.
 * @returns The two arms' primitives and their grip windows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the reach, the hold and what is followed.
 * @evidence contracts/development/implementation.md#principled-implementation Each palm's goal is the clinch's placement on the partner's displayed neck, reached on a minimum-jerk share by the take.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One arm movement and one grip window per hand.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The neck is read on the displayed partner at each second.
 * @evidence contracts/development/implementation.md#efficient-algorithms One partner bone read per hand per second.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the shared arm movement, hand target and the clinch's neck placement.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the partner reader until plan release.
 */
export function CloseStrikeNeck(
  props: CloseStrikeNeck.IProps,
): CloseStrikeNeck.IHeld {
  const { context, subject, take, duration }: CloseStrikeNeck.IProps = props;
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const partner: IAutoMovieMotionHumanPerformerReader =
    context.performer(subject);
  const primitives: IAutoMovieMotionHumanPrimitive[] = [];
  const contacts: IAutoMovieMotionHumanContactWindow[] = [];
  for (const hand of ["left", "right"] as const) {
    const region: AutoMovieHumanoidRegion =
      hand === "left" ? "neckRight" : "neckLeft";
    const needed: ReadonlySet<AutoMovieHumanoidBone> = new Set([
      partner.body.surfaces.regions[region].bone,
    ]);
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([`${hand}Hand`]),
    );
    primitives.push(
      AutoMovieMotionHumanArm.move({
        body,
        side: hand,
        from: 0,
        to: duration,
        origin: AutoMovieMotionHumanArm.origin(
          body,
          bones,
          { origin: entry.root, yaw: entry.yaw },
          hand,
          "palm",
        ),
        weight: (seconds: number): number =>
          minimumJerk.share(Math.min(1, seconds / take)),
        target: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanArmTarget.ITarget =>
          AutoMovieMotionHumanTarget.hand(
            body,
            posture,
            hand,
            clinch.place(
              partner.body,
              partner.bones(context.start + seconds, needed),
              region,
              0,
            ),
            { surface: "palm", shape: "relaxed", bend: "tucked" },
          ),
      }),
    );
    contacts.push({
      part: `${hand}Hand`,
      kind: "grip",
      from: take / duration,
      to: 1,
      support: { kind: "person", subject, region },
    });
  }
  return { primitives, contacts };
}

/**
 * Companion types of {@link CloseStrikeNeck}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
 * @evidence contracts/development/design.md#principled-representation The context, the partner, two seconds and the result's two lists.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the close strike law hands and reads back.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's context, primitive and contact types.
 */
export namespace CloseStrikeNeck {
  /** The headbutt's hold. */
  export interface IProps {
    /** The strike's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCloseStrike.IParams>;

    /** The partner held. */
    subject: string;

    /** When both palms hold the neck, seconds. */
    take: number;

    /** The strike's length, seconds. */
    duration: number;
  }

  /** The hold's arms and grips. */
  export interface IHeld {
    /** The two arms' primitives. */
    primitives: IAutoMovieMotionHumanPrimitive[];

    /** The two palms' grip windows. */
    contacts: IAutoMovieMotionHumanContactWindow[];
  }
}
