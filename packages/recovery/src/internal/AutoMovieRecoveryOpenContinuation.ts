import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import type { AutoMovieRecoveryMeshSections as R } from "./AutoMovieRecoveryMeshSections";
import { RecoveryOpenSlabGraph as O } from "./RecoveryOpenSlabGraph";
import { RecoveryScalarIndex as S } from "./RecoveryScalarIndex";
import { critical } from "./mesh-observations/critical";
import { cutExact } from "./mesh-observations/cutExact";
import { planeFrame } from "./mesh-observations/planeFrame";

/**
 * Source observation of open-curve continuation without repeating numerical fitting.
 *
 * @evidence contracts/common.md#principled-implementation Registered source incidence and immutable scalar cuts recover endpoint transport for already published cubic observations. The separate graph contains only local curve ordinals and orientation witnesses.
 * @evidence contracts/common.md#clear-and-simple-design The existing cutter and open-slab observer own geometry; this adapter binds their observations to saved coefficient authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source addresses, source mesh or normal arrays leave observation, and no individual station or control is authored here.
 * @evidence contracts/common.md#meaningful-documentation States observation-only source use, saved-fit reuse and the distinction between orientation qualification and topology.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Namespace initialization computes nothing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No module cache exists.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No persistent resources exist.
 */
export namespace AutoMovieRecoveryOpenContinuation {
  /**
   * Separate source-free incidence sidecar; cubic controls remain solely in the original bundle.
   *
   * @evidence contracts/common.md#principled-implementation Adjacent saved-section ordinals, open-curve ordinals and endpoint reversal identify ruled-course correspondence without source identities.
   * @evidence contracts/common.md#clear-and-simple-design Curves are not copied into the sidecar; topology and qualification remain separate from coefficient authority.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported groups remain explicit and no closed boundary or source mesh is supplied.
   * @evidence contracts/common.md#meaningful-documentation Field comments distinguish endpoint transport, optional material orientation and physical sampling policy.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns returned arrays.
   * @author Samchon
   */
  export interface Continuation {
    /** Versioned observation policy; station generation keeps the original bundle policy. */
    schema: "automovie-recovery-open-continuation-v1";
    /** Strict boundary classification used for sheet regularity, independently of saved station density. */
    criticalPolicy: "boundary-regular-path-v1";
    /** Actual adjacent saved-section pairs; all ordinals address reports[section].open. */
    intervals: {
      beforeSection: number;
      afterSection: number;
      pairs: O.Result["pairs"];
      unresolved: O.Result["unresolved"];
    }[];
    /** Source material tangent sign relative to the saved curve, or null when unqualified. */
    orientations: (1 | -1 | null)[][];
    /** Nonblocking source-orientation and observation qualification messages. */
    diagnostics: string[];
    /** Physical requested grid spacing; not a surface-error or normal-error bound. */
    resolutionMm: number;
    /** Explicit resource budget per maximal open run. */
    maxVerticesPerRun: number;
  }

