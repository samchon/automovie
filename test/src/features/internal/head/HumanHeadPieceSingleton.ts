import { AutoMovieHumanBodySpecimenCalibration } from "../../../../../packages/human/src/generation/calibration/AutoMovieHumanBodySpecimenCalibration";
import type { AutoMovieHumanHeadConstruction } from "../../../../../packages/human/src/generation/AutoMovieHumanHeadConstruction";
import { AutoMovieHumanHeadLandmarks } from "../../../../../packages/human/src/generation/AutoMovieHumanHeadLandmarks";
import { AutoMovieHumanHeadPass } from "../../../../../packages/human/src/generation/AutoMovieHumanHeadPass";
import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanHeadBuilt } from "../../../../../packages/human/src/generation/IAutoMovieHumanHeadBuilt";
import type { IAutoMovieHumanHeadSetup } from "../../../../../packages/human/src/generation/IAutoMovieHumanHeadSetup";
import type { IAutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanOnce } from "../HumanOnce";
import { HumanPeople } from "../HumanPeople";

/**
 * A person's head built alone from its fixed inputs, once per process: the
 * head's setup (`AutoMovieHumanHeadPass.prepare`) on the person's own neck
 * chain and public head inputs, and one build of its pieces from that setup
 * with no secant corrections (`AutoMovieHumanHeadLandmarks.NONE`), the head's
 * standalone piece entry. The build's surface cuts the skin of the landmark
 * skeleton, the base sections and every relief piece at any station, without
 * the ears' splice or the chains the body lofts.
 *
 * The inputs are the body law's: stature, neck length and neck tape from the
 * body controls, the masculine-feminine and fat controls, each falling back to
 * the specimen's value when the person leaves it unknown. The neck chain is
 * the person's delivered `head` chain, which no later stage of the body law
 * moves (it is a parent at both of its events).
 */
export namespace HumanHeadPieceSingleton {
  /** A head built alone. */
  export interface IPiece {
    /** Person. */
    person: string;

    /** The head's fixed inputs. */
    setup: IAutoMovieHumanHeadSetup;

    /** The head's pieces built once from the setup. */
    built: IAutoMovieHumanHeadBuilt;

    /** The person's published head landmarks on the delivered head, calibration mm, for locating bands. */
    landmarks: IAutoMovieHumanBodyCalibration.IHeadLandmarks;

    /** Calibration millimetres per input millimetre. */
    scale: number;
  }

  /**
   * One person's head piece.
   *
   * @param person A name of `HumanPeople`.
   * @throws {Error} When the person's body carries no neck chain or no head landmarks, or the build fails.
   */
  export function get(person: string): IPiece {
    return pieces.read(person, (): IPiece => {
      const p: HumanPeople.IPerson = HumanPeople.person(person);
      const neck: IAutoMovieHumanLoftChain | undefined = p.body.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "head");
      if (neck === undefined) throw new Error(`${person} has no neck chain`);
      if (p.body.head === undefined) throw new Error(`${person} publishes no head landmarks`);
      const setup: IAutoMovieHumanHeadSetup = AutoMovieHumanHeadPass.prepare(neck, inputs(p.params));
      const built: IAutoMovieHumanHeadBuilt = AutoMovieHumanHeadPass.build(setup, { ...AutoMovieHumanHeadLandmarks.NONE });
      return { person, setup, built, landmarks: p.body.head, scale: setup.scale };
    });
  }

  /** The head's public inputs as the body law reads them. */
  function inputs(params: IAutoMovieHumanParameters): AutoMovieHumanHeadConstruction.IInputs {
    const controls: IAutoMovieHumanParameters["body"]["controls"] = params.body.controls;
    const known: (name: "height" | "neckLength" | "neck" | "masculineFeminine" | "fat") => number = (name: "height" | "neckLength" | "neck" | "masculineFeminine" | "fat"): number => {
      const value: number | null = controls[name].value;
      if (value !== null) return value;
      const fallback: number | undefined = AutoMovieHumanBodySpecimenCalibration.controls[name];
      if (fallback === undefined) throw new Error(`the specimen has no ${name}`);
      return fallback;
    };
    return {
      head: params.head,
      height: known("height"),
      neckLength: known("neckLength"),
      neck: known("neck"),
      sex: known("masculineFeminine"),
      fat: known("fat"),
    };
  }

  /** Every person's head piece, built once per process. */
  const pieces: HumanOnce<IPiece> = new HumanOnce();
}
