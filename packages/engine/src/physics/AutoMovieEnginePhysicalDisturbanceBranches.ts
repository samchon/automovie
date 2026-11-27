import type { AutoMovieEnginePhysicalBalanceTypes } from "./AutoMovieEnginePhysicalBalanceTypes";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieEnginePhysicalDisturbanceFollow } from "./AutoMovieEnginePhysicalDisturbanceFollow";
import { AutoMovieEnginePhysicalDisturbanceForm } from "./AutoMovieEnginePhysicalDisturbanceForm";
import { AutoMovieEnginePhysicalDisturbancePlacement as Placement } from "./AutoMovieEnginePhysicalDisturbancePlacement";
import { AutoMovieEnginePhysicalDisturbanceResponse as Response } from "./AutoMovieEnginePhysicalDisturbanceResponse";
import { AutoMovieEnginePhysicalIcpPlanner } from "./AutoMovieEnginePhysicalIcpPlanner";
import type { AutoMovieEnginePhysicalIcpPlannerTools as Tools } from "./AutoMovieEnginePhysicalIcpPlannerTools";
import { AutoMovieEnginePhysicalPlanarPolygon as Polygon } from "./AutoMovieEnginePhysicalPlanarPolygon";
import { AutoMovieEnginePhysicalPushRecovery as Recovery } from "./AutoMovieEnginePhysicalPushRecovery";

/**
 * The branch points of a disturbance response being laid
 * (`preparePhysicalDisturbanceSpan`): each moves the response on from the
 * instant it is reached.
 */
export namespace AutoMovieEnginePhysicalDisturbanceBranches {
  /**
   * A push: the velocity's jump, then the state's own test; in single support,
   * the footstep checked again and, when it moves, the plan made again.
   *
   * @param scope The response, at the push.
   * @returns Whether the response fell.
   */
  export function push(scope: Response.IResponse): boolean {
    const jump: IAutoMovieVector3 = scope.pushes.shift()!.velocity;
    scope.state = {
      xi: {
        x: scope.state.xi.x + jump.x / scope.omega,
        z: scope.state.xi.z + jump.z / scope.omega,
      },
      c: scope.state.c,
    };
    scope.branches.push({ kind: "push", seconds: scope.t });
    if (scope.mode !== "single") {
      Response.test(scope);
      return false;
    }
    const s: Response.IStep = scope.step!;
    scope.recovery = Recovery.singleSupport({
      state: scope.recovery,
      capture: toLocal(scope.state.xi),
      desired: toLocal(
        evaluate(scope.reference, scope.t, scope.omega).position,
      ),
    });
    const from: Tools.IState = AutoMovieEnginePhysicalDisturbanceFollow.swingAt(
      scope.swings,
      s.swing.bone,
      scope.t,
    );
    const moved = Placement.place(
      scope,
      s.stance,
      s.swing,
      from.position,
      s.touchdown - scope.t,
    );
    if (!moved.viable) {
      scope.branches.push({
        kind: "fall",
        seconds: scope.t,
        bone: s.swing.bone,
      });
      scope.fallen = scope.t;
      return true;
    }
    if (!moved.adjusted) return false;
    s.target = moved.target;
    s.viable = moved.viable;
    s.plan = Placement.plan(
      scope,
      s.support,
      s.swing,
      s.target,
      s.touchdown - scope.t,
    );
    scope.reference = segmented(scope.t, s.plan);
    scope.swings.push({
      bone: s.swing.bone,
      start: scope.t,
      end: s.touchdown,
      from,
      to: s.target,
    });
    scope.footstep = {
      bone: s.swing.bone,
      position: s.target,
      viable: s.viable,
    };
    return false;
  }

