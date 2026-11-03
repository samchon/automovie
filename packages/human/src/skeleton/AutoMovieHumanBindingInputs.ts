import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanBindingLips } from "./IAutoMovieHumanBindingLips";
import type { IAutoMovieHumanChainRings } from "./IAutoMovieHumanChainRings";
import { AutoMovieHumanCrotchBinding } from "./AutoMovieHumanCrotchBinding";
import { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import { AutoMovieHumanJointTurn } from "./AutoMovieHumanJointTurn";
import { AutoMovieHumanNeutral } from "./AutoMovieHumanNeutral";

/**
 * Everything the skin's binding reads from a body, as one fixed record.
 *
 * The binding needs a body's joints, the skin's depth round them, the
 * neutral posture's turns and each joint's range of turn. Those come from the
 * calibration, which takes a whole person to generate; this record is all of
 * them in plain data, so a region of the binding is estimated and checked on
 * its own, from a record saved once, in seconds. The record holds no weights:
 * a weight is a function of a place and this record alone.
 */
export namespace AutoMovieHumanBindingInputs {
  /** A body's binding inputs. */
  export interface IInputs {
    /** Metres per calibration millimetre. */
    scale: number;

    /** The calibration's stature, millimetres; the pose evaluator's scale reads it. */
    stature: number;

    /** The bind skeleton, calibration millimetres, parent before child. */
    joints: AutoMovieHumanJointCentres.IJoint[];

    /** The skin of every chain, sampled at {@link PHASES} phases per ring. */
    rings: IAutoMovieHumanChainRings[];

    /** The anatomical neutral reached from the bind. */
    neutral: AutoMovieHumanNeutral.IOutput;

    /** Each joint's largest turn from its parent over its pose channels, radians. */
    turns: Map<string, number>;

    /** The crotch's height, metres; infinity for a trunk without a midline. */
    crotch: number;

    /** The lips' contact line, or null for a mouth whose skin is not open. */
    lips: IAutoMovieHumanBindingLips | null;
  }

  /**
   * Phases per ring of a body's skin (convention: 48, 7.5 degrees apart, fine
   * enough to find the widest skin of a section for the resting arm and the
   * thighs, and holding the rings of 24, 12, 8 and 4 phases as subsets).
   */
  export const PHASES: number = 48;

  /** Phases per ring the joints' skin depth and ramp widths are read at: every fourth of {@link PHASES}. */
  export const SAMPLE_PHASES: number = 12;

  /**
   * Derive a body's binding inputs.
   *
   * @param calibration The body.
   * @param scale Metres per calibration millimetre.
   * @returns The inputs.
   */
  export function derive(
    calibration: IAutoMovieHumanBodyCalibration,
    scale: number,
  ): IInputs {
    const joints: AutoMovieHumanJointCentres.IJoint[] =
      AutoMovieHumanJointCentres.derive(calibration);
    const skin: IAutoMovieHumanChainRings[] = rings(calibration, null);
    const neutral: AutoMovieHumanNeutral.IOutput = AutoMovieHumanNeutral.of(
      calibration,
      (): AutoMovieHumanNeutral.ISource => ({ rings: skin, joints }),
    );
    return {
      scale,
      stature: calibration.stature,
      joints,
      rings: skin,
      neutral,
      turns: AutoMovieHumanJointTurn.derive(neutral, joints),
      crotch: AutoMovieHumanCrotchBinding.height(calibration, scale),
      lips:
        calibration.mouth === undefined ||
        !calibration.apertures.some(
          (a: IAutoMovieHumanBodyCalibration["apertures"][number]): boolean =>
            a.name === "mouth",
        )
          ? null
          : {
              contact: calibration.mouth.contact.map(
                (y: number): number => y * scale,
              ),
              width: calibration.mouth.width * scale,

              // Past the cheilia the cheek's skin between the maxilla and the
              // mandible's body takes the jaw's turn: half the stomion's
              // height over the menton. The jaw's own ramp, a 7 mm half,
              // stretched the skin round the commissure more than three times
              // under a 20 mm opening on every person.
              wide:
                ((calibration.mouth.stomion - calibration.mouth.menton) / 2) *
                scale,
            },
    };
  }

  /**
   * Sample the skin of a body's chains as rings.
   *
   * @param calibration The body.
   * @param names Chains to sample by name, or null for every chain.
   * @returns One record per chain, in the calibration's order.
   */
  export function rings(
    calibration: IAutoMovieHumanBodyCalibration,
    names: RegExp | null,
  ): IAutoMovieHumanChainRings[] {
    const phases: number[] = Array.from(
      { length: PHASES },
      (_: unknown, i: number): number => (2 * Math.PI * i) / PHASES,
    );
    return calibration.chains
      .filter(
        (c: IAutoMovieHumanBodyCalibration["chains"][number]): boolean =>
          names === null || names.test(c.name),
      )
      .map((chain: IAutoMovieHumanBodyCalibration["chains"][number]): IAutoMovieHumanChainRings => {
        const stations: number[] = chain.layers.map(
          (l: { y: number }): number => l.y,
        );
        const points: number[] = [];
        for (const y of stations)
          for (const p of AutoMovieHumanLoftChain.ring(chain, y, phases))
            points.push(p[0], p[1], p[2]);
        return { chain: chain.name, phases: PHASES, stations, points };
      });
  }

  /**
   * The skin samples the binding measures depths and ramps on.
   *
   * @param inputs The inputs.
   * @returns Every chain's rings at {@link SAMPLE_PHASES} phases, metres, three numbers each.
   */
  export function samples(inputs: IInputs): Float64Array {
    const out: number[] = [];
    const stride: number = PHASES / SAMPLE_PHASES;
    for (const chain of inputs.rings)
      for (let k: number = 0; k < chain.points.length / 3; k += stride)
        out.push(
          chain.points[3 * k]! * inputs.scale,
          chain.points[3 * k + 1]! * inputs.scale,
          chain.points[3 * k + 2]! * inputs.scale,
        );
    return Float64Array.from(out);
  }
}
