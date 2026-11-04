import { AutoMovieHumanArmConstruction } from "./AutoMovieHumanArmConstruction";
import { AutoMovieHumanFootConstruction } from "./AutoMovieHumanFootConstruction";
import type { AutoMovieHumanLegConstruction } from "./AutoMovieHumanLegConstruction";
import { AutoMovieHumanTrunkLandmarks } from "./AutoMovieHumanTrunkLandmarks";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanSkeletonChain } from "./AutoMovieHumanSkeletonChain";
import { AutoMovieHumanSkeletonLeg } from "./AutoMovieHumanSkeletonLeg";
import { AutoMovieHumanSkeletonShoulder } from "./AutoMovieHumanSkeletonShoulder";
/**
 * The bind skeleton, placed by rule before any limb is lofted, in calibration
 * millimetres (forward +X, up +Y, left +Z, floor at y = 0).
 *
 * The body is generated from the top down: the head, the neck and the trunk
 * are the root, and the limbs hang from it. The skeleton stands in that root,
 * reading only its landmarks (the ear lobes, the eye globes and the crown, the
 * neck's ring, the trunk's sections, its shoulder and crotch rings) and the
 * feet made in their own frame, and places every limb by the limbs' own laws
 * from the public inputs:
 *
 * - Arm: the arm's walk turns at the elbow, and the hand's section at the wrist
 *   crease gives the wrist. The glenohumeral centre is the trunk's, under its
 *   shoulder point; absent, the shoulder stands one humerus above the elbow,
 *   the humerus `0.162 / 0.151` of the forearm (the ANSUR II joint-centre
 *   means of `docs/anatomy/skeleton.md`), where the deltoid's skin is one arm
 *   radius outside it.
 * - Hand: each digit's joints as the arm's construction stands it on its
 *   bones (the third metacarpal's head at de Leva's share of the hand, the
 *   others by their measured lengths from level bases, the thumb's from the
 *   trapezium; PIP, DIP and the thumb's IP at their measured shares).
 * - Leg: `AutoMovieHumanLegBones`: the hip by Hara's lateral place under the
 *   centre of the thigh's top section (the crotch ring read about the centre
 *   the leg prior puts beside it), the knee on the hip-to-ankle line, and the
 *   ankle at the lateral malleolus under the stance.
 * - Foot and toes: the foot's own centres (`AutoMovieHumanFootConstruction.bones`),
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

    /** The trunk's landmarks, left side; absent, the glenohumeral centre is read off the shoulders' skin. */
    trunk?: AutoMovieHumanTrunkLandmarks.ILandmarks;
  }

  /**
   * Place every bone.
   *
   * @param root Calibration holding the head, the neck (`head`), the trunk
   *   (`trunk`, `upper`) and their events, with no limb.
   * @param inputs The limbs' inputs in calibration millimetres.
   * @returns Bones in parent-before-child order, root first.
   */
  export function derive(
    root: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
  ): IBone[] {
    const S: number = root.stature;
    const footed: IAutoMovieHumanBodyCalibration =
      AutoMovieHumanFootConstruction.add(root, inputs.feet);
    const chain = (name: string): IAutoMovieHumanLoftChain => {
      const found: IAutoMovieHumanLoftChain | undefined = footed.chains.find(
        (c: IAutoMovieHumanLoftChain): boolean => c.name === name,
      );
      if (found === undefined)
        throw new Error(`The skeleton needs the ${name} chain`);
      return found;
    };
    const pole = (name: string): Vec3 => {
      const found: IAutoMovieHumanBodyCalibration.IPole | undefined =
        footed.poles.find(
          (p: IAutoMovieHumanBodyCalibration.IPole): boolean =>
            p.chain === name,
        );
      if (found === undefined)
        throw new Error(`The skeleton needs the ${name} pole`);
      return found.point;
    };
    const bones: IBone[] = [];
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
    const feet: Record<"left" | "right", AutoMovieHumanFootConstruction.IBones> =
      AutoMovieHumanFootConstruction.bones(inputs.feet);
    const legs: Record<"left" | "right", ILeg> = {
      left: leg(footed, inputs.legs, "left", feet.left.ankle[1]),
      right: leg(footed, inputs.legs, "right", feet.right.ankle[1]),
    };

    // Trunk column: hip centres, de Leva trunk boundaries, neck base.
    const trunk: IAutoMovieHumanLoftChain = chain("trunk");
    const upper: IAutoMovieHumanLoftChain = chain("upper");
    const hipY: number = HIP * S;
    const pelvis: Vec3 = lerp(legs.left.hip, legs.right.hip, 0.5);
    const span: number = CERVICALE * S;
    // The trunk publishes its column's axis from its landmarks; absent, the
    // axis is read off the trunk chain.
    const spineAt = (y: number): Vec3 =>
      inputs.trunk !== undefined ? AutoMovieHumanTrunkLandmarks.axisAt(inputs.trunk, y) : axis(trunk, y);
    const lumbar: Vec3 = spineAt(hipY + OMPHALION * span);
    const thoracic: Vec3 = spineAt(hipY + XIPHION * span);

    // The neck owns the ring it shares with the shoulders.
    const neck: IAutoMovieHumanLoftChain = chain("head");
    const neckBase: Vec3 = end(neck, "bottom");
    const lobe = (side: string): Vec3 =>
      end(chain(`ear.lobe.${side}`), "bottom");
    const occiput: Vec3 = lerp(lobe("left"), lobe("right"), 0.5);
    const neckRadius: number = girth(
      chain("head.lower"),
      neckBase[1] + (occiput[1] - neckBase[1]) / 3,
    );
    const atlas: Vec3 = lerp(neckBase, occiput, 0.85);
    const crown: Vec3 = pole("head.upper");

    add("hips", null, pelvis, lumbar);
    add("spine", "hips", lumbar, thoracic);
    add("chest", "spine", thoracic, neckBase);
    add("neck", "chest", neckBase, atlas);
    add("atlas", "neck", atlas, occiput);
    add("head", "atlas", occiput, crown, crown);

    // Jaw and eyes (conventional facial placements, see the joint-range note).
    const eyes: IAutoMovieHumanBodyCalibration.IEye[] = footed.eyes;
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

    const arms: Record<"left" | "right", AutoMovieHumanArmConstruction.IBones> =
      AutoMovieHumanArmConstruction.bones(footed, inputs.arms);
    for (const side of ["left", "right"] as const) {
      const s: number = side === "left" ? 1 : -1;

      // Shoulder girdle and arm.
      const bones_: AutoMovieHumanArmConstruction.IBones = arms[side];
      const elbow: Vec3 = bones_.elbow;
      const wrist: Vec3 = bones_.crease;
      // The trunk places the glenohumeral centre from its landmarks before
      // any skin (under the shoulder point, de Leva's share of the
      // acromion-radiale length); the right is the left's reflection.
      const glenohumeral: Vec3 =
        inputs.trunk !== undefined
          ? [inputs.trunk.glenohumeral[0], inputs.trunk.glenohumeral[1], s * inputs.trunk.glenohumeral[2]]
          : shoulder(
              upper,
              footed,
              side,
              elbow,
              (UPPER_ARM / FOREARM) * distance(elbow, wrist),
            );
      const sternoclavicular: Vec3 = [
        axis(upper, glenohumeral[1])[0],
        glenohumeral[1],
        s * neckRadius * 0.5,
      ];
      // A finger's joints are its bones', which the arm's construction stands
      // it on: the knuckle where its metacarpal ends, the PIP and DIP by its
      // phalanges' measured shares.
      const lines: AutoMovieHumanArmConstruction.IDigitLine[] = bones_.digits;
      const named = (name: string): AutoMovieHumanArmConstruction.IDigitLine =>
        lines.find(
          (l: AutoMovieHumanArmConstruction.IDigitLine): boolean =>
            l.name === name,
        )!;
      const middle: Vec3[] = named(`finger.${side}.middle`).joints;
      add(`${side}Shoulder`, "chest", sternoclavicular, glenohumeral);
      add(`${side}Scapula`, `${side}Shoulder`, glenohumeral, elbow);
      add(`${side}UpperArm`, `${side}Scapula`, glenohumeral, elbow);
      add(`${side}LowerArm`, `${side}UpperArm`, elbow, wrist);
      add(`${side}Hand`, `${side}LowerArm`, wrist, middle[0]!);

      // Thumb: the carpometacarpal and metacarpophalangeal joints the hand's
      // anatomy places, the IP at its proximal phalanx's measured share.
      const thumb: AutoMovieHumanArmConstruction.IDigitLine = named(
        `thumb.${side}`,
      );
      const cmc: Vec3 = bones_.thumb.cmc;
      const mcp: Vec3 = bones_.thumb.mcp;
      const ip: Vec3 = thumb.joints[1]!;
      add(`${side}ThumbMetacarpal`, `${side}Hand`, cmc, mcp);
      add(`${side}ThumbProximal`, `${side}ThumbMetacarpal`, mcp, ip);
      add(`${side}ThumbDistal`, `${side}ThumbProximal`, ip, thumb.tip, thumb.tip);
      for (const [name, key] of [
        ["Index", "index"],
        ["Middle", "middle"],
        ["Ring", "ring"],
        ["Little", "little"],
      ] as const) {
        const [mcp_, pip, dip, tip]: Vec3[] =
          key === "middle" ? middle : named(`finger.${side}.${key}`).joints;
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
    return bones;
  }
}

type Vec3 = AutoMovieHumanSkeletonChain.Vec3;
type ILeg = AutoMovieHumanSkeletonLeg.ILeg;
const { axis, distance, end, girth, lerp } = AutoMovieHumanSkeletonChain;
const { leg } = AutoMovieHumanSkeletonLeg;
const { shoulder } = AutoMovieHumanSkeletonShoulder;
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

/** ANSUR II women's upper arm and forearm joint-centre lengths as fractions of stature. */
const UPPER_ARM: number = 0.162;
const FOREARM: number = 0.151;
