import type { IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanArmPrior } from "./AutoMovieHumanArmPrior";
import type { AutoMovieHumanSkeletonLaw } from "./AutoMovieHumanSkeletonLaw";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanArmLaw } from "./arm/AutoMovieHumanArmLaw";
import { AutoMovieHumanArmBones } from "./arm/AutoMovieHumanArmBones";
import { AutoMovieHumanArmLayers } from "./arm/AutoMovieHumanArmLayers";
import { AutoMovieHumanArmScye } from "./arm/AutoMovieHumanArmScye";
import { AutoMovieHumanArmShoulder } from "./arm/AutoMovieHumanArmShoulder";
import type { IAutoMovieHumanArmLaw } from "./arm/IAutoMovieHumanArmLaw";
import { AutoMovieHumanHandConstruction } from "./hand/AutoMovieHumanHandConstruction";
import { AutoMovieHumanHandEvents } from "./hand/AutoMovieHumanHandEvents";
import { AutoMovieHumanHandForm } from "./hand/AutoMovieHumanHandForm";
import { AutoMovieHumanHandSide } from "./hand/AutoMovieHumanHandSide";
import type { AutoMovieHumanHandVector } from "./hand/AutoMovieHumanHandVector";
import type { IAutoMovieHumanHandForm } from "./hand/IAutoMovieHumanHandForm";
import type { IAutoMovieHumanHandScales } from "./hand/IAutoMovieHumanHandScales";

