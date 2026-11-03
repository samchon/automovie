import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanLegAchillesTendon } from "./AutoMovieHumanLegAchillesTendon";
import { AutoMovieHumanLegFibularHead } from "./AutoMovieHumanLegFibularHead";
import { AutoMovieHumanLegGastrocnemiusLateralHead } from "./AutoMovieHumanLegGastrocnemiusLateralHead";
import { AutoMovieHumanLegGastrocnemiusMedialHead } from "./AutoMovieHumanLegGastrocnemiusMedialHead";
import { AutoMovieHumanLegInfraglutealFold } from "./AutoMovieHumanLegInfraglutealFold";
import { AutoMovieHumanLegLateralCondyle } from "./AutoMovieHumanLegLateralCondyle";
import { AutoMovieHumanLegMedialCondyle } from "./AutoMovieHumanLegMedialCondyle";
import { AutoMovieHumanLegPatella } from "./AutoMovieHumanLegPatella";
import { AutoMovieHumanLegPoplitealFossa } from "./AutoMovieHumanLegPoplitealFossa";
import { AutoMovieHumanLegQuadriceps } from "./AutoMovieHumanLegQuadriceps";
import type { AutoMovieHumanLegReliefWindow } from "./AutoMovieHumanLegReliefWindow";
import { AutoMovieHumanLegSoleusBelly } from "./AutoMovieHumanLegSoleusBelly";
import { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";
import { AutoMovieHumanLegTibialTuberosity } from "./AutoMovieHumanLegTibialTuberosity";
import { AutoMovieHumanLegVastusMedialisTeardrop } from "./AutoMovieHumanLegVastusMedialisTeardrop";

/**
 * The leg's thirteen relief windows composed on one leg: each named bump or
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
    AutoMovieHumanLegQuadriceps,
    AutoMovieHumanLegInfraglutealFold,
  ];

  /**
   * The reliefs of one leg.
   *
   * @param bones The joints' heights, mm.
   * @param girth The girth the law asks for at a station, mm.
   * @param span The leg's own stations, from the ankle ring to the crotch ring, mm.
   * @param crotchReach The span under the crotch ring over which the trunk's ring hands the skin over to the leg's law, mm; a window anchored at the crotch stands at its end. Absent (a leg read without its crotch ring), every window stands at its share.
   */
  export function of(
    bones: AutoMovieHumanLegStations.IBones,
    girth: (s: number) => number,
    span: readonly [number, number],
    crotchReach?: number,
  ): IAutoMovieHumanRelief[] {
    const centre: (p: IPiece) => number = (p: IPiece): number =>
      p.WINDOW.anchor === "crotch" && crotchReach !== undefined
        ? span[1] - crotchReach
        : AutoMovieHumanLegStations.heightAt(bones, p.WINDOW.segment, p.WINDOW.share);
    return PIECES.filter((p: IPiece): boolean => {
      const at: number = centre(p);
      return at > span[0] && at < span[1];
    }).map((p: IPiece): IAutoMovieHumanRelief => {
      const at: number = centre(p);
      return p.of({ bones, radius: girth(at) / (2 * Math.PI), at });
    });
  }
}
