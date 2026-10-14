import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { humanFaceOpticalPartId } from "../../face/anatomy/eye/humanFaceOpticalPartId";
import { humanFaceLashPartId } from "../../face/anatomy/lash/humanFaceLashPartId";
import { createHumanFaceMeasurementContext } from "../../face/anatomy/resolution/createHumanFaceMeasurementContext";
import { readHumanFaceMeasurements } from "../../face/anatomy/resolution/readHumanFaceMeasurements";
import type { AutoMovieHumanFaceMeasurementReading } from "../../face/structures/AutoMovieHumanFaceMeasurementReading";
import { meshOfHumanPart } from "../build/meshOfHumanPart";
import type { IAutoMovieHumanPersonCompiledGeneration } from "../structures/IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonFaceMeasurementInput } from "../structures/IAutoMovieHumanPersonFaceMeasurementInput";
import { readHumanPersonOralDentalPositions } from "./readHumanPersonOralDentalPositions";

/**
 * Compile correspondence from actual retained face regions and generated oral/optical surfaces of the final model. Missing native vertices stay NaN and requested instruments report their own unavailable acquisition; no original source coordinates or clinical proxy fill the gap. Generated brow/card and gingiva acquisition limits remain the registry owner's.
 *
 * Float32 world positions pass through the inverse of this evaluation's head carry and another Float32 quantization before the face context. This removes global rigid carry while retaining weighted shape/expression deformation and a numerical precision limit. Optional reference positions use the same inverse; omission remains a named reference gap. Zero emitted lashes require an actual zero profile and retired source row, rather than treating any absent part as zero.
 *
 * @evidence contracts/common.md#principled-implementation Matching basis/document/model identities, region source tables and native oral domains locate actual final geometry for the existing instruments.
 * @evidence contracts/common.md#clear-and-simple-design This reader owns person-to-face correspondence and canonical carry; the face context and registry own individual protocols and unavailable readings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source coordinates remain NaN, absent generated roles refuse, and clinical/source qualification or current displayed appearance is not inferred from coordinates.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes retained/replaced acquisition, Float32 inverse carry, optional reference gaps and admitted zero lash populations.
 * @evidence contracts/performance.md#efficient-algorithms Source/part maps provide indexed lookup; each read scans actual source populations and emitted regions and allocates canonical buffers, while instrumentation pays its own geometry costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The compiled basis surface map serves repeated reads and one per-read part map serves native, oral, optical and lash instruments without rebuilding the person.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains borrowed compiled source context; per-read maps/buffers are local except any instrument result, and no render asset, worker or timer is acquired.
 */
