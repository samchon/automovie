import type { IAutoMovieModelPart } from "@automovie/interface";

/**
 * The top of the canonical auricle (superaurale): the highest skin point of
 * the left ear's chains (`human.skin.ear.<sub>.left/<k>`), in model
 * millimetres, which the margin of hair over the ear stands above
 * (`AutoMovieHumanHairlineEarTop`). Null when the body has no ear skin. The
 * head also publishes the ear root (otobasion superius); the skin's highest
 * point is the auricle's own top, above that root.
 */
export namespace AutoMovieHumanScalpAuricle {
  /**
   * Height of the auricle's top.
   *
   * @param parts The body's generated parts, in metres
   * @returns Model height in millimetres, or null without ear skin
   */
  export function top(parts: IAutoMovieModelPart[]): number | null {
    let top: number | null = null;
    for (const part of parts) {
      if (!EAR.test(part.id) || part.geometry.type !== "mesh") continue;

      const p: number[] = part.geometry.mesh.positions;
      for (let i: number = 1; i < p.length; i += 3)
        top = Math.max(top ?? -Infinity, p[i]! * 1000);
    }
    return top;
  }
}

/** Skin parts of the canonical (left) auricle's chains. */
const EAR: RegExp = /^human\.skin\.ear\.[^/]*\.left\//;
