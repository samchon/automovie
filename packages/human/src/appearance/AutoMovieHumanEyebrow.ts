import type {
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";
import type { IAutoMovieHumanBrowAppearance } from "../structures/appearance/IAutoMovieHumanBrowAppearance";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import { AutoMovieHumanHairShade } from "./AutoMovieHumanHairShade";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";

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
    const a = (p: Readonly<AutoMovieHumanEyelid.Point>): number =>
      E.dot(E.sub(p, medial), temple);
    const stations: Record<string, number> = {
      head: -1,
      medial: 0,
      limbus: a(g.centre) + 5.85,
      lateral: a(lateral),
      end: a(lateral) + 9,
    };
    const controls: { a: number; mid: number; width: number }[] = CONTROLS.map(
      (c: { at: string; upper: number; width: number }) => ({
        a: stations[c.at]!,
        mid: c.upper - c.width / 2,
        width: c.width,
      }),
    );
    const brow = (
      t: number,
    ): { a: number; mid: number; width: number; slope: number } =>
      curve(controls, t);
    const length: number = controls[controls.length - 1]!.a - controls[0]!.a;

    // Head skin in calibration mm, indexed in the face plane.
    const skin: Projector | null = Projector.create(
      parts,
      scale,
      g,
      medial,
      temple,
    );
    if (skin === null) return null;

    // Face-plane point of brow coordinates: t along (0 head, 1 tail), v
    // across (-1 lower border, +1 upper).
    const face = (t: number, v: number): [number, number] => {
      const b = brow(t);
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
      const b = brow(t);
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
      const [ra, rh] = face(t, v);
      const points: AutoMovieHumanEyelid.Point[] = [];
      const normals: AutoMovieHumanEyelid.Point[] = [];
      for (let k: number = 0; k <= SEGMENTS; k++) {
        const s: number = k / SEGMENTS;
        const bend: number = 0.15 * s * s * (N.hash(seed, tries, 6) - 0.5);
        const da: number = Math.cos(angle + bend) * hair * s;
        const dh: number = Math.sin(angle + bend) * hair * s;
        const hit = skin.project(ra + da, rh + dh);
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
    const [r, g, b] = AutoMovieHumanHairShade.linear(brow.color);
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

  /** Brow middle line, width and axis slope at `t` by a Catmull-Rom spline. */
  function curve(
    controls: { a: number; mid: number; width: number }[],
    t: number,
  ): { a: number; mid: number; width: number; slope: number } {
    const segments: number = controls.length - 1;
    const x: number = Math.min(segments - 1e-9, Math.max(0, t * segments));
    const i: number = Math.floor(x);
    const u: number = x - i;
    const at = (k: number): { a: number; mid: number; width: number } =>
      controls[Math.min(segments, Math.max(0, k))]!;
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const cr = (
      f: (c: { a: number; mid: number; width: number }) => number,
      w: number,
    ): number => {
      const a0: number = f(p0);
      const a1: number = f(p1);
      const a2: number = f(p2);
      const a3: number = f(p3);
      return (
        0.5 *
        (2 * a1 +
          (-a0 + a2) * w +
          (2 * a0 - 5 * a1 + 4 * a2 - a3) * w * w +
          (-a0 + 3 * a1 - 3 * a2 + a3) * w * w * w)
      );
    };
    const e: number = 1e-3;
    const da: number =
      cr((c) => c.a, Math.min(1, u + e)) - cr((c) => c.a, Math.max(0, u - e));
    const dm: number =
      cr((c) => c.mid, Math.min(1, u + e)) -
      cr((c) => c.mid, Math.max(0, u - e));
    return {
      a: cr((c) => c.a, u),
      mid: cr((c) => c.mid, u),
      width: cr((c) => c.width, u),
      slope: da !== 0 ? dm / da : 0,
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

  /**
   * Projection of face-plane points onto the head skin along the line of
   * sight: the frontmost crossing, with the skin's interpolated normal.
   */
  class Projector {
    private constructor(
      private readonly triangles: Float64Array,
      private readonly grid: Map<number, number[]>,
      private readonly g: AutoMovieHumanEyelid.IGlobe,
      private readonly origin: AutoMovieHumanEyelid.Point,
      private readonly temple: AutoMovieHumanEyelid.Point,
    ) {}

    /** Cell size of the face-plane index, mm. */
    private static readonly CELL: number = 2;

    /**
     * Index the head skin triangles near the brow.
     *
     * @returns The projector, or null without head skin
     */
    public static create(
      parts: readonly IAutoMovieModelPart[],
      scale: number,
      g: AutoMovieHumanEyelid.IGlobe,
      origin: AutoMovieHumanEyelid.Point,
      temple: AutoMovieHumanEyelid.Point,
    ): Projector | null {
      const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
      const data: number[] = [];
      const grid: Map<number, number[]> = new Map();
      for (const part of parts) {
        if (
          !AutoMovieHumanHeadField.owns(part.id) ||
          part.geometry.type !== "mesh"
        )
          continue;
        const mesh: IAutoMovieMesh = part.geometry.mesh;
        const p: number[] = mesh.positions;
        const nrm: number[] | null = mesh.normals;
        const index: number[] | null = mesh.indices;
        const count: number = index === null ? p.length / 3 : index.length;
        for (let t: number = 0; t < count; t += 3) {
          const corners: number[] = [0, 1, 2].map((k: number): number =>
            index === null ? t + k : index[t + k]!,
          );
          const pts: AutoMovieHumanEyelid.Point[] = corners.map(
            (v: number): AutoMovieHumanEyelid.Point => [
              p[3 * v]! / scale,
              p[3 * v + 1]! / scale,
              p[3 * v + 2]! / scale,
            ],
          );
          const plane: [number, number][] = pts.map(
            (q: AutoMovieHumanEyelid.Point): [number, number] => [
              E.dot(E.sub(q, origin), temple),
              E.dot(E.sub(q, origin), g.up),
            ],
          );
          const lo: [number, number] = [
            Math.min(...plane.map((q) => q[0])),
            Math.min(...plane.map((q) => q[1])),
          ];
          const hi: [number, number] = [
            Math.max(...plane.map((q) => q[0])),
            Math.max(...plane.map((q) => q[1])),
          ];
          if (hi[0] < -15 || lo[0] > 60 || hi[1] < 5 || lo[1] > 45) continue;
          const id: number = data.length / 18;
          for (let k: number = 0; k < 3; k++) {
            data.push(...pts[k]!);
            const v: number = corners[k]!;
            const n: AutoMovieHumanEyelid.Point =
              nrm === null
                ? [0, 0, 0]
                : [nrm[3 * v]!, nrm[3 * v + 1]!, nrm[3 * v + 2]!];
            data.push(...n);
          }
          for (
            let i: number = Math.floor(lo[0] / Projector.CELL);
            i <= Math.floor(hi[0] / Projector.CELL);
            i++
          )
            for (
              let j: number = Math.floor(lo[1] / Projector.CELL);
              j <= Math.floor(hi[1] / Projector.CELL);
              j++
            ) {
              const key: number = i * 4096 + j;
              const list: number[] = grid.get(key) ?? [];
              list.push(id);
              grid.set(key, list);
            }
        }
      }
      if (data.length === 0) return null;
      return new Projector(Float64Array.from(data), grid, g, origin, temple);
    }

    /**
     * Frontmost skin crossing of the line of sight through a face-plane
     * point.
     *
     * @param a Distance toward the temple from the origin, mm
     * @param h Height above the origin, mm
     * @returns Point and unit normal, or null where no skin lies
     */
    public project(
      a: number,
      h: number,
    ): {
      point: AutoMovieHumanEyelid.Point;
      normal: AutoMovieHumanEyelid.Point;
    } | null {
      const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
      const list: number[] | undefined = this.grid.get(
        Math.floor(a / Projector.CELL) * 4096 + Math.floor(h / Projector.CELL),
      );
      if (list === undefined) return null;
      let best: {
        point: AutoMovieHumanEyelid.Point;
        normal: AutoMovieHumanEyelid.Point;
      } | null = null;
      let front: number = -Infinity;
      const d: Float64Array = this.triangles;
      for (const id of list) {
        const o: number = id * 18;
        const P = (k: number): AutoMovieHumanEyelid.Point => [
          d[o + 6 * k]!,
          d[o + 6 * k + 1]!,
          d[o + 6 * k + 2]!,
        ];
        const Nn = (k: number): AutoMovieHumanEyelid.Point => [
          d[o + 6 * k + 3]!,
          d[o + 6 * k + 4]!,
          d[o + 6 * k + 5]!,
        ];
        const q: [number, number][] = [0, 1, 2].map(
          (k: number): [number, number] => [
            E.dot(E.sub(P(k), this.origin), this.temple),
            E.dot(E.sub(P(k), this.origin), this.g.up),
          ],
        );
        const det: number =
          (q[1]![0] - q[0]![0]) * (q[2]![1] - q[0]![1]) -
          (q[2]![0] - q[0]![0]) * (q[1]![1] - q[0]![1]);
        if (Math.abs(det) < 1e-12) continue;
        const u: number =
          ((a - q[0]![0]) * (q[2]![1] - q[0]![1]) -
            (q[2]![0] - q[0]![0]) * (h - q[0]![1])) /
          det;
        const v: number =
          ((q[1]![0] - q[0]![0]) * (h - q[0]![1]) -
            (a - q[0]![0]) * (q[1]![1] - q[0]![1])) /
          det;
        if (u < -1e-9 || v < -1e-9 || u + v > 1 + 1e-9) continue;
        const point: AutoMovieHumanEyelid.Point = E.add(
          E.add(E.scale(P(0), 1 - u - v), E.scale(P(1), u)),
          E.scale(P(2), v),
        );
        const depth: number = E.dot(point, this.g.forward);
        if (depth <= front) continue;
        front = depth;
        let normal: AutoMovieHumanEyelid.Point = E.normalize(
          E.add(
            E.add(E.scale(Nn(0), 1 - u - v), E.scale(Nn(1), u)),
            E.scale(Nn(2), v),
          ),
        );
        if (E.dot(normal, normal) < 0.5)
          normal = E.normalize(E.cross(E.sub(P(1), P(0)), E.sub(P(2), P(0))));
        if (E.dot(normal, this.g.forward) < 0) normal = E.scale(normal, -1);
        best = { point, normal };
      }
      return best;
    }
  }
}
