import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSurface,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";

/*
 * The footprints of a support step (`HumanSupportStep`): which support each of
 * the walk's plants bears on, read from the supports' declared surfaces where
 * the foot lands, and how far a footprint is slid to keep off an edge or lifted
 * onto a moving surface it arrives on.
 */
export namespace HumanSupportStepPlants {
  /*
   * How far above or below a surface a footprint may lie and still bear on it,
   * metres: a tread's or a comb plate's own thickness (provisional).
   */
  export const BEARING: number = 0.1;

  /*
   * The cosine between a footprint's length and an edge's normal past which the
   * footprint crosses the edge more head-on than side-on: 45 degrees.
   */
  export const HEAD_ON: number = Math.SQRT1_2;

  /*
   * One plant of a foot on the planned walk and the support it bears on.
   */
  export interface IPlant {
    /*
     * The planned window.
     */
    window: IAutoMovieMotionHumanContactWindow;

    /*
     * Whether it bears on the support arrived on rather than the one left.
     */
    arrived: boolean;

    /*
     * Its touchdown, seconds of the step.
     */
    down: number;

    /*
     * Named material frame that carries this footprint after touchdown.
     */
    site?: string;

    /*
     * How far it is slid along a surface to keep off an edge, and lifted onto a
     * moving surface it arrives on, world metres.
     */
    shift: IAutoMovieVector3;

    /*
     * The height of the fixed landing it bears on, world metres.
     */
    floor: number;
  }

  /*
   * One declared surface of a support in the world.
   */
  export interface ISurface {
    /*
     * The affordance id of an authored support, when available.
     */
    id?: string;

    /*
     * Its centre.
     */
    origin: IAutoMovieVector3;

    /*
     * Its frame's world rotation: +Y up, width along X, depth along Z.
     */
    rotation: IAutoMovieQuaternion;

    /*
     * Its extent along X, metres.
     */
    width: number;

    /*
     * Its extent along Z, metres.
     */
    depth: number;
  }

  /*
   * A point moved by a support's motion between two seconds of the step; the
   * ground keeps it.
   */
  export type Moved = (
    prop: string | undefined,
    begin: number,
    end: number,
    point: IAutoMovieVector3,
  ) => IAutoMovieVector3;

  /*
   * What the assignment reads of the step.
   */
  export interface IStep {
    /*
     * The step's context.
     */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSurface.ISupportStepParams>;

    /*
     * A point moved by a support's motion.
     */
    moved: Moved;

    /*
     * The height the walk is planned at, world metres.
     */
    level: number;

    /*
     * How far the entry's soles sit from the declared surface they stand on,
     * metres.
     */
    settled: number;
  }

  /*
   * What a support's surfaces are read from: the step's start and props.
   */
  export interface ISurfacesContext {
    /*
     * The step's start, film seconds.
     */
    start: number;

    /*
     * A support's affordances and its frame at a film second.
     */
    prop(subject: string): {
      prop: Pick<IAutoMovieMotionHumanProp, "affordances">;
      frame(
        seconds: number,
      ): Pick<IAutoMovieRigidTransform, "position" | "rotation">;
      /*
       * Optional displayed material frame of an articulated surface.
       */
      site?(id: string, seconds: number): IAutoMovieRigidTransform;
    };
  }

