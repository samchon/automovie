import { Vector3, physicalShapeGjk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryHalfStep } from "./HumanArmTrajectoryHalfStep";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * An arm's audit parts as link pairs read them (`HumanAuditModel.certify`):
 * each part's probes, the sphere about them, its own collider shapes as convex
 * solids, how far its probes lie outside them, and how far any point of it lies
 * from its arm segment's origin, the lever its segment's turn moves it by. A
 * pair of a part and a shape is read first as one GJK between the part's solids
 * and the shape, at the waypoint and as casts over the intervals to its
 * neighbouring read waypoints (trajopt's link pairs and cast hulls), and only a
 * pair that reading leaves is read probe by probe.
 */
export namespace HumanArmTrajectoryLinks {
  /** An arm segment a collider rides on. */
  export type Owner = IAutoMovieMotionHumanArmGeometry.IFrame["owners"][number];

  /** One audit part of an arm, placed. */
  export interface ILink {
    /** The part, by its index in the body's tangle model. */
    part: number;

    /** The arm segment it rides on. */
    owner: Owner;

    /** Its collider probes, by index among the placed arm's probes. */
    probes: number[];

    /** The centre of the sphere about its probes, world metres. */
    centre: IAutoMovieVector3;

    /** That sphere's radius, metres. */
    radius: number;

    /**
     * How far any of its probes, or any point of its shapes, lies from its arm
     * segment's origin, metres.
     */
    reach: number;

    /**
     * How far its probes lie outside its own shapes, at most, metres
     * (`AutoMovieMotionHumanAuditTangleModel.IPart.offset`).
     */
    offset: number;

    /** Its own collider shapes placed, as convex solids. */
    solids: physicalShapeGjk.ISolid[];
  }

  /**
   * An arm's parts at a placement with its collider probes.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The waypoint.
   * @param placed The arm placed there, with its collider probes.
   * @returns The parts, in the order their probes first appear.
   */
  export function of(
    c: M.IContext,
    a: number,
    k: number,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
  ): ILink[] {
    const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
    const model: AutoMovieMotionHumanAuditTangleModel.IModel =
      AutoMovieMotionHumanAuditTangleModel.model(c.setups[a]!.body);
    const solids: Map<number, physicalShapeGjk.ISolid[]> = shapes(
      frame,
      placed,
    );
    const links: Map<number, ILink> = new Map();
    for (let probe: number = G.SURFACE; probe < placed.probes.length; ++probe) {
      const part: number = frame.segments[probe - G.SURFACE]!;
      let link: ILink | undefined = links.get(part);
      if (link === undefined) {
        link = {
          part,
          owner: frame.owners[probe - G.SURFACE]!,
          probes: [],
          centre: { x: 0, y: 0, z: 0 },
          radius: 0,
          reach: 0,
          offset: model.parts[part]!.offset,
          solids: solids.get(part) ?? [],
        };
        links.set(part, link);
      }
      link.probes.push(probe);
    }
    for (const link of links.values()) {
      let x: number = 0;
      let y: number = 0;
      let z: number = 0;
      for (const probe of link.probes) {
        const p: IAutoMovieVector3 = placed.probes[probe]![0];
        x += p.x;
        y += p.y;
        z += p.z;
      }
      const count: number = link.probes.length;
      link.centre = { x: x / count, y: y / count, z: z / count };
      const origin: IAutoMovieVector3 = origins(placed)[link.owner];
      for (const probe of link.probes) {
        const p: IAutoMovieVector3 = placed.probes[probe]![0];
        link.radius = Math.max(link.radius, Vector3.distance(p, link.centre));
        link.reach = Math.max(link.reach, Vector3.distance(p, origin));
      }
      for (const solid of link.solids)
        for (const p of solid.points)
          link.reach = Math.max(
            link.reach,
            Vector3.distance(p, origin) + solid.radius,
          );
    }
    return [...links.values()];
  }

  /**
   * An arm's own collider shapes placed, as convex solids, by the audit part
   * each belongs to.
   *
   * @param frame The frame.
   * @param placed The arm placed in it.
   * @returns The solids by part, in the frame's collider order.
   */
  export function shapes(
    frame: IAutoMovieMotionHumanArmGeometry.IFrame,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
  ): Map<number, physicalShapeGjk.ISolid[]> {
    const out: Map<number, physicalShapeGjk.ISolid[]> = new Map();
    for (const shape of S.colliders(frame, placed)) {
      let list: physicalShapeGjk.ISolid[] | undefined = out.get(shape.part);
      if (list === undefined) out.set(shape.part, (list = []));
      list.push(physicalShapeGjk.solid(shape.pose, shape.shape));
    }
    return out;
  }

  /** An arm's solids at one frame of an interval. */
  export interface IStep {
    /** The frame's waypoint. */
    at: number;

    /** The arm's solids there, by part (`shapes`). */
    solids: Map<number, physicalShapeGjk.ISolid[]>;
  }

  /**
   * Each of a part's solids cast over frames of an interval: the convex hull of
   * its places at those frames, each carried into a shape's frame at the
   * interval's first waypoint (`HumanArmTrajectoryHalfStep.carry`): the cast
   * hull of trajopt, the convex hull of consecutive poses (Schulman et al.
   * 2014, section IV-B), over the whole interval or over one frame step of it.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The interval's first waypoint, whose frame of the shape the places
   *   are carried into.
   * @param part The part.
   * @param steps The arm's solids at the frames cast over, in order.
   * @param shape The shape, by its index in the frame at `k`.
   * @returns The casts, one per solid the part has at the first frame.
   */
  export function cast(
    c: M.IContext,
    a: number,
    k: number,
    part: number,
    steps: readonly IStep[],
    shape: number,
  ): physicalShapeGjk.ISolid[] {
    const first: readonly physicalShapeGjk.ISolid[] =
      steps[0]?.solids.get(part) ?? [];
    return first.map(
      (_: physicalShapeGjk.ISolid, i: number): physicalShapeGjk.ISolid => {
        const points: IAutoMovieVector3[] = [];
        let radius: number = 0;
        for (const step of steps) {
          const at: physicalShapeGjk.ISolid | undefined =
            step.solids.get(part)?.[i];
          if (at === undefined) continue;
          radius = Math.max(radius, at.radius);
          for (const p of at.points)
            points.push(
              HumanArmTrajectoryHalfStep.carry(c, a, k, step.at, shape, p)
                .point,
            );
        }
        return { points, radius };
      },
    );
  }
  /**
   * An arm's segments' origins at a placement.
   *
   * @param placed The arm placed.
   * @returns Each segment's origin.
   */
  export function origins(
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
  ): Record<Owner, IAutoMovieVector3> {
    return { upper: placed.shoulder, lower: placed.elbow, hand: placed.wrist };
  }
}
