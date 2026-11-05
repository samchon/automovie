import type { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanHandDigit } from "./IAutoMovieHumanHandDigit";
import type { IAutoMovieHumanHandFinger } from "./IAutoMovieHumanHandFinger";
import type { IAutoMovieHumanHandForm } from "./IAutoMovieHumanHandForm";
import type { IAutoMovieHumanHandMeasures } from "./IAutoMovieHumanHandMeasures";
import type { IAutoMovieHumanHandScales } from "./IAutoMovieHumanHandScales";
import type { IAutoMovieHumanHandWrist } from "./IAutoMovieHumanHandWrist";
import type { IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanBodySurface } from "../AutoMovieHumanBodySurface";
import { AutoMovieHumanHandDigitChain } from "./AutoMovieHumanHandDigitChain";
import { AutoMovieHumanHandEvents } from "./AutoMovieHumanHandEvents";
import { AutoMovieHumanHandFingers } from "./AutoMovieHumanHandFingers";
import { AutoMovieHumanHandMap } from "./AutoMovieHumanHandMap";
import { AutoMovieHumanHandPalm } from "./AutoMovieHumanHandPalm";
import { AutoMovieHumanHandSolve } from "./AutoMovieHumanHandSolve";
import { AutoMovieHumanKnuckleSection } from "../AutoMovieHumanKnuckleSection";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { handPoint }: typeof AutoMovieHumanHandMap = AutoMovieHumanHandMap;
const { digitsOf }: typeof AutoMovieHumanHandFingers = AutoMovieHumanHandFingers;
const { palmOf }: typeof AutoMovieHumanHandPalm = AutoMovieHumanHandPalm;
const { fingerOf }: typeof AutoMovieHumanHandDigitChain = AutoMovieHumanHandDigitChain;
const { events }: typeof AutoMovieHumanHandEvents = AutoMovieHumanHandEvents;
const { solve }: typeof AutoMovieHumanHandSolve = AutoMovieHumanHandSolve;

/**
 * What the solve's knuckle section, read on the chains, must measure for the
 * meshed skin to measure the hand's breadth and circumference: the hand is
 * solved, its palm and fingers are meshed by the body's own surface, the
 * skin's section is measured and the targets move by the skin's ratio to the
 * inputs.
 */
export namespace AutoMovieHumanHandSkinTargets {
  /**
   * Rounds in which the solve's knuckle targets follow the meshed skin's
   * section: the skin's ratio to the chains' reading barely moves with the
   * scales, so two rounds leave a small fraction of the first miss.
   */
  const SKIN_ROUNDS: number = 2;

  /** Knuckle targets already solved, by side and hand inputs. */
  const TARGETS: Map<string, { breadth: number; girth: number }> = new Map();

  /**
   * What the solve's knuckle section, read on the palm's rings and the border
   * fingers' roots, must measure for the meshed skin to measure the breadth
   * and the hand tape.
   *
   * The skin at the knuckles is the palm's and, at its borders, the webs'
   * columns out to the index and little fingers' roots, which the surface
   * builds after the chains; read on the chains alone the breadth missed by
   * -5 to +4 mm, depending on how the border was approximated. So the hand is
   * solved, its palm and fingers are meshed by the body's own surface, the
   * skin's section is measured ({@link AutoMovieHumanKnuckleSection}), and the
   * solve's targets move by the skin's ratio to the inputs, in
   * {@link SKIN_ROUNDS} rounds; the ratio of skin to chain changes little with
   * the scales, so each round shrinks the miss severalfold. Measured in the
   * left frame for either side, since the right is its reflection; cached per
   * mirror-free inputs, so one side serves the other's mirror image, and
   * because the skeleton asks for the same bones first.
   */
  export function skinTargets(
    calibration: IAutoMovieHumanBodyCalibration,
    hand: IAutoMovieHumanHandForm,
    given: IAutoMovieHumanHandMeasures,
    circumference: number,
    wristTape: number,
    makeArm: (measures: IAutoMovieHumanHandScales) => IAutoMovieHumanHandWrist,
    key: string,
  ): { breadth: number; girth: number } {
    const found: { breadth: number; girth: number } | undefined = TARGETS.get(key);
    if (found !== undefined) return found;
    const targets: { breadth: number; girth: number } = { breadth: given.breadth, girth: circumference };
    for (let round: number = 0; round < SKIN_ROUNDS; round++) {
      const { measures, law, joints } = solve(hand, given, circumference, wristTape, makeArm, targets, calibration.diagnostics);
      const map = (q: readonly [number, number, number]): Vec3 => handPoint(q, measures, law.wrist);
      const fingers: IAutoMovieHumanHandFinger[] = digitsOf(hand, measures, law, joints);
      const chains: IAutoMovieLoftChain[] = [
        palmOf(hand, map, "left", 1),
        ...hand.digits.slice(1).map((d: IAutoMovieHumanHandDigit, i: number): IAutoMovieLoftChain => fingerOf(d, i + 1, fingers[i + 1]!, "left", 1)),
      ];
      const mesh = AutoMovieHumanBodySurface.generate({
        ...calibration,
        chains,
        events: events().filter((e: IAutoMovieHumanBodyCalibration.IEvent): boolean => e.parent === "hand.left.1"),
        poles: hand.digits.slice(1).map((_: IAutoMovieHumanHandDigit, i: number): IAutoMovieHumanBodyCalibration.IPole => ({
          chain: AutoMovieHumanArmPrior.PRIOR.hand.digits[i + 1]!.name.replace("{side}", "left"),
          end: "bottom",
          critical: true,
          point: fingers[i + 1]!.pole,
        })),
        apertures: [],
        appendages: undefined,
      }).mesh;
      const skin: AutoMovieHumanKnuckleSection.IMeasure = AutoMovieHumanKnuckleSection.measure(
        mesh.positions,
        mesh.indices,
        [joints.mcps[1]!, joints.mcps[2]!, joints.mcps[4]!],
        law.crease,
      );
      targets.breadth *= given.breadth / skin.breadth;
      targets.girth *= circumference / skin.girth;
    }
    if (TARGETS.size > 64) TARGETS.clear();
    TARGETS.set(key, targets);
    return targets;
  }
}