  /*
   * A support's declared surfaces in the world at a second.
   * Parameter context: The step's context.
   * Parameter prop: The support.
   * Parameter at: Seconds of the step.
   * Returns: The surfaces.
   */
  export function surfaces(
    context: ISurfacesContext,
    prop: string,
    at: number,
  ): ISurface[] {
    const reader: ReturnType<ISurfacesContext["prop"]> = context.prop(prop);
    const seconds: number = context.start + at;
    let frame:
      | Pick<IAutoMovieRigidTransform, "position" | "rotation">
      | undefined;
    const placed = (item: IAutoMovieAffordance): IAutoMovieRigidTransform => {
      frame ??= reader.frame(seconds);
      return {
        position: Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, item.frame.translation),
        ),
        rotation: Quaternion.multiply(frame.rotation, item.frame.rotation),
      };
    };
    return (reader.prop.affordances ?? [])
      .filter((item: IAutoMovieAffordance): boolean => item.kind === "surface")
      .map((item: IAutoMovieAffordance): ISurface => {
        const site: IAutoMovieRigidTransform =
          reader.site?.(item.id, seconds) ?? placed(item);
        return {
          id: item.id,
          origin: site.position,
          rotation: site.rotation,
          width: item.width ?? Infinity,
          depth: item.depth ?? Infinity,
        };
      })
      .filter(
        (surface: ISurface): boolean =>
          Quaternion.rotateVector(surface.rotation, { x: 0, y: 1, z: 0 }).y >=
          1 - 1e-8,
      );
  }

  /*
   * A world point in a surface's frame.
   * Parameter surface: The surface.
   * Parameter point: The point.
   * Returns: The point in the surface's frame.
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

  /*
   * Whether a surface bears a point: within its extent and `BEARING` of it.
   * Parameter surface: The surface.
   * Parameter point: The point.
   * Returns: Whether it bears it.
   */
  export function holds(surface: ISurface, point: IAutoMovieVector3): boolean {
    const at: IAutoMovieVector3 = local(surface, point);
    return (
      Math.abs(at.x) <= surface.width / 2 &&
      Math.abs(at.z) <= surface.depth / 2 &&
      Math.abs(at.y) <= BEARING
    );
  }

  /*
   * The smallest horizontal translation to contain the whole sole on a face.
   */
  export function fit(
    surface: ISurface,
    footprint: readonly IAutoMovieVector3[],
  ): IAutoMovieVector3 | null {
    const projected: IBounds = bounds(surface, footprint);
    const x: number | null = correction(
      projected.left,
      projected.right,
      surface.width,
    );
    const z: number | null = correction(
      projected.back,
      projected.front,
      surface.depth,
    );
    return x === null || z === null
      ? null
      : Quaternion.rotateVector(surface.rotation, { x, y: 0, z });
  }

  /*
   * Each foot's plants in time order and the support each bears on: the entry's
   * on the support left, each new one on the support whose surface holds the
   * middle of the foot where it lands. A new footprint is slid along the
   * surface, the least it takes, to lie wholly on the moving support that bears
   * it, or wholly off the one beside it. A step off the support that crosses
   * its edge head-on keeps its lane beside the other foot.
   * Parameter step: The step.
   * Parameter walked: The walk planned on the support left.
   * Parameter land: The last touchdown, seconds of the step.
   * Parameter leave: The first touchdown on the support arrived on, seconds of the
   * step.
   * Returns: Each foot's plants.
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
    const soles: Record<
      AutoMovieHumanSide,
      ReturnType<typeof HumanFoot.prepareSole>
    > = {
      left: HumanFoot.prepareSole(context.body, "left"),
      right: HumanFoot.prepareSole(context.body, "right"),
    };
    const leftSurfaces: ISurface[] =
      from === undefined ? [] : surfaces(context, from, 0);
    const rightSurfaces: ISurface[] =
      onto === undefined ? [] : surfaces(context, onto, land);
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
        const sole: IAutoMovieVector3[] = soles[side]({
          ankle: goal.point,
          rotation:
            goal.rotation ??
            Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, middle.yaw),
        });
        const centre: IAutoMovieVector3 = Vector3.lerp(sole[0]!, sole[2]!, 0.5);
        if (window.from > 0)
          plant.arrived =
            onto !== undefined
              ? rightSurfaces.some((s: ISurface): boolean =>
                  holds(s, moved(from, 0, leave, centre)),
                )
              : from !== undefined &&
                !leftSurfaces.some((s: ISurface): boolean => holds(s, centre));
        // Where the plant lands in the world at its touchdown.
        const placed = (point: IAutoMovieVector3): IAutoMovieVector3 =>
          plant.arrived
            ? moved(onto, land, down, moved(from, 0, leave, point))
            : moved(from, 0, down, point);
        const bearing: string | undefined = plant.arrived ? onto : from;
        const beside: string | undefined = plant.arrived ? from : onto;
        const mid: IAutoMovieVector3 = placed(centre);
        const owned: ISurface[] =
          bearing === undefined
            ? []
            : down === 0
              ? leftSurfaces
              : surfaces(context, bearing, down);
        const candidates: ISurface[] = owned.filter(
          (surface: ISurface): boolean => holds(surface, mid),
        );
        const own: ISurface | undefined =
          candidates.find(
            (surface: ISurface): boolean =>
              Number.isFinite(surface.width) && Number.isFinite(surface.depth),
          ) ?? candidates[0];
        if (own?.id !== undefined) plant.site = own.id;
        if (window.from > 0) {
          const footprint: IAutoMovieVector3[] = sole.map(placed);
          let shift: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
          if (own !== undefined) {
            const correction: IAutoMovieVector3 | null = fit(own, footprint);
            if (correction === null)
              throw new HumanRefusal({
                kind: "reach",
                axis: "support",
                value: bearing,
                reason: `the ${side} sole is larger than the support it lands on`,
                fix: "choose a wider or deeper landing surface",
              });
            shift = plant.arrived
              ? { ...correction, y: correction.y - local(own, mid).y }
              : correction;
          } else if (bearing === undefined && beside !== undefined) {
            for (const s of surfaces(context, beside, down)) {
              const edge: IAutoMovieVector3 = Quaternion.rotateVector(
                s.rotation,
                { x: 0, y: 0, z: 1 },
              );
              const ahead: boolean =
                Vector3.dot(
                  edge,
                  Vector3.subtract(to, context.entry.posture.root),
                ) > 0;
              const shifted: IAutoMovieVector3[] = footprint.map(
                (p: IAutoMovieVector3): IAutoMovieVector3 =>
                  Vector3.add(p, shift),
              );
              const along: number = outside(
                s,
                shifted,
                ahead === plant.arrived,
              );
              const length: IAutoMovieVector3 = Vector3.normalize(
                Vector3.subtract(footprint[2]!, footprint[0]!),
              );
              const facing: number = Vector3.dot(length, edge);
              shift = Vector3.add(
                shift,
                Math.abs(facing) > HEAD_ON
                  ? Vector3.scale(length, along / facing)
                  : Vector3.scale(edge, along),
              );
            }
          }
          // The travel reader applies a plant's shift before carrying it.
          // Convert the displacement seen at touchdown back to that frame.
          const unplace = (point: IAutoMovieVector3): IAutoMovieVector3 =>
            plant.arrived
              ? moved(from, leave, 0, moved(onto, down, land, point))
              : moved(from, down, 0, point);
          plant.shift = Vector3.subtract(
            unplace(Vector3.add(mid, shift)),
            unplace(mid),
          );
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

/*
 * A sole's extrema in the deck's horizontal material coordinates.
 */
