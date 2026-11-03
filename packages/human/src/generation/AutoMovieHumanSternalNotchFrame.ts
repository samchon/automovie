import { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";

/**
 * The sternal notch's own frame: its centre is the front midline just under
 * the neck's bottom ring, over the manubrium's upper border (the jugular
 * notch, Gray 1918), its axis the chest wall's outward normal there, which is
 * forward on the midline. The wall's section is the shoulders'; the hollow is
 * the notch's own piece.
 */
export namespace AutoMovieHumanSternalNotchFrame {
  /**
   * The notch's frame.
   *
   * @param y Height of the notch's centre, mm.
   * @param front The front midline's forward place at that height, mm.
   * @returns The frame, axis forward, on the midline.
   */
  export function create(y: number, front: number): AutoMovieHumanTrunkFeatureFrame.IFrame {
    return AutoMovieHumanTrunkFeatureFrame.create([front, y, 0], [1, 0, 0]);
  }
}
