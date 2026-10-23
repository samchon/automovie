import type { IAutoMovieMaterial, IAutoMovieMesh } from "@automovie/interface";

import { AutoMovieHumanEyeGlobe } from "../generation/AutoMovieHumanEyeGlobe";
import { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";

/**
 * Wet tissue of the eye opening beside the globe: the caruncle with the
 * plica semilunaris at the medial canthus, and the tear meniscus along the
 * lid margins.
 *
 * Representation: both are grids of columns over the lid's margin samples
 * (see {@link AutoMovieHumanEyelid}), built in calibration millimetres and
 * scaled into the model.
 *
 * - Caruncle: the medial end of the opening runs past the globe's
 *   silhouette, and the space between the margin and the globe holds the
 *   caruncle, a pink fleshy mound, and lateral to it the plica, a pale
 *   crescent fold of conjunctiva against the globe (Gray 1918). Each margin
 *   sample beyond `PLICA` of the globe's radius from its axis spans a
 *   column from the posterior lid edge to the globe surface at `PLICA`,
 *   bulging forward by up to 0.4 mm, so the mound fills the canthus and
 *   closes the view into the lid's tuck behind it.
 * - Tear meniscus: the tear film gathers in a concave strip, about 0.3 mm
 *   high, where the lid margin meets the eye, most visibly on the lower
 *   lid (Gray 1918; the meniscus height is a convention near the clinical
 *   0.2 to 0.4 mm). Each sample on the globe spans a concave quadratic
 *   arc from the margin face to the globe surface, with the posterior edge
 *   as control point; it thins toward the canthi.
 *
 * The meniscus is transparent water whose look is its highlight, so its
 * material is a faint, glossy, alpha-blended film.
 */
export namespace AutoMovieHumanConjunctiva {
  /** Generated meshes of one eye, in model metres. */
  export interface IOutput {
    /** Caruncle and plica at the medial canthus. */
    caruncle: IAutoMovieMesh;

    /** Tear meniscus along both lid margins. */
    meniscus: IAutoMovieMesh;
  }

  /** Distance from the globe axis, as a fraction of its radius, of the plica. */
  const PLICA: number = 0.93;

  /**
   * Build the caruncle and meniscus of one eye.
   *
   * @param lid Lid margin in calibration millimetres
   * @param scale Calibration millimetre to model unit factor
   * @returns Meshes in model units
   */
  export function generate(
    lid: AutoMovieHumanEyelid.ILid,
    scale: number,
  ): IOutput {
    const medial = caruncle(lid);
    return {
      caruncle: mesh(medial.grid, medial.colours, lid.globe.forward, scale),
      meniscus: meniscus(lid, scale),
    };
  }

  /**
   * Materials `human.eye.caruncle` (moist pink tissue, colour in the
   * vertex colours under a clear coat) and `human.eye.meniscus` (tear film).
   *
   * @returns The two materials
   */
  export function materials(): IAutoMovieMaterial[] {
    return [
      {
        id: "human.eye.caruncle",
        name: "eye caruncle",
        baseColor: { r: 1, g: 1, b: 1, a: 1, hex: null },
        metallic: 0,
        roughness: 0.5,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
        clearcoat: 1,
        doubleSided: true,
      },
      {
        id: "human.eye.meniscus",
        name: "eye tear meniscus",
        baseColor: { r: 0.3, g: 0.28, b: 0.28, a: 1, hex: null },
        metallic: 0,
        roughness: 0.05,
        emissive: null,
        opacity: 0.3,
        baseColorTexture: null,
        alphaMode: "blend",
        clearcoat: 1,
        doubleSided: true,
      },
    ];
  }

  /**
   * Caruncle over the samples beyond the plica around the medial canthus:
   * a low mound, fleshy pink at the corner and paler toward the plica on
   * the globe.
   */
  function caruncle(lid: AutoMovieHumanEyelid.ILid): {
    grid: AutoMovieHumanEyelid.Point[][];
    colours: [number, number, number][][];
  } {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const g: AutoMovieHumanEyelid.IGlobe = lid.globe;
    const n: number = lid.samples.length;
    const radial: number = AutoMovieHumanEyeGlobe.dimensions.radial;
    const plica: number = PLICA * radial;

    // Contiguous run of samples around the medial canthus beyond the plica.
    let from: number = lid.medial;
    let to: number = lid.medial;
    while (lid.samples[(from - 1 + n) % n]!.rho > plica && from - to > -n / 2)
      from--;
    while (lid.samples[(to + 1) % n]!.rho > plica && to - from < n / 2) to++;
    const run: AutoMovieHumanEyelid.ISample[] = [];
    for (let i: number = from - 1; i <= to + 1; i++)
      run.push(lid.samples[(i + n) % n]!);
    const reach: number = Math.max(
      ...run.map((s: AutoMovieHumanEyelid.ISample): number => s.rho - plica),
    );

    // sRGB at the corner and at the plica.
    const corner: [number, number, number] = [188, 132, 128];
    const fold: [number, number, number] = [214, 182, 176];
    const rows: number = 9;
    const grid: AutoMovieHumanEyelid.Point[][] = [];
    const colours: [number, number, number][][] = [];
    for (const s of run) {
      const offset: AutoMovieHumanEyelid.Point = E.sub(s.contact, g.centre);
      const across: AutoMovieHumanEyelid.Point = E.normalize(
        E.sub(offset, E.scale(g.forward, E.dot(offset, g.forward))),
      );
      const foot: AutoMovieHumanEyelid.Point = E.add(
        E.add(g.centre, E.scale(across, plica)),
        E.scale(g.forward, AutoMovieHumanEyeGlobe.anterior(plica) + 0.05),
      );
      const extent: number = Math.max(0, s.rho - plica);
      const bulge: number =
        Math.min(0.4, 0.15 * extent) *
        Math.sqrt(reach > 0 ? extent / reach : 0);
      const column: AutoMovieHumanEyelid.Point[] = [];
      const tint: [number, number, number][] = [];
      for (let r: number = 0; r < rows; r++) {
        // Rows start a little inside the posterior lid edge so the tissue
        // meets the lid without sharing its edge.
        const v: number = 0.04 + (0.96 * r) / (rows - 1);
        column.push(
          E.add(
            E.add(E.scale(s.contact, 1 - v), E.scale(foot, v)),
            E.scale(g.forward, bulge * Math.sin(Math.PI * v) ** 0.7),
          ),
        );
        const pale: number = E.smoothstep(0.45, 1, v);
        tint.push(
          linear([
            corner[0] + (fold[0] - corner[0]) * pale,
            corner[1] + (fold[1] - corner[1]) * pale,
            corner[2] + (fold[2] - corner[2]) * pale,
          ]),
        );
      }
      grid.push(column);
      colours.push(tint);
    }
    return { grid, colours };
  }

  /** Meniscus strip along the samples resting on the globe. */
  function meniscus(
    lid: AutoMovieHumanEyelid.ILid,
    scale: number,
  ): IAutoMovieMesh {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const g: AutoMovieHumanEyelid.IGlobe = lid.globe;
    const radial: number = AutoMovieHumanEyeGlobe.dimensions.radial;
    const n: number = lid.samples.length;

    // Start just after the medial canthus so the strip runs round the
    // opening once, ending at it; samples off the globe get zero height.
    const grid: AutoMovieHumanEyelid.Point[][] = [];
    for (let k: number = 0; k <= n; k++) {
      const s: AutoMovieHumanEyelid.ISample =
        lid.samples[(lid.medial + k) % n]!;
      const on: number = 1 - E.smoothstep(0.82 * radial, PLICA * radial, s.rho);
      const h: number =
        (s.upper ? 0.18 : 0.32) * on * E.smoothstep(0, 3, s.corner);
      const face: AutoMovieHumanEyelid.Point = E.normalize(
        E.sub(s.anterior, s.contact),
      );
      const lidPoint: AutoMovieHumanEyelid.Point = E.add(
        s.contact,
        E.scale(face, h),
      );
      const inward: AutoMovieHumanEyelid.Point = E.add(
        s.contact,
        E.scale(s.outward, -h),
      );
      const depth: number = AutoMovieHumanEyelid.surface(g, inward);
      const globePoint: AutoMovieHumanEyelid.Point = Number.isFinite(depth)
        ? E.add(
            inward,
            E.scale(
              g.forward,
              depth + 0.02 - E.dot(E.sub(inward, g.centre), g.forward),
            ),
          )
        : inward;
      const column: AutoMovieHumanEyelid.Point[] = [];
      for (const t of [0, 0.25, 0.5, 0.75, 1])
        column.push(
          E.add(
            E.add(
              E.scale(lidPoint, (1 - t) ** 2),
              E.scale(s.contact, 2 * t * (1 - t)),
            ),
            E.scale(globePoint, t * t),
          ),
        );
      grid.push(column);
    }
    return mesh(grid, null, g.forward, scale);
  }

  /**
   * Indexed mesh of a column grid (columns side by side, rows along each),
   * with area-weighted normals turned toward `facing`.
   */
  function mesh(
    grid: AutoMovieHumanEyelid.Point[][],
    colours: [number, number, number][][] | null,
    facing: AutoMovieHumanEyelid.Point,
    scale: number,
  ): IAutoMovieMesh {
    const rows: number = grid[0]!.length;
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    grid.forEach((column: AutoMovieHumanEyelid.Point[], c: number): void => {
      column.forEach((p: AutoMovieHumanEyelid.Point, r: number): void => {
        positions.push(p[0] * scale, p[1] * scale, p[2] * scale);
        if (colours !== null) colors.push(...colours[c]![r]!);
      });
    });
    for (let c: number = 0; c + 1 < grid.length; c++)
      for (let r: number = 0; r + 1 < rows; r++) {
        const a: number = c * rows + r;
        const b: number = a + rows;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }

    // Area-weighted normals; the winding is flipped as a whole if most of
    // the surface faces away from `facing`.
    const normals: number[] = new Array<number>(positions.length).fill(0);
    let sum: number = 0;
    for (let t: number = 0; t < indices.length; t += 3) {
      const [a, b, c] = [indices[t]!, indices[t + 1]!, indices[t + 2]!];
      const u: number[] = [0, 1, 2].map(
        (k: number): number => positions[3 * b + k]! - positions[3 * a + k]!,
      );
      const v: number[] = [0, 1, 2].map(
        (k: number): number => positions[3 * c + k]! - positions[3 * a + k]!,
      );
      const n: number[] = [
        u[1]! * v[2]! - u[2]! * v[1]!,
        u[2]! * v[0]! - u[0]! * v[2]!,
        u[0]! * v[1]! - u[1]! * v[0]!,
      ];
      sum += n[0]! * facing[0] + n[1]! * facing[1] + n[2]! * facing[2];
      for (const w of [a, b, c])
        for (let k: number = 0; k < 3; k++) normals[3 * w + k]! += n[k]!;
    }
    const flip: number = sum < 0 ? -1 : 1;
    if (flip < 0)
      for (let t: number = 0; t < indices.length; t += 3) {
        const b: number = indices[t + 1]!;
        indices[t + 1] = indices[t + 2]!;
        indices[t + 2] = b;
      }
    for (let v: number = 0; v < normals.length; v += 3) {
      const l: number =
        Math.hypot(normals[v]!, normals[v + 1]!, normals[v + 2]!) || 1;
      for (let k: number = 0; k < 3; k++)
        normals[v + k] = (flip * normals[v + k]!) / l;
    }
    return {
      positions,
      normals,
      uvs: null,
      ...(colours === null ? {} : { colors }),
      indices,
      skin: null,
    };
  }

  /** Linear components of an 8-bit sRGB colour. */
  function linear(srgb: [number, number, number]): [number, number, number] {
    return srgb.map((c: number): number => {
      const v: number = c / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
  }
}
