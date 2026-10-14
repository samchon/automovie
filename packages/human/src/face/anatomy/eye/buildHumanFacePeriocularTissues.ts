import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanLocalMeshFrame } from "../../../common/mesh/IHumanLocalMeshFrame";
import { createHumanLocalMeshFrame } from "../../../common/mesh/createHumanLocalMeshFrame";
import { assertHumanFacePeriocularCage } from "../../basis/assertHumanFacePeriocularCage";
import type { AutoMovieHumanFacePeriocularTissue } from "../../structures/AutoMovieHumanFacePeriocularTissue";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFacePeriocularCage } from "../../structures/IAutoMovieHumanFacePeriocularCage";
import type { IAutoMovieHumanFacePeriocularStation } from "../../structures/IAutoMovieHumanFacePeriocularStation";
import type { IAutoMovieHumanFacePeriocularTissueSection } from "../../structures/IAutoMovieHumanFacePeriocularTissueSection";
import type { IAutoMovieHumanFacePeriocularTissues } from "../../structures/IAutoMovieHumanFacePeriocularTissues";
import type { IHumanFaceSkinFrame } from "../skin/IHumanFaceSkinFrame";
import type { IHumanFaceSkinHost } from "../skin/IHumanFaceSkinHost";
import type { IHumanFaceSkinSeat } from "../skin/IHumanFaceSkinSeat";
import { createHumanFaceSkinHost } from "../skin/createHumanFaceSkinHost";
import { HUMAN_FACE_LID_SEAT } from "./HUMAN_FACE_LID_SEAT";
import { buildHumanFacePeriocularBand } from "./buildHumanFacePeriocularBand";
import { createHumanFaceConformingSheet } from "./createHumanFaceConformingSheet";
import { createHumanFacePeriocularIndexedShell } from "./createHumanFacePeriocularIndexedShell";
import { createHumanFacePeriocularShellMesh } from "./createHumanFacePeriocularShellMesh";
import { readHumanFacePeriocularMapping } from "./readHumanFacePeriocularMapping";
import type { IHumanFaceConformingSheetVertex } from "./structures/IHumanFaceConformingSheetVertex";
import type { IHumanFaceOcularSurface } from "./structures/IHumanFaceOcularSurface";
import type { IHumanFacePeriocularBand } from "./structures/IHumanFacePeriocularBand";
import type { IHumanFacePeriocularHostSample } from "./structures/IHumanFacePeriocularHostSample";
import type { IHumanFacePeriocularMappingReading } from "./structures/IHumanFacePeriocularMappingReading";
import type { IHumanFacePeriocularTissuePart } from "./structures/IHumanFacePeriocularTissuePart";

