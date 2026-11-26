import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanArmConstruction,
  IAutoMovieHumanArmLaw,
  IAutoMovieHumanArmLawInputs,
  IAutoMovieHumanArmPrior,
  IAutoMovieHumanArmScye,
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanCalibrationBone,
  IAutoMovieHumanHandConstruction,
  IAutoMovieHumanHandForm,
  IAutoMovieHumanHandMeasures,
  IAutoMovieHumanHandScales,
  IAutoMovieHumanNailWindow,
  IAutoMovieHumanSurfacePole,
  IAutoMovieLoftChain,
} from "@automovie/interface";

import { AutoMovieHumanArmPrior } from "./AutoMovieHumanArmPrior";
import { AutoMovieHumanArmBones } from "./arm/AutoMovieHumanArmBones";
import { AutoMovieHumanArmLaw } from "./arm/AutoMovieHumanArmLaw";
import { AutoMovieHumanArmLayers } from "./arm/AutoMovieHumanArmLayers";
import { AutoMovieHumanArmScye } from "./arm/AutoMovieHumanArmScye";
import { AutoMovieHumanArmShoulder } from "./arm/AutoMovieHumanArmShoulder";
import { AutoMovieHumanHandConstruction } from "./hand/AutoMovieHumanHandConstruction";
import { AutoMovieHumanHandEvents } from "./hand/AutoMovieHumanHandEvents";
import { AutoMovieHumanHandForm } from "./hand/AutoMovieHumanHandForm";
import { AutoMovieHumanHandSide } from "./hand/AutoMovieHumanHandSide";

const { events }: typeof AutoMovieHumanHandEvents = AutoMovieHumanHandEvents;
const { sided }: typeof AutoMovieHumanHandSide = AutoMovieHumanHandSide;

/**
 * Both arms and hands composed from their pieces, by one construction on the
 * left side and a reflection, each part lofted in its own bone frame. This
 * file only composes.
 *
 * The arm's law (`AutoMovieHumanArmLaw`) stands the bones on the glenohumeral
 * centre the trunk's shoulders give (`AutoMovieHumanArmShoulder`), walks them
 * and builds the tube of the arm's spans about the walk; its section planes run
 * from the hand's heel to the trunk's level ring, the arm's scye
 * (`AutoMovieHumanArmScye`), and the chain is cut by them
 * (`AutoMovieHumanArmLayers`). The skeleton reads the elbow and crease of the
 * same law ({@link bones}), and the arm is then lofted on the skeleton, its
 * bones moved so the elbow centre stands at the skeleton's elbow.
 *
 * The hand is composed by its own pieces (`AutoMovieHumanHandConstruction`):
 * its form's crease centre stands on the forearm's wrist, its heel from the
 * crease to the thumb's branch is its own piece (`AutoMovieHumanHandHeel`), and
 * its scales are solved at their measures' sites with the arm rebuilt for every
 * scale it tries. Reflection reverses phase: the right side's point at phase t
 * is the mirror of the left's at -t, and its frames are the mirror of the
 * left's with `v` turned over.
 */
export namespace AutoMovieHumanArmConstruction {
  /** Chains an arm owns. */
  const OWNED: RegExp = /^(arm|hand|thumb|finger)\./;

  /**
   * The latest hand builds by the arm's placement: the skeleton reads the
   * bones and the arms are lofted on the skeleton's elbow, which is the bones'
   * own, so both read one solve of the hand.
   */
  const BUILT: Map<
    string,
    IAutoMovieHumanHandConstruction.IBuilt<IAutoMovieHumanArmLaw>
  > = new Map();

  /** Builds kept: both sides of one person. */
  const KEPT: number = 2;

  /**
   * Calibration with both arms and hands, their events and poles added.
   *
   * @param calibration Calibration holding the trunk's shoulders.
   * @param inputs Lengths and tapes in calibration millimetres.
   * @param skeleton The bind skeleton the arms are lofted on: each arm's bones
   *   are moved so its elbow centre stands at the skeleton's elbow. Absent,
   *   they stand on the glenohumeral centre.
   * @returns The calibration with the arms and hands.
   */
  export function add(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IAutoMovieHumanArmConstruction.IInputs,
    skeleton?: readonly IAutoMovieHumanCalibrationBone[],
  ): IAutoMovieHumanBodyCalibration {
    const limbs: ILimb[] = (["left", "right"] as const).map(
      (side: "left" | "right"): ILimb =>
        limb(calibration, inputs, side, skeleton),
    );

    return {
      ...calibration,
      chains: [
        ...calibration.chains,
        ...limbs.flatMap((l: ILimb): IAutoMovieLoftChain[] => l.chains),
      ],
      events: [...calibration.events, ...events()],
      poles: [
        ...calibration.poles,
        ...limbs.flatMap((l: ILimb): IAutoMovieHumanSurfacePole[] => l.poles),
      ],
      nails: [
        ...(calibration.nails ?? []),
        ...limbs.flatMap((l: ILimb): IAutoMovieHumanNailWindow[] => l.nails),
      ],
    };
  }

