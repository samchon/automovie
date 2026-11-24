import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";

import { everydayTake } from "../../features/internal/everydayTake";
import type { motionComplaints } from "../../features/internal/motionComplaints";
import { motionActionUnit } from "./motionActionUnit";

/**
 * One write stroke checked on its own (`.agents/skills/motion/laws/
 * verification.md`): the held tool's tip read in the writing surface's frame
 * against the authored vertices (`IAutoMovieMotionHumanWrite`).
 */
export namespace motionStrokeUnit {
  /**
   * A world point in a fixed prop's affordance frame at a second: `+Y` out of
   * the affordance, as a writing surface's normal
   * (`IAutoMovieMotionHumanWrite`).
   *
   * @param take The take.
   * @param model The prop's model.
   * @param subject The prop's subject.
   * @param id The affordance.
   * @param point The world point, metres.
   * @param seconds Film seconds.
   * @returns The point in the affordance's frame, metres.
   */
  export function local(
    take: HumanPerformance,
    model: everydayTake.IPosable,
    subject: string,
    id: string,
    point: IAutoMovieVector3,
    seconds: number,
  ): IAutoMovieVector3 {
    const site: IAutoMovieAffordance = (model.affordances ?? []).find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    )!;
    const frame: IAutoMovieRigidTransform = take.prop(subject, seconds);
    const origin: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, site.frame.translation),
    );
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      frame.rotation,
      site.frame.rotation,
    );
    return Quaternion.rotateVector(
      Quaternion.inverse(rotation),
      Vector3.subtract(point, origin),
    );
  }

  /**
   * One write stroke a unit checks: the held tool's tip on a fixed surface
   * through authored vertices.
   */
  export interface IStroke {
    /** The performer. */
    subject: string;

    /** The tool's subject and model. */
    tool: string;

    /** The tool's model. */
    toolModel: everydayTake.IPosable;

    /** The tool's working point. */
    tip: string;

    /** The surface prop's subject. */
    on: string;

    /** The surface prop's model. */
    onModel: everydayTake.IPosable;

    /** The writing affordance on it. */
    surface: string;

    /** The authored [X, Z] vertices in the writing affordance's frame, metres. */
    vertices: readonly (readonly [number, number])[];

    /** Which write of the chain, from 1; the first when absent. */
    occurrence?: number;
  }

  /**
   * Check one write's own goal (`IAutoMovieMotionHumanWrite`): from the
   * stroke's start to its end the tool's tip stays on the surface, its height
   * along the surface's normal within `bound` plus the radius the tip declares
   * (the law's mark is as wide as the tip), the tip lies on the first vertex at
   * the stroke's start and on the last at its end, and passes every vertex
   * between within the same bound. The stroke is read at 240 Hz, ten times the
   * film rate, so a crossing between frames is seen.
   *
   * @param checks The spec's gatherer.
   * @param label The case, for the failures.
   * @param take The take.
   * @param written The stroke.
   * @param bound How near the tip stays to the surface and its vertices,
   *   metres.
   * @returns The write's segment.
   */
  export function stroke(
    checks: motionComplaints.IGatherer,
    label: string,
    take: HumanPerformance,
    written: IStroke,
    bound: number,
  ): IAutoMovieMotionHumanSegment {
    const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
      take,
      written.subject,
      "write",
      written.occurrence ?? 1,
    );
    const from: number = motionActionUnit.event(act, "strokeStart");
    const to: number = motionActionUnit.event(act, "strokeEnd");
    const radius: number =
      (written.toolModel.affordances ?? []).find(
        (a: IAutoMovieAffordance): boolean => a.id === written.tip,
      )?.radius ?? 0;
    const at: (seconds: number) => IAutoMovieVector3 = (
      seconds: number,
    ): IAutoMovieVector3 =>
      local(
        take,
        written.onModel,
        written.on,
        written.surface,
        everydayTake.point(
          take,
          written.toolModel,
          written.tool,
          written.tip,
          seconds,
        ),
        seconds,
      );
    const steps: number = Math.max(
      2,
      Math.ceil((to - from) * motionActionUnit.RATE * 10),
    );
    const samples: IAutoMovieVector3[] = Array.from(
      { length: steps + 1 },
      (_v: unknown, k: number): IAutoMovieVector3 =>
        at(from + ((to - from) * k) / steps),
    );
    const height: number = Math.max(
      ...samples.map((p: IAutoMovieVector3): number => Math.abs(p.y)),
    );
    checks.check(
      `${label}: the ${written.tool}'s ${written.tip} stays on the ${written.on} through the stroke (${(height * 1000).toFixed(1)} mm off it)`,
      height <= bound + radius,
    );
    const planar: (
      p: IAutoMovieVector3,
      v: readonly [number, number],
    ) => number = (
      p: IAutoMovieVector3,
      v: readonly [number, number],
    ): number => Math.hypot(p.x - v[0], p.z - v[1]);
    const first: number = planar(samples[0]!, written.vertices[0]!);
    const last: number = planar(samples.at(-1)!, written.vertices.at(-1)!);
    checks.check(
      `${label}: the stroke starts on its first vertex (${(first * 1000).toFixed(1)} mm) and ends on its last (${(last * 1000).toFixed(1)} mm)`,
      first <= bound + radius && last <= bound + radius,
    );
    written.vertices
      .slice(1, -1)
      .forEach((v: readonly [number, number], i: number): void => {
        const nearest: number = Math.min(
          ...samples.map((p: IAutoMovieVector3): number => planar(p, v)),
        );
        checks.check(
          `${label}: the stroke passes vertex ${i + 2} (${(nearest * 1000).toFixed(1)} mm)`,
          nearest <= bound + radius,
        );
      });
    return act;
  }
}
