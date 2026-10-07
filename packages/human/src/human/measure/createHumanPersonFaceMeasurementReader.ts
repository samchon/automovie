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
 * Compile the source correspondence for reading every face measurement from
 * the final one-skin person model. Each retained material-region render vertex
 * scatters through the source table its actual face gatherer returned, including
 * partial component replacement and UV splits. Unemitted source vertices remain
 * unrepresented;
 * a requested reading refuses through its existing instrument rather than
 * receiving source-rest coordinates.
 *
 * World coordinates are rounded to Float32 before measurement, as in static
 * export. The inverse of the evaluator's actual rigid head carry returns them
 * to the neutral head frame, where the registered directions and basal plane
 * are defined. This removes global head motion while retaining the actual
 * body-driven shape, expression, closure and weighted skin deformation.
 * Canonical coordinates are then quantized by the face context; the additional
 * coordinate rounding is a measurement precision limit, not a shape change.
 * The clinical/source qualification remains the registry owner's.
 * An optional source-neutral reference is carried through the same body's
 * current pose by the evaluator and converted through this same inverse;
 * omission remains a named reference gap, never the original basis neutral.
 * Generated optical surfaces use their emitter's semantic ID owner, and a
 * requested role missing from the final model cannot fall back to a proxy.
 * Replaced dental surfaces scatter actual generated crowns through the oral
 * emitter's native physical domain. Deliberately absent crowns remain named
 * unavailable in both performed and source-reference instruments; generated
 * gingiva is not measured through the retired native composite surface.
 * Generated brow replacements carry the same explicit source-card acquisition
 * refusal as the standalone face context; retained coordinates do not supply
 * measurements of retired cards or inferred shaft boundaries.
 *
 * @evidence contracts/common.md#principled-implementation The actual retained region gatherer's returned source numbering is inverted over the emitted model; inverse rigid carry restores the registry's declared frame without a second shape or replacement evaluation.
 * @evidence contracts/common.md#clear-and-simple-design Compile region correspondence once, then scatter one final model and call the existing registry reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source-rest vertex, independently computed body gain or face subtree substitutes for final output.
 * @evidence contracts/common.md#meaningful-documentation States correspondence, missing-part semantics, Float32 precision and the inverse measurement frame.
 * @evidence contracts/modeling.md#spatial-conventions Final Float32 world metres are transformed through the inverse actual head carry to the head-frame metres of existing instruments.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reader consumes existing parts and creates none.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reader moves no authored value.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reader emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The evaluator owns source-shared skin samples.
 * @evidence contracts/modeling.md#rendered-observation The readings consume the final model the person editor displays and exports.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Each registry entry owns its protocol and qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reader admits no anatomical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reader introduces no authoring input.
 */
export function createHumanPersonFaceMeasurementReader(
  compiled: IAutoMovieHumanPersonCompiledGeneration,
): (
  input: IAutoMovieHumanPersonFaceMeasurementInput,
) => AutoMovieHumanFaceMeasurementReading[] {
  const basis = compiled.generation.face;
  const surfaces = new Map(
    basis.surfaces.map((surface) => [surface.id, surface]),
  );
  return ({
    model,
    document,
    head,
    reference,
    oral,
    sourceRegions,
    browReplacements,
  }) => {
    if (document.face.basis !== basis.id || model.id !== document.id)
      throw new Error(
        "Person face measurements need the model and document of the compiled generation's evaluation.",
      );
    const inverse = Quaternion.inverse(head.rotation);
    const origin = head.point({ x: 0, y: 0, z: 0 });
    const parts = new Map(model.parts.map((part) => [part.id, part]));
    const canonicalPositions = (world: readonly number[]): number[] => {
      const output = new Array<number>(world.length);
      for (let at = 0; at < world.length; at += 3) {
        const local = Quaternion.rotateVector(
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
    const canonicalMesh = (mesh: IAutoMovieMesh): IAutoMovieMesh => {
      const normals = mesh.normals?.slice() ?? null;
      if (normals !== null)
        for (let at = 0; at < normals.length; at += 3) {
          const local = Quaternion.rotateVector(inverse, {
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
    const posed = new Map<string, number[]>();
    for (const surface of basis.surfaces)
      posed.set(
        surface.id,
        new Array<number>(surface.positions.length).fill(Number.NaN),
      );
    const seen = new Set<string>();
    for (const region of sourceRegions) {
      const surface = surfaces.get(region.surface);
      const part = parts.get("face:" + region.part);
      if (
        surface === undefined ||
        !surface.regions.some((one) => one.id === region.part) ||
        part === undefined ||
        seen.has(region.part)
      )
        throw new Error(
          "Final face source correspondence needs its actual native region exactly once: " +
            region.part +
            ".",
        );
      seen.add(region.part);
      const mesh = meshOfHumanPart(part);
      if (mesh.positions.length !== region.sources.length * 3)
        throw new Error(
          "Final face source correspondence differs from the retained render population: " +
            region.part +
            ".",
        );
      const canonical = canonicalPositions(mesh.positions);
      const positions = posed.get(region.surface)!;
      region.sources.forEach((source, vertex) => {
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
        for (let axis = 0; axis < 3; axis++)
          positions[source * 3 + axis] = canonical[vertex * 3 + axis];
      });
    }
    if (oral !== undefined) {
      const surface = basis.surfaces.find(
        (one) => one.id === oral.dentalSurface,
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
    const context = createHumanFaceMeasurementContext(basis, posed, {
      oral,
      brows: { replacements: browReplacements },
      reference:
        reference === undefined
          ? undefined
          : new Map(
              [...reference].map(([id, positions]) => [
                id,
                canonicalPositions(positions),
              ]),
            ),
    });
    context.opticalMesh = (side, role) => {
      const id = "face:" + humanFaceOpticalPartId(side, role);
      const part = parts.get(id);
      if (part === undefined) {
        if (document.face.eyes !== undefined)
          throw new Error(
            `The final person omits requested generated optical part ${id}.`,
          );
        return null;
      }
      return canonicalMesh(meshOfHumanPart(part));
    };
    context.lashMesh = (side, row) => {
      const profile = document.face.lashes?.[row]?.[side];
      if (profile === undefined) return null;
      const id = "face:" + humanFaceLashPartId(side, row);
      const part = parts.get(id);
      if (part !== undefined) return canonicalMesh(meshOfHumanPart(part));
      if (profile.strandCount !== 0)
        throw new Error(
          `The final person omits requested generated lash part ${id}.`,
        );
      const registration = basis.periocular?.[side].lashes;
      if (registration === undefined)
        throw new Error(
          `The zero lash population ${id} has no source-row registration.`,
        );
      const source =
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
