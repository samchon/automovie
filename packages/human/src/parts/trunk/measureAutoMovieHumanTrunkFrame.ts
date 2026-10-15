import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanLandmarks } from "../../measure/IAutoMovieHumanLandmarks";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { curveAutoMovieHumanTrunk } from "./curveAutoMovieHumanTrunk";

/**
 * Trunk levels from ANSUR II mean heights (Gordon et al. 2014, NATICK/TR-15/007; our fractions of the working databases' means, women and men pooled because the identity carries no sex). Grade: derived.
 *
 * - `crotch`: crotch height below the hip joint centre as a fraction of hip height, (848 - 782) / 848 women and (904 - 846) / 904 men.
 * - `buttock`: buttock height over hip height, 834 / 848 and 888 / 904.
 * - `tenthRib`: tenth rib height as a fraction of the mid-hip to cervicale span, 0.380 and 0.354.
 * - `chestPoint`: chest height on the same span, 0.591 (the bust) and 0.631.
 */
const ANSUR_LEVEL: Record<
  "crotch" | "buttock" | "tenthRib" | "chestPoint",
  number
> = {
  crotch: 0.071,
  buttock: 0.982,
  tenthRib: 0.367,
  chestPoint: 0.611,
};

/**
 * Levels with no measured height, as fractions of stature from a measured one. The gluteal furrow lies a little below the crotch, where the thigh circumference is taken; the inframammary fold and the pectoral's lower border lie below the chest point. Conventional, checked on renders against Richer (1890, "Anatomie artistique", plates of the trunk's exterior forms).
 */
const CONVENTIONAL_LEVEL: Record<"gluteal" | "fold", number> = {
  gluteal: 0.012,
  fold: 0.028,
};

/**
 * The least share of the way from the natural waist up to the chest point the underbust level keeps, so it stays between them in a body whose narrowest level, the natural waist, lies high. Conventional.
 */
const UNDERBUST_SHARE: number = 0.5;

/**
 * Body fat percentage at which relief is fully shown and the span over which fat hides it; at 10% every muscle edge shows, past 32% none does. Conventional, judged on renders.
 */
const DEFINITION: Record<"lean" | "span", number> = { lean: 10, span: 22 };

/**
 * Appendicular lean mass index (kg/m²) below which no muscle relief is modelled, and the span that makes one unit of muscularity. NHANES means are 6.81 for women and 8.87 for men at 20 (Kelly et al. 2009, PLoS ONE 4(9):e7038), so an average woman reads about 0.26 and an average man 0.67. Conventional mapping onto measured means.
 */
const MUSCULARITY: Record<"floor" | "span", number> = { floor: 5.5, span: 5 };

/**
 * Resolve the trunk's frame for one side from the person's measurements and skeleton.
 *
 * Every point and level comes from the identity or the skeleton built from it, so the trunk follows the skeleton's posture: the column follows the spine joints' sagittal curve, the shoulders the clavicles, the hips the pelvis. Points of the right side are mirrored into the left side's frame.
 *
 * @param measurements Resolved measurements
 * @param skeleton The person's skeleton at rest
 * @param side Which side's points to read
 * @returns The frame, in the left side's frame
 */
export function measureAutoMovieHumanTrunkFrame(
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  side: AutoMovieHumanSide,
): IAutoMovieHumanTrunkFrame {
  const body: IAutoMovieHumanIdentity.IBody = measurements.identity.body;
  const composition: IAutoMovieHumanIdentity.IComposition =
    measurements.identity.composition;
  const landmarks: IAutoMovieHumanLandmarks = skeleton.landmarks;
  const lateral: IAutoMovieHumanLandmarks.ISide =
    side === "left" ? landmarks.left : landmarks.right;
  const mirror = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    side === "left" ? p : AutoMovieHumanVector.of(-p.x, p.y, p.z);
  const joint = (bone: string): IAutoMovieVector3 => {
    const found: IAutoMovieHumanSkeleton.IJoint | undefined =
      skeleton.joints.find(
        (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === bone,
      );
    if (found === undefined) throw new Error(`skeleton lacks ${bone}`);
    return found.position;
  };
  const arm: IAutoMovieHumanIdentity.IArm =
    side === "left" ? body.leftArm : body.rightArm;
  const leg: IAutoMovieHumanIdentity.ILeg =
    side === "left" ? body.leftLeg : body.rightLeg;
  const hip: IAutoMovieVector3 = mirror(joint(`${side}UpperLeg`));
  const hips: number = (joint("leftUpperLeg").y + joint("rightUpperLeg").y) / 2;
  const span: number = landmarks.cervicale.position.y - hips;
  const S: number = body.stature;
  const crotch: number = hips * (1 - ANSUR_LEVEL.crotch);
  const chestPoint: number = hips + ANSUR_LEVEL.chestPoint * span;
  const tenthRib: number = hips + ANSUR_LEVEL.tenthRib * span;
  const column: (y: number) => number = curveAutoMovieHumanTrunk(
    (["spine", "chest", "upperChest", "neck"] as const).map(
      (bone: string): [number, number] => {
        const p: IAutoMovieVector3 = joint(bone);
        return [p.y, p.z];
      },
    ),
  );
  return {
    stature: S,
    hip,
    shoulder: mirror(joint(`${side}UpperArm`)),
    acromion: mirror(lateral.acromion.position),
    clavicale: mirror(lateral.clavicale.position),
    iliospinale: mirror(lateral.iliospinale.position),
    iliocristale: mirror(lateral.iliocristale.position),
    trochanterion: mirror(lateral.trochanterion.position),
    suprasternale: landmarks.suprasternale.position,
    cervicale: landmarks.cervicale.position,
    levels: {
      crotch,
      gluteal: crotch - CONVENTIONAL_LEVEL.gluteal * S,
      buttock: hips * ANSUR_LEVEL.buttock,
      navel: joint("spine").y,
      waist: body.waistHeight,
      tenthRib,
      underbust: Math.max(
        chestPoint - CONVENTIONAL_LEVEL.fold * S,
        body.waistHeight + UNDERBUST_SHARE * (chestPoint - body.waistHeight),
      ),
      fold: chestPoint - CONVENTIONAL_LEVEL.fold * S,
      chestPoint,
      axilla: joint("upperChest").y,
    },
    column,
    chest: {
      girth: body.chestCircumference,
      breadth: body.chestBreadth,
      depth: body.chestDepth,
    },
    underbust: body.underbustCircumference,
    waist: {
      girth: body.waistCircumference,
      breadth: body.waistBreadth,
      depth: body.waistDepth,
    },
    buttock: {
      girth: body.buttockCircumference,
      breadth: body.hipBreadth,
      depth: body.buttockDepth,
    },
    thighGirth: leg.thighCircumference,
    armGirth: arm.upperArmCircumference,
    upperArmLength: arm.upperArmLength,
    deltoid: (body.bideltoidBreadth - body.biacromialBreadth) / 2,
    fat: composition.bodyFatPercentage,
    muscle: Math.max(
      0,
      (composition.appendicularLeanMassIndex - MUSCULARITY.floor) /
        MUSCULARITY.span,
    ),
    definition: Math.min(
      1,
      Math.max(
        0,
        (DEFINITION.lean + DEFINITION.span - composition.bodyFatPercentage) /
          DEFINITION.span,
      ),
    ),
  };
}
