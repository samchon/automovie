import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { float32MeshBuffers } from "../../../common/mesh/float32MeshBuffers";
import { assertHumanFacePeriocularCage } from "../../basis/assertHumanFacePeriocularCage";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../../structures/IAutoMovieHumanFaceBasisDocument";
import { HUMAN_FACE_LID_SEAT } from "./HUMAN_FACE_LID_SEAT";
import { buildHumanFaceMedialBedSurface } from "./buildHumanFaceMedialBedSurface";
import type { IHumanFaceOpticalAssembly } from "./structures/IHumanFaceOpticalAssembly";

/**
 * Construct medial caruncle/plica relief and both wet-margin surfaces from
 * their registered skin and ocular owners.
 *
 * Wet margins and the unregistered medial convention use heights on the
 * analytic ocular exterior. A registered medial bed instead supplies its
 * actual native pocket triangles and plica path to the skin-host relief owner.
 * Neither representation establishes appearance or tissue mechanics; emitted
 * sheets undergo ordinary ocular-space admission.
 *
 * The two lid margins follow the registered native posterior boundary, read
 * as ordered edge chains from the medial join through their cage anchors.
 * The boundary's starting index and winding need not match the cage column
 * order; the complete anchor sequence selects its direction for each lid.
 * A legacy cage without that registration retains its original coarse row
 * and ordinary optical contact refusals. A wet margin starts on its own
 * margin vertex-for-height: at its first row each point is the margin point
 * itself. It runs towards the corresponding point of the opposite margin by
 * the requested width, never more than half the local aperture and fading to
 * nothing at both canthi, and descends from the margin's height to the tear
 * film with a sinusoidal lift. Upper and lower margins use the same
 * construction with the roles of the two chains exchanged.
 *
 * Without a registered bed the medial sheet spans the corner length of both chains from the
 * medial join. Along each lid margin it coincides with the margin; between
 * them it sags from the height of the straight span to the tear film, raised
 * by the caruncle and plica envelopes. The envelope positions (0.42 and 0.82
 * of the corner length) and their widths are this procedural shape's
 * convention, not population statistics.
 * In this unregistered branch an additional authored 20-micrometre baseline
 * relief multiplies sin²(pi*u)*sin²(pi*v), alongside the requested Gaussian
 * projections. It has no registered primary anatomical measurement and adds
 * no physiological clearance claim. The registered-bed branch does not use it.
 *
 * The pointwise floor of each sheet is the authored tear film. This does
 * not assert clearance of the intervening faces: ordinary actual-hull
 * admission reads them without converting numerical deviation into a lift.
 * Coincident lattice points are welded and zero-area triangles are not
 * emitted, so the collapse of a strip at a canthus leaves no degenerate face.
 * The source host display finish is a convention; no tear-fluid material or
 * physiological secretion is inferred. Admission reads the constructed
 * sheets separately (`readHumanFaceOcularSurfaceSpace`).
 */
