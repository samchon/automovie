import type {
  IAutoMoviePhysicalSegment,
  IAutoMovieResolveHydrodynamicForce,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { AutoMovieGravity } from "../physics/AutoMovieGravity";
import { physicalHullMass } from "../physics/physicalHullMass";

/**
 * The buoyant and drag forces water puts on one body segment (#3432), the
 * per-segment structure of SWUM (Nakashima, Satou and Miura 2007, J Fluid
 * Sci Tech 2(1):56-67): the limbs move by their joints and the water's
 * forces on every segment move the root, as #3432 describes it (the paper
 * itself not yet read).
 *
 * The segment is taken as the sphere of its colliders' volume, centred on
 * its centre of mass, so its submerged volume below the water plane is the
 * spherical cap's, `π d² (3 r - d) / 3` for a depth `d` of the sphere below
 * the plane. The buoyant force is that volume's weight of water, upward
 * (Archimedes). The drag is the quasi-steady drag of a sphere, `½ ρ C_d A
 * |v| v` against the velocity, `C_d` the sphere's textbook 0.47 in the
 * subcritical range of Reynolds numbers a limb in water reaches
 * (provisional: no drag study was read for it), and `A` the sphere's
 * section scaled by the share of its volume under water.
 *
 * First pass: SWUM's own coefficients, its normal and tangential drag of
 * elongated segments and its added mass are not read; the sphere stands in
 * for every segment, so a limb's drag along and across its axis is the same.
 * Unsteady effects and the free surface's waves are outside a quasi-steady
 * model.
 *
 * @param props The segment's volume, its centre and velocity, the water plane and the water's density.
 * @returns The buoyant force, the drag and the submerged volume.
 * @throws {Error} When the volume or the density is not positive.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the model, its source structure, the sphere stand-in with its cap volume, the buoyancy, the drag with its coefficient's source and the first pass's limits.
 * @evidence contracts/development/implementation.md#principled-implementation Archimedes' principle on a spherical cap and the quasi-steady quadratic drag of a sphere at its textbook subcritical coefficient, provisional; the stand-in sphere keeps the segment's volume, so buoyancy is exact at full immersion.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The radius, the cap, then two forces.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A segment above the water gets no force and one below gets its whole volume's; nothing is clamped beyond the cap's own range.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per segment.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function resolveHydrodynamicForce(
  props: IAutoMovieResolveHydrodynamicForce.IProps,
): IAutoMovieResolveHydrodynamicForce.IForce {
  const density: number = props.density ?? resolveHydrodynamicForce.WATER;
  const gravity: number = props.gravity ?? AutoMovieGravity.STANDARD;
  if (!(props.volume > 0 && density > 0))
    throw new Error("The water's force needs a positive volume and density");
  const r: number = Math.cbrt((3 * props.volume) / (4 * Math.PI));
  const depth: number = Math.max(
    0,
    Math.min(2 * r, props.surface - (props.centre.y - r)),
  );
  const submerged: number = (Math.PI * depth * depth * (3 * r - depth)) / 3;
  const share: number = submerged / props.volume;
  const speed: number = Vector3.length(props.velocity);
  const area: number = Math.PI * r * r * share;
  return {
    submerged,
    buoyancy: { x: 0, y: density * gravity * submerged, z: 0 },
    drag: Vector3.scale(
      props.velocity,
      -0.5 * density * resolveHydrodynamicForce.DRAG * area * speed,
    ),
  };
}

/**
 * Companion types, constants and the segment volume of
 * {@link resolveHydrodynamicForce}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and source.
 * @evidence contracts/development/design.md#principled-representation A segment as its volume and posed centre, the water as a horizontal plane and a density, forces in world newtons.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the immersed base (#3432) reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The hull's volume is `physicalHullMass`'s.
 */
export namespace resolveHydrodynamicForce {
  /** Fresh water's density near its maximum at 4 °C, kg/m³ (the standard reference value). */
  export const WATER: number = 1000;

  /** The drag coefficient of a sphere at subcritical Reynolds numbers, the textbook value (provisional: no drag study was read for it). */
  export const DRAG: number = 0.47;

  /**
   * A segment's volume from its colliders: each sphere, capsule, box and
   * hull in closed form, summed, overlaps counted twice as the profile
   * declares them.
   *
   * @param segment The profile's segment.
   * @returns Cubic metres.
   */
  export function volume(segment: IAutoMoviePhysicalSegment): number {
    let sum: number = 0;
    for (const shape of segment.shapes) {
      if (shape.kind === "sphere") sum += (4 / 3) * Math.PI * shape.radius ** 3;
      else if (shape.kind === "capsule")
        sum +=
          Math.PI * shape.radius ** 2 * 2 * shape.halfLength +
          (4 / 3) * Math.PI * shape.radius ** 3;
      else if (shape.kind === "box")
        sum +=
          8 * shape.halfExtents.x * shape.halfExtents.y * shape.halfExtents.z;
      else sum += physicalHullMass(shape.points).volume;
    }
    return sum;
  }
}