interface IBounds {
  left: number;
  right: number;
  back: number;
  front: number;
}

/*
 * Project all sole points onto one material plane.
 */
function bounds(
  surface: HumanSupportStepPlants.ISurface,
  sole: readonly IAutoMovieVector3[],
): IBounds {
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(surface.rotation);
  let left: number = Infinity;
  let right: number = -Infinity;
  let back: number = Infinity;
  let front: number = -Infinity;
  for (const point of sole) {
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      inverse,
      Vector3.subtract(point, surface.origin),
    );
    left = Math.min(left, local.x);
    right = Math.max(right, local.x);
    back = Math.min(back, local.z);
    front = Math.max(front, local.z);
  }
  return { left, right, back, front };
}

/*
 * Minimum translation of one finite interval inside its support.
 */
function correction(low: number, high: number, extent: number): number | null {
  if (high - low > extent + 1e-12) return null;
  return Math.max(0, -extent / 2 - low) + Math.min(0, extent / 2 - high);
}

/*
 * Move clear of the nearby deck on the side the step is already taking.
 */
function outside(
  surface: HumanSupportStepPlants.ISurface,
  sole: readonly IAutoMovieVector3[],
  forward: boolean,
): number {
  const at: IBounds = bounds(surface, sole);
  const half: number = surface.depth / 2;
  if (
    !Number.isFinite(half) ||
    at.right <= -surface.width / 2 ||
    at.left >= surface.width / 2 ||
    at.front <= -half ||
    at.back >= half
  )
    return 0;
  return forward ? half - at.back : -half - at.front;
}
