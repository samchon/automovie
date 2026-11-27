import type {
  IAutoMovieSolidBody,
  IAutoMovieSolidCycle,
  IAutoMovieSolidMesh,
} from "@automovie/interface";

import { AutoMovieSolidBodyMerge } from "./AutoMovieSolidBodyMerge";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";

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
    return body.faces.map(
      (f: IAutoMovieSolidBody.IFace): IAutoMovieSolidMesh.IOpen[] =>
        AutoMovieSolidMesh.face(body.mesh, {
          surface: f.surface,
          stations: f.stations,
          phases: f.phases,
          domainLoops: f.meshLoops,
          loops: f.cycles.map(
            (c: IAutoMovieSolidCycle.ICycle): IAutoMovieSolidMesh.ILoop => ({
              kind: c.kind,
              vertices: c.vertices,
              chart: c.chart,
            }),
          ),
          inverted: f.inverted,
          onFailure:
            onFailure === undefined
              ? undefined
              : (detail: string): void => onFailure(f.surface.name, detail),
        }),
    );
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
    /*
     * Renumber each first-seen boundary vertex once.
     */
    const index: Map<number, number> = new Map();

    /*
     * Detached shared-boundary point records for this publication.
     */
    const points: IAutoMovieSolidBody.IPublished["points"] = [];

    /*
     * Read the original owner/chart coordinates when a boundary index first
     * appears.
     */
    const point: (v: number) => number = (v: number): number => {
      /*
       * Previously published identity for this same mesh vertex.
       */
      const known: number | undefined = index.get(v);
      if (known !== undefined) return known;

      /*
       * Original owner and chart entries for this referenced boundary vertex.
       */
      const c: number[] = body.mesh.coordinates.slice(3 * v, 3 * v + 3);
      points.push({
        chain: body.mesh.owners[c[0]!]!.name,
        chart: [c[1]!, c[2]!],
      });
      index.set(v, points.length - 1);
      return points.length - 1;
    };
    /*
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
