import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanCalibrationBone,
  IAutoMovieHumanEyeSeat,
  IAutoMovieHumanFootBones,
  IAutoMovieHumanHandBones,
  IAutoMovieHumanHeadLane,
  IAutoMovieHumanLimbRest,
  IAutoMovieHumanSkeletonLaw,
} from "@automovie/interface";

import { AutoMovieHumanLimbRest } from "./AutoMovieHumanLimbRest";
import { AutoMovieHumanSkeletonChain } from "./AutoMovieHumanSkeletonChain";
import { AutoMovieHumanTrunkLandmarks } from "./AutoMovieHumanTrunkLandmarks";

/**
 * The bind skeleton, placed by rule before any limb is lofted, in calibration
 * millimetres (forward +X, up +Y, left +Z, floor at y = 0).
 *
 * The head lane publishes its own joint and eye references. The trunk's
 * defining landmarks place the spine, shoulders and sagittal hip datum. Limb
 * bones then come from public dimensions and their own pure laws:
 *
 * - Arm: ArmBones.place converts the public landmark lengths into joint centres
 *   on the shared bind directions, starting at the glenohumeral centre.
 * - Hand: HandBones places metacarpals and phalanges from hand dimensions and
 *   explicit measured ratios or conventions, without a meshed palm solve.
 * - Leg: `AutoMovieHumanLegBones`: the hip by Hara's lateral place under the
 *   body's defining sagittal axis, the knee on the hip-to-ankle line, and the
 *   ankle at the lateral malleolus under the stance.
 * - Foot and toes: the foot's own centres (`AutoMovieHumanFootBones.of`), the
 *   ankle at the person's lateral malleolus height, moved under the stance.
 *
 * The limbs' skins then read their joints from here, so the skeleton comes
 * before the skin. Rules marked as conventions in `docs/anatomy/joint-range.md`
 * have no measured source.
 */
export namespace AutoMovieHumanSkeletonLaw {
  /**
   * Preserve the existing bones-only reader while production consumes the
   * complete anatomical definition.
   *
   * @evidence contracts/common.md#principled-implementation Returns the bones of the same pure source definition.
   * @evidence contracts/common.md#clear-and-simple-design One wrapper retains the existing array contract.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No skin solve or second skeleton rule is introduced.
   * @evidence contracts/common.md#meaningful-documentation Names the complete source owner and the retained bones-only boundary.
   * @evidence contracts/performance.md#efficient-algorithms Delegates once to the fixed-size anatomy placement.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the actual definition result rather than deriving a parallel skeleton.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns call-owned bones and retains no source globally.
   */
  export function derive(
    root: IAutoMovieHumanBodyCalibration,
    inputs: IAutoMovieHumanSkeletonLaw.IInputs,
  ): IAutoMovieHumanCalibrationBone[] {
    return define(root, inputs).bones;
  }

  /**
   * Place every bone and retain the actual hand sources that own its joints.
   *
   * @param root Stature and the diagnostic sink; no source chain, event or pole
   *   is read.
   * @param inputs The limbs' inputs in calibration millimetres.
   * @returns Bones in parent-before-child order and their identical sided hand
   *   definitions.
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
    inputs: IAutoMovieHumanSkeletonLaw.IInputs,
  ): IAutoMovieHumanSkeletonLaw.IOutput {
    return complete(
      body(root, {
        ...inputs,
        neckBase: inputs.head.skeleton.neckBase,
        neckRadius: inputs.head.skeleton.neckRadius,
      }),
      inputs.head,
      root.stature,
    );
  }

  /**
   * Place only body-owned bones from public limb inputs and the common neck
   * datum.
   *
   * @evidence contracts/common.md#principled-implementation Uses the identical body placement rules as define, with a shared neck datum instead of a completed head or eye source.
   * @evidence contracts/common.md#clear-and-simple-design The common builder owns all body arithmetic; full define separately adds actual head-owned neck/atlas/head/jaw/eye bones.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No fake head/eyes, source readback, nominal zero joint, changed rest frame or copied pose replaces a dependency.
   * @evidence contracts/common.md#meaningful-documentation The result is the body-owned subset, not a completed whole-person skeleton or binding.
   * @evidence contracts/performance.md#efficient-algorithms Executes fixed-size anatomical vector work without head, curve, loft or mesh preparation.
   * @evidence contracts/performance.md#reuse-equivalent-work Both production and scoped originals use the same body builder and actual hand records.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned body bone/hand records and retains no parent source or global state.
   */
  export function body(
    root: Pick<IAutoMovieHumanBodyCalibration, "stature" | "diagnostics">,
    inputs: IAutoMovieHumanSkeletonLaw.IBodyInputs,
  ): IAutoMovieHumanSkeletonLaw.IOutput {
    return build(root, inputs);
  }

