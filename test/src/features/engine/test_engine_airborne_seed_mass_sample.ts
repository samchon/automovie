import {
  Quaternion,
  Vector3,
  integrateAirborneRotation,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieMomentum,
  solveAirborneTakeoff,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMomentum,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieSolveAirborneTakeoff,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qunit } from "../internal/qunit";
import { throwsError } from "../internal/throwsError";

/**
 * One physical model checks posed mass reuse and an adaptive shooting seed.
 *
 * Two thin circular rings of mass 1 and radius sqrt(2), centred at x=+-1,
 * have intrinsic moments (2,1,1). Parallel-axis terms add (0,2,2), making
 * the composite tensor 4 I. Spinning each ring about X at 0.25 rad/s gives
 * constant internal angular momentum h=X and a stationary centre of mass.
 * Thus a root with world momentum Lx X turns by (Lx-1)t/4 radians, and one
 * somersault in one second needs Lx=8 pi+1, not 8 pi.
 *
 * The owned bone-map subclass counts segment reads without replacing any
 * foreign method. A posed endpoint needs one read per ring; interval
 * reduction needs none. An interior history query has only its instant and
 * two stencil endpoints, so it needs three reads per ring. Exact repeats
 * need none. These counts are independent of elapsed time.
 *
 * A separate analytic history declares the same physical constants rather
 * than feeding the reducer's output back as an expectation. Constant seed
 * integrands have zero Simpson error: the initial five-node estimate needs
 * no refinement. Subtracting one direct physical integration's reads from
 * shooting's reads isolates those five seed samples. The direct integration
 * uses the returned momentum, same tangents and same numerical budget.
 *
 * For a body-frame tangent eta to a world momentum direction dL, varying
 * L=R(4 omega+h) gives eta'=X cross eta/4+Rx(-(Lx-1)t/4)dL/4.
 * Multiplication by Rx(-t/4) leaves an integral of Rx(-Lx t/4)dL/4.
 * Thus eta_X=t X/4. Put S=sin(Lx t/4)/Lx and C=(1-cos(Lx t/4))/Lx;
 * eta_Y=Rx(t/4)(0,S,-C) and eta_Z=Rx(t/4)(0,C,S). These are the public
 * body's right-trivialized rotation tangents, not world-frame derivatives.
 * They retain the existing trajectory suite's 1e-6 absolute tangent bound.
 *
 * Scenarios:
 * 1. Posed endpoints, interval momentum and an interior/repeated history
 *    retain the ring pair's analytic mass properties and exact read bounds.
 * 2. One adaptive somersault includes nonzero internal momentum and needs
 *    five seed samples beyond the same direct physical integration.
 * 3. Actual playback follows its analytic attitude and three body tangents
 *    at eleven instants, winds a full turn and reports the physical residual.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Derives the ring tensor, internal momentum, root solution and work bounds, with units and an independently declared shooting history.
 * @evidence contracts/development/testing.md#behavioral-verification Reads public posed reductions, interval momentum, actual history, shooting momentum, playback and body tangents; wrong centres, tensor, internal momentum, root rotation, tangent frame/sign, seed work, retained bone reads or false refusal fails.
 * @evidence contracts/development/testing.md#independent-expectations The parallel-axis theorem yields 4 I, spin yields h=X, and angular momentum balance gives q(t)=Rx((Lx-1)t/4). Independently varying that balance and integrating the rotating forcing gives all three tangent columns. Constant Simpson integrands require one five-node estimate, independent of cache internals.
 * @evidence contracts/development/testing.md#distinguishing-cases One nonzero internal-momentum model distinguishes omission or sign reversal of h in physical rotation and transverse tangents; endpoint/interior/repeated reads, zero interval refusal, eleven playback instants and a full winding distinguish reuse from a false identity endpoint.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory physical model and owned map/history counters use public engine APIs; no renderer, foreign mutation, runtime patch or external process is used.
 */
