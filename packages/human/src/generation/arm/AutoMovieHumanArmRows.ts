import type { IAutoMovieHumanArmPiece } from "./IAutoMovieHumanArmPiece";
import { AutoMovieHumanAnteriorLine } from "./AutoMovieHumanAnteriorLine";
import { AutoMovieHumanAnterolateralSector } from "./AutoMovieHumanAnterolateralSector";
import { AutoMovieHumanAnteromedialSector } from "./AutoMovieHumanAnteromedialSector";
import type { AutoMovieHumanArmStation } from "./AutoMovieHumanArmStation";
import { AutoMovieHumanLateralLine } from "./AutoMovieHumanLateralLine";
import { AutoMovieHumanMedialLine } from "./AutoMovieHumanMedialLine";
import { AutoMovieHumanPosteriorLine } from "./AutoMovieHumanPosteriorLine";
import { AutoMovieHumanPosterolateralSector } from "./AutoMovieHumanPosterolateralSector";
import { AutoMovieHumanPosteromedialSector } from "./AutoMovieHumanPosteromedialSector";

/**
 * A span's shape row assembled from the columns that own its numbers: the four
 * guide lines (anterior, lateral, posterior, medial; three numbers each) and
 * the four sectors between them (anterolateral, posterolateral, posteromedial,
 * anteromedial; one number each), in the order
 * {@link IAutoMovieHumanArmPiece.IRow} states.
 *
 * A span owns where its rows stand (the walk length of every landmark); the
 * columns own what the rows say, so a line or a sector can be read, tested and
 * replaced alone.
 */
export namespace AutoMovieHumanArmRows {
  /**
   * The row at a landmark station.
   *
   * @param station The landmark station.
   * @param s Walk length of the station, mm.
   */
  export function row(station: AutoMovieHumanArmStation, s: number): IAutoMovieHumanArmPiece.IRow {
    return {
      s,
      channels: [
        ...AutoMovieHumanAnteriorLine.at(station),
        ...AutoMovieHumanLateralLine.at(station),
        ...AutoMovieHumanPosteriorLine.at(station),
        ...AutoMovieHumanMedialLine.at(station),
        AutoMovieHumanAnterolateralSector.at(station),
        AutoMovieHumanPosterolateralSector.at(station),
        AutoMovieHumanPosteromedialSector.at(station),
        AutoMovieHumanAnteromedialSector.at(station),
      ],
    };
  }
}