  /**
   * Whether a chain belongs to an arm.
   *
   * @param name Chain name.
   * @returns Whether the arm's construction owns it.
   */
  export function owns(name: string): boolean {
    return OWNED.test(name);
  }

  /**
   * Hand measures of a person whose hands are not measured, world
   * millimetres: lines in `[1, stature, hand tape]`.
   *
   * @param stature Stature, mm.
   * @param tape Hand tape, mm.
   * @param scale Calibration millimetres per world millimetre.
   * @returns The hand's measures.
   */
  export function expected(
    stature: number,
    tape: number,
    scale: number,
  ): IAutoMovieHumanHandMeasures {
    const line = (w: readonly number[]): number =>
      (w[0]! + w[1]! * stature + w[2]! * tape) * scale;
    const prior: IAutoMovieHumanArmPrior.IExpected =
      AutoMovieHumanArmPrior.PRIOR.expected;

    return {
      length: line(prior.length),
      palm: line(prior.palm),
      breadth: line(prior.breadth),
      thumb: line(prior.thumb),
    };
  }

  /**
   * Both arms' bone landmarks from the shoulder rings and the inputs, before
   * the arms are lofted: the same law, crease, joints and digit lines the skin
   * is built on.
   *
   * @param calibration Calibration holding `upper` and its event.
   * @param inputs Lengths in calibration millimetres.
   * @returns Each side's landmarks.
   */
  export function bones(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IAutoMovieHumanArmConstruction.IInputs,
  ): Record<"left" | "right", IAutoMovieHumanArmConstruction.IBones> {
    return {
      left: limb(calibration, inputs, "left", undefined, false).bones,
      right: limb(calibration, inputs, "right", undefined, false).bones,
    };
  }

  /** One side's chains, poles and bone landmarks. */
  interface ILimb {
    /** The arm's, palm's and digits' chains. */
    chains: IAutoMovieLoftChain[];

    /** The digits' poles. */
    poles: IAutoMovieHumanSurfacePole[];

    /** The digits' nail plates. */
    nails: IAutoMovieHumanNailWindow[];

    /** The bone landmarks. */
    bones: IAutoMovieHumanArmConstruction.IBones;
  }

