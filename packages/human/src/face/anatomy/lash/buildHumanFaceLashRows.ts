import type { IAutoMovieHumanFaceRigidMotion as ImportedIAutoMovieHumanFaceRigidMotion, IAutoMovieHumanFaceUpperLashPair as ImportedIAutoMovieHumanFaceUpperLashPair, IAutoMovieHumanFaceLowerLashPair as ImportedIAutoMovieHumanFaceLowerLashPair, IAutoMovieHumanFacePeriocularSide as ImportedIAutoMovieHumanFacePeriocularSide, IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface, IAutoMovieHumanFaceBasisRegion as ImportedIAutoMovieHumanFaceBasisRegion } from "@automovie/human";
import type { IAutoMovieHumanFaceUpperLashPopulation as ImportedIAutoMovieHumanFaceUpperLashPopulation } from "./IAutoMovieHumanFaceUpperLashPopulation";
import type { IAutoMovieHumanFaceLowerLashPopulation as ImportedIAutoMovieHumanFaceLowerLashPopulation } from "./IAutoMovieHumanFaceLowerLashPopulation";
import type { IAutoMovieHumanFacePeriocularStation as ImportedIAutoMovieHumanFacePeriocularStation } from "../../structures/IAutoMovieHumanFacePeriocularStation";
import type { IAutoMovieHumanFaceAttachmentChart as ImportedIAutoMovieHumanFaceAttachmentChart } from "../../structures/IAutoMovieHumanFaceAttachmentChart";
import type { IHumanFaceSkinChart as ImportedIHumanFaceSkinChart } from "../skin/IHumanFaceSkinChart";
import type { IHumanFaceSkinChartCourse as ImportedIHumanFaceSkinChartCourse } from "../skin/IHumanFaceSkinChartCourse";
import type { IHumanFaceSkinChartCoordinate as ImportedIHumanFaceSkinChartCoordinate } from "../skin/IHumanFaceSkinChartCoordinate";
import type { IHumanFaceSkinChartMetricSpan as ImportedIHumanFaceSkinChartMetricSpan } from "../skin/IHumanFaceSkinChartMetricSpan";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 as ImportedIAutoMovieVector3, IAutoMovieMeshPhysicalSource as ImportedIAutoMovieMeshPhysicalSource } from "@automovie/interface";

import { humanPhysicalSourceDomain } from "../../../common/basis/humanPhysicalSourceDomain";
import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { assertHumanFacePeriocularCage } from "../../basis/assertHumanFacePeriocularCage";
import { evaluateHumanFaceRest } from "../../basis/evaluateHumanFaceRest";
import type { humanFaceBasisWeights } from "../../basis/humanFaceBasisWeights";
import { resolveHumanFaceArticulation } from "../../basis/resolveHumanFaceArticulation";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceLashes } from "../../structures/IAutoMovieHumanFaceLashes";
import { readHumanFacePeriocularStationBoundary } from "../eye/readHumanFacePeriocularStationBoundary";
import type { IHumanFaceOpticalAssembly } from "../eye/structures/IHumanFaceOpticalAssembly";
import { createHumanFaceSkinChart } from "../skin/createHumanFaceSkinChart";
import { createHumanFaceSkinChartCourse } from "../skin/createHumanFaceSkinChartCourse";
import { createHumanFaceSkinHost } from "../skin/createHumanFaceSkinHost";
import { assertHumanFaceLashPopulation } from "./assertHumanFaceLashPopulation";
import { buildPortraitEyelash } from "./buildPortraitEyelash";
import type { IHumanFaceLashRow } from "./structures/IHumanFaceLashRow";

