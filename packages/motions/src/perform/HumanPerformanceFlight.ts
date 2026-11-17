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
import { HumanPerformanceStagedFlightRotation } from "./HumanPerformanceStagedFlightRotation";
import { HumanPerformanceFlightFailure } from "./HumanPerformanceFlightFailure";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPoseKnots } from "./HumanPoseKnots";
import { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import type { HumanSegment } from "./HumanSegment";

/**
 * Hand each placed flight its rigid turn after placement and contacts.
 * Authored turn counts use the performance's staged default: exact
 * unwrapped angles about the law's composed centre, with its existing
 * articulation and heading. This path samples only numeric centre/root
 * playback data and creates no physical history or momentum verdict.
 * Explicit physical mode and every supplied momentum use the physical
 * path below. Both hand a reader back once through the same plan hook.
 *
 * The shape is the person's displayed body before the flight's rotation:
 * the carrier, overlays and layers at each actual integration or physical
 * probe instant from take-off. FK starts at an identity root to express
 * that already composed articulation directly in the root's own frame,
 * so a rigid world placement is not applied and then undone for every bone.
 * The result does not depend on where or facing which way the flight happens.
 * Its history
 * gives the composite inertia and the segments' relative momentum
 * (`integrateAirborneRotation.tabulated`), read inside the flight alone,
 * from take-off to touchdown, so the push-off and the landing are not read; the
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
 * are tabulated at the flight's knots (the fewest equal intervals no longer
 * than `1 / HumanPoseKnots.RATE` s; a staged flight keeps the integrator's
 * default step) and read between those
 * instants by slerp and by line, so the plan's posture reads no displayed
 * pose and the pass has no cycle; `q(t)` is integrated under error control
 * (`ACCURACY` and an independent physical momentum budget), its steps as short as the shape's changes need, and read
 * between its knots by the integrator's own continuous extension, so a
 * shape that changes fast turns at its momentum's rate there too.
 * The shape's history is tabulated once at those knots
 * (`integrateAirborneRotation.tabulated`): the inertia and the relative
 * momentum of the exact unturned pose at each knot, read between them by a
 * cubic, in place of a shape read at every stage and a millisecond either
 * side of it. One unturned pose a knot serves the shape, the take-off
 * attitude and the playback table; the take-off's momentum ceiling reads its
 * two own instants. Every physical acceptance bound remains unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States staged authored-turn default, mandatory physics for supplied momentum, current heading/COM/articulation preservation and numeric-only handback. The physical path states root/world frames, momentum source, refusal and independent dense-control budget without applying those conservation claims to staged motion.
 * @evidence contracts/development/design.md#principled-representation One post-contact dispatcher selects an explicit authored-turn policy before preparing physics. Staged turn counts are an unwrapped kinematic curve; physical requests retain one unchanged composed shape history. Both use the same numeric COM/root playback owner and plan handback.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The performance constructor calls flights once after placement and contact resolution. Its one resolved mode selects authored turns only; ACCURACY and the independent dense momentum budget belong exclusively to physical integration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Staged motion is an explicit production policy and never fabricates physical momentum, skips a declared force outcome or reports conservation. Given momentum always reaches the engine's existing inertia/integration path; physical turns retain shooting and original refusals. Stable-id occurrence locates either path's refusal.
 * Torque-free flight of the composed multibody through the engine's airborne integrator and take-off solver; the rotation is the integrated orientation relative to the unturned one, about the centre of mass, so the composed body is turned rigidly as a whole.
 * One pass over the people's flights: tabulate the shape, find the momentum, integrate, tabulate the rotation, hand it back.
 * Under physical policy, a turn the take-off cannot give is refused, never clamped.
 * Takeoff attitude is the root of the first knot's unturned pose, the one the shape and the playback table read; unsupported composition retains ordinary complete fitting. A physical flight evaluates one unturned pose a knot plus the ceiling's two. FK admits every authored joint but computes only mass-bearing bones and ancestors. Root-space FK omits rigid world placement and reversal. Adaptive shooting controls the query population and runtime improvement remains unmeasured.
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
   * @throws {HumanRefusal} For invalid staged data or physical turns the take-off cannot meet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Turns each placed carrier with both flight and airborne declarations, and locates a refusal at its performer, action and stable-id occurrence.
   * @evidence contracts/development/implementation.md#principled-implementation Authored turns in staged mode use the direct unwrapped rotation owner; explicit physical mode or supplied momentum uses the existing composed physical flight. Stable-id occurrence locates a refusal across carriers and overlays, matching placement despite film-time sorting.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Visit carriers, skip plans without a flight reader, dispatch before any physical preparation and locate only HumanRefusal errors. staged samples numeric playback data once; physical flight retains the existing solver and clear boundary.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Staged creates no physical history, inertia tensor, momentum shooting or dense controller, and makes no conservation claim. Supplied momentum cannot opt out of physics. HumanRefusal.locate preserves located nested refusals and all other errors pass through unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Visits each carrier once. Staged samples the existing 60 Hz playback grid once, O(T/step) actual displayed evaluations, then O(1) analytic turn work per read; it has no adaptive/shooting query population. Physical numerical/shape work retains its existing owners. Runtime gains remain unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both policies share numeric playback sampling/interpolation without a second displayed callback per sample. Only actual physical flights lazily share one immutable mass snapshot, demanded bone set and intrinsic/interval prerequisites for the person.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Staged retains only completed numeric table/angle data after its body/FK workspace ends. Physical flights separately clear temporary histories and the person's O(S) mass token releases in finally. No performance, body, displayed reader or physical history enters either completed playback.
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
          try {
            if (self.flight === "staged" && plan.flight.momentum.kind === "turns")
              staged(self, person, segment, plan.flight.momentum);
            else {
              prepared ??= prepareAutoMovieMassModel(person.performer.body.massModel);
              requested ??= prepareAutoMovieMassModel.bones(prepared);
              readBones ??= poseBones.prepare(person.performer.body, requested);
              flight(self, person, segment, prepared, requested, readBones, observation);
            }
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

  /** Hand back authored turns without constructing a physical history or take-off problem. */
  function staged(
    self: HumanPerformanceState,
    person: HumanSegment.IPerson,
    segment: HumanSegment.ISegment,
    turns: IHumanActionPlan.IFlightTurns,
  ): void {
    const body: IHumanBody = person.performer.body;
    const model: resolveAutoMovieCenterOfMass.IModel = body.massModel;
    const requested: Set<AutoMovieHumanoidBone> = new Set();
    for (const part of model.segments) requested.add(part.bone);
    const readBones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, requested);
    const evaluation: prepareHumanSegmentPose.IPrepared = prepareHumanSegmentPose(body);
    const declared: IHumanActionPlan.IFlight = segment.plan.flight!;
    const t0: number = segment.start + declared.from * segment.plan.duration;
    const t1: number = segment.start + declared.to * segment.plan.duration;
    const data: IPlayback = samples(t0, t1, (seconds: number): IPlayback["table"][number] => {
      const pose: IAutoMoviePose = HumanPerformanceRead.pose(self, person.performer.subject, seconds, requested, evaluation);
      return {
        about: resolveAutoMovieCenterOfMass.place(model, readBones(pose, evaluation.resolution())),
        root: pose.root?.rotation ?? Quaternion.identity(),
      };
    });
    segment.plan.airborne!(HumanPerformanceStagedFlightRotation({
      ...data, start: segment.start, t0, t1, turns,
    }));
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
    // The flight's knots: the fewest equal intervals no longer than the
    // film's knot spacing, from take-off to touchdown, as the tabulated
    // history divides its span (`AirborneTabulatedShapeHistory`). The
    // unturned pose is evaluated once at each and read there by the shape,
    // the take-off attitude and the playback table alike; a second that is
    // no knot is evaluated as asked.
    const step: number = 1 / HumanPoseKnots.RATE;
    const intervals: number = Math.max(1, Math.ceil((t1 - t0) / step - 1e-9));
    const spacing: number = (t1 - t0) / intervals;
    const knots: number[] = Array.from(
      { length: intervals + 1 },
      (_: unknown, k: number): number => (k === intervals ? t1 : t0 + k * spacing),
    );
    const posed: Map<number, IAutoMoviePose> = new Map();
    const at: (seconds: number) => IAutoMoviePose = (seconds: number): IAutoMoviePose => {
      let pose: IAutoMoviePose | undefined = posed.get(seconds);
      if (pose === undefined) {
        pose = unturned(seconds);
        posed.set(seconds, pose);
      }
      return pose;
    };
    const shape: (
      seconds: number,
    ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
      seconds: number,
    ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      readBones({ ...at(seconds), root: null }, readResolution());

    // The shape's inertia and relative momentum are tabulated once at the
    // knots for every stage and shooting trial
    // (`integrateAirborneRotation.tabulated`), so the flight reads no pose
    // between them. A free-foot curve's own instantaneous bone rates are not
    // asked for: on test_human_motion_core_flight_sample they were accepted
    // at 27 of 2,293 instants, and the other 2,266 fell back to the
    // millisecond stencil after 6,777 shape reads and as many rate attempts.
    // Where a part turns fast (a tuck's thighs by 0.65 rad a knot as it is
    // laid in), the table divides the knot's interval so no part turns more
    // than the angle whose chord reads a part's orbital momentum short by
    // the flight's own momentum budget (`a^2 / 6` of it, so `a = sqrt(6 d)`
    // with `d` the budget `MOMENTUM_ACCURACY` states).
    const history: ReturnType<typeof integrateAirborneRotation.history> =
      integrateAirborneRotation.tabulated(prepared, shape, {
        from: t0,
        to: t1,
        step,
        turn: Math.sqrt(6 * MOMENTUM_ACCURACY.relative),
      }, observation);
    const errorScope: symbol = Symbol("human flight");
    try {
      const q0: IAutoMovieQuaternion = root(at(t0));

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

      // The unturned root and the composed centre at the flight's knots, the
      // poses the shape was read from, whatever steps the error control
      // took; the turn from the one to the integrated root, whose own read
      // between its knots keeps the rate the integration gave them.
      const data: IPlayback = {
        step: spacing,
        times: knots,
        table: knots.map((t: number): IPlayback["table"][number] => {
          const pose: IAutoMoviePose = at(t);
          return {
            about: prepareAutoMovieMassModel.place(
              prepared,
              readBones(pose, readResolution()),
            ),
            root: root(pose),
          };
        }),
      };
      const rotation: ReturnType<typeof HumanPerformanceFlightRotation> =
        HumanPerformanceFlightRotation({
          start: segment.start,
          t0,
          t1,
          ...data,
          orientation: turned.orientation,
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

/** Numeric playback data shared by staged and physical rotation policies. */
type IPlayback = Pick<Parameters<typeof HumanPerformanceFlightRotation>[0], "step" | "times" | "table">;

/** Sample the existing playback grid once, without retaining its displayed-pose reader. */
function samples(from: number, to: number,
  read: (seconds: number) => IPlayback["table"][number]): IPlayback {
  if (!(Number.isFinite(from) && Number.isFinite(to) && Number.isFinite(to - from) && to > from))
    throw new Error("Flight playback needs a positive finite interval");
  const step: number = integrateMotionTrajectory.STEP;
  const knots: number = Math.ceil((to - from) / step) + 1;
  const times: number[] = Array.from({ length: knots }, (_: unknown, k: number): number =>
    k === knots - 1 ? to : from + k * step);
  return { step, times, table: times.map(read) };
}
