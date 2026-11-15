import { Quaternion, Vector3, physicalShapeBounds } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanObject } from "./HumanObject";
import type { IHumanProp } from "./IHumanProp";

/**
 * What stands in a person's way: a wall, a piece of furniture, a door frame,
 * each a solid of the scene with the openings a person may pass through.
 *
 * An obstacle is a convex footprint on the floor with the heights its solid
 * spans, and its apertures: an opening is a line across the footprint with
 * a clear width and a clear height (a doorway, a gap in a fence, the space
 * under a beam). A law that moves a body across the floor asks `blocking`
 * whether a straight stretch of its path meets a solid, and where: a path
 * that meets none is free, one that crosses an obstacle through an opening
 * wide and tall enough for the body is free too, and any other is blocked,
 * with the reason a refusal reports (a wall in the way, an opening too
 * narrow, too little headroom).
 *
 * Nothing here plans a way round: a law refuses or steers, and the
 * production's own path gives the way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what an obstacle and an aperture are, what `blocking` answers with its three reasons, and what is out of scope.
 * @evidence contracts/development/design.md#principled-representation A solid is a convex prism on the floor plan and an opening a segment of it with its clear width and height, the two measures a body's passage is decided by.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two records, a wall and an object as obstacles (`wall`, `object`), an object's openings, and one query; `HumanPerformance.IInput.obstacles` gives them and `IHumanActionContext.obstacles` reads them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No object kind is named: a door's opening is its `aperture` affordance, read like any object's.
 */
export namespace HumanObstacle {
  /** A solid of the scene on the floor plan. */
  export interface IObstacle {
    /** Its subject id, which a refusal names. */
    subject: string;

    /** Its footprint on the floor: a convex polygon's corners in order, world metres; `y` is not read. */
    footprint: readonly IAutoMovieVector3[];

    /** The height its solid starts at, metres above the floor: 0 for a wall, the underside of a beam. */
    bottom: number;

    /** The height its solid ends at, metres above the floor. */
    top: number;

    /** Its openings; none when absent. */
    apertures?: readonly IAperture[];
  }

  /** An opening through an obstacle. */
  export interface IAperture {
    /** Its id within the obstacle. */
    id: string;

    /** The middle of its sill on the floor plan, world metres; `y` is the sill's height. */
    at: IAutoMovieVector3;

    /** The level unit direction its width runs along, world. */
    across: IAutoMovieVector3;

    /** Its clear width, metres. */
    width: number;

    /** Its clear height above the sill, metres. */
    height: number;
  }

  /** What a body needs of a passage. */
  export interface INeed {
    /** The width it takes, metres: the shoulders' breadth for a body that walks facing its way. */
    breadth: number;

    /** The height it takes, metres: the stature for a body that stands. */
    height: number;
  }

  /** Why a path is blocked, as data: a solid with no opening on the path, an opening narrower than the body, or one lower than it. */
  export const CAUSES = ["solid", "narrow", "headroom"] as const;

  /** Where and why a path is blocked. */
  export interface IBlock {
    /** The obstacle. */
    subject: string;

    /** Where the path first meets the obstacle's footprint, world metres on the floor. */
    at: IAutoMovieVector3;

    /** How far along the path that is, metres from its start. */
    distance: number;

    /** Why: a solid with no opening on the path, an opening narrower than the body, or one lower than it. */
    cause: (typeof CAUSES)[number];

    /** The opening the path goes through, for `narrow` and `headroom`. */
    aperture?: string;

    /** The measure that falls short and what it would have to be, metres, for `narrow` and `headroom`. */
    short?: { has: number; needs: number };
  }

