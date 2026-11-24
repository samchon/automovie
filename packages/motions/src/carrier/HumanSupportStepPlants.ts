import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSurface,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The footprints of a support step (`HumanSupportStep`): which support each of
 * the walk's plants bears on, read from the supports' declared surfaces where
 * the foot lands, and how far a footprint is slid to keep off an edge or lifted
 * onto a moving surface it arrives on.
 */
export namespace HumanSupportStepPlants {
  /**
   * How far above or below a surface a footprint may lie and still bear on it,
   * metres: a tread's or a comb plate's own thickness (provisional).
   */
  export const BEARING: number = 0.1;

  /**
   * The cosine between a footprint's length and an edge's normal past which the
   * footprint crosses the edge more head-on than side-on: 45 degrees.
   */
  export const HEAD_ON: number = Math.SQRT1_2;

  /** One plant of a foot on the planned walk and the support it bears on. */
  export interface IPlant {
    /** The planned window. */
    window: IAutoMovieMotionHumanContactWindow;

    /** Whether it bears on the support arrived on rather than the one left. */
    arrived: boolean;

    /** Its touchdown, seconds of the step. */
    down: number;

    /**
     * How far it is slid along a surface to keep off an edge, and lifted onto a
     * moving surface it arrives on, world metres.
     */
    shift: IAutoMovieVector3;

    /** The height of the fixed landing it bears on, world metres. */
    floor: number;
  }

  /** One declared surface of a support in the world. */
  export interface ISurface {
    /** Its centre. */
    origin: IAutoMovieVector3;

    /** Its frame's world rotation: +Y up, width along X, depth along Z. */
    rotation: IAutoMovieQuaternion;

    /** Its extent along X, metres. */
    width: number;

    /** Its extent along Z, metres. */
    depth: number;
  }

  /**
   * A point moved by a support's motion between two seconds of the step; the
   * ground keeps it.
   */
  export type Moved = (
    prop: string | undefined,
    begin: number,
    end: number,
    point: IAutoMovieVector3,
  ) => IAutoMovieVector3;

  /** What the assignment reads of the step. */
  export interface IStep {
    /** The step's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSurface.ISupportStepParams>;

    /** A point moved by a support's motion. */
    moved: Moved;

    /** The height the walk is planned at, world metres. */
    level: number;

    /**
     * How far the entry's soles sit from the declared surface they stand on,
     * metres.
     */
    settled: number;
  }

  /** What a support's surfaces are read from: the step's start and props. */
  export interface ISurfacesContext {
    /** The step's start, film seconds. */
    start: number;

    /** A support's affordances and its frame at a film second. */
    prop(subject: string): {
      prop: Pick<IAutoMovieMotionHumanProp, "affordances">;
      frame(
        seconds: number,
      ): Pick<IAutoMovieRigidTransform, "position" | "rotation">;
    };
  }

  /**
   * A support's declared surfaces in the world at a second.
   *
   * @param context The step's context.
   * @param prop The support.
   * @param at Seconds of the step.
   * @returns The surfaces.
   */
  export function surfaces(
    context: ISurfacesContext,
    prop: string,
    at: number,
  ): ISurface[] {
    const frame: Pick<IAutoMovieRigidTransform, "position" | "rotation"> =
      context.prop(prop).frame(context.start + at);
    return (context.prop(prop).prop.affordances ?? [])
      .filter((item: IAutoMovieAffordance): boolean => item.kind === "surface")
      .map(
        (item: IAutoMovieAffordance): ISurface => ({
          origin: Vector3.add(
            frame.position,
            Quaternion.rotateVector(frame.rotation, item.frame.translation),
          ),
          rotation: Quaternion.multiply(frame.rotation, item.frame.rotation),
          width: item.width ?? Infinity,
          depth: item.depth ?? Infinity,
        }),
      );
  }

