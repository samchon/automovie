import type { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import { AutoMovieSolidBlendChain } from "./AutoMovieSolidBlendChain";
import { AutoMovieSolidChain } from "./AutoMovieSolidChain";
import { AutoMovieSolidClip } from "./AutoMovieSolidClip";
import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSolidDiff } from "./AutoMovieSolidDiff";
import type { AutoMovieSolidJoin } from "./AutoMovieSolidJoin";
import { AutoMovieSolidMerge } from "./AutoMovieSolidMerge";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * A solid built by merges and diffs, as trimmed faces that share their
 * boundaries: the base, every blend and every part, each a surface with its
 * trim cycles in its own chart (`AutoMovieSolidCycle`), the shared
 * boundary vertices held once in the body's mesh.
 *
 * A merge ({@link merge}) traces its part against the body as an atlas
 * ({@link atlas}), so its curve and its host rail cross from face to face
 * (the thigh against the trunk and the gluteal mass, a malleolus on the
 * shank-to-foot blend, the second breast against the first). It adds the
 * blend face (the join's blend chain, its two rails its station-end
 * cycles), gives the part face its rail cycle (a part merged again at its
 * other end keeps both, a limb merged at its root and at its foot), and
 * trims every host face the host rail runs over: a rail on one face adds its
 * loop, a rail that crosses faces is clipped into each face it runs on
 * (`AutoMovieSolidClip`). Where two blends meet (the perineum, the
 * webs, the cleavage), the later merge's rail simply runs over the earlier
 * blend face, so no corner needs its own patch.
 *
 * {@link draw} tessellates every face on its own grid trimmed by its cycles
 * (`AutoMovieSolidMesh.face`), shared boundaries vertex for vertex.
 *
 * @evidence contracts/common.md#principled-implementation A merged solid is a set of trimmed faces sharing boundary vertices, and each merge traces against all faces as one atlas, so a later part can meet an earlier blend.
 * @evidence contracts/common.md#clear-and-simple-design Create, merge, draw and publish over one body record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A merge whose rail or trim fails returns its diagnostic and no blend; no face is patched to close a gap.
 * @evidence contracts/common.md#meaningful-documentation States the faces, their cycles, the merge's steps and the published form.
 * @evidence contracts/performance.md#efficient-algorithms Each merge traces once and clips only the faces its rail crosses; drawing tessellates each face once.
 * @evidence contracts/performance.md#reuse-equivalent-work Boundary vertices are created once in the shared mesh and referenced by every face that meets them.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The body owns its faces and mesh; publishing copies only the cycle points.
 */
export namespace AutoMovieSolidBody {
  /** One face. */
  export interface IFace {
    /** The surface. */
    surface: IAutoMovieSolidSurface;

    /** Grid stations of its tessellation, strictly increasing. */
    stations: number[];

    /** Grid phases of its tessellation, strictly increasing, one period's worth on a periodic face. */
    phases: number[];

    /** Its trim cycles. */
    cycles: AutoMovieSolidCycle.ICycle[];

    /** Whether it is a diff's cutter, drawn facing into the cutter. */
    inverted?: boolean;
  }

  /** The body. */
  export interface IBody {
    /** Name in diagnostics. */
    name: string;

    /** Its faces. */
    faces: IFace[];

    /** The shared vertices (and, after {@link draw}, the triangles). */
    mesh: AutoMovieSolidMesh.IMesh;

    /** Every merge's published blend, in merge order. */
    blends: AutoMovieSolidBlendChain.IBlend[];
  }

  /** A face to add, before it has cycles. */
  export interface IFaceInput {
    /** The surface. */
    surface: IAutoMovieSolidSurface;

    /** Grid stations. */
    stations: number[];

    /** Grid phases. */
    phases: number[];
  }

  /** One merge or diff onto the body. */
  export interface IMerge {
    /** The blend chain's name. */
    name: string;

    /** Merge or diff. */
    kind: "merge" | "diff";

    /** The part: a new face, or the index of a face already in the body (a part merged again at its other end). */
    part: IFaceInput | number;

    /** The join's seed, parameter, trace limits and widths. */
    join: Omit<AutoMovieSolidJoin.IInput, "part" | "host">;

    /** Columns of the published blend, a positive multiple of 4. */
    count: number;