type Vec3 = AutoMovieHumanHandVector.Vec3;
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
  /** One hand's measures, in the same millimetres as the calibration. */
  export interface IHand {
    /** Wrist to the tip of the middle finger. */
    length: number;

    /** Wrist to the root of the middle finger. */
    palm: number;

    /** Breadth across the palm. */
    breadth: number;

    /** Length of the thumb from its metacarpophalangeal joint. */
    thumb: number;
  }

  /** What an arm reads. */
  export interface IInputs {
    /** Upper arm length. */
    upper: number;

    /** Lower arm length. */
    lower: number;

    /** Biceps tape. */
    bicep: number;

    /** Elbow tape. */
    elbow: number;

    /** Forearm tape. */
    forearm: number;

    /** Wrist tape. */
    wrist: number;

    /** Hand tape. */
    circumference: number;

    /** Masculine-feminine control. */
    sex: number;

    /** Left hand. */
    left: IHand;

    /** Right hand. */
    right: IHand;

    /** Calibration millimetres per world millimetre. */
    scale: number;
  }

  /**
   * One side's bone landmarks by the arm's law, in world millimetres, before
   * any arm skin exists: what a skeleton stands its arm and hand on.
   */
  export interface IBones {
    /** The elbow centre. */
    elbow: Vec3;

    /**
     * Centre of the hand's section at the wrist crease. Hand length runs from
     * the crease, and the hand's origin-to-tip measure is `lengthRatio` of it,
     * so the crease lies the rest of that length behind the origin.
     */
    crease: Vec3;

    /** Hand length the hand was made to, from the crease. */
    length: number;

    /** The thumb's carpometacarpal and metacarpophalangeal joints. */
    thumb: { cmc: Vec3; mcp: Vec3 };

    /** Each digit's centre line from its web to its tip, thumb first. */
    digits: IDigitLine[];
  }

  /** A digit's centre line. */
  export interface IDigitLine {
    /** Chain name. */
    name: string;

    /** Points of the digit's centre line from its root at the web to its tip. */
    line: Vec3[];

    /** The tip's apex. */
    tip: Vec3;

    /** The metacarpophalangeal joint, where the metacarpal ends. */
    joint: Vec3;

    /**
     * The digit's joints from its MCP to its tip: MCP, PIP, DIP and tip for a
     * finger, MCP, IP and tip for the thumb.
     */
    joints: Vec3[];
  }

  /** Chains an arm owns. */
  const OWNED: RegExp = /^(arm|hand|thumb|finger)\./;

  /**
   * The latest hand builds by the arm's placement: the skeleton reads the
   * bones and the arms are lofted on the skeleton's elbow, which is the bones'
   * own, so both read one solve of the hand.
   */
  const BUILT: Map<string, AutoMovieHumanHandConstruction.IBuilt<IAutoMovieHumanArmLaw>> = new Map();

  /** Builds kept: both sides of one person. */
  const KEPT: number = 2;

  /** One side's chains, poles and bone landmarks. */
  interface ILimb {
    /** The arm's, palm's and digits' chains. */
    chains: IAutoMovieLoftChain[];

    /** The digits' poles. */
    poles: IAutoMovieHumanBodyCalibration.IPole[];

    /** The digits' nail plates. */
    nails: IAutoMovieHumanBodyCalibration.INail[];

    /** The bone landmarks. */
    bones: IBones;
  }

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
    inputs: IInputs,
    skeleton?: readonly AutoMovieHumanSkeletonLaw.IBone[],
  ): IAutoMovieHumanBodyCalibration {
    const limbs: ILimb[] = (["left", "right"] as const).map((side: "left" | "right"): ILimb => limb(calibration, inputs, side, skeleton));

    return {
      ...calibration,
      chains: [...calibration.chains, ...limbs.flatMap((l: ILimb): IAutoMovieLoftChain[] => l.chains)],
      events: [...calibration.events, ...events()],
      poles: [...calibration.poles, ...limbs.flatMap((l: ILimb): IAutoMovieHumanBodyCalibration.IPole[] => l.poles)],
      nails: [...(calibration.nails ?? []), ...limbs.flatMap((l: ILimb): IAutoMovieHumanBodyCalibration.INail[] => l.nails)],
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
  export function expected(stature: number, tape: number, scale: number): IHand {
    const line = (w: readonly number[]): number => (w[0]! + w[1]! * stature + w[2]! * tape) * scale;
    const prior: AutoMovieHumanArmPrior.IExpected = AutoMovieHumanArmPrior.PRIOR.expected;

    return { length: line(prior.length), palm: line(prior.palm), breadth: line(prior.breadth), thumb: line(prior.thumb) };
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
  export function bones(calibration: IAutoMovieHumanBodyCalibration, inputs: IInputs): Record<"left" | "right", IBones> {
    return {
      left: limb(calibration, inputs, "left", undefined, false).bones,
      right: limb(calibration, inputs, "right", undefined, false).bones,
    };
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
    inputs: IInputs,
    side: "left" | "right",
    skeleton?: readonly AutoMovieHumanSkeletonLaw.IBone[],
    lofted: boolean = true,
  ): ILimb {
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const ring: AutoMovieHumanArmScye.IRing = AutoMovieHumanArmScye.of(calibration, side);
    const elbow: Vec3 | undefined = elbowOf(skeleton, side, sign);

    // The arm stands on the trunk's glenohumeral centre, the one the
    // shoulders' arm arc is built about, so the arm's tube and the arc share
    // their axis; a calibration without a generated trunk reads it off the
    // shoulders' skin.
    const centre: Vec3 =
      calibration.trunk !== undefined
        ? [...calibration.trunk.glenohumeral]
        : sided(AutoMovieHumanArmShoulder.glenohumeral(calibration, side, inputs.upper), sign);
    const form: IAutoMovieHumanHandForm = AutoMovieHumanHandForm.form();
    const lawInputs: AutoMovieHumanArmLaw.IInputs = { ...inputs, acromionProjection: calibration.trunk === undefined ? AutoMovieHumanArmBones.ACROMION * inputs.upper : calibration.trunk.shoulder[1] - calibration.trunk.glenohumeral[1] };
    const placed: Vec3 = AutoMovieHumanArmLaw.centreOf(centre, lawInputs, elbow);
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
    const built: AutoMovieHumanHandConstruction.IBuilt<IAutoMovieHumanArmLaw> =
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
            const law: IAutoMovieHumanArmLaw = AutoMovieHumanArmLaw.of(ring, lawInputs, m, form, placed);
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
    const landmarks: IBones = {
      elbow: sided(built.law.elbow, sign),
      crease: sided(built.law.crease, sign),
      length: built.measures.length,
      thumb: built.thumb,
      digits: built.lines,
    };
    if (!lofted) return { chains: [], poles: [], nails: [], bones: landmarks };

    return {
      chains: [AutoMovieHumanArmLayers.of(built.law, side, sign), ...built.digits.slice(0, 1), built.palm!, ...built.digits.slice(1)],
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
    built: AutoMovieHumanHandConstruction.IBuilt<IAutoMovieHumanArmLaw>,
  ): AutoMovieHumanHandConstruction.IBuilt<IAutoMovieHumanArmLaw> {
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
  function elbowOf(skeleton: readonly AutoMovieHumanSkeletonLaw.IBone[] | undefined, side: "left" | "right", sign: 1 | -1): Vec3 | undefined {
    if (skeleton === undefined) return undefined;
    const bone: AutoMovieHumanSkeletonLaw.IBone | undefined = skeleton.find((b: AutoMovieHumanSkeletonLaw.IBone): boolean => b.bone === `${side}LowerArm`);
    if (bone === undefined) throw new Error(`The skeleton lacks the ${side} elbow`);
    return sided(bone.position, sign);
  }
}