export function createHumanPersonFaceMeasurementReader(
  compiled: IAutoMovieHumanPersonCompiledGeneration,
): (
  input: IAutoMovieHumanPersonFaceMeasurementInput,
) => AutoMovieHumanFaceMeasurementReading[] {
  const basis: typeof compiled.generation.face = compiled.generation.face;
  const surfaces: Map<string, (typeof basis.surfaces)[number]> = new Map(
    basis.surfaces.map(
      (
        surface: (typeof basis.surfaces)[number],
      ): [string, (typeof basis.surfaces)[number]] => [surface.id, surface],
    ),
  );
  return ({
    model,
    document,
    head,
    reference,
    oral,
    sourceRegions,
    browReplacements,
  }: IAutoMovieHumanPersonFaceMeasurementInput): AutoMovieHumanFaceMeasurementReading[] => {
    if (document.face.basis !== basis.id || model.id !== document.id)
      throw new Error(
        "Person face measurements need the model and document of the compiled generation's evaluation.",
      );
    const inverse: ReturnType<typeof Quaternion.inverse> = Quaternion.inverse(
      head.rotation,
    );
    const origin: ReturnType<typeof head.point> = head.point({
      x: 0,
      y: 0,
      z: 0,
    });
    const parts: Map<string, (typeof model.parts)[number]> = new Map(
      model.parts.map(
        (
          part: (typeof model.parts)[number],
        ): [string, (typeof model.parts)[number]] => [part.id, part],
      ),
    );
    const canonicalPositions: (world: readonly number[]) => number[] = (
      world: readonly number[],
    ): number[] => {
      const output: number[] = new Array<number>(world.length);
      for (let at: number = 0; at < world.length; at += 3) {
        const local: ReturnType<typeof Quaternion.rotateVector> =
          Quaternion.rotateVector(
            inverse,
            Vector3.subtract(
              {
                x: Math.fround(world[at]),
                y: Math.fround(world[at + 1]),
                z: Math.fround(world[at + 2]),
              },
              origin,
            ),
          );
        output[at] = Math.fround(local.x);
        output[at + 1] = Math.fround(local.y);
        output[at + 2] = Math.fround(local.z);
      }
      return output;
    };
    const canonicalMesh: (mesh: IAutoMovieMesh) => IAutoMovieMesh = (
      mesh: IAutoMovieMesh,
    ): IAutoMovieMesh => {
      const normals: number[] | null = mesh.normals?.slice() ?? null;
      if (normals !== null)
        for (let at: number = 0; at < normals.length; at += 3) {
          const local: ReturnType<typeof Quaternion.rotateVector> =
            Quaternion.rotateVector(inverse, {
              x: Math.fround(normals[at]),
              y: Math.fround(normals[at + 1]),
              z: Math.fround(normals[at + 2]),
            });
          normals[at] = Math.fround(local.x);
          normals[at + 1] = Math.fround(local.y);
          normals[at + 2] = Math.fround(local.z);
        }
      return {
        ...mesh,
        positions: canonicalPositions(mesh.positions),
        normals,
      };
    };
    const posed: Map<string, number[]> = new Map<string, number[]>();
    for (const surface of basis.surfaces)
      posed.set(
        surface.id,
        new Array<number>(surface.positions.length).fill(Number.NaN),
      );
    const seen: Set<string> = new Set<string>();
    for (const region of sourceRegions) {
      const surface: (typeof basis.surfaces)[number] | undefined = surfaces.get(
        region.surface,
      );
      const part: (typeof model.parts)[number] | undefined = parts.get(
        "face:" + region.part,
      );
      if (
        surface === undefined ||
        !surface.regions.some(
          (one: (typeof surface.regions)[number]): boolean =>
            one.id === region.part,
        ) ||
        part === undefined ||
        seen.has(region.part)
      )
        throw new Error(
          "Final face source correspondence needs its actual native region exactly once: " +
            region.part +
            ".",
        );
      seen.add(region.part);
      const mesh: IAutoMovieMesh = meshOfHumanPart(part);
      if (mesh.positions.length !== region.sources.length * 3)
        throw new Error(
          "Final face source correspondence differs from the retained render population: " +
            region.part +
            ".",
        );
      const canonical: number[] = canonicalPositions(mesh.positions);
      const positions: number[] = posed.get(region.surface)!;
      region.sources.forEach((source: number, vertex: number): void => {
        if (
          !Number.isSafeInteger(source) ||
          source < 0 ||
          source * 3 + 2 >= positions.length
        )
          throw new Error(
            "Final face source correspondence names a nonresident native vertex: " +
              region.part +
              ".",
          );
        for (let axis: number = 0; axis < 3; axis++)
          positions[source * 3 + axis] = canonical[vertex * 3 + axis];
      });
    }
    if (oral !== undefined) {
      const surface: (typeof basis.surfaces)[number] | undefined =
        basis.surfaces.find(
          (one: (typeof basis.surfaces)[number]): boolean =>
            one.id === oral.dentalSurface,
        );
      if (surface === undefined)
        throw new Error(
          "Final oral correspondence names an absent basis dental surface: " +
            oral.dentalSurface +
            ".",
        );
      posed.set(
        surface.id,
        readHumanPersonOralDentalPositions(
          model,
          document.face.id,
          oral,
          surface.positions.length,
          canonicalPositions,
        ),
      );
    }
    const context: ReturnType<typeof createHumanFaceMeasurementContext> =
      createHumanFaceMeasurementContext(basis, posed, {
        oral,
        brows: { replacements: browReplacements },
        reference:
          reference === undefined
            ? undefined
            : new Map(
                [...reference].map(
                  ([id, positions]: [string, readonly number[]]): [
                    string,
                    number[],
                  ] => [id, canonicalPositions(positions)],
                ),
              ),
      });
    context.opticalMesh = (
      side: Parameters<NonNullable<typeof context.opticalMesh>>[0],
      role: Parameters<NonNullable<typeof context.opticalMesh>>[1],
    ): ReturnType<NonNullable<typeof context.opticalMesh>> => {
      const id: string = "face:" + humanFaceOpticalPartId(side, role);
      const part: (typeof model.parts)[number] | undefined = parts.get(id);
      if (part === undefined) {
        if (document.face.eyes !== undefined)
          throw new Error(
            `The final person omits requested generated optical part ${id}.`,
          );
        return null;
      }
      return canonicalMesh(meshOfHumanPart(part));
    };
    context.lashMesh = (
      side: Parameters<NonNullable<typeof context.lashMesh>>[0],
      row: Parameters<NonNullable<typeof context.lashMesh>>[1],
    ): ReturnType<NonNullable<typeof context.lashMesh>> => {
      const profile:
        | NonNullable<
            NonNullable<typeof document.face.lashes>[typeof row]
          >[typeof side]
        | undefined = document.face.lashes?.[row]?.[side];
      if (profile === undefined) return null;
      const id: string = "face:" + humanFaceLashPartId(side, row);
      const part: (typeof model.parts)[number] | undefined = parts.get(id);
      if (part !== undefined) return canonicalMesh(meshOfHumanPart(part));
      if (profile.strandCount !== 0)
        throw new Error(
          `The final person omits requested generated lash part ${id}.`,
        );
      const registration:
        | NonNullable<typeof basis.periocular>[typeof side]["lashes"]
        | undefined = basis.periocular?.[side].lashes;
      if (registration === undefined)
        throw new Error(
          `The zero lash population ${id} has no source-row registration.`,
        );
      const source: string =
        "face:" +
        (row === "upper" ? registration.upperRegion : registration.lowerRegion);
      if (parts.has(source))
        throw new Error(
          `The zero lash population ${id} still carries source row ${source}.`,
        );
      return { positions: [], indices: [], normals: [], uvs: null, skin: null };
    };
    return readHumanFaceMeasurements(context, document.face.anatomical);
  };
}
