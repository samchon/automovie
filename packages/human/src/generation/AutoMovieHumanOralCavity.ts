import type { IAutoMovieMaterial, IAutoMovieModelPart } from "@automovie/interface";

import { AutoMovieHumanMouth } from "./AutoMovieHumanMouth";
import { AutoMovieHumanMouthPrior as Prior } from "./AutoMovieHumanMouthPrior";
import { AutoMovieHumanOralCavityMesh as Mesh } from "./AutoMovieHumanOralCavityMesh";

/**
 * The inside of the mouth as model parts: the cavity's lining from the
 * mouth's rim on the skin, the upper and lower teeth with their gums, and the tongue, built
 * from `AutoMovieHumanMouth` in calibration millimetres and scaled to metres.
 *
 * - Lining, `human.mouth.lining`: one meridian from every vertex of the rim
 *   of the `mouth` opening's trim loop on the skin, through the lips' inner faces
 *   pressed together just behind the slit, the vestibule's wall outside the
 *   front teeth, the molar section under the palate and over the floor, the
 *   oropharynx round the tongue's base, to a pole on the pharynx's back wall:
 *   a centripetal Catmull-Rom curve through those six points (Yuksel et al.
 *   2011), so neighbouring meridians run alike and the
 *   lining is smooth round the rim. The pressed faces close the slit at rest. Its first ring is the rim
 *   itself, at the same places, so the place-based binding gives the copies
 *   the skin's weights and the seam holds under any pose.
 * - Teeth, `human.mouth.teeth.upper|lower`: each crown a loft of
 *   super-ellipses along its own axis, from a root stub hidden in the gum to
 *   its edge or cusps, at its table dimensions: incisors thin to a blade,
 *   canines taper to a cusp, premolars and molars keep a table.
 * - Gums, `human.mouth.gum.upper|lower`: a tube along each arch over the
 *   crowns' necks.
 * - Tongue, `human.mouth.tongue`: a loft of super-ellipses from the tip behind
 *   the lower incisors to the pharynx, as wide as the lower arch's inside.
 *
 * The renderer casts no shadow, so a cavity would light as brightly as the
 * face. Every interior vertex is darkened by its depth behind the lips, by the
 * same convention as the nostril pockets (`AutoMovieHumanSkinTone`): a fall to
 * a tenth over the cavity's length, not a measured transport.
 */
export namespace AutoMovieHumanOralCavity {
  /** Interior parts and their materials. */
  export interface IOutput {
    /** Parts in metres, unbound; the rig binds them. */
    parts: IAutoMovieModelPart[];

    /** Mucosa, enamel and tongue materials. */
    materials: IAutoMovieMaterial[];
  }

  /** A mesh in millimetres with its vertex colours. */
  export interface IMesh {
    /** Flat positions, mm. */
    positions: number[];

    /** Triangle corners, counter-clockwise from the visible side. */
    indices: number[];

    /** Flat linear colours, one triple per vertex, darkened with depth. */
    colors: number[];
  }

  /**
   * Build the interior of one mouth.
   *
   * @param rim The `mouth` opening's rim on its base chain, its trim loop's
   *   points in loop order (`AutoMovieHumanBodySurface.IOutput.rims`), mm.
   * @param mouth The person's mouth.
   * @param scale Metres per calibration millimetre.
   */
  export function generate(
    rim: readonly [number, number, number][],
    mouth: AutoMovieHumanMouth.IMouth,
    scale: number,
  ): IOutput {
    const meshes: [string, string, IMesh][] = [
      ["human.mouth.lining", "human.mouth.mucosa", lining(rim, mouth)],
      ["human.mouth.gum.upper", "human.mouth.mucosa", gum(mouth, "upper")],
      ["human.mouth.gum.lower", "human.mouth.mucosa", gum(mouth, "lower")],
      ["human.mouth.teeth.upper", "human.mouth.enamel", teeth(mouth, "upper")],
      ["human.mouth.teeth.lower", "human.mouth.enamel", teeth(mouth, "lower")],
      ["human.mouth.tongue", "human.mouth.tongue", tongue(mouth)],
    ];
    return {
      parts: meshes.map(([id, material, mesh]): IAutoMovieModelPart => ({
        id,
        name: id,
        geometry: {
          type: "mesh",
          mesh: {
            positions: mesh.positions.map((v: number): number => Math.round(v * scale * 1e6) / 1e6),
            normals: normals(mesh).map((v: number): number => Math.round(v * 1e4) / 1e4),
            uvs: null,
            colors: mesh.colors.map((v: number): number => Math.round(v * 1e3) / 1e3),
            indices: mesh.indices,
            skin: null,
          },
        },
        material,
        attachedBone: null,
        transform: null,
      })),
      materials: [
        material("human.mouth.mucosa", "oral mucosa", MUCOSA_COLOUR, 0.45, true),
        material("human.mouth.enamel", "enamel", ENAMEL_COLOUR, 0.25, false),
        material("human.mouth.tongue", "tongue", TONGUE_COLOUR, 0.55, false),
      ],
    };
  }

