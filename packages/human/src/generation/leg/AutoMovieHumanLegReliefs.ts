import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanLegAchillesTendon } from "./AutoMovieHumanLegAchillesTendon";
import { AutoMovieHumanLegFibularHead } from "./AutoMovieHumanLegFibularHead";
import { AutoMovieHumanLegGastrocnemiusLateralHead } from "./AutoMovieHumanLegGastrocnemiusLateralHead";
import { AutoMovieHumanLegGastrocnemiusMedialHead } from "./AutoMovieHumanLegGastrocnemiusMedialHead";
import { AutoMovieHumanLegGreaterTrochanter } from "./AutoMovieHumanLegGreaterTrochanter";
import { AutoMovieHumanLegInfraglutealFold } from "./AutoMovieHumanLegInfraglutealFold";
import { AutoMovieHumanLegInguinalCrease } from "./AutoMovieHumanLegInguinalCrease";
import { AutoMovieHumanLegLateralCondyle } from "./AutoMovieHumanLegLateralCondyle";
import { AutoMovieHumanLegMedialCondyle } from "./AutoMovieHumanLegMedialCondyle";
import { AutoMovieHumanLegPatella } from "./AutoMovieHumanLegPatella";
import { AutoMovieHumanLegPoplitealFossa } from "./AutoMovieHumanLegPoplitealFossa";
import type { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";
import { AutoMovieHumanLegSoleusBelly } from "./AutoMovieHumanLegSoleusBelly";
import { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";
import { AutoMovieHumanLegTibialTuberosity } from "./AutoMovieHumanLegTibialTuberosity";
import { AutoMovieHumanLegVastusMedialisTeardrop } from "./AutoMovieHumanLegVastusMedialisTeardrop";

/**
 * The leg's fourteen relief windows composed on one leg: each named bump or
 * hollow placed at its own centre with the local radius there, the girth the
 * law asks for at that station over 2 pi, so its size follows the person.
 *
 * A window whose centre stands outside the leg's own span (above the crotch
 * ring or under the ankle ring) has no skin of the leg to move there and is
 * left out; the rest of its window past a ring is cut by the ring, where the
 * neighbour owns the skin.
 */
export namespace AutoMovieHumanLegReliefs {
  /** A relief piece: its window and its constructor. */
  export interface IPiece {
    /** The window's declaration. */
    WINDOW: AutoMovieHumanLegReliefWindow.IWindow;

    /** The relief on one leg. */
    of: (input: AutoMovieHumanLegReliefWindow.IInput) => IAutoMovieHumanRelief;
  }

  /** Every relief piece. */
  export const PIECES: readonly IPiece[] = [
    AutoMovieHumanLegPatella,
    AutoMovieHumanLegTibialTuberosity,
    AutoMovieHumanLegFibularHead,
    AutoMovieHumanLegMedialCondyle,
    AutoMovieHumanLegLateralCondyle,
    AutoMovieHumanLegPoplitealFossa,
    AutoMovieHumanLegGastrocnemiusMedialHead,
    AutoMovieHumanLegGastrocnemiusLateralHead,
    AutoMovieHumanLegSoleusBelly,
    AutoMovieHumanLegAchillesTendon,
    AutoMovieHumanLegVastusMedialisTeardrop,
    AutoMovieHumanLegGreaterTrochanter,
    AutoMovieHumanLegInfraglutealFold,
    AutoMovieHumanLegInguinalCrease,
  ];

  /**
   * The reliefs of one leg.
   *
   * @param bones The joints' heights, mm.
   * @param girth The girth the law asks for at a station, mm.
   * @param span The leg's own stations, from the ankle ring to the crotch ring, mm.
   */
  export function of(bones: AutoMovieHumanLegStations.IBones, girth: (s: number) => number, span: readonly [number, number]): IAutoMovieHumanRelief[] {
    return PIECES.filter((p: IPiece): boolean => {
      const at: number = AutoMovieHumanLegStations.heightAt(bones, p.WINDOW.segment, p.WINDOW.share);
      return at > span[0] && at < span[1];
    }).map((p: IPiece): IAutoMovieHumanRelief => {
      const at: number = AutoMovieHumanLegStations.heightAt(bones, p.WINDOW.segment, p.WINDOW.share);
      return p.of({ bones, radius: girth(at) / (2 * Math.PI) });
    });
  }
}
