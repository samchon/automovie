import type { AutoMovieHumanArmConstruction } from "./AutoMovieHumanArmConstruction";
import type { AutoMovieHumanFootConstruction } from "./AutoMovieHumanFootConstruction";
import type { AutoMovieHumanLegConstruction } from "./AutoMovieHumanLegConstruction";
import { AutoMovieHumanTrunkLandmarks } from "./AutoMovieHumanTrunkLandmarks";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanArmPrior } from "./AutoMovieHumanArmPrior";
import { AutoMovieHumanFootPrior } from "./AutoMovieHumanFootPrior";
import { AutoMovieHumanLegPrior } from "./AutoMovieHumanLegPrior";
import { AutoMovieHumanArmBones } from "./arm/AutoMovieHumanArmBones";
import { AutoMovieHumanFootBones } from "./foot/AutoMovieHumanFootBones";
import { AutoMovieHumanHandBones } from "./hand/AutoMovieHumanHandBones";
import { AutoMovieHumanLegBones } from "./leg/AutoMovieHumanLegBones";
import type { AutoMovieHumanHeadLane } from "./head/AutoMovieHumanHeadLane";
import type { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import { AutoMovieHumanSkeletonChain } from "./AutoMovieHumanSkeletonChain";
/**
 * The bind skeleton, placed by rule before any limb is lofted, in calibration
 * millimetres (forward +X, up +Y, left +Z, floor at y = 0).
 *
 * The head lane publishes its own joint and eye references. The trunk's
 * defining landmarks place the spine, shoulders and sagittal hip datum.
 * Limb bones then come from public dimensions and their own pure laws:
 *
 * - Arm: ArmBones.place converts the public landmark lengths into joint
 *   centres on the shared bind directions, starting at the glenohumeral centre.
 * - Hand: HandBones places metacarpals and phalanges from hand dimensions
 *   and explicit measured ratios or conventions, without a meshed palm solve.
 * - Leg: `AutoMovieHumanLegBones`: the hip by Hara's lateral place under the
 *   body's defining sagittal axis, the knee on the hip-to-ankle line, and the
 *   ankle at the lateral malleolus under the stance.
 * - Foot and toes: the foot's own centres (`AutoMovieHumanFootBones.of`),
 *   the ankle at the person's lateral malleolus height, moved under the stance.
 *
 * The limbs' skins then read their joints from here, so the skeleton comes
 * before the skin. Rules marked as conventions in `docs/anatomy/joint-range.md`
 * have no measured source.
 */
export namespace AutoMovieHumanSkeletonLaw {
  /** One bone of the bind skeleton. */
  export interface IBone {
    /** Bone id; humanoid names where the engine vocabulary has one. */
    bone: string;

    /** Parent bone, or null for the root `hips`. */
    parent: string | null;

    /** Joint centre in mm. */
    position: [number, number, number];

    /** Point the bone's segment points to at rest, defining its long axis, mm. */
    toward: [number, number, number];

    /** End of a leaf bone's drawn segment in mm, null for a bone whose children end it. */
    tip: [number, number, number] | null;
  }

  /** What the skeleton reads besides the root. */
  export interface IInputs {
    /** The arms' lengths, tapes and hands. */
    arms: AutoMovieHumanArmConstruction.IInputs;

    /** The feet's dimensions. */
    feet: AutoMovieHumanFootConstruction.IInputs;

    /** The legs' tapes and controls. */
    legs: AutoMovieHumanLegConstruction.IInputs;

    /** The trunk's defining landmarks, canonical left side. */
    trunk: AutoMovieHumanTrunkLandmarks.ILandmarks;

    /** The generating head lane's joint and eye references. */
    head: AutoMovieHumanHeadLane.IOutput;

    /** The resolved anatomical sex used by digit dimensions. */
    sex: AutoMovieHumanSex;
  }

  /** Bind bones and the identical pure hand records from which their joints were placed. */
  export interface IOutput {
    /** Parent-before-child bone records. */
    bones: IBone[];
    /** Actual sided joint/material-frame definitions, before any digit skin. */
    hands: Record<"left" | "right", AutoMovieHumanHandBones.IOutput>;
  }

  /**
   * Preserve the existing bones-only reader while production consumes the complete anatomical definition.
   * @evidence contracts/common.md#principled-implementation Returns the bones of the same pure source definition.
   * @evidence contracts/common.md#clear-and-simple-design One wrapper retains the existing array contract.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No skin solve or second skeleton rule is introduced.
   * @evidence contracts/common.md#meaningful-documentation Names the complete source owner and the retained bones-only boundary.
   * @evidence contracts/performance.md#efficient-algorithms Delegates once to the fixed-size anatomy placement.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the actual definition result rather than deriving a parallel skeleton.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns call-owned bones and retains no source globally.
   */
  export function derive(root: IAutoMovieHumanBodyCalibration, inputs: IInputs): IBone[] {
    return define(root, inputs).bones;
  }

  /**
   * Place every bone and retain the actual hand sources that own its joints.
   *
   * @param root Stature and the diagnostic sink; no source chain, event or pole is read.
   * @param inputs The limbs' inputs in calibration millimetres.
   * @returns Bones in parent-before-child order and their identical sided hand definitions.
   * @evidence contracts/common.md#principled-implementation Uses generating head/trunk references and pure limb anatomy before skin, retaining each hand's actual material frame beside its bind joints.
   * @evidence contracts/common.md#clear-and-simple-design One anatomical record supplies both skeleton and original body-curve consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No polygon/ray/skin readback or normal reconstructed from already flexed phalanges places a hand.
   * @evidence contracts/common.md#meaningful-documentation Separates calibration units, joint definitions, bind conventions and retained source material directions.
   * @evidence contracts/performance.md#efficient-algorithms Places a fixed anatomical manifest with fixed-size vector arithmetic and source lookups.
   * @evidence contracts/performance.md#reuse-equivalent-work The same hand records produce bind joints and the ten digit source definitions.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns owned bones and source records without a global cache or retained calibration.
   */
  export function define(
    root: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
  ): IOutput {
    const S: number = root.stature;
    const bones: IBone[] = [];
    const hands: IOutput["hands"] = {} as IOutput["hands"];
    const add = (
      bone: string,
      parent: string | null,
      position: Vec3,
      toward: Vec3,
      tip: Vec3 | null = null,
    ): void => {
      bones.push({ bone, parent, position, toward, tip });
    };

    // The legs' lines, first: the hips stand on them.
    const feet: Record<"left" | "right", AutoMovieHumanFootBones.IBones> = {
      left: AutoMovieHumanFootBones.of(inputs.feet.left, 1).bones,
      right: AutoMovieHumanFootBones.of(inputs.feet.right, -1).bones,
    };
    const hipForward: number = AutoMovieHumanTrunkLandmarks.axisAt(inputs.trunk, inputs.trunk.crotch)[0];
    const legs: Record<"left" | "right", ILeg> = {
      left: leg(S, inputs.legs, "left", feet.left.ankle[1], hipForward),
      right: leg(S, inputs.legs, "right", feet.right.ankle[1], hipForward),
    };

    // Trunk column: hip centres, de Leva trunk boundaries, neck base.
    const hipY: number = HIP * S;
    const pelvis: Vec3 = lerp(legs.left.hip, legs.right.hip, 0.5);
    const span: number = CERVICALE * S;
    // The trunk's generating sagittal definition owns the column's axis.
    const spineAt = (y: number): Vec3 =>
      AutoMovieHumanTrunkLandmarks.axisAt(inputs.trunk, y);
    const lumbar: Vec3 = spineAt(hipY + OMPHALION * span);
    const thoracic: Vec3 = spineAt(hipY + XIPHION * span);

    // These points belong to the head lane's actual generating definition.
    const { neckBase, occiput, neckRadius, crown }: AutoMovieHumanHeadLane.ISkeleton = inputs.head.skeleton;
    const atlas: Vec3 = lerp(neckBase, occiput, 0.85);

    add("hips", null, pelvis, lumbar);
    add("spine", "hips", lumbar, thoracic);
    add("chest", "spine", thoracic, neckBase);
    add("neck", "chest", neckBase, atlas);
    add("atlas", "neck", atlas, occiput);
    add("head", "atlas", occiput, crown, crown);

    // Jaw and eyes (conventional facial placements, see the joint-range note).
    const eyes: IAutoMovieHumanBodyCalibration.IEye[] = inputs.head.eyes;
    const eyeMid: Vec3 = [0, 1, 2].map(
      (i: number): number =>
        eyes.reduce(
          (a: number, e: IAutoMovieHumanBodyCalibration.IEye): number =>
            a + e.centre[i]!,
          0,
        ) / Math.max(1, eyes.length),
    ) as Vec3;
    const tmj: Vec3 = [occiput[0] + 0.006 * S, occiput[1] + 0.008 * S, 0];
    const chin: Vec3 = [eyeMid[0], eyeMid[1] - 0.068 * S, 0];
    add("jaw", "head", tmj, chin, chin);
    for (const eye of eyes) {
      const gaze: Vec3 = [eye.centre[0] + 0.03 * S, eye.centre[1], eye.centre[2]];
      add(`${eye.side}Eye`, "head", eye.centre, gaze, gaze);
    }

    for (const side of ["left", "right"] as const) {
      const s: 1 | -1 = side === "left" ? 1 : -1;
      const reflected = (point: Vec3): Vec3 => [point[0], point[1], s * point[2]];
      const prior: AutoMovieHumanArmPrior.IArm = AutoMovieHumanArmPrior.PRIOR.arm;
      const bones_: AutoMovieHumanArmBones.IBones = AutoMovieHumanArmBones.place(inputs.trunk.glenohumeral, unit(prior.upper), unit(prior.lower), inputs.arms.upper, inputs.arms.lower, inputs.trunk.shoulder[1] - inputs.trunk.glenohumeral[1]);
      const hand: AutoMovieHumanHandBones.IOutput = AutoMovieHumanHandBones.sided(AutoMovieHumanHandBones.of(bones_.wrist, inputs.arms[side], inputs.sex, inputs.arms.scale, root.diagnostics ?? []), s);
      hands[side] = hand;
      const elbow: Vec3 = reflected(bones_.elbow);
      const wrist: Vec3 = reflected(bones_.wrist);
      const glenohumeral: Vec3 = reflected(bones_.shoulder);
      const sternoclavicular: Vec3 = [
        spineAt(glenohumeral[1])[0],
        glenohumeral[1],
        s * neckRadius * 0.5,
      ];
      const middle: Vec3[] = hand.fingers.Middle.centres;
      add(`${side}Shoulder`, "chest", sternoclavicular, glenohumeral);
      add(`${side}Scapula`, `${side}Shoulder`, glenohumeral, elbow);
      add(`${side}UpperArm`, `${side}Scapula`, glenohumeral, elbow);
      add(`${side}LowerArm`, `${side}UpperArm`, elbow, wrist);
      add(`${side}Hand`, `${side}LowerArm`, wrist, middle[0]!);

      // Thumb: the carpometacarpal and metacarpophalangeal joints the hand's
      // anatomy places, the IP at its proximal phalanx's measured share.
      const [cmc, mcp, ip, thumbTip]: Vec3[] = hand.thumb.centres;
      add(`${side}ThumbMetacarpal`, `${side}Hand`, cmc!, mcp!);
      add(`${side}ThumbProximal`, `${side}ThumbMetacarpal`, mcp!, ip!);
      add(`${side}ThumbDistal`, `${side}ThumbProximal`, ip!, thumbTip!, thumbTip!);
      for (const name of ["Index", "Middle", "Ring", "Little"] as const) {
        const [mcp_, pip, dip, tip]: Vec3[] =
          hand.fingers[name].centres;
        add(`${side}${name}Proximal`, `${side}Hand`, mcp_!, pip!);
        add(`${side}${name}Intermediate`, `${side}${name}Proximal`, pip!, dip!);
        add(`${side}${name}Distal`, `${side}${name}Intermediate`, dip!, tip!, tip!);
      }

      // Leg, foot and the five toes, the foot moved under the stance.
      const own: ILeg = legs[side];
      const moved = (p: Vec3): Vec3 => [
        p[0] + own.shift[0],
        p[1],
        p[2] + own.shift[1],
      ];
      // The foot's own centres: the metatarsal heads and each toe's joints.
      const centres: AutoMovieHumanFootConstruction.IBones = feet[side];
      const toes: Vec3[][] = centres.toes.map((t: Vec3[]): Vec3[] => t.map(moved));
      const ball: Vec3 = moved(centres.ball);
      const midfoot: Vec3 = lerp(own.ankle, ball, 0.4);
      add(`${side}UpperLeg`, "hips", own.hip, own.knee);
      add(`${side}LowerLeg`, `${side}UpperLeg`, own.knee, own.ankle);
      add(`${side}Foot`, `${side}LowerLeg`, own.ankle, ball);
      add(`${side}Subtalar`, `${side}Foot`, own.ankle, midfoot);
      add(`${side}Midfoot`, `${side}Subtalar`, midfoot, ball);
      toes.forEach((t: Vec3[], i: number): void => {
        if (i === 0) {
          add(`${side}HalluxProximal`, `${side}Midfoot`, t[0]!, t[1]!);
          add(`${side}HalluxDistal`, `${side}HalluxProximal`, t[1]!, t[2]!, t[2]!);
          return;
        }
        const n: string = `${side}Toe${i + 1}`;
        add(`${n}Proximal`, `${side}Midfoot`, t[0]!, t[1]!);
        add(`${n}Intermediate`, `${n}Proximal`, t[1]!, t[2]!);
        add(`${n}Distal`, `${n}Intermediate`, t[2]!, t[3]!, t[3]!);
      });
    }
    return { bones, hands };
  }
}

type Vec3 = AutoMovieHumanSkeletonChain.Vec3;
/** The leg joints and translation from the foot's own ankle origin. */
type ILeg = Pick<AutoMovieHumanLegBones.IBones, "hip" | "knee" | "ankle"> & { shift: [number, number] };
/** Fixed-size interpolation of the generating joint references. */
const { lerp }: typeof AutoMovieHumanSkeletonChain = AutoMovieHumanSkeletonChain;
/**
 * ANSUR II joint-centre stature fractions, sexes averaged
 * (`docs/anatomy/skeleton.md`): the hip, for the trunk column. The leg's own
 * joints come from `AutoMovieHumanLegBones`, which holds the knee's fraction.
 */
const HIP: number = 0.518;

/** Mid-hip to cervicale as a fraction of stature, and de Leva's omphalion and xiphion fractions of it. */
const CERVICALE: number = 0.3425;
const OMPHALION: number = 0.245;
const XIPHION: number = 0.617;

/** Place one leg without reading a crotch polygon or an ankle ring. */
function leg(stature: number, inputs: AutoMovieHumanLegConstruction.IInputs, side: "left" | "right", ankleHeight: number, hipForward: number): ILeg {
  const sign: number = side === "left" ? 1 : -1;
  const prior: AutoMovieHumanLegPrior.IAnkle = AutoMovieHumanLegPrior.PRIOR.ankle;
  const ankleForward: number = (prior.offset + prior.fat * inputs.fat + prior.muscularity * inputs.muscularity) * inputs.scale;
  const joints: AutoMovieHumanLegBones.IBones = AutoMovieHumanLegBones.of({ stature, scale: inputs.scale, ankleHeight, medial: AutoMovieHumanFootPrior.PRIOR.malleoli.medial.height, hipForward, ankleForward });
  const reflect = (point: Vec3): Vec3 => [point[0], point[1], sign * point[2]];
  return { hip: reflect(joints.hip), knee: reflect(joints.knee), ankle: reflect(joints.ankle), shift: [joints.ankle[0], sign * joints.ankle[2]] };
}

/** Normalize the shared observed bind directions without retaining a skin law. */
function unit(direction: readonly number[]): Vec3 {
  const length: number = Math.hypot(...direction);
  if (!(length > 0)) throw new Error("An arm bind direction must have positive length");
  return [direction[0]! / length, direction[1]! / length, direction[2]! / length];
}
