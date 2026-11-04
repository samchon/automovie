import { AutoMovieHumanViewSection } from "../../lofting/AutoMovieHumanViewSection";
import { AutoMovieHumanFaceTissue } from "../AutoMovieHumanFaceTissue";
import { AutoMovieHumanHeadMedianProfile } from "../AutoMovieHumanHeadMedianProfile";
import type { IAutoMovieHumanHeadLandmarks } from "../IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadDome } from "./AutoMovieHumanHeadDome";
import type { AutoMovieHumanHeadFeatures } from "./AutoMovieHumanHeadFeatures";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";

/**
 * The face's masses merged onto the head mass, each with its amplitude from
 * a law of its own:
 *
 * | Mass | Amplitude | Footprint |
 * | --- | --- | --- |
 * | brow ridge, each side | the soft tissue at the mid-supraorbital point (`AutoMovieHumanFaceTissue`) | the fissure's length across, the glabella over the fissure's centre up and down |
 * | zygoma, each side | half zy-zy less the head mass's half width at the zygion's height, the breadth the front-view outline leaves to it | the zygion to the tragion along, the fissure's centre to the zygion up and down |
 *
 * The chin pad and the forehead have no part: the median profile P already
 * passes the soft-tissue pogonion and glabella, so their projection over the
 * head mass is zero by construction. The malar eminence and the cheek have
 * no measure that the outlines leave room for, so they stay at amplitude 0
 * until a law gives them a projection over the head mass. First pass:
 * compile-only.
 */
export namespace AutoMovieHumanHeadMasses {
  /** Depth of a mass's base inside the head mass, mm. */
  export const INSET: number = 3;

  /**
   * Every face mass of a person with a positive amplitude.
   *
   * @param plan The landmark skeleton.
   * @returns The parts.
   */
  export function of(plan: IAutoMovieHumanHeadLayout): AutoMovieHumanHeadFeatures.IFeature[] {
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const out: AutoMovieHumanHeadFeatures.IFeature[] = [];
    for (const sign of [1, -1] as const) {
      const side: string = sign > 0 ? "left" : "right";
      const eye = sign > 0 ? plan.left : plan.right;

      // The brow ridge over the fissure's centre, at the glabella's height.
      const browY: number = m.glabella[1];
      const browX: number = AutoMovieHumanHeadMedianProfile.profileAt(plan, browY);
      const brow: number = AutoMovieHumanFaceTissue.depth("midSupraorbital");
      const half: number = (m.glabella[1] - plan.eye) / 2;
      out.push(
        mass(`brow.${side}`, [browX - INSET, browY, sign * eye.place], [1, 0, 0], [0, 0, sign], [eye.length / 2, half, eye.length / 2, half], brow, [browX, browY, sign * eye.place]),
      );

      // The zygoma: the breadth zy-zy asks for beyond the head mass there.
      const zy: [number, number] = m.zygion;
      const proud: number = plan.faceWidth - AutoMovieHumanHeadMassPart.halfWidth(plan, zy[1]);
      if (proud > 0) {
        const along: number = Math.max(1, (zy[0] - m.tragion[0]) / 2);
        const up: number = Math.max(1, plan.eye - zy[1]);
        const z: number = sign * (plan.faceWidth - proud);
        out.push(mass(`zygoma.${side}`, [zy[0], zy[1], z - sign * INSET], [0, 0, sign], [1, 0, 0], [along, up, along, up], proud, [zy[0], zy[1], z]));
      }
    }
    return out;
  }

  /** One mass. */
  function mass(
    name: string,
    origin: [number, number, number],
    outward: [number, number, number],
    along: [number, number, number],
    extents: [number, number, number, number],
    amplitude: number,
    seed: [number, number, number],
  ): AutoMovieHumanHeadFeatures.IFeature {
    const height: number = INSET + amplitude;
    return {
      part: AutoMovieHumanHeadDome.of({ name, origin, outward, along, extents, height, profile: 2, shoulder: AutoMovieHumanViewSection.ELLIPSE }),
      join: "merge",
      seed,
      contact: INSET,
      size: [amplitude, Math.min(...extents)],
      parent: "head.mass",
      elongated: Math.max(...extents) > 2 * Math.min(...extents),
    };
  }
}