    /** Grid stations of the blend face across its span, at least 1. */
    rows: number;
  }

  /** A merge's outcome. */
  export interface IMerged {
    /** The published blend, or null when a premise broke. */
    blend: AutoMovieSolidBlendChain.IBlend | null;

    /** The join the blend spans, or null with the blend. */
    join: AutoMovieSolidJoin.IJoin | null;

    /** Every broken premise. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * A body of base faces, untrimmed.
   *
   * @param name Name in diagnostics.
   * @param faces The base faces.
   * @returns The body.
   */
  export function create(name: string, faces: IFaceInput[]): IBody {
    return { name, faces: faces.map((f: IFaceInput): IFace => ({ ...f, cycles: [] })), mesh: AutoMovieSolidMesh.create(), blends: [] };
  }

  /**
   * The body as an atlas of its faces, leaving one out (the part of a merge
   * that is already a face).
   *
   * @param body The body.
   * @param without A face index to leave out, or -1.
   * @returns The atlas and the body index of each atlas face.
   */
  export function atlas(body: IBody, without: number = -1): { atlas: IAutoMovieSolidAtlas; index: number[] } {
    const index: number[] = body.faces.map((_: IFace, k: number): number => k).filter((k: number): boolean => k !== without);
    const back: Map<number, number> = new Map(index.map((k: number, i: number): [number, number] => [k, i]));
    // The faces as they stand now: a join keeps reading this atlas after the
    // merge trims its host, and must still see the host untrimmed there.
    const frozen: IFace[] = index.map((k: number): IFace => ({ ...body.faces[k]!, cycles: body.faces[k]!.cycles.map(copy) }));
    const face = (i: number): IFace => frozen[i]!;
    return {
      index,
      atlas: {
        name: body.name,
        faces: index.map((k: number): IAutoMovieSolidSurface => body.faces[k]!.surface),
        kept: (i: number, u: number, v: number): boolean => kept(face(i), u, v),
        across: (i: number, u: number, v: number): { face: number; u: number; v: number } | null => {
          // The nearest segment of a cycle the point lies past.
          const f: IFace = face(i);
          let best: { cycle: AutoMovieSolidCycle.ICycle; foot: AutoMovieSolidCycle.IFoot } | null = null;
          for (const c of f.cycles) {
            if (AutoMovieSolidCycle.kept(c, u, v, f.surface.period)) continue;
            const foot: AutoMovieSolidCycle.IFoot = AutoMovieSolidCycle.foot(c, u, v, f.surface.period);
            if (best === null || foot.distance < best.foot.distance) best = { cycle: c, foot };
          }
          if (best === null) return null;
          const n: AutoMovieSolidCycle.INeighbour = best.cycle.neighbours[best.foot.segment]!;
          const to: number | undefined = back.get(n.face);
          if (to === undefined) return null;
          const s: number = best.foot.share;
          return { face: to, u: n.from[0] + s * (n.to[0] - n.from[0]), v: n.from[1] + s * (n.to[1] - n.from[1]) };
        },
      },
    };
  }

