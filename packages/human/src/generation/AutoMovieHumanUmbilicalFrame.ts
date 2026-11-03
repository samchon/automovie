import { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";

/**
 * The umbilicus's own frame: its centre is omphalion on the front midline
 * (ANSUR II omphalion height, 2 to 2.5 cm above the iliac tubercles, Gray
 * 1918), its axis the abdominal wall's outward normal there, which is forward
 * on the midline. The abdominal wall's section is the trunk's; the pit is the
 * umbilicus's own piece.
 */
export namespace AutoMovieHumanUmbilicalFrame {
  /**
   * The umbilicus's frame.
   *
   * @param omphalion Height of omphalion, mm.
   * @param front The front midline's forward place at that height, mm.
   * @returns The frame, axis forward, on the midline.
   */
  export function create(omphalion: number, front: number): AutoMovieHumanTrunkFeatureFrame.IFrame {
    return AutoMovieHumanTrunkFeatureFrame.create([front, omphalion, 0], [1, 0, 0]);
  }
}
