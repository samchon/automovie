import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanRange } from "../../compose/internal/AutoMovieMotionHumanRange";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";

/** The record of `IPlanResult`'s site. */
type IPlanResult = {
  primitives: IAutoMovieMotionHumanPrimitive[];
  contacts: IAutoMovieMotionHumanContactWindow[];
};

/**
 * The forward lunge of `exercise`: the hips come down until the lead thigh is
 * level over an upright shank and travel forward until the trailing thigh hangs
 * under its hip, that leg's shank level behind it on a foot stood on its toes
 * with the ankle at its dorsiflexion range; the lead foot steps out to stand a
 * thigh ahead of the hips there, and steps back.
 */
export namespace exerciseLunge {
  /** What the exercise hands the lunge. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The posture the exercise starts from. */
    entry: IAutoMovieMotionHumanPosture;

    /** The feet at the entry. */
    stance: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;

    /** The heading's forward, world. */
    forward: IAutoMovieVector3;

    /** The leg that steps out. */
    lead: AutoMovieHumanSide;

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
   * @param props The body, the entry and its feet, the heading, the lead leg,
   *   the depth share, the extent and the duration.
   * @returns The primitives and the contact windows.
   */
  export function plan(props: IProps): IPlanResult {
    const { body, entry, stance, forward, lead, any, extent, duration } = props;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const trail: AutoMovieHumanSide = lead === "right" ? "left" : "right";
    const hip: IAutoMovieVector3 = HumanFrame.point(
      { origin: entry.root, yaw: entry.yaw },
      body.rest.get(`${lead}UpperLeg`)!,
    );
    const low: number = stance[lead].ankle.y + m.shank;
    const sink: number = Math.max(0, hip.y - low) * extent;
    const heel: number =
      90 - (AutoMovieMotionHumanRange.limit(`${trail}Foot`, "flexion") ?? 0);
    const pivot: ReturnType<typeof HumanFoot.preparePivot> =
      HumanFoot.preparePivot(
        body,
        trail,
        "mtp",
        HumanFoot.point(body, trail, "mtp", stance[trail]),
        HumanFoot.heading(stance[trail].rotation),
      );
    const tiptoe = (share: number): IAutoMovieMotionHumanFoot.IPlacement =>
      pivot(-heel * share);
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
    const stepped: IAutoMovieMotionHumanFoot.IPlacement = {
      ankle: Vector3.add(stance[lead].ankle, Vector3.scale(forward, stride)),
      rotation: stance[lead].rotation,
    };
    const step: ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc> =
      AutoMovieMotionHumanLeg.prepareArc(
        stance[lead],
        stepped,
        0.05 * m.stature,
      );
    // The step out over the first half of the lowering, back over the second half of the rise.
    const primitives: IAutoMovieMotionHumanPrimitive[] = [
      {
        channels: ["root"],
        reads: ["root"],
        from: 0,
        to: duration,
        write: (
          posture: IAutoMovieMotionHumanPosture,
          s: number,
        ): IAutoMovieMotionHumanPosture => ({
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
        placement: (
          _: IAutoMovieMotionHumanPosture,
          s: number,
        ): IAutoMovieMotionHumanFoot.IPlacement =>
          step(Math.min(1, 2 * any(s))),
        planted: (s: number): boolean => any(s) <= 0 || any(s) >= 0.5,
      }),
      // The trailing foot turns about its toes' joint, the toes flat.
      {
        channels: [`${trail}Leg`],
        from: 0,
        to: duration,
        write: (
          posture: IAutoMovieMotionHumanPosture,
          s: number,
        ): IAutoMovieMotionHumanPosture => {
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
