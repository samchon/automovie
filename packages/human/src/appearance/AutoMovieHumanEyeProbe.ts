import type { IAutoMovieModelPart } from "@automovie/interface";

import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanEyeball } from "./AutoMovieHumanEyeball";
import type { IAutoMovieHumanAppearanceBody } from "./IAutoMovieHumanAppearanceBody";

/**
 * Provisional eye frames read from the generated head skin, used until the
 * head generator publishes its own eye-opening authority.
 *
 * Rule, common to every person: each globe sits on the horizontal line
 * through the palpebral-fissure centre, laterally at half the intercanthal
 * width plus half that side's fissure length from the midline (both are
 * Human parameters). Along the vertical line at that lateral offset, the
 * front of the head skin dips where the recovered surface follows the eye
 * opening between brow and cheek; the deepest front point inside the band
 * from 35 to 65 percent of the head height below the vertex is taken as the
 * corneal apex, and the globe centre lies the derived apex distance behind
 * it along +X. Gaze is +X and up is +Y.
 *
 * Limits: the band is a convention wide enough for adult eye level (about
 * half the head height below the vertex); a head whose surface has no such
 * dip yields its shallowest front point there, which is not an eye. The
 * frame replaces no lid or socket geometry; the skin must still open over
 * the cornea for the eye to show.
 */
export namespace AutoMovieHumanEyeProbe {
  /**
   * Estimate both eye frames.
   *
   * @param params Human parameters: head height, intercanthal width and fissure lengths
   * @param parts Generated model parts in metres; `human.skin.head/<k>` parts are read
   * @returns Eye frames in model metres
   * @throws {Error} When the head skin has no triangle crossing an eye line
   */
  export function estimate(
    params: IAutoMovieHumanParameters,
    parts: IAutoMovieModelPart[],
  ): IAutoMovieHumanAppearanceBody {
    const triangles: number[][] = [];
    let top: number = -Infinity;
    for (const part of parts) {
      if (!part.id.startsWith("human.skin.head/")) continue;
      if (part.geometry.type !== "mesh") continue;
      const p: number[] = part.geometry.mesh.positions;
      const index: number[] | null = part.geometry.mesh.indices;
      const count: number = index === null ? p.length / 3 : index.length;
      for (let i: number = 1; i < p.length; i += 3) top = Math.max(top, p[i]!);
      for (let i: number = 0; i < count; i += 3) {
        const t: number[] = [];
        for (let j: number = 0; j < 3; ++j) {
          const v: number = index === null ? i + j : index[i + j]!;
          t.push(p[v * 3]!, p[v * 3 + 1]!, p[v * 3 + 2]!);
        }
        triangles.push(t);
      }
    }

    const face: IAutoMovieHumanParameters["head"]["face"] = params.head.face;
    const height: number = params.head.height / 1000;
    const apex: number = AutoMovieHumanEyeball.derive().apex / 1000;

    const side: (
      lateral: number,
    ) => IAutoMovieHumanAppearanceBody.IEye = (
      lateral: number,
    ): IAutoMovieHumanAppearanceBody.IEye => {
      // Triangles spanning this lateral line, so each height sample tests
      // only the few hundred that can cross it.
      const near: number[][] = triangles.filter(
        (t: number[]): boolean =>
          Math.min(t[2]!, t[5]!, t[8]!) <= lateral &&
          Math.max(t[2]!, t[5]!, t[8]!) >= lateral,
      );

      // Deepest front point over the band, sampled every 0.25 mm.
      let best: [number, number] | null = null;
      for (
        let y: number = top - 0.65 * height;
        y <= top - 0.35 * height;
        y += 0.00025
      ) {
        const x: number | null = front(near, y, lateral);
        if (x !== null && (best === null || x < best[0])) best = [x, y];
      }
      if (best === null)
        throw new Error(
          `Human eye probe found no head skin on the line z = ${lateral}`,
        );
      return {
        centre: [best[0] - apex, best[1], lateral],
        forward: [1, 0, 0],
        up: [0, 1, 0],
      };
    };

    // Left is +Z in the registered frame.
    return {
      eyePair: {
        left: side(
          (face.intercanthalWidth + face.eyePair.left.palpebralFissureLength) /
            2000,
        ),
        right: side(
          -(face.intercanthalWidth + face.eyePair.right.palpebralFissureLength) /
            2000,
        ),
      },
    };
  }
}

/**
 * Most anterior crossing of the line `{y, z}` through a triangle set.
 *
 * Solves the triangle's barycentric coordinates in the y-z projection
 * (Cramer's rule) and interpolates x; triangles parallel to x are skipped.
 *
 * @param triangles Flat vertex triples `[x0, y0, z0, x1, ..., z2]`
 * @param y Line height
 * @param z Line lateral position
 * @returns Largest crossing x, or null when the line misses every triangle
 */
function front(triangles: number[][], y: number, z: number): number | null {
  let best: number | null = null;
  for (const t of triangles) {
    const ay: number = t[1]!;
    const az: number = t[2]!;
    const by: number = t[4]! - ay;
    const bz: number = t[5]! - az;
    const cy: number = t[7]! - ay;
    const cz: number = t[8]! - az;
    const det: number = by * cz - bz * cy;
    if (Math.abs(det) < 1e-14) continue;
    const u: number = ((y - ay) * cz - (z - az) * cy) / det;
    const v: number = (by * (z - az) - bz * (y - ay)) / det;
    if (u < 0 || v < 0 || u + v > 1) continue;
    const x: number = t[0]! + u * (t[3]! - t[0]!) + v * (t[6]! - t[0]!);
    if (best === null || x > best) best = x;
  }
  return best;
}