export function test_engine_airborne_seed_mass_sample(): void {
  const findings: string[] = [];
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  let reads: number = 0;

  /**
   * An owned map observes the public consumer's actual segment reads.
   *
   * A normal typed bone map carries the physical frames; this test alone
   * constructs the subclass and reads its local integer count. It only
   * counts get calls and otherwise retains normal Map behaviour. No
   * production API, foreign object or shared Map prototype is replaced.
   */
  class CountedBones extends Map<
    AutoMovieHumanoidBone,
    IAutoMovieResolvedBone
  > {
    /**
     * Observe one bone lookup before the unchanged Map read.
     *
     * One counter increment precedes direct delegation to the inherited
     * lookup, adding constant work. It fabricates no frame, inspects no
     * consumer source or cache, caches or suppresses no reads and retains
     * no additional frame or resource.
     */
    public override get(
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieResolvedBone | undefined {
      reads++;
      return super.get(bone);
    }
  }

  const model: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 2,
    segments: (["hips", "head"] as const).map(
      (bone: "hips" | "head"): IAutoMovieResolveCenterOfMass.ISegment => ({
        bone,
        mass: 1,
        point: zero,
        inertia: { x: 2, y: 1, z: 1 },
        axes: identity,
      }),
    ),
  };
  const bones: (t: number) => CountedBones = (t: number): CountedBones => {
    const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 1, y: 0, z: 0 },
      (0.25 * t * 180) / Math.PI,
    );
    return new CountedBones(
      model.segments.map(
        (
          part: IAutoMovieResolveCenterOfMass.ISegment,
          i: number,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
          part.bone,
          {
            bone: part.bone,
            localRotation: rotation,
            worldRotation: rotation,
            worldPosition: { x: i === 0 ? -1 : 1, y: 0, z: 0 },
          },
        ],
      ),
    );
  };
  const before: resolveAutoMovieMomentum.IPosed = resolveAutoMovieMomentum.pose(
    model,
    bones(0.25),
  );
  const after: resolveAutoMovieMomentum.IPosed = resolveAutoMovieMomentum.pose(
    model,
    bones(0.75),
  );
  const endpointReads: number = reads;
  const momentum: IAutoMovieBodyMomentum =
    resolveAutoMovieMomentum.between(model, before, after, 0.5);
  if (endpointReads !== 2 * model.segments.length || reads !== endpointReads)
    findings.push(
      `endpoint reductions read ${endpointReads} bones and interval reduction added ${reads - endpointReads}`,
    );
  if (
    !(
      Vector3.length(before.centre) <= 1e-12 &&
      Vector3.length(after.centre) <= 1e-12 &&
      Vector3.length(momentum.linear) <= 1e-12 &&
      Vector3.length(
        Vector3.subtract(momentum.angular, { x: 1, y: 0, z: 0 }),
      ) <= 1e-9
    )
  )
    findings.push(
      `stationary ring pair has incorrect centre or momentum: ${JSON.stringify(momentum)}`,
    );
  TestValidator.predicate(
    "posed interval rejects zero seconds",
    throwsError((): void => {
      resolveAutoMovieMomentum.between(model, before, after, 0);
    }),
  );
  const tensor: number[][] = resolveAutoMovieMomentum.inertia(
    model,
    bones(0.5),
  );
  for (let i: number = 0; i < 3; i++)
    for (let j: number = 0; j < 3; j++)
      if (!(Math.abs(tensor[i]![j]! - (i === j ? 4 : 0)) <= 1e-12))
        findings.push(`ring tensor entry ${i},${j} is ${tensor[i]![j]}`);

  reads = 0;
  const history: integrateAirborneRotation.ICachedHistory =
    integrateAirborneRotation.history(model, bones, { from: 0, to: 1 });
  const instant: IAutoMovieIntegrateAirborneRotation.IInstant = history(0.5);
  const interiorReads: number = reads;
  history(0.5);
  if (interiorReads !== 3 * model.segments.length || reads !== interiorReads)
    findings.push(
      `interior/repeated history used ${interiorReads}/${reads - interiorReads} bone reads`,
    );
  if (
    !(
      Vector3.length(
        Vector3.subtract(instant.inertia.moments, { x: 4, y: 4, z: 4 }),
      ) <= 1e-12 &&
      qunit(instant.inertia.rotation) &&
      Vector3.length(
        Vector3.subtract(instant.relative, { x: 1, y: 0, z: 0 }),
      ) <= 1e-9
    )
  )
    findings.push(
      `ring history disagrees with its closed form: ${JSON.stringify(instant)}`,
    );
  history.clear();

  let shootingReads: number = 0;
  let directReads: number = 0;
  const constant: () => IAutoMovieIntegrateAirborneRotation.IInstant =
    (): IAutoMovieIntegrateAirborneRotation.IInstant => ({
      inertia: { moments: { x: 4, y: 4, z: 4 }, rotation: identity },
      relative: { x: 1, y: 0, z: 0 },
    });
  const integration: { relative: number; absolute: number } = {
    relative: 1e-10,
    absolute: 0,
  };
  const solution: IAutoMovieSolveAirborneTakeoff.ISolution = solveAirborneTakeoff({
    history: (): IAutoMovieIntegrateAirborneRotation.IInstant => {
      shootingReads++;
      return constant();
    },
    t0: 0,
    t1: 1,
    q0: identity,
    somersault: 1,
    twist: 0,
    integration,
  });
  const direct: IAutoMovieIntegrateAirborneRotation.IFlight = integrateAirborneRotation({
    history: (): IAutoMovieIntegrateAirborneRotation.IInstant => {
      directReads++;
      return constant();
    },
    t0: 0,
    t1: 1,
    q0: identity,
    momentum: solution.momentum,
    tolerance: integration,
    variations: [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 },
    ],
  });
  const seedReads: number = shootingReads - directReads;
  if (seedReads !== 5)
    findings.push(
      `constant adaptive seed used ${seedReads} history reads, expected five`,
    );
  if (
    !solution.met ||
    !(
      Math.abs(solution.momentum.x - (8 * Math.PI + 1)) <=
      4 * solveAirborneTakeoff.TOLERANCE
    ) ||
    !(Math.hypot(solution.momentum.y, solution.momentum.z) <= 1e-9)
  )
    findings.push(
      `one turned ring pair needs (8 pi+1) X, got ${JSON.stringify(solution.momentum)}, met=${solution.met}`,
    );
  let winding: number = 0;
  let previous: number = 0;
  let maximumTangentError: number = 0;
  for (let k: number = 0; k <= 10; k++) {
    const t: number = k / 10;
    const expected: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 1, y: 0, z: 0 },
      ((solution.momentum.x - 1) * t * 45) / Math.PI,
    );
    const actual: IAutoMovieQuaternion = solution.flight.orientation(t);
    if (
      !(
        qunit(actual) &&
        Quaternion.angle(actual, expected) <= 1e-6 &&
        Quaternion.angle(direct.orientation(t), expected) <= 1e-6
      )
    )
      findings.push(
        `ring flight misses its nonzero-h analytic attitude at ${t}`,
      );
    const angleL: number = (solution.momentum.x * t) / 4;
    const sine: number =
      solution.momentum.x === 0
        ? t / 4
        : Math.sin(angleL) / solution.momentum.x;
    const cosine: number =
      solution.momentum.x === 0
        ? 0
        : (1 - Math.cos(angleL)) / solution.momentum.x;
    const c: number = Math.cos(t / 4);
    const s: number = Math.sin(t / 4);
    const expectedTangents: readonly IAutoMovieVector3[] = [
      { x: t / 4, y: 0, z: 0 },
      { x: 0, y: c * sine + s * cosine, z: s * sine - c * cosine },
      { x: 0, y: c * cosine - s * sine, z: s * cosine + c * sine },
    ];
    const tangents: readonly IAutoMovieVector3[] = direct.variations(t);
    const shootingTangents: readonly IAutoMovieVector3[] =
      solution.flight.variations(t);
    if (tangents.length !== 3 || shootingTangents.length !== 3)
      findings.push(
        `direct/shooting ring flights have ${tangents.length}/${shootingTangents.length} tangent columns at ${t}`,
      );
    else
      for (let j: number = 0; j < 3; j++) {
        const error: number = Math.max(
          Vector3.length(Vector3.subtract(tangents[j]!, expectedTangents[j]!)),
          Vector3.length(
            Vector3.subtract(shootingTangents[j]!, expectedTangents[j]!),
          ),
        );
        maximumTangentError = Math.max(maximumTangentError, error);
        if (!(error <= 1e-6))
          findings.push(`nonzero-h tangent column ${j} error ${error} at ${t}`);
      }
    const up: IAutoMovieVector3 = Quaternion.rotateVector(actual, {
      x: 0,
      y: 1,
      z: 0,
    });
    const angle: number = Math.atan2(up.z, up.y);
    if (k > 0)
      winding += Math.atan2(
        Math.sin(angle - previous),
        Math.cos(angle - previous),
      );
    previous = angle;
  }
  if (!(Math.abs(winding - 2 * Math.PI) <= solveAirborneTakeoff.TOLERANCE))
    findings.push(
      `actual ring flight winds ${winding / (2 * Math.PI)} revolutions`,
    );
  const fullMiss: number = (solution.momentum.x - 1) / (8 * Math.PI) - 1;
  if (
    !(Math.abs(solution.residual.somersault - fullMiss) <= 1e-6 / (2 * Math.PI))
  )
    findings.push(
      `reported ${solution.residual.somersault} rev differs from actual full-request miss ${fullMiss}`,
    );
  console.log(
    JSON.stringify({
      sample: "ring-seed-mass",
      endpointReads,
      interiorReads,
      shootingReads,
      directReads,
      seedReads,
      momentum: solution.momentum,
      windingTurns: winding / (2 * Math.PI),
      maximumTangentError,
    }),
  );
  TestValidator.equals(
    "posed mass reuse and adaptive physical seed",
    findings,
    [],
  );
}
