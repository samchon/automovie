import { AutoMovieHumanSeamPatch } from "../../lofting/AutoMovieHumanSeamPatch";
import { AutoMovieHumanWebSides } from "./AutoMovieHumanWebSides";

/**
 * A web as one transfinite patch over its four published boundaries: where
 * more than two pieces meet (the palm, two digits and the crest) the skin is
 * the Hermite boolean sum of the four owners' ribbons and not a smoothed
 * blend (`AutoMovieHumanSeamPatch`, Coons 1967 and Gordon 1969, with a
 * Gregory blend where the owners' twists disagree).
 *
 * A hand's web has the palmar crest and the dorsal crest apart (the palmar
 * crest stands distal of the dorsal, Gray 1918: the palmar web reaches the
 * middle of the proximal phalanx), so each face of the web is its own patch
 * with its own crest as the top side; the toes' webs are the same patch with
 * the foot's owners. Declared G2 on every side, so the finger's first
 * section, the palm's ring and the crest meet it without a crease ring.
 */
export namespace AutoMovieHumanWebPatch {
  /** A built patch and its mesh. */
  export interface IMesh {
    /** The patch, ready to evaluate. */
    patch: AutoMovieHumanSeamPatch.IPatch;

    /** Vertices, mm, `(nu + 1) * (nv + 1)` in rows of `u`. */
    points: [number, number, number][];

    /** Triangle indices, counter-clockwise from the patch's `across x along` normal. */
    indices: number[];
  }

  /**
   * Build the patch over four boundaries.
   *
   * @param name Name in errors, such as `hand.left.web-index-middle.palmar`.
   * @param boundaries The four owners' published boundaries.
   */
  export function of(name: string, boundaries: AutoMovieHumanWebSides.IBoundaries): AutoMovieHumanSeamPatch.IPatch {
    const { sides, continuity }: AutoMovieHumanWebSides.ISides = AutoMovieHumanWebSides.of(boundaries);
    return AutoMovieHumanSeamPatch.create(name, sides, continuity);
  }

  /**
   * Evaluate the patch on a regular chart grid into a mesh.
   *
   * @param patch The patch.
   * @param nu Cells along `u`.
   * @param nv Cells along `v`.
   */
  export function mesh(patch: AutoMovieHumanSeamPatch.IPatch, nu: number, nv: number): IMesh {
    const points: [number, number, number][] = [];
    for (let j: number = 0; j <= nv; j++)
      for (let i: number = 0; i <= nu; i++) {
        const p: number[] = AutoMovieHumanSeamPatch.evaluate(patch, i / nu, j / nv).p;
        points.push([p[0]!, p[1]!, p[2]!]);
      }

    const indices: number[] = [];
    for (let j: number = 0; j < nv; j++)
      for (let i: number = 0; i < nu; i++) {
        const a: number = j * (nu + 1) + i;
        const b: number = a + 1;
        const c: number = a + nu + 1;
        indices.push(a, b, c, b, c + 1, c);
      }
    return { patch, points, indices };
  }
}
