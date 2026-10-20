import type { IAutoMovieMesh } from "@automovie/interface";

import { AutoMovieCanonicalBoundary64 as Q } from "./AutoMovieCanonicalBoundary64";
import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";

/** Sample finite parametric charts with declared boundary incidence. Fields and
 * first partials use millimetres; output positions use metres. The four sides
 * are bottom/right/top/left, each in its increasing local coordinate. Exact
 * canonical phase requests are unioned across every incident restriction before
 * emission. Extra exterior samples enter the containing cell's parameter polygon.
 * Boundary owners supply positions; all conflicting incident charts are omitted
 * before emission, while distinct chart normal fans remain separate. Callbacks
 * and their input coefficients must remain immutable for the call's lifetime.
 * This fixed lattice has no field-to-triangle error or G1/immersion certificate.
 * A nonlinear restriction declares both parameterize and localize. Their values
 * are checked on the finite schedule, not certified over the continuous domain.
 * Original local addresses are retained for a restriction's own requests, so an
 * approximate numerical inverse cannot replace an exact authored lattice point.
 * A zero chart cross product may carry an authored analytic normalLimit. Its
 * use is counted separately and does not remove the singular parameter sample
 * or certify that the caller derived a unique continuous surface normal.
 *
 * @evidence contracts/common.md#principled-implementation Analytic chart jets supply normals, declared directed map/inverse pairs transport canonical sample unions, and positively oriented parameter-cell polygons supply new triangle incidence. A complete boundary preflight rejects every incident chart of a conflicting point class before emission. Caller-derived normal limits at zero crosses are counted separately from singular samples and do not certify regularity.
 * @evidence contracts/common.md#clear-and-simple-design The operator owns sampling and shared physical point identity; callers own polynomial or rational field equations and boundary authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate weld, source mesh, first-owner conflict suppression, normal averaging, index reversal or primitive fallback changes the authored fields. Direction-preserving partial scaling prevents cross-product overflow. A singular sample uses only an explicitly authored finite analytic limit or remains zero; its singular count is retained.
 * @evidence contracts/common.md#meaningful-documentation States units, side direction, owner position semantics, finite limits, local omissions and absence of an approximation certificate.
 * @evidence contracts/performance.md#efficient-algorithms Boundary requests are sorted once per authority; each chart prefilters them once per side, then visits its bounded lattice and boundary polygons. Output is linear in retained samples and triangles apart from per-cell exterior filtering.
 * @evidence contracts/performance.md#reuse-equivalent-work Each declared physical sample has one cached position, while analytic normals and UVs retain chart ownership. All incidence is registered before any chart emits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most maxVertices render vertices and 4096 charts with at most 128 steps per axis are admitted. Maps, lattice samples and callback references are call-local; only mesh, counts and diagnostics escape.
 */
