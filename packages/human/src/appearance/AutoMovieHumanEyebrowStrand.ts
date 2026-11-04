import type { IAutoMovieMesh } from "@automovie/interface";

import { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import type { AutoMovieHumanBrowProjector } from "./AutoMovieHumanBrowProjector";

/**
 * One brow hair as a flat ribbon lying on the skin: its points run along the
 * face plane in its direction, each projected onto the generated head skin
 * (`AutoMovieHumanBrowProjector`) and lifted off it along its normal. Hairs
 * lie nearly flush (a lift of 8 degrees, falling back), 3.5 to 6.5 mm long,
 * tapering ribbons that face the skin. All sizes are conventions of this
 * prototype inside Rajput 2021 and Gray 1918 ("directed obliquely on the
 * surface").
 */
export namespace AutoMovieHumanEyebrowStrand {
  /** Segments per hair. */
  export const SEGMENTS: number = 5;

  /** Ribbon half-width at the root, mm. */
  export const ROOT: number = 0.05;

  /** Ribbon half-width at the tip, mm. */
  export const TIP: number = 0.012;

  /** One hair's points and the skin normals under them. */
  export interface IRibbon {
    /** Points, millimetres. */
    points: AutoMovieHumanEyelid.Point[];

    /** Skin normals under the points. */
    normals: AutoMovieHumanEyelid.Point[];
  }

  /**
   * Lay one hair on the skin.
   *
   * @param skin The head skin indexed in the face plane
   * @param ra Face-plane position of the root along the brow, mm
   * @param rh Face-plane position of the root across, mm
   * @param angle Direction in the face plane, radians from the temple axis
   * @param hair Hair length, mm
   * @param seed The brow's seed
   * @param tries The hair's draw index
   * @returns The ribbon, or null where its path leaves the skin
   */
  export function lay(
    skin: AutoMovieHumanBrowProjector,
    ra: number,
    rh: number,
    angle: number,
    hair: number,
    seed: number,
    tries: number,
  ): IRibbon | null {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const N: typeof AutoMovieHumanAppearanceNoise =
      AutoMovieHumanAppearanceNoise;
    const points: AutoMovieHumanEyelid.Point[] = [];
    const normals: AutoMovieHumanEyelid.Point[] = [];
    for (let k: number = 0; k <= SEGMENTS; k++) {
      const s: number = k / SEGMENTS;
      const bend: number = 0.15 * s * s * (N.hash(seed, tries, 6) - 0.5);
      const da: number = Math.cos(angle + bend) * hair * s;
      const dh: number = Math.sin(angle + bend) * hair * s;
      const hit: ReturnType<AutoMovieHumanBrowProjector["project"]> =
        skin.project(ra + da, rh + dh);
      if (hit === null) break;

      const lift: number =
        0.04 + hair * Math.tan((8 * Math.PI) / 180) * s * (1 - 0.7 * s);
      points.push(E.add(hit.point, E.scale(hit.normal, lift)));
      normals.push(hit.normal);
    }
    return points.length === SEGMENTS + 1 ? { points, normals } : null;
  }

  /**
   * Ribbons facing the skin normal, tapering from root to tip.
   *
   * @param ribbons The hairs
   * @param scale Calibration millimetre to model unit factor
   * @returns Mesh in model units
   */
  export function mesh(ribbons: IRibbon[], scale: number): IAutoMovieMesh {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    for (const ribbon of ribbons) {
      const base: number = positions.length / 3;
      const m: number = ribbon.points.length;
      for (let k: number = 0; k < m; k++) {
        const tangent: AutoMovieHumanEyelid.Point = E.normalize(
          E.sub(
            ribbon.points[Math.min(m - 1, k + 1)]!,
            ribbon.points[Math.max(0, k - 1)]!,
          ),
        );
        const normal: AutoMovieHumanEyelid.Point = ribbon.normals[k]!;
        const side: AutoMovieHumanEyelid.Point = E.normalize(
          E.cross(normal, tangent),
        );
        const half: number = ROOT + (TIP - ROOT) * (k / (m - 1));
        for (const sign of [-1, 1]) {
          const p: AutoMovieHumanEyelid.Point = E.add(
            ribbon.points[k]!,
            E.scale(side, sign * half),
          );
          positions.push(p[0] * scale, p[1] * scale, p[2] * scale);
          normals.push(normal[0], normal[1], normal[2]);
        }
      }
      for (let k: number = 0; k + 1 < m; k++) {
        const a: number = base + 2 * k;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    return { positions, normals, uvs: null, indices, skin: null };
  }
}
