import { AutoMovieEngineGravity, AutoMovieEngineMotionTrajectoryFailure, AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMotionAirborneRotation, AutoMovieEngineKinematics, AutoMovieEngineMotionAirborneTakeoff } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieIntegrateAirborneRotation, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanFlight, IAutoMovieMotionHumanFlightTurns, IAutoMovieMotionHumanPerformanceState, IAutoMovieMotionHumanSegment, IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieSolveAirborneTakeoff, IAutoMovieVector3 } from "@automovie/interface";

import { jump } from "../../actions/internal/jump";
import { jumpAirborne } from "../../actions/internal/jumpAirborne";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanPerformanceFlight } from "./HumanPerformanceFlight";
import { HumanPerformanceFlightFailure } from "./HumanPerformanceFlightFailure";
import { HumanPerformanceFlightRotation } from "./HumanPerformanceFlightRotation";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPoseKnots } from "./HumanPoseKnots";
import { HumanSegmentShown } from "./HumanSegmentShown";
import { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";
import { prepareRigidFlightMass } from "./prepareRigidFlightMass";

/*
 * Integrate one declared physical flight of a placed performance: solve its
 * take-off momentum or use the given one, integrate its rotation over the
 * playback grid, check its native touchdown and hand the turning back to its
 * plan.
 *
 * Moved unchanged from `HumanPerformanceFlight` to keep that file under the
 * repository's 500-line limit; its caller and behaviour are unchanged.
 */
export function flyPerformanceFlight(
  self: IAutoMovieMotionHumanPerformanceState,
  person: IAutoMovieMotionHumanSegment.IPerson,
  segment: IAutoMovieMotionHumanSegment,
  prepared: AutoMovieEngineKinematics.IPreparedMassModel,
  requested: ReadonlySet<AutoMovieHumanoidBone>,
  readBones: ReturnType<typeof poseBones.prepare>,
  observation?: ReturnType<typeof AutoMovieEngineMotionAirborneRotation.observe>,
): void {
  const plan: IAutoMovieMotionHumanActionPlan = segment.plan;
  const declared: IAutoMovieMotionHumanFlight = plan.flight!;
  const subject: string = person.performer.subject;
  const body: IAutoMovieMotionHumanBody = person.performer.body;
  const model: IAutoMovieResolveCenterOfMass.IModel = body.massModel;
  const t0: number = segment.start + declared.from * plan.duration;
  const t1: number = segment.start + declared.to * plan.duration;
  const evaluation: prepareHumanSegmentPose.IPrepared =
    prepareHumanSegmentPose(body);
  // A person with no overlay, hold or stop shows the jump's own articulation.
  const isolated: boolean =
    person.overlays.length === 0 &&
    person.holds.length === 0 &&
    person.stops.size === 0;
  // The mass-bearing frames alone, read before the flight's turn changes the
  // displayed pose.
  const unturned: (seconds: number) => IAutoMoviePose = (
    seconds: number,
  ): IAutoMoviePose =>
    HumanSegmentShown(person, seconds, requested, evaluation);
  const readResolution: prepareHumanSegmentPose.IPrepared["resolution"] =
    evaluation.resolution;
  const root: (pose: IAutoMoviePose) => IAutoMovieQuaternion = (
    pose: IAutoMoviePose,
  ): IAutoMovieQuaternion => pose.root?.rotation ?? AutoMovieEngineQuaternion.identity();

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
    (_: unknown, k: number): number =>
      k === intervals ? t1 : t0 + k * spacing,
  );
  // Only the uniform knots have a second reader in playback. The shape
  // table reduces each inserted knot immediately and owns that reduction.
  const posed: Map<number, UniformPose> = new Map();
  for (const knot of knots) posed.set(knot, null);
  const at: (seconds: number) => IAutoMoviePose = (
    seconds: number,
  ): IAutoMoviePose => {
    const known: UniformPose | undefined = posed.get(seconds);
    if (known !== null) return known ?? unturned(seconds);
    const pose: IAutoMoviePose = unturned(seconds);
    posed.set(seconds, pose);
    return pose;
  };

  // The shape's inertia and relative momentum are tabulated once at the
  // knots for every stage and shooting trial
  // (`AutoMovieEngineMotionAirborneRotation.tabulated`), so the flight reads no pose
  // between them. A free-foot curve's own instantaneous bone rates are not
  // asked for: on test_human_motion_core_flight_sample they were accepted
  // at 27 of 2,293 instants, and the other 2,266 fell back to the
  // millisecond stencil after 6,777 shape reads and as many rate attempts.
  // Where a part turns fast (a tuck's thighs by 0.65 rad a knot as it is
  // laid in), the table divides the knot's interval so no part turns more
  // than the angle whose chord reads a part's orbital momentum short by
  // the flight's own momentum budget (`a^2 / 6` of it, so `a = sqrt(6 d)`
  // with `d` the budget `MOMENTUM_ACCURACY` states).
  // The shape reduction already obtains each mass centre in the root frame.
  // Playback needs its rigid placement at the uniform knots alone.
  // A native isolated jump has explicit moving clinical tracks. Grouping changes
  // neither the requested displayed articulation nor the takeoff/landing witnesses.
  // Every actual adaptive knot rechecks the remaining local coordinates.
  const changed: symbol = Symbol("flight articulation changed");
  if (
    isolated &&
    segment.law.plan === jump.plan &&
    (segment.transition === undefined ||
      segment.transition.kind === "redirect" ||
      t0 - segment.transition.cut >= segment.transition.blend) &&
    person.layers.every(
      (row): boolean =>
        row.to <= t0 || row.from >= t1 || row.layer.lend !== undefined,
    )
  ) {
    const source: IAutoMoviePose = at(t0);
    const frames: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, { ...source, root: null }, readResolution());
    const grouped: prepareRigidFlightMass.IPrepared | undefined =
      prepareRigidFlightMass(
        body,
        source,
        frames,
        new Set(jumpAirborne.TRACKS),
      );
    if (grouped !== undefined) {
      const mass: AutoMovieEngineKinematics.IPreparedMassModel =
        AutoMovieEngineKinematics.prepareAutoMovieMassModel(grouped.model);
      try {
        run(
          mass,
          poseBones.prepare(body, AutoMovieEngineKinematics.prepareAutoMovieMassModelBones(mass)),
          grouped,
        );
        return;
      } catch (error) {
        if (error !== changed) throw error;
      } finally {
        AutoMovieEngineKinematics.releaseAutoMovieMassModel(mass);
      }
    }
  }
  run(prepared, readBones);

  /*
   * Integrate the original physical law using either a checked rigid partition
   * or all its original mass parts.
   */
  function run(
    mass: AutoMovieEngineKinematics.IPreparedMassModel,
    readShape: ReturnType<typeof poseBones.prepare>,
    grouped?: prepareRigidFlightMass.IPrepared,
  ): void {
    const shape: (
      seconds: number,
    ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
      seconds: number,
    ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const pose: IAutoMoviePose = at(seconds);
      if (grouped !== undefined && !grouped.matches(pose)) throw changed;
      return readShape({ ...pose, root: null }, readResolution());
    };
    const centres: IAutoMovieVector3[] = [];
    const history: ReturnType<typeof AutoMovieEngineMotionAirborneRotation.history> =
      AutoMovieEngineMotionAirborneRotation.tabulated(
        mass,
        shape,
        {
          from: t0,
          to: t1,
          step,
          turn: Math.sqrt(6 * MOMENTUM_ACCURACY.relative),
        },
        observation,
        (index: number, centre: IAutoMovieVector3): void => {
          centres[index] = centre;
        },
      );
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
        const delta: number = AutoMovieEngineMotionAirborneRotation.DELTA;
        const centre: (t: number) => IAutoMovieVector3 = (
          t: number,
        ): IAutoMovieVector3 =>
          AutoMovieEngineKinematics.prepareAutoMovieMassModelPlace(
            prepared,
            readBones(unturned(t), readResolution()),
          );
        const one: IAutoMovieVector3 = centre(at + delta);
        const two: IAutoMovieVector3 = centre(at + 2 * delta);
        const v0: IAutoMovieVector3 = {
          x: (two.x - one.x) / delta,
          y: (two.y - one.y) / delta + 1.5 * AutoMovieEngineGravity.STANDARD * delta,
          z: (two.z - one.z) / delta,
        };
        return (
          model.mass *
          AutoMovieEngineVector3.length(v0) *
          AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPendulum(body.measure.hipHeight)
        );
      };

      // The momentum: given, or solved from the turns.
      let momentum: IAutoMovieVector3;
      let solvedFlight: IAutoMovieIntegrateAirborneRotation.IFlight | undefined;
      const touchdown: ReturnType<typeof jumpAirborne.touchdown> =
        jumpAirborne.touchdown(declared);
      if (declared.momentum.kind === "momentum")
        momentum = declared.momentum.momentum;
      else {
        const turns: IAutoMovieMotionHumanFlightTurns = declared.momentum;
        const maximum: number = turns.maximum ?? ceiling(t0);
        const geometry: number | undefined = touchdown?.angularTolerance;
        const tolerance: number | undefined =
          geometry === undefined
            ? undefined
            : Math.min(geometry, AutoMovieEngineMotionAirborneTakeoff.TOLERANCE);

        // The search and the momentum-judged flight use different error
        // controls. Give both the same small-step integration budget so
        // the terminal angle is budgeted per shape interval at the
        // quaternion half-angle scale.
        const integration: typeof HumanPerformanceFlight.ACCURACY =
          tolerance === undefined
            ? HumanPerformanceFlight.ACCURACY
            : {
                relative: Math.min(
                  HumanPerformanceFlight.ACCURACY.relative,
                  tolerance / (2 * (knots.length - 1)),
                ),
                absolute: HumanPerformanceFlight.ACCURACY.absolute,
              };
        const solved: IAutoMovieSolveAirborneTakeoff.ISolution =
          AutoMovieEngineMotionAirborneTakeoff.solve({
            history,
            t0,
            t1,
            q0,
            frame: turns.frame,
            somersault: turns.somersault,
            twist: turns.twist,
            maximum,
            integration,
            tolerance,
            momentumTolerance: MOMENTUM_ACCURACY,
            errorScope,
          });
        if (!solved.met)
          throw new AutoMovieMotionHumanRefusal({
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
      const turned: IAutoMovieIntegrateAirborneRotation.IFlight =
        solvedFlight ??
        AutoMovieEngineMotionAirborneRotation.integrate({
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
        table: knots.map(
          (t: number, index: number): IPlayback["table"][number] => {
            const pose: IAutoMoviePose = at(t);
            const centre: IAutoMovieVector3 = centres[index]!;
            return {
              about:
                pose.root === null
                  ? centre
                  : AutoMovieEngineVector3.add(
                      pose.root.translation,
                      AutoMovieEngineQuaternion.rotateVector(pose.root.rotation, centre),
                    ),
              root: root(pose),
            };
          },
        ),
      };
      const rotation: ReturnType<typeof HumanPerformanceFlightRotation> =
        HumanPerformanceFlightRotation({
          start: segment.start,
          t0,
          t1,
          ...data,
          orientation: turned.orientation,
        });
      if (touchdown?.turnedLanding === false)
        touchdown.check(rotation(declared.to * plan.duration));
      plan.airborne!(rotation);
    } catch (error) {
      if (
        error instanceof AutoMovieEngineMotionTrajectoryFailure &&
        error.scope === errorScope
      )
        throw HumanPerformanceFlightFailure(
          error,
          body,
          plan,
          segment.start,
          t0,
          (seconds: number): IAutoMoviePose =>
            HumanPerformanceRead.pose(
              self,
              subject,
              seconds,
              undefined,
              evaluation,
            ),
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
/*
 * The record of `IMOMENTUMACCURACYItem`'s site.
 */
type IMOMENTUMACCURACYItem = { relative: number; absolute: number };

/*
 * The target-relative dense angular-momentum budget, independently of the
 * orientation's local estimate. If each read differs from the constant model
 * momentum L by at most delta ||L||, two reads differ by at most 2
 * delta/(1-delta) of the reference read. Thus existing 1 % comparison requires
 * delta <= .01/(2+.01), with no absolute floor. Controller probes are sampled;
 * this implication does not certify every time or the separate
 * finite-difference pose-observation error.
 */
const MOMENTUM_ACCURACY: Readonly<IMOMENTUMACCURACYItem> = {
  relative: 0.01 / (2 + 0.01),
  absolute: 0,
};

/*
 * A regular playback knot is empty until its unturned pose is first evaluated.
 */
type UniformPose = IAutoMoviePose | null;
/*
 * The alternatives of `Playback2`'s site.
 */
type Playback2 = "step" | "times" | "table";

/*
 * Numeric playback data shared by staged and physical rotation policies
 * (`HumanPerformanceFlight`'s own).
 */
type IPlayback = Pick<
  Parameters<typeof HumanPerformanceFlightRotation>[0],
  Playback2
>;