  /**
   * Merge or cut a part into the body.
   *
   * @param body The body; its faces, cycles and mesh grow in place.
   * @param input The merge.
   * @returns The published blend, or null with the diagnostics of every broken premise; a merge that breaks one leaves the body exactly as it was (its faces, their cycles and the mesh).
   */
  export function merge(body: IBody, input: IMerge): IMerged {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    // What a broken premise restores: a failed merge leaves no blend face, cycle or vertex behind.
    const faceCount: number = body.faces.length;
    const cycles: AutoMovieSolidCycle.ICycle[][] = body.faces.map((f: IFace): AutoMovieSolidCycle.ICycle[] => f.cycles.map(copy));
    const lengths: [number, number, number, number] = [body.mesh.positions.length, body.mesh.coordinates.length, body.mesh.indices.length, body.mesh.owners.length];
    const fail = (contract: string, detail: string): IMerged => {
      diagnostics.push({ producer: `solid.body.${body.name}.${input.name}`, level: 6, contract, detail });
      body.faces.length = faceCount;
      body.faces.forEach((f: IFace, i: number): void => void (f.cycles = cycles[i]!));
      [body.mesh.positions.length, body.mesh.coordinates.length, body.mesh.indices.length, body.mesh.owners.length] = lengths;
      return { blend: null, join: null, diagnostics };
    };

    // The part's face, and the host as the atlas of every other face.
    const known: number = typeof input.part === "number" ? input.part : -1;
    const partSurface: IAutoMovieSolidSurface = typeof input.part === "number" ? body.faces[input.part]!.surface : input.part.surface;
    const { atlas: host, index }: { atlas: IAutoMovieSolidAtlas; index: number[] } = atlas(body, known);
    const created: AutoMovieSolidJoin.IResult = (input.kind === "merge" ? AutoMovieSolidMerge : AutoMovieSolidDiff).create({ ...input.join, part: partSurface, host });
    diagnostics.push(...created.diagnostics);
    if (created.join === null) return { blend: null, join: null, diagnostics };
    const join: AutoMovieSolidJoin.IJoin = created.join;
    const blend: AutoMovieSolidBlendChain.IBlend | null = AutoMovieSolidBlendChain.of(input.name, join, input.count);
    if (blend === null) return fail("rails", "a column of the blend has no rail");
    const blendSurface: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(blend.chain);
    if (blendSurface === null) return fail("blend surface", "the blend chain carries no jets");

    // The faces: the part's (new or known) and the blend's.
    const part: number = known >= 0 ? known : body.faces.push({ ...(input.part as IFaceInput), cycles: [], inverted: input.kind === "diff" }) - 1;
    const blendFace: number = body.faces.length;
    body.faces.push({
      surface: blendSurface,
      stations: Array.from({ length: input.rows + 1 }, (_: unknown, i: number): number => (blend.length * i) / input.rows),
      phases: Array.from({ length: input.count }, (_: unknown, k: number): number => (2 * Math.PI * k) / input.count),
      cycles: [],
    });

    // The host rail with the crossings between faces, and the part rail.
    const rail: AutoMovieSolidClip.IRailPoint[] | string = AutoMovieSolidClip.rail(body, join, blend, index, input.count);
    if (typeof rail === "string") return fail("rails", `the host rail's crossing between two faces could not be placed: ${rail}`);
    const partOwner: number = AutoMovieSolidMesh.owner(body.mesh, partSurface);
    const partVertices: number[] = blend.part.chart.map((c: [number, number]): number =>
      AutoMovieSolidMesh.vertex(body.mesh, partSurface.jet(c[0], c[1]).p, partOwner, c[0], c[1]),
    );
    const phase = (k: number): number => (2 * Math.PI * k) / input.count;

    // The blend face's two station-end cycles.
    body.faces[blendFace]!.cycles.push(
      {
        kind: "start",
        vertices: rail.map((r: AutoMovieSolidClip.IRailPoint): number => r.vertex),
        chart: rail.map((r: AutoMovieSolidClip.IRailPoint): [number, number] => [0, r.phase]),
        neighbours: rail.map((r: AutoMovieSolidClip.IRailPoint, k: number): AutoMovieSolidCycle.INeighbour => {
          const next: AutoMovieSolidClip.IRailPoint = rail[(k + 1) % rail.length]!;
          const face: number = r.faces.find((f: number): boolean => next.faces.includes(f)) ?? (r.faces[0] as number);
          return { face, from: r.chart.get(face)!, to: next.chart.get(face)! };
        }),
      },
      {
        kind: "end",
        // Its own copy: a later clip splices vertices into one face's cycle in place, which must not reach the other's.
        vertices: partVertices.slice(),
        chart: partVertices.map((_: number, k: number): [number, number] => [blend.length, phase(k)]),
        neighbours: partVertices.map((_: number, k: number): AutoMovieSolidCycle.INeighbour => ({
          face: part,
          from: blend.part.chart[k]!,
          to: blend.part.chart[(k + 1) % partVertices.length]!,
        })),
      },
    );

    // The part face's rail cycle.
    body.faces[part]!.cycles.push({
      kind: blend.part.kind,
      vertices: partVertices,
      chart: blend.part.chart.map((c: [number, number]): [number, number] => [c[0], c[1]]),
      neighbours: partVertices.map((_: number, k: number): AutoMovieSolidCycle.INeighbour => ({
        face: blendFace,
        from: [blend.length, phase(k)],
        to: [blend.length, phase((k + 1) % partVertices.length) + (k + 1 === partVertices.length ? 2 * Math.PI : 0)],
      })),
    });

    // Every host face the rail runs over.
    const clipped: string | null = AutoMovieSolidClip.trim(body, rail, blendFace, blend.host.kind);
    if (clipped !== null) return fail("trim", clipped);
    body.blends.push(blend);
    return { blend, join, diagnostics };
  }

