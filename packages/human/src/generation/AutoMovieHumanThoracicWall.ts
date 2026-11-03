import type { IAutoMovieHumanArmRootArc } from "./IAutoMovieHumanArmRootArc";
import type { IAutoMovieHumanTrunkSection } from "./IAutoMovieHumanTrunkSection";
import { AutoMovieHumanTrunkRing } from "./AutoMovieHumanTrunkRing";

/**
 * The thoracic wall: the rib cage's ring about the thoracic axis, whose
 * centre is the vertebral bodies' front, between T4 and T12, not the
 * shoulder girdle's centre above it nor the pelvis's below it. Its sectors
 * are the sternal and pectoral ones in front and the scapular and erector
 * ones behind; the breast stands on it as a feature of its own.
 *
 * The axis' forward place at a section is the middle of the section's depth:
 * the vertebral column lies near the trunk's sagittal middle (Gray 1918), a
 * convention the skeleton also uses for the spine's joints (`axis` of the
 * landmarks).
 */
export namespace AutoMovieHumanThoracicWall {
  /**
   * The thoracic axis' forward place at a section.
   *
   * @param s The section.
   * @returns The forward place, mm.
   */
  export function axis(s: IAutoMovieHumanTrunkSection): number {
    return (s.front + s.back) / 2;
  }

  /**
   * The wall's ring.
   *
   * @param s The section's measures.
   * @param arc The arm's arc where the arm stands against the wall; absent, the wall's own flanks.
   * @returns The 256-control section.
   */
  export function controls(s: IAutoMovieHumanTrunkSection, arc?: IAutoMovieHumanArmRootArc): number[] {
    return AutoMovieHumanTrunkRing.controls(s, arc);
  }
}
