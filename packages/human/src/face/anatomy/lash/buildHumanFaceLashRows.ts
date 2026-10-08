import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

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
 * Roots sample equal arc-length stations on the producer's registered skin
 * row, excluding its endpoints. With a source material disk, each consecutive
 * pair of registered anterior anchors follows the published native boundary,
 * retaining every knot before arc length is measured. An anchor pair need not
 * be one resident edge; neither its spatial nor its material chord replaces
 * that source course. The ordered boundary is an authored convention, not measured
 * follicle trajectories. Legacy sources without either registration retain the original
 * polygonal row and its ordinary contact refusals.
 * The local anterior direction runs from the
 * actual generated globe centre to the root; without independent optics the
 * existing source joint pivot plus its translation is the stated proxy. The
 * projected medial-to-lateral row tangent fixes roll, with anatomical side
 * supplying its sign. The frame follows the final skin and eye owner directly;
 * no second blink angle or gaze transform is added.
 *
 * The globe-to-root frame follows the geometric construction in Kerbiriou,
 * Avril and Marchal 2024, Computer Graphics Forum 43(2):e15040, section 4.1.
 * Their captured and fitted population is not reused: uniform stations and
 * the existing centre-heavy length convention remain authored approximations.
 * Each shaft uses the existing 8-column, 12-row arc tube, converted from
 * millimetres into the live metre frame once. Its duplicated angular seam
 * shares explicit physical IDs and identical coordinates. Both tube ends are
 * open; no hidden follicle volume is inferred from the skin row.
 *
 * @evidence contracts/common.md#principled-implementation Arc-length stations and a radial-priority orthonormal root frame consume the exact final skin; the common constant-curvature shaft owner preserves length and radius during frame transport.
 * @evidence contracts/common.md#clear-and-simple-design One attached row producer delegates free-shaft geometry and profile admission to existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No card vertex is called a follicle and no missing count, root or frame receives a guessed default.
 * @evidence contracts/common.md#meaningful-documentation States source registration, proxy limit, actual root frame, sampling and open-end meaning.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each side and lid row is one group of its requested free shafts, with the source card region explicitly retained for replacement.
 * @evidence contracts/modeling.md#emitted-geometry Each shaft contributes 117 shading vertices, 104 distinct physical points and 192 triangles; count follows the explicit population, including zero, rather than source-card density.
 * @evidence contracts/modeling.md#shared-boundaries Registered anterior anchors lift through their existing source material disk onto current native facets, and root centres and tangents read those same retained intervals. Legacy polygonal rows retain downstream skin contact admission.
 * @evidence contracts/modeling.md#spatial-conventions Millimetre shaft offsets map once into a right-handed live head metre frame; lower positive elevation and curl are reflected towards local inferior.
 * @evidence contracts/anatomy.md#anatomical-source Root-frame construction follows the read 2024 primary article; CC0 source roots are ordered anterior anchors whose material course is an authored correspondence, not clinical follicle coordinates. Count, uniform spacing and centre-heavy length remain authored conventions.
 * @evidenceExclude contracts/anatomy.md#permitted-range Combined shaft and tissue feasibility is admitted by the connected lash contact owner.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The population and profile records own inputs; this generator adds no personal root curve or strand parameter.
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
  const rest = evaluateHumanFaceRest(basis, state);
  const motions = resolveHumanFaceArticulation(
    basis.articulation,
    state.weights,
    rest.landmarks,
  ).motions;
  const result: IHumanFaceLashRow[] = [];
  for (const row of ["upper", "lower"] as const) {
    const pair = input[row];
    if (pair === undefined) continue;
    for (const side of ["left", "right"] as const) {
      const profile = pair[side];
      assertHumanFaceLashPopulation(profile, row);
      const registration = basis.periocular[side];
      const surface = basis.surfaces.find(
        (s) => s.id === registration.lashes.surface,
      );
      const regionId =
        row === "upper"
          ? registration.lashes.upperRegion
          : registration.lashes.lowerRegion;
      const region = surface?.regions.find((r) => r.id === regionId);
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
      const roots = registration.margins.lashRoots?.[row];
      const skin = positions.get(registration.margins.surface);
      if (
        roots === undefined ||
        roots.length < 2 ||
        skin === undefined ||
        roots.some(
          (v) => !Number.isSafeInteger(v) || v < 0 || 3 * v + 2 >= skin.length,
        )
      )
        throw new Error(
          `Attached ${side} ${row} lashes need valid anterior root rows, separate from posterior contact margins.`,
        );
      const points = roots.map((v) =>
        Vector3.create(skin[3 * v], skin[3 * v + 1], skin[3 * v + 2]),
      );
      const lengths = points
        .slice(1)
        .map((p, at) => Vector3.length(Vector3.subtract(p, points[at])));
      const eligibility = registration.cage?.ciliatedColumns;
      if (eligibility !== undefined) {
        assertHumanFacePeriocularCage(basis, registration.cage!);
        if (registration.cage!.ciliatedQualification === undefined)
          throw new Error(
            `Attached ${side} ${row} lash eligibility needs its own source qualification.`,
          );
      }
      const anterior = registration.cage?.stations.find(
        (station) => station.role === "anteriorMargin",
      );
      const eligibleVertices =
        eligibility === undefined
          ? undefined
          : new Set(
              eligibility.map((column) => {
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
        lengths.forEach((_, segment) => {
          if (
            !eligibleVertices.has(roots[segment]) ||
            !eligibleVertices.has(roots[segment + 1])
          )
            lengths[segment] = 0;
        });
      const sourceChart = registration.cage?.attachmentCharts?.[row];
      if (anterior?.boundary !== undefined && sourceChart === undefined)
        throw new Error(`Attached ${side} ${row} native boundary needs its registered material disk.`);
      const host = basis.surfaces.find(
        (candidate) => candidate.id === registration.margins.surface,
      );
      const nativeSegments = sourceChart === undefined || anterior === undefined || host === undefined
        ? undefined
        : readHumanFacePeriocularStationBoundary(anterior, host, roots);
      if (sourceChart !== undefined && nativeSegments === undefined)
        throw new Error(`Attached ${side} ${row} lashes need the published anterior native boundary for their material disk.`);
      const chart = sourceChart === undefined
        ? undefined
        : createHumanFaceSkinChart({
            surface: host!,
            referencePositions: host!.positions,
            domain: `lashes:${side}:${row}`,
            registration: sourceChart,
            supportVertices: roots,
            host: createHumanFaceSkinHost(host!.indices, skin),
          });
      const courses = lengths.map((length, segment) =>
        chart === undefined || length === 0
          ? undefined
          : createHumanFaceSkinChartCourse(chart.compile(
              nativeSegments![segment].map((vertex) => chart.coordinate(vertex)),
            )),
      );
      courses.forEach((course, segment) => {
        if (course !== undefined) lengths[segment] = course.totalLengthMetres;
      });
      const span = lengths.reduce((a, b) => a + b, 0);
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
            (point, at) =>
              Vector3.length(Vector3.subtract(point, points[at])) === 0,
          )
      )
        throw new Error(
          `Attached ${side} ${row} lash roots have a collapsed or nonfinite arc.`,
        );
      const owner = registration.globe.owner;
      const motion = motions.get(owner);
      if (motion === undefined)
        throw new Error(
          "Attached lashes name an absent source eye motion: " + owner,
        );
      const center =
        optics?.find((eye) => eye.side === side)?.center ??
        Vector3.add(motion.pivot, motion.translation);
      const mesh: IAutoMovieMesh = {
        positions: [],
        indices: [],
        normals: null,
        uvs: null,
        skin: null,
        physicalVertices: { sources: [], vertices: [] },
      };
      const domain =
        humanPhysicalSourceDomain(instance, output.generation) +
        ":generated-lashes:" +
        side +
        ":" +
        row;
      const signed = side === "left" ? 1 : -1;
      for (let strand = 0; strand < profile.strandCount; strand++) {
        const progress = (strand + 0.5) / profile.strandCount;
        let distance = span * progress,
          segment = 0;
        while (
          segment < lengths.length - 1 &&
          (lengths[segment] === 0 || distance > lengths[segment])
        ) {
          distance -= lengths[segment];
          segment++;
        }
        const course = courses[segment];
        const native = course?.spans.find(
          (piece) => distance <= piece.precedingLengthMetres + piece.lengthMetres,
        );
        const delta = course === undefined
          ? Vector3.subtract(points[segment + 1], points[segment])
          : Vector3.create(...native!.end.map((value, axis) => value - native!.start[axis]));
        const root = course === undefined
          ? Vector3.add(
              points[segment],
              Vector3.scale(delta, distance / lengths[segment]),
            )
          : Vector3.create(...course.frameAt(distance).point);
        const forward = Vector3.normalize(Vector3.subtract(root, center));
        const projected = Vector3.subtract(
          delta,
          Vector3.scale(forward, Vector3.dot(delta, forward)),
        );
        if (Vector3.length(forward) === 0 || Vector3.length(projected) === 0)
          throw new Error(
            `Attached ${side} ${row} lash frame is degenerate at station ${strand}.`,
          );
        const lateral = Vector3.scale(Vector3.normalize(projected), signed);
        const up = Vector3.normalize(Vector3.cross(forward, lateral));
        const free = buildPortraitEyelash(
          Vector3.create(),
          profile,
          side,
          progress,
          strand,
        );
        const offset = mesh.positions.length / 3;
        for (let vertex = 0; vertex < free.positions.length / 3; vertex++) {
          const canonical = vertex % 9 === 8 ? vertex - 8 : vertex;
          const x = free.positions[3 * canonical] / 1000;
          const y =
            (free.positions[3 * canonical + 1] / 1000) *
            (row === "lower" ? -1 : 1);
          const z = free.positions[3 * canonical + 2] / 1000;
          const placed = Vector3.add(
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
        for (let triangle = 0; triangle < free.indices!.length; triangle += 3) {
          const corners = free.indices!.slice(triangle, triangle + 3);
          if (row === "lower")
            [corners[1], corners[2]] = [corners[2], corners[1]];
          mesh.indices!.push(...corners.map((vertex) => offset + vertex));
        }
        const line: number[] = [];
        for (let sample = 0; sample < 13; sample++) {
          const values = [0, 0, 0];
          for (let radial = 0; radial < 8; radial++)
            for (let axis = 0; axis < 3; axis++)
              values[axis] +=
                mesh.positions[3 * (offset + sample * 9 + radial) + axis] / 8;
          line.push(...values);
        }
        output.centrelines.push(line);
      }
      const physicalPositions: number[] = [];
      for (let vertex = 0; vertex < mesh.positions.length / 3; vertex++)
        if ((vertex % 117) % 9 < 8)
          physicalPositions.push(
            ...mesh.positions.slice(3 * vertex, 3 * vertex + 3),
          );
      const physicalIndices = mesh.indices!.map(
        (vertex) => mesh.physicalVertices!.sources[vertex].id,
      );
      const commonNormals = areaWeightedNormals(
        physicalPositions,
        physicalIndices,
      );
      mesh.normals = mesh.physicalVertices!.sources.flatMap((source) =>
        commonNormals.slice(3 * source.id, 3 * source.id + 3),
      );
      output.mesh = mesh;
    }
  }
  return result;
}
