import type { IAutoMovieMaterial, IAutoMovieMesh } from "@automovie/interface";

import { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";
import type { IAutoMovieHumanEyelash } from "../structures/appearance/IAutoMovieHumanEyelash";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import { AutoMovieHumanHairShade } from "./AutoMovieHumanHairShade";

/**
 * Eyelashes of one eye as tapered strand tubes rooted along the lash line.
 *
 * Representation: every lash is a curved centreline of SEGMENTS segments
 * swept by a three-sided tube whose radius tapers from root to tip, built
 * in calibration millimetres on the lid's anterior edge (see
 * {@link AutoMovieHumanEyelid}) and scaled into the model. Strand geometry
 * reads correctly from every direction, which a camera-facing card does
 * not, and costs a few thousand triangles per eye.
 *
 * Rules (Aumond and Bitton 2018, measured counts relayed; Gray 1918):
 *
 * - counts: 150 upper lashes in three staggered rows across the lash line,
 *   45 lower lashes in two rows; the upper count lies in the 90 to 160
 *   range, the lower count below the 75 to 80 range so the sparse, fine
 *   lower lashes do not read as a fence at render scale;
 * - extent: upper lashes from 16 to 98 percent of the upper lid from the
 *   medial canthus, lower from 30 to 94 percent; the medial end is sparse;
 * - length: the input's longest upper lash at about 60 percent along the
 *   lid, falling to about half medially and 60 percent laterally; lower
 *   lashes about 30 percent of the upper; outer rows shorter, each lash
 *   varied by a seeded factor (the length profile is a convention, the
 *   source states no distribution by lid position);
 * - curl: every lash curves from the bulb; upper lashes leave the lid
 *   slightly below the line of sight and turn up by about 75 degrees over
 *   their length, lower lashes leave slightly downward and turn down, so
 *   the two never interlace;
 * - splay: lashes fan out along the lid, medial ones toward the nose and
 *   lateral ones toward the temple;
 * - clumping: neighbouring lashes gather in small groups whose tips pull
 *   together, as real lashes do; groups of four to six, tips drawn a third
 *   of the way to the group's mean.
 *
 * Shading: the input's lash colour (see {@link AutoMovieHumanHairShade}),
 * slightly glossy.
 */
export namespace AutoMovieHumanEyelash {
  /** Segments per lash centreline. */
  const SEGMENTS: number = 8;

  /** Root radius of a lash, mm (diameters about 0.1 to 0.12 mm). */
  const ROOT: number = 0.055;

  /** Tip radius of a lash, mm. */
  const TIP: number = 0.008;

  /**
   * Build both lash rows of one eye.
   *
   * @param lid Lid margin in calibration millimetres
   * @param lash Lash input; its `length` is the longest upper lash in mm
   * @param scale Calibration millimetre to model unit factor
   * @param seed Seed of the per-lash variation, distinct per eye
   * @returns Lash tubes in model units, or null for zero length
   */
  export function generate(
    lid: AutoMovieHumanEyelid.ILid,
    lash: IAutoMovieHumanEyelash,
    scale: number,
    seed: number,
  ): IAutoMovieMesh | null {
    if (!(lash.length > 0)) return null;
    const strands: AutoMovieHumanEyelid.Point[][] = [
      ...row(lid, true, lash.length, seed),
      ...row(lid, false, lash.length, seed + 7919),
    ];
    return tubes(strands, scale);
  }

  /**
   * Lash material `human.hair.lashes.<side>`.
   *
   * @param lash Lash input, for its colour
   * @param side Eye side, which names the material
   * @returns The material
   */
  export function material(
    lash: IAutoMovieHumanEyelash,
    side: "left" | "right",
  ): IAutoMovieMaterial {
    const [r, g, b] = AutoMovieHumanHairShade.linear(lash.color);
    return {
      id: `human.hair.lashes.${side}`,
      name: "eyelashes",
      baseColor: { r: r * 0.8, g: g * 0.8, b: b * 0.8, a: 1, hex: null },
      metallic: 0,
      roughness: 0.42,
      emissive: null,
      opacity: 1,
      baseColorTexture: null,
      specularIntensity: 0.6,
    };
  }

  /** Centrelines of one lid's lashes. */
  function row(
    lid: AutoMovieHumanEyelid.ILid,
    upper: boolean,
    longest: number,
    seed: number,
  ): AutoMovieHumanEyelid.Point[][] {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const N: typeof AutoMovieHumanAppearanceNoise =
      AutoMovieHumanAppearanceNoise;
    const g: AutoMovieHumanEyelid.IGlobe = lid.globe;
    const lidSamples: AutoMovieHumanEyelid.ISample[] = lid.samples
      .filter((s: AutoMovieHumanEyelid.ISample): boolean => s.upper === upper)
      .sort(
        (
          a: AutoMovieHumanEyelid.ISample,
          b: AutoMovieHumanEyelid.ISample,
        ): number => a.position - b.position,
      );

    // Toward the temple, across the face.
    const temple: AutoMovieHumanEyelid.Point = E.normalize(
      E.sub(
        lid.samples[lid.lateral]!.contact,
        lid.samples[lid.medial]!.contact,
      ),
    );
    const count: number = upper ? 150 : 45;
    const rows: number = upper ? 3 : 2;
    const [first, last] = upper ? [0.16, 0.98] : [0.3, 0.94];
    const peak: number = upper ? 0.6 : 0.65;

    const strands: AutoMovieHumanEyelid.Point[][] = [];
    for (let i: number = 0; i < count; i++) {
      const lane: number = i % rows;
      const p: number =
        first +
        ((last - first) * (i + 0.5 + 0.6 * (N.hash(seed, i, 1) - 0.5))) / count;
      const s: AutoMovieHumanEyelid.ISample = along(lidSamples, p);

      // Root on the anterior lid surface just outside the anterior edge,
      // one row behind another.
      const root: AutoMovieHumanEyelid.Point = E.add(
        E.add(s.anterior, E.scale(s.outward, 0.12 + 0.18 * lane)),
        E.scale(g.forward, -0.08 * lane),
      );

      // Length profile along the lid and per lash.
      const profile: number =
        0.5 + 0.5 * Math.exp(-(((p - peak) / (p < peak ? 0.3 : 0.38)) ** 2));
      const length: number =
        longest *
        (upper ? 1 : 0.3) *
        profile *
        (1 - 0.1 * lane) *
        (0.82 + 0.22 * N.hash(seed, i, 2));

      // Curl: leave slightly below (upper) or above (lower) the line of
      // sight, turning toward the lid's outward side.
      const start: number =
        ((upper ? -8 : -4) + 6 * (N.hash(seed, i, 3) - 0.5)) * (Math.PI / 180);
      const turn: number =
        ((upper ? 78 : 50) + 20 * (N.hash(seed, i, 4) - 0.5)) * (Math.PI / 180);
      const splay: number =
        ((p - 0.45) * (upper ? 40 : 30) + 6 * (N.hash(seed, i, 5) - 0.5)) *
        (Math.PI / 180);
      const ahead: AutoMovieHumanEyelid.Point = E.normalize(
        E.add(
          E.scale(g.forward, Math.cos(splay)),
          E.scale(temple, Math.sin(splay)),
        ),
      );
      const side: AutoMovieHumanEyelid.Point = E.normalize(
        E.sub(s.outward, E.scale(ahead, E.dot(s.outward, ahead))),
      );
      const strand: AutoMovieHumanEyelid.Point[] = [root];
      let at: AutoMovieHumanEyelid.Point = root;
      for (let k: number = 0; k < SEGMENTS; k++) {
        const t: number = (k + 0.5) / SEGMENTS;
        const angle: number = start + turn * t ** 1.4;
        const step: AutoMovieHumanEyelid.Point = E.scale(
          E.add(
            E.scale(ahead, Math.cos(angle)),
            E.scale(side, Math.sin(angle)),
          ),
          length / SEGMENTS,
        );
        at = E.add(at, step);
        strand.push(at);
      }
      strands.push(strand);
    }

    // Clumps: consecutive lashes in groups of four to six pull their tips
    // a third of the way to the group's mean tip, more toward the tip.
    let begin: number = 0;
    let group: number = 0;
    while (begin < strands.length) {
      const size: number = 4 + Math.floor(3 * N.hash(seed, group, 6));
      const members: AutoMovieHumanEyelid.Point[][] = strands.slice(
        begin,
        begin + size,
      );
      const mean: AutoMovieHumanEyelid.Point = E.scale(
        members.reduce(
          (
            sum: AutoMovieHumanEyelid.Point,
            m: AutoMovieHumanEyelid.Point[],
          ): AutoMovieHumanEyelid.Point => E.add(sum, m[SEGMENTS]!),
          [0, 0, 0],
        ),
        1 / members.length,
      );
      for (const m of members) {
        const pull: AutoMovieHumanEyelid.Point = E.sub(mean, m[SEGMENTS]!);
        for (let k: number = 1; k <= SEGMENTS; k++)
          m[k] = E.add(m[k]!, E.scale(pull, 0.33 * (k / SEGMENTS) ** 2));
      }
      begin += size;
      group++;
    }
    return strands;
  }

  /** Lid sample at a position along one lid, by linear interpolation. */
  function along(
    samples: AutoMovieHumanEyelid.ISample[],
    p: number,
  ): AutoMovieHumanEyelid.ISample {
    let i: number = 0;
    while (i + 2 < samples.length && samples[i + 1]!.position < p) i++;
    const a: AutoMovieHumanEyelid.ISample = samples[i]!;
    const b: AutoMovieHumanEyelid.ISample = samples[i + 1]!;
    const span: number = b.position - a.position;
    const w: number =
      span > 0 ? Math.min(1, Math.max(0, (p - a.position) / span)) : 0;
    const mix = (
      u: AutoMovieHumanEyelid.Point,
      v: AutoMovieHumanEyelid.Point,
    ): AutoMovieHumanEyelid.Point =>
      AutoMovieHumanEyelid.add(
        AutoMovieHumanEyelid.scale(u, 1 - w),
        AutoMovieHumanEyelid.scale(v, w),
      );
    return {
      ...a,
      contact: mix(a.contact, b.contact),
      anterior: mix(a.anterior, b.anterior),
      outward: AutoMovieHumanEyelid.normalize(mix(a.outward, b.outward)),
      tangent: AutoMovieHumanEyelid.normalize(mix(a.tangent, b.tangent)),
      position: p,
    };
  }

  /** Three-sided tapered tubes around centrelines, in model units. */
  function tubes(
    strands: AutoMovieHumanEyelid.Point[][],
    scale: number,
  ): IAutoMovieMesh {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    for (const strand of strands) {
      const base: number = positions.length / 3;
      const m: number = strand.length;
      let reference: AutoMovieHumanEyelid.Point = [0, 1, 0];
      for (let k: number = 0; k < m; k++) {
        const tangent: AutoMovieHumanEyelid.Point = E.normalize(
          E.sub(strand[Math.min(m - 1, k + 1)]!, strand[Math.max(0, k - 1)]!),
        );
        // Parallel transport of the ring frame keeps the tube untwisted.
        let u: AutoMovieHumanEyelid.Point = E.normalize(
          E.sub(reference, E.scale(tangent, E.dot(reference, tangent))),
        );
        if (E.dot(u, u) < 0.5) u = E.normalize(E.cross(tangent, [1, 0, 0]));
        reference = u;
        const v: AutoMovieHumanEyelid.Point = E.cross(tangent, u);
        const t: number = k / (m - 1);
        const radius: number = ROOT + (TIP - ROOT) * t ** 0.8;
        for (let j: number = 0; j < 3; j++) {
          const a: number = (2 * Math.PI * j) / 3;
          const n: AutoMovieHumanEyelid.Point = E.add(
            E.scale(u, Math.cos(a)),
            E.scale(v, Math.sin(a)),
          );
          const p: AutoMovieHumanEyelid.Point = E.add(
            strand[k]!,
            E.scale(n, radius),
          );
          positions.push(p[0] * scale, p[1] * scale, p[2] * scale);
          normals.push(n[0], n[1], n[2]);
        }
      }
      for (let k: number = 0; k + 1 < m; k++)
        for (let j: number = 0; j < 3; j++) {
          const a: number = base + 3 * k + j;
          const b: number = base + 3 * k + ((j + 1) % 3);
          indices.push(a, b, a + 3, b, b + 3, a + 3);
        }
    }
    return { positions, normals, uvs: null, indices, skin: null };
  }
}
