import type { IAutoMovieMaterial, IAutoMovieModelPart } from "@automovie/interface";

import { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import type { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import { AutoMovieHumanMouth } from "./AutoMovieHumanMouth";
import { AutoMovieHumanMouthPrior as Prior } from "./AutoMovieHumanMouthPrior";

/**
 * The inside of the mouth as model parts: the cavity's lining from the skin's
 * cut rim, the upper and lower teeth with their gums, and the tongue, built
 * from `AutoMovieHumanMouth` in calibration millimetres and scaled to metres.
 *
 * - Lining, `human.mouth.lining`: one meridian from every vertex of the rim
 *   the `mouth` aperture leaves in the skin, through the lips' inner faces
 *   pressed together just behind the slit, the vestibule's wall outside the
 *   front teeth, the molar section under the palate and over the floor, to a
 *   pole at the pharynx: a centripetal Catmull-Rom curve through those five
 *   points (Yuksel et al. 2011), so neighbouring meridians run alike and the
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
   * @param skin The cut skin in calibration mm, its `mouth` rim open.
   * @param mouth The person's mouth.
   * @param aperture The `mouth` aperture that cut the rim.
   * @param scale Metres per calibration millimetre.
   */
  export function generate(
    skin: AutoMovieHumanLoftMesh.IContext,
    mouth: AutoMovieHumanMouth.IMouth,
    aperture: IAutoMovieHumanLoftAperture,
    scale: number,
  ): IOutput {
    const meshes: [string, string, IMesh][] = [
      ["human.mouth.lining", "human.mouth.mucosa", lining(skin, mouth, aperture)],
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

  /**
   * The rim the `mouth` aperture leaves: the skin's open edges whose two ends
   * lie on its outline, as one loop in their own order.
   */
  export function rim(
    skin: AutoMovieHumanLoftMesh.IContext,
    aperture: IAutoMovieHumanLoftAperture,
  ): number[] {
    const outline: AutoMovieHumanLoftAperture.IOutline = AutoMovieHumanLoftAperture.outline(
      aperture,
      AutoMovieHumanLoftAperture.polyline(aperture),
    );
    const count: number = skin.positions.length / 3;
    const on = new Map<number, boolean>();
    const near = (v: number): boolean => {
      let known: boolean | undefined = on.get(v);
      if (known === undefined) {
        const d: number = AutoMovieHumanLoftAperture.signed(
          outline,
          [skin.positions[3 * v]!, skin.positions[3 * v + 1]!, skin.positions[3 * v + 2]!],
          1,
        );
        known = Math.abs(d) < ON_RIM;
        on.set(v, known);
      }
      return known;
    };
    const directed = new Set<number>();
    for (let t: number = 0; t < skin.indices.length; t += 3)
      for (let i: number = 0; i < 3; i++)
        directed.add(skin.indices[t + i]! * count + skin.indices[t + ((i + 1) % 3)]!);
    const next = new Map<number, number>();
    for (let t: number = 0; t < skin.indices.length; t += 3)
      for (let i: number = 0; i < 3; i++) {
        const u: number = skin.indices[t + i]!;
        const v: number = skin.indices[t + ((i + 1) % 3)]!;
        if (directed.has(v * count + u)) continue;
        if (near(u) && near(v)) next.set(u, v);
      }
    if (next.size === 0) throw new Error("The skin has no mouth rim");
    const loop: number[] = [];
    let current: number = next.keys().next().value!;
    do {
      if (loop.includes(current)) throw new Error("The mouth rim has a second loop");
      loop.push(current);
      const following: number | undefined = next.get(current);
      if (following === undefined) throw new Error("The mouth rim is open");
      current = following;
    } while (current !== loop[0]);
    if (loop.length !== next.size)
      throw new Error(`The mouth rim has ${next.size - loop.length} edges off its loop`);
    return loop;
  }

  /** Angle of a rim point round the slit: 0 at the left cheilion, pi/2 on the upper lip. */
  export function angle(mouth: AutoMovieHumanMouth.IMouth, p: readonly number[]): number {
    const c: number = AutoMovieHumanMouth.contactAt(mouth, p[2]!);
    return Math.atan2((p[1]! - c) / mouth.slit, p[2]! / mouth.width);
  }

  /** The lining's meridians, rim to pharynx. */
  function lining(
    skin: AutoMovieHumanLoftMesh.IContext,
    mouth: AutoMovieHumanMouth.IMouth,
    aperture: IAutoMovieHumanLoftAperture,
  ): IMesh {
    const loop: number[] = rim(skin, aperture);
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
    for (const index of loop) {
      const r: Vec3 = [
        skin.positions[3 * index]!,
        skin.positions[3 * index + 1]!,
        skin.positions[3 * index + 2]!,
      ];
      const t: number = angle(mouth, r);
      // The lips' inner faces press together across the slit, as deep behind
      // the rim as the slit is tall, each a fifth of the slit's height short of
      // the contact line, so the closed mouth shows no gap and the two faces
      // stay apart by place for the jaw's binding.
      const contact: Vec3 = [
        r[0] - mouth.slit,
        AutoMovieHumanMouth.contactAt(mouth, r[2]) + PRESSED * (r[1] - AutoMovieHumanMouth.contactAt(mouth, r[2])),
        r[2],
      ];
      const controls: Vec3[] = [r, contact, wall(v, t), wall(m, t), pole];
      let row: number = 0;
      for (let s: number = 0; s < SPANS.length; s++)
        for (let k: number = 0; k < SPANS[s]!; k++) {
          const p: Vec3 = catmull(controls, s, k / SPANS[s]!);
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
    const n: number = loop.length;
    for (let i: number = 0; i < n; i++) {
      const a: number = i * rows;
      const b: number = ((i + 1) % n) * rows;
      for (let k: number = 0; k + 1 < rows; k++)
        indices.push(a + k, a + k + 1, b + k, b + k, a + k + 1, b + k + 1);
      indices.push(a + rows - 1, apex, b + rows - 1);
    }
    // Rim vertices keep their own places; the copies are only renumbered.
    return inward({ positions, indices, colors }, [m.x, m.y, 0]);
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
        const rise: number = smooth(k / 0.45);
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
          const a: number = superellipse(Math.cos(phi), TOOTH_POWER) * width;
          const b: number = superellipse(Math.sin(phi), TOOTH_POWER) * thick;
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
      grid(out.indices, base, sections + 1, around, true);
      const last: number = base + sections * around;
      for (let j: number = 0; j < around; j++)
        out.indices.push(last + j, last + ((j + 1) % around), apex);
    }
    return outward(out, mouth, jaw);
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
      const p: Vec3 = catmull(keys, s, f);
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
    grid(out.indices, 0, stations, around, true);
    capEnds(out, 0, stations, around);
    return outward(out, mouth, jaw);
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
        const c: number = superellipse(Math.cos(phi), TONGUE_POWER);
        const n: number = superellipse(Math.sin(phi), TONGUE_POWER);
        const mid: number = (s.top + s.bottom) / 2;
        out.positions.push(s.x, mid + n * (s.top - s.bottom) / 2, c * s.width);
        out.colors.push(...shade(TONGUE_COLOUR, light));
      }
    }
    grid(out.indices, 0, stations, around, true);
    capEnds(out, 0, stations, around);
    return inward(out, [t.molars, (t.dorsum + t.floor) / 2, 0], true);
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
        ? t.tipTop + (t.dorsum - t.tipTop) * smooth(l / reach)
        : t.dorsum - (t.dorsum - (t.dorsum + t.floor) / 2) * smooth((l - reach) / (1 - reach));
    const bottom: number = t.floor + (t.tipTop - TIP_THICKNESS - t.floor) * (1 - smooth(l / reach));
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

  /** Quads of a grid of rings, each `around` long, wrapped round. */
  function grid(indices: number[], base: number, rings: number, around: number, wrap: boolean): void {
    for (let i: number = 0; i + 1 < rings; i++)
      for (let j: number = 0; j < (wrap ? around : around - 1); j++) {
        const a: number = base + i * around + j;
        const b: number = base + i * around + ((j + 1) % around);
        const c: number = a + around;
        const d: number = b + around;
        indices.push(a, b, c, b, d, c);
      }
  }

  /** Close a tube's two end rings, each at its centroid. */
  function capEnds(mesh: IMesh, base: number, rings: number, around: number): void {
    for (const [ring, flip] of [[0, true], [rings - 1, false]] as [number, boolean][]) {
      const start: number = base + ring * around;
      const centre: number[] = [0, 1, 2].map(
        (k: number): number =>
          Array.from({ length: around }, (_: unknown, j: number): number => mesh.positions[3 * (start + j) + k]!).reduce(
            (a: number, b: number): number => a + b,
            0,
          ) / around,
      );
      const apex: number = mesh.positions.length / 3;
      mesh.positions.push(...centre);
      mesh.colors.push(...mesh.colors.slice(3 * start, 3 * start + 3));
      for (let j: number = 0; j < around; j++) {
        const a: number = start + j;
        const b: number = start + ((j + 1) % around);
        mesh.indices.push(...(flip ? [b, a, apex] : [a, b, apex]));
      }
    }
  }

  /**
   * Wind a closed or open mesh so its normals face away from (`out`) or
   * toward a point, by the sign of the summed agreement of its faces.
   */
  function orient(mesh: IMesh, centre: readonly number[], away: boolean): IMesh {
    let sum: number = 0;
    const p = mesh.positions;
    for (let t: number = 0; t < mesh.indices.length; t += 3) {
      const [a, b, c] = [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!];
      const u: Vec3 = [p[3 * b]! - p[3 * a]!, p[3 * b + 1]! - p[3 * a + 1]!, p[3 * b + 2]! - p[3 * a + 2]!];
      const w: Vec3 = [p[3 * c]! - p[3 * a]!, p[3 * c + 1]! - p[3 * a + 1]!, p[3 * c + 2]! - p[3 * a + 2]!];
      const n: Vec3 = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
      sum +=
        n[0] * (p[3 * a]! - centre[0]!) + n[1] * (p[3 * a + 1]! - centre[1]!) + n[2] * (p[3 * a + 2]! - centre[2]!);
    }
    if (sum < 0 === away)
      for (let t: number = 0; t < mesh.indices.length; t += 3) {
        const b: number = mesh.indices[t + 1]!;
        mesh.indices[t + 1] = mesh.indices[t + 2]!;
        mesh.indices[t + 2] = b;
      }
    return mesh;
  }

  /** The lining faces into the cavity; a closed body faces out from its centre. */
  function inward(mesh: IMesh, centre: readonly number[], body: boolean = false): IMesh {
    return orient(mesh, centre, body);
  }

  /** Teeth and gums face away from the middle of their own arch. */
  function outward(mesh: IMesh, mouth: AutoMovieHumanMouth.IMouth, jaw: "upper" | "lower"): IMesh {
    // Each crown is closed, and its own centre lies inside it, so each is
    // wound from its first ring's centroid: a sum over the whole arch would
    // let the long side outvote a short one.
    void mouth;
    void jaw;
    return orientPieces(mesh);
  }

  /** Wind each connected piece of a mesh outward from its own centroid. */
  function orientPieces(mesh: IMesh): IMesh {
    const count: number = mesh.positions.length / 3;
    const parent: Int32Array = Int32Array.from({ length: count }, (_: unknown, i: number): number => i);
    const find = (v: number): number => {
      while (parent[v] !== v) {
        parent[v] = parent[parent[v]!]!;
        v = parent[v]!;
      }
      return v;
    };
    for (let t: number = 0; t < mesh.indices.length; t += 3) {
      parent[find(mesh.indices[t]!)] = find(mesh.indices[t + 1]!);
      parent[find(mesh.indices[t + 1]!)] = find(mesh.indices[t + 2]!);
    }
    const groups = new Map<number, number[]>();
    for (let t: number = 0; t < mesh.indices.length; t += 3) {
      const root: number = find(mesh.indices[t]!);
      const list: number[] = groups.get(root) ?? [];
      list.push(t);
      groups.set(root, list);
    }
    const out: number[] = [];
    for (const triangles of groups.values()) {
      const vertices = [...new Set(triangles.flatMap((t: number): number[] => [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!]))];
      const centre: number[] = [0, 1, 2].map(
        (k: number): number => vertices.reduce((a: number, v: number): number => a + mesh.positions[3 * v + k]!, 0) / vertices.length,
      );
      const piece: IMesh = {
        positions: mesh.positions,
        colors: mesh.colors,
        indices: triangles.flatMap((t: number): number[] => [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!]),
      };
      out.push(...orient(piece, centre, true).indices);
    }
    mesh.indices = out;
    return mesh;
  }

  /** Area-weighted vertex normals. */
  export function normals(mesh: Pick<IMesh, "positions" | "indices">): number[] {
    const out: number[] = new Array<number>(mesh.positions.length).fill(0);
    const p = mesh.positions;
    for (let t: number = 0; t < mesh.indices.length; t += 3) {
      const [a, b, c] = [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!];
      const u: Vec3 = [p[3 * b]! - p[3 * a]!, p[3 * b + 1]! - p[3 * a + 1]!, p[3 * b + 2]! - p[3 * a + 2]!];
      const w: Vec3 = [p[3 * c]! - p[3 * a]!, p[3 * c + 1]! - p[3 * a + 1]!, p[3 * c + 2]! - p[3 * a + 2]!];
      const n: Vec3 = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
      for (const v of [a, b, c]) for (let k: number = 0; k < 3; k++) out[3 * v + k]! += n[k]!;
    }
    for (let v: number = 0; v < out.length; v += 3) {
      const l: number = Math.hypot(out[v]!, out[v + 1]!, out[v + 2]!) || 1;
      out[v]! /= l;
      out[v + 1]! /= l;
      out[v + 2]! /= l;
    }
    return out;
  }

  /** Centripetal Catmull-Rom point on span s of a control list, ends doubled. */
  function catmull(points: readonly Vec3[], s: number, f: number): Vec3 {
    const p0: Vec3 = points[Math.max(0, s - 1)]!;
    const p1: Vec3 = points[s]!;
    const p2: Vec3 = points[s + 1]!;
    const p3: Vec3 = points[Math.min(points.length - 1, s + 2)]!;
    const knot = (a: Vec3, b: Vec3): number => Math.max(1e-6, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) ** 0.5);
    const t0: number = 0;
    const t1: number = t0 + (s === 0 ? knot(p1, p2) : knot(p0, p1));
    const t2: number = t1 + knot(p1, p2);
    const t3: number = t2 + (s + 2 >= points.length ? knot(p1, p2) : knot(p2, p3));
    const q0: Vec3 = s === 0 ? sub(scale3(p1, 2), p2) : p0;
    const q3: Vec3 = s + 2 >= points.length ? sub(scale3(p2, 2), p1) : p3;
    const t: number = t1 + (t2 - t1) * f;
    const lerp = (a: Vec3, b: Vec3, ta: number, tb: number): Vec3 =>
      [0, 1, 2].map((k: number): number => ((tb - t) * a[k]! + (t - ta) * b[k]!) / (tb - ta)) as Vec3;
    const a1: Vec3 = lerp(q0, p1, t0, t1);
    const a2: Vec3 = lerp(p1, p2, t1, t2);
    const a3: Vec3 = lerp(p2, q3, t2, t3);
    const b1: Vec3 = lerp(a1, a2, t0, t2);
    const b2: Vec3 = lerp(a2, a3, t1, t3);
    return lerp(b1, b2, t1, t2);
  }

  function sub(a: Vec3, b: Vec3): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function scale3(a: Vec3, s: number): Vec3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** Signed power of a super-ellipse's coordinate. */
  function superellipse(c: number, power: number): number {
    return Math.sign(c) * Math.abs(c) ** (2 / power);
  }

  function smooth(x: number): number {
    const t: number = Math.max(0, Math.min(1, x));
    return t * t * (3 - 2 * t);
  }

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

  /** Meridian points between the rim, the pressed faces, the vestibule, the molar section and the pole. */
  const SPANS: readonly number[] = [3, 7, 8, 8];

  /** Share of the slit's half-height the pressed inner faces keep from the contact line. */
  export const PRESSED: number = 0.2;

  /**
   * Largest distance of a rim vertex from the slit's outline, mm: the cut
   * keeps a vertex within 0.1 mm of an outline where it is and counts it on
   * the outline (`AutoMovieHumanBodyApertures`), so the rim lies within that.
   */
  const ON_RIM: number = 0.15;

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
