import type {
  AutoMovieVector3Tuple,
  IAutoMovieSolidBody,
  IAutoMovieSolidMesh,
} from "@automovie/interface";

import { AutoMovieSolidBodyMerge } from "./AutoMovieSolidBodyMerge";
import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import { faceAutoMovieSolidMesh } from "./faceAutoMovieSolidMesh";

/**
 * A solid built by merges and diffs, as trimmed faces that share their
 * boundaries: the base, every blend and every part, each a surface with its
 * trim cycles in its own chart (`AutoMovieSolidCycle`), the shared boundary
 * vertices held once in the body's mesh.
 *
 * A merge ({@link merge}) traces its part against the body as an atlas
 * ({@link atlas}), so its curve and its host rail cross from face to face (the
 * thigh against the trunk and the gluteal mass, a malleolus on the
 * shank-to-foot blend, the second breast against the first). It adds the blend
 * face (the join's blend chain, its two rails its station-end cycles), gives
 * the part face its rail cycle (a part merged again at its other end keeps
 * both, a limb merged at its root and at its foot), and trims every host face
 * the host rail runs over: a rail on one face adds its loop, a rail that
 * crosses faces is clipped into each face it runs on (`AutoMovieSolidClip`).
 * Where two blends meet (the perineum, the webs, the cleavage), the later
 * merge's rail simply runs over the earlier blend face, so no corner needs its
 * own patch.
 *
 * {@link draw} tessellates every face on its own grid trimmed by its cycles
 * (`AutoMovieSolidMesh.face`), shared boundaries vertex for vertex.
 */
