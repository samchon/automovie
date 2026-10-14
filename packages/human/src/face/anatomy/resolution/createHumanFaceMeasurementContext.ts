import { Vector3 } from "@automovie/engine";
import type { IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface } from "@automovie/human";
import type {
  IAutoMovieMesh as ImportedIAutoMovieMesh,
  IAutoMovieMeshPhysicalVertices as ImportedIAutoMovieMeshPhysicalVertices,
  IAutoMovieMeshSkin as ImportedIAutoMovieMeshSkin,
  IAutoMovieVector3 as ImportedIAutoMovieVector3,
} from "@automovie/interface";

import { resolveHumanFaceApertureUp } from "../../basis/resolveHumanFaceApertureUp";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceOpticalAssembly as ImportedIHumanFaceOpticalAssembly } from "../eye/structures/IHumanFaceOpticalAssembly";
import type { IHumanFaceLashRow as ImportedIHumanFaceLashRow } from "../lash/structures/IHumanFaceLashRow";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementContextOptions } from "./IHumanFaceMeasurementContextOptions";

/**
 * Wrap one build's final posed positions as the context face measurements read.
 *
 * Positions are those the build emits, after articulation, closure and contact; each coordinate a reader sees is rounded to Float32, the precision of the static asset. An unknown surface or an out-of-range vertex refuses by name. The opening direction is the contact frame's, or null when the basis declares no articulation.
 *
 * @evidence contracts/common.md#principled-implementation Current posed arrays round to Float32 at source reads, with explicit missing/absent/replaced native acquisition refusal.
 * @evidence contracts/common.md#clear-and-simple-design Optional generated optics/lashes and shape-only reference expose actual build states through one instrument seam.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unshaped basis replaces a missing reference and zero emitted shafts differ from an absent shaft instrument; source rounding does not prove GPU output.
 * @evidence contracts/common.md#meaningful-documentation Head metres share the canonical aperture direction, with copied output coordinates and borrowed original incidence.
 * @evidence contracts/performance.md#efficient-algorithms Point reads are fixed work; surface/mesh reads copy their full buffers and find metadata/populations linearly.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared basis/posed/options and absence set serve all measurements, but rounded surface/mesh reads are not memoized.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains all borrowed build context until release, owns an absence set and transfers per-read rounded arrays to callers.
 *
 * @author Samchon
 */
export function createHumanFaceMeasurementContext(
  basis: IAutoMovieHumanFaceBasis,
  posed: ReadonlyMap<string, readonly number[]>,
  options?: IHumanFaceMeasurementContextOptions,
): IHumanFaceMeasurementContext {
  const absentDental: Set<number> = new Set(
    options?.oral?.absentDentalVertices ?? [],
  );
  const assertPresent: (surface: string, vertex: number) => void = (
    surface: string,
    vertex: number,
  ): void => {
    if (surface === options?.oral?.dentalSurface && absentDental.has(vertex))
      throw new Error(
        `A face measurement requires absent authored crown vertex ${vertex} of ${surface}.`,
      );
    if (options?.brows?.replacements.get(surface)?.has(vertex))
      throw new Error(
        "Generated brow acquisition needs actual shafts or implantation boundaries, not replaced source-card vertices.",
      );
  };
  const positions: (surface: string) => readonly number[] = (
    surface: string,
  ): readonly number[] => {
    const found: readonly number[] | undefined = posed.get(surface);
    if (found === undefined)
      throw new Error(
        "A face measurement names an absent surface: " + surface + ".",
      );
    return found;
  };
  return {
    basis,
    point: (surface: string, vertex: number): ImportedIAutoMovieVector3 => {
      assertPresent(surface, vertex);
      const values: readonly number[] = positions(surface);
      if (
        !Number.isSafeInteger(vertex) ||
        vertex < 0 ||
        3 * vertex + 2 >= values.length
      )
        throw new Error(
          `A face measurement names an absent vertex ${vertex} of ${surface}.`,
        );
      return Vector3.create(
        Math.fround(values[3 * vertex]),
        Math.fround(values[3 * vertex + 1]),
        Math.fround(values[3 * vertex + 2]),
      );
    },
    surface: (surface: string): { positions: number[]; indices: number[] } => {
      if (surface === options?.oral?.dentalSurface)
        throw new Error(
          "Generated oral composite surface acquisition needs its actual part meshes, not replaced native gingiva.",
        );
      if (options?.brows?.replacements.has(surface))
        throw new Error(
          "Generated brow surface acquisition needs actual shafts, not replaced source cards.",
        );
      return {
        positions: positions(surface).map(Math.fround),
        indices: basis.surfaces.find(
          (candidate: ImportedIAutoMovieHumanFaceBasisSurface): boolean =>
            candidate.id === surface,
        )!.indices,
      };
    },
    apertureUp:
      basis.articulation === undefined
        ? null
        : resolveHumanFaceApertureUp(basis.articulation.jaw.axis),
    opticalMesh: (
      side: "left" | "right",
      role: "sclera" | "cornea" | "iris" | "apertureBacking",
    ): {
      positions: number[];
      normals: number[] | null;
      physicalVertices?: ImportedIAutoMovieMeshPhysicalVertices;
      uvs: number[] | null;
      colors?: number[];
      reliefWeights?: number[];
      indices: number[] | null;
      skin: ImportedIAutoMovieMeshSkin | null;
    } | null => {
      const mesh: ImportedIAutoMovieMesh | undefined = options?.optics?.find(
        (eye: ImportedIHumanFaceOpticalAssembly): boolean => eye.side === side,
      )?.geometry.parts[role].mesh;
      return mesh === undefined
        ? null
        : {
            ...mesh,
            positions: mesh.positions.map(Math.fround),
            normals: mesh.normals?.map(Math.fround) ?? null,
          };
    },
    referencePoint:
      options?.reference === undefined
        ? null
        : (surface: string, vertex: number): ImportedIAutoMovieVector3 => {
            assertPresent(surface, vertex);
            const values: readonly number[] | undefined =
              options.reference!.get(surface);
            if (
              values === undefined ||
              !Number.isSafeInteger(vertex) ||
              vertex < 0 ||
              3 * vertex + 2 >= values.length
            )
              throw new Error(
                `A face reference measurement names an absent vertex ${vertex} of ${surface}.`,
              );
            const coordinates: number[] = values
              .slice(3 * vertex, 3 * vertex + 3)
              .map(Math.fround);
            if (!coordinates.every(Number.isFinite))
              throw new Error(
                `A face reference measurement has a nonfinite Float32 vertex ${vertex} of ${surface}.`,
              );
            return Vector3.create(
              coordinates[0],
              coordinates[1],
              coordinates[2],
            );
          },
    lashMesh: (
      side: "left" | "right",
      row: "upper" | "lower",
    ): {
      positions: number[];
      normals: number[] | null;
      physicalVertices?: ImportedIAutoMovieMeshPhysicalVertices;
      uvs: number[] | null;
      colors?: number[];
      reliefWeights?: number[];
      indices: number[] | null;
      skin: ImportedIAutoMovieMeshSkin | null;
    } | null => {
      const population: ImportedIHumanFaceLashRow | undefined =
        options?.lashes?.find(
          (one: ImportedIHumanFaceLashRow): boolean =>
            one.side === side && one.row === row,
        );
      if (population === undefined) return null;
      if (population.mesh === null)
        return {
          positions: [],
          indices: [],
          normals: [],
          uvs: null,
          skin: null,
        };
      return {
        ...population.mesh,
        positions: population.mesh.positions.map(Math.fround),
        normals: population.mesh.normals?.map(Math.fround) ?? null,
      };
    },
  };
}
