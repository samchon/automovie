import { AutoMovieEngineGravity, AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetypeCourse,
  type AutoMovieArchetypeConvexCell,
  AutoMovieArchetypeFrame,
} from "../../core";
import type { AutoMovieArchetypeQuadrupedFooting } from "../AutoMovieArchetypeQuadrupedFooting";
import { QuadrupedRestFloor } from "../quadruped/QuadrupedRestFloor";

/*
 * The obstacles an authored footing places across one straight course leg: its
 * poles as rails and the gaps between its planes as ditches.
 */
export namespace EquineObstacle {
  /*
   * One obstacle on the leg's line.
   */
  export interface IObstacle {
    /*
     * Course distance where it begins, metres.
     */
    from: number;
    /*
     * Course distance where it ends, metres.
     */
    to: number;
    /*
     * Its top above the ground, metres; zero for a ditch.
     */
    top: number;
  }

  /*
   * Read the obstacles across a straight leg.
   * Parameter plan: The admitted course plan.
   * Parameter span: The leg's span.
   * Parameter footing: The authored footing, if any.
   * Returns: The obstacles in course order.
   */
  export function read(
    plan: AutoMovieArchetypeCourse.IPlan,
    span: AutoMovieArchetypeCourse.ILegSpan,
    footing: AutoMovieArchetypeQuadrupedFooting.IScene | undefined,
  ): IObstacle[] {
    const origin: AutoMovieArchetypeCourse.IState = plan.at(
      plan.when(span.from),
    );
    const start: IAutoMovieVector3 = origin.placement.translation;
    const ahead: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      origin.placement.rotation,
      { x: 0, y: 0, z: 1 },
    );
    const obstacles: IObstacle[] = [];
    for (const pole of footing?.poles ?? []) {
      const along: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(pole.to, pole.from);
      const cross: number = ahead.x * along.z - ahead.z * along.x;
      if (cross === 0) continue;
      const offset: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(pole.from, start);
      const distance: number =
        (offset.x * along.z - offset.z * along.x) / cross;
      const share: number = (offset.x * ahead.z - offset.z * ahead.x) / cross;
      if (share < 0 || share > 1 || distance <= 0 || distance >= span.span)
        continue;
      const half: number =
        (pole.radius * Math.hypot(along.x, along.z)) / Math.abs(cross);
      obstacles.push({
        from: span.from + distance - half,
        to: span.from + distance + half,
        top: Math.max(pole.from.y, pole.to.y) + pole.radius - start.y,
      });
    }

    // The leg's cover by each plane, by the slab method on X and Z.
    const covered: ICover[] = [];
    for (const plane of footing?.planes ?? []) {
      let low: number = 0;
      let high: number = span.span;
      for (const [origin0, direction, bounds] of [
        [start.x, ahead.x, plane.x],
        [start.z, ahead.z, plane.z],
      ] as const) {
        if (direction === 0) {
          if (origin0 < bounds[0] || origin0 >= bounds[1]) high = -1;
          continue;
        }
        const a: number = (bounds[0] - origin0) / direction;
        const b: number = (bounds[1] - origin0) / direction;
        low = Math.max(low, Math.min(a, b));
        high = Math.min(high, Math.max(a, b));
      }
      if (high > low) covered.push({ low, high });
    }
    covered.sort((a: ICover, b: ICover): number => a.low - b.low);
    let reach: number | undefined;
    for (const { low, high } of covered) {
      if (reach !== undefined && low > reach)
        obstacles.push({
          from: span.from + reach,
          to: span.from + low,
          top: 0,
        });
      reach = reach === undefined ? high : Math.max(reach, high);
    }
    return obstacles.sort(
      (a: IObstacle, b: IObstacle): number => a.from - b.from,
    );
  }

  /*
   * The extra flight seconds that would lift every displayed part over every
   * obstacle by the clearance, measured on the flown ride.
   * Parameter plan: The course plan.
   * Parameter start: Course distance of the jump leg's start, metres.
   * Parameter obstacles: The leg's obstacles.
   * Parameter clearance: The authored clearance, metres.
   * Parameter takeoff: Film second of final hind liftoff.
   * Parameter landing: Film second of first fore landing.
   * Parameter sample: The displayed parts and placement at a film second.
   * Returns: The signed change of flight seconds the tightest part asks for:
   * positive where a part falls short of the clearance, negative by the
   * surplus the tightest part keeps, zero when no part passes over an
   * obstacle.
   */
  export function shortfall(
    plan: AutoMovieArchetypeCourse.IPlan,
    start: number,
    obstacles: readonly IObstacle[],
    clearance: number,
    takeoff: number,
    landing: number,
    sample: (seconds: number) => ISample,
  ): number {
    const leg: IAutoMovieTransform = plan.at(plan.when(start)).placement;
    const inverse: IAutoMovieTransform = {
      rotation: AutoMovieEngineQuaternion.inverse(leg.rotation),
      translation: AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.inverse(leg.rotation),
        AutoMovieEngineVector3.scale(leg.translation, -1),
      ),
      scale: AutoMovieArchetypeFrame.UNIT,
    };
    let extra: number = -Infinity;
    for (let at: number = takeoff + STEP; at < landing; at += STEP) {
      const current: ISample = sample(at);
      const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
        inverse,
        current.placement,
      );
      for (const part of current.parts) {
        if (
          part.geometry.type === "primitive"
            ? part.geometry.shape.type === "plane"
            : current.cells?.get(part.id)?.geometry !== part.geometry
        )
          continue;
        const [low, rear, front]: readonly number[] = [
          AutoMovieEngineQuaternion.identity(),
          AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
          AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
        ].map((rotation: IAutoMovieQuaternion): number =>
          QuadrupedRestFloor(
            {
              ...part,
              transform: AutoMovieArchetypeFrame.compose(
                {
                  rotation,
                  translation: { x: 0, y: 0, z: 0 },
                  scale: AutoMovieArchetypeFrame.UNIT,
                },
                AutoMovieArchetypeFrame.compose(frame, part.transform!),
              ),
            },
            current.cells,
          ),
        );
        for (const obstacle of obstacles) {
          const short: number = obstacle.top + clearance - low!;
          if (-front! > obstacle.from - start && rear! < obstacle.to - start)
            extra = Math.max(
              extra,
              short / ((AutoMovieEngineGravity.STANDARD / 2) * (at - takeoff)),
            );
        }
      }
    }
    return extra !== -Infinity ? extra : 0;
  }

  /*
   * The displayed parts and placement a flown ride shows at one second.
   */
  export interface ISample {
    /*
     * Model-space parts.
     */
    parts: readonly IAutoMovieModelPart[];
    /*
     * Admitted solids with the same geometry identity as the displayed parts.
     */
    cells?: AutoMovieArchetypeConvexCell.Table;
    /*
     * The root's world placement.
     */
    placement: IAutoMovieTransform;
  }

  /*
   * Seconds between flight samples: 5 ms, so a part crossing a 0.1 m rail at a
   * 5 m/s canter is sampled about four times.
   */
  const STEP: number = 0.005;

  /*
   * One plane's cover of the leg, metres from the leg's start.
   */
  interface ICover {
    /*
     * Where the cover begins.
     */
    low: number;
    /*
     * Where it ends.
     */
    high: number;
  }
}