  /** Angle of a rim point round the slit: 0 at the left cheilion, pi/2 on the upper lip. */
  export function angle(mouth: AutoMovieHumanMouth.IMouth, p: readonly number[]): number {
    const c: number = AutoMovieHumanMouth.contactAt(mouth, p[2]!);
    return Math.atan2((p[1]! - c) / mouth.slit, p[2]! / mouth.width);
  }

  /** The lining's meridians, rim to pharynx. */
  function lining(
    rim: readonly [number, number, number][],
    mouth: AutoMovieHumanMouth.IMouth,
  ): IMesh {
    const v: AutoMovieHumanMouth.ISection = mouth.vestibule;
    const m: AutoMovieHumanMouth.ISection = mouth.molars;
    const pole: Vec3 = [mouth.pharynx[0], mouth.pharynx[1], 0];
    const wall = (s: AutoMovieHumanMouth.ISection, t: number): Vec3 => {
      const c: number = Math.cos(t);
      const n: number = Math.sin(t);
      return [
        AutoMovieHumanMouth.sweepAt(s, c),
        s.y + (n >= 0 ? s.up : s.down) * n,
        s.width * c,
      ];
    };
    const positions: number[] = [];
    const colors: number[] = [];
    const rows: number = SPANS.reduce((a: number, b: number): number => a + b, 0);
    for (const point of rim) {
      const r: Vec3 = [point[0], point[1], point[2]];
      const t: number = angle(mouth, r);
      // The lips' inner faces press together across the slit, as deep behind
      // the rim as the slit is tall, each a tenth of the rim's own distance
      // from the contact line short of it, so the closed mouth shows no gap and
      // the two faces stay apart by place for the jaw's binding.
      const contact: Vec3 = [
        r[0] - mouth.slit,
        AutoMovieHumanMouth.contactAt(mouth, r[2]) + PRESSED * (r[1] - AutoMovieHumanMouth.contactAt(mouth, r[2])),
        r[2],
      ];
      const controls: Vec3[] = [r, contact, wall(v, t), wall(m, t), wall(mouth.oropharynx, t), pole];
      let row: number = 0;
      for (let s: number = 0; s < SPANS.length; s++)
        for (let k: number = 0; k < SPANS[s]!; k++) {
          const p: Vec3 = Mesh.catmull(controls, s, k / SPANS[s]!);
          positions.push(...p);
          colors.push(...shade(MUCOSA_COLOUR, 1 - row / rows));
          row++;
        }
    }
    // The shared pole.
    const apex: number = positions.length / 3;
    positions.push(...pole);
    colors.push(...shade(MUCOSA_COLOUR, 0));
    const indices: number[] = [];
    const n: number = rim.length;
    for (let i: number = 0; i < n; i++) {
      const a: number = i * rows;
      const b: number = ((i + 1) % n) * rows;
      for (let k: number = 0; k + 1 < rows; k++)
        indices.push(a + k, a + k + 1, b + k, b + k, a + k + 1, b + k + 1);
      indices.push(a + rows - 1, apex, b + rows - 1);
    }
    // Rim vertices keep their own places; the copies are only renumbered.
    return Mesh.inward({ positions, indices, colors }, [m.x, m.y, 0]);
  }