  /**
   * The trigger: the step out of a fall.
   *
   * @param scope The response, at the trigger.
   * @returns Whether the response fell.
   */
  export function trigger(scope: Response.IResponse): boolean {
    const swing: Foot = scope.placed.get(scope.trigger!.swing)!;
    const stance: Foot[] = Response.planted(scope).filter(
      (foot: Foot): boolean => foot.bone !== swing.bone,
    );
    const support: Foot = Response.merge(stance, swing);
    scope.recovery = Recovery.fall(scope.recovery);
    const placedAt = Placement.place(
      scope,
      stance,
      swing,
      swing.frame.origin,
      ZULU.swingTime,
    );

    // No capturable step: the response ends in a fall, which the physics
    // takes from here with the fall's contacts.
    if (!placedAt.viable) {
      scope.branches.push({ kind: "fall", seconds: scope.t, bone: swing.bone });
      scope.fallen = scope.t;
      return true;
    }

    // The swing sped up to the time the capture region prefers, no shorter
    // than a recovery's minimum (`WalkingSingleSupportState
    // .requestSwingSpeedUpIfNeeded` l.364-381, `hasMinimumTimePassed`
    // l.405-414).
    const duration: number =
      placedAt.preferred > 0
        ? Math.max(
            ZULU.minimumSwingTime,
            Math.min(ZULU.swingTime, placedAt.preferred),
          )
        : ZULU.swingTime;
    // The footstep under the response's own capture point at touchdown:
    // the single-support response laid once toward the projected footstep
    // gives the capture point at its end, xi(T), and the footstep is that
    // point projected into the region, the swing foot's place the
    // capture point reaches, as the reference checks the footstep against
    // the capture point through the swing (`WalkingSingleSupportState`
    // l.136-163); the plan is laid again toward it.
    const region: Polygon.IPoint[] = Placement.reachable(
      scope,
      stance,
      swing,
      duration,
    );
    const trial: AutoMovieEnginePhysicalDisturbanceForm.IState =
      AutoMovieEnginePhysicalDisturbanceFollow.follow([], {
        phase: "single",
        reference: segmented(
          scope.t,
          Placement.plan(scope, support, swing, placedAt.target, duration),
        ),
        support: Response.supportOf(stance),
        start: scope.t,
        end: scope.t + duration,
        xi: scope.state.xi,
        c: scope.state.c,
        omega: scope.omega,
      });
    // The sole's outline is placed to contain xi(T), as the footstep
    // adjustor places the foot's outline rather than its point
    // (`AutoMovieEnginePhysicalFootstepAdjustor`): the endpoints whose sole holds xi(T)
    // are xi(T) less the sole's outline about its endpoint, and the
    // footstep is the one of them in the region nearest the sole centred
    // on xi(T); with none in the region, xi(T)'s projection into it.
    const facing: Polygon.IFrame = {
      origin: { x: 0, z: 0 },
      forward: swing.frame.forward,
    };
    const holding: Polygon.IPoint[] = Polygon.hull(
      swing.polygon.map(
        (v: Polygon.IPoint): Polygon.IPoint =>
          toLocal(add(trial.xi, Polygon.world(facing, v), -1)),
      ),
    );
    const centred: Polygon.IPoint = toLocal(
      add(
        trial.xi,
        Polygon.world(facing, Polygon.centroid(Polygon.hull(swing.polygon))),
        -1,
      ),
    );
    const both: Polygon.IPoint[] =
      region.length >= 3 ? Polygon.intersect(region, holding) : [];
    const under: Tools.IFloor =
      both.length >= 3
        ? toWorld(Polygon.project(both, centred))
        : region.length >= 3
          ? toWorld(Polygon.project(region, toLocal(trial.xi)))
          : placedAt.target;
    placedAt.target = under;
    const step: Response.IStep = {
      support,
      stance,
      swing,
      target: under,
      touchdown: scope.t + duration,
      plan: Placement.plan(scope, support, swing, under, duration),
      viable: placedAt.viable,
    };
    scope.step = step;
    scope.footstep = {
      bone: swing.bone,
      position: placedAt.target,
      viable: placedAt.viable,
    };
    scope.swings.push({
      bone: swing.bone,
      start: scope.t,
      end: step.touchdown,
      from: { position: swing.frame.origin, velocity: { x: 0, z: 0 } },
      to: placedAt.target,
    });
    scope.contacts.push({
      start: scope.t,
      bones: stance.map((foot: Foot): string => foot.bone),
    });
    scope.branches.push({
      kind: "trigger",
      seconds: scope.t,
      bone: swing.bone,
    });
    scope.reference = segmented(scope.t, step.plan);
    scope.mode = "single";
    scope.trigger = undefined;
    scope.outside = undefined;
    scope.hold = undefined;
    scope.standingEnd = undefined;
    return false;
  }

