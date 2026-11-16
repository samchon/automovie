import {
  AutoMovieGravity,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  integrateAirborneRotation,
  integrateMotionTrajectory,
  resolveAutoMovieCenterOfMass,
  solveAirborneTakeoff,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import type { HumanSegment } from "./HumanSegment";

/**
 * The flight pass of a performance (#3427): every placed action that
 * declares a flight (`IHumanActionPlan.flight`) is turned through it by its
 * angular momentum and the shape the whole composed body takes, and the
 * rotation is handed back to the plan (`IHumanActionPlan.airborne`), once,
 * after placement and the contacts, as the contacts hand back their stops.
 *
 * The shape is the person's displayed body before the flight's rotation:
 * the carrier, its overlays and its layers, read at the integrator's knots
 * from take-off and carried into the root's own frame, so the result does
 * not depend on where or facing which way the flight happens. Its history
 * gives the composite inertia and the segments' relative momentum
 * (`integrateAirborneRotation.history`), differenced inside the flight at
 * take-off and touchdown so the push-off and the landing are not read; the
 * momentum is the plan's, or the
 * one `solveAirborneTakeoff` finds for its turns within the take-off's
 * ceiling (the moment of the take-off's momentum about the foot, at most
 * the centre's distance from it, unless the plan states its own), and a
 * request it cannot meet within it is refused on the action, naming the
 * turns. The root's orientation
 * `q(t)` is integrated from the displayed one at take-off, and the rotation
 * handed back is `q(t) R(t)⁻¹` about the composed centre of mass, `R(t)` the
 * unturned root's own rotation, so the turned root is exactly `q(t)` and
 * the centre stays where the composed shape put it. `R(t)` and the centre
 * are tabulated on the integrator's default step and read between those
 * instants by slerp and by line, so the plan's posture reads no displayed
 * pose and the pass has no cycle; `q(t)` is integrated under error control
 * (`ACCURACY`), its steps as short as the shape's changes need, and read
 * between its knots by the integrator's own continuous extension, so a
 * shape that changes fast turns at its momentum's rate there too.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is turned, which shape is read and in which frame, where the momentum comes from, the refusal, the rotation handed back and why it reads no displayed pose afterwards.
 * @evidence contracts/development/implementation.md#principled-implementation Torque-free flight of the composed multibody through the engine's airborne integrator and take-off solver; the rotation is the integrated orientation relative to the unturned one, about the centre of mass, so the composed body is turned rigidly as a whole.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the people's flights: tabulate the shape, find the momentum, integrate, tabulate the rotation, hand it back.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A turn the take-off cannot give is refused, never clamped.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each distinct stage or difference time resolves one displayed pose and its bones, linear in the skeleton after the posture's limb fits. Exact repeated times reuse the history, but adaptive shooting trials add different times; real-body completion cost remains unresolved.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The history keeps each exact instant's inertia and relative momentum across the search, and playback reuses the evaluated flight whose residual was judged.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The tables and integrated flight live with the plan that receives its rotation. The history's bone and instant maps have no fixed population bound across adaptive trials; the pass keeps them until its search ends and does not attach them to the plan.
 */
export namespace HumanPerformanceFlight {
  /**
   * The flight's error control: each step's rotation within half a
   * hundredth of the step's own turn, no absolute floor. A step's error
   * under that share of its turn `|w| h` bounds the rate read over it by the
   * same share of `|w|`, and the momentum read from the displayed bones,
   * `I w + h`, with it; #3416 accepts a read-back within 1 % of the take-off
   * momentum, and that check compares two reads, so each gets half.
   */
  export const ACCURACY: Readonly<{ relative: number; absolute: number }> = {
    relative: 0.01 / 2,
    absolute: 0,
  };

  /**
   * Turn every placed flight of a performance.
   *
   * @param self The performance, placed and its contacts resolved.
   * @param people The people.
   * @throws {HumanRefusal} When a flight's turns cannot be met by its take-off.
   */
  export function flights(
    self: HumanPerformanceState,
    people: Iterable<HumanSegment.IPerson>,
  ): void {
    for (const person of people)
      for (const segment of person.segments) {
        const plan: IHumanActionPlan = segment.plan;
        if (plan.flight === undefined || plan.airborne === undefined) continue;
        flight(self, person, segment);
      }
  }

  /**
   * Turn one action's flight and hand its rotation to the plan.
   *
   * @param self The performance.
   * @param person The person.
   * @param segment The action that flies.
   * @throws {HumanRefusal} When the flight's turns cannot be met.
   */
  function flight(
    self: HumanPerformanceState,
    person: HumanSegment.IPerson,
    segment: HumanSegment.ISegment,
  ): void {
    const plan: IHumanActionPlan = segment.plan;
    const declared: IHumanActionPlan.IFlight = plan.flight!;
    const subject: string = person.performer.subject;
    const body: IHumanBody = person.performer.body;
    const model: resolveAutoMovieCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const t0: number = segment.start + declared.from * plan.duration;
    const t1: number = segment.start + declared.to * plan.duration;
    const unturned = (seconds: number): IAutoMoviePose =>
      HumanPerformanceRead.pose(self, subject, seconds);
    const root = (pose: IAutoMoviePose): IAutoMovieQuaternion =>
      pose.root?.rotation ?? Quaternion.identity();

    // The composed shape in the root's own frame.
    const shape = (
      seconds: number,
    ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const pose: IAutoMoviePose = unturned(seconds);
      const at: IAutoMovieVector3 = pose.root?.translation ?? {
        x: 0,
        y: 0,
        z: 0,
      };
      const back: IAutoMovieQuaternion = Quaternion.inverse(root(pose));
      const out: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
      for (const [bone, r] of poseBones(body, pose))
        out.set(bone, {
          ...r,
          worldPosition: Quaternion.rotateVector(
            back,
            Vector3.subtract(r.worldPosition, at),
          ),
          worldRotation: Quaternion.multiply(back, r.worldRotation),
        });
      return out;
    };
    const history: integrateAirborneRotation.IHistory =
      integrateAirborneRotation.history(model, shape, { from: t0, to: t1 });
    const q0: IAutoMovieQuaternion = root(unturned(t0));

    // The largest angular momentum the take-off can give: the momentum about
    // the centre is the moment of the ground's impulse, `|L| <= r |J|`, with
    // the lever `r` at most the centre's distance from the foot, Hof's
    // pendulum length, and the impulse the take-off momentum `m |v0|`, the
    // centre's velocity read just after take-off from the ballistic composed
    // centre (`c(t) = c0 + v0 t - g t² / 2`, so `v0 = (c(2δ) - c(δ)) / δ +
    // 3 g δ / 2` vertically). First pass: the push's share bearing the
    // weight is left out of `|J|`, so the bound is the impulse of the
    // take-off velocity alone.
    const ceiling = (at: number): number => {
      const delta: number = integrateAirborneRotation.DELTA;
      const centre = (t: number): IAutoMovieVector3 =>
        resolveAutoMovieCenterOfMass.place(model, poseBones(body, unturned(t)));
      const one: IAutoMovieVector3 = centre(at + delta);
      const two: IAutoMovieVector3 = centre(at + 2 * delta);
      const v0: IAutoMovieVector3 = {
        x: (two.x - one.x) / delta,
        y: (two.y - one.y) / delta + 1.5 * AutoMovieGravity.STANDARD * delta,
        z: (two.z - one.z) / delta,
      };
      return (
        model.mass *
        Vector3.length(v0) *
        resolveAutoMovieCenterOfMass.pendulum(body.measure.hipHeight)
      );
    };

    // The momentum: given, or solved from the turns.
    let momentum: IAutoMovieVector3;
    let solvedFlight: integrateAirborneRotation.IFlight | undefined;
    if (declared.momentum.kind === "momentum")
      momentum = declared.momentum.momentum;
    else {
      const turns: IHumanActionPlan.IFlightTurns = declared.momentum;
      const maximum: number = turns.maximum ?? ceiling(t0);
      const solved: solveAirborneTakeoff.ISolution = solveAirborneTakeoff({
        history,
        t0,
        t1,
        q0,
        frame: turns.frame,
        somersault: turns.somersault,
        twist: turns.twist,
        maximum,
        integration: HumanPerformanceFlight.ACCURACY,
      });
      if (!solved.met)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "turns",
          value: { somersault: turns.somersault, twist: turns.twist },
          feasible: null,
          reason: `a flight of ${(t1 - t0).toFixed(2)} s misses the requested turns by ${solved.residual.somersault.toFixed(3)} somersault, ${solved.residual.tilt.toFixed(3)} tilt and ${solved.residual.twist.toFixed(3)} twist revolutions within ${maximum.toFixed(1)} kg m²/s of momentum`,
          fix: "give a higher apex for a longer flight, or fewer turns",
          performer: subject,
          act: segment.name,
        });
      momentum = solved.momentum;
      solvedFlight = solved.flight;
    }
    const turned: integrateAirborneRotation.IFlight =
      solvedFlight ??
      integrateAirborneRotation({
        history,
        t0,
        t1,
        q0,
        momentum,
        tolerance: HumanPerformanceFlight.ACCURACY,
      });

    // The unturned root and the composed centre on the default step's grid,
    // whatever steps the error control took; the turn from the one to the
    // integrated root, whose own read between its knots keeps the rate the
    // integration gave them.
    const step: number = integrateMotionTrajectory.STEP;
    const knots: number = Math.ceil((t1 - t0) / step) + 1;
    const times: number[] = Array.from(
      { length: knots },
      (_: unknown, k: number): number => (k === knots - 1 ? t1 : t0 + k * step),
    );
    const table: { about: IAutoMovieVector3; root: IAutoMovieQuaternion }[] =
      times.map(
        (
          t: number,
        ): { about: IAutoMovieVector3; root: IAutoMovieQuaternion } => {
          const pose: IAutoMoviePose = unturned(t);
          return {
            about: resolveAutoMovieCenterOfMass.place(
              model,
              poseBones(body, pose),
            ),
            root: root(pose),
          };
        },
      );
    const rotation = (seconds: number): IHumanPosture.IRotation => {
      const t: number = Math.max(t0, Math.min(t1, segment.start + seconds));
      const i: number = Math.min(knots - 2, Math.floor((t - t0) / step));
      const a: number = times[i]!;
      const u: number = (t - a) / (times[i + 1]! - a);
      return {
        about: Vector3.add(
          table[i]!.about,
          Vector3.scale(
            Vector3.subtract(table[i + 1]!.about, table[i]!.about),
            u,
          ),
        ),
        turn: Quaternion.normalize(
          Quaternion.multiply(
            turned.orientation(t),
            Quaternion.inverse(
              Quaternion.slerp(table[i]!.root, table[i + 1]!.root, u),
            ),
          ),
        ),
      };
    };
    plan.airborne!(rotation);
  }
}