  /** Every tooth of one jaw. */
  function teeth(mouth: AutoMovieHumanMouth.IMouth, jaw: "upper" | "lower"): IMesh {
    const out: IMesh = { positions: [], indices: [], colors: [] };
    for (const tooth of mouth.teeth.filter((t): boolean => t.jaw === jaw)) {
      const c: Prior.ITooth = tooth.crown;
      const sections: number = 14;
      const around: number = 20;
      const base: number = out.positions.length / 3;
      const depth: number = mouth.edge[0] - tooth.neck[0];
      const light: number = darkness(depth, mouth);
      // From a root stub as deep as the gum to the crown's edge.
      const from: number = -Prior.GINGIVA / c.height;
      for (let i: number = 0; i <= sections; i++) {
        const h: number = from + ((1 - from) * i) / sections;
        const k: number = Math.max(0, h);
        const rise: number = Mesh.smooth(k / 0.45);
        const width: number =
          (c.neck + (c.width - c.neck) * rise) / 2 *
          (c.kind === "canine" ? 1 - 0.55 * k ** 3 : 1);
        const thick: number =
          (c.depth / 2) *
          (c.kind === "incisor"
            ? 1 - 0.8 * k ** 1.6
            : c.kind === "canine"
              ? 1 - 0.5 * k ** 1.8
              : 0.85 + 0.15 * rise);
        for (let j: number = 0; j < around; j++) {
          const phi: number = (2 * Math.PI * j) / around;
          const a: number = Mesh.superellipse(Math.cos(phi), TOOTH_POWER) * width;
          const b: number = Mesh.superellipse(Math.sin(phi), TOOTH_POWER) * thick;
          const p: Vec3 = [0, 1, 2].map(
            (q: number): number =>
              tooth.neck[q]! +
              tooth.axis[q]! * h * c.height +
              tooth.along[q]! * a +
              tooth.out[q]! * b,
          ) as Vec3;
          out.positions.push(...p);
          out.colors.push(...shade(ENAMEL_COLOUR, light));
        }
      }
      // The edge closes over a rounded cap to one point.
      const tip: Vec3 = [0, 1, 2].map(
        (q: number): number => tooth.neck[q]! + tooth.axis[q]! * (c.height + CAP),
      ) as Vec3;
      const apex: number = out.positions.length / 3;
      out.positions.push(...tip);
      out.colors.push(...shade(ENAMEL_COLOUR, light));
      Mesh.grid(out.indices, base, sections + 1, around, true);
      const last: number = base + sections * around;
      for (let j: number = 0; j < around; j++)
        out.indices.push(last + j, last + ((j + 1) % around), apex);
    }
    return Mesh.outward(out, mouth, jaw);
  }

  /** The gum over one arch's necks, a tube from one end of the arch to the other. */
  function gum(mouth: AutoMovieHumanMouth.IMouth, jaw: "upper" | "lower"): IMesh {
    const own: AutoMovieHumanMouth.ITooth[] = mouth.teeth.filter((t): boolean => t.jaw === jaw);
    const right: AutoMovieHumanMouth.ITooth[] = own.filter((t): boolean => t.neck[2] < 0).reverse();
    const left: AutoMovieHumanMouth.ITooth[] = own.filter((t): boolean => t.neck[2] >= 0);
    const path: AutoMovieHumanMouth.ITooth[] = [...right, ...left];
    const keys: Vec3[] = path.map((t): Vec3 =>
      [0, 1, 2].map((q: number): number => t.neck[q]! - t.axis[q]! * (Prior.GINGIVA / 2)) as Vec3,
    );
    const out: IMesh = { positions: [], indices: [], colors: [] };
    const along: number = 8;
    const around: number = 14;
    const stations: number = (keys.length - 1) * along + 1;
    for (let i: number = 0; i < stations; i++) {
      const s: number = Math.min(keys.length - 2, Math.floor(i / along));
      const f: number = i / along - s;
      const p: Vec3 = Mesh.catmull(keys, s, f);
      const q: AutoMovieHumanMouth.ITooth = path[Math.round(i / along)]!;
      const thick: number = q.crown.depth / 2 + GUM_OVER;
      const tall: number = Prior.GINGIVA / 2 + GUM_OVER;
      const light: number = darkness(mouth.edge[0] - p[0], mouth);
      for (let j: number = 0; j < around; j++) {
        const phi: number = (2 * Math.PI * j) / around;
        const point: Vec3 = [0, 1, 2].map(
          (k: number): number =>
            p[k]! + q.out[k]! * Math.cos(phi) * thick + q.axis[k]! * Math.sin(phi) * tall,
        ) as Vec3;
        out.positions.push(...point);
        out.colors.push(...shade(GUM_COLOUR, light));
      }
    }
    Mesh.grid(out.indices, 0, stations, around, true);
    Mesh.capEnds(out, 0, stations, around);
    return Mesh.outward(out, mouth, jaw);
  }

  /** The tongue at rest. */
  function tongue(mouth: AutoMovieHumanMouth.IMouth): IMesh {
    const t: AutoMovieHumanMouth.ITongue = mouth.tongue;
    const out: IMesh = { positions: [], indices: [], colors: [] };
    const stations: number = 32;
    const around: number = 24;
    for (let i: number = 0; i < stations; i++) {
      const l: number = (i + 0.5) / stations;
      const s: ITongueSection = section(t, l);
      const light: number = darkness(mouth.edge[0] - s.x, mouth);
      for (let j: number = 0; j < around; j++) {
        const phi: number = (2 * Math.PI * j) / around;
        const c: number = Mesh.superellipse(Math.cos(phi), TONGUE_POWER);
        const n: number = Mesh.superellipse(Math.sin(phi), TONGUE_POWER);
        const mid: number = (s.top + s.bottom) / 2;
        out.positions.push(s.x, mid + n * (s.top - s.bottom) / 2, c * s.width);
        out.colors.push(...shade(TONGUE_COLOUR, light));
      }
    }
    Mesh.grid(out.indices, 0, stations, around, true);
    Mesh.capEnds(out, 0, stations, around);
    return Mesh.inward(out, [t.molars, (t.dorsum + t.floor) / 2, 0], true);
  }

