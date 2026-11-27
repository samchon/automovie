import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanClinch,
  IAutoMovieMotionHumanCloseStrike,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { clinch } from "../grappling/internal/clinch";
import { poseBones } from "../posture/internal/poseBones";

/**
 * A headbutt's hands on the partner's neck: each palm reaches the opposite side
 * of the neck by the take on a path that bows round the partner's trunk, the
 * elbows tucked, holds it through the impact to the release, following the
 * displayed partner, and comes home over the rest of the recoil.
 *
 * @param props The strike's context, the partner, the take and the duration.
 * @returns The two arms' primitives and their grip windows.
 */
export function CloseStrikeNeck(
  props: CloseStrikeNeck.IProps,
): CloseStrikeNeck.IHeld {
  const { context, subject, take, release, duration }: CloseStrikeNeck.IProps =
    props;
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
        fixedShape: "flat",
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
        // Taken by the take, held through the impact to the release, then
        // brought home; the path arcs round the partner's trunk rather than
        // through it, as the grapple's reach to a shoulder does.
        weight: (seconds: number): number =>
          CloseStrikeNeck.weight(seconds, take, release, duration),
        curvature: CloseStrikeNeck.ARC,
        target: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanArmTarget.ITarget => {
          // The flat palm lies on the side of the neck with its fingers
          // round toward the nape, so neither they nor the thumb reach the
          // head above it.
          const placed: IAutoMovieMotionHumanClinch.IPlaceResult = clinch.place(
            partner.body,
            partner.bones(context.start + seconds, needed),
            region,
            0,
          );
          const around: IAutoMovieVector3 = Vector3.normalize({
            x: placed.point.x - entry.root.x,
            y: 0,
            z: placed.point.z - entry.root.z,
          });
          return AutoMovieMotionHumanTarget.hand(body, posture, hand, placed, {
            surface: "palm",
            shape: "flat",
            bend: "tucked",
            forward: around,
          });
        },
      }),
    );
    contacts.push({
      part: `${hand}Hand`,
      kind: "grip",
      from: take / duration,
      to: release / duration,
      support: { kind: "person", subject, region },
    });
  }
  return { primitives, contacts };
}

/** Companion types of {@link CloseStrikeNeck}. */
export namespace CloseStrikeNeck {
  /**
   * How far the hands have taken the neck at a second: in over `take` on a
   * minimum-jerk share, held to the release, then let go over the rest.
   *
   * @param seconds The strike's seconds.
   * @param take When the hands close on the neck, seconds.
   * @param release When they let go, seconds.
   * @param duration The strike's seconds in all.
   * @returns 0 to 1.
   */
  export function weight(
    seconds: number,
    take: number,
    release: number,
    duration: number,
  ): number {
    return seconds <= release
      ? minimumJerk.share(Math.min(1, seconds / take))
      : 1 - minimumJerk.share((seconds - release) / (duration - release));
  }

  /**
   * The hands' path's bow round the partner's trunk, the grapple's arc to a
   * shoulder (`grapple`'s curvature).
   */
  export const ARC: number = 0.62;

  /** The headbutt's hold. */
  export interface IProps {
    /** The strike's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCloseStrike.IParams>;

    /** The partner held. */
    subject: string;

    /** When both palms hold the neck, seconds. */
    take: number;

    /** When both palms let go of the neck, seconds. */
    release: number;

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
