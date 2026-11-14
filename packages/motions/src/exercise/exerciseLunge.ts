import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * The forward lunge of `exercise`: the hips come down until the lead thigh is
 * level over an upright shank and travel forward until the trailing thigh
 * hangs under its hip, that leg's shank level behind it on a foot stood on
 * its toes with the ankle at its dorsiflexion range; the lead foot steps out
 * to stand a thigh ahead of the hips there, and steps back.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the lunge's bottom, the travel and the step.
 * @evidence contracts/development/design.md#principled-representation The lunge as the root's travel, the lead leg's step and the trailing foot's turn about its toes, over the exercise's repetition clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs the exercise hands over and one builder of the lunge's primitives and plant.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every length is a share of the body's measures; the ankle's range is the rig's.
 */
export namespace exerciseLunge {
  /** What the exercise hands the lunge. */
  export interface IProps {
    /** The body. */
    body: IHumanBody;

    /** The posture the exercise starts from. */
    entry: IHumanPosture;

    /** The feet at the entry. */
    stance: Record<"left" | "right", HumanFoot.IPlacement>;

    /** The heading's forward, world. */
    forward: IAutoMovieVector3;

    /** The leg that steps out. */
    lead: "left" | "right";

    /** The share of the way into any repetition's low position at a second. */
    any: (seconds: number) => number;

    /** The manner's extent. */
    extent: number;

    /** The clock's duration, seconds. */
    duration: number;
  }

  /**
   * The lunge's primitives and the trailing foot's plant.
   *
   * @param props The body, the entry and its feet, the heading, the lead leg, the depth share, the extent and the duration.
   * @returns The primitives and the contact windows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The bottom read off the measures: the sink from the lead hip to a level thigh over an upright shank, the travel that hangs the trailing thigh under its hip over a tiptoed foot, and the stride that stands the lead foot a thigh ahead.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The bottom, then the root, the lead leg and the trailing foot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ankle's dorsiflexion is the rig's limit, not a stated angle.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work at plan time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per lunge plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitives close over the stance and the bottom.
   */
  export function plan(props: IProps): {
    primitives: IAutoMovieMotionHumanPrimitive[];
    contacts: IHumanContactWindow[];
  } {
    const { body, entry, stance, forward, lead, any, extent, duration } = props;
    const m: IHumanBody["measure"] = body.measure;
    const trail: "left" | "right" = lead === "right" ? "left" : "right";
    const hip: IAutoMovieVector3 = HumanFrame.point(
      { origin: entry.root, yaw: entry.yaw },
      body.rest.get(`${lead}UpperLeg`)!,
    );
    const low: number = stance[lead].ankle.y + m.shank;
    const sink: number = Math.max(0, hip.y - low) * extent;
    const heel: number =
      90 - (AutoMovieMotionHumanRange.limit(`${trail}Foot`, "flexion") ?? 0);
    const tiptoe = (share: number): HumanFoot.IPlacement =>
      HumanFoot.pivot(
        body,
        trail,
        "mtp",
        HumanFoot.point(body, trail, "mtp", stance[trail]),
        HumanFoot.heading(stance[trail].rotation),
        -heel * share,
      );
    const toes: IAutoMovieVector3 = tiptoe(1).ankle;
    const travel: number =
      (Vector3.dot(Vector3.subtract(toes, hip), forward) +
        Math.sqrt(
          Math.max(0, m.shank ** 2 - (toes.y - (low - m.thigh)) ** 2),
        )) *
      extent;
    const stride: number =
      travel +
      m.thigh -
      Vector3.dot(Vector3.subtract(stance[lead].ankle, hip), forward);
    const stepped: HumanFoot.IPlacement = {
      ankle: Vector3.add(stance[lead].ankle, Vector3.scale(forward, stride)),
      rotation: stance[lead].rotation,
    };
    // The step out over the first half of the lowering, back over the second half of the rise.
    const primitives: IAutoMovieMotionHumanPrimitive[] = [
      {
        channels: ["root"],
        from: 0,
        to: duration,
        write: (posture: IHumanPosture, s: number): IHumanPosture => ({
          ...posture,
          root: Vector3.add(
            posture.root,
            Vector3.add(Vector3.scale(forward, travel * any(s)), {
              x: 0,
              y: -sink * any(s) ** 2,
              z: 0,
            }),
          ),
        }),
      },
      AutoMovieMotionHumanLeg.place({
        body,
        side: lead,
        from: 0,
        to: duration,
        placement: (_: IHumanPosture, s: number): HumanFoot.IPlacement =>
          AutoMovieMotionHumanLeg.arc(
            stance[lead],
            stepped,
            0.05 * m.stature,
            Math.min(1, 2 * any(s)),
          ),
        planted: (s: number): boolean => any(s) <= 0 || any(s) >= 0.5,
      }),
      // The trailing foot turns about its toes' joint, the toes flat.
      {
        channels: [`${trail}Leg`],
        from: 0,
        to: duration,
        write: (posture: IHumanPosture, s: number): IHumanPosture => {
          const share: number = any(s) * extent;
          return {
            ...posture,
            joints: {
              ...posture.joints,
              [`${trail}Toes`]: [heel * share, 0, 0],
            },
            limbs: {
              ...posture.limbs,
              [`${trail}Leg`]: AutoMovieMotionHumanLeg.goal(
                body,
                posture,
                trail,
                tiptoe(share),
                true,
              ),
            },
          };
        },
      },
    ];
    return {
      primitives,
      contacts: [
        {
          part: `${trail}Foot`,
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        },
      ],
    };
  }
}