/**
 * Attach each requested shaft population to the final anterior lid edge.
 *
 * Roots sample equal arc-length stations on the producer's registered skin row, excluding its endpoints. With a source material disk, each consecutive pair of registered anterior anchors follows the published native boundary, retaining every knot before arc length is measured. An anchor pair need not be one resident edge; neither its spatial nor its material chord replaces that source course. The ordered boundary is an authored convention, not measured follicle trajectories. Legacy sources without either registration retain the original polygonal row and its ordinary contact refusals. The local anterior direction runs from the actual generated globe centre to the root; without independent optics the existing source joint pivot plus its translation is the stated proxy. The projected medial-to-lateral row tangent fixes roll, with anatomical side supplying its sign. The frame follows the final skin and eye owner directly; no second blink angle or gaze transform is added.
 *
 * The globe-to-root frame follows the geometric construction in Kerbiriou, Avril and Marchal 2024, Computer Graphics Forum 43(2):e15040, section 4.1. Their captured and fitted population is not reused: uniform stations and the existing centre-heavy length convention remain authored approximations. Each shaft uses the existing 8-column, 12-row arc tube, converted from millimetres into the live metre frame once. Its duplicated angular seam shares explicit physical IDs and identical coordinates. Both tube ends are open; no hidden follicle volume is inferred from the skin row.
 *
 * @evidence contracts/common.md#principled-implementation Registered anterior native courses place equal-arc stations and live globe-to-root frames transport fixed-lattice shafts.
 * @evidence contracts/common.md#clear-and-simple-design Root identity, generated physical seam ids and source region replacement remain separate from pigmentation finishing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uniform station and centre-heavy length policies are conventions; absent registration, degenerate frames or unsupported native courses refuse without claiming measured follicles.
 * @evidence contracts/common.md#meaningful-documentation Shaft millimetres convert once to current head metres, both ends are open and zero population returns a null-mesh row.
 * @evidence contracts/performance.md#efficient-algorithms Course preparation follows source knots; each requested shaft locates a segment and emits fixed 117 shading vertices plus normals.
 * @evidence contracts/performance.md#reuse-equivalent-work Each row shares its material chart/course and source eye motion; seam normals use one physical topology rather than independent duplicated-vertex sums.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned row meshes and centreline arrays own output while basis/current buffers and optics remain borrowed for this evaluation.
 */
