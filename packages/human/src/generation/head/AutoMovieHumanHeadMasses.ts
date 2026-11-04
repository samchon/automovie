import { AutoMovieViewSection } from "@automovie/engine";
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
 * | zygoma, each side | half zy-zy less the head mass's half width at the zygion's height, the breadth the front-view outline leaves to it | the zygion to the tragion along, the fissure's centre to the zygion up and down |
 *
 * The chin pad, the forehead and the brow ridge have no part. P already
 * passes the soft-tissue pogonion and glabella, so their projection over the
 * head mass is zero by construction. The brow ridge's only measure, the soft
 * tissue at the mid-supraorbital point, is the depth over the bone, not a
 * projection over the head mass, whose skin already holds it; read as a
 * height it stood the brows 7 to 8 mm in front of the reference skin. The
 * malar eminence and the cheek have no measure that the outlines leave
 * room for, so they stay at amplitude 0 until a law gives them a projection
 * over the head mass. First pass: compile-only.
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
      part: AutoMovieHumanHeadDome.of({ name, origin, outward, along, extents, height, profile: 2, shoulder: AutoMovieViewSection.ELLIPSE }),
      join: "merge",
      seed,
      contact: INSET,
      size: [amplitude, Math.min(...extents)],
      parent: "head.mass",
      elongated: Math.max(...extents) > 2 * Math.min(...extents),
    };
  }
}