  /**
   * A straight wall as an obstacle.
   *
   * @param subject Its subject id.
   * @param from One end of its centre line on the floor, world metres.
   * @param to The other end.
   * @param thickness Its thickness, metres.
   * @param height Its height, metres.
   * @param apertures Its openings.
   * @returns The obstacle.
   * @throws {Error} When the two ends coincide, or the thickness or the height is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input with its unit and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation A wall's footprint is the rectangle half its thickness either side of its centre line.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One direction, one normal and four corners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A wall of no length, thickness or height is refused.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function wall(
    subject: string,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    thickness: number,
    height: number,
    apertures: readonly IAperture[] = [],
  ): IObstacle {
    const length: number = Math.hypot(to.x - from.x, to.z - from.z);
    if (!(length > 0) || !(thickness > 0) || !(height > 0))
      throw new Error(
        `The wall ${subject} needs two different ends, a positive thickness and a positive height`,
      );
    const half: number = thickness / 2;
    const nx: number = (-(to.z - from.z) / length) * half;
    const nz: number = ((to.x - from.x) / length) * half;
    return {
      subject,
      footprint: [
        { x: from.x + nx, y: 0, z: from.z + nz },
        { x: to.x + nx, y: 0, z: to.z + nz },
        { x: to.x - nx, y: 0, z: to.z - nz },
        { x: from.x - nx, y: 0, z: from.z - nz },
      ],
      bottom: 0,
      top: height,
      ...(apertures.length === 0 ? {} : { apertures }),
    };
  }

  /**
   * The openings an object declares, placed in the world: each `aperture`
   * affordance with its width along the contact's `+X` and its height along
   * `+Y`, as the affordance record states them.
   *
   * @param model The object.
   * @param placement Where the scene puts it.
   * @returns Its openings; an `aperture` that states no width or no height is left out, since nothing says how much it clears.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read, in which axes, and what is left out.
   * @evidence contracts/development/implementation.md#principled-implementation The affordance record gives an aperture's width along `+X` centred on its frame and its height along `+Y` from it, so the placed frame's origin is the sill's middle and its turned `+X`, made level, the direction of the width.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the affordances.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No width or height is assumed for an aperture that states none.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the affordances.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Places the object with `HumanObject.frame`, as its seats and props are placed.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function apertures(
    model: HumanObject.IModel,
    placement: HumanObject.Placement,
  ): IAperture[] {
    const placed: IHumanProp.IFrame = HumanObject.frame(placement);
    const out: IAperture[] = [];
    for (const affordance of model.affordances ?? []) {
      if (
        affordance.kind !== "aperture" ||
        affordance.width === undefined ||
        affordance.height === undefined
      )
        continue;
      const local: IAutoMovieAffordance["frame"] = affordance.frame;
      const origin: IAutoMovieVector3 = Quaternion.rotateVector(
        placed.rotation,
        local.translation,
      );
      const x: IAutoMovieVector3 = Quaternion.rotateVector(
        placed.rotation,
        Quaternion.rotateVector(local.rotation, { x: 1, y: 0, z: 0 }),
      );
      const level: number = Math.hypot(x.x, x.z);
      if (!(level > 0)) continue;
      out.push({
        id: affordance.id,
        at: {
          x: placed.position.x + origin.x,
          y: placed.position.y + origin.y,
          z: placed.position.z + origin.z,
        },
        across: { x: x.x / level, y: 0, z: x.z / level },
        width: affordance.width,
        height: affordance.height,
      });
    }
    return out;
  }

  /** How far the polygon that stands for a round collider's outline on the floor may lie outside it, metres (provisional: a millimetre, under any clearance a passage is judged by). */
  export const ROUND: number = 0.001;