/**
 * Construct the eight coarse lid tissue identities of each eye, each from
 * the surface it anatomically belongs to.
 *
 * For each lid the posterior lamella is a band under the anterior lid
 * margin, where the lid has its thickness, and runs up the globe, away from the aperture, to the far border of
 * the tarsal plate: the registered tarsal extent when the cage has one,
 * otherwise the foot of the cage's crease row. It spans the interior columns
 * of its lid outside the medial bed, because a tarsal plate ends at the
 * canthal tendons short of both commissures and the lid leaves the globe in
 * the bed. The conjunctiva under the margin shelf itself is not represented.
 * A compiled material disk reads actual host triangles with their source
 * barycentric incidence. The posterior margin is its ocular arc origin and
 * the registered far border is found on its source station meridian path.
 * Legacy bases without this registration retain spatial nearest-point seating
 * and its geometric refusals; that path does not guarantee a regular patch.
 *
 * Both faces read the actual host triangles along the band. Registered bands
 * retain every anterior native knot and four cells per native edge; legacy
 * bands retain four cells per coarse interval. A registered band triangulates
 * its complete near/far/end boundary once, then divides those material
 * triangles into eight barycentric intervals before exact native clipping.
 * Native facets further refine that domain without a second density factor.
 * Legacy bands keep eight row intervals.
 * Every vertex reads its actual skin triangle and interpolated normal.
 * Both shell faces are fixed offsets from that skin. The exterior supplies
 * the pointwise room reading including the authored tear film, rather
 * than lifting a deficient shell through its covering skin.
 *
 * The anterior lamella belongs to the skin. Orbicularis and septal support
 * are the cage station strip moved inward along the host skin normal by
 * `inwardOffsetMm`, with their thickness further inward. A shell that reaches
 * the globe stays deficient and is refused without changing its thickness.
 *
 * `inwardOffsetMm` keeps one meaning for every tissue: the distance its outer
 * face keeps from the skin. This construction applies to both lamellae.
 * `fit` records the actual inner face's distance above the
 * exterior floor over every generated posterior sample and each anterior
 * station. Negative room is a request the lid cannot
 * hold; the admission refuses it and no requested dimension is changed.
 *
 * Layer order follows Ferreira et al. 2020 (PMC7139934). Supplied offsets and
 * thicknesses are authored geometric dimensions. These shells do not rotate
 * with the globe.
 * An optional observer reports completed band construction, actual ocular
 * projections after their room reading, and each completed tissue part. Side,
 * tissue and native host identify the work without carrying buffers or an
 * acceptance verdict. Exceptions propagate before a pose can be cached.
 * Incidence and Float32 refusals retain original grid samples and near/far
 * source identities. Incidence reports every refused edge's native and grid
 * parents; Float32 retains the completed overlay. Reporting changes neither
 * the mapping nor the shell and performs no second geometric query.
 *
 * @evidence contracts/common.md#principled-implementation Actual source skin frames supply normal-offset lamellae and the same ocular exterior measures each emitted inner-face sample without changing requested dimensions.
 * @evidence contracts/common.md#clear-and-simple-design One band/conforming overlay per lid is shared across posterior tissues; anterior station strips and final local publication retain their own geometry responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Deficient room remains a refusal candidate for downstream whole-surface admission; incidence/Float32 witnesses retain the original source population rather than repairing it.
 * @evidence contracts/common.md#meaningful-documentation The prose specifies millimetre inputs, metre meshes, named tissue ownership, observers, signed room and admission limitations.
 * @evidence contracts/performance.md#efficient-algorithms Source-host construction, native exact overlay and per-sample ocular projection dominate; fixed tissue roles do not hide chart/refinement and numeric bit-width costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Skin hosts are shared per source surface, bands/overlay/frames per lid, and each part memoizes its actual mapping reading on first request.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned parts and mapping closures retain their actual band/geometry until caller release; temporary build maps expire and no background task is acquired.
 */
