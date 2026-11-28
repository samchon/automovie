import type {
  AutoMovieHumanSex,
  AutoMovieVector3Tuple,
  IAutoMovieHumanBodySources,
  IAutoMovieHumanCalibrationBone,
  IAutoMovieHumanEyeSeat,
  IAutoMovieHumanFootFrame,
  IAutoMovieHumanHeadLayout,
  IAutoMovieHumanHeadPrior,
  IAutoMovieHumanLimbRest,
  IAutoMovieHumanNeckSource,
  IAutoMovieHumanParameters,
  IAutoMovieHumanSkeletonLaw,
} from "@automovie/interface";

import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanEarPlace } from "../generation/AutoMovieHumanEarPlace";
import { AutoMovieHumanFootFrame } from "../generation/AutoMovieHumanFootFrame";
import { AutoMovieHumanFootPrior } from "../generation/AutoMovieHumanFootPrior";
import { AutoMovieHumanHeadArcs } from "../generation/AutoMovieHumanHeadArcs";
import { AutoMovieHumanHeadLandmarks } from "../generation/AutoMovieHumanHeadLandmarks";
import { AutoMovieHumanHeadMedianProfile } from "../generation/AutoMovieHumanHeadMedianProfile";
import { AutoMovieHumanHeadPrior } from "../generation/AutoMovieHumanHeadPrior";
import { AutoMovieHumanLimbRest } from "../generation/AutoMovieHumanLimbRest";
import { AutoMovieHumanNeckSource } from "../generation/AutoMovieHumanNeckSource";
import { AutoMovieHumanShoulderDatum } from "../generation/AutoMovieHumanShoulderDatum";
import { AutoMovieHumanSkeletonChain } from "../generation/AutoMovieHumanSkeletonChain";
import { AutoMovieHumanSkeletonLaw } from "../generation/AutoMovieHumanSkeletonLaw";
import { AutoMovieHumanHeadNeckScalars } from "../generation/AutoMovieHumanHeadNeckScalars";

/**
 * Place the stock polygon body's bind joints in Human calibration space (+X
 * forward, +Y up, +Z left; millimetres). Limb rest, shoulder support, and the head
 * and neck landmarks come from the corresponding Human placement laws. The stock
 * spine follows the straight axis from mid-hip to neck base at the skeleton law's
 * joint heights.
 */
export namespace AutoMovieHumanCanonicalBind {
  /**
   * Bind bones, calibration stature, rear foot planes and the ear ray offset
   * in Human calibration axes.
   */
  export interface IOutput {
    /**
     * Bind joint centres and leaf tips in millimetres, ordered parent before
     * child.
     */
    bones: IAutoMovieHumanCalibrationBone[];

    /**
     * Calibration stature in millimetres used by canonical preparation to scale
     * the rest geometry.
     */
    stature: number;

    /**
     * Rear foot plane points for the left and right foot in calibration
     * millimetres. Each point is at floor level and uses the transverse station of
     * that foot's hallux-tip prior.
     */
    heels: Record<"left" | "right", Vec3>;

    /**
     * Station for the lateral ear ray relative to the head's tragion-level
     * pivot, in Human calibration millimetres. The sagittal coordinate
     * follows tragion and the height follows the upper auricle.
     */
    earRayOffset: Vec3;
  }