  /**
   * Add only actual head-owned bones to an existing body definition. The body's
   * bone objects and both hand/material records retain identity. Head bones
   * follow chest before its existing limb children, preserving the original
   * parent-before-child ordering and bind frame arithmetic.
   */
  export function complete(
    body: IAutoMovieHumanSkeletonLaw.IOutput,
    head: IAutoMovieHumanSkeletonLaw.IInputs["head"],
    S: number,
  ): IAutoMovieHumanSkeletonLaw.IOutput {
    const bones: IAutoMovieHumanCalibrationBone[] = [];
    const neckBase: AutoMovieVector3Tuple = head.skeleton.neckBase;
    const add: (
      bone: string,
      parent: string | null,
      position: AutoMovieVector3Tuple,
      toward: AutoMovieVector3Tuple,
      tip?: AutoMovieVector3Tuple | null,
    ) => void = (
      bone: string,
      parent: string | null,
      position: AutoMovieVector3Tuple,
      toward: AutoMovieVector3Tuple,
      tip: AutoMovieVector3Tuple | null = null,
    ): void => {
      bones.push({ bone, parent, position, toward, tip });
    };
    const { occiput, crown }: IAutoMovieHumanHeadLane.ISkeleton = head.skeleton;
    const atlas: AutoMovieVector3Tuple = lerp(neckBase, occiput, 0.85);
    add("neck", "chest", neckBase, atlas);
    add("atlas", "neck", atlas, occiput);
    add("head", "atlas", occiput, crown, crown);

    // Jaw and eyes (conventional facial placements, see the joint-range note).
    const eyes: IAutoMovieHumanEyeSeat[] = head.eyes;
    const eyeMid: AutoMovieVector3Tuple = [0, 1, 2].map(
      (i: number): number =>
        eyes.reduce(
          (a: number, e: IAutoMovieHumanEyeSeat): number => a + e.centre[i]!,
          0,
        ) / Math.max(1, eyes.length),
    ) as AutoMovieVector3Tuple;
    const tmj: AutoMovieVector3Tuple = [
      occiput[0] + 0.006 * S,
      occiput[1] + 0.008 * S,
      0,
    ];
    const chin: AutoMovieVector3Tuple = [eyeMid[0], eyeMid[1] - 0.068 * S, 0];
    add("jaw", "head", tmj, chin, chin);
    for (const eye of eyes) {
      const gaze: AutoMovieVector3Tuple = [
        eye.centre[0] + 0.03 * S,
        eye.centre[1],
        eye.centre[2],
      ];
      add(`${eye.side}Eye`, "head", eye.centre, gaze, gaze);
    }

    const index: number = body.bones.findIndex(
      (bone: IAutoMovieHumanCalibrationBone): boolean => bone.bone === "chest",
    );
    if (index < 0)
      throw new Error("Head completion requires the actual body chest bone");
    return {
      bones: [
        ...body.bones.slice(0, index + 1),
        ...bones,
        ...body.bones.slice(index + 1),
      ],
      hands: body.hands,
    };
  }

