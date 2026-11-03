import { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import { AutoMovieHumanEarConstruction } from "./AutoMovieHumanEarConstruction";
import { AutoMovieHumanHeadEarRoots } from "./AutoMovieHumanHeadEarRoots";
import { AutoMovieHumanHeadSection } from "./AutoMovieHumanHeadSection";
import { AutoMovieHumanHeadSkin } from "./AutoMovieHumanHeadSkin";
import { AutoMovieHumanHeadSkinReading } from "./AutoMovieHumanHeadSkinReading";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanHeadSurface } from "./IAutoMovieHumanHeadSurface";

/**
 * The head's landmarks on its finished skin for parts placed on the head: the
 * vertex, the glabella and nasion by their definitions on the midline, each
 * exocanthion at the lateral extreme of its lid margin, and each ear's
 * otobasion superius and inferius.
 */
export namespace AutoMovieHumanHeadLandmarkPublication {
  /**
   * The head's landmarks on its finished skin, for parts placed on the head:
   * the vertex at the crown's pole; the glabella and the soft-tissue nasion
   * by their definitions on the midline profile (the forehead's most
   * prominent point within 45 mm over the fissures, the deepest point
   * between the fissures and the glabella), as the measures are solved; each
   * exocanthion the lateral extreme of its lid margin; each otobasion where
   * the auricle's front root leaves the head at its highest and lowest
   * attachment. The right side's are read through the same functions on the
   * reflected side.
   */
  export function landmarksOf(
    surface: IAutoMovieHumanHeadSurface,
    margins: readonly IAutoMovieHumanLoftAperture[],
    left: AutoMovieHumanEarConstruction.IEar,
    right: AutoMovieHumanEarConstruction.IEar,
  ): IAutoMovieHumanBodyCalibration.IHeadLandmarks {
    const { plan, compiled } = surface;
    const k: number = plan.scale;
    // The midline's skin from 6 mm under the eye level to 45 mm over it.
    const points: P2[] = [];
    for (let s: number = plan.eye - 6 * k; s <= plan.eye + 45 * k; s += 0.25 * k)
      points.push(AutoMovieHumanHeadSkinReading.midline(surface, s));

    // Glabella (Farkas): the forehead's most prominent midline point, which
    // lies over the eye level; below it the nasal bridge grows forward again,
    // so a search that reached under the eye level found the bridge.
    const glabella: P2 = points
      .filter((p: P2): boolean => p[1] >= plan.eye)
      .reduce((a: P2, b: P2): P2 => (b[0] > a[0] ? b : a));

    // Soft-tissue nasion: the deepest midline point between 6 mm under the
    // eye level and the glabella, the root of the nose.
    const nasion: P2 = points
      .filter((p: P2): boolean => p[1] < glabella[1])
      .reduce((a: P2, b: P2): P2 => (b[0] < a[0] ? b : a));
    const exocanthion = (aperture: IAutoMovieHumanLoftAperture): Vec3 => {
      let best: Vec3 = [0, 0, 0];
      for (let i: number = 0; i < 720; i++) {
        const p: Vec3 = AutoMovieHumanLoftAperture.evaluate(aperture, (2 * Math.PI * i) / 720) as Vec3;
        if (Math.abs(p[2]) > Math.abs(best[2])) best = [p[0], p[1], p[2]];
      }
      return best;
    };
    const otobasion = (
      ear: AutoMovieHumanEarConstruction.IEar,
      name: "left" | "right",
      sign: 1 | -1,
    ): { superius: Vec3; inferius: Vec3 } => {
      const at = (y: number): Vec3 => {
        const front: P2 = AutoMovieHumanHeadEarRoots.roots(ear, AutoMovieHumanHeadSkin.sides(surface, y)[name], sign, y).front[1];
        return [front[0], y, sign * front[1]];
      };
      return { superius: at(ear.upper), inferius: at(ear.lower) };
    };
    return {
      vertex: [AutoMovieHumanHeadSection.section(compiled, plan, plan.vertex).axis, plan.vertex, 0],
      glabella: [glabella[0], glabella[1], 0],
      nasion: [nasion[0], nasion[1], 0],
      exocanthion: { left: exocanthion(margins[0]!), right: exocanthion(margins[1]!) },
      otobasion: { left: otobasion(left, "left", 1), right: otobasion(right, "right", -1) },
    };
  }
}

/** A point of a section. */
type P2 = [number, number];

/** A point. */
type Vec3 = [number, number, number];
