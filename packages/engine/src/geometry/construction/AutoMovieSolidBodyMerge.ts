import type {
  IAutoMovieLoftContract,
  IAutoMovieSolidAtlas,
  IAutoMovieSolidBlendChain,
  IAutoMovieSolidBody,
  IAutoMovieSolidClip,
  IAutoMovieSolidCycle,
  IAutoMovieSolidJoin,
  IAutoMovieSolidMeshConstraints,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieSolidBlendChain } from "./AutoMovieSolidBlendChain";
import { AutoMovieSolidChain } from "./AutoMovieSolidChain";
import { AutoMovieSolidClip } from "./AutoMovieSolidClip";
import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSolidDiff } from "./AutoMovieSolidDiff";
import { AutoMovieSolidExactBlend } from "./AutoMovieSolidExactBlend";
import { AutoMovieSolidMerge } from "./AutoMovieSolidMerge";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import { AutoMovieSolidMeshAuthorities } from "./AutoMovieSolidMeshAuthorities";
import { AutoMovieSolidMeshConstraints } from "./AutoMovieSolidMeshConstraints";

/** Existing transactional body assembly and frozen host snapshots. */
export namespace AutoMovieSolidBodyMerge {
  /** A surface/grid descriptor before body assembly adds cycles. */
  type IFaceInput = IAutoMovieSolidBody.IFaceInput;

  /**
   * The body as an atlas of its faces, leaving one out (the part of a merge
   * that is already a face).
   *
   * @param body The body.
   * @param without A face index to leave out, or -1.
   * @returns The atlas and the body index of each atlas face.
   */
  export function atlas(
    body: IAutoMovieSolidBody.IBody,
    without: number = -1,
  ): IAutoMovieSolidBody.IAtlasResult {
    /** Included body face identifiers in original order. */
    const index: number[] = body.faces
      .map((_: IAutoMovieSolidBody.IFace, k: number): number => k)
      .filter(
        (k: number): boolean =>
          k !== without && body.faces[k]!.terminal === undefined,
      );

    /** Translate a body identifier into this atlas's face index. */
    const back: Map<number, number> = new Map(
      index.map((k: number, i: number): [number, number] => [k, i]),
    );
    // The faces as they stand now: a join keeps reading this atlas after the
    // merge trims its host, and must still see the host untrimmed there.

    /** Detached cycles preserve the host before later body clipping. */
    const frozen: IAutoMovieSolidBody.IFace[] = index.map(
      (k: number): IAutoMovieSolidBody.IFace => ({
        ...body.faces[k]!,
        sourceAtlas:
          body.faces[k]!.sourceAtlas === undefined
            ? undefined
            : { ...body.faces[k]!.sourceAtlas! },
        cycles: body.faces[k]!.cycles.map(AutoMovieSolidCycle.copy),
      }),
    );

    /** Read one captured face without consulting later body edits. */
    const face: (i: number) => IAutoMovieSolidBody.IFace = (
      i: number,
    ): IAutoMovieSolidBody.IFace => frozen[i]!;
    return {
      index,
      atlas: {
        name: body.name,
        faces: index.map(
          (k: number): IAutoMovieSolidSurface => body.faces[k]!.surface,
        ),
        kept: (i: number, u: number, v: number): boolean => kept(face(i), u, v),
        across: (
          i: number,
          u: number,
          v: number,
        ): { face: number; u: number; v: number } | null => {
          // The nearest segment of a cycle the point lies past.

          /** Captured face whose rejected cycles may supply a neighbour. */
          const f: IAutoMovieSolidBody.IFace = face(i);
          const original: IAutoMovieSolidBody.IFace["sourceAtlas"] =
            f.sourceAtlas;
          if (
            original !== undefined &&
            !original.atlas.kept(original.face, u, v)
          ) {
            const next: ReturnType<IAutoMovieSolidAtlas["across"]> =
              original.atlas.across(original.face, u, v);
            if (next === null) return null;
            const target: number | undefined = back.get(
              original.offset + next.face,
            );
            return target === undefined
              ? null
              : { face: target, u: next.u, v: next.v };
          }

          /** Nearest violated-cycle chart foot encountered so far. */
          let best: {
            cycle: IAutoMovieSolidCycle.ICycle;
            foot: IAutoMovieSolidCycle.IFoot;
          } | null = null;
          for (const c of f.cycles) {
            if (AutoMovieSolidCycle.held(c, u, v, f.surface.period)) continue;

            /** The original polygon reader's chart-space foot. */
            const foot: IAutoMovieSolidCycle.IFoot = AutoMovieSolidCycle.foot(
              c,
              u,
              v,
              f.surface.period,
            );
            if (best === null || foot.distance < best.foot.distance)
              best = { cycle: c, foot };
          }
          if (best === null) return null;

          /** Neighbour paired with the chosen boundary segment. */
          const n: IAutoMovieSolidCycle.INeighbour =
            best.cycle.neighbours[best.foot.segment]!;

          /** Included neighbour index, absent at an open or excluded face. */
          const to: number | undefined = back.get(n.face);
          if (to === undefined) return null;

          // A segment of a boundary one owner supplies to both faces maps the point by that owner's correspondence, between vertices
          // as well as at them (`AutoMovieSolidCycle.piece`), so the point reached lies on the same physical boundary point as the
          // foot; a segment a clip made maps by its chord's share.
          const exact: IAutoMovieSolidCycle.IExact | null =
            AutoMovieSolidCycle.piece(best.cycle, best.foot.segment)?.exact ??
            null;
          if (exact !== null) {
            const [eu, ev]: [number, number] = exact.across(u, v);
            return { face: to, u: eu, v: ev };
          }

          /** Affine foot share reused in the adjacent chart. */
          const s: number = best.foot.share;
          return {
            face: to,
            u: n.from[0] + s * (n.to[0] - n.from[0]),
            v: n.from[1] + s * (n.to[1] - n.from[1]),
          };
        },
      },
    };
  }