export namespace AutoMovieSolidBody {
  /**
   * A body of base faces, untrimmed.
   *
   * @param name Name in diagnostics.
   * @param faces The base faces.
   * @returns The body.
   */
  export function create(
    name: string,
    faces: IAutoMovieSolidBody.IFaceInput[],
  ): IAutoMovieSolidBody.IBody {
    return {
      name,
      faces: faces.map(
        (f: IAutoMovieSolidBody.IFaceInput): IAutoMovieSolidBody.IFace => ({
          ...f,
          cycles: [],
        }),
      ),
      mesh: AutoMovieSolidMesh.create(),
      blends: [],
    };
  }

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
    return AutoMovieSolidBodyMerge.atlas(body, without);
  }

  /**
   * Merge or cut a part into the body.
   *
   * @param body The body; its faces, cycles and mesh grow in place.
   * @param input The merge.
   * @returns The blend or null with observed diagnostics. Returned rail/trim
   *   failures restore face count, copied cycles and mesh populations; thrown
   *   callbacks are not caught or rolled back.
   */
  export function merge(
    body: IAutoMovieSolidBody.IBody,
    input: IAutoMovieSolidBody.IMerge,
  ): IAutoMovieSolidBody.IMerged {
    return AutoMovieSolidBodyMerge.merge(body, input);
  }

  /**
   * Tessellate every face.
   *
   * @param body The body; its mesh receives the triangles.
   * @param onFailure Optional face-name/detail receiver for named planning
   *   failures; absence preserves the throwing default.
   * @returns Each face's explicit native boundary occurrences and complete
   *   endpoint classification, by face.
   */
  export function draw(
    body: IAutoMovieSolidBody.IBody,
    onFailure?: (face: string, detail: string) => void,
  ): IAutoMovieSolidMesh.IOpen[][] {
    const append = prepareFaces(body.mesh);
    return body.faces.map(
      (f: IAutoMovieSolidBody.IFace): IAutoMovieSolidMesh.IOpen[] => {
        const input: IAutoMovieSolidMesh.IFace = {
          surface: f.surface,
          stations: f.stations,
          phases: f.phases,
          domainLoops: f.meshLoops,
          loops: f.cycles.map(
            ({ kind, vertices, chart, partition, along, segments }) => ({
              kind,
              vertices,
              chart,
              ...(partition === true ? { partition, along, segments } : {}),
            }),
          ),
          inverted: f.inverted,
          onFailure:
            onFailure === undefined
              ? undefined
              : (detail: string): void => onFailure(f.surface.name, detail),
        };
        return append(input);
      },
    );
  }

  /** Prepare one append-only face batch for direct or published body skin. */
  export function prepareFaces(
    mesh: IAutoMovieSolidMesh.IMesh,
  ): (input: IAutoMovieSolidMesh.IFace) => IAutoMovieSolidMesh.IOpen[] {
    const append = faceAutoMovieSolidMesh.prepare(mesh, true);
    return (input): IAutoMovieSolidMesh.IOpen[] =>
      drawSplitParent(mesh, input, append);
  }

  /**
   * Retain an end cut on native phase spokes. The curved cut owns all of its
   * published vertices. The nearest wholly kept station joins the untouched
   * grid, with one two-boundary interpolation strip across the source chart.
   *
   * @see https://doi.org/10.1002/nme.1620070405
   */
  function drawSplitParent(
    mesh: IAutoMovieSolidMesh.IMesh,
    input: IAutoMovieSolidMesh.IFace,
    append: (input: IAutoMovieSolidMesh.IFace) => IAutoMovieSolidMesh.IOpen[],
  ): IAutoMovieSolidMesh.IOpen[] {
    const { phases, stations, surface, loops: cycles } = input;
    const cycle: IAutoMovieSolidMesh.ILoop | undefined = cycles.find(
      ({ partition }): boolean => partition === true,
    );
    if (
      cycle === undefined ||
      (cycle.along === undefined && cycles.length !== 1) ||
      stations.length < 3 ||
      (input.domainLoops?.length ?? 0) !== 0 ||
      (cycle.kind !== "start" && cycle.kind !== "end") ||
      surface.period === undefined
    )
      return append(input);
    const bottom: boolean = cycle.kind === "start";
    const station: number = stations[bottom ? 0 : stations.length - 1]!;
    const curved: boolean = cycle.along !== undefined;
    const cutMin: number = Math.min(...cycle.chart.map(([u]): number => u));
    const cutMax: number = Math.max(...cycle.chart.map(([u]): number => u));
    const outer: number = bottom ? cutMax : cutMin;
    const inner: number = bottom ? cutMin : cutMax;
    const kept = curved
      ? stations.filter((u): boolean => (bottom ? u > outer : u < outer))
      : bottom
        ? stations.slice(1)
        : stations.slice(0, -1);
    const firstKept: number | undefined = bottom ? kept[0] : kept.at(-1);
    const nonSplit = cycles.filter((other): boolean => other !== cycle);
    const fail = (detail: string): IAutoMovieSolidMesh.IOpen[] => {
      if (!curved) return append(input);
      if (input.onFailure === undefined) throw new Error(detail);
      input.onFailure(detail);
      return [];
    };
    if (
      firstKept === undefined ||
      kept.length < 2 ||
      nonSplit.some(({ chart }): boolean =>
        chart.some(([u]): boolean =>
          bottom ? u <= firstKept : u >= firstKept,
        ),
      )
    )
      return fail(
        "a structured split end has no separate complete kept station",
      );
    const selected: number[] | undefined = AutoMovieSolidCycle.partition(
      cycle,
      phases,
      station,
      curved ? kept : stations,
      surface,
    );
    if (selected === undefined)
      return fail("a structured split end has no native phase partition");
    const matched: number[] = selected.map((i): number => cycle.chart[i]![1]);
    const before: [number, number, number, number] = [
      mesh.positions.length,
      mesh.coordinates.length,
      mesh.indices.length,
      mesh.owners.length,
    ];
    let failure: boolean = false;
    const opened = append({
      ...input,
      phases: matched,
      stations: kept,
      loops: cycles.filter((other): boolean => other !== cycle),
      onFailure: (): void => {
        failure = true;
      },
    });
    const rim = opened.find(
      ({ end }): boolean => end === (bottom ? "bottom" : "top"),
    );
    const coarse: number[] | undefined = rim?.vertices
      .slice()
      .sort(
        (a, b): number =>
          mesh.coordinates[3 * a + 2]! - mesh.coordinates[3 * b + 2]!,
      );
    if (
      failure ||
      coarse === undefined ||
      coarse.length !== matched.length ||
      coarse.some((i, k): boolean => mesh.coordinates[3 * i + 2] !== matched[k])
    ) {
      [
        mesh.positions.length,
        mesh.coordinates.length,
        mesh.indices.length,
        mesh.owners.length,
      ] = before;
      if (mesh.normals !== undefined) mesh.normals.length = before[0];
      return fail("a structured split end has no matching kept phase ring");
    }
    let fine: readonly number[] = cycle.vertices;
    const site = (j: number): number => fine[j % fine.length]!;
    const phase = (j: number): number =>
      cycle.chart[j % cycle.vertices.length]![1] +
      (j >= cycle.vertices.length ? surface.period! : 0);
    const triangles: [number, number, number][] = [];
    if (curved) {
      const id: number = AutoMovieSolidMesh.owner(mesh, surface);
      const over = stations.filter((u): boolean =>
        bottom ? u > inner && u < firstKept : u < inner && u > firstKept,
      );
      if (!bottom) over.reverse();
      for (const station of over) {
        const fraction: number = (station - inner) / (firstKept - inner);
        const row = cycle.chart.map(([u, v]): number => {
          const original: number = u + (firstKept - u) * fraction;
          const p: AutoMovieVector3Tuple =
            surface.point?.(original, v) ?? surface.jet(original, v).p;
          return AutoMovieSolidMesh.vertex(mesh, p, id, original, v);
        });
        for (const [k, a] of row.entries()) {
          const next: number = (k + 1) % row.length;
          triangles.push(
            [a, row[next]!, fine[next]!],
            [a, fine[next]!, fine[k]!],
          );
        }
        fine = row;
      }
    }
    for (const [k, a] of coarse.entries()) {
      const next: number = (k + 1) % coarse.length;
      const b: number = coarse[next]!;
      const first: number = selected[k]!;
      const last: number =
        selected[next]! + (next === 0 ? cycle.vertices.length : 0);
      // The nearer coarse phase spans each fine edge. The remaining triangle
      // connects the coarse edge to the separating fine vertex. Both exact
      // endpoint spokes stay edges of this sector's triangulation.
      const midpoint: number = (phase(first) + phase(last)) / 2;
      let pivot: number = first;
      for (let j: number = first; j < last; ++j) {
        const left: boolean = (phase(j) + phase(j + 1)) / 2 <= midpoint;
        if (left) pivot = j + 1;
        triangles.push([left ? a : b, site(j + 1), site(j)]);
      }
      triangles.push([a, b, site(pivot)]);
    }
    AutoMovieSolidMesh.close(
      mesh,
      bottom
        ? triangles.map(([a, b, c]): [number, number, number] => [a, c, b])
        : triangles,
      surface,
      input.inverted === true,
    );
    return opened.filter((boundary): boolean => boundary !== rim);
  }

  /**
   * A body as data: the vertices its cycles use, renumbered as points.
   *
   * @param body The body, its faces' surfaces named after their chains.
   * @returns The published body.
   */
  export function publish(
    body: IAutoMovieSolidBody.IBody,
  ): IAutoMovieSolidBody.IPublished {
    /** Renumber each first-seen boundary vertex once. */
    const index: Map<number, number> = new Map();

    /** Detached shared-boundary point records for this publication. */
    const points: IAutoMovieSolidBody.IPublished["points"] = [];

    /**
     * Read the original owner/chart coordinates when a boundary index first
     * appears.
     */
    const point: (v: number) => number = (v: number): number => {
      /** Previously published identity for this same mesh vertex. */
      const known: number | undefined = index.get(v);
      if (known !== undefined) return known;

      /** Original owner and chart entries for this referenced boundary vertex. */
      const c: number[] = body.mesh.coordinates.slice(3 * v, 3 * v + 3);
      points.push({
        chain: body.mesh.owners[c[0]!]!.name,
        chart: [c[1]!, c[2]!],
      });
      index.set(v, points.length - 1);
      return points.length - 1;
    };
    /**
     * Copy one boundary record while retaining the one shared point identity
     * across either role.
     */
    const cycle: (
      c: IAutoMovieSolidMesh.ILoop,
    ) => IAutoMovieSolidBody.IPublished["faces"][number]["cycles"][number] = (
      c: IAutoMovieSolidMesh.ILoop,
    ): IAutoMovieSolidBody.IPublished["faces"][number]["cycles"][number] => ({
      kind: c.kind,
      points: c.vertices.map(point),
      chart: c.chart.map((p: [number, number]): [number, number] => [
        p[0],
        p[1],
      ]),
      ...(c.along === undefined ? {} : { along: c.along }),
      ...(c.partition === true
        ? { partition: true, segments: c.segments?.slice() }
        : {}),
    });
    return {
      name: body.name,
      points,
      faces: body.faces.map(
        (
          f: IAutoMovieSolidBody.IFace,
        ): IAutoMovieSolidBody.IPublished["faces"][number] => {
          const domains:
            | IAutoMovieSolidBody.IPublished["faces"][number]["cycles"]
            | undefined = f.meshLoops?.map(cycle);
          const grid: IAutoMovieSolidBody.IPublished["faces"][number]["grid"] =
            domains === undefined
              ? undefined
              : {
                  stations: [
                    f.stations[0]!,
                    f.stations[f.stations.length - 1]!,
                  ],
                  phases: [f.phases[0]!, f.phases[f.phases.length - 1]!],
                };
          return {
            chain: f.surface.name,
            ...(f.retainSurface === true
              ? { surface: f.surface, stations: [...f.stations] }
              : {}),
            ...(f.retainPhases === true ? { samplePhases: [...f.phases] } : {}),
            cycles: f.cycles.map(cycle),
            ...(domains === undefined
              ? {}
              : { domainLoops: domains, grid: grid! }),
            ...(f.inverted === true ? { inverted: true } : {}),
          };
        },
      ),
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
  export function kept(
    face: IAutoMovieSolidBody.IFace,
    u: number,
    v: number,
  ): boolean {
    return AutoMovieSolidBodyMerge.kept(face, u, v);
  }
}
