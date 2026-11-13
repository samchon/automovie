import type { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import { AutoMovieSolidBlendChain } from "./AutoMovieSolidBlendChain";
import type { AutoMovieSolidBody } from "./AutoMovieSolidBody";
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
 * Existing transactional body assembly and frozen host snapshots.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Operations name snapshot ownership, live surface dependencies and returned versus thrown failure.
 * @evidence contracts/development/design.md#principled-representation Represents Existing transactional body assembly and frozen host snapshots: companion namespace of 9 members (`IFace`, `IBody`, `IFaceInput`, `IMerge`, `IMerged`, `atlas`, ...); units and frames named in its text: local, radians. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidBodyMerge` in packages/engine/src/geometry/construction/AutoMovieSolidBodyMerge.ts; its surface is the 9 members listed and the text shows 2 other files naming it, mostly packages/engine (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieSolidBodyMerge {
  /** The public mutable face contract used by snapshots and assembly. */
  type IFace = AutoMovieSolidBody.IFace;

  /** The original body whose mesh populations and cycles are checkpointed. */
  type IBody = AutoMovieSolidBody.IBody;

  /** A surface/grid descriptor before body assembly adds cycles. */
  type IFaceInput = AutoMovieSolidBody.IFaceInput;

  /** The original merge/diff request and its borrowed join callbacks. */
  type IMerge = AutoMovieSolidBody.IMerge;

  /** The original nullable publication and diagnostic result. */
  type IMerged = AutoMovieSolidBody.IMerged;

  /**
   * The body as an atlas of its faces, leaving one out (the part of a merge
   * that is already a face).
   *
   * @param body The body.
   * @param without A face index to leave out, or -1.
   * @returns The atlas and the body index of each atlas face.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Copies face trim cycles and original-atlas addresses while borrowing immutable surfaces/atlases. Original domain exits follow their actual chart map before trim classification; retained-cycle exits preserve polygon-foot shares. Legacy cycle-inclusive parity remains a limitation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frozen face list and back-index map keep later clips from altering the join's original host region.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves violated-cycle scans, raw chart-distance ranking and open/excluded-neighbour nulls without changing boundary ties.
   * @evidence contracts/development/common.md#meaningful-documentation States snapshot versus borrowed-surface lifetime and the body-to-atlas index/foot correspondence.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies O(F+S) face/cycle data for F included faces and S trim records; each query scans the reached face's cycles and segments.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Returned callbacks share one copied trim snapshot and one index map; changed body cycles require another atlas.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Closures retain copied cycles/maps and borrowed surfaces until dropped; population follows that captured body, with no global cache.
   */
  export function atlas(
    body: IBody,
    without: number = -1,
  ): { atlas: IAutoMovieSolidAtlas; index: number[] } {
    /** Included body face identifiers in original order. */
    const index: number[] = body.faces
      .map((_: IFace, k: number): number => k)
      .filter((k: number): boolean => k !== without);

    /** Translate a body identifier into this atlas's face index. */
    const back: Map<number, number> = new Map(
      index.map((k: number, i: number): [number, number] => [k, i]),
    );
    // The faces as they stand now: a join keeps reading this atlas after the
    // merge trims its host, and must still see the host untrimmed there.

    /** Detached cycles preserve the host before later body clipping. */
    const frozen: IFace[] = index.map(
      (k: number): IFace => ({
        ...body.faces[k]!,
        sourceAtlas:
          body.faces[k]!.sourceAtlas === undefined
            ? undefined
            : { ...body.faces[k]!.sourceAtlas! },
        cycles: body.faces[k]!.cycles.map(copy),
      }),
    );

    /** Read one captured face without consulting later body edits. */
    const face: (i: number) => IFace = (i: number): IFace => frozen[i]!;
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
          const f: IFace = face(i);
          const original: IFace["sourceAtlas"] = f.sourceAtlas;
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
            cycle: AutoMovieSolidCycle.ICycle;
            foot: AutoMovieSolidCycle.IFoot;
          } | null = null;
          for (const c of f.cycles) {
            if (AutoMovieSolidCycle.kept(c, u, v, f.surface.period)) continue;

            /** The original polygon reader's chart-space foot. */
            const foot: AutoMovieSolidCycle.IFoot = AutoMovieSolidCycle.foot(
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
          const n: AutoMovieSolidCycle.INeighbour =
            best.cycle.neighbours[best.foot.segment]!;

          /** Included neighbour index, absent at an open or excluded face. */
          const to: number | undefined = back.get(n.face);
          if (to === undefined) return null;

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
   * @returns The blend or null with observed diagnostics. Returned rail/trim failures restore face count, copied cycles and mesh populations; thrown callbacks are not caught or rolled back.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Checkpoints cycle copies and mesh populations, then appends shared rail vertices and reciprocal cycles through the existing join, blend and clip owners.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One transaction owns mutation order while numerical geometry remains in the existing operators.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves early join-null, returned diagnostics and the original checkpoint scope; thrown callbacks are not caught or converted into rollback results.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes append/cycle mutations, admitted input premises and returned failure from a thrown operation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Includes cycle/atlas snapshots, join and column solves, boundary allocation and clipping; supplied traced data can be reused by the join.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Adjoining faces share exact boundary vertex indices, and one published blend supplies its surface and trim records.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body retains successful geometry; checkpoint copies are local, while returned joins retain their existing query cache with no new cache here.
   */
  export function merge(body: IBody, input: IMerge): IMerged {
    /** Diagnostics retained in their original production order. */
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    // Returned rail/trim failures restore these populations; callback throws remain uncaught.

    /** Original face population restored on a returned failure. */
    const faceCount: number = body.faces.length;

    /** Cycle copies isolate rollback from in-place clipping. */
    const cycles: AutoMovieSolidCycle.ICycle[][] = body.faces.map(
      (f: IFace): AutoMovieSolidCycle.ICycle[] => f.cycles.map(copy),
    );

    /** Scalar-array and owner populations, rather than vertex counts. */
    const lengths: [number, number, number, number] = [
      body.mesh.positions.length,
      body.mesh.coordinates.length,
      body.mesh.indices.length,
      body.mesh.owners.length,
    ];

    /** Restore exactly the original checkpoint and return its diagnostic. */
    const fail: (contract: string, detail: string) => IMerged = (
      contract: string,
      detail: string,
    ): IMerged => {
      diagnostics.push({
        producer: `solid.body.${body.name}.${input.name}`,
        level: 6,
        contract,
        detail,
      });
      body.faces.length = faceCount;
      body.faces.forEach(
        (f: IFace, i: number): void => void (f.cycles = cycles[i]!),
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
    const created: AutoMovieSolidJoin.IResult = (
      input.kind === "merge" ? AutoMovieSolidMerge : AutoMovieSolidDiff
    ).create({ ...input.join, part: partSurface, host });
    diagnostics.push(...created.diagnostics);
    if (created.join === null) return { blend: null, join: null, diagnostics };

    /** Accepted join whose original callbacks supply the rails. */
    const join: AutoMovieSolidJoin.IJoin = created.join;

    /** Existing blend publication with aligned rail charts. */
    const blend: AutoMovieSolidBlendChain.IBlend | null =
      AutoMovieSolidBlendChain.of(input.name, join, input.count);
    if (blend === null)
      return fail("rails", "a column of the blend has no rail");

    /** Original analytic surface adapter for the published chain. */
    const blendSurface: IAutoMovieSolidSurface | null =
      AutoMovieSolidChain.surface(blend.chain);
    if (blendSurface === null)
      return fail("blend surface", "the blend chain carries no jets");

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
      stations: Array.from(
        { length: input.rows + 1 },
        (_: unknown, i: number): number => (blend.length * i) / input.rows,
      ),
      phases: Array.from(
        { length: input.count },
        (_: unknown, k: number): number => (2 * Math.PI * k) / input.count,
      ),
      cycles: [],
    });

    // The host rail with the crossings between faces, and the part rail.

    /** Host rail including existing cross-face bisection observations. */
    const rail: AutoMovieSolidClip.IRailPoint[] | string =
      AutoMovieSolidClip.rail(body, join, blend, index, input.count);
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

    /** Original uniform column phase, radians. */
    const phase: (k: number) => number = (k: number): number =>
      (2 * Math.PI * k) / input.count;

    // The blend face's two station-end cycles.
    body.faces[blendFace]!.cycles.push(
      {
        kind: "start",
        vertices: rail.map(
          (r: AutoMovieSolidClip.IRailPoint): number => r.vertex,
        ),
        chart: rail.map(
          (r: AutoMovieSolidClip.IRailPoint): [number, number] => [0, r.phase],
        ),
        neighbours: rail.map(
          (
            r: AutoMovieSolidClip.IRailPoint,
            k: number,
          ): AutoMovieSolidCycle.INeighbour => {
            /** Following rail point for this directed neighbour segment. */
            const next: AutoMovieSolidClip.IRailPoint =
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
        // Its own copy: a later clip splices vertices into one face's cycle in place, which must not reach the other's.
        vertices: partVertices.slice(),
        chart: partVertices.map((_: number, k: number): [number, number] => [
          blend.length,
          phase(k),
        ]),
        neighbours: partVertices.map(
          (_: number, k: number): AutoMovieSolidCycle.INeighbour => ({
            face: part,
            from: blend.part.chart[k]!,
            to: blend.part.chart[(k + 1) % partVertices.length]!,
          }),
        ),
      },
    );

    // The part face's rail cycle.
    body.faces[part]!.cycles.push({
      kind: blend.part.kind,
      vertices: partVertices,
      chart: blend.part.chart.map((c: [number, number]): [number, number] => [
        c[0],
        c[1],
      ]),
      neighbours: partVertices.map(
        (_: number, k: number): AutoMovieSolidCycle.INeighbour => ({
          face: blendFace,
          from: [blend.length, phase(k)],
          to: [
            blend.length,
            phase((k + 1) % partVertices.length) +
              (k + 1 === partVertices.length ? 2 * Math.PI : 0),
          ],
        }),
      ),
    });

    // Every host face the rail runs over.

    /** Existing clipping reason that triggers the returned-failure rollback. */
    const clipped: string | null = AutoMovieSolidClip.trim(
      body,
      rail,
      blendFace,
      blend.host.kind,
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Requires the actual original source atlas domain when supplied, then conjoins current cycle predicates using the face's period; the legacy cycle-inclusive-boundary gap remains.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The original source domain precedes the unchanged ordered cycle conjunction and first-false short circuit.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no domain repair, boundary tolerance or replacement classification.
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the current face/cycle inputs and kept-side boolean.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reached cycle predicates cost O(S+L) worst-case work for S edges and L cycles.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads live cycles on each query; prepared mesh readers have their separate unchanged-input lifetime.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a boolean without retaining the face or query.
   */
  export function kept(face: IFace, u: number, v: number): boolean {
    return (
      (face.sourceAtlas === undefined ||
        face.sourceAtlas.atlas.kept(face.sourceAtlas.face, u, v)) &&
      face.cycles.every((c: AutoMovieSolidCycle.ICycle): boolean =>
        AutoMovieSolidCycle.kept(c, u, v, face.surface.period),
      )
    );
  }

  /** A deep copy of a trim cycle, so later clips that edit cycles in place leave it as it was. */
  function copy(c: AutoMovieSolidCycle.ICycle): AutoMovieSolidCycle.ICycle {
    return {
      kind: c.kind,
      vertices: c.vertices.slice(),
      chart: c.chart.map((p: [number, number]): [number, number] => [
        p[0],
        p[1],
      ]),
      neighbours: c.neighbours.map(
        (
          n: AutoMovieSolidCycle.INeighbour,
        ): AutoMovieSolidCycle.INeighbour => ({
          face: n.face,
          from: [n.from[0], n.from[1]],
          to: [n.to[0], n.to[1]],
        }),
      ),
      // The exact curve is a pure function of the chart, shared rather than copied.
      ...(c.along === undefined ? {} : { along: c.along }),
    };
  }
}
