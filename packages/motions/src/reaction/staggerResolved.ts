import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBalance } from "../everyday/HumanBalance";
import { HumanArmSwing } from "../posture/HumanArmSwing";
import { HumanLimbIncumbent } from "../posture/HumanLimbIncumbent";
import { deriveHumanPosture } from "../posture/deriveHumanPosture";
import { resolveHumanPostureSource } from "../posture/resolveHumanPostureSource";

/**
 * The poses a stagger's plan reads at its samples, resolved on one assembly a
 * sample: the arms' carriage reads the sample's posture, and each balance pass
 * reads that posture again with the arms let out, or with the root shifted. The
 * carriage's posture is assembled and fitted once; a balance pass's posture is
 * derived from that assembly (`deriveHumanPosture`) and takes the carriage's
 * leg fits where its legs read exactly what they read there
 * (`resolveHumanPostureSource.fit` with the completed fit).
 *
 * @param body The body.
 * @returns The sample readers: `carriage` first for a sample, then `centre` any
 *   number of times.
 */
export function staggerResolved(
  body: IAutoMovieMotionHumanBody,
): staggerResolved.IReader {
  const knots: Parameters<typeof resolveHumanPostureSource.fit>[5][] = [];
  return {
    carriage: (
      index: number,
      posture: IAutoMovieMotionHumanPosture,
    ): Record<AutoMovieHumanSide, number> => {
      const assembled: resolveHumanPostureSource.IAssembled =
        resolveHumanPostureSource.assemble(body, posture);

      // The sample before's seeds start this sample's swept fits from a held
      // seed (`HumanLimbIncumbent`), which cannot change their answers.
      const before:
        | IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"]
        | undefined = knots[index - 1]?.seeded.seeds;
      const seeded: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
        before === undefined
          ? resolveHumanPostureSource.fit(body, assembled)
          : HumanLimbIncumbent.within(
              { body, seeds: before },
              (): IAutoMovieMotionHumanResolveHumanPosture.ISeeded =>
                resolveHumanPostureSource.fit(body, assembled),
            );
      knots[index] = { assembled, seeded };
      const cleared: IAutoMovieMotionHumanPosture = HumanArmSwing.of(
        body,
        posture,
        ["left", "right"],
        undefined,
        undefined,
        seeded.pose,
      );

      // The let-out the swing adds over what the posture writes
      // (`HumanArmSwing.carriage` for one instant).
      const added: (side: AutoMovieHumanSide) => number = (
        side: AutoMovieHumanSide,
      ): number =>
        Math.max(
          0,
          (cleared.joints[`${side}UpperArm`]?.[1] ?? 0) -
            (posture.joints[`${side}UpperArm`]?.[1] ?? 0),
        );
      return { left: added("left"), right: added("right") };
    },
    centre: (
      index: number,
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieVector3 => {
      const knot: Parameters<typeof resolveHumanPostureSource.fit>[5] =
        knots[index];
      if (knot === undefined) return HumanBalance.centre(body, posture);
      const pose: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["pose"] =
        resolveHumanPostureSource.fit(
          body,
          deriveHumanPosture(body, knot.assembled, posture),
          undefined,
          {},
          undefined,
          knot,
        ).pose;
      return HumanBalance.centre(body, posture, undefined, undefined, pose);
    },
  };
}

/** The reader's type. */
export namespace staggerResolved {
  /** A stagger plan's sample readers. */
  export interface IReader {
    /**
     * Each arm's added abduction that keeps it clear in the sample's posture,
     * degrees (`HumanArmSwing.carriage` at one instant); resolves the posture
     * and keeps its assembly and fit for the sample.
     */
    carriage(
      index: number,
      posture: IAutoMovieMotionHumanPosture,
    ): Record<AutoMovieHumanSide, number>;

    /**
     * The whole-body centre of mass of a posture of the sample, world metres
     * (`HumanBalance.centre`), resolved on the sample's kept assembly; resolved
     * plainly when the sample has none.
     */
    centre(
      index: number,
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieVector3;
  }
}