  /**
   * Reobserve automatically saved stations, preserving their complete cubic coefficients.
   * The command caller must bind both the fixed source bytes and the original bundle hash.
   *
   * @evidence contracts/common.md#principled-implementation Exact-coordinate registration, the existing scalar index and exact-zero cutter reconstruct private face supports. Strict PL critical events and closed or unrepresented contours remain local defects; the open-slab observer proves endpoint transport before publication.
   * @evidence contracts/common.md#clear-and-simple-design One streaming adjacent-row cache binds source observations to saved open curve names and exact endpoints, then discards every source address.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No fit, control alteration, source-specific station table, positional weld, inferred closure or source mesh fallback occurs. Orientation uncertainty becomes a diagnostic, not a geometry gate.
   * @evidence contracts/common.md#meaningful-documentation States fixed-input admission ownership, observation reuse, private address lifetime and local unsupported results.
   * @evidence contracts/performance.md#efficient-algorithms Preparation is O(V+T log T). Per station work visits indexed cut candidates and per interval indexed slab candidates plus local supports; saved coefficients are neither refitted nor duplicated. Critical lookup uses a monotone cursor over sorted events.
   * @evidence contracts/performance.md#reuse-equivalent-work Immutable source admission, scalar intervals, cutter and open-slab closures are prepared once. Only adjacent cut rows remain live, while all output pairs refer to the original saved cubics.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Observation maps and adjacent-row source supports expire on return; only curve ordinals, signs and diagnostics escape.
   */
  export function observe(
    input: R.Input,
    bundle: R.Bundle,
    progress?: (completed: number, total: number) => void,
  ): Continuation {
    if (
      bundle.reports.length !== bundle.loft.sections.length ||
      bundle.loft.sections.length < 2
    )
      throw new Error("Aligned saved section observations are required");
    for (const [key, value] of Object.entries(bundle.policy))
      if (JSON.stringify(value) !== JSON.stringify(input[key as keyof R.Input]))
        throw new Error(
          "Saved fitting and station policy must remain unchanged",
        );
    const vertices: R.Input["verticesMm"] = input.verticesMm;
    const aliases: Map<string, number> = new Map();
    const canon: Int32Array = Int32Array.from(
      vertices.map((p: C.Vector, i: number): number => {
        if (!input.exactCoordinateAliases) return i;
        const key: string = JSON.stringify(p);
        if (!aliases.has(key)) aliases.set(key, i);
        return aliases.get(key)!;
      }),
    );
    const mesh: {
      vertices: typeof vertices;
      triangles: R.Input["triangles"];
      canon: Int32Array;
    } = { vertices, triangles: input.triangles, canon };
    const frame: ReturnType<typeof planeFrame> = planeFrame(
      [0, 0, 0],
      input.axis,
      input.reference,
    );
    const heights: number[] = vertices.map(
      (p: C.Vector): number =>
        p[0] * frame.n[0] + p[1] * frame.n[1] + p[2] * frame.n[2],
    );
    const index: ReturnType<typeof S.create> = S.create(
      mesh.triangles,
      heights,
    );
    const slice: ReturnType<typeof cutExact.prepare> = cutExact.prepare(
      mesh,
      heights,
    );
    const open: ReturnType<typeof O.prepare> = O.prepare({
      vertices,
      triangles: mesh.triangles,
      canon,
      heights,
    });
    const edgeFaces: Map<string, Set<number>> = new Map(),
      vertexFaces: Map<number, Set<number>> = new Map();
    const edgeKey: (a: number, b: number) => string = (
      a: number,
      b: number,
    ): string => (a < b ? `${a},${b}` : `${b},${a}`);
    mesh.triangles.forEach(
      (triangle: R.Input["triangles"][number], ti: number): void => {
        for (let k: number = 0; k < 3; k++) {
          const a: number = canon[triangle[k]!]!,
            b: number = canon[triangle[(k + 1) % 3]!]!;
          const key: string = edgeKey(a, b);
          if (!edgeFaces.has(key)) edgeFaces.set(key, new Set());
          edgeFaces.get(key)!.add(ti);
          if (!vertexFaces.has(a)) vertexFaces.set(a, new Set());
          vertexFaces.get(a)!.add(ti);
        }
      },
    );
    const events: ReturnType<typeof critical> = critical(
      mesh,
      frame.n,
      heights,
      "boundary-regular-path-v1",
    );
    const output: Continuation = {
      schema: "automovie-recovery-open-continuation-v1",
      criticalPolicy: "boundary-regular-path-v1",
      intervals: [],
      orientations: [],
      diagnostics: [
        "Unresolved open-observation groups include components with no open boundary arcs; closed-section surfaces are generated independently. These counts are not a count of remaining whole-model holes.",
      ],
      resolutionMm: input.chordToleranceMm,
      maxVerticesPerRun: 2_000_000,
    };
    type Row = {
      arcs: O.Arc[];
      ordinals: number[];
      missing: number[];
      defects: Set<number>[];
    };
    let previous: Row | undefined,
      eventCursor: number = 0;
    for (let i: number = 0; i < bundle.loft.sections.length; i++) {
      const level: number = bundle.loft.sections[i]!.coordinateMm;
      if (
        bundle.reports[i]!.coordinateMm !== level ||
        (i > 0 && !(level > bundle.loft.sections[i - 1]!.coordinateMm))
      )
        throw new Error("Increasing aligned saved stations required");
      const plane: ReturnType<typeof planeFrame> = {
        ...frame,
        origin: [frame.n[0] * level, frame.n[1] * level, frame.n[2] * level],
      };
      const contours: ReturnType<typeof cutExact> = slice(
        plane,
        level,
        index.cut(level),
      );
      const saved: Map<string, number> = new Map(
        bundle.reports[i]!.open.map(
          (
            fit: (typeof bundle.reports)[number]["open"][number],
            j: number,
          ): [string, number] => [fit.curve.name, j],
        ),
      );
      const row: Row = { arcs: [], ordinals: [], missing: [], defects: [] };
      const signs: (1 | -1 | null)[] = bundle.reports[i]!.open.map(
        (): null => null,
      );
      const found: Set<number> = new Set();
      for (let ci: number = 0; ci < contours.length; ci++) {
        const contour: (typeof contours)[number] = contours[ci]!;
        const pointFaces: Set<number>[] = contour.pts.map(
          (p: (typeof contour.pts)[number]): Set<number> =>
            p.a === p.b
              ? (vertexFaces.get(p.a) ?? new Set())
              : (edgeFaces.get(edgeKey(p.a, p.b)) ?? new Set()),
        );
        const support: Set<number> = new Set();
        for (const faces of pointFaces)
          for (const face of faces) support.add(face);
        const ordinal: number | undefined = saved.get(
          `section.${level}.contour.${ci}`,
        );
        if (contour.closed || contour.pts.length < 2 || ordinal === undefined) {
          row.defects.push(support);
          continue;
        }
        const curve: C.Cubic = bundle.reports[i]!.open[ordinal]!.curve;
        const first: C.Vector = curve.spans[0]![0],
          last: C.Vector = curve.spans.at(-1)![3];
        if (
          !first.every(
            (x: number, k: number): boolean => x === contour.pts[0]!.p[k],
          ) ||
          !last.every(
            (x: number, k: number): boolean => x === contour.pts.at(-1)!.p[k],
          )
        ) {
          row.defects.push(support);
          continue;
        }
        found.add(ordinal);
        row.ordinals.push(ordinal);
        row.arcs.push({
          faces: support,
          ends: [
            { a: contour.pts[0]!.a, b: contour.pts[0]!.b },
            { a: contour.pts.at(-1)!.a, b: contour.pts.at(-1)!.b },
          ],
        });
        for (
          let k: number = 1;
          k < contour.pts.length && signs[ordinal] === null;
          k++
        ) {
          const ti: number | undefined = [...pointFaces[k - 1]!].find(
            (face: number): boolean => pointFaces[k]!.has(face),
          );
          if (ti === undefined) continue;
          const triangle: R.Input["triangles"][number] = mesh.triangles[ti]!;
          const a: C.Vector = vertices[triangle[0]]!,
            b: C.Vector = vertices[triangle[1]]!,
            c: C.Vector = vertices[triangle[2]]!;
          const u: number[] = b.map(
              (x: number, j: number): number => x - a[j]!,
            ),
            v: number[] = c.map((x: number, j: number): number => x - a[j]!);
          const n: number[] = [
            u[1]! * v[2]! - u[2]! * v[1]!,
            u[2]! * v[0]! - u[0]! * v[2]!,
            u[0]! * v[1]! - u[1]! * v[0]!,
          ];
          const t: number[] = [
            frame.n[1] * n[2]! - frame.n[2] * n[1]!,
            frame.n[2] * n[0]! - frame.n[0] * n[2]!,
            frame.n[0] * n[1]! - frame.n[1] * n[0]!,
          ];
          const sense: number =
            contour.pts[k]!.p.reduce(
              (sum: number, x: number, j: number): number =>
                sum + (x - contour.pts[k - 1]!.p[j]!) * t[j]!,
              0,
            ) * input.sourceOrientationSign;
          if (Number.isFinite(sense) && sense !== 0)
            signs[ordinal] = sense > 0 ? 1 : -1;
        }
      }
      for (let j: number = 0; j < bundle.reports[i]!.open.length; j++)
        if (!found.has(j)) row.missing.push(j);
      output.orientations.push(signs);
      if (previous) {
        const beforeMm: number = bundle.loft.sections[i - 1]!.coordinateMm;
        const defects: Set<number>[] = [...previous.defects, ...row.defects];
        while (
          eventCursor < events.length &&
          events[eventCursor]!.level < beforeMm
        )
          eventCursor++;
        for (
          let j: number = eventCursor;
          j < events.length && events[j]!.level <= level;
          j++
        )
          defects.push(vertexFaces.get(events[j]!.vertex) ?? new Set());
        const observed: O.Result = open({
          beforeMm,
          afterMm: level,
          before: previous.arcs,
          after: row.arcs,
          defects,
          candidates: index.slab(beforeMm, level),
        });
        const interval: Continuation["intervals"][number] = {
          beforeSection: i - 1,
          afterSection: i,
          pairs: observed.pairs.map(
            (pair: O.Result["pairs"][number]): O.Result["pairs"][number] => ({
              before: previous!.ordinals[pair.before]!,
              after: row.ordinals[pair.after]!,
              reverseAfter: pair.reverseAfter,
            }),
          ),
          unresolved: observed.unresolved.map(
            (
              group: O.Result["unresolved"][number],
            ): O.Result["unresolved"][number] => ({
              before: group.before.map(
                (j: number): number => previous!.ordinals[j]!,
              ),
              after: group.after.map((j: number): number => row.ordinals[j]!),
              reason: group.reason,
            }),
          ),
        };
        if (previous.missing.length || row.missing.length)
          interval.unresolved.push({
            before: previous.missing,
            after: row.missing,
            reason:
              "Saved open coefficients have no identical endpoint-bound source observation",
          });
        output.intervals.push(interval);
        for (const diagnostic of observed.diagnostics ?? [])
          output.diagnostics.push(diagnostic);
      }
      previous = row;
      if (i % 64 === 0 || i + 1 === bundle.loft.sections.length)
        progress?.(i + 1, bundle.loft.sections.length);
    }
    return output;
  }
}
