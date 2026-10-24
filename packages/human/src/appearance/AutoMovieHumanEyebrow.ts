import type {
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";
import type { IAutoMovieHumanBrowAppearance } from "../structures/appearance/IAutoMovieHumanBrowAppearance";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import { AutoMovieHumanBrowProjector } from "./AutoMovieHumanBrowProjector";
import { AutoMovieHumanHairShade } from "./AutoMovieHumanHairShade";

/**
 * Eyebrow of one eye as flat strands lying on the generated skin.
 *
 * Placement: the brow is laid out in the face plane (the eye opening's
 * projection plane, lateral and up) from the same eye's canthi, then every
 * hair point is projected along the line of sight onto the generated head
 * skin, so the brow follows whatever brow ridge the body generator made.
 * Its middle line passes, above the horizontal through the medial
 * canthus, at heights taken from the upper brow margin of young adult
 * women with the eyes opened smoothly (Park et al. 2017: 26.4 mm at the
 * medial canthus, 31.0 at the lateral limbus, 28.4 at the lateral canthus,
 * 21.6 at the lateral end) less half the brow's width there. The brow
 * starts 1 mm medial of the medial canthus and ends 9 mm beyond the
 * lateral canthus, about where the line from the nasal ala through the
 * lateral canthus meets it (a conventional landmark), its tail inside the
 * 1.2 to 1.7 cm of Rajput 2021; its width
 * swells from 3.5 mm at its rounded medial start to 9 mm above the medial
 * canthus, then falls through 6.5 mm at the peak to 2 mm at the
 * tail (a groomed brow; the widths are conventions inside Rajput's 1 to
 * 1.5 cm for men).
 *
 * Hairs (Rajput 2021, conventional, and Gray 1918): about 1100 per brow,
 * denser at the head and body and thinning to the tail and the borders,
 * whose edge is broken by noise so it is not a stencil. Direction in the
 * face plane, as an angle from the brow axis toward the temple: the head
 * hairs, sparse and fading in over the first fifth, point up and out (40
 * to 70 degrees from the lower to the upper
 * border, fanning), the body's upper-border
 * hairs point down-and-out and its lower-border hairs up-and-out,
 * converging on the axis (about 28 degrees times the position across the
 * brow), and the tail runs along the axis, sloping down a few degrees.
 * Hairs lie nearly flush (a lift of 8 degrees, falling back), 3.5 to 6.5 mm
 * long, tapering ribbons that face the skin.
 *
 * Determinism: fixed seeds per eye.
 */
export namespace AutoMovieHumanEyebrow {
  /** Hairs per brow. */
  const COUNT: number = 1100;

  /** Segments per hair. */
  const SEGMENTS: number = 5;

  /** Ribbon half-width at the root, mm. */
  const ROOT: number = 0.05;

  /** Ribbon half-width at the tip, mm. */
  const TIP: number = 0.012;

  /**
   * Middle line control points: distance from the medial canthus toward
   * the temple (in units named by `at`), height of the upper margin above
   * the medial canthus and width, mm.
   */
  const CONTROLS: ReadonlyArray<{
    at: "head" | "medial" | "limbus" | "lateral" | "end";
    upper: number;
    width: number;
  }> = [
    { at: "head", upper: 24.0, width: 3.5 },
    { at: "medial", upper: 26.4, width: 9.0 },
    { at: "limbus", upper: 31.0, width: 6.5 },
    { at: "lateral", upper: 28.4, width: 5.0 },
    { at: "end", upper: 21.6, width: 2.0 },
  ];

  /**
   * Build one brow.
   *
   * @param lid The eye's lid margin in calibration millimetres
   * @param parts Generated body parts in model units, for the head skin
   * @param scale Calibration millimetre to model unit factor
   * @param seed Seed of the hair placement, distinct per eye
   * @returns Brow strands in model units, or null without head skin
   */
  export function generate(
    lid: AutoMovieHumanEyelid.ILid,
    parts: readonly IAutoMovieModelPart[],
    scale: number,
    seed: number,
  ): IAutoMovieMesh | null {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const N: typeof AutoMovieHumanAppearanceNoise =
      AutoMovieHumanAppearanceNoise;
    const g: AutoMovieHumanEyelid.IGlobe = lid.globe;

    // Face-plane frame at the medial canthus: `a` toward the temple, `h` up.
    const medial: AutoMovieHumanEyelid.Point = lid.samples[lid.medial]!.contact;
    const lateral: AutoMovieHumanEyelid.Point =
      lid.samples[lid.lateral]!.contact;
    const sign: number = E.dot(E.sub(lateral, medial), g.lateral) >= 0 ? 1 : -1;
    const temple: AutoMovieHumanEyelid.Point = E.scale(g.lateral, sign);
    const a: (p: Readonly<AutoMovieHumanEyelid.Point>) => number = (
      p: Readonly<AutoMovieHumanEyelid.Point>,
    ): number =>
      E.dot(E.sub(p, medial), temple);
    const stations: Record<string, number> = {
      head: -1,
      medial: 0,
      limbus: a(g.centre) + 5.85,
      lateral: a(lateral),
      end: a(lateral) + 9,
    };
    const controls: { a: number; mid: number; width: number }[] = CONTROLS.map(
      (c: {
        at: string;
        upper: number;
        width: number;
      }): { a: number; mid: number; width: number } => ({
        a: stations[c.at]!,
        mid: c.upper - c.width / 2,
        width: c.width,
      }),
    );
    const brow: (t: number) => ReturnType<typeof curve> = (
      t: number,
    ): { a: number; mid: number; width: number; slope: number } =>
      curve(controls, t);
    const length: number = controls[controls.length - 1]!.a - controls[0]!.a;

    // Head skin in calibration mm, indexed in the face plane.
    const skin: AutoMovieHumanBrowProjector | null =
      AutoMovieHumanBrowProjector.create(parts, scale, g, medial, temple);
    if (skin === null) return null;

    // Face-plane point of brow coordinates: t along (0 head, 1 tail), v
    // across (-1 lower border, +1 upper).
    const face: (t: number, v: number) => [number, number] = (
      t: number,
      v: number,
    ): [number, number] => {
      const b: ReturnType<typeof brow> = brow(t);
      return [b.a, b.mid + (v * b.width) / 2];
    };

    const ribbons: {
      points: AutoMovieHumanEyelid.Point[];
      normals: AutoMovieHumanEyelid.Point[];
    }[] = [];
    let tries: number = 0;
    while (ribbons.length < COUNT && tries < COUNT * 20) {
      tries++;
      const t: number = N.hash(seed, tries, 1);
      const v: number = 2 * N.hash(seed, tries, 2) - 1;

      // Density: full over head and body, thinning along the tail; the
      // borders fade over a noisy edge.
      const edge: number =
        0.72 + 0.2 * (N.value2(seed + 3, t * 18, v > 0 ? 1 : 0, 0) - 0.5);
      const keep: number =
        (1 - 0.6 * E.smoothstep(0.55, 1, t)) *
        (1 - E.smoothstep(edge, 1.02, Math.abs(v))) *
        E.smoothstep(-0.04, 0.22, t) *
        (0.45 + 0.55 * E.smoothstep(0, 0.3, t));
      if (N.hash(seed, tries, 3) > keep) continue;

      // Direction in the face plane, from the brow axis toward the temple.
      const b: ReturnType<typeof brow> = brow(t);
      const axis: number = Math.atan(b.slope);
      const head: number = 1 - E.smoothstep(0.06, 0.2, t);
      const tail: number = E.smoothstep(0.7, 0.95, t);
      const body: number = -28 * v;
      const degrees: number =
        head * (55 + 15 * v) +
        (1 - head) * ((1 - tail) * body + tail * -6) +
        (10 + 12 * head) * (N.hash(seed, tries, 4) - 0.5);
      const angle: number = axis + (degrees * Math.PI) / 180;
      const hair: number =
        (3.5 + 3 * N.hash(seed, tries, 5)) * (1 - 0.35 * head);

      // Hair points along the face plane, projected onto the skin and
      // lifted off it along its normal.
      const [ra, rh]: [number, number] = face(t, v);
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
      if (points.length === SEGMENTS + 1) ribbons.push({ points, normals });
    }
    if (length <= 0 || ribbons.length === 0) return null;
    return mesh(ribbons, scale);
  }

  /**
   * Brow material `human.hair.brows.<side>`.
   *
   * @param brow Brow input, for its colour
   * @param side Eye side, which names the material
   * @returns The material
   */
  export function material(
    brow: IAutoMovieHumanBrowAppearance,
    side: "left" | "right",
  ): IAutoMovieMaterial {
    const [r, g, b]: [number, number, number] = AutoMovieHumanHairShade.linear(
      brow.color,
    );
    return {
      id: `human.hair.brows.${side}`,
      name: "eyebrows",
      baseColor: { r, g, b, a: 1, hex: null },
      metallic: 0,
      roughness: 0.5,
      emissive: null,
      opacity: 1,
      baseColorTexture: null,
      doubleSided: true,
      specularIntensity: 0.5,
    };
  }

  /**
   * Brow profile at a fraction of its physical temple-directed distance.
   * The distance itself is linear and strictly increasing. Only height and
   * width interpolate, with tangents measured per millimetre rather than
   * per control index: the short head-to-medial span cannot reverse under
   * a tangent borrowed from the much longer medial-to-limbus span.
   */
  function curve(
    controls: { a: number; mid: number; width: number }[],
    t: number,
  ): { a: number; mid: number; width: number; slope: number } {
    const last: number = controls.length - 1;
    const distance: number =
      controls[0]!.a +
      Math.min(1, Math.max(0, t)) * (controls[last]!.a - controls[0]!.a);
    let i: number = 0;
    while (i + 1 < last && controls[i + 1]!.a < distance) i++;
    const span: number = controls[i + 1]!.a - controls[i]!.a;
    const u: number = (distance - controls[i]!.a) / span;
    /** Value and physical derivative on nonuniform observed stations. */
    const profile: (key: "mid" | "width") => [number, number] = (
      key: "mid" | "width",
    ): [number, number] => {
      /** Secant derivative per millimetre, one-sided at each end. */
      const slope: (k: number) => number = (k: number): number => {
        const lo: number = Math.max(0, k - 1);
        const hi: number = Math.min(last, k + 1);
        return (
          (controls[hi]![key] - controls[lo]![key]) /
          (controls[hi]!.a - controls[lo]!.a)
        );
      };
      const a: number = controls[i]![key];
      const b: number = controls[i + 1]![key];
      const ma: number = slope(i);
      const mb: number = slope(i + 1);
      return [
        (2 * u ** 3 - 3 * u * u + 1) * a +
          (u ** 3 - 2 * u * u + u) * span * ma +
          (-2 * u ** 3 + 3 * u * u) * b +
          (u ** 3 - u * u) * span * mb,
        ((6 * u * u - 6 * u) * a + (-6 * u * u + 6 * u) * b) / span +
          (3 * u * u - 4 * u + 1) * ma +
          (3 * u * u - 2 * u) * mb,
      ];
    };
    const [mid, slope]: [number, number] = profile("mid");
    return {
      a: distance,
      mid,
      width: profile("width")[0],
      slope,
    };
  }

  /** Ribbons facing the skin normal, tapering from root to tip. */
  function mesh(
    ribbons: {
      points: AutoMovieHumanEyelid.Point[];
      normals: AutoMovieHumanEyelid.Point[];
    }[],
    scale: number,
  ): IAutoMovieMesh {
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