  /**
   * The touchdown: the transfer to standing.
   *
   * @param scope The response, at the touchdown.
   */
  export function touchdown(scope: Response.IResponse): void {
    const s: Response.IStep = scope.step!;
    const landing: Foot = {
      ...s.swing,
      frame: { origin: s.target, forward: s.swing.frame.forward },
    };
    scope.placed.set(landing.bone, landing);
    scope.contacts.push({
      start: scope.t,
      bones: [...s.stance.map((foot: Foot): string => foot.bone), landing.bone],
    });
    scope.branches.push({
      kind: "touchdown",
      seconds: scope.t,
      bone: landing.bone,
    });
    const last: Tools.IFloor = evaluate(
      scope.reference,
      scope.t,
      scope.omega,
    ).position;
    const left: Foot = s.support.side === "left" ? s.support : landing;
    const right: Foot = s.support.side === "left" ? landing : s.support;
    scope.pair = { left, right };
    scope.reference = transfer(
      scope.t,
      AutoMovieEnginePhysicalIcpPlanner.toStanding({
        feet: { left, right },
        support: s.support.side,
        desired: last,
        center: scope.state.c,
      }),
      Response.soles(scope),
    );
    scope.hold = {
      reference: scope.reference,
      done: scope.t + AutoMovieEnginePhysicalIcpPlanner.DEFAULTS.finalTransfer,
      checked: false,
    };
    scope.mode = "toStanding";
    scope.step = undefined;
    scope.recovery = Recovery.reset(scope.recovery);
    Response.test(scope);
  }

  /**
   * The transfer to standing's exit test, then its exit.
   *
   * @param scope The response, at the transfer's end.
   */
  export function exit(scope: Response.IResponse): void {
    const hold: NonNullable<Response.IResponse["hold"]> = scope.hold!;
    const point: Tools.IFloor = evaluate(
      hold.reference,
      scope.t,
      scope.omega,
    ).position;
    const error: number = Math.hypot(
      scope.state.xi.x - point.x,
      scope.state.xi.z - point.z,
    );
    if (!hold.checked && !(error < scope.tolerance)) {
      hold.checked = true;
      hold.done =
        scope.t +
        Math.log(error / scope.tolerance) / (scope.omega * scope.across);
      return;
    }
    scope.reference = transfer(
      scope.t,
      AutoMovieEnginePhysicalIcpPlanner.standing({
        soles: Response.soles(scope),
        from: { position: point, velocity: { x: 0, z: 0 } },
        to: Response.target(scope),
      }),
      Response.soles(scope),
    );
    scope.branches.push({ kind: "standing", seconds: scope.t });
    scope.standingEnd = scope.t + AutoMovieEnginePhysicalIcpPlanner.DEFAULTS.finalTransfer;
    scope.mode = "standing";
    scope.recovery = Recovery.reset(scope.recovery);
    scope.hold = undefined;
    Response.test(scope);
  }

  /**
   * The standing cubic's end: its target at rest.
   *
   * @param scope The response, at the standing cubic's end.
   */
  export function end(scope: Response.IResponse): void {
    scope.branches.push({ kind: "end", seconds: scope.t });
    scope.reference = constant(scope.t, Response.target(scope).position);
    scope.mode = "after";
    scope.standingEnd = undefined;
    Response.test(scope);
  }
}


/*
 * The closed forms the branch points lay.
 */
const {
  ZULU,
  add,
  constant,
  evaluate,
  segmented,
  toLocal,
  toWorld,
  transfer,
}: typeof AutoMovieEnginePhysicalDisturbanceForm = AutoMovieEnginePhysicalDisturbanceForm;

/*
 * A planted foot.
 */
type Foot = AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanFoot;