  /**
   * One side: the law and the hand in the left frame, and from them the
   * chains in their bone frames, the poles and the landmarks, reflected for the
   * right side.
   *
   * @param calibration Calibration holding the shoulders.
   * @param inputs Lengths and tapes.
   * @param side Side.
   * @param skeleton The bind skeleton, if any.
   * @param lofted Whether to build the chains; the skeleton needs only bones.
   * @returns The side's chains, poles and landmarks.
   */
  function limb(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IAutoMovieHumanArmConstruction.IInputs,
    side: "left" | "right",
    skeleton?: readonly IAutoMovieHumanCalibrationBone[],
    lofted: boolean = true,
  ): ILimb {
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const ring: IAutoMovieHumanArmScye.IRing = AutoMovieHumanArmScye.of(
      calibration,
      side,
    );
    const elbow: AutoMovieVector3Tuple | undefined = elbowOf(
      skeleton,
      side,
      sign,
    );

    // The arm stands on the trunk's glenohumeral centre, the one the
    // shoulders' arm arc is built about, so the arm's tube and the arc share
    // their axis; a calibration without a generated trunk reads it off the
    // shoulders' skin.
    const centre: AutoMovieVector3Tuple =
      calibration.trunk !== undefined
        ? [...calibration.trunk.glenohumeral]
        : sided(
            AutoMovieHumanArmShoulder.glenohumeral(
              calibration,
              side,
              inputs.upper,
            ),
            sign,
          );
    const form: IAutoMovieHumanHandForm = AutoMovieHumanHandForm.form();
    const lawInputs: IAutoMovieHumanArmLawInputs.IInputs = {
      ...inputs,
      acromionProjection:
        calibration.trunk === undefined
          ? AutoMovieHumanArmBones.ACROMION * inputs.upper
          : calibration.trunk.shoulder[1] - calibration.trunk.glenohumeral[1],
    };
    const placed: AutoMovieVector3Tuple = AutoMovieHumanArmLaw.centreOf(
      centre,
      lawInputs,
      elbow,
    );
    const laws: Map<string, IAutoMovieHumanArmLaw> = new Map();
    const key: string = JSON.stringify([
      side,
      inputs[side],
      inputs.circumference,
      inputs.wrist,
      inputs.scale,
      inputs.upper,
      inputs.lower,
      inputs.bicep,
      inputs.elbow,
      inputs.forearm,
      lawInputs.acromionProjection,
      placed,
      ring.centre,
      ring.radius,
    ]);

    // The hand is composed by its own pieces; the arm it grows out of is
    // built for every set of scales the hand's solve tries, since the crease
    // stands on the tube's wrist whatever the scales. One lofted build per
    // placement serves the skeleton's bones and the lofted arm.
    const built: IAutoMovieHumanHandConstruction.IBuilt<IAutoMovieHumanArmLaw> =
      BUILT.get(key) ??
      remember(
        key,
        AutoMovieHumanHandConstruction.build<IAutoMovieHumanArmLaw>({
          calibration,
          side,
          given: inputs[side],
          circumference: inputs.circumference,
          wristTape: inputs.wrist,
          makeArm: (m: IAutoMovieHumanHandScales): IAutoMovieHumanArmLaw => {
            // Every solve starts from the same scales and the skin target
            // rounds repeat them: one law per set of scales.
            const known: string = JSON.stringify(m);
            const found: IAutoMovieHumanArmLaw | undefined = laws.get(known);
            if (found !== undefined) return found;
            const law: IAutoMovieHumanArmLaw = AutoMovieHumanArmLaw.of(
              ring,
              lawInputs,
              m,
              form,
              placed,
            );
            laws.set(known, law);
            return law;
          },
          // The skin targets are lengths of the hand's own section, which a
          // reflection keeps: one side's measurement serves the other's mirror
          // image, so their key leaves the side out and the lateral sign of
          // the placement with it.
          key: JSON.stringify([
            inputs[side],
            inputs.circumference,
            inputs.wrist,
            inputs.scale,
            inputs.upper,
            inputs.lower,
            inputs.bicep,
            inputs.elbow,
            inputs.forearm,
            lawInputs.acromionProjection,
            [placed[0], placed[1], Math.abs(placed[2])],
            [ring.centre[0], ring.centre[1], Math.abs(ring.centre[2])],
            ring.radius,
          ]),
          lofted: true,
        }),
      );
    const landmarks: IAutoMovieHumanArmConstruction.IBones = {
      elbow: sided(built.law.elbow, sign),
      crease: sided(built.law.crease, sign),
      length: built.measures.length,
      thumb: built.thumb,
      digits: built.lines,
    };
    if (!lofted) return { chains: [], poles: [], nails: [], bones: landmarks };

    return {
      chains: [
        AutoMovieHumanArmLayers.of(built.law, side, sign),
        ...built.digits.slice(0, 1),
        built.palm!,
        ...built.digits.slice(1),
      ],
      poles: built.poles,
      nails: built.nails,
      bones: landmarks,
    };
  }

  /**
   * Keep a build, the oldest dropped past `KEPT`.
   *
   * @param key The build's placement key.
   * @param built The build.
   * @returns The build.
   */
  function remember(
    key: string,
    built: IAutoMovieHumanHandConstruction.IBuilt<IAutoMovieHumanArmLaw>,
  ): IAutoMovieHumanHandConstruction.IBuilt<IAutoMovieHumanArmLaw> {
    BUILT.set(key, built);
    while (BUILT.size > KEPT) BUILT.delete(BUILT.keys().next().value!);
    return built;
  }

  /**
   * A side's elbow from a skeleton, in the left frame.
   *
   * @param skeleton The bind skeleton, if any.
   * @param side Side.
   * @param sign 1 for the left, -1 for the right.
   * @returns The elbow, or undefined without a skeleton.
   */
  function elbowOf(
    skeleton: readonly IAutoMovieHumanCalibrationBone[] | undefined,
    side: "left" | "right",
    sign: 1 | -1,
  ): AutoMovieVector3Tuple | undefined {
    if (skeleton === undefined) return undefined;
    const bone: IAutoMovieHumanCalibrationBone | undefined = skeleton.find(
      (b: IAutoMovieHumanCalibrationBone): boolean =>
        b.bone === `${side}LowerArm`,
    );
    if (bone === undefined)
      throw new Error(`The skeleton lacks the ${side} elbow`);
    return sided(bone.position, sign);
  }
}