  /**
   * A placed object as an obstacle, from its own colliders and openings.
   *
   * The footprint is the convex hull, on the floor plan, of the object's
   * colliders where the placement puts them: a box's corners and a hull's
   * vertices exactly, and a sphere's or a capsule's round outline (a capsule
   * projects to the hull of its two end spheres' discs) as the regular
   * polygon whose edges touch the disc, with enough sides that its corners
   * stand within `ROUND` of it, so the footprint never leaves out any of the
   * solid. The bottom and the top are the colliders' least and greatest
   * heights, and the openings are the object's `aperture` affordances
   * (`apertures`).
   *
   * @param subject Its subject id.
   * @param model The object, whose colliders (`shapes`) say where its solid stands.
   * @param placement Where the scene puts it.
   * @returns The obstacle.
   * @throws {Error} When the object has no colliders, or its colliders cover no area of the floor plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each part of the obstacle is read from, how a round collider is outlined and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The floor-plan shadow of a convex solid is the convex hull of its vertices' shadows, and a ball's is a disc; the hull of the corners is Andrew's monotone chain (Andrew 1979, Inf Process Lett 9:216), and a disc's circumscribed regular polygon of n sides stands at most r(sec(pi/n) - 1) outside it. The heights are the engine's exact bounds of each placed collider.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the colliders for their corners and heights, one hull, the openings reused.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No box is assumed round an object: the solid is its own colliders', and an object without them, or whose colliders stand on no area, is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the colliders' corners and the hull n log n in them, once per obstacle.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Places the object with `HumanObject.frame` and reads its openings with `apertures` and its heights with `physicalShapeBounds`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function object(
    subject: string,
    model: HumanObject.IModel,
    placement: HumanObject.Placement,
  ): IObstacle {
    const shapes: IAutoMoviePhysicalProfile.IShape[] = model.shapes?.() ?? [];
    if (shapes.length === 0)
      throw new Error(
        `The object ${subject} has no colliders, so nothing says where its solid stands: give it shapes, or state it as a wall`,
      );
    const placed: IHumanProp.IFrame = HumanObject.frame(placement);
    const corners: IAutoMovieVector3[] = [];
    let bottom: number = Infinity;
    let top: number = -Infinity;
    for (const shape of shapes) {
      const bounds: { min: IAutoMovieVector3; max: IAutoMovieVector3 } =
        physicalShapeBounds(placed, shape);
      bottom = Math.min(bottom, bounds.min.y);
      top = Math.max(top, bounds.max.y);
      const centre: IAutoMovieVector3 = Vector3.add(
        placed.position,
        Quaternion.rotateVector(placed.rotation, shape.transform.position),
      );
      const rotation: IAutoMovieQuaternion = Quaternion.multiply(
        placed.rotation,
        shape.transform.rotation,
      );
      const at = (local: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(centre, Quaternion.rotateVector(rotation, local));
      if (shape.kind === "box") {
        const h: IAutoMovieVector3 = shape.halfExtents;
        for (const x of [-1, 1])
          for (const y of [-1, 1])
            for (const z of [-1, 1])
              corners.push(at({ x: x * h.x, y: y * h.y, z: z * h.z }));
      } else if (shape.kind === "hull")
        for (const point of shape.points) corners.push(at(point));
      else if (shape.kind === "sphere") disc(corners, centre, shape.radius);
      else {
        for (const end of [-1, 1])
          disc(
            corners,
            at({ x: 0, y: end * shape.halfLength, z: 0 }),
            shape.radius,
          );
      }
    }
    const footprint: IAutoMovieVector3[] = hull(corners);
    if (footprint.length < 3)
      throw new Error(
        `The object ${subject}'s colliders cover no area of the floor plan, so they stand in no path's way`,
      );
    const openings: IAperture[] = apertures(model, placement);
    return {
      subject,
      footprint,
      bottom,
      top,
      ...(openings.length === 0 ? {} : { apertures: openings }),
    };
  }

  /** Adds the corners of the regular polygon whose edges touch a ball's disc on the floor plan, with enough sides that they stand within `ROUND` of it. */
  const disc = (
    out: IAutoMovieVector3[],
    centre: IAutoMovieVector3,
    radius: number,
  ): void => {
    const sides: number = Math.max(
      3,
      Math.ceil(Math.PI / Math.acos(radius / (radius + ROUND))),
    );
    const reach: number = radius / Math.cos(Math.PI / sides);
    for (let k: number = 0; k < sides; k++) {
      const angle: number = (2 * Math.PI * k) / sides;
      out.push({
        x: centre.x + reach * Math.cos(angle),
        y: 0,
        z: centre.z + reach * Math.sin(angle),
      });
    }
  };

