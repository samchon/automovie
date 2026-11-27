import type {
  AutoMovieHumanSex,
  AutoMovieVector3Tuple,
  IAutoMovieHumanBodySources,
  IAutoMovieHumanCalibrationBone,
  IAutoMovieHumanEyeSeat,
  IAutoMovieHumanHeadLayout,
  IAutoMovieHumanHeadPrior,
  IAutoMovieHumanLimbRest,
  IAutoMovieHumanNeckSource,
  IAutoMovieHumanParameters,
  IAutoMovieHumanSkeletonLaw,
} from "@automovie/interface";

import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
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
 * The polygon man's bind joints, placed from the person's parameters by
 * closed-form placement laws alone, in calibration millimetres (forward +X,
 * up +Y, left +Z).
 *
 * The polygon man is a coarse stand-in on Human's skeleton and carries only
 * the form it needs, so nothing here builds, fits or measures a curve of the
 * detailed figure: no trunk tape or course is closed, no neck girth is
 * solved, no head mass or surface is prepared. The detailed figure keeps its
 * own bind skeleton (`AutoMovieHumanBodyLaw.prepare`), whose trunk joints
 * stand on its converged surface.
 *
 * What each joint is placed from:
 *
 * - Legs, feet and toes: `AutoMovieHumanLimbRest` from the public limb
 *   inputs and the body frame's perineal datum, as the detailed figure
 *   places them.
 * - Neck base, neck radius, atlas, head and crown: the neck prior's affine
 *   axis and tape radius (`AutoMovieHumanNeckSource`) and the head's landmark
 *   layout (`AutoMovieHumanHeadLandmarks.layout`), the head joint on the
 *   cranial centre at the tragion's published drop under the vertex. These
 *   are the values the detailed head lane publishes.
 * - Jaw and eyes: the same layout's median profile at the nasion and its eye
 *   openings, by the rule of `AutoMovieHumanHeadLane.prepare`.
 * - Shoulders and arms: the acromion and the glenohumeral centre of
 *   `AutoMovieHumanShoulderDatum`, its neck support the neck's tape radius
 *   at the neck base. The detailed figure reads the support from its solved
 *   neck-base course instead, which moves the glenohumeral centre by a few
 *   hundredths of a millimetre at most on the motion population.
 * - Spine, chest and the sternoclavicular joints' forward place: on the
 *   straight line from the mid-hip to the neck base, at the heights the
 *   skeleton law already gives them. This is the polygon man's own
 *   definition of its trunk joints, directed by the project owner: no
 *   published source in the package gives the vertebral column's forward
 *   place at these levels, and the detailed figure's column axis, the middle
 *   of its converged sections' depth, belongs to that figure's surface. The
 *   line is the simplest construction through the two joints the skeleton
 *   level does place.
 */
export namespace AutoMovieHumanCanonicalBind {
  /** The bind joints with the stature they are scaled by. */
  export interface IOutput {
    /** Parent-before-child bones, calibration mm. */
    bones: IAutoMovieHumanCalibrationBone[];

    /** Stature in the same calibration mm. */
    stature: number;
  }

  /**
   * Place every bind joint of a person's polygon man.
   *
   * The cost is fixed-size arithmetic: the limb and head input conversions,
   * four harmonic neck rows, one landmark layout and the skeleton law.
   *
   * @param params The Human's parameters.
   * @returns The bones and their stature.
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
    };
  }
}

/*
 * A point in calibration mm.
 */
type Vec3 = AutoMovieVector3Tuple;
