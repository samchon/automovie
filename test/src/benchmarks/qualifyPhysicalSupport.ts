import { AutoMovieEngineQuaternion, AutoMovieEnginePhysicalSimulation as Simulation, AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { PhysicalModelFixtures } from "../features/internal/PhysicalModelFixtures";
import { motionHumanBody } from "../features/internal/motionHumanBody";
import { preparePhysicalSupportInput } from "./preparePhysicalSupportInput";
import { tracePhysicalSupportOnset } from "./tracePhysicalSupportOnset";

/** One observed native pose, with the velocities needed to measure center of mass. */
type Frame = IAutoMoviePhysicalSimulation["cache"]["frames"][number];

/** A resolved cache interval carrying physical contact evidence from the floor. */
type FloorSample = {
  bone: string;
  seconds: number;
  normalImpulse: number;
};

/** Late native measurements using metres, radians, seconds and newtons. */
type QuietMetrics = {
  height: number;
  drift: number;
  speed: number;
  anchor: number;
  limit: number;
  force: number;
  weight: number;
  patches: PatchMetrics[];
};

/** The measured extent, motion and real contact sample count of a support. */
type PatchMetrics = {
  bone: string;
  lowest: number;
  highest: number;
  drift: number;
  creep: number;
  angle: number;
  missing: number;
};

/** A distinct support outcome and observation duration. */
type Case = {
  name: "quiet" | "sustained" | "recover" | "fall";
  duration: number;
  impulse: number;
  reactionSeconds?: number;
};

/** Run the native support checks from #3092 with `pnpm --filter @automovie/test exec
 * ttsx --no-plugins src/benchmarks/qualifyPhysicalSupport.ts quiet`.
 * Select `onset` for the neutral control's first 18 intervals or `matrix` for #3146.
 */
async function main(): Promise<void> {
  const selection: string = process.argv[2] ?? "";
  if (
    process.argv.length !== 3 ||
    !["quiet", "onset", "matrix"].includes(selection)
  )
    throw new Error(
      "Choose a support qualification workload: quiet, onset or matrix",
    );
  const failures: string[] = [];
  const prepare: number = performance.now();
  const human: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const control: IAutoMoviePhysicalProfile = PhysicalModelFixtures.quadrupod();
  const providerPreparationMs: number = performance.now() - prepare;
  console.log(JSON.stringify({ selection, providerPreparationMs }));
  for (const profile of [human.profile, control]) {
    const canonical: boolean = profile === human.profile;
    let stand: preparePhysicalSupportInput.IStand | undefined;
    const cases: Case[] = [{ name: "quiet", duration: 1, impulse: 0 }];
    if (selection === "onset" && canonical)
      cases.push({ ...cases[0]!, reactionSeconds: 0.2 });
    if (selection === "matrix")
      cases.push(
        { name: "sustained", duration: 6, impulse: canonical ? 0.5 : 0.1 },
        { name: "recover", duration: 6, impulse: canonical ? 120 : 15 },
        { name: "fall", duration: 6, impulse: canonical ? 600 : 100 },
      );
    for (const work of cases) {
      const started: number = performance.now();
      const cpu: NodeJS.CpuUsage = process.cpuUsage();
      try {
        if (canonical && selection !== "onset")
          stand ??= preparePhysicalSupportInput.stand(human);
        const {
          input,
          body,
          floorOffset,
          start,
        }: preparePhysicalSupportInput.IResult = preparePhysicalSupportInput(
          profile,
          stand
            ? "authored-stand"
            : canonical
              ? "canonical-neutral"
              : "four-support",
          work.duration,
          work.impulse,
          stand,
        );

        if (selection === "onset") {
          await tracePhysicalSupportOnset.run(
            input,
            floorOffset,
            work.reactionSeconds,
          );
          continue;
        }
        const integrationStarted: number = performance.now();
        const run: IAutoMoviePhysicalSimulation =
          await Simulation.compute(input);
        const integrationMs: number = performance.now() - integrationStarted;
        const floors: FloorSample[] = floorSamples(run, body.id);
        const observations: ReturnType<typeof inspect> = inspect(
          run,
          body,
          work,
          start.rootBone,
          floors,
        );
        console.log(
          JSON.stringify({
            provider: profile.id,
            mass: profile.mass,
            work,
            rate: input.rate,
            substeps: input.substeps,
            floorOffset,
            start,
            perturbation: input.impulses[0],
            integrationMs,
            ...observations,
            wallMs: performance.now() - started,
            cpu: process.cpuUsage(cpu),
            peakRssKiB: process.resourceUsage().maxRSS,
          }),
        );
        for (const fault of observations.failures)
          failures.push(`${profile.id}/${work.name}: ${fault}`);
      } catch (error) {
        const message: string =
          error instanceof Error ? error.message : String(error);
        console.log(
          JSON.stringify({ provider: profile.id, work, error: message }),
        );
        failures.push(`${profile.id}/${work.name}: ${message}`);
      }
    }
  }
  if (failures.length) {
    console.error(JSON.stringify({ failures }));
    process.exitCode = 1;
  }
}

/** Track actual signed patch height and qualified native support events. */
function inspect(
  run: IAutoMoviePhysicalSimulation,
  body: IAutoMoviePhysicalSimulationInput.IBody,
  work: Case,
  rootBone: string,
  floors: readonly FloorSample[],
): {
  failures: string[];
  rootHeight: number;
  recovery:
    | IAutoMoviePhysicalSimulation["cache"]["recovery"][string]
    | undefined;
  quiet?: QuietMetrics;
  preImpulseTrackingSeconds?: number;
} {
  const rootHeight: number = run.cache.at(work.duration).bodies[body.id]![
    rootBone
  ]!.position.y;
  const recovery:
    | IAutoMoviePhysicalSimulation["cache"]["recovery"][string]
    | undefined = run.cache.recovery[body.id];
  const failures: string[] = [];
  if (!recovery) failures.push("No native support assessment");
  if (work.name === "quiet" || work.name === "sustained") {
    const quiet: QuietMetrics = quietMetrics(run, body, work, floors);
    if (
      recovery?.last !== "supported" ||
      recovery.steps.length !== 0 ||
      run.cache.controllerCheckpoints
        .get(Math.round(work.duration * run.cache.rate))
        ?.released?.includes(body.id)
    )
      failures.push("Quiet stance requested recovery or released the body");
    if (
      quiet.height > 0.02 ||
      quiet.drift > 0.02 ||
      quiet.speed > 0.02 ||
      quiet.anchor > 0.001 ||
      quiet.limit > 0.0001 ||
      Math.abs(quiet.force - quiet.weight) > quiet.weight * 0.1
    )
      failures.push(
        "Quiet body exceeded height, drift, speed, anchor, ROM or floor-load bounds",
      );
    for (const patch of quiet.patches)
      if (
        patch.drift > 0.02 ||
        patch.creep > 0.001 ||
        patch.lowest < -0.001 ||
        patch.highest > 0.001 ||
        patch.highest - patch.lowest > 0.0002 ||
        patch.angle > 0.05 ||
        patch.missing !== 0
      )
        failures.push(
          `${patch.bone}: quiet patch failed contact, sole or drift bounds`,
        );
    return { failures, rootHeight, recovery, quiet };
  }
  const before: number =
    run.cache.at(0.9).bodies[body.id]![rootBone]!.position.y;
  const impulse: IAutoMoviePhysicalSimulationInput.IInput["impulses"][number] =
    run.input.impulses[0]!;
  const substeps: number = run.input.substeps!;
  const preImpulseTrackingSeconds: number =
    ((impulse.step - 1) * substeps + 1) / (run.input.rate * substeps);

  // The first tracking call of this interval runs before applying its impulse.
  if (
    recovery?.steps.some(
      (step): boolean => step.start <= preImpulseTrackingSeconds,
    )
  )
    failures.push("Body stepped before the declared perturbation");
  if (
    work.name === "recover" &&
    (!recovery ||
      recovery.last !== "supported" ||
      !recovery.landings?.length ||
      Object.keys(recovery.offsets).length === 0 ||
      !recovery.rootOffset ||
      rootHeight < before * 0.8)
  )
    failures.push("Recovery failed to finish supported with a real landing");
  if (
    work.name === "fall" &&
    (recovery?.last !== "unrecoverable" || rootHeight > before * 0.6)
  )
    failures.push("Fall failed to become unrecoverable and lose height");
  for (const landing of recovery?.landings ?? []) {
    const step: NonNullable<typeof recovery>["steps"][number] | undefined =
      recovery?.steps.find(
        (candidate): boolean =>
          candidate.bone === landing.bone &&
          candidate.end <= landing.seconds &&
          candidate.resolved?.status === "landed" &&
          candidate.resolved.seconds === landing.seconds,
      );
    const limb: IAutoMovieFootfallPattern["limbs"][number] | undefined =
      body.balance!.pattern.limbs.find(
        (candidate: IAutoMovieFootfallPattern["limbs"][number]): boolean =>
          candidate.bone === landing.bone,
      );
    const tick: number = Math.round(
      landing.seconds * run.cache.rate * substeps,
    );

    // Tracking reads the last integrated tick. The ledger sums its output interval.
    const seconds: number = Math.ceil((tick - 1) / substeps) / run.cache.rate;
    if (
      !step ||
      Math.hypot(
        landing.position.x - step.to.point[0],
        landing.position.z - step.to.point[1],
      ) > 0.025
    )
      failures.push(
        `Landing missed its completed step's 25 mm target at ${landing.seconds} s`,
      );
    if (
      !limb ||
      !floors.some(
        (sample: FloorSample): boolean =>
          sample.seconds === seconds &&
          (limb.contacts ?? [limb.bone]).includes(sample.bone),
      )
    )
      failures.push(
        `Landing ${landing.bone} at ${landing.seconds} s (tick ${tick}) has no upward floor load in receipt frame ${seconds} s`,
      );
  }
  return { failures, rootHeight, recovery, preImpulseTrackingSeconds };
}

/** Measure quiet stance from cache poses, actual contact impulses and joint bounds. */
function quietMetrics(
  run: IAutoMoviePhysicalSimulation,
  body: IAutoMoviePhysicalSimulationInput.IBody,
  work: Case,
  floors: readonly FloorSample[],
): QuietMetrics {
  const profile: IAutoMoviePhysicalProfile = body.profile;
  const window: number = work.name === "quiet" ? 0.25 : 4;
  const start: number = work.duration - window;
  const first: Frame = run.cache.frames[0]!;
  const late: readonly Frame[] = run.cache.frames.filter(
    (frame: Frame): boolean => frame.seconds >= start,
  );
  const initial: ReturnType<typeof center> = center(first);
  let height: number = 0;
  let drift: number = 0;
  let speed: number = 0;
  let anchor: number = 0;
  let limit: number = 0;
  for (const frame of late) {
    const { position, velocity }: ReturnType<typeof center> = center(frame);
    height = Math.max(height, Math.abs(position.y - initial.position.y));
    drift = Math.max(drift, horizontal(position, initial.position));
    speed = Math.max(speed, Math.hypot(velocity.x, velocity.z));
    for (const joint of profile.joints) {
      const parent: IAutoMovieRigidTransform =
        frame.bodies[body.id]![joint.parent]!;
      const child: IAutoMovieRigidTransform =
        frame.bodies[body.id]![joint.child]!;
      anchor = Math.max(
        anchor,
        AutoMovieEngineVector3.length(
          AutoMovieEngineVector3.subtract(
            AutoMovieEnginePhysics.physicalSupportPoint(parent, joint.parentFrame.position),
            AutoMovieEnginePhysics.physicalSupportPoint(child, joint.childFrame.position),
          ),
        ),
      );
      for (const coordinate of AutoMovieEnginePhysics.measurePhysicalJointLimits(joint, parent, child))
        limit = Math.max(limit, coordinate.violation);
    }
  }
  const patches: PatchMetrics[] = body.balance!.pattern.limbs.map(
    (limb: IAutoMovieFootfallPattern["limbs"][number]): PatchMetrics => {
      const bones: readonly string[] = limb.contacts ?? [limb.bone];
      const contacts: Set<number> = new Set(
        floors
          .filter((sample: FloorSample): boolean => bones.includes(sample.bone))
          .map((sample: FloorSample): number => sample.seconds),
      );
      const origin: IAutoMovieVector3 = endpoint(first);
      const lateOrigin: IAutoMovieVector3 = endpoint(late[0]!);
      let lowest: number = Infinity;
      let highest: number = -Infinity;
      let drift: number = 0;
      let creep: number = 0;
      let angle: number = 0;
      let missing: number = 0;
      for (const frame of late) {
        const poses: Frame["bodies"][string] = frame.bodies[body.id]!;
        const sole: number = tracePhysicalSupportOnset.patchHeight(
          profile,
          limb,
          poses,
        );
        lowest = Math.min(lowest, sole);
        highest = Math.max(highest, sole);
        drift = Math.max(drift, horizontal(endpoint(frame), origin));
        creep = Math.max(creep, horizontal(endpoint(frame), lateOrigin));
        if (!contacts.has(frame.seconds)) ++missing;
        for (const bone of bones) {
          const relative: IAutoMovieRigidTransform["rotation"] =
            AutoMovieEngineQuaternion.multiply(
              poses[bone]!.rotation,
              AutoMovieEngineQuaternion.inverse(first.bodies[body.id]![bone]!.rotation),
            );
          angle = Math.max(
            angle,
            2 *
              Math.atan2(
                Math.hypot(relative.x, relative.y, relative.z),
                Math.abs(relative.w),
              ),
          );
        }
      }
      return { bone: limb.bone, lowest, highest, drift, creep, angle, missing };

      /** Evaluate the declared endpoint in the measured native pose. */
      function endpoint(frame: Frame): IAutoMovieVector3 {
        return AutoMovieEnginePhysics.physicalSupportPoint(
          frame.bodies[body.id]![limb.bone]!,
          limb.localPoint,
        );
      }
    },
  );
  const force: number =
    floors.reduce(
      (sum: number, sample: FloorSample): number =>
        sum + (sample.seconds > start ? sample.normalImpulse : 0),
      0,
    ) / window;
  return {
    height,
    drift,
    speed,
    anchor,
    limit,
    force,
    weight: profile.mass * 9.81,
    patches,
  };

  /** Independently mass-average the actual segment centers and point velocities. */
  function center(frame: Frame): {
    position: IAutoMovieVector3;
    velocity: IAutoMovieVector3;
  } {
    let position: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const segment of profile.segments) {
      const pose: Frame["bodies"][string][string] =
        frame.bodies[body.id]![segment.bone]!;
      const arm: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        pose.rotation,
        segment.centerOfMass,
      );
      const fraction: number = segment.mass / profile.mass;
      position = AutoMovieEngineVector3.add(
        position,
        AutoMovieEngineVector3.scale(AutoMovieEngineVector3.add(pose.position, arm), fraction),
      );
      velocity = AutoMovieEngineVector3.add(
        velocity,
        AutoMovieEngineVector3.scale(
          AutoMovieEngineVector3.add(pose.velocity, AutoMovieEngineVector3.cross(pose.angularVelocity, arm)),
          fraction,
        ),
      );
    }
    return { position, velocity };
  }
}

/** Read upward impulse actually received by the body from a touching floor. */
function floorSamples(
  run: IAutoMoviePhysicalSimulation,
  body: string,
): FloorSample[] {
  const samples: FloorSample[] = [];
  for (const receipt of run.cache.contacts) {
    if (receipt.source !== "solver") continue;
    const side: "a" | "b" | undefined =
      receipt.a.body === body && receipt.b.body === "floor"
        ? "a"
        : receipt.b.body === body && receipt.a.body === "floor"
          ? "b"
          : undefined;
    if (!side) continue;
    for (const sample of receipt.samples ?? []) {
      const up: number = side === "a" ? -sample.normal.y : sample.normal.y;
      const impulse: number = sample.appliedImpulse?.[side] ?? sample.impulse;
      if (up > 0.5 && impulse > 0 && sample.separation <= 0)
        samples.push({
          bone: receipt[side].bone,
          seconds: sample.seconds,
          normalImpulse: impulse * up,
        });
    }
  }
  return samples;
}

/** Compare horizontal positions without counting vertical displacement. */
function horizontal(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