  /** The convex hull of points on the floor plan, its corners in order with none on a straight run (Andrew's monotone chain); `y` is 0. */
  const hull = (points: readonly IAutoMovieVector3[]): IAutoMovieVector3[] => {
    const sorted: IAutoMovieVector3[] = [...points].sort(
      (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
        a.x - b.x || a.z - b.z,
    );
    const turn = (
      o: IAutoMovieVector3,
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
    ): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    const chain = (
      order: readonly IAutoMovieVector3[],
    ): IAutoMovieVector3[] => {
      const out: IAutoMovieVector3[] = [];
      for (const p of order) {
        while (
          out.length >= 2 &&
          turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0
        )
          out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    if (sorted.length < 3) return [];
    return [...chain(sorted), ...chain([...sorted].reverse())].map(
      (p: IAutoMovieVector3): IAutoMovieVector3 => ({ x: p.x, y: 0, z: p.z }),
    );
  };

  /**
   * The first obstacle a straight stretch of a path cannot pass, if any.
   *
   * @param obstacles The scene's obstacles.
   * @param from Where the stretch starts on the floor, world metres.
   * @param to Where it ends.
   * @param need What the body needs of a passage.
   * @returns The nearest block along the stretch, or null when the stretch is free.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the meaning of null.
   * @evidence contracts/development/implementation.md#principled-implementation A segment is clipped against a convex footprint edge by edge (Cyrus and Beck 1978); a footprint whose solid lies wholly above the body's height or below the floor is passed under or over. A crossing is through an opening when the segment crosses the opening's line inside its width: it is free when the opening leaves half the body's breadth either side of the crossing and its height is the body's, and otherwise blocked with the measure that falls short.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clip per obstacle, one test per opening, and the nearest block kept.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A stretch that starts inside a footprint is blocked at its start; nothing is rounded in the body's favour.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the obstacles' edges and openings, which a scene has few of.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function blocking(
    obstacles: readonly IObstacle[],
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    need: INeed,
  ): IBlock | null {
    const dx: number = to.x - from.x;
    const dz: number = to.z - from.z;
    const length: number = Math.hypot(dx, dz);
    let nearest: IBlock | null = null;
    for (const obstacle of obstacles) {
      if (obstacle.bottom >= need.height || obstacle.top <= 0) continue;
      const entered: number | null = enters(obstacle.footprint, from, dx, dz);
      if (entered === null) continue;
      // A solid that starts above the floor and below the body's height (a
      // beam, a lintel) leaves too little headroom under it.
      const block: IBlock | null =
        obstacle.bottom > 0
          ? {
              subject: obstacle.subject,
              at: from,
              distance: 0,
              cause: "headroom",
              short: { has: obstacle.bottom, needs: need.height },
            }
          : judged(obstacle, from, dx, dz, need);
      if (block === null) continue;
      const distance: number = entered * length;
      if (nearest === null || distance < nearest.distance)
        nearest = {
          ...block,
          at: { x: from.x + dx * entered, y: 0, z: from.z + dz * entered },
          distance,
        };
    }
    return nearest;
  }

  /** Why a path that enters an obstacle is blocked by it, or null when it goes through an opening that clears the body. */
  const judged = (
    obstacle: IObstacle,
    from: IAutoMovieVector3,
    dx: number,
    dz: number,
    need: INeed,
  ): IBlock | null => {
    const solid: IBlock = {
      subject: obstacle.subject,
      at: from,
      distance: 0,
      cause: "solid",
    };
    for (const aperture of obstacle.apertures ?? []) {
      // Where the path crosses the opening's line, as a share of the path
      // and as a signed distance from the opening's middle along its width.
      const cross: number = dx * aperture.across.z - dz * aperture.across.x;
      if (Math.abs(cross) < 1e-12) continue;
      const ax: number = aperture.at.x - from.x;
      const az: number = aperture.at.z - from.z;
      const share: number =
        (ax * aperture.across.z - az * aperture.across.x) / cross;
      if (share < 0 || share > 1) continue;
      const offset: number = (ax * dz - az * dx) / cross;
      if (Math.abs(offset) > aperture.width / 2) continue;
      const room: number = 2 * (aperture.width / 2 - Math.abs(offset));
      if (room < need.breadth)
        return {
          ...solid,
          cause: "narrow",
          aperture: aperture.id,
          short: { has: room, needs: need.breadth },
        };
      if (aperture.height < need.height)
        return {
          ...solid,
          cause: "headroom",
          aperture: aperture.id,
          short: { has: aperture.height, needs: need.height },
        };
      return null;
    }
    return solid;
  };

  /** The share of a path at which it enters a convex footprint, or null when it misses it. */
  const enters = (
    footprint: readonly IAutoMovieVector3[],
    from: IAutoMovieVector3,
    dx: number,
    dz: number,
  ): number | null => {
    // The polygon's turning sense, so the inward side of an edge is known
    // whichever way its corners are listed.
    let area: number = 0;
    for (let i: number = 0; i < footprint.length; i++) {
      const p: IAutoMovieVector3 = footprint[i]!;
      const q: IAutoMovieVector3 = footprint[(i + 1) % footprint.length]!;
      area += p.x * q.z - q.x * p.z;
    }
    const sense: number = area >= 0 ? 1 : -1;
    let enter: number = 0;
    let leave: number = 1;
    for (let i: number = 0; i < footprint.length; i++) {
      const p: IAutoMovieVector3 = footprint[i]!;
      const q: IAutoMovieVector3 = footprint[(i + 1) % footprint.length]!;
      // Inside is where this reads positive.
      const ex: number = q.x - p.x;
      const ez: number = q.z - p.z;
      const start: number = sense * (ex * (from.z - p.z) - ez * (from.x - p.x));
      const rate: number = sense * (ex * dz - ez * dx);
      if (Math.abs(rate) < 1e-12) {
        if (start < 0) return null;
        continue;
      }
      const at: number = -start / rate;
      if (rate > 0) enter = Math.max(enter, at);
      else leave = Math.min(leave, at);
      if (enter > leave) return null;
    }
    return enter;
  };
}