  /** One section of the tongue at its share from tip (0) to back (1). */
  export interface ITongueSection {
    /** Forward place, mm. */
    x: number;

    /** Half width, mm. */
    width: number;

    /** Height of the dorsum, mm. */
    top: number;

    /** Height of the underside, mm. */
    bottom: number;
  }

  /** The tongue's section at a share of its length. */
  export function section(t: AutoMovieHumanMouth.ITongue, l: number): ITongueSection {
    const reach: number = (t.tip - t.molars) / (t.tip - t.back);
    // Both ends round off as a quarter ellipse over a twelfth of the length.
    const end: number = Math.sqrt(Math.max(0, 1 - (1 - Math.min(1, Math.min(l, 1 - l) / END)) ** 2));
    const width: number = t.width * Math.sin((Math.PI / 2) * Math.min(1, l / reach)) ** 0.5;
    const top: number =
      l < reach
        ? t.tipTop + (t.dorsum - t.tipTop) * Mesh.smooth(l / reach)
        : t.dorsum - (t.dorsum - (t.dorsum + t.floor) / 2) * Mesh.smooth((l - reach) / (1 - reach));
    const bottom: number = t.floor + (t.tipTop - TIP_THICKNESS - t.floor) * (1 - Mesh.smooth(l / reach));
    const mid: number = (top + bottom) / 2;
    return {
      x: t.tip - (t.tip - t.back) * l,
      width: width * end,
      top: mid + ((top - mid) * end),
      bottom: mid - ((mid - bottom) * end),
    };
  }

  /** Lightness at a depth behind the upper incisors' edge. */
  function darkness(depth: number, mouth: AutoMovieHumanMouth.IMouth): number {
    const length: number = mouth.edge[0] - mouth.pharynx[0];
    return Math.max(0, Math.min(1, 1 - Math.max(0, depth) / length));
  }

  /** A colour darkened to a tenth at no lightness. */
  function shade(colour: Vec3, light: number): Vec3 {
    const f: number = DEEPEST + (1 - DEEPEST) * Math.max(0, Math.min(1, light)) ** 1.5;
    return [colour[0] * f, colour[1] * f, colour[2] * f];
  }

  /**
   * Area-weighted vertex normals (`AutoMovieHumanOralCavityMesh.normals`).
   *
   * @param mesh Positions and triangles.
   * @returns Flat unit normals, one triple per vertex.
   */
  export function normals(mesh: Pick<IMesh, "positions" | "indices">): number[] {
    return Mesh.normals(mesh);
  }

  /** A material whose colour and darkening the vertex colours carry. */
  function material(
    id: string,
    name: string,
    colour: Vec3,
    roughness: number,
    doubleSided: boolean,
  ): IAutoMovieMaterial {
    void colour;
    return {
      id,
      name,
      // Vertex colours carry the tissue's colour and its darkening.
      baseColor: { r: 1, g: 1, b: 1, a: 1, hex: null },
      metallic: 0,
      roughness,
      emissive: null,
      opacity: 1,
      baseColorTexture: null,
      specularIntensity: 0.3,
      doubleSided,
    };
  }

  type Vec3 = [number, number, number];

  /** Meridian points between the rim, the pressed faces, the vestibule, the molar and oropharyngeal sections and the pole. */
  const SPANS: readonly number[] = [3, 7, 8, 6, 4];

  /** Share of the rim's distance from the contact line the pressed inner faces keep from it. */
  export const PRESSED: number = 0.1;

  /** Super-ellipse exponent of a crown's section: a rounded box. */
  const TOOTH_POWER: number = 3;

  /** Super-ellipse exponent of the tongue's section. */
  const TONGUE_POWER: number = 2.4;

  /** Rise of a crown's closing point past its edge, mm. */
  const CAP: number = 0.6;

  /** The gum's reach past the necks and onto the crowns, mm. */
  const GUM_OVER: number = 0.8;

  /** Share of a tongue's length its ends round off over. */
  const END: number = 1 / 12;

  /** Thickness of the tongue's tip, mm. */
  const TIP_THICKNESS: number = 8;

  /** Lightness left at the pharynx. */
  const DEEPEST: number = 0.1;

  /** Linear colour of the oral mucosa, a convention. */
  const MUCOSA_COLOUR: Vec3 = [0.5, 0.13, 0.14];

  /** Linear colour of the gums, a convention. */
  const GUM_COLOUR: Vec3 = [0.6, 0.2, 0.22];

  /** Linear colour of enamel, a convention. */
  const ENAMEL_COLOUR: Vec3 = [0.78, 0.74, 0.62];

  /** Linear colour of the tongue's dorsum, a convention. */
  const TONGUE_COLOUR: Vec3 = [0.58, 0.2, 0.2];
}
