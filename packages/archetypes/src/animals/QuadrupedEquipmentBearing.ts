import { PRIMITIVE_RADIAL_SEGMENTS, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { QuadrupedBody } from "./QuadrupedBody";
import type { QuadrupedEquipment } from "./QuadrupedEquipment";
import type { QuadrupedEquipmentPlan } from "./QuadrupedEquipmentPlan";

/**
 * Visible body-bearing rails connecting the actual body to its clear frame.
 *
 * Each rail is a real finite cylinder tangent along a positive axial interval
 * to the neck cylinder or trunk capsule's cylindrical course. These coarse
 * line contacts establish a geometric support path, not compliant padding,
 * a pressure distribution, restraint or a rated dynamic load capacity.
 * Pack contacts use the shared radial primitive profile's actual vertices,
 * so the analytic circles and their displayed polygonal courses both meet.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines neutral model metres, actual tangent rail/body boundaries, connected frame links and the explicit line-contact rather than physiological or load-rating claim.
 * @evidence contracts/development/design.md#principled-representation Existing authored beam/rail radii size actual additional support cylinders; the body's existing axes/radii determine their bearing locations and the already planned frame supplies their other endpoints.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Yoke and pack planning are the two live consumers; this owner adds only their body-bearing rails and links through the existing atomic primitive plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No filled body proxy, hidden collider, guessed padding thickness, material coefficient, species branch or source measurement is introduced.
 */
export namespace QuadrupedEquipmentBearing {
  /**
   * Seat a neck-parallel rail and connect its midpoint to the actual beam.
   *
   * @param plan The current complete-equipment preflight, before builder emission.
   * @param rig Actual canonical neck axis and cylinder radius, metres.
   * @param yoke Already admitted authored yoke dimensions.
   * @param beam The existing real lateral beam's midpoint; its clearance stays unchanged.
   * @param color Display color without a physical-material inference.
   * @evidence contracts/development/common.md#meaningful-documentation States real neck tangency, a positive axial span centred on neckAt and restricted to the finite neck, the original beam endpoint and omission of an exactly zero connecting span.
   * @evidence contracts/development/implementation.md#principled-implementation The upward sagittal normal to the actual neck axis offsets the bearing axis by neckRadius+beamRadius. Two beam radii give its authored coarse axial length, clipped only to the finite neck endpoints. Its midpoint joins the actual clear beam; the original beam placement lies in the exterior tangent half-space, so the connecting cylinder cannot cut the neck.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the actual neck direction and upper normal, record one tangent bearing cylinder and then its nonzero beam link through the shared planner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Original beam and hitch geometry/clearance do not move. The support is visible geometry with ordinary volume and mass, not an affordance marker or a gap hidden by increased tolerance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant vector arithmetic and at most two actual rods; their existing additional-sphere admission is O(S) for S emitted body spheres.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the actual rig axis, existing authored radius and already planned beam centre; the common primitive plan owns admission and eventual emission.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only at most two scalar primitive records enter the caller's plan; no rig, source geometry, completed model or external resource is retained.
   */
  export function yoke(
    plan: QuadrupedEquipmentPlan,
    rig: QuadrupedBody.IRig,
    yoke: NonNullable<QuadrupedEquipment.IParams["yoke"]>,
    beam: IAutoMovieVector3,
    color: string,
  ): void {
    const axis: IAutoMovieVector3 = Vector3.subtract(rig.poll, rig.neck);
    const length: number = Vector3.length(axis);
    const direction: IAutoMovieVector3 = Vector3.scale(axis, 1 / length);
    const normal: IAutoMovieVector3 = {
      x: 0,
      y: direction.z,
      z: -direction.y,
    };
    const offset: IAutoMovieVector3 = Vector3.scale(
      normal,
      rig.neckRadius + yoke.radius,
    );
    const low: number = Math.max(0, yoke.neckAt - yoke.radius);
    const high: number = Math.min(length, yoke.neckAt + yoke.radius);
    const from: IAutoMovieVector3 = point(low);
    const to: IAutoMovieVector3 = point(high);
    const middle: IAutoMovieVector3 = Vector3.scale(Vector3.add(from, to), 0.5);
    plan.rod("yoke-bearing", yoke.radius, from, to, color, yoke.clearance);
    join(
      plan,
      "yoke-bearing-link",
      yoke.radius,
      middle,
      beam,
      color,
      yoke.clearance,
    );

    /** An axis station and the actual shared tangency normal define each endpoint. */
    function point(station: number): IAutoMovieVector3 {
      return Vector3.add(
        Vector3.add(rig.neck, Vector3.scale(direction, station)),
        offset,
      );
    }
  }

  /**
   * Seat one longitudinal rail on the closed upper flank and join both frame ends.
   *
   * @param plan The current atomic equipment preflight.
   * @param rig Actual trunk capsule's centre height and radius, metres.
   * @param pack Already admitted authored pack dimensions and axial fit.
   * @param side The existing side identity used by the frame's real parts.
   * @param rail The corresponding existing upper frame rail's midpoint.
   * @param color Display color without a material-physics inference.
   * @evidence contracts/development/common.md#meaningful-documentation States actual flank line contact with nonnegative-Y normal, positive axial overlap, authored rail radius, two end connections and unchanged free-frame placement; side contact is geometric connection without a gravity or friction claim.
   * @evidence contracts/development/implementation.md#principled-implementation Select the closest closed-upper-flank vertex of the engine's shared radial primitive profile whose tangent half-space contains the actual frame rail with its radius. The body and bearing have the same +Z axis placement and opposite vertices of that same even profile, so both analytic circles and displayed polygonal courses touch. The side vertex remains feasible because the admitted frame X distance is barrel+clearance+thickness/2 and thickness/2 is at least railRadius. Positive axial overlap and exterior connecting cylinders retain the original body and frame boundaries.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Select one feasible common-profile normal from the actual body and rail, record its parallel tangent bearing and connect corresponding axial endpoints. The closed upper quadrant includes the side station, preserving narrow positive pads and zero clearance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the existing public primitive angular profile without changing its resolution, reading back a mesh, shifting inside the analytic collider, selecting a species/fixture angle or relaxing a contact tolerance.
   * @evidence contracts/development/implementation.md#efficient-algorithms A bounded quarter-profile scan and three actual rods per side; existing additional-sphere checks remain O(S), without model regeneration, iterative fitting or a collision solver.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both sides use the same projection and authored dimensions; real primitive admission and emission stay with the common plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Three independent scalar rod records enter the call-local plan; no caller rig, completed geometry, cache or external handle is retained.
   */
  export function pack(
    plan: QuadrupedEquipmentPlan,
    rig: QuadrupedBody.IRig,
    pack: NonNullable<QuadrupedEquipment.IParams["pack"]>,
    side: "left" | "right",
    rail: IAutoMovieVector3,
    color: string,
  ): void {
    const centre: IAutoMovieVector3 = {
      x: 0,
      y: rig.back - rig.barrel,
      z: 0,
    };
    const outward: IAutoMovieVector3 = Vector3.subtract(rail, centre);
    const normal: IAutoMovieVector3 = packNormal(
      plan,
      outward,
      rig.barrel + pack.railRadius,
    );
    const at: IAutoMovieVector3 = Vector3.add(
      centre,
      Vector3.scale(normal, rig.barrel + pack.railRadius),
    );
    plan.rod(
      `pack-${side}-bearing`,
      pack.railRadius,
      { ...at, z: -pack.length / 2 },
      { ...at, z: pack.length / 2 },
      color,
      pack.clearance,
    );
    for (const end of [-1, 1] as const)
      join(
        plan,
        `pack-${side}-bearing-link-${end}`,
        pack.railRadius,
        { ...at, z: (end * pack.length) / 2 },
        { ...rail, z: (end * pack.length) / 2 },
        color,
        pack.clearance,
      );
  }

  /**
   * Choose the nearest shared closed-upper-flank vertex that admits a straight link.
   * The common +Z placement maps the primitive's radial XZ plane onto model XY;
   * both ends of the contact use opposite vertices of its same even profile.
   * A link centre must stay at least the sum of radii above the body's tangent
   * plane, because its whole circular section must stay outside that plane.
   */
  function packNormal(
    plan: QuadrupedEquipmentPlan,
    frame: IAutoMovieVector3,
    separation: number,
  ): IAutoMovieVector3 {
    let selected: IAutoMovieVector3 | undefined;
    let best: number = -Infinity;
    for (
      let station: number = 0;
      station <= PRIMITIVE_RADIAL_SEGMENTS / 4;
      station++
    ) {
      const angle: number = (2 * Math.PI * station) / PRIMITIVE_RADIAL_SEGMENTS;
      const normal: IAutoMovieVector3 = {
        x: Math.sign(frame.x) * Math.cos(angle),
        y: Math.sin(angle),
        z: 0,
      };
      const projection: number = Vector3.dot(normal, frame);
      if (projection >= separation && projection > best) {
        selected = normal;
        best = projection;
      }
    }
    if (selected === undefined)
      plan.refuse(
        "pack.bearing",
        { frame, separation },
        "no shared closed-upper-flank primitive profile vertex can connect to the frame without crossing the body's tangent plane",
        "supply finite frame dimensions with lateral distance at least the body and bearing radii combined",
      );
    return selected;
  }

  /** Coincident axes already join; every positive connecting span is a real rod. */
  function join(
    plan: QuadrupedEquipmentPlan,
    id: string,
    radius: number,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    color: string,
    clearance: number,
  ): void {
    if (Vector3.length(Vector3.subtract(to, from)) > 0)
      plan.rod(id, radius, from, to, color, clearance);
  }
}