export function buildHumanFacePeriocularTissues(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  normals: ReadonlyMap<string, readonly number[]>,
  surfaces: ReadonlyMap<"left" | "right", IHumanFaceOcularSurface>,
  input: IAutoMovieHumanFacePeriocularTissues,
  progress?: (owner: string) => void,
): IHumanFacePeriocularTissuePart[] {
  const tear: number = HUMAN_FACE_LID_SEAT.tearFilmMetres;
  const parts: IHumanFacePeriocularTissuePart[] = [];
  const skinHosts: Map<string, IHumanFaceSkinHost> = new Map<
    string,
    IHumanFaceSkinHost
  >();
  for (const side of ["left", "right"] as const) {
    const requested:
      | Partial<
          Record<
            AutoMovieHumanFacePeriocularTissue,
            IAutoMovieHumanFacePeriocularTissueSection
          >
        >
      | undefined = input[side];
    if (requested === undefined || Object.keys(requested).length === 0)
      continue;
    const cage: IAutoMovieHumanFacePeriocularCage | undefined =
      basis.periocular?.[side].cage;
    const surface: IHumanFaceOcularSurface | undefined = surfaces.get(side);
    if (cage === undefined)
      throw new Error("Periocular tissue source cage unavailable: " + side);
    if (surface === undefined)
      throw new Error(
        "Periocular tissue needs the generated ocular exterior of its eye: " +
          side,
      );
    assertHumanFacePeriocularCage(basis, cage);
    const points: readonly number[] | undefined = positions.get(cage.surface),
      directions: readonly number[] | undefined = normals.get(cage.surface);
    const host: IAutoMovieHumanFaceBasisSurface | undefined =
      basis.surfaces.find(
        (entry: IAutoMovieHumanFaceBasisSurface): boolean =>
          entry.id === cage.surface,
      );
    if (
      host === undefined ||
      points === undefined ||
      directions === undefined ||
      points.length !== host.positions.length ||
      directions.length !== points.length
    )
      throw new Error(
        "Periocular tissue needs complete matching live position and normal buffers: " +
          side,
      );
    const read: (
      rows: readonly number[],
      vertex: number,
    ) => IAutoMovieVector3 = (
      rows: readonly number[],
      vertex: number,
    ): IAutoMovieVector3 =>
      Vector3.create(
        rows[3 * vertex],
        rows[3 * vertex + 1],
        rows[3 * vertex + 2],
      );
    const skinHost: IHumanFaceSkinHost =
      skinHosts.get(host.id) ?? createHumanFaceSkinHost(host.indices, points);
    skinHosts.set(host.id, skinHost);
    const bandsByLid: Map<boolean, IHumanFacePeriocularBand> = new Map<
      boolean,
      IHumanFacePeriocularBand
    >();
    const station: (role: string) => number = (role: string): number => {
      const found: number = cage.stations.findIndex(
        (entry: IAutoMovieHumanFacePeriocularStation): boolean =>
          entry.role === role,
      );
      if (found < 0)
        throw new Error(
          "Periocular tissue needs its station row: " + side + ":" + role,
        );
      return found;
    };
    for (const tissue of Object.keys(requested) as (keyof typeof requested)[]) {
      const profile: IAutoMovieHumanFacePeriocularTissueSection | undefined =
        requested[tissue];
      if (profile === undefined) continue;
      const offset: number = profile.inwardOffsetMm / 1000,
        thickness: number = profile.thicknessMm / 1000;
      const upper: boolean = tissue.startsWith("upper");
      const columns: number[] = upper ? cage.upperColumns : cage.lowerColumns;
      if (
        ![offset, thickness].every(
          (value: number): boolean =>
            Number.isFinite(value) &&
            value > 0 &&
            Number.isFinite(Math.fround(value)),
        ) ||
        columns.length < 4
      )
        throw new Error(
          "Periocular tissue needs positive finite millimetres and its lid columns: " +
            side +
            ":" +
            tissue,
        );
      const outer: number[] = [],
        inner: number[] = [];
      const push: (target: number[], p: IAutoMovieVector3) => void = (
        target: number[],
        p: IAutoMovieVector3,
      ): void => {
        target.push(p.x, p.y, p.z);
      };
      let stride: number, height: number;
      const collapsedColumns: Set<number> = new Set<number>();
      const hostSamples: IHumanFacePeriocularHostSample[] = [];
      let mappingBand: IHumanFacePeriocularBand | undefined;
      let stations: number = 0,
        shortStations: number = 0,
        minimumMarginMetres: number = Infinity;
      const room: (margin: number) => void = (margin: number): void => {
        stations++;
        if (margin < 0) shortStations++;
        minimumMarginMetres = Math.min(minimumMarginMetres, margin);
        progress?.(
          "periocular:" +
            side +
            ":" +
            tissue +
            ":" +
            cage.surface +
            ":projection:" +
            stations,
        );
      };
      if (tissue.endsWith("TarsalBody") || tissue.endsWith("Conjunctiva")) {
        mappingBand = bandsByLid.get(upper);
        if (mappingBand === undefined) {
          mappingBand = buildHumanFacePeriocularBand({
            cage,
            host,
            points,
            skinHost,
            surface,
            upper,
            side,
            tissue,
          });
          progress?.(
            "periocular:" + side + ":" + tissue + ":" + cage.surface + ":band",
          );
          bandsByLid.set(upper, mappingBand);
        }
        stride = mappingBand.stride;
        height = mappingBand.height;
        for (const column of mappingBand.collapsedColumns)
          collapsedColumns.add(column);
        hostSamples.push(...mappingBand.samples);
        if (mappingBand.chart === undefined)
          for (const frame of mappingBand.frames) {
            const skin: IAutoMovieVector3 = Vector3.create(...frame.point),
              normal: IAutoMovieVector3 = Vector3.create(...frame.normal);
            const outside: IAutoMovieVector3 = Vector3.subtract(
              skin,
              Vector3.scale(normal, offset),
            );
            const inside: IAutoMovieVector3 = Vector3.subtract(
              skin,
              Vector3.scale(normal, offset + thickness),
            );
            room(surface.project(inside).signedDistance - mappingBand.floor);
            push(outer, outside);
            push(inner, inside);
          }
      } else {
        const orbicularis: boolean = tissue.endsWith("Orbicularis");
        const first: number = station(orbicularis ? "pretarsal" : "hood"),
          last: number = station("outerAttachment");
        const rows: IAutoMovieHumanFacePeriocularStation[] =
          cage.stations.slice(first, last + 1);
        stride = columns.length;
        height = rows.length;
        for (let column: number = 0; column < columns.length; column++)
          if (
            rows.every(
              (row: IAutoMovieHumanFacePeriocularStation): boolean =>
                row.vertices[columns[column]] ===
                rows[0].vertices[columns[column]],
            )
          )
            collapsedColumns.add(column);
        const floor: number = tear;
        for (const row of rows)
          for (const column of columns) {
            const vertex: number = row.vertices[column];
            const skin: IAutoMovieVector3 = read(points, vertex);
            const normal: IAutoMovieVector3 = Vector3.normalize(
              read(directions, vertex),
            );
            if (Vector3.length(normal) === 0)
              throw new Error(
                "Periocular tissue attachment needs a finite nonzero live host normal.",
              );
            room(
              surface.project(
                Vector3.subtract(
                  skin,
                  Vector3.scale(normal, offset + thickness),
                ),
              ).signedDistance - floor,
            );
            push(outer, Vector3.subtract(skin, Vector3.scale(normal, offset)));
            push(
              inner,
              Vector3.subtract(skin, Vector3.scale(normal, offset + thickness)),
            );
          }
      }
      const actualBand: IHumanFacePeriocularBand | undefined = mappingBand;
      const sourceBandFailure: (error: unknown) => Error = (
        error: unknown,
      ): Error =>
        new Error(
          (error instanceof Error ? error.message : String(error)) +
            " source-band:" +
            JSON.stringify({
              side,
              tissue,
              stride,
              height,
              columns,
              sourceColumns: actualBand?.sourceColumns,
              nearBoundary: actualBand?.nearBoundary,
              nearSourceSamples: actualBand?.nearBoundary?.map(
                (vertex: number): number | undefined =>
                  host.sourcePartition?.samples[vertex],
              ),
              farBoundary: actualBand?.farBoundary,
              materialBoundary: actualBand?.boundary,
              collapsedColumns: [...collapsedColumns],
              arcs: upper
                ? cage.tarsalExtent?.upperArcMetres
                : cage.tarsalExtent?.lowerArcMetres,
              medialBed: upper
                ? cage.medialBed?.upperColumns
                : cage.medialBed?.lowerColumns,
              inwardOffsetMm: profile.inwardOffsetMm,
              thicknessMm: profile.thicknessMm,
              hostSamples,
              conforming: actualBand?.conforming,
            }),
        );
      if (actualBand?.chart !== undefined) {
        try {
          actualBand.conforming ??= createHumanFaceConformingSheet({
            chart: actualBand.chart,
            samples: actualBand.samples,
            boundary: actualBand.boundary ?? [],
            refinement: actualBand.height - 1,
          });
        } catch (error) {
          throw sourceBandFailure(error);
        }
        actualBand.conformingFrames ??= actualBand.conforming.vertices.map(
          (vertex: IHumanFaceConformingSheetVertex): IHumanFaceSkinFrame =>
            skinHost.frame(vertex.seat),
        );
        outer.length = 0;
        inner.length = 0;
        stations = 0;
        shortStations = 0;
        minimumMarginMetres = Infinity;
        for (const frame of actualBand.conformingFrames) {
          const skin: IAutoMovieVector3 = Vector3.create(...frame.point),
            normal: IAutoMovieVector3 = Vector3.create(...frame.normal);
          const outside: IAutoMovieVector3 = Vector3.subtract(
            skin,
            Vector3.scale(normal, offset),
          );
          const inside: IAutoMovieVector3 = Vector3.subtract(
            skin,
            Vector3.scale(normal, offset + thickness),
          );
          room(surface.project(inside).signedDistance - actualBand.floor);
          push(outer, outside);
          push(inner, inside);
        }
      }
      const mesh: IAutoMovieMesh =
        actualBand?.conforming === undefined
          ? createHumanFacePeriocularShellMesh({
              outer,
              inner,
              stride,
              height,
              collapsedColumns,
            })
          : createHumanFacePeriocularIndexedShell({
              outer,
              inner,
              indices: actualBand.conforming.indices,
              boundary: actualBand.conforming.boundaryEdges,
            });
      let publication: IHumanLocalMeshFrame;
      try {
        publication = createHumanLocalMeshFrame(
          mesh,
          "periocular:" + side + ":" + tissue,
        );
      } catch (error) {
        throw sourceBandFailure(error);
      }
      const sampledBand: IHumanFacePeriocularBand | undefined = mappingBand;
      let mappingReading: IHumanFacePeriocularMappingReading | undefined;
      parts.push({
        side,
        tissue,
        generation: cage.generation,
        sourceId: cage.sourceId,
        mesh,
        publication,
        fit: { stations, shortStations, minimumMarginMetres },
        ...(sampledBand === undefined
          ? {}
          : {
              readMapping: (): IHumanFacePeriocularMappingReading => {
                if (mappingReading === undefined) {
                  mappingReading = readHumanFacePeriocularMapping({
                    stride,
                    height,
                    collapsedColumns,
                    indices: sampledBand.conforming?.indices,
                    frames: sampledBand.conformingFrames,
                    seats: sampledBand.conforming?.vertices.map(
                      (
                        vertex: IHumanFaceConformingSheetVertex,
                      ): IHumanFaceSkinSeat => vertex.seat,
                    ),
                    outerDistanceMetres: offset,
                    innerDistanceMetres: offset + thickness,
                    skin: (
                      sampledBand.conformingFrames ?? sampledBand.frames
                    ).flatMap(
                      (frame: IHumanFaceSkinFrame): number[] => frame.point,
                    ),
                    outer,
                    inner,
                    publicationOrigin: publication.origin,
                    material:
                      sampledBand.conforming !== undefined
                        ? sampledBand.conforming.vertices.flatMap(
                            (
                              vertex: IHumanFaceConformingSheetVertex,
                            ): [number, number] => vertex.materialPoint,
                          )
                        : sampledBand.samples.every(
                              (
                                sample: IHumanFacePeriocularHostSample,
                              ): boolean => sample.materialPoint !== undefined,
                            )
                          ? sampledBand.samples.flatMap(
                              (
                                sample: IHumanFacePeriocularHostSample,
                              ): [number, number] => sample.materialPoint!,
                            )
                          : undefined,
                    sourceTriangles:
                      sampledBand.conforming?.sourceTriangles ??
                      sampledBand.samples.map(
                        (sample: IHumanFacePeriocularHostSample): number =>
                          sample.seat.triangle,
                      ),
                    sourceReading: sampledBand.sourceReading,
                  });
                  sampledBand.sourceReading ??= mappingReading;
                }
                return mappingReading;
              },
            }),
      });
      progress?.(
        "periocular:" + side + ":" + tissue + ":" + cage.surface + ":tissue",
      );
    }
  }
  return parts;
}
