import { Quaternion, AutoMovieEngineMotionAirborneRotation, AutoMovieEngineMotionTrajectory, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanFlight, IAutoMovieMotionHumanFlightTurns, IAutoMovieMotionHumanPerformanceState, IAutoMovieMotionHumanSegment, IAutoMoviePose, IAutoMovieResolveCenterOfMass } from "@automovie/interface";

import { jumpAirborne } from "../actions/internal/jumpAirborne";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/internal/poseBones";
import { HumanPerformanceFlightRotation } from "./HumanPerformanceFlightRotation";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPerformanceStagedFlightRotation } from "./HumanPerformanceStagedFlightRotation";
import { flyPerformanceFlight } from "./internal/flyPerformanceFlight";
import { prepareHumanSegmentPose } from "./internal/prepareHumanSegmentPose";

/** The record of `IACCURACYItem`'s site. */
type IACCURACYItem = { relative: number; absolute: number };

/**
 * Hand each placed flight its rigid turn after placement and contacts. Authored
 * turn counts use the performance's staged default: exact unwrapped angles
 * about the law's composed centre, with its existing articulation and heading.
 * This path samples only numeric centre/root playback data and creates no
 * physical history or momentum verdict. Explicit physical mode and every
 * supplied momentum use the physical path below. Both hand a reader back once
 * through the same plan hook.
 *
 * The shape is the person's displayed body before the flight's rotation: the
 * carrier, overlays and layers at each actual integration or physical probe
 * instant from take-off. FK starts at an identity root to express that already
 * composed articulation directly in the root's own frame, so a rigid world
 * placement is not applied and then undone for every bone. The result does not
 * depend on where or facing which way the flight happens. Its history gives the
 * composite inertia and the segments' relative momentum
 * (`AutoMovieEngineMotionAirborneRotation.tabulated`), read inside the flight alone, from
 * take-off to touchdown, so the push-off and the landing are not read; the
 * momentum is the plan's, or the one `AutoMovieEngineMotionAirborneTakeoff` finds for its turns
 * within the take-off's ceiling (the moment of the take-off's momentum about
 * the foot, at most the centre's distance from it, unless the plan states its
 * own), and a request it cannot meet within it is refused on the action, naming
 * the turns. The root's orientation `q(t)` is integrated from the displayed one
 * at take-off, and the rotation handed back is `q(t) R(t)⁻¹` about the composed
 * centre of mass, `R(t)` the unturned root's own rotation, so the turned root
 * is exactly `q(t)` and the centre stays where the composed shape put it.
 * `R(t)` and the centre are tabulated at the flight's knots (the fewest equal
 * intervals no longer than `1 / HumanPoseKnots.RATE` s; a staged flight keeps
 * the integrator's default step) and read between those instants by slerp and
 * by line, so the plan's posture reads no displayed pose and the pass has no
 * cycle; `q(t)` is integrated under error control (`ACCURACY` and an
 * independent physical momentum budget), its steps as short as the shape's
 * changes need, and read between its knots by the integrator's own continuous
 * extension, so a shape that changes fast turns at its momentum's rate there
 * too. The shape's history is tabulated once at those knots
 * (`AutoMovieEngineMotionAirborneRotation.tabulated`): the inertia and the relative
 * momentum of the exact unturned pose at each knot, read between them by a
 * cubic, in place of a shape read at every stage and a millisecond either side
 * of it. One unturned pose a knot serves the shape, the take-off attitude and
 * the playback table; the take-off's momentum ceiling reads its two own
 * instants. Every physical acceptance bound remains unchanged.
 */
export namespace HumanPerformanceFlight {
  /**
   * The original embedded orientation RMS and same-unit sensitivity-matrix
   * budgets, with no absolute floor. This local state estimate does not bound
   * the dense angular rate or its inertia-conditioned momentum error; the
   * independent physical momentum budget checks the latter directly.
   */
  export const ACCURACY: Readonly<IACCURACYItem> = {
    relative: 0.01 / 2,
    absolute: 0,
  };

  /**
   * Turn every placed flight of a performance.
   *
   * @param self The performance, placed and its contacts resolved.
   * @param people The people.
   * @param observation Optional native cumulative history-work observer,
   *   borrowed only during planning; no diagnostic callback is invoked by this
   *   pass.
   * @throws {HumanRefusal} For invalid staged data or physical turns the
   *   take-off cannot meet.
   */
  export function flights(
    self: IAutoMovieMotionHumanPerformanceState,
    people: Iterable<IAutoMovieMotionHumanSegment.IPerson>,
    observation?: ReturnType<typeof AutoMovieEngineMotionAirborneRotation.observe>,
  ): void {
    for (const person of people) {
      let prepared: AutoMovieEngineKinematics.IPreparedMassModel | undefined;
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
              prepared ??= AutoMovieEngineKinematics.prepareAutoMovieMassModel(
                person.performer.body.massModel,
              );
              requested ??= AutoMovieEngineKinematics.prepareAutoMovieMassModelBones(prepared);
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
        if (prepared !== undefined) AutoMovieEngineKinematics.releaseAutoMovieMassModel(prepared);
      }
    }
  }

  /**
   * Hand back authored turns without constructing a physical history or
   * take-off problem.
   */
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
          about: AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
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
/** The alternatives of `Playback`'s site. */
type Playback = "step" | "times" | "table";

/** Numeric playback data shared by staged and physical rotation policies. */
type IPlayback = Pick<
  Parameters<typeof HumanPerformanceFlightRotation>[0],
  Playback
>;

/**
 * Sample the existing playback grid once, without retaining its displayed-pose
 * reader.
 */
function samples(
  from: number,
  to: number,
  read: (seconds: number) => IPlayback["table"][number],
): IPlayback {
  if (
    !(to > from)
  )
    throw new Error("Flight playback needs a positive finite interval");
  const step: number = AutoMovieEngineMotionTrajectory.integrateMotionTrajectoryStep();
  const knots: number = Math.ceil((to - from) / step) + 1;
  const times: number[] = Array.from(
    { length: knots },
    (_: unknown, k: number): number => (k === knots - 1 ? to : from + k * step),
  );
  return { step, times, table: times.map(read) };
}