  /**
   * Tessellate every face.
   *
   * @param body The body; its mesh receives the triangles.
   * @returns Each face's open ends (vertex cycles), by face.
   */
  export function draw(body: IBody): number[][][] {
    return body.faces.map((f: IFace): number[][] =>
      AutoMovieSolidMesh.face(body.mesh, {
        surface: f.surface,
        stations: f.stations,
        phases: f.phases,
        loops: f.cycles.map((c: AutoMovieSolidCycle.ICycle): AutoMovieSolidMesh.ILoop => ({ kind: c.kind, vertices: c.vertices, chart: c.chart })),
        inverted: f.inverted,
      }),
    );
  }

  /**
   * A body as data, for a calibration (`IAutoMovieHumanBodyCalibration.bodies`):
   * the shared boundary points, each named by the face that evaluates it and
   * its chart point there, and each face by its chain's name with its trim
   * cycles as indices into those points. The skin (`AutoMovieHumanBodySurfaceSolids`)
   * makes one vertex per point, so the faces share their boundaries as the
   * body does.
   */
  export interface IPublished {
    /** Name in diagnostics. */
    name: string;

    /** The shared boundary points: the chain that evaluates each, and its chart point there. */
    points: { chain: string; chart: [number, number] }[];

    /** The faces, each a chain of the calibration. */
    faces: {
      /** The chain's name: the face's surface name. */
      chain: string;

      /** Its trim cycles, as points. */
      cycles: { kind: AutoMovieSolidCycle.ICycle["kind"]; points: number[]; chart: [number, number][] }[];

      /** Whether it is a diff's cutter. */
      inverted?: boolean;
    }[];
  }

  /**
   * A body as data: the vertices its cycles use, renumbered as points.
   *
   * @param body The body, its faces' surfaces named after their chains.
   * @returns The published body.
   */
  export function publish(body: IBody): IPublished {
    const index: Map<number, number> = new Map();
    const points: IPublished["points"] = [];
    const point = (v: number): number => {
      const known: number | undefined = index.get(v);
      if (known !== undefined) return known;
      const c: number[] = body.mesh.coordinates.slice(3 * v, 3 * v + 3);
      points.push({ chain: body.mesh.owners[c[0]!]!.name, chart: [c[1]!, c[2]!] });
      index.set(v, points.length - 1);
      return points.length - 1;
    };
    return {
      name: body.name,
      points,
      faces: body.faces.map((f: IFace): IPublished["faces"][number] => ({
        chain: f.surface.name,
        cycles: f.cycles.map((c: AutoMovieSolidCycle.ICycle): IPublished["faces"][number]["cycles"][number] => ({
          kind: c.kind,
          points: c.vertices.map(point),
          chart: c.chart.map((p: [number, number]): [number, number] => [p[0], p[1]]),
        })),
        ...(f.inverted === true ? { inverted: true } : {}),
      })),
    };
  }

  /**
   * Whether a chart point lies in a face's kept region: on the kept side of
   * every cycle.
   *
   * @param face The face.
   * @param u Its `u`.
   * @param v Its `v`.
   * @returns True when kept.
   */
  export function kept(face: IFace, u: number, v: number): boolean {
    return face.cycles.every((c: AutoMovieSolidCycle.ICycle): boolean => AutoMovieSolidCycle.kept(c, u, v, face.surface.period));
  }
}

/** A deep copy of a trim cycle, so later clips that edit cycles in place leave it as it was. */
function copy(c: AutoMovieSolidCycle.ICycle): AutoMovieSolidCycle.ICycle {
  return {
    kind: c.kind,
    vertices: c.vertices.slice(),
    chart: c.chart.map((p: [number, number]): [number, number] => [p[0], p[1]]),
    neighbours: c.neighbours.map((n: AutoMovieSolidCycle.INeighbour): AutoMovieSolidCycle.INeighbour => ({ face: n.face, from: [n.from[0], n.from[1]], to: [n.to[0], n.to[1]] })),
  };
}