export function tessellateAutoMovieParametricAtlas64(props: {
  domain: string;
  maxVertices: number;
  patches: readonly {
    id: string;
    stepsU: number;
    stepsV: number;
    evaluate: (
      u: number,
      v: number,
    ) => { point: M.V; du: M.V; dv: M.V; normalLimit?: M.V };
    edges: readonly {
      authority: string;
      start: number;
      end: number;
      /** Local unit coordinate to this authority's canonical phase; paired with localize. */
      parameterize?: (local: number) => ReturnType<typeof Q.phase>;
      /** Inverse on the directed restriction; finite schedule checks are not a continuous certificate. */
      localize?: (phase: ReturnType<typeof Q.phase>) => number;
      sample: (phase: ReturnType<typeof Q.phase>) => {
        key: string;
        point: M.V;
      };
    }[];
  }[];
}): {
  mesh: IAutoMovieMesh;
  diagnostics: string[];
  retainedPatches: string[];
  counts: {
    patches: number;
    omittedPatches: number;
    vertices: number;
    triangles: number;
    singularNormals: number;
    limitingNormals: number;
    zeroAreaTriangles: number;
  };
} {
  if (
    !props.domain.trim() ||
    !Number.isSafeInteger(props.maxVertices) ||
    props.maxVertices <= 0 ||
    props.patches.length > 4096
  )
    throw new Error(
      "A bounded parametric atlas and topology domain are required",
    );
  type Patch = (typeof props.patches)[number];
  type Phase = ReturnType<typeof Q.phase>;
  type UV = [number, number];
  type BoundarySample = { key: string; point: M.V };
  const requests: Map<string, Map<string, Phase>> = new Map();
  const originalLocals: Map<
    Patch["edges"][number],
    Map<string, number>
  > = new Map();
  const names: Set<string> = new Set();
  for (const patch of props.patches) {
    if (
      !patch.id.trim() ||
      names.has(patch.id) ||
      patch.edges.length !== 4 ||
      ![patch.stepsU, patch.stepsV].every(
        (n: number): boolean => Number.isInteger(n) && n >= 1 && n <= 128,
      )
    )
      throw new Error(
        `${patch.id}: four edges and bounded lattice counts required`,
      );
    names.add(patch.id);
    patch.edges.forEach((edge: Patch["edges"][number], side: number): void => {
      const phases: Map<string, Phase> =
        requests.get(edge.authority) ?? new Map();
      requests.set(edge.authority, phases);
      const steps: number = side % 2 === 0 ? patch.stepsU : patch.stepsV;
      if (
        !edge.authority.trim() ||
        !Number.isFinite(edge.start) ||
        !Number.isFinite(edge.end) ||
        edge.start === edge.end ||
        (edge.parameterize === undefined) !== (edge.localize === undefined)
      )
        throw new Error(
          `${patch.id}: finite directed restrictions and paired parameter maps required`,
        );
      const locals: Map<string, number> = originalLocals.get(edge) ?? new Map();
      originalLocals.set(edge, locals);
      let previous: number | undefined;
      for (let index: number = 0; index <= steps; ++index) {
        const local: number = index / steps;
        const phase: Phase =
          edge.parameterize === undefined
            ? Q.phase(edge.start, edge.end, local)
            : edge.parameterize(local);
        if (
          !phase.key.trim() ||
          !Number.isFinite(phase.value) ||
          phase.value < Math.min(edge.start, edge.end) ||
          phase.value > Math.max(edge.start, edge.end) ||
          (index === 0 && phase.value !== edge.start) ||
          (index === steps && phase.value !== edge.end) ||
          (previous !== undefined &&
            (phase.value - previous) * (edge.end - edge.start) <= 0)
        )
          throw new Error(
            `${patch.id}: nonlinear boundary map violates its directed restriction`,
          );
        previous = phase.value;
        locals.set(phase.key, local);
        phases.set(phase.key, phase);
      }
    });
  }
  const mesh: IAutoMovieMesh = {
    positions: [],
    normals: [],
    uvs: [],
    indices: [],
    skin: null,
    physicalVertices: { sources: [], vertices: [] },
  };
  const physical: Map<string, { id: number; point: M.V }> = new Map();
  const counts: {
    patches: number;
    omittedPatches: number;
    vertices: number;
    triangles: number;
    singularNormals: number;
    limitingNormals: number;
    zeroAreaTriangles: number;
  } = {
    patches: 0,
    omittedPatches: 0,
    vertices: 0,
    triangles: 0,
    singularNormals: 0,
    limitingNormals: 0,
    zeroAreaTriangles: 0,
  };
  const diagnostics: string[] = [
    "Parametric lattice: field approximation, G1 continuity, immersion and intersection freedom remain unqualified",
  ];
  const retainedPatches: string[] = [];
  const schedules: Map<string, Phase[]> = new Map(
    [...requests].map(
      ([id, values]: [string, Map<string, Phase>]): [string, Phase[]] => [
        id,
        [...values.values()].sort(Q.compare),
      ],
    ),
  );
  const canonical: Map<string, M.V> = new Map();
  const conflicts: Set<string> = new Set();
  const incidents: Map<string, Set<string>> = new Map();
  const rejected: Map<string, string[]> = new Map();
  const plans: Map<
    string,
    { t: number; phase: Phase; sample: BoundarySample }[][]
  > = new Map();
  for (const patch of props.patches) {
    try {
      const sides: { t: number; phase: Phase; sample: BoundarySample }[][] =
        patch.edges.map(
          (
            edge: Patch["edges"][number],
            sideIndex: number,
          ): { t: number; phase: Phase; sample: BoundarySample }[] => {
            const low: Phase = Q.phase(0, 1, Math.min(edge.start, edge.end)),
              high: Phase = Q.phase(0, 1, Math.max(edge.start, edge.end));
            const phases: Phase[] = schedules
              .get(edge.authority)!
              .filter(
                (q: Phase): boolean =>
                  Q.compare(q, low) >= 0 && Q.compare(q, high) <= 0,
              );
            if (edge.start > edge.end) phases.reverse();
            const plan: { t: number; phase: Phase; sample: BoundarySample }[] =
              phases.map(
                (
                  phase: Phase,
                ): { t: number; phase: Phase; sample: BoundarySample } => {
                  const sample: BoundarySample = edge.sample(phase);
                  if (
                    !sample.key.trim() ||
                    !sample.point.every(Number.isFinite)
                  )
                    throw new Error("Nonfinite or unnamed canonical point");
                  const previous: M.V | undefined = canonical.get(sample.key);
                  if (previous === undefined)
                    canonical.set(sample.key, M.clone(sample.point));
                  else if (
                    previous.some(
                      (value: number, axis: number): boolean =>
                        value !== sample.point[axis],
                    )
                  )
                    conflicts.add(sample.key);
                  const owners: Set<string> =
                    incidents.get(sample.key) ?? new Set();
                  owners.add(patch.id);
                  incidents.set(sample.key, owners);
                  const own: number | undefined = originalLocals
                    .get(edge)!
                    .get(phase.key);
                  const t: number =
                    own ??
                    (edge.localize === undefined
                      ? Q.local(edge.start, edge.end, phase)
                      : edge.localize(phase));
                  if (!Number.isFinite(t) || t < 0 || t > 1)
                    throw new Error(
                      "Boundary inverse leaves its local restriction",
                    );
                  return { t, phase, sample };
                },
              );
            for (let index: number = 1; index < plan.length; ++index) {
              const previous: (typeof plan)[number] = plan[index - 1]!,
                current: (typeof plan)[number] = plan[index]!;
              if (current.t <= previous.t)
                throw new Error(
                  `Boundary inverse does not preserve the scheduled direction: ${JSON.stringify({ authority: edge.authority, side: sideIndex, start: edge.start, end: edge.end, previous: { phase: previous.phase, local: previous.t, authored: originalLocals.get(edge)!.has(previous.phase.key) }, current: { phase: current.phase, local: current.t, authored: originalLocals.get(edge)!.has(current.phase.key) } })}`,
                );
            }
            return plan;
          },
        );
      plans.set(patch.id, sides);
    } catch (error) {
      rejected.set(patch.id, [
        error instanceof Error ? error.message : String(error),
      ]);
    }
  }
  for (const key of conflicts)
    for (const id of incidents.get(key) ?? []) {
      const messages: string[] = rejected.get(id) ?? [];
      messages.push(`Inconsistent canonical point ${key}`);
      rejected.set(id, messages);
    }
  for (const patch of props.patches) {
    const rejection: string[] | undefined = rejected.get(patch.id);
    if (rejection !== undefined) {
      ++counts.omittedPatches;
      diagnostics.push(`${patch.id}: ${rejection.join("; ")}`);
      continue;
    }
    try {
      const sides: { t: number; phase: Phase; sample: BoundarySample }[][] =
        plans.get(patch.id)!;
      const local: Map<string, number> = new Map();
      const polygon: UV[][] = [];
      for (let y: number = 0; y < patch.stepsV; ++y)
        for (let x: number = 0; x < patch.stepsU; ++x) {
          const u0: number = x / patch.stepsU,
            u1: number = (x + 1) / patch.stepsU;
          const v0: number = y / patch.stepsV,
            v1: number = (y + 1) / patch.stepsV;
          const vertices: UV[] = [[u0, v0]];
          if (y === 0)
            vertices.push(
              ...sides[0]!
                .filter((q: { t: number }): boolean => q.t > u0 && q.t < u1)
                .map((q: { t: number }): UV => [q.t, v0]),
            );
          vertices.push([u1, v0]);
          if (x + 1 === patch.stepsU)
            vertices.push(
              ...sides[1]!
                .filter((q: { t: number }): boolean => q.t > v0 && q.t < v1)
                .map((q: { t: number }): UV => [u1, q.t]),
            );
          vertices.push([u1, v1]);
          if (y + 1 === patch.stepsV)
            vertices.push(
              ...sides[2]!
                .filter((q: { t: number }): boolean => q.t > u0 && q.t < u1)
                .slice()
                .reverse()
                .map((q: { t: number }): UV => [q.t, v1]),
            );
          vertices.push([u0, v1]);
          if (x === 0)
            vertices.push(
              ...sides[3]!
                .filter((q: { t: number }): boolean => q.t > v0 && q.t < v1)
                .slice()
                .reverse()
                .map((q: { t: number }): UV => [u0, q.t]),
            );
          polygon.push(vertices);
        }
      const estimate: number =
        (patch.stepsU + 1) * (patch.stepsV + 1) +
        polygon.filter((p: UV[]): boolean => p.length > 4).length +
        sides.reduce(
          (sum: number, side: unknown[]): number => sum + side.length,
          0,
        );
      if (counts.vertices + estimate > props.maxVertices)
        throw new Error("Render vertex budget would be exceeded");
      const triangles: number[] = [];
      for (const p of polygon) {
        const ids: number[] = p.map(([u, v]: UV): number => vertex(u, v));
        if (p.length === 4)
          triangles.push(ids[0]!, ids[1]!, ids[2]!, ids[0]!, ids[2]!, ids[3]!);
        else {
          const centre: UV = p.reduce(
            (sum: UV, uv: UV): UV => [
              sum[0] + uv[0] / p.length,
              sum[1] + uv[1] / p.length,
            ],
            [0, 0],
          );
          const id: number = vertex(...centre);
          for (let i: number = 0; i < ids.length; ++i)
            triangles.push(id, ids[i]!, ids[(i + 1) % ids.length]!);
        }
      }
      const firstTriangle: number = counts.triangles;
      for (let index: number = 0; index < triangles.length; index += 3) {
        const ids: number[] = triangles.slice(index, index + 3);
        const p: M.V[] = ids.map(
          (id: number): M.V => mesh.positions.slice(3 * id, 3 * id + 3) as M.V,
        );
        const a: M.V = M.sub(p[1]!, p[0]!),
          b: M.V = M.sub(p[2]!, p[0]!);
        const scaleA: number = Math.max(...a.map(Math.abs)),
          scaleB: number = Math.max(...b.map(Math.abs));
        const aa: M.V =
          scaleA === 0
            ? [0, 0, 0]
            : (a.map((value: number): number => value / scaleA) as M.V);
        const bb: M.V =
          scaleB === 0
            ? [0, 0, 0]
            : (b.map((value: number): number => value / scaleB) as M.V);
        const area: number = Math.hypot(
          aa[1] * bb[2] - aa[2] * bb[1],
          aa[2] * bb[0] - aa[0] * bb[2],
          aa[0] * bb[1] - aa[1] * bb[0],
        );
        if (area === 0) ++counts.zeroAreaTriangles;
        else {
          mesh.indices!.push(...ids);
          ++counts.triangles;
        }
      }
      if (counts.triangles > firstTriangle) {
        ++counts.patches;
        retainedPatches.push(patch.id);
      } else {
        ++counts.omittedPatches;
        diagnostics.push(`${patch.id}: no nonzero-area triangle survived`);
      }

      /** Canonical owners determine position; the actual chart determines its normal. */
      function vertex(u: number, v: number): number {
        const localKey: string = `${u}:${v}`;
        const previous: number | undefined = local.get(localKey);
        if (previous !== undefined) return previous;
        const jet: ReturnType<Patch["evaluate"]> = patch.evaluate(u, v);
        let point: M.V = jet.point;
        let key: string = `${patch.id}:interior:${localKey}`;
        const side: number =
          v === 0 ? 0 : u === 1 ? 1 : v === 1 ? 2 : u === 0 ? 3 : -1;
        if (side >= 0) {
          const t: number = side % 2 === 0 ? u : v;
          const request:
            | { t: number; phase: Phase; sample: BoundarySample }
            | undefined = sides[side]!.find(
            (q: { t: number }): boolean => q.t === t,
          );
          if (request === undefined)
            throw new Error("Missing declared boundary phase");
          const sample: BoundarySample = request.sample;
          key = sample.key;
          point = sample.point;
        }
        if (![...point, ...jet.du, ...jet.dv].every(Number.isFinite))
          throw new Error("Nonfinite analytic chart value");
        const held: { id: number; point: M.V } | undefined = physical.get(key);
        if (
          held !== undefined &&
          held.point.some((q: number, k: number): boolean => q !== point[k])
        )
          throw new Error(`Inconsistent canonical point ${key}`);
        const source: { id: number; point: M.V } = held ?? {
          id: physical.size,
          point: M.clone(point),
        };
        if (held === undefined) {
          physical.set(key, source);
          mesh.physicalVertices!.sources.push({
            domain: props.domain,
            id: source.id,
          });
        }
        const scaleU: number = Math.max(...jet.du.map(Math.abs)),
          scaleV: number = Math.max(...jet.dv.map(Math.abs));
        const du: M.V =
          scaleU === 0
            ? [0, 0, 0]
            : (jet.du.map((value: number): number => value / scaleU) as M.V);
        const dv: M.V =
          scaleV === 0
            ? [0, 0, 0]
            : (jet.dv.map((value: number): number => value / scaleV) as M.V);
        const normal: M.V = [
          du[1] * dv[2] - du[2] * dv[1],
          du[2] * dv[0] - du[0] * dv[2],
          du[0] * dv[1] - du[1] * dv[0],
        ];
        let length: number = Math.hypot(...normal);
        if (length === 0) ++counts.singularNormals;
        if (length === 0 && jet.normalLimit !== undefined) {
          if (!jet.normalLimit.every(Number.isFinite))
            throw new Error("Nonfinite authored normal limit");
          const scale: number = Math.max(...jet.normalLimit.map(Math.abs));
          if (scale > 0) {
            for (let axis: number = 0; axis < 3; ++axis)
              normal[axis] = jet.normalLimit[axis]! / scale;
            length = Math.hypot(...normal);
            ++counts.limitingNormals;
          }
        }
        const id: number = counts.vertices++;
        mesh.positions.push(...M.scale(source.point, 0.001));
        mesh.normals!.push(
          ...(length > 0 ? M.scale(normal, 1 / length) : [0, 0, 0]),
        );
        mesh.uvs!.push(u, v);
        mesh.physicalVertices!.vertices.push(source.id);
        local.set(localKey, id);
        return id;
      }
    } catch (error) {
      ++counts.omittedPatches;
      diagnostics.push(
        `${patch.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  if (counts.singularNormals)
    diagnostics.push(
      `Singular chart cross products: ${counts.singularNormals}; authored analytic limits used: ${counts.limitingNormals}; unresolved: ${counts.singularNormals - counts.limitingNormals}`,
    );
  if (counts.zeroAreaTriangles)
    diagnostics.push(
      `Omitted exact zero-area triangles: ${counts.zeroAreaTriangles}`,
    );
  return { mesh, diagnostics, counts, retainedPatches };
}
