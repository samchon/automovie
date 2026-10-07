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
 * The two lid margins are the posterior margin row of the source cage, read
 * as ordered chains from the medial join. A wet margin starts on its own
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
 *
 * @evidence contracts/common.md#principled-implementation Requested pointwise heights use the shared cap-replaced exterior's nearest foot and normal. Inflection and normal-offset folds remain possible and are judged by actual emitted-sheet admission, not a convexity assumption.
 * @evidence contracts/common.md#clear-and-simple-design Wet margins and the legacy medial convention share the ocular owner; registered medial topology delegates to its skin-host patch owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing cage or exterior refuses; no head-axis projection, analytic stand-in or guessed vertex substitutes for the registered margins.
 * @evidence contracts/common.md#meaningful-documentation States the frame, each sheet's boundary and height rule, the procedural envelope convention and the display convention.
 * @evidence contracts/modeling.md#part-identity-and-grouping Emits a connected medial caruncle/plica sheet and independent upper and lower wet-margin parts per side.
 * @evidence contracts/modeling.md#shared-boundaries Wet sheets begin at the seated margin; registered medial relief preserves its native pocket boundary, while an absent registration uses the stated ruled-sheet convention.
 * @evidence contracts/modeling.md#spatial-conventions Document millimetres convert once to head-frame metres; heights are along the outward exterior normal.
 * @evidence contracts/modeling.md#emitted-geometry Lattices of 80 by 4 cells per wet margin and 32 by 12 for the medial sheet, as before; welded points and nonzero-area triangles are emitted.
 * @evidence contracts/modeling.md#parameter-channels Corner length, caruncle and plica projection, and each margin's width and lift keep their meaning and independence.
 * @evidence contracts/anatomy.md#anatomical-source No read primary source gives caruncle, plica or tear-meniscus dimensions; the document values are authored and the tear-film floor is the seat constant's conventional value.
 * @evidence contracts/anatomy.md#permitted-range Refuses negative or non-finite dimensions, unpaired upper width and lift, and a corner longer than either margin.
 * @evidence contracts/anatomy.md#parametric-authority Seven named dimensions per eye; no personal vertex or curve input.
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
      const points = columns.map((column) => {
        const at = 3 * margin.vertices[column];
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
        let segment = 1;
        while (segment < arc.length - 1 && arc[segment] < target) segment++;
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