  /**
   * Merge or cut a part into the body.
   *
   * @param body The body; its faces, cycles and mesh grow in place.
   * @param input The merge.
   * @returns The blend or null with observed diagnostics. Returned rail/trim
   *   failures restore face count, copied cycles and mesh populations. A
   *   callback exception preserves the state at the throw and propagates to the
   *   caller. An existing part's new rail must remain on its retained chart.
   *   Its constraints may not cross earlier trim segments without a shared
   *   vertex.
   */
  export function merge(
    body: IAutoMovieSolidBody.IBody,
    input: IAutoMovieSolidBody.IMerge,
  ): IAutoMovieSolidBody.IMerged {
    /** Diagnostics retained in their original production order. */
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [];
    // Returned rail/trim failures restore these populations; callback throws remain uncaught.

    /** Original face population restored on a returned failure. */
    const faceCount: number = body.faces.length;

    /** Cycle copies isolate rollback from in-place clipping. */
    const cycles: IAutoMovieSolidCycle.ICycle[][] = body.faces.map(
      (f: IAutoMovieSolidBody.IFace): IAutoMovieSolidCycle.ICycle[] =>
        f.cycles.map(AutoMovieSolidCycle.copy),
    );

    /** Scalar-array and owner populations, rather than vertex counts. */
    const lengths: [number, number, number, number] = [
      body.mesh.positions.length,
      body.mesh.coordinates.length,
      body.mesh.indices.length,
      body.mesh.owners.length,
    ];

    /** Restore exactly the original checkpoint and return its diagnostic. */
    const fail: (
      contract: string,
      detail: string,
    ) => IAutoMovieSolidBody.IMerged = (
      contract: string,
      detail: string,
    ): IAutoMovieSolidBody.IMerged => {
      diagnostics.push({
        producer: `solid.body.${body.name}.${input.name}`,
        level: 6,
        contract,
        detail,
      });
      body.faces.length = faceCount;
      body.faces.forEach(
        (f: IAutoMovieSolidBody.IFace, i: number): void =>
          void (f.cycles = cycles[i]!),
      );
      [
        body.mesh.positions.length,
        body.mesh.coordinates.length,
        body.mesh.indices.length,
        body.mesh.owners.length,
      ] = lengths;
      return { blend: null, join: null, diagnostics };
    };

    // The part's face, and the host as the atlas of every other face.

    /** Existing part index, or the original new-part sentinel. */
    const known: number = typeof input.part === "number" ? input.part : -1;

    if (known >= 0 && body.faces[known]?.terminal !== undefined)
      return fail(
        "analytic merge part",
        "A terminal first-order face cannot be trimmed",
      );

    /** Original part surface reference supplied to the join. */
    const partSurface: IAutoMovieSolidSurface =
      typeof input.part === "number"
        ? body.faces[input.part]!.surface
        : input.part.surface;

    /** Frozen host atlas paired with its body-face identifiers. */
    const {
      atlas: host,
      index,
    }: { atlas: IAutoMovieSolidAtlas; index: number[] } = atlas(body, known);

    /** Existing merge/diff result before a new body face is appended. */
    const created: IAutoMovieSolidJoin.IResult = (
      input.kind === "merge" ? AutoMovieSolidMerge : AutoMovieSolidDiff
    ).create({ ...input.join, part: partSurface, host });
    diagnostics.push(...created.diagnostics);
    if (created.join === null) return { blend: null, join: null, diagnostics };

    /** Accepted join whose original callbacks supply the rails. */
    const join: IAutoMovieSolidJoin.IJoin = created.join;
    /** Existing blend publication with aligned rail charts. */
    const original: IAutoMovieSolidBlendChain.IBlend | null =
      AutoMovieSolidBlendChain.of(input.name, join, input.count);
    if (original === null)
      return fail("rails", "a column of the blend has no rail");
    const native =
      input.railChord === undefined
        ? null
        : AutoMovieSolidExactBlend.prepare(
            join,
            original,
            partSurface,
            host,
            input.nativeRailBoundaries,
          );
    if (input.railChord !== undefined && native === null)
      return fail(
        "native rail grid",
        input.nativeRailBoundaries === true
          ? "both closed rail curves must be regular in single retained charts"
          : "closed rails must occupy one chart per original",
      );
    const basis =
      native === null
        ? null
        : AutoMovieSolidExactBlend.adaptive(
            native.at,
            input.count,
            input.rows,
            input.railChord!,
          );
    if (typeof basis === "string") return fail("native rail grid", basis);
    const rows = basis?.rows ?? input.rows;
    const phases =
      basis?.phases ??
      Array.from(
        { length: input.count },
        (_, k) => (2 * Math.PI * k) / input.count,
      );
    const blend =
      native === null
        ? original
        : AutoMovieSolidExactBlend.discretize(
            original,
            join,
            native.column,
            phases,
          );
    if (blend === null)
      return fail("rails", "a column of the blend has no rail");

    const retained: IAutoMovieSolidBody.IFace | undefined = body.faces[known];
    if (
      retained !== undefined &&
      (retained.sourceAtlas !== undefined || retained.cycles.length !== 0)
    ) {
      const reads = retained.cycles.map((cycle) =>
        AutoMovieSolidCycle.prepare(cycle, partSurface.period),
      );
      const inherited = retained.sourceAtlas;
      const outside: number = blend.part.chart.findIndex(
        ([u, v]): boolean =>
          (inherited !== undefined &&
            !inherited.atlas.kept(inherited.face, u, v)) ||
          reads.some((keeps) => !keeps(u, v)),
      );
      if (outside !== -1)
        return fail(
          "part rail domain",
          `${partSurface.name}'s rail column ${outside} at [${blend.part.chart[outside]}] leaves its retained chart`,
        );
    }

    /** Original analytic surface adapter for the published chain. */
    const sampled: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(
      blend.chain,
    );
    if (sampled === null)
      return fail("blend surface", "the blend chain carries no jets");
    const blendSurface =
      native === null
        ? sampled
        : AutoMovieSolidExactBlend.surface(
            native.at,
            input.name,
            blend.length,
            sampled.orientation,
          );

    // The faces: the part's (new or known) and the blend's.

    /** Reuse the existing face or append the new part in order. */
    const part: number =
      known >= 0
        ? known
        : body.faces.push({
            ...(input.part as IFaceInput),
            cycles: [],
            inverted: input.kind === "diff",
          }) - 1;

    /** Body index reserved for the next blend face. */
    const blendFace: number = body.faces.length;
    body.faces.push({
      surface: blendSurface,
      ...(native === null
        ? {}
        : { retainSurface: true as const, retainPhases: true as const }),
      stations: Array.from(
        { length: rows + 1 },
        (_: unknown, i: number): number =>
          i === rows ? blend.length : (blend.length * i) / rows,
      ),
      phases,
      cycles: [],
    });

    // The host rail with the crossings between faces, and the part rail.

    /** Host rail including existing cross-face bisection observations. */
    const rail: IAutoMovieSolidClip.IRailPoint[] | string =
      AutoMovieSolidClip.rail(body, join, blend, index, phases);
    if (typeof rail === "string")
      return fail(
        "rails",
        `the host rail's crossing between two faces could not be placed: ${rail}`,
      );

    /** Existing unique-name mesh owner, registered on first use. */
    const partOwner: number = AutoMovieSolidMesh.owner(body.mesh, partSurface);

    /** One evaluated part-rail vertex for each original column. */
    const partVertices: number[] = blend.part.chart.map(
      (c: [number, number]): number =>
        AutoMovieSolidMesh.vertex(
          body.mesh,
          partSurface.jet(c[0], c[1]).p,
          partOwner,
          c[0],
          c[1],
        ),
    );

    /** The shared column's physical phase, radians. */
    const phase = (k: number): number => phases[k]!;
    const boundaries = native?.boundaries;
    const exact = (
      boundary: NonNullable<typeof boundaries>["host"],
      kind: IAutoMovieSolidCycle.ICycle["kind"],
      station: number,
    ): IAutoMovieSolidCycle.IExact => ({
      count: phases.length,
      kept: (u, v) => boundary.side(u, v) * (kind === "hole" ? 1 : -1) >= 0,
      across: (u, v) => [station, boundary.clock(u, v)],
    });

    const partCycle: IAutoMovieSolidCycle.ICycle = {
      kind: blend.part.kind,
      ...(boundaries === undefined
        ? {}
        : { exact: exact(boundaries.part, blend.part.kind, blend.length) }),
      vertices: partVertices,
      chart: blend.part.chart.map(([u, v]): [number, number] => [u, v]),
      neighbours: partVertices.map(
        (_: number, k: number): IAutoMovieSolidCycle.INeighbour => ({
          face: blendFace,
          from: [blend.length, phase(k)],
          to: [
            blend.length,
            phase((k + 1) % partVertices.length) +
              (k + 1 === partVertices.length ? 2 * Math.PI : 0),
          ],
        }),
      ),
    };
    if (retained !== undefined && retained.cycles.length !== 0) {
      // Two valid rail columns can straddle a thinner removed chart region.
      // Use the same authoritative segments and predicates as face drawing.
      const chart: Map<number, readonly [number, number]> = new Map();
      const segments: IAutoMovieSolidMeshConstraints.ISegment[] | string =
        AutoMovieSolidMeshAuthorities.collect(
          body.mesh,
          [...retained.cycles, partCycle],
          chart,
          partSurface.period,
        );
      const checked: IAutoMovieSolidMeshConstraints.IEdge[] | string =
        typeof segments === "string"
          ? segments
          : AutoMovieSolidMeshConstraints.split(
              chart,
              segments,
              partSurface.period,
            );
      if (typeof checked === "string")
        return fail("part rail domain", `${partSurface.name}: ${checked}`);
    }

    // The blend face's two station-end cycles.
    body.faces[blendFace]!.cycles.push(
      {
        kind: "start",
        ...(boundaries === undefined
          ? {}
          : {
              exact: {
                count: phases.length,
                across: (_u: number, v: number) => boundaries.host.at(v).chart,
              },
            }),
        vertices: rail.map(
          (r: IAutoMovieSolidClip.IRailPoint): number => r.vertex,
        ),
        chart: rail.map(
          (r: IAutoMovieSolidClip.IRailPoint): [number, number] => [0, r.phase],
        ),
        neighbours: rail.map(
          (
            r: IAutoMovieSolidClip.IRailPoint,
            k: number,
          ): IAutoMovieSolidCycle.INeighbour => {
            /** Following rail point for this directed neighbour segment. */
            const next: IAutoMovieSolidClip.IRailPoint =
              rail[(k + 1) % rail.length]!;

            /** Original common-face choice, including its first-face fallback. */
            const face: number =
              r.faces.find((f: number): boolean => next.faces.includes(f)) ??
              (r.faces[0] as number);
            return {
              face,
              from: r.chart.get(face)!,
              to: next.chart.get(face)!,
            };
          },
        ),
      },
      {
        kind: "end",
        ...(boundaries === undefined
          ? {}
          : {
              exact: {
                count: phases.length,
                across: (_u: number, v: number) => boundaries.part.at(v).chart,
              },
            }),
        // Its own copy: a later clip splices vertices into one face's cycle in place, which must not reach the other's.
        vertices: partVertices.slice(),
        chart: partVertices.map((_: number, k: number): [number, number] => [
          blend.length,
          phase(k),
        ]),
        neighbours: partVertices.map(
          (_: number, k: number): IAutoMovieSolidCycle.INeighbour => ({
            face: part,
            from: blend.part.chart[k]!,
            to: blend.part.chart[(k + 1) % partVertices.length]!,
          }),
        ),
      },
    );

    // The part face's rail cycle.
    body.faces[part]!.cycles.push(partCycle);

    // Every host face the rail runs over.

    /** Existing clipping reason that triggers the returned-failure rollback. */
    const clipped: string | null = AutoMovieSolidClip.trim(
      body,
      rail,
      blendFace,
      blend.host.kind,
      boundaries === undefined
        ? undefined
        : exact(boundaries.host, blend.host.kind, 0),
    );
    if (clipped !== null) return fail("trim", clipped);
    body.blends.push(blend);
    return { blend, join, diagnostics };
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
  export function kept(
    face: IAutoMovieSolidBody.IFace,
    u: number,
    v: number,
  ): boolean {
    return (
      (face.sourceAtlas === undefined ||
        face.sourceAtlas.atlas.kept(face.sourceAtlas.face, u, v)) &&
      face.cycles.every((c: IAutoMovieSolidCycle.ICycle): boolean =>
        AutoMovieSolidCycle.held(c, u, v, face.surface.period),
      )
    );
  }
}