  /**
   * The shared body arithmetic; head and eye records are an explicit later
   * completion.
   */
  function build(
    root: Pick<IAutoMovieHumanBodyCalibration, "stature" | "diagnostics">,
    inputs: IAutoMovieHumanSkeletonLaw.IBodyInputs,
  ): IAutoMovieHumanSkeletonLaw.IOutput {
    const S: number = root.stature;
    const bones: IAutoMovieHumanCalibrationBone[] = [];
    const hands: IAutoMovieHumanSkeletonLaw.IOutput["hands"] =
      {} as IAutoMovieHumanSkeletonLaw.IOutput["hands"];
    const add: (
      bone: string,
      parent: string | null,
      position: AutoMovieVector3Tuple,
      toward: AutoMovieVector3Tuple,
      tip?: AutoMovieVector3Tuple | null,
    ) => void = (
      bone: string,
      parent: string | null,
      position: AutoMovieVector3Tuple,
      toward: AutoMovieVector3Tuple,
      tip: AutoMovieVector3Tuple | null = null,
    ): void => {
      bones.push({ bone, parent, position, toward, tip });
    };

    // Full bind publication consumes the same direct rest records as originals.
    const limbs: IAutoMovieHumanLimbRest.IOutput =
      inputs.limbs ??
      AutoMovieHumanLimbRest.create({
        stature: S,
        arms: inputs.arms,
        feet: inputs.feet,
        legs: inputs.legs,
        sex: inputs.sex,
        diagnostics: root.diagnostics ?? [],
        shoulder: (): IAutoMovieHumanLimbRest.IShoulder => inputs.trunk,
        hipForward: AutoMovieHumanTrunkLandmarks.axisAt(
          inputs.trunk,
          inputs.trunk.crotch,
        )[0],
      });
    const legs: Record<"left" | "right", IAutoMovieHumanLimbRest.ILeg> = {
      left: limbs.leg("left"),
      right: limbs.leg("right"),
    };

    // Trunk column: hip centres, de Leva trunk boundaries, neck base.
    const hipY: number = HIP * S;
    const pelvis: AutoMovieVector3Tuple = lerp(
      legs.left.hip,
      legs.right.hip,
      0.5,
    );
    const span: number = CERVICALE * S;

    // The trunk's generating sagittal definition owns the column's axis.
    function spineAt(y: number): AutoMovieVector3Tuple {
      return AutoMovieHumanTrunkLandmarks.axisAt(inputs.trunk, y);
    }
    const lumbar: AutoMovieVector3Tuple = spineAt(hipY + OMPHALION * span);
    const thoracic: AutoMovieVector3Tuple = spineAt(hipY + XIPHION * span);

    const neckBase: AutoMovieVector3Tuple = inputs.neckBase;
    const neckRadius: number = inputs.neckRadius;
    add("hips", null, pelvis, lumbar);
    add("spine", "hips", lumbar, thoracic);
    add("chest", "spine", thoracic, neckBase);

    for (const side of ["left", "right"] as const) {
      const s: 1 | -1 = side === "left" ? 1 : -1;
      const arm: IAutoMovieHumanLimbRest.IArm = limbs.arm(side);
      const hand: IAutoMovieHumanHandBones.IOutput = arm.hand;
      hands[side] = hand;
      const elbow: AutoMovieVector3Tuple = arm.bones.elbow;
      const wrist: AutoMovieVector3Tuple = arm.bones.wrist;
      const glenohumeral: AutoMovieVector3Tuple = arm.bones.shoulder;
      const sternoclavicular: AutoMovieVector3Tuple = [
        spineAt(glenohumeral[1])[0],
        glenohumeral[1],
        s * neckRadius * 0.5,
      ];
      const middle: AutoMovieVector3Tuple[] = hand.fingers.Middle.centres;
      add(`${side}Shoulder`, "chest", sternoclavicular, glenohumeral);
      add(`${side}Scapula`, `${side}Shoulder`, glenohumeral, elbow);
      add(`${side}UpperArm`, `${side}Scapula`, glenohumeral, elbow);
      add(`${side}LowerArm`, `${side}UpperArm`, elbow, wrist);
      add(`${side}Hand`, `${side}LowerArm`, wrist, middle[0]!);

      // Thumb: the carpometacarpal and metacarpophalangeal joints the hand's
      // anatomy places, the IP at its proximal phalanx's measured share.
      const [cmc, mcp, ip, thumbTip]: AutoMovieVector3Tuple[] =
        hand.thumb.centres;
      add(`${side}ThumbMetacarpal`, `${side}Hand`, cmc!, mcp!);
      add(`${side}ThumbProximal`, `${side}ThumbMetacarpal`, mcp!, ip!);
      add(
        `${side}ThumbDistal`,
        `${side}ThumbProximal`,
        ip!,
        thumbTip!,
        thumbTip!,
      );
      for (const name of ["Index", "Middle", "Ring", "Little"] as const) {
        const [mcp_, pip, dip, tip]: AutoMovieVector3Tuple[] =
          hand.fingers[name].centres;
        add(`${side}${name}Proximal`, `${side}Hand`, mcp_!, pip!);
        add(`${side}${name}Intermediate`, `${side}${name}Proximal`, pip!, dip!);
        add(
          `${side}${name}Distal`,
          `${side}${name}Intermediate`,
          dip!,
          tip!,
          tip!,
        );
      }

      // Leg, foot and the five toes, the foot moved under the stance.
      const own: IAutoMovieHumanLimbRest.ILeg = legs[side];
      function moved(p: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
        return [p[0] + own.shift[0], p[1], p[2] + own.shift[1]];
      }

      // The foot's own centres: the metatarsal heads and each toe's joints.
      const centres: IAutoMovieHumanFootBones.IBones = own.foot;
      const toes: AutoMovieVector3Tuple[][] = centres.toes.map(
        (t: AutoMovieVector3Tuple[]): AutoMovieVector3Tuple[] => t.map(moved),
      );
      const ball: AutoMovieVector3Tuple = moved(centres.ball);
      const midfoot: AutoMovieVector3Tuple = lerp(own.ankle, ball, 0.4);
      add(`${side}UpperLeg`, "hips", own.hip, own.knee);
      add(`${side}LowerLeg`, `${side}UpperLeg`, own.knee, own.ankle);
      add(`${side}Foot`, `${side}LowerLeg`, own.ankle, ball);
      add(`${side}Subtalar`, `${side}Foot`, own.ankle, midfoot);
      add(`${side}Midfoot`, `${side}Subtalar`, midfoot, ball);
      toes.forEach((t: AutoMovieVector3Tuple[], i: number): void => {
        if (i === 0) {
          add(`${side}HalluxProximal`, `${side}Midfoot`, t[0]!, t[1]!);
          add(
            `${side}HalluxDistal`,
            `${side}HalluxProximal`,
            t[1]!,
            t[2]!,
            t[2]!,
          );
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
/** Fixed-size interpolation of the generating joint references. */
const { lerp }: typeof AutoMovieHumanSkeletonChain =
  AutoMovieHumanSkeletonChain;
/**
 * ANSUR II joint-centre stature fractions, sexes averaged
 * (`docs/anatomy/skeleton.md`): the hip, for the trunk column. The leg's own
 * joints come from `AutoMovieHumanLegBones`, which holds the knee's fraction.
 */
const HIP: number = 0.518;

/**
 * Mid-hip to cervicale as a fraction of stature, and de Leva's omphalion and
 * xiphion fractions of it.
 */
const CERVICALE: number = 0.3425;
const OMPHALION: number = 0.245;
const XIPHION: number = 0.617;
