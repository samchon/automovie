import {
  Quaternion,
  integrateAirborneRotation,
  integrateMotionTrajectory,
  prepareAutoMovieMassModel,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFlight,
  IAutoMovieMotionHumanFlightTurns,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieResolveCenterOfMass,
} from "@automovie/interface";

import { jumpAirborne } from "../actions/jumpAirborne";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { HumanPerformanceFlightRotation } from "./HumanPerformanceFlightRotation";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPerformanceStagedFlightRotation } from "./HumanPerformanceStagedFlightRotation";
import { flyPerformanceFlight } from "./flyPerformanceFlight";
import { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

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
    self: IAutoMovieMotionHumanPerformanceState,
    people: Iterable<IAutoMovieMotionHumanSegment.IPerson>,
    observation?: ReturnType<typeof integrateAirborneRotation.observe>,
  ): void {
    for (const person of people) {
      let prepared: prepareAutoMovieMassModel.IPrepared | undefined;
      let requested: ReadonlySet<AutoMovieHumanoidBone> | undefined;
      let readBones: ReturnType<typeof poseBones.prepare> | undefined;
      try {
        for (const segment of person.segments) {
          const plan: IAutoMovieMotionHumanActionPlan = segment.plan;
          if (plan.flight === undefined || plan.airborne === undefined)
            continue;

          // A body stays unchanged for the pass, but people without a flight
          // need neither a physical workspace nor a demanded-bone set.
          try {
            if (
              self.flight === "staged" &&
              plan.flight.momentum.kind === "turns"
            )
              staged(self, person, segment, plan.flight.momentum);
            else {
              prepared ??= prepareAutoMovieMassModel(
                person.performer.body.massModel,
              );
              requested ??= prepareAutoMovieMassModel.bones(prepared);
              readBones ??= poseBones.prepare(person.performer.body, requested);
              flyPerformanceFlight(
                self,
                person,
                segment,
                prepared,
                requested,
                readBones,
                observation,
              );
            }
          } catch (error) {
            if (!(error instanceof HumanRefusal)) throw error;
            throw error.locate({
              performer: person.performer.subject,
              act: segment.name,
              instance:
                [...person.segments, ...person.overlays].filter(
                  (s: IAutoMovieMotionHumanSegment): boolean =>
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
    self: IAutoMovieMotionHumanPerformanceState,
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    turns: IAutoMovieMotionHumanFlightTurns,
  ): void {
    const body: IAutoMovieMotionHumanBody = person.performer.body;
    const model: IAutoMovieResolveCenterOfMass.IModel = body.massModel;
    const requested: Set<AutoMovieHumanoidBone> = new Set();
    for (const part of model.segments) requested.add(part.bone);
    const readBones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      requested,
    );
    const evaluation: prepareHumanSegmentPose.IPrepared =
      prepareHumanSegmentPose(body);
    const declared: IAutoMovieMotionHumanFlight = segment.plan.flight!;
    const t0: number = segment.start + declared.from * segment.plan.duration;
    const t1: number = segment.start + declared.to * segment.plan.duration;
    const data: IPlayback = samples(
      t0,
      t1,
      (seconds: number): IPlayback["table"][number] => {
        const pose: IAutoMoviePose = HumanPerformanceRead.pose(
          self,
          person.performer.subject,
          seconds,
          requested,
          evaluation,
        );
        return {
          about: resolveAutoMovieCenterOfMass.place(
            model,
            readBones(pose, evaluation.resolution()),
          ),
          root: pose.root?.rotation ?? Quaternion.identity(),
        };
      },
    );
    segment.plan.airborne!(
      HumanPerformanceStagedFlightRotation({
        ...data,
        start: segment.start,
        t0,
        t1,
        turns,
        turnedLanding: jumpAirborne.hasTurnedLanding(declared),
      }),
    );
  }
}

/** Numeric playback data shared by staged and physical rotation policies. */
type IPlayback = Pick<
  Parameters<typeof HumanPerformanceFlightRotation>[0],
  "step" | "times" | "table"
>;

/** Sample the existing playback grid once, without retaining its displayed-pose reader. */
function samples(
  from: number,
  to: number,
  read: (seconds: number) => IPlayback["table"][number],
): IPlayback {
  if (
    !(
      Number.isFinite(from) &&
      Number.isFinite(to) &&
      Number.isFinite(to - from) &&
      to > from
    )
  )
    throw new Error("Flight playback needs a positive finite interval");
  const step: number = integrateMotionTrajectory.STEP;
  const knots: number = Math.ceil((to - from) / step) + 1;
  const times: number[] = Array.from(
    { length: knots },
    (_: unknown, k: number): number => (k === knots - 1 ? to : from + k * step),
  );
  return { step, times, table: times.map(read) };
}
