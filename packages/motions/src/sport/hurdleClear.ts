import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanHurdleClear,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanObstacle } from "../everyday/HumanObstacle";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { crossingClearance } from "../terrain/crossingClearance";
import { AthleticsRunUp } from "./AthleticsRunUp";
import { AthleticsSwing } from "./AthleticsSwing";

/**
 * A hurdle clearance out of a run. The run is cut at the take-off foot's
 * footfall (`AthleticsRunUp`); that foot pushes off about its toes' joint over
 * the rest of the run's own stance, while the root goes on a cubic Hermite path
 * from the entry to the root the run planned at that toe-off, a reach the run's
 * legs already meet; the root then flies the drag-free parabola that lands the
 * lead foot `LANDING` metres beyond the bar at the run's horizontal speed. The
 * lead leg swings from where the run left it over the bar to its landing, the
 * trail leg from the take-off over the bar out to its side and forward for the
 * next stride (`AthleticsSwing`), each passing `CLEAR` over the bar at its
 * swing's middle, and the trunk dips forward by `DIP` at the crossing. The lead
 * foot lands flat and bears; a run cut there takes the stride on.
 *
 * Refused: a take-off outside `TAKEOFF` metres before the bar (an unsuitable
 * approach), a flight whose crossing order is invalid, or a displayed lower leg
 * intersecting the finite obstacle.
 *
 * First pass: the root stands in for the centre of mass on the parabola; the
 * arms keep the run's entry angles; the lead foot lands flat, not on its
 * forefoot as a run's stance does, because the run that takes the stride on
 * starts from its entry feet flattened; the take-off foot keeps the run's own
 * stance placement, not a measured push.
 *
 * Events: `takeoff`, `clear` (the hips over the bar's plane), `touchdown`.
 */
export namespace hurdleClear {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "hurdle";

  /**
   * Cancel table: from the lead foot's touchdown, into the run that takes the
   * stride on, or a stand.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    run: [
      { window: ["touchdown", 1], kind: "inertialize", entry: 0, blend: 0.1 },
    ],
    stand: [
      { window: ["touchdown", 1], kind: "inertialize", entry: 0, blend: 0.2 },
    ],
  };

  /** What may be cut into a clearance: a run, at the take-off foot's footfall. */
  export const accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {
    run: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
  };

  /**
   * The take-off foot's distance before the bar, metres: 1.8 to 2.4 around the
   * 2.0 to 2.2 measured for men's 110 m hurdles (McDonald and Dapena 1991, Med
   * Sci Sports Exerc 23:1392); the band is provisional.
   */
  export const TAKEOFF: readonly [number, number] = [1.8, 2.4];

  /**
   * The lead foot's landing beyond the bar, metres: about 1.1 (McDonald and
   * Dapena 1991; provisional).
   */
  export const LANDING: number = 1.1;

  /**
   * The margin each swinging ankle and the hips keep over the bar's top, metres
   * (provisional).
   */
  export const CLEAR: number = 0.05;

  /** The trunk's forward dip at the crossing, degrees (provisional). */
  export const DIP: number = 25;

  /**
   * The lead foot's toes drawn up as its heel leads over the bar, degrees of
   * pitch (provisional).
   */
  export const LEAD: number = 15;

  /**
   * The trail foot's turn out from the run's heading as its flat sole passes
   * over the bar, degrees (provisional).
   */
  export const TURN: number = 70;

  /**
   * The take-off leg's hip-to-ankle reach at toe-off, a share of the leg's
   * length: a knee near 165 degrees (McLean 1994; provisional).
   */
  export const REACH: number = 0.98;

  /**
   * The landing leg's hip-to-ankle reach at touchdown, a share of the leg's
   * length: a knee flexed for the landing (provisional).
   */
  export const LAND: number = 0.9;

  /**
   * How far the hips have passed the bar when the trail foot crosses it, metres
   * (provisional).
   */
  export const TUCK: number = 0.2;

