import { AutoMovieEngineQuaternion, AutoMovieEngineGeometry } from "@automovie/engine";
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
 * Actual tessellated triangle sections must also touch without penetration;
 * analytic circular tangency alone does not certify a faceted visible contact.
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
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
      body.transform!.rotation,
    );
    const a: IAutoMovieVector3 = local(Equipment.end(bearing, -1));
    const b: IAutoMovieVector3 = local(Equipment.end(bearing, 1));
    const overlap: number =
      Math.min(shape.height / 2, Math.max(a.y, b.y)) -
      Math.max(-shape.height / 2, Math.min(a.y, b.y));
    const plane: number =
      (Math.min(shape.height / 2, Math.max(a.y, b.y)) +
        Math.max(-shape.height / 2, Math.min(a.y, b.y))) /
      2;
    if (
      !nclose(stock.radius, radius, 1e-9) ||
      !(stock.height > 0) ||
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
    if (!nclose(meshGap(section(body), section(bearing)), 0, 1e-9))
      findings.push(
        `${animal.archetype}/${bearing.id}: actual faceted bearing section is separated or penetrating`,
      );

    /** Intersect actual transformed triangles with an interior axial plane. */
    function section(part: IAutoMovieModelPart): IAutoMovieVector3[][] {
      if (part.geometry.type !== "primitive")
        throw new Error(
          "The observed bearing must retain its actual primitive",
        );
      const mesh: ReturnType<typeof AutoMovieEngineGeometry.tessellate> = AutoMovieEngineGeometry.tessellate(
        part.geometry.shape,
      );
      const points: IAutoMovieVector3[] = [];
      for (let index: number = 0; index < mesh.positions.length; index += 3) {
        const rotated: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
          part.transform!.rotation,
          {
            x: mesh.positions[index]! * part.transform!.scale.x,
            y: mesh.positions[index + 1]! * part.transform!.scale.y,
            z: mesh.positions[index + 2]! * part.transform!.scale.z,
          },
        );
        points.push(
          local({
            x: rotated.x + part.transform!.translation.x,
            y: rotated.y + part.transform!.translation.y,
            z: rotated.z + part.transform!.translation.z,
          }),
        );
      }
      const segments: IAutoMovieVector3[][] = [];
      for (let index: number = 0; index < mesh.indices.length; index += 3) {
        const cuts: IAutoMovieVector3[] = [];
        for (let edge: number = 0; edge < 3; ++edge) {
          const first: IAutoMovieVector3 = points[mesh.indices[index + edge]!]!;
          const last: IAutoMovieVector3 =
            points[mesh.indices[index + ((edge + 1) % 3)]!]!;
          if (
            (first.y <= plane && last.y > plane) ||
            (last.y <= plane && first.y > plane)
          ) {
            const ratio: number = (plane - first.y) / (last.y - first.y);
            cuts.push({
              x: first.x + ratio * (last.x - first.x),
              y: plane,
              z: first.z + ratio * (last.z - first.z),
            });
          }
        }
        if (
          cuts.length === 2 &&
          Math.hypot(cuts[1]!.x - cuts[0]!.x, cuts[1]!.z - cuts[0]!.z) > 0
        )
          segments.push(cuts);
      }
      return segments;
    }

    /**
     * Convex section SAT: positive separates, negative penetrates, zero
     * touches.
     */
    function meshGap(
      first: IAutoMovieVector3[][],
      second: IAutoMovieVector3[][],
    ): number {
      if (first.length < 3 || second.length < 3) return Infinity;
      const a: IAutoMovieVector3[] = first.flat();
      const b: IAutoMovieVector3[] = second.flat();
      let gap: number = -Infinity;
      for (const segment of [...first, ...second]) {
        const dx: number = segment[1]!.x - segment[0]!.x;
        const dz: number = segment[1]!.z - segment[0]!.z;
        const length: number = Math.hypot(dx, dz);
        const pa: number[] = a.map(project);
        const pb: number[] = b.map(project);
        gap = Math.max(
          gap,
          Math.min(...pa) - Math.max(...pb),
          Math.min(...pb) - Math.max(...pa),
        );

        /** Each observed edge supplies its own metre-space separating normal. */
        function project(point: IAutoMovieVector3): number {
          return (-dz * point.x + dx * point.z) / length;
        }
      }
      return gap;
    }

    /** The observed body's rigid frame supplies local axial/radial coordinates. */
    function local(point: IAutoMovieVector3): IAutoMovieVector3 {
      return AutoMovieEngineQuaternion.rotateVector(inverse, {
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
      !(shape.height > 0) ||
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