export function buildHumanFaceLashRows(
  basis: IAutoMovieHumanFaceBasis,
  state: ReturnType<typeof humanFaceBasisWeights>,
  positions: ReadonlyMap<string, readonly number[]>,
  input: IAutoMovieHumanFaceLashes,
  instance: string,
  optics?: readonly IHumanFaceOpticalAssembly[],
): IHumanFaceLashRow[] {
  if (basis.periocular === undefined || basis.articulation === undefined)
    throw new Error(
      "Attached lashes need registered periocular roots and their source eye owner.",
    );
  const rest: { surfaces: number[][]; landmarks: Record<string, ImportedIAutoMovieVector3>; } = evaluateHumanFaceRest(basis, state);
  const motions: Map<string, ImportedIAutoMovieHumanFaceRigidMotion> = resolveHumanFaceArticulation(
    basis.articulation,
    state.weights,
    rest.landmarks,
  ).motions;
  const result: IHumanFaceLashRow[] = [];
  for (const row of ["upper", "lower"] as const) {
    const pair: ImportedIAutoMovieHumanFaceUpperLashPair | ImportedIAutoMovieHumanFaceLowerLashPair | undefined = input[row];
    if (pair === undefined) continue;
    for (const side of ["left", "right"] as const) {
      const profile: ImportedIAutoMovieHumanFaceUpperLashPopulation | ImportedIAutoMovieHumanFaceLowerLashPopulation = pair[side];
      assertHumanFaceLashPopulation(profile, row);
      const registration: ImportedIAutoMovieHumanFacePeriocularSide = basis.periocular[side];
      const surface: ImportedIAutoMovieHumanFaceBasisSurface | undefined = basis.surfaces.find(
        (s: ImportedIAutoMovieHumanFaceBasisSurface): boolean => s.id === registration.lashes.surface,
      );
      const regionId: string =
        row === "upper"
          ? registration.lashes.upperRegion
          : registration.lashes.lowerRegion;
      const region: ImportedIAutoMovieHumanFaceBasisRegion | undefined = surface?.regions.find((r: ImportedIAutoMovieHumanFaceBasisRegion): boolean => r.id === regionId);
      if (region === undefined)
        throw new Error(
          `Attached ${side} ${row} lashes name an absent registered source region.`,
        );
      const output: IHumanFaceLashRow = {
        side,
        row,
        region: region.id,
        material: region.material,
        generation: basis.periocular.generation,
        mesh: null,
        centrelines: [],
      };
      result.push(output);
      if (profile.strandCount === 0) continue;
      const roots: number[] | undefined = registration.margins.lashRoots?.[row];
      const skin: readonly number[] | undefined = positions.get(registration.margins.surface);
      if (
        roots === undefined ||
        roots.length < 2 ||
        skin === undefined ||
        roots.some(
          (v: number): boolean => !Number.isSafeInteger(v) || v < 0 || 3 * v + 2 >= skin.length,
        )
      )
        throw new Error(
          `Attached ${side} ${row} lashes need valid anterior root rows, separate from posterior contact margins.`,
        );
      const points: ImportedIAutoMovieVector3[] = roots.map((v: number): ImportedIAutoMovieVector3 =>
        Vector3.create(skin[3 * v], skin[3 * v + 1], skin[3 * v + 2]),
      );
      const lengths: number[] = points
        .slice(1)
        .map((p: ImportedIAutoMovieVector3, at: number): number => Vector3.length(Vector3.subtract(p, points[at])));
      const eligibility: number[] | undefined = registration.cage?.ciliatedColumns;
      if (eligibility !== undefined) {
        assertHumanFacePeriocularCage(basis, registration.cage!);
        if (registration.cage!.ciliatedQualification === undefined)
          throw new Error(
            `Attached ${side} ${row} lash eligibility needs its own source qualification.`,
          );
      }
      const anterior: ImportedIAutoMovieHumanFacePeriocularStation | undefined = registration.cage?.stations.find(
        (station: ImportedIAutoMovieHumanFacePeriocularStation): boolean => station.role === "anteriorMargin",
      );
      const eligibleVertices: Set<number> | undefined =
        eligibility === undefined
          ? undefined
          : new Set(
              eligibility.map((column: number): number => {
                if (
                  anterior === undefined ||
                  registration.cage?.surface !== registration.margins.surface ||
                  !Number.isSafeInteger(column) ||
                  column < 0 ||
                  column >= anterior.vertices.length ||
                  registration.cage.ciliatedQualification === undefined
                )
                  throw new Error(
                    `Attached ${side} ${row} lash eligibility needs its qualified actual anterior source row.`,
                  );
                return anterior.vertices[column];
              }),
            );
      if (eligibleVertices !== undefined)
        lengths.forEach((_: number, segment: number): void => {
          if (
            !eligibleVertices.has(roots[segment]) ||
            !eligibleVertices.has(roots[segment + 1])
          )
            lengths[segment] = 0;
        });
      const sourceChart: ImportedIAutoMovieHumanFaceAttachmentChart | undefined = registration.cage?.attachmentCharts?.[row];
      if (anterior?.boundary !== undefined && sourceChart === undefined)
        throw new Error(`Attached ${side} ${row} native boundary needs its registered material disk.`);
      const host: ImportedIAutoMovieHumanFaceBasisSurface | undefined = basis.surfaces.find(
        (candidate: ImportedIAutoMovieHumanFaceBasisSurface): boolean => candidate.id === registration.margins.surface,
      );
      const nativeSegments: number[][] | undefined = sourceChart === undefined || anterior === undefined || host === undefined
        ? undefined
        : readHumanFacePeriocularStationBoundary(anterior, host, roots);
      if (sourceChart !== undefined && nativeSegments === undefined)
        throw new Error(`Attached ${side} ${row} lashes need the published anterior native boundary for their material disk.`);
      const chart: ImportedIHumanFaceSkinChart | undefined = sourceChart === undefined
        ? undefined
        : createHumanFaceSkinChart({
            surface: host!,
            referencePositions: host!.positions,
            domain: `lashes:${side}:${row}`,
            registration: sourceChart,
            supportVertices: roots,
            host: createHumanFaceSkinHost(host!.indices, skin),
          });
      const courses: (ImportedIHumanFaceSkinChartCourse | undefined)[] = lengths.map((length: number, segment: number): ImportedIHumanFaceSkinChartCourse | undefined =>
        chart === undefined || length === 0
          ? undefined
          : createHumanFaceSkinChartCourse(chart.compile(
              nativeSegments![segment].map((vertex: number): ImportedIHumanFaceSkinChartCoordinate => chart.coordinate(vertex)),
            )),
      );
      courses.forEach((course: ImportedIHumanFaceSkinChartCourse | undefined, segment: number): void => {
        if (course !== undefined) lengths[segment] = course.totalLengthMetres;
      });
      const span: number = lengths.reduce((a: number, b: number): number => a + b, 0);
      if (eligibility !== undefined && span === 0)
        throw new Error(
          `Attached ${side} ${row} positive shaft population has no eligible anterior source segment.`,
        );
      if (
        !(span > 0) ||
        !Number.isFinite(span) ||
        points
          .slice(1)
          .some(
            (point: ImportedIAutoMovieVector3, at: number): boolean =>
              Vector3.length(Vector3.subtract(point, points[at])) === 0,
          )
      )
        throw new Error(
          `Attached ${side} ${row} lash roots have a collapsed or nonfinite arc.`,
        );
      const owner: string = registration.globe.owner;
      const motion: ImportedIAutoMovieHumanFaceRigidMotion | undefined = motions.get(owner);
      if (motion === undefined)
        throw new Error(
          "Attached lashes name an absent source eye motion: " + owner,
        );
      const center: ImportedIAutoMovieVector3 =
        optics?.find((eye: IHumanFaceOpticalAssembly): boolean => eye.side === side)?.center ??
        Vector3.add(motion.pivot, motion.translation);
      const mesh: IAutoMovieMesh = {
        positions: [],
        indices: [],
        normals: null,
        uvs: null,
        skin: null,
        physicalVertices: { sources: [], vertices: [] },
      };
      const domain: string =
        humanPhysicalSourceDomain(instance, output.generation) +
        ":generated-lashes:" +
        side +
        ":" +
        row;
      const signed: 1 | -1 = side === "left" ? 1 : -1;
      for (let strand: number = 0; strand < profile.strandCount; strand++) {
        const progress: number = (strand + 0.5) / profile.strandCount;
        let distance: number = span * progress,
          segment: number = 0;
        while (
          segment < lengths.length - 1 &&
          (lengths[segment] === 0 || distance > lengths[segment])
        ) {
          distance -= lengths[segment];
          segment++;
        }
        const course: ImportedIHumanFaceSkinChartCourse | undefined = courses[segment];
        const native: ImportedIHumanFaceSkinChartMetricSpan | undefined = course?.spans.find(
          (piece: ImportedIHumanFaceSkinChartMetricSpan): boolean => distance <= piece.precedingLengthMetres + piece.lengthMetres,
        );
        const delta: ImportedIAutoMovieVector3 = course === undefined
          ? Vector3.subtract(points[segment + 1], points[segment])
          : Vector3.create(...native!.end.map((value: number, axis: number): number => value - native!.start[axis]));
        const root: ImportedIAutoMovieVector3 = course === undefined
          ? Vector3.add(
              points[segment],
              Vector3.scale(delta, distance / lengths[segment]),
            )
          : Vector3.create(...course.frameAt(distance).point);
        const forward: ImportedIAutoMovieVector3 = Vector3.normalize(Vector3.subtract(root, center));
        const projected: ImportedIAutoMovieVector3 = Vector3.subtract(
          delta,
          Vector3.scale(forward, Vector3.dot(delta, forward)),
        );
        if (Vector3.length(forward) === 0 || Vector3.length(projected) === 0)
          throw new Error(
            `Attached ${side} ${row} lash frame is degenerate at station ${strand}.`,
          );
        const lateral: ImportedIAutoMovieVector3 = Vector3.scale(Vector3.normalize(projected), signed);
        const up: ImportedIAutoMovieVector3 = Vector3.normalize(Vector3.cross(forward, lateral));
        const free: IAutoMovieMesh = buildPortraitEyelash(
          Vector3.create(),
          profile,
          side,
          progress,
          strand,
        );
        const offset: number = mesh.positions.length / 3;
        for (let vertex: number = 0; vertex < free.positions.length / 3; vertex++) {
          const canonical: number = vertex % 9 === 8 ? vertex - 8 : vertex;
          const x: number = free.positions[3 * canonical] / 1000;
          const y: number =
            (free.positions[3 * canonical + 1] / 1000) *
            (row === "lower" ? -1 : 1);
          const z: number = free.positions[3 * canonical + 2] / 1000;
          const placed: ImportedIAutoMovieVector3 = Vector3.add(
            root,
            Vector3.add(
              Vector3.scale(lateral, x),
              Vector3.add(Vector3.scale(up, y), Vector3.scale(forward, z)),
            ),
          );
          mesh.positions.push(placed.x, placed.y, placed.z);
          mesh.physicalVertices!.sources.push({
            domain,
            id: strand * 104 + Math.floor(vertex / 9) * 8 + ((vertex % 9) % 8),
          });
          mesh.physicalVertices!.vertices.push(offset + vertex);
        }
        for (let triangle: number = 0; triangle < free.indices!.length; triangle += 3) {
          const corners: number[] = free.indices!.slice(triangle, triangle + 3);
          if (row === "lower")
            [corners[1], corners[2]] = [corners[2], corners[1]];
          mesh.indices!.push(...corners.map((vertex: number): number => offset + vertex));
        }
        const line: number[] = [];
        for (let sample: number = 0; sample < 13; sample++) {
          const values: number[] = [0, 0, 0];
          for (let radial: number = 0; radial < 8; radial++)
            for (let axis: number = 0; axis < 3; axis++)
              values[axis] +=
                mesh.positions[3 * (offset + sample * 9 + radial) + axis] / 8;
          line.push(...values);
        }
        output.centrelines.push(line);
      }
      const physicalPositions: number[] = [];
      for (let vertex: number = 0; vertex < mesh.positions.length / 3; vertex++)
        if ((vertex % 117) % 9 < 8)
          physicalPositions.push(
            ...mesh.positions.slice(3 * vertex, 3 * vertex + 3),
          );
      const physicalIndices: number[] = mesh.indices!.map(
        (vertex: number): number => mesh.physicalVertices!.sources[vertex].id,
      );
      const commonNormals: number[] = areaWeightedNormals(
        physicalPositions,
        physicalIndices,
      );
      mesh.normals = mesh.physicalVertices!.sources.flatMap((source: ImportedIAutoMovieMeshPhysicalSource): number[] =>
        commonNormals.slice(3 * source.id, 3 * source.id + 3),
      );
      output.mesh = mesh;
    }
  }
  return result;
}
