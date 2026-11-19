import {
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanRefusal } from "../law/HumanRefusal";
import { AquaticPosture } from "./AquaticPosture";

/**
 * An artistic figure with optional team support. Flat and vertical sculls
 * follow the form distinctions measured by Homma et al. (PMID 31718520).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the researched support shapes and the ensemble variation.
 * @evidence contracts/development/design.md#principled-representation One figure clock governs joint shape and the support blend.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the assisted and unassisted artistic swimming figure.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each foot borrows its own named base's displayed palm over the actual contact interval.
 */
export namespace AquaticTeam {
  /** A flat-layout-to-vertical artistic phrase with optional ensemble role and beat offset. */
  export function artistic(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const duration: number = 4;
    const lifted: boolean = params.role === "flyer";
    const bases: readonly [string, string] | undefined = lifted
      ? params.bases
      : undefined;
    if (
      bases !== undefined &&
      (bases[0] === bases[1] || bases.includes(context.subject))
    )
      throw new HumanRefusal({
        kind: "participant",
        axis: "bases",
        value: bases,
        reason: "an assisted flyer needs two distinct supporting swimmers",
        fix: "name two other performers as the flyer's left and right bases",
      });
    const base: boolean = params.role === "base";
    const measured: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: -90 },
        { shoulder: 6, raise: 19, elbow: 32, hip: 6, knee: 10, ankle: -24 },
      ),
    );
    const laid: IAutoMovieMotionHumanPosture = {
      ...measured,
      root: {
        ...measured.root,
        y:
          measured.root.y +
          water -
          0.13 -
          AquaticPosture.markers(body, ["hips"])(measured).get("hips")!
            .worldPosition.y,
      },
    };
    const upright: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        {
          pitch: 2,
          spine: [-4, 0, 0],
        },
        {
          shoulder: 12,
          raise: 55,
          elbow: 82,
          hip: 16,
          spread: 17,
          knee: 43,
          ankle: -16,
        },
      ),
      {
        ...entry.posture.root,
        y: water - body.measure.stature * 0.81,
      },
    );
    const high: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        {
          pitch: lifted ? -9 : 3,
          spine: [-9, 0, 0],
          neck: base ? -20 : 3,
        },
        {
          shoulder: base ? 138 : 164,
          raise: base ? 25 : 17,
          elbow: base ? 26 : 7,
          hip: lifted ? 10 : 35,
          spread: lifted ? 30 : 19,
          knee: lifted ? 8 : 57,
          ankle: -25,
        },
      ),
      { ...upright.root, y: upright.root.y + (lifted ? 0.76 : 0.18) },
    );
    const vertical: ReturnType<typeof AquaticPosture.blend> =
      AquaticPosture.blend(laid, upright);
    const rise: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      upright,
      high,
    );
    const fall: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      high,
      upright,
    );
    const settle: ReturnType<typeof AquaticPosture.blend> =
      AquaticPosture.blend(upright, laid);
    const lag: number = 0.35 * (params.phase ?? 0);
    const tVertical: number = 1.35 + lag;
    const tHigh: number = 2.3 + lag;
    const tReturn: number = 3.15 + lag;
    const partners:
      | readonly [
          IAutoMovieMotionHumanPerformerReader,
          IAutoMovieMotionHumanPerformerReader,
        ]
      | undefined =
      bases !== undefined
        ? [context.performer(bases[0]), context.performer(bases[1])]
        : undefined;
    const legsAt: ReturnType<typeof AquaticPosture.markers> | undefined =
      partners === undefined
        ? undefined
        : AquaticPosture.markers(body, [
            "leftFoot",
            "leftLowerLeg",
            "rightFoot",
            "rightLowerLeg",
          ]);
    const gripStart: number = tHigh - 0.14;
    const gripEnd: number = tHigh + 0.14;
    const hands:
      | readonly [
          ReadonlySet<AutoMovieHumanoidBone>,
          ReadonlySet<AutoMovieHumanoidBone>,
        ]
      | undefined =
      partners === undefined
        ? undefined
        : [
            new Set([partners[0].body.surfaces.regions.palmRight.bone]),
            new Set([partners[1].body.surfaces.regions.palmLeft.bone]),
          ];
    const contacts: IAutoMovieMotionHumanContactWindow[] =
      bases === undefined
        ? []
        : (["left", "right"] as const).map(
            (
              side: "left" | "right",
              i: number,
            ): IAutoMovieMotionHumanContactWindow => ({
              part: `${side}Foot`,
              kind: "bear",
              from: gripStart / duration,
              to: gripEnd / duration,
              support: {
                kind: "person",
                subject: bases[i]!,
                region: side === "left" ? "palmRight" : "palmLeft",
              },
            }),
          );

    return {
      duration,
      events: [
        { name: "flatScull", share: 0 },
        { name: "supportScull", share: tVertical / duration },
        { name: "figure", share: tHigh / duration },
        { name: "return", share: tReturn / duration },
        { name: "relax", share: 1 },
      ],
      contacts,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const result: IAutoMovieMotionHumanPosture =
          t <= tVertical
            ? vertical((t - 0.65 - lag) / 0.7)
            : t <= tHigh
              ? rise((t - tVertical) / (tHigh - tVertical))
              : t <= tReturn
                ? fall((t - tHigh) / (tReturn - tHigh))
                : settle((t - tReturn) / (duration - tReturn));
        const phase: number = (2 * Math.PI * (t - lag)) / 0.66;
        const active: number =
          1 - 0.97 * Math.max(0, 1 - Math.abs(t - tHigh) / 0.47);
        const joint = (
          part: "leftUpperArm" | "rightUpperArm" | "leftHand" | "rightHand",
          change: number,
        ) => {
          const [x, y, z]: readonly [number, number, number] = result.joints[
            part
          ] ?? [0, 0, 0];
          return [
            x,
            y + change * active * Math.sin(phase),
            z + (change * active * Math.cos(phase)) / 2,
          ] as const;
        };
        const shaped: IAutoMovieMotionHumanPosture = {
          ...result,
          joints: {
            ...result.joints,
            leftUpperArm: joint("leftUpperArm", 12),
            rightUpperArm: joint("rightUpperArm", 12),
            leftHand: joint("leftHand", 18),
            rightHand: joint("rightHand", 18),
          },
        };
        if (
          partners === undefined ||
          hands === undefined ||
          legsAt === undefined ||
          t < gripStart - 0.22 ||
          t > gripEnd + 0.22
        )
          return shaped;
        const w: number = minimumJerk.share(
          Math.min(
            1,
            (t - gripStart + 0.22) / 0.22,
            (gripEnd + 0.22 - t) / 0.22,
          ),
        );
        const legs: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          legsAt(shaped);
        const limb = (
          side: "left" | "right",
          index: 0 | 1,
        ): { point: IAutoMovieVector3; bend: IAutoMovieVector3 } => {
          const base: IAutoMovieMotionHumanPerformerReader = partners[index];
          const region: IAutoMovieHumanoidSurfaces.IFrame =
            base.body.surfaces.regions[
              side === "left" ? "palmRight" : "palmLeft"
            ];
          const bone: IAutoMovieResolvedBone = base
            .bones(context.start + t, hands[index])
            .get(region.bone)!;
          const palm: IAutoMovieVector3 =
            resolveAutoMovieHumanoidSurfaces.place(region, bone).point;
          const ankle: IAutoMovieVector3 = legs.get(
            `${side}Foot`,
          )!.worldPosition;
          const knee: IAutoMovieVector3 = legs.get(
            `${side}LowerLeg`,
          )!.worldPosition;
          return { point: Vector3.lerp(ankle, palm, w), bend: knee };
        };
        return {
          ...shaped,
          limbs: { leftLeg: limb("left", 0), rightLeg: limb("right", 1) },
        };
      },
    };
  }
}