  /**
   * The tucked trail foot's reach out to its side, a share of the leg's length
   * (provisional).
   */
  export const OUT: number = 0.15;

  /**
   * Seconds the lead foot bears after its touchdown before the run takes the
   * stride on (provisional).
   */
  export const SETTLE: number = 0.04;

  /**
   * Plan a hurdle clearance.
   *
   * @param context The action's context, entered from a run.
   * @returns The plan.
   * @throws {HumanRefusal} When the entry is no run cut at a footfall, the
   *   hurdle declares no bar, the take-off lies outside `TAKEOFF`, or a
   *   displayed lower leg intersects its finite geometry.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHurdleClear.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
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
        reason: "a hurdle is cleared out of a run",
        fix: "run, and cut the run at the take-off foot's footfall before the hurdle",
      });
    const bar: HumanObstacle.IObstacle = HumanObstacle(
      context,
      context.params.hurdle,
    );
    const take: AutoMovieHumanSide = approach.foot;
    const lead: AutoMovieHumanSide = take === "left" ? "right" : "left";
    const ahead: IAutoMovieVector3 = approach.heading;
    const left: IAutoMovieVector3 = { x: ahead.z, y: 0, z: -ahead.x };
    const along: (p: IAutoMovieVector3) => number = (
      p: IAutoMovieVector3,
    ): number => Vector3.dot(p, ahead);
    const before: number = along(Vector3.subtract(bar.at, approach.ankle));
    if (!(before >= TAKEOFF[0] && before <= TAKEOFF[1]))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "approach",
        value: before,
        feasible: {
          kind: "range",
          minimum: TAKEOFF[0],
          maximum: TAKEOFF[1],
          unit: "m",
        },
        reason: `the take-off foot stands ${before.toFixed(2)} m before the hurdle`,
        fix: "cut the run at a footfall within the take-off distance",
      });

    // The places: each foot's line across the run, the bar's middle, the
    // lead landing on its forefoot, the trail's recovery ahead of it.
    const top: number = bar.at.y + bar.height;
    const across: (p: IAutoMovieVector3) => number = (
      p: IAutoMovieVector3,
    ): number => Vector3.dot(p, left);
    const rootLine: number = across(entry.root);
    const line: (side: AutoMovieHumanSide) => number = (
      side: AutoMovieHumanSide,
    ): number =>
      side === take
        ? across(approach.ankle)
        : 2 * rootLine - across(approach.ankle);
    const on: (
      side: AutoMovieHumanSide,
      distance: number,
      height: number,
      out?: number,
    ) => IAutoMovieVector3 = (
      side: AutoMovieHumanSide,
      distance: number,
      height: number,
      out: number = 0,
    ): IAutoMovieVector3 => {
      const lateral: number =
        line(side) + (side === "left" ? out : -out) - across(bar.at);
      return {
        ...Vector3.add(
          bar.at,
          Vector3.add(
            Vector3.scale(ahead, distance),
            Vector3.scale(left, lateral),
          ),
        ),
        y: height,
      };
    };
    const yaw: number = (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI;
    const leg: number = body.measure.thigh + body.measure.shank;
    // The lead foot lands flat: the run that takes the stride on starts
    // from its entry feet flattened about their ankles (`walkSteps`), so a
    // flat landing is the one that stays where it came down.
    const landing: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
      body,
      lead,
      "sole",
      on(lead, bar.depth + LANDING, bar.at.y),
      yaw,
      0,
    );

    const middle: number = bar.depth / 2;

    // The hips: from the entry to the run's own toe-off over the stance,
    // then the parabola to the landing, the lead foot as far ahead of the
    // hips as the take-off foot was at the cut.
    const g: number = AutoMovieGravity.STANDARD;
    const r0: IAutoMovieVector3 = AthleticsRunUp.hips(body, entry);
    const v0: IAutoMovieVector3 = context.entry.velocity.linear;
    const flat: IAutoMovieVector3 = Vector3.scale(ahead, approach.speed);
    // At toe-off the take-off leg stands nearly straight (McLean 1994,
    // "Biomechanics of sprint hurdling"; the knee near 165 degrees), so the
    // hips rise to `REACH` of the leg's length above the toe-off ankle,
    // never below where the run had them.
    const pushed: IAutoMovieMotionHumanFoot.IPlacement = AthleticsRunUp.stance(
      context,
      take,
      approach.stance,
    );
    const behind: number = Math.hypot(
      approach.toeOff.x - pushed.ankle.x,
      approach.toeOff.z - pushed.ankle.z,
    );
    const r1: IAutoMovieVector3 = {
      ...approach.toeOff,
      y: Math.max(
        approach.toeOff.y,
        pushed.ankle.y +
          Math.sqrt(Math.max(0, (REACH * leg) ** 2 - behind * behind)),
      ),
    };
    const reachAhead: number = along(Vector3.subtract(approach.ankle, r0));
    // The landing leg meets the floor flexed to `LAND` of its length, so
    // the hips come down no higher than that reach above the lead ankle.
    const r2: IAutoMovieVector3 = {
      ...Vector3.subtract(landing.ankle, Vector3.scale(ahead, reachAhead)),
      y: Math.min(
        r0.y,
        landing.ankle.y +
          Math.sqrt(Math.max(0, (LAND * leg) ** 2 - reachAhead ** 2)),
      ),
    };
    // At the lead touchdown the trail knee drives forward: its ankle a
    // tenth of the leg ahead of the hips, a third of the leg up
    // (provisional), for the next stride.
    const recovery: IAutoMovieMotionHumanFoot.IPlacement = {
      ankle: on(
        take,
        along(Vector3.subtract(r2, bar.at)) + 0.1 * leg,
        bar.at.y + 0.35 * leg,
      ),
      rotation: landing.rotation,
    };
    const fly: number = along(Vector3.subtract(r2, r1)) / approach.speed;
    const vy: number = (r2.y - r1.y) / fly + (g * fly) / 2;
    const v1: IAutoMovieVector3 = { x: flat.x, y: vy, z: flat.z };
    const off: number = approach.stance;
    const down: number = off + fly;
    const duration: number = down + SETTLE;
    const crossing: number =
      off +
      along(
        Vector3.subtract(Vector3.add(bar.at, Vector3.scale(ahead, middle)), r1),
      ) /
        approach.speed;
    if (!(crossing > off && crossing < down))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "hurdle",
        value: crossing,
        reason:
          "the body must cross the bar's plane after takeoff and before landing",
        fix: "change the staged approach and landing",
      });
    const hipsRest: IAutoMovieVector3 = body.rest.get("hips")!;
    const root: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 => {
      if (t <= off) {
        const s: number = t / off;
        const h00: number = 2 * s ** 3 - 3 * s ** 2 + 1;
        const h10: number = s ** 3 - 2 * s ** 2 + s;
        const h01: number = -2 * s ** 3 + 3 * s ** 2;
        const h11: number = s ** 3 - s ** 2;
        return Vector3.add(
          Vector3.add(Vector3.scale(r0, h00), Vector3.scale(v0, h10 * off)),
          Vector3.add(Vector3.scale(r1, h01), Vector3.scale(v1, h11 * off)),
        );
      }
      const f: number = Math.min(t, down) - off;
      const flown: IAutoMovieVector3 = {
        x: r1.x + v1.x * f,
        y: r1.y + vy * f - (g * f * f) / 2,
        z: r1.z + v1.z * f,
      };
      return t <= down
        ? flown
        : Vector3.add(flown, Vector3.scale(flat, t - down));
    };

    // The trail foot crosses the bar's plane with the hips `TUCK` past the
    // bar, thigh and shank folded level with the hip joint (McLean 1994's
    // trail leg), so its sole lies the ankle's height below that joint: the
    // flight must lift that sole over the top.
    const tucked: number = crossing + TUCK / approach.speed;
    const tuck: number =
      root(tucked).y +
      body.rest.get(`${take}UpperLeg`)!.y -
      hipsRest.y -
      body.rest.get(`${take}Foot`)!.y;
    if (!(tucked < down))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "hurdle",
        value: tucked,
        reason: "the trailing foot must cross before lead touchdown",
        fix: "change the staged approach and landing",
      });

    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(duration, [
      { name: "takeoff", seconds: off },
      { name: "clear", seconds: crossing },
      { name: "touchdown", seconds: down },
    ]);
    const leadSwing: (u: number) => IAutoMovieMotionHumanFoot.IPlacement =
      AthleticsSwing.prepare({
        from: {
          ankle: context.entry.feet[lead].ankle,
          rotation: context.entry.feet[lead].rotation,
        },
        // The lead leg reaches over heel first, the toes drawn up.
        over: HumanFoot.pivot(
          body,
          lead,
          "heel",
          on(lead, middle, top + CLEAR),
          yaw,
          LEAD,
        ),
        to: landing,
      });
    const trailSwing: (u: number) => IAutoMovieMotionHumanFoot.IPlacement =
      AthleticsSwing.prepare({
        from: AthleticsRunUp.stance(context, take, off),
        // The trail leg comes round out to its side, the sole flat over
        // the bar and the toes turned out.
        over: HumanFoot.pivot(
          body,
          take,
          "sole",
          on(take, middle, tuck, OUT * leg),
          yaw + (take === "left" ? TURN : -TURN),
          0,
        ),
        to: recovery,
      });

    const primitives: IAutoMovieMotionHumanPrimitive[] = [
      {
        channels: ["root", "trunk"],
        reads: ["root", "trunk"],
        from: 0,
        to: duration,
        write: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanPosture => {
          // The path is the hips'; the root follows from the pitched trunk.
          const pitched: IAutoMovieMotionHumanPosture = {
            ...posture,
            pitch:
              posture.pitch +
              DIP * Math.sin((Math.PI * Math.min(seconds, down)) / down),
          };
          return {
            ...pitched,
            root: Vector3.subtract(
              root(seconds),
              Quaternion.rotateVector(humanPostureHeading(pitched), hipsRest),
            ),
          };
        },
      },
      AutoMovieMotionHumanLeg.place({
        body,
        side: take,
        from: 0,
        to: duration,
        placement: (
          _: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanFoot.IPlacement =>
          seconds <= off
            ? AthleticsRunUp.stance(context, take, seconds)
            : trailSwing(
                seconds <= tucked
                  ? (0.5 * (seconds - off)) / (tucked - off)
                  : 0.5 + (0.5 * (seconds - tucked)) / (down - tucked),
              ),
        planted: (seconds: number): boolean => seconds <= off,
      }),
      AutoMovieMotionHumanLeg.place({
        body,
        side: lead,
        from: 0,
        to: duration,
        placement: (
          _: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanFoot.IPlacement => leadSwing(seconds / down),
        planted: (seconds: number): boolean => seconds >= down,
      }),
    ];
    const plan: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, entry, [
          {
            part: `${take}Foot`,
            kind: "plant",
            from: 0,
            to: off / duration,
            support: { kind: "ground" },
          },
          {
            part: `${lead}Foot`,
            kind: "plant",
            from: down / duration,
            to: 1,
            support: { kind: "ground" },
          },
        ]),
        clock,
        primitives,
      });
    crossingClearance(context, plan, [context.params.hurdle], {
      bones: crossingClearance.LOWER_LEGS,
      marks: [off, crossing, down / 2, tucked, down],
      rate: 240,
      allowance: 0.001,
    });
    return plan;
  }
}
