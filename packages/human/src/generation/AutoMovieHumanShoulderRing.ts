import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import type { IAutoMovieHumanTrunkSection } from "./IAutoMovieHumanTrunkSection";
import { AutoMovieHumanShoulderGirdle } from "./AutoMovieHumanShoulderGirdle";
import { AutoMovieHumanArmRootArc } from "./AutoMovieHumanArmRootArc";
import { AutoMovieHumanArmRootOval } from "./AutoMovieHumanArmRootOval";
import type { AutoMovieHumanTrunkColumn } from "./AutoMovieHumanTrunkColumn";
import { AutoMovieHumanThoracicWall } from "./AutoMovieHumanThoracicWall";
import { AutoMovieHumanTrunkSolve } from "./AutoMovieHumanTrunkSolve";

/**
 * One section of the shoulders' chain `upper`, from the axilla to the neck's
 * bottom ring, at a height.
 *
 * Three runs. From the shoulder point up to the neck the ring is the
 * trunk's own ring whose half width is the trapezius line's, so the neck's
 * flare is copied and nothing else changes. Below the shoulder point the arm
 * is a lobe on the torso: the ring is the trunk's with the arm's arc between
 * the two axillary guides, the torso's own width kept in the other sectors.
 * At the vault the arc stands on the torso's own axillary folds, so the ring
 * is the torso's outside the arc and the trunk's top ring agrees with it
 * there; the folds move to the ellipse's crossings as the arm merges with the
 * shoulder (the glenohumeral centre's height).
 */
export namespace AutoMovieHumanShoulderRing {
  /** What a shoulder ring reads. */
  export interface IInput {
    /** The torso's column through the shoulders. */
    column: AutoMovieHumanTrunkColumn.IColumn;

    /** The trapezius line, from the shoulder point to the neck's ring. */
    line: IAutoMovieHumanShoulderOutline;

    /** The arm's ellipse and its cap. */
    oval: AutoMovieHumanArmRootOval.IInput;

    /** Height of the axilla, the ring's bottom, mm. */
    axilla: number;
  }

  /**
   * The narrowest forward half size of the arm's ellipse the ring keeps, mm:
   * with it the two arcs between the guides stay long enough, 24 knot spans
   * each at 5 mm rows, to keep a shape of their own. Conventional.
   */
  export const MINIMUM_RX: number = 30;

  /**
   * The ring of the girdle and the thoracic wall alone at a height, the arm's
   * arc left out: the torso continued above the vault. The trunk's chain reads
   * it above its top layer for its station rule only, so the trunk's top
   * layer carries the derivatives of the torso running on into the shoulders
   * and agrees with the shoulders' chain wherever the arm's arc is absent.
   *
   * @param input What the ring reads.
   * @param y Height, mm.
   * @returns The 256-control section.
   */
  export function wall(input: IInput, y: number): number[] {
    return AutoMovieHumanThoracicWall.controls(AutoMovieHumanShoulderGirdle.section(input, y));
  }

  /**
   * The ring's controls at a height, from the axilla vault up: at the vault
   * the arm's arc leaves the torso at the full crease.
   *
   * @param input What the ring reads.
   * @param y Height, mm.
   * @returns The 256-control section.
   */
  export function controls(input: IInput, y: number): number[] {
    const s: IAutoMovieHumanTrunkSection = AutoMovieHumanShoulderGirdle.section(input, y);
    if (y >= input.line.from) return AutoMovieHumanThoracicWall.controls(s);

    // Below the shoulder point the arm's ellipse and the outline's extreme
    // set the arc; an ellipse too small to keep an arc leaves the torso's own ring.
    const oval: AutoMovieHumanArmRootOval.IOval | null = AutoMovieHumanArmRootOval.at(input.oval, y);
    if (oval === null) return AutoMovieHumanThoracicWall.controls(s);
    const outline: AutoMovieHumanTrunkSolve.IJet = AutoMovieHumanArmRootOval.outline(input.oval, y);
    const kept: AutoMovieHumanArmRootOval.IOval = { ...oval, rx: Math.max(oval.rx, MINIMUM_RX) };

    // The torso's folds hold the arc at the vault and let it go where the arm has merged.
    const merged: number = input.oval.glenohumeral[1];
    const torso: number = 1 - AutoMovieHumanTrunkSolve.smooth((y - input.axilla) / (merged - input.axilla));

    return AutoMovieHumanThoracicWall.controls(s, AutoMovieHumanArmRootArc.create(s, kept, outline.value, torso));
  }
}
