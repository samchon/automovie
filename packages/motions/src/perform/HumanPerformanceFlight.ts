import {
  AutoMovieGravity,
  type IAutoMovieResolvedBone,
  MotionTrajectoryFailure,
  Quaternion,
  Vector3,
  integrateAirborneRotation,
  integrateMotionTrajectory,
  prepareAutoMovieMassModel,
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
import { poseBones } from "../posture/poseBones";
import { HumanPerformanceFlightRotation } from "./HumanPerformanceFlightRotation";
import { HumanPerformanceFlightFailure } from "./HumanPerformanceFlightFailure";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";
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
 * the carrier, overlays and layers at each actual integration or physical
 * probe instant from take-off. FK starts at an identity root to express
 * that already composed articulation directly in the root's own frame,
 * so a rigid world placement is not applied and then undone for every bone.
 * The result does not depend on where or facing which way the flight happens.
 * Its history
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
 * (`ACCURACY` and an independent physical momentum budget), its steps as short as the shape's changes need, and read
 * between its knots by the integrator's own continuous extension, so a
 * shape that changes fast turns at its momentum's rate there too.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is turned, which shape is read and in which frame, where the momentum comes from, the refusal, the rotation handed back and why it reads no displayed pose afterwards.
 * @evidence contracts/development/design.md#principled-representation A post-contact pass turns each carrier's declared flight from one unchanged composed shape history, then hands a numeric rigid-rotation reader back to that plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The performance constructor calls flights once after placement and contact resolution; ACCURACY supplies the pass's existing integration budget and the private momentum budget supplies its independent physical dense-error criterion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The engine owns inertia, relative momentum, integration and shooting; the pass supplies displayed shape and locates refusals by the placement walk's stable-id occurrence.
 * Torque-free flight of the composed multibody through the engine's airborne integrator and take-off solver; the rotation is the integrated orientation relative to the unturned one, about the centre of mass, so the composed body is turned rigidly as a whole.
 * One pass over the people's flights: tabulate the shape, find the momentum, integrate, tabulate the rotation, hand it back.
 * A turn the take-off cannot give is refused, never clamped.
 * Takeoff attitude requests only the original displayed root, without unrelated bone observations; unsupported composition retains ordinary complete fitting. Each new history query reduces at most four posed instants. FK admits every authored joint but computes only mass-bearing bones and ancestors. Root-space FK omits rigid world placement and reversal. Adaptive shooting controls the query population and runtime improvement remains unmeasured.
 * Exact query times share numeric inertia/momentum and mass nodes; fixed stencils share moments, and playback uses the judged flight. One planning-owned mass snapshot shares local offsets, principal frames, intrinsic tensors and endpoint quaternion differences. The displayed workspace lends clamp metadata and one lazy operation reader/key to composition/IK and mass FK. The body's prepared rig owns exact dynamic rows under that weak key; the raw adapter itself retains no tuples. Every actual goal, shape, orbital shift, interval rate and momentum check remains evaluated with normal context fallbacks.
 * Numeric table/trajectory escape only through HumanPerformanceFlightRotation, outside performance/model/history/workspace scope. Each flight owns O(B+D) clamp metadata and one live key for the body's O(J+B) weak FK rows; the person's pass owns O(S) mass prerequisites. N exact I/h queries retain at most 3N+6 numeric mass nodes, O(N*S), plus O(N) I/h until finally clears every node. Releasing the flight key ends its rig-row lifetime, and outer finally releases the mass token. No full pose, raw bone map or live reader enters playback.
 */
export namespace HumanPerformanceFlight {
  /**
   * The original embedded orientation RMS and same-unit sensitivity-matrix
   * budgets, with no absolute floor. This local state estimate does not
   * bound the dense angular rate or its inertia-conditioned momentum error;
   * the independent physical momentum budget checks the latter directly.
   */
  export const ACCURACY: Readonly<{ relative: number; absolute: number }> = {
    relative: 0.01 / 2,
    absolute: 0,
  };

  /**
   * The target-relative dense angular-momentum budget, independently of the
   * orientation's local estimate. If each read differs from the constant
   * model momentum L by at most delta ||L||, two reads differ by at most
   * 2 delta/(1-delta) of the reference read. Thus #3416's existing 1 %
   * comparison requires delta <= .01/(2+.01), with no absolute floor.
   * Controller probes are sampled; this implication does not certify every
   * time or the separate finite-difference pose-observation error.
   */
  const MOMENTUM_ACCURACY: Readonly<{ relative: number; absolute: number }> = {
    relative: 0.01 / (2 + 0.01),
    absolute: 0,
  };

  /**
   * Turn every placed flight of a performance.
   *
   * @param self The performance, placed and its contacts resolved.
   * @param people The people.
   * @param observation Optional native cumulative history-work observer, borrowed only during planning; no diagnostic callback is invoked by this pass.
   * @throws {HumanRefusal} When a flight's turns cannot be met by its take-off.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Turns each placed carrier with both flight and airborne declarations, and locates a refusal at its performer, action and stable-id occurrence.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the composed physical flight to flight; a refused segment is located by the count of earlier walk entries with the same id across carriers and overlays, matching placement's occurrence rule despite film-time sorting.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Visit carriers, skip plans without a flight reader, turn each flight and locate only HumanRefusal errors.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts HumanRefusal.locate preserves already located nested refusals, and other thrown values are rethrown unchanged; a carrier index or film start never substitutes for id occurrence.
   * @evidence contracts/development/implementation.md#efficient-algorithms Visits each carrier once; numerical and shape work belong to flight. Only a refusal scans the person's carriers and overlays to recover its occurrence.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads already placed segment ids and walk-entry indices. A person's flights share one immutable mass snapshot, demanded bone set and exact intrinsic/interval prerequisites, prepared lazily at its first actual flight.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A person's pass owns one O(S) prepared mass token and demanded set until its last flight or refusal; finally releases the token. Each flight separately clears its temporary numeric history, and only completed numeric playback rotations survive.
   */
  export function flights(
    self: HumanPerformanceState,
    people: Iterable<HumanSegment.IPerson>,
    observation?: ReturnType<typeof integrateAirborneRotation.observe>,
  ): void {
    for (const person of people) {
      let prepared: prepareAutoMovieMassModel.IPrepared | undefined;
      let requested: ReadonlySet<AutoMovieHumanoidBone> | undefined;
      let readBones: ReturnType<typeof poseBones.prepare> | undefined;
      try {
        for (const segment of person.segments) {
          const plan: IHumanActionPlan = segment.plan;
          if (plan.flight === undefined || plan.airborne === undefined) continue;

          // A body stays unchanged for the pass, but people without a flight
          // need neither a physical workspace nor a demanded-bone set.
          prepared ??= prepareAutoMovieMassModel(person.performer.body.massModel);
          requested ??= prepareAutoMovieMassModel.bones(prepared);
          readBones ??= poseBones.prepare(person.performer.body, requested);
          try {
            flight(self, person, segment, prepared, requested, readBones, observation);
          } catch (error) {
            if (!(error instanceof HumanRefusal)) throw error;
            throw error.locate({
              performer: person.performer.subject,
              act: segment.name,
              instance:
                [...person.segments, ...person.overlays].filter(
                  (s: HumanSegment.ISegment): boolean =>
                    s.id === segment.id && s.entry < segment.entry,
                ).length + 1,
            });
          }
        }
      } finally {
        if (prepared !== undefined) prepareAutoMovieMassModel.release(prepared);
      }
    }
  }

  /**
   * Turn one action's flight and hand its rotation to the plan.
   *
   * @param self The performance.
   * @param person The person.
   * @param segment The action that flies.
   * @param observation Optional native history counters shared by this performance's flights, with no retained callback or per-query event records.
   * @throws {HumanRefusal} When the flight's turns cannot be met.
   */
  function flight(
    self: HumanPerformanceState,
    person: HumanSegment.IPerson,
    segment: HumanSegment.ISegment,
    prepared: prepareAutoMovieMassModel.IPrepared,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
    readBones: ReturnType<typeof poseBones.prepare>,
    observation?: ReturnType<typeof integrateAirborneRotation.observe>,
  ): void {
    const plan: IHumanActionPlan = segment.plan;
    const declared: IHumanActionPlan.IFlight = plan.flight!;
    const subject: string = person.performer.subject;
    const body: IHumanBody = person.performer.body;
    const model: resolveAutoMovieCenterOfMass.IModel =
      body.massModel;
    const t0: number = segment.start + declared.from * plan.duration;
    const t1: number = segment.start + declared.to * plan.duration;
    const evaluation: prepareHumanSegmentPose.IPrepared = prepareHumanSegmentPose(body);
    const unturned: (seconds: number) => IAutoMoviePose = (
      seconds: number,
    ): IAutoMoviePose =>
      HumanPerformanceRead.pose(self, subject, seconds, requested, evaluation);
    const readResolution: prepareHumanSegmentPose.IPrepared["resolution"] = evaluation.resolution;
    const root: (pose: IAutoMoviePose) => IAutoMovieQuaternion = (
      pose: IAutoMoviePose,
    ): IAutoMovieQuaternion =>
      pose.root?.rotation ?? Quaternion.identity();

    // Contacts and IK have already resolved the composed joints. FK with no
    // rigid world root gives their root-frame shape directly, rather than
    // applying that root to every bone and then undoing it again.
    const shape: (
      seconds: number,
    ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
      seconds: number,
    ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      readBones({ ...unturned(seconds), root: null }, readResolution());
    const history: ReturnType<typeof integrateAirborneRotation.history> =
      integrateAirborneRotation.history(prepared, shape, { from: t0, to: t1 }, observation);
    const errorScope: symbol = Symbol("human flight");
    try {
      const q0: IAutoMovieQuaternion = root(
        HumanPerformanceRead.pose(self, subject, t0, ROOT_ONLY, evaluation),
      );

      // The largest angular momentum the take-off can give: the momentum about
      // the centre is the moment of the ground's impulse, `|L| <= r |J|`, with
      // the lever `r` at most the centre's distance from the foot, Hof's
      // pendulum length, and the impulse the take-off momentum `m |v0|`, the
      // centre's velocity read just after take-off from the ballistic composed
      // centre (`c(t) = c0 + v0 t - g t² / 2`, so `v0 = (c(2δ) - c(δ)) / δ +
      // 3 g δ / 2` vertically). First pass: the push's share bearing the
      // weight is left out of `|J|`, so the bound is the impulse of the
      // take-off velocity alone.
      const ceiling: (at: number) => number = (at: number): number => {
        const delta: number = integrateAirborneRotation.DELTA;
        const centre: (t: number) => IAutoMovieVector3 = (
          t: number,
        ): IAutoMovieVector3 =>
          prepareAutoMovieMassModel.place(
            prepared,
            readBones(unturned(t), readResolution()),
          );
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
          momentumTolerance: MOMENTUM_ACCURACY,
          errorScope,
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
          momentumTolerance: MOMENTUM_ACCURACY,
          errorScope,
        });

      // The unturned root and the composed centre on the default step's grid,
      // whatever steps the error control took; the turn from the one to the
      // integrated root, whose own read between its knots keeps the rate the
      // integration gave them.
      const step: number = integrateMotionTrajectory.STEP;
      const knots: number = Math.ceil((t1 - t0) / step) + 1;
      const times: number[] = Array.from(
        { length: knots },
        (_: unknown, k: number): number =>
          k === knots - 1 ? t1 : t0 + k * step,
      );

      /** The numeric sample owned by the playback factory's input contract. */
      type Instant = Parameters<
        typeof HumanPerformanceFlightRotation
      >[0]["table"][number];
      const table: Instant[] = times.map((t: number): Instant => {
        const pose: IAutoMoviePose = unturned(t);
        return {
          about: prepareAutoMovieMassModel.place(
            prepared,
            readBones(pose, readResolution()),
          ),
          root: root(pose),
        };
      });
      const rotation: ReturnType<typeof HumanPerformanceFlightRotation> =
        HumanPerformanceFlightRotation({
          start: segment.start,
          t0,
          t1,
          step,
          times,
          table,
          flight: turned,
        });
      plan.airborne!(rotation);
    } catch (error) {
      if (error instanceof MotionTrajectoryFailure && error.scope === errorScope)
        throw HumanPerformanceFlightFailure(
          error, body, plan, segment.start, t0,
          (seconds: number): IAutoMoviePose => HumanPerformanceRead.pose(self, subject, seconds, undefined, evaluation),
          readResolution,
        );
      throw error;
    } finally {
      // Playback was constructed in a numeric-only factory. Clearing the
      // numeric memo is cleared before this flight's history/shape closure,
      // evaluation workspace and borrowed FK key leave their local scope.
      history.clear();
    }
  }
}

/** Takeoff attitude observes the original root and demands no fitted bone frame. */
const ROOT_ONLY: ReadonlySet<AutoMovieHumanoidBone> = new Set();