export function buildHumanFaceOcularSurfaces(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  document: IAutoMovieHumanFaceBasisDocument,
  optics: readonly IHumanFaceOpticalAssembly[] | undefined,
  materials: readonly IAutoMovieMaterial[],
  state: "rest" | "performed" = "performed",
): Pick<IAutoMovieModel, "parts" | "materials"> {
  const result: Pick<IAutoMovieModel, "parts" | "materials"> = {
    parts: [],
    materials: [],
  };
  const tear = HUMAN_FACE_LID_SEAT.tearFilmMetres;
  for (const side of ["left", "right"] as const) {
    const profile = document.ocularSurfaces?.[side];
    if (profile === undefined) continue;
    const cage = basis.periocular?.[side].cage;
    const surface = optics?.find((eye) => eye.side === side)?.exterior[
      state === "rest" ? "rest" : "posed"
    ];
    if (cage === undefined || surface === undefined)
      throw new Error(
        "Ocular visible surfaces need the source lid cage and generated ocular exterior of their eye: " +
          side,
      );
    assertHumanFacePeriocularCage(basis, cage);
    const values = positions.get(cage.surface);
    const margin = cage.stations.find(
      (station) => station.role === "posteriorMargin",
    );
    const dimensions = [
      profile.cornerLength,
      profile.caruncleProjection,
      profile.plicaProjection,
      profile.lowerMarginWidth,
      profile.lowerMarginLift,
      profile.upperMarginWidth ?? 0,
      profile.upperMarginLift ?? 0,
    ];
    if (
      values === undefined ||
      margin === undefined ||
      dimensions.some((value) => !Number.isFinite(value) || value < 0) ||
      (profile.upperMarginWidth === undefined) !==
        (profile.upperMarginLift === undefined)
    )
      throw new Error(
        "Ocular visible surfaces need their seated margin row and finite nonnegative dimensions, with upper width and lift supplied together: " +
          side,
      );
    const chain = (columns: readonly number[]) => {
      const anchors = columns.map((column) => margin.vertices[column]);
      const boundary = cage.displacementPatch?.posteriorBoundary;
      let vertices = anchors;
      if (boundary !== undefined) {
        const start = boundary.indexOf(anchors[0]);
        const end = anchors[anchors.length - 1];
        const stations = new Set(margin.vertices);
        const paths = [1, -1].map((direction) => {
          const path: number[] = [];
          for (let at = 0; at < boundary.length; at++) {
            const vertex = boundary[
              (start + direction * at + boundary.length) % boundary.length
            ];
            path.push(vertex);
            if (vertex === end) break;
          }
          return path;
        }).filter((path) => {
          const ordered = path.filter((vertex) => stations.has(vertex));
          return start >= 0 && ordered.length === anchors.length &&
            ordered.every((vertex, at) => vertex === anchors[at]);
        });
        if (paths.length !== 1)
          throw new Error(
            "Ocular margin needs one actual native posterior path through its ordered cage anchors: " + side,
          );
        vertices = paths[0];
      }
      const points = vertices.map((vertex) => {
        const at = 3 * vertex;
        return Vector3.create(values[at], values[at + 1], values[at + 2]);
      });
      const arc = [0];
      for (let at = 1; at < points.length; at++)
        arc.push(
          arc[at - 1] +
            Vector3.length(Vector3.subtract(points[at], points[at - 1])),
        );
      const length = arc[arc.length - 1];
      // Point at an arc distance from the medial join.
      const at = (distance: number): IAutoMovieVector3 => {
        const target = Math.min(length, Math.max(0, distance));
        if (target === 0) return points[0];
        if (target === length) return points[points.length - 1];
        let segment = 1;
        while (segment < arc.length - 1 && arc[segment] < target) segment++;
        if (target === arc[segment]) return points[segment];
        const span = arc[segment] - arc[segment - 1];
        const t = span === 0 ? 0 : (target - arc[segment - 1]) / span;
        return Vector3.add(
          points[segment - 1],
          Vector3.scale(
            Vector3.subtract(points[segment], points[segment - 1]),
            t,
          ),
        );
      };
      return { length, at };
    };
    const upper = chain(cage.upperColumns),
      lower = chain(cage.lowerColumns);
    const corner = profile.cornerLength / 1000;
    if (corner > Math.min(upper.length, lower.length))
      throw new Error(
        "Ocular medial sheet needs a corner length within both lid margins: " +
          side,
      );
    const lattice = (
      columns: number,
      rows: number,
      place: (u: number, v: number) => IAutoMovieVector3,
    ): IAutoMovieMesh | null => {
      const ids = new Map<string, number>();
      const coordinates: number[] = [];
      const grid: number[] = [];
      for (let row = 0; row <= rows; row++)
        for (let column = 0; column <= columns; column++) {
          const p = place(column / columns, row / rows);
          const key = p.x + "," + p.y + "," + p.z;
          let id = ids.get(key);
          if (id === undefined) {
            id = coordinates.length / 3;
            ids.set(key, id);
            coordinates.push(p.x, p.y, p.z);
          }
          grid.push(id);
        }
      const corner3 = (id: number): IAutoMovieVector3 =>
        Vector3.create(
          coordinates[3 * id],
          coordinates[3 * id + 1],
          coordinates[3 * id + 2],
        );
      const indices: number[] = [];
      let facing = 0;
      const triangle = (a: number, b: number, c: number): void => {
        const normal = Vector3.cross(
          Vector3.subtract(corner3(b), corner3(a)),
          Vector3.subtract(corner3(c), corner3(a)),
        );
        if (a === b || b === c || c === a || Vector3.length(normal) === 0)
          return;
        facing += Vector3.dot(normal, surface.project(corner3(a)).normal);
        indices.push(a, b, c);
      };
      const stride = columns + 1;
      for (let row = 0; row < rows; row++)
        for (let column = 0; column < columns; column++) {
          const a = grid[row * stride + column],
            b = grid[row * stride + column + 1],
            d = grid[(row + 1) * stride + column],
            c = grid[(row + 1) * stride + column + 1];
          triangle(a, b, c);
          triangle(a, c, d);
        }
      if (indices.length === 0) return null;
      // The sheet faces away from the globe.
      if (facing < 0)
        for (let at = 0; at < indices.length; at += 3)
          [indices[at + 1], indices[at + 2]] = [
            indices[at + 2],
            indices[at + 1],
          ];
      return {
        positions: coordinates,
        indices,
        normals: areaWeightedNormals(coordinates, indices),
        uvs: null,
        skin: null,
      };
    };
    const raised = (base: IAutoMovieVector3, height: number) => {
      const hit = surface.project(base);
      return Vector3.add(hit.point, Vector3.scale(hit.normal, height));
    };
    const wet = (
      own: ReturnType<typeof chain>,
      other: ReturnType<typeof chain>,
      width: number,
      lift: number,
    ): IAutoMovieMesh | null =>
      width === 0
        ? null
        : lattice(80, 4, (u, v) => {
            const start = own.at(own.length * u);
            const across = Vector3.subtract(other.at(other.length * u), start);
            const gap = Vector3.length(across);
            const fade = Math.sin(Math.PI * u);
            const reach = Math.min(width * fade, gap / 2);
            if (v === 0 || gap === 0 || reach === 0) return start;
            const base = Vector3.add(
              start,
              Vector3.scale(across, (reach * v) / gap),
            );
            return raised(
              base,
              surface.project(start).signedDistance * (1 - v) +
                tear * v +
                lift * fade * Math.sin(Math.PI * v),
            );
          });
    const medial =
      corner === 0
        ? null
        : cage.medialBed !== undefined
          ? buildHumanFaceMedialBedSurface(basis, cage, values, profile)
          : lattice(32, 12, (u, v) => {
              const low = lower.at(corner * u),
                high = upper.at(corner * u);
              const base = Vector3.add(
                low,
                Vector3.scale(Vector3.subtract(high, low), v),
              );
              const across = Math.sin(Math.PI * v) ** 2;
              if (across === 0) return base;
              const along = Math.sin(Math.PI * u) ** 2;
              const caruncle = Math.exp(-(((u - 0.42) / 0.26) ** 2));
              const plica = Math.exp(-(((u - 0.82) / 0.08) ** 2));
              const span = surface.project(base).signedDistance;
              const floor = tear;
              return raised(
                base,
                span +
                  (floor - span) * across +
                  across *
                    along *
                    (0.00002 +
                      (profile.caruncleProjection * caruncle +
                        profile.plicaProjection * plica) /
                        1000),
              );
            });
    const entries: [string, IAutoMovieMesh | null][] = [
      ["caruncle-plica", medial],
      [
        "lower-wet-margin",
        wet(
          lower,
          upper,
          profile.lowerMarginWidth / 1000,
          profile.lowerMarginLift / 1000,
        ),
      ],
    ];
    if (profile.upperMarginWidth !== undefined)
      entries.push([
        "upper-wet-margin",
        wet(
          upper,
          lower,
          profile.upperMarginWidth / 1000,
          (profile.upperMarginLift ?? 0) / 1000,
        ),
      ]);
    const finish = materials.find((material) => material.id === cage.material);
    if (finish === undefined)
      throw new Error(
        "Ocular visible surfaces need their registered source display finish.",
      );
    for (const [role, mesh] of entries)
      if (mesh !== null) {
        const id = "ocular:" + side + ":" + role;
        float32MeshBuffers(mesh, id);
        result.parts.push({
          id,
          name: id,
          material: id,
          attachedBone: null,
          transform: null,
          geometry: { type: "mesh", mesh },
        });
        result.materials.push({
          id,
          name: id,
          baseColor: { ...finish.baseColor, a: 1 },
          roughness: finish.roughness,
          metallic: 0,
          opacity: 1,
          emissive: null,
          baseColorTexture: null,
          doubleSided: false,
          alphaMode: "opaque",
        });
      }
  }
  return result;
}