  /**
   * Place the stock bind skeleton, heel planes and ear ray station from Human
   * measurements. The calibration frame has +X forward, +Y up and +Z left.
   * Canonical preparation carries the heel with the ankle and the ear ray
   * station with the head pivot.
   *
   * @param params Human body measurements and shape parameters shared with the
   * placement laws.
   * @returns Parent-first bind bones, stature, two heel-plane points and the
   * ear ray offset, all in Human calibration millimetres.
   */
  export function of(params: IAutoMovieHumanParameters): IOutput {
    // The resolved inputs and frame; every solve behind this record is an
    // explicit request this function never makes.
    const original: IAutoMovieHumanBodySources.IOriginal =
      AutoMovieHumanBodyLaw.prepareSources(params);
    const sex: AutoMovieHumanSex = AutoMovieHumanBodyAnatomy.sexOf(params);
    const stature: number = original.stature;

    // The neck's axis and the head's landmarks, before any neck or head curve.
    const neck: IAutoMovieHumanNeckSource.IOutput = AutoMovieHumanNeckSource.of(
      original.headInputs,
      original.limbs.legs.scale,
    );
    const plan: IAutoMovieHumanHeadLayout = AutoMovieHumanHeadLandmarks.layout(
      AutoMovieHumanHeadLandmarks.compile(),
      original.headInputs,
      neck.head,
      neck.scale,
      AutoMovieHumanHeadLandmarks.NONE,
    );
    const neckBase: Vec3 = AutoMovieHumanHeadNeckScalars.axis(plan.neck).point(
      neck.bottom[1],
    );
    const neckRadius: number = plan.neck.radius;
    const tragion: number =
      plan.vertex -
      AutoMovieHumanHeadArcs.tragionDrop(original.headInputs.head, sex) *
        plan.scale;

    // The shoulder stands on the acromion and the neck's tape radius at the
    // neck base, in place of the detailed figure's solved neck-base course.
    const shoulder: IAutoMovieHumanLimbRest.IShoulder =
      AutoMovieHumanShoulderDatum.create(original.trunkInputs, stature, [
        neckBase[0],
        neckBase[1],
        neckRadius,
      ]);
    const limbs: IAutoMovieHumanLimbRest.IOutput =
      AutoMovieHumanLimbRest.create({
        stature,
        arms: original.limbs.arms,
        feet: original.limbs.feet,
        legs: original.limbs.legs,
        sex,
        diagnostics: original.diagnostics,
        hipForward: original.frame.perineum,
        shoulder: (): IAutoMovieHumanLimbRest.IShoulder => shoulder,
      });

    // The trunk joints' forward place: the line from the mid-hip to the neck
    // base, given as the two samples the skeleton law interpolates between.
    const pelvis: Vec3 = AutoMovieHumanSkeletonChain.lerp(
      limbs.leg("left").hip,
      limbs.leg("right").hip,
      0.5,
    );
    const body: IAutoMovieHumanSkeletonLaw.IOutput =
      AutoMovieHumanSkeletonLaw.body(
        { stature, diagnostics: original.diagnostics },
        {
          arms: original.limbs.arms,
          feet: original.limbs.feet,
          legs: original.limbs.legs,
          trunk: {
            crotch: original.limbs.crotch,
            shoulder: shoulder.shoulder,
            glenohumeral: shoulder.glenohumeral,
            axis: [
              [pelvis[1], pelvis[0]],
              [neckBase[1], neckBase[0]],
            ],
          },
          sex,
          limbs,
          neckBase,
          neckRadius,
        },
      );

    // The globes sit behind the nasion's skin on the median profile, each at
    // its own opening's lateral place, as the head lane seats them.
    const face: IAutoMovieHumanHeadPrior.IFace =
      AutoMovieHumanHeadPrior.PRIOR.face;
    const seat: number =
      AutoMovieHumanHeadMedianProfile.profileAt(plan, plan.nasion) -
      face.eyeRecess * plan.scale;
    const eyes: IAutoMovieHumanEyeSeat[] = (["left", "right"] as const).map(
      (side: "left" | "right"): IAutoMovieHumanEyeSeat => ({
        side,
        centre: [
          seat - face.marginForward * plan.scale,
          plan.eye + face.globeRise * plan.scale,
          (side === "left" ? 1 : -1) * plan[side].place,
        ],
        radius: face.radius * plan.scale,
      }),
    );
    function heel(side: "left" | "right"): Vec3 {
      const leg: IAutoMovieHumanLimbRest.ILeg = limbs.leg(side);
      const frame: IAutoMovieHumanFootFrame.IFrame = AutoMovieHumanFootFrame.of(
        original.limbs.feet[side],
      );
      const [x, , z]: Vec3 = frame.at(
        0,
        AutoMovieHumanFootPrior.PRIOR.toes[0]!.tip[1],
        0,
      );
      return [leg.shift[0] + x, 0, leg.shift[1] + (side === "left" ? z : -z)];
    }
    return {
      bones: AutoMovieHumanSkeletonLaw.complete(
        body,
        {
          skeleton: {
            neckBase,
            occiput: [plan.centre, tragion, 0],
            crown: [plan.centre, plan.vertex, 0],
            neckRadius,
          },
          eyes,
        },
        stature,
      ).bones,
      stature,
      heels: { left: heel("left"), right: heel("right") },
      earRayOffset: [
        AutoMovieHumanHeadLandmarks.atTragion(plan, tragion).landmarks.tragion[0] -
          plan.centre,
        AutoMovieHumanEarPlace.aboveTragion(original.headInputs.head.earPair.right, sex) *
          plan.scale,
        0,
      ],
    };
  }
}

/*
 * A point in calibration mm.
 */
type Vec3 = AutoMovieVector3Tuple;
