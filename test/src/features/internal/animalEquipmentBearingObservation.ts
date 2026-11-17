import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieCapsuleShape,
  IAutoMovieCylinderShape,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AnimalEquipmentFixture as Equipment } from "./AnimalEquipmentFixture";
import { nclose } from "./nclose";

/**
 * Observe actual body-to-frame bearing paths without reading a fitting plan.
 *
 * The caller supplies the authored stock radius. Actual body-local primitive
 * axes determine tangent circular sections and a positive shared axial span;
 * actual rod endpoints determine the physical links to the existing frame.
 * These are geometric contact checks, not friction or load-capacity claims.
 */
export function animalEquipmentBearingObservation(
  animal: Equipment.Animal,
  kind: "yoke" | "pack",
  radius: number,
  findings: string[],
): void {
  if (kind === "yoke") {
    const bearing: IAutoMovieModelPart = Equipment.part(animal, "yoke-bearing");
    tangent(bearing, Equipment.part(animal, "neck"));
    link(
      "yoke-bearing-link",
      bearing.transform!.translation,
      Equipment.part(animal, "yoke-beam").transform!.translation,
    );
    return;
  }
  for (const side of ["left", "right"] as const) {
    const bearing: IAutoMovieModelPart = Equipment.part(
      animal,
      `pack-${side}-bearing`,
    );
    const rail: IAutoMovieModelPart = Equipment.part(
      animal,
      `pack-${side}-rail`,
    );
    tangent(bearing, Equipment.part(animal, "trunk"));
    for (const end of [-1, 1] as const)
      link(
        `pack-${side}-bearing-link-${end}`,
        Equipment.end(bearing, end),
        Equipment.end(rail, end),
      );
  }

  /** Parallel finite circular sections must touch over a positive body span. */
  function tangent(
    bearing: IAutoMovieModelPart,
    body: IAutoMovieModelPart,
  ): void {
    if (
      body.geometry.type !== "primitive" ||
      (body.geometry.shape.type !== "cylinder" &&
        body.geometry.shape.type !== "capsule")
    )
      throw new Error(`${body.id} must retain its actual circular body solid`);
    const shape: IAutoMovieCapsuleShape | IAutoMovieCylinderShape =
      body.geometry.shape;
    const stock: IAutoMovieCylinderShape = Equipment.cylinder(bearing);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      body.transform!.rotation,
    );
    const a: IAutoMovieVector3 = local(Equipment.end(bearing, -1));
    const b: IAutoMovieVector3 = local(Equipment.end(bearing, 1));
    const overlap: number =
      Math.min(shape.height / 2, Math.max(a.y, b.y)) -
      Math.max(-shape.height / 2, Math.min(a.y, b.y));
    if (
      !nclose(stock.radius, radius, 1e-9) ||
      !(Number.isFinite(stock.height) && stock.height > 0) ||
      !(Math.PI * stock.radius ** 2 * stock.height > 0) ||
      !nclose(a.x, b.x, 1e-9) ||
      !nclose(a.z, b.z, 1e-9) ||
      !nclose(Math.hypot(a.x, a.z) - stock.radius, shape.radius, 1e-9) ||
      !nclose(Math.hypot(b.x, b.z) - stock.radius, shape.radius, 1e-9) ||
      !(overlap > 1e-9)
    )
      findings.push(
        `${animal.archetype}/${bearing.id}: no positive actual tangent body-bearing span`,
      );

    /** The observed body's rigid frame supplies local axial/radial coordinates. */
    function local(point: IAutoMovieVector3): IAutoMovieVector3 {
      return Quaternion.rotateVector(inverse, {
        x: point.x - body.transform!.translation.x,
        y: point.y - body.transform!.translation.y,
        z: point.z - body.transform!.translation.z,
      });
    }
  }

  /** A separated frame needs a positive real rod; coincident joins need none. */
  function link(
    id: string,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): void {
    const part: IAutoMovieModelPart | undefined = animal.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
    );
    if (part === undefined) {
      if (!same(from, to))
        findings.push(`${animal.archetype}/${id}: actual bearing path is open`);
      return;
    }
    const shape: IAutoMovieCylinderShape = Equipment.cylinder(part);
    if (
      !nclose(shape.radius, radius, 1e-9) ||
      !(Number.isFinite(shape.height) && shape.height > 0) ||
      !same(Equipment.end(part, -1), from) ||
      !same(Equipment.end(part, 1), to)
    )
      findings.push(
        `${animal.archetype}/${id}: actual bearing/frame join is lost`,
      );
  }

  /** Metre-space equality at the unchanged equipment-unit contact tolerance. */
  function same(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
    return (
      nclose(a.x, b.x, 1e-9) && nclose(a.y, b.y, 1e-9) && nclose(a.z, b.z, 1e-9)
    );
  }
}
