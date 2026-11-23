import { PRIMITIVE_RADIAL_SEGMENTS, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedEquipment } from "./AutoMovieArchetypeQuadrupedEquipment";
import type { QuadrupedEquipmentPlan } from "./QuadrupedEquipmentPlan";

/**
 * Visible body-bearing rails connecting the body to its clear frame.
 *
 * Each rail is a real finite cylinder tangent along a positive axial interval
 * to the neck cylinder or trunk capsule's cylindrical course. These coarse line
 * contacts establish a geometric support path, not compliant padding, a
 * pressure distribution, restraint or a rated dynamic load capacity. Pack
 * contacts use the shared radial primitive profile's vertices, so the analytic
 * circles and their displayed polygonal courses both meet.
 */
export namespace QuadrupedEquipmentBearing {
  /**
   * Seat a neck-parallel rail and connect its midpoint to the beam.
   *
   * @param plan The current complete-equipment preflight, before builder
   *   emission.
   * @param rig Canonical neck axis and cylinder radius, metres.
   * @param yoke Already admitted authored yoke dimensions.
   * @param beam The existing real lateral beam's midpoint; its clearance stays
   *   unchanged.
   * @param color Display color without a physical-material inference.
   */
  export function yoke(
    plan: QuadrupedEquipmentPlan,
    rig: AutoMovieArchetypeQuadrupedBody.IRig,
    yoke: AutoMovieArchetypeQuadrupedEquipment.IYoke,
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

    /** An axis station and the shared tangency normal define each endpoint. */
    function point(station: number): IAutoMovieVector3 {
      return Vector3.add(
        Vector3.add(rig.neck, Vector3.scale(direction, station)),
        offset,
      );
    }
  }

  /**
   * Seat one longitudinal rail on the closed upper flank and join both frame
   * ends.
   *
   * @param plan The current atomic equipment preflight.
   * @param rig Trunk capsule's centre height and radius, metres.
   * @param pack Already admitted authored pack dimensions and axial fit.
   * @param side The existing side identity used by the frame's real parts.
   * @param rail The corresponding existing upper frame rail's midpoint.
   * @param color Display color without a material-physics inference.
   */
  export function pack(
    plan: QuadrupedEquipmentPlan,
    rig: AutoMovieArchetypeQuadrupedBody.IRig,
    pack: AutoMovieArchetypeQuadrupedEquipment.IPack,
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
   * Choose the nearest shared closed-upper-flank vertex that admits a straight
   * link. The common +Z placement maps the primitive's radial XZ plane onto
   * model XY; both ends of the contact use opposite vertices of its same even
   * profile. A link centre must stay at least the sum of radii above the body's
   * tangent plane, because its whole circular section must stay outside that
   * plane.
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
