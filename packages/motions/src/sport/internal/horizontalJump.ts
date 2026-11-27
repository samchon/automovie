import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHorizontalJump,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { jump } from "../../actions/internal/jump";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { AthleticsRunUp } from "./AthleticsRunUp";

/**
 * A long jump out of a run: the run is cut at the take-off foot's footfall on
 * the board (`AthleticsRunUp`), and the jump's own push-off, ballistic flight
 * and two-footed landing (`jump`) carry the body into the sand with the heels
 * at the authored distance from the take-off line.
 *
 * The take-off angle is `ANGLE`. With the take-off and landing centres at one
 * height, a flight of horizontal length `D` at that angle needs the horizontal
 * speed `sqrt(g D / (2 tan ANGLE))` and peaks `D tan(ANGLE) / 4` above the
 * take-off, the apex the jump is given. The run brings at most its own speed
 * into the take-off (a plant trades horizontal speed for lift, Hay, Miller and
 * Canterna 1986, J Biomech 19:855), so a distance that asks for more is refused
 * with the distance the run reaches. The take-off foot's toe may not pass the
 * take-off line, the board's far edge: that jump is a foul (World Athletics
 * TR30.1) and is refused.
 *
 * First pass: the landing is the jump's upright two-footed absorption, without
 * the legs thrown forward or the fall forward out of the sand; the flight keeps
 * the jump's posture (no hang or hitch-kick).
 *
 * Events: the jump's, `takeoff` and `touchdown` among them.
 */
export namespace horizontalJump {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "horizontalJump";

  /** A take-off, a flight and a landing, judged as the jump's is. */
  export const physical: boolean = jump.physical;

  /** Cancel table: the jump's, once landed and settled. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    jump.interrupts;

  /**
   * What may be cut into a long jump: a run, at the take-off foot's footfall
   * (`AthleticsRunUp`).
   */
  export const accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {
    run: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.15 }],
  };

  /**
   * The take-off angle, degrees above the horizontal: about 21, the angle at
   * which athletes jumped farthest in Linthorne, Guzman and Bridgett (2005,
   * "Optimum take-off angle in the long jump", J Sports Sci 23:703), within the
   * 18 to 23 degrees elite men take off at (Hay, Miller and Canterna 1986).
   */
  export const ANGLE: number = 21;

  /**
   * Plan a long jump.
   *
   * @param context The action's context, entered from a run.
   * @returns The jump's plan into the sand.
   * @throws {HumanRefusal} When the entry is no run cut at a footfall, the pit
   *   lacks its `board` or `sand`, the take-off foot passes the take-off line,
   *   the distance is not positive or asks for more horizontal speed than the
   *   run brings, or the jump refuses its push-off.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHorizontalJump.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanHorizontalJump.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    HumanBound.above("distance", p.distance, 0, "m");
    const approach: AthleticsRunUp.IApproach | undefined = AthleticsRunUp(
      context,
      0,
      "approach",
      undefined,
    );
    if (approach === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "approach",
        value: context.entry.from?.family ?? "none",
        feasible: { kind: "alternatives", values: ["run"] },
        reason: "a long jump takes off out of a run",
        fix: "run, and cut the run at the take-off foot's footfall on the board",
      });

    // The board's far edge along the runway is the take-off line; the
    // runway runs along the pit's +Z.
    const read: IAutoMovieMotionHumanPropReader = context.prop(p.pit);
    const placed: IAutoMovieRigidTransform = read.frame(context.start);
    const surface: (id: Surface) => IAutoMovieAffordance = (
      id: Surface,
    ): IAutoMovieAffordance => {
      const found: IAutoMovieAffordance | undefined = (
        read.prop.affordances ?? []
      ).find((a: IAutoMovieAffordance): boolean => a.id === id);
      if (found === undefined)
        throw new HumanRefusal({
          kind: "affordance",
          axis: "pit",
          value: p.pit,
          reason: `${p.pit} declares no ${id}`,
          fix:
            "name a jump pit with a board and a sand surface, as AutoMovieArchetypeJumpPit.create builds",
        });
      return found;
    };
    const board: IAutoMovieAffordance = surface("board");
    const sand: IAutoMovieAffordance = surface("sand");
    const world: (local: IAutoMovieVector3) => IAutoMovieVector3 = (
      local: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Vector3.add(
        placed.position,
        Quaternion.rotateVector(placed.rotation, local),
      );
    const along: IAutoMovieVector3 = Quaternion.rotateVector(placed.rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    const line: IAutoMovieVector3 = world({
      ...board.frame.translation,
      z: board.frame.translation.z + (board.depth ?? 0) / 2,
    });

    // A toe past the line is a foul.
    const toe: IAutoMovieVector3 = HumanFoot.point(
      body,
      approach.foot,
      "toe",
      context.entry.feet[approach.foot],
    );
    const over: number = Vector3.dot(Vector3.subtract(toe, line), along);
    if (over > 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "approach",
        value: over,
        feasible: { kind: "range", minimum: null, maximum: 0, unit: "m" },
        reason: `the take-off toe passes the take-off line by ${(over * 1000).toFixed(0)} mm, a foul`,
        fix: "cut the run at an earlier footfall, or move the board",
      });

    // The heels land at the distance from the line; the jump's landing
    // place is the ankles' midpoint, the heel's offset ahead of the heels.
    const heel: number = -HumanFoot.point(body, "left", "heel", {
      ankle: { x: 0, y: 0, z: 0 },
      rotation: Quaternion.identity(),
    }).z;
    const ahead: IAutoMovieVector3 = approach.heading;
    const reach: number =
      (p.distance -
        Vector3.dot(Vector3.subtract(approach.ankle, line), along)) /
      Vector3.dot(ahead, along);
    const to: IAutoMovieVector3 = {
      ...Vector3.add(approach.ankle, Vector3.scale(ahead, reach + heel)),
      y: world(sand.frame.translation).y,
    };

    // The equal-height projectile at ANGLE over the take-off foot's
    // horizontal travel: its apex, and the speed it needs.
    const g: number = AutoMovieGravity.STANDARD;
    const tan: number = Math.tan((ANGLE * Math.PI) / 180);
    const travel: number = reach + heel;
    const needed: number = Math.sqrt((g * travel) / (2 * tan));
    if (needed > approach.speed)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "distance",
        value: p.distance,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: p.distance - travel + (2 * approach.speed ** 2 * tan) / g,
          unit: "m",
        },
        reason: `the distance needs ${needed.toFixed(2)} m/s across the floor at the take-off, more than the ${approach.speed.toFixed(2)} m/s the run brings`,
        fix: "run faster, or jump shorter",
      });
    return jump.plan(
      {
        ...context,
        params: { to, apex: (travel * tan) / 4, on: p.pit },
      },
      approach.foot,
    );
  }

  /** The pit's two surfaces the law reads: the take-off board and the sand. */
  type Surface = "board" | "sand";
}