  /**
   * A world point in a surface's frame.
   *
   * @param surface The surface.
   * @param point The point.
   * @returns The point in the surface's frame.
   */
  export function local(
    surface: ISurface,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      Quaternion.inverse(surface.rotation),
      Vector3.subtract(point, surface.origin),
    );
  }

  /**
   * Whether a surface bears a point: within its extent and `BEARING` of it.
   *
   * @param surface The surface.
   * @param point The point.
   * @returns Whether it bears it.
   */
  export function holds(surface: ISurface, point: IAutoMovieVector3): boolean {
    const at: IAutoMovieVector3 = local(surface, point);
    return (
      Math.abs(at.x) <= surface.width / 2 &&
      Math.abs(at.z) <= surface.depth / 2 &&
      Math.abs(at.y) <= BEARING
    );
  }

  /**
   * Each foot's plants in time order and the support each bears on: the entry's
   * on the support left, each new one on the support whose surface holds the
   * middle of the foot where it lands. A new footprint is slid along the
   * surface, the least it takes, to lie wholly on the moving support that bears
   * it, or wholly off the one beside it, so no foot straddles an edge; one
   * crossing the edge head-on slides along its own length, so it keeps its lane
   * beside the other foot.
   *
   * @param step The step.
   * @param walked The walk planned on the support left.
   * @param land The last touchdown, seconds of the step.
   * @param leave The first touchdown on the support arrived on, seconds of the
   *   step.
   * @returns Each foot's plants.
   */
  export function assign(
    step: IStep,
    walked: IAutoMovieMotionHumanActionPlan,
    land: number,
    leave: number,
  ): Record<AutoMovieHumanSide, IPlant[]> {
    const { context, moved, level, settled }: IStep = step;
    const { to, from, onto }: IAutoMovieMotionHumanSurface.ISupportStepParams =
      context.params;
    const measure: IAutoMovieMotionHumanBody["measure"] = context.body.measure;
    const heel: number = -measure.heel;
    const toe: number = measure.footLength - measure.heel;
    const sole = (
      ankle: IAutoMovieVector3,
      yaw: number,
      along: number,
    ): IAutoMovieVector3 =>
      Vector3.add(
        ankle,
        Quaternion.rotateVector(
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
          { x: 0, y: -measure.ankleHeight, z: along },
        ),
      );
    const duration: number = walked.duration;
    const plants: Record<AutoMovieHumanSide, IPlant[]> = {
      left: [],
      right: [],
    };
    for (const window of walked.contacts) {
      if (
        window.kind !== "plant" ||
        (window.part !== "leftFoot" && window.part !== "rightFoot")
      )
        continue;
      const side: AutoMovieHumanSide =
        window.part === "leftFoot" ? "left" : "right";
      const down: number = window.from * duration;
      const middle: IAutoMovieMotionHumanPosture = walked.posture(
        ((window.from + window.to) / 2) * duration,
      );
      const goal: IAutoMovieHumanLimbGoal | undefined =
        middle.limbs[`${side}Leg`];
      const plant: IPlant = {
        window,
        arrived: false,
        down,
        shift: { x: 0, y: 0, z: 0 },
        floor: 0,
      };
      if (goal !== undefined) {
        const centre: IAutoMovieVector3 = sole(
          goal.point,
          middle.yaw,
          (heel + toe) / 2,
        );
        if (window.from > 0)
          plant.arrived =
            onto !== undefined
              ? surfaces(context, onto, land).some((s: ISurface): boolean =>
                  holds(s, moved(from, 0, leave, centre)),
                )
              : from !== undefined &&
                !surfaces(context, from, 0).some((s: ISurface): boolean =>
                  holds(s, centre),
                );
        // A footprint on the support arrived on stands on its surface as it
        // is when the last foot lands, which a moving tread may have carried
        // above or below the floor the walk was planned on.
        if (plant.arrived && onto !== undefined) {
          const aimed: IAutoMovieVector3 = moved(from, 0, leave, centre);
          const under: ISurface | undefined = surfaces(
            context,
            onto,
            land,
          ).find((s: ISurface): boolean => holds(s, aimed));
          if (under !== undefined)
            plant.shift = {
              x: 0,
              y: under.origin.y - aimed.y,
              z: 0,
            };
        }
        // Where the plant lands in the world at its touchdown.
        const placed = (point: IAutoMovieVector3): IAutoMovieVector3 =>
          plant.arrived
            ? moved(onto, land, down, moved(from, 0, leave, point))
            : moved(from, 0, down, point);
        const bearing: string | undefined = plant.arrived ? onto : from;
        const beside: string | undefined = plant.arrived ? from : onto;
        if (window.from > 0) {
          const back: IAutoMovieVector3 = placed(
            sole(goal.point, middle.yaw, heel),
          );
          const front: IAutoMovieVector3 = placed(
            sole(goal.point, middle.yaw, toe),
          );
          const fit = (surface: ISurface, inside: boolean): number => {
            const a: number = local(surface, back).z;
            const b: number = local(surface, front).z;
            const low: number = Math.min(a, b);
            const high: number = Math.max(a, b);
            const half: number = surface.depth / 2;
            if (inside)
              return high - low > 2 * half
                ? 0
                : Math.max(0, -half - low) + Math.min(0, half - high);
            if (high <= -half || low >= half) return 0;
            const forth: number = half - low;
            const backward: number = -half - high;
            // Off the support beside it, a foot keeps to the landing's side:
            // ahead toward the arrival when stepping off, back from the
            // support when it has yet to board it.
            const ahead: number = Vector3.dot(
              Quaternion.rotateVector(surface.rotation, { x: 0, y: 0, z: 1 }),
              Vector3.subtract(to, context.entry.posture.root),
            );
            return ahead > 0 === plant.arrived ? forth : backward;
          };
          // A footprint crossing the edge more head-on than side-on slides
          // along its own length, shortening or lengthening its step, so it
          // keeps its lane beside the other foot; one more side-on slides
          // square to the edge.
          const length: IAutoMovieVector3 = Vector3.normalize({
            x: front.x - back.x,
            y: 0,
            z: front.z - back.z,
          });
          const slide = (surface: ISurface, inside: boolean): void => {
            const along: number = fit(surface, inside);
            if (along === 0) return;
            const square: IAutoMovieVector3 = Quaternion.rotateVector(
              surface.rotation,
              { x: 0, y: 0, z: 1 },
            );
            const facing: number = Vector3.dot(length, square);
            plant.shift = Vector3.add(
              plant.shift,
              Math.abs(facing) > HEAD_ON
                ? Vector3.scale(length, along / facing)
                : Vector3.scale(square, along),
            );
          };
          const mid: IAutoMovieVector3 = placed(centre);
          if (bearing !== undefined) {
            const own: ISurface | undefined = surfaces(
              context,
              bearing,
              down,
            ).find((s: ISurface): boolean => holds(s, mid));
            if (own !== undefined) slide(own, true);
          } else if (beside !== undefined)
            for (const s of surfaces(context, beside, down))
              if (Math.abs(local(s, mid).x) <= s.width / 2) slide(s, false);
        }
        // A fixed landing's height: the entry's floor for the feet that
        // start there, the arrival point's for those that arrive on it.
        plant.floor = plant.arrived ? to.y + settled : level;
      }
      plants[side].push(plant);
    }
    for (const side of ["left", "right"] as const)
      plants[side].sort((a: IPlant, b: IPlant): number => a.down - b.down);
    return plants;
  }
}
