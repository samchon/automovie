import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieVector3 as V,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { PhysicalRotationVector } from "../../../../packages/engine/src/physics/PhysicalRotationVector";
import { measurePhysicalJointLimits } from "../../../../packages/engine/src/physics/measurePhysicalJointLimits";
import { physicalShapeBounds } from "../../../../packages/engine/src/physics/physicalShapeBounds";
import { physicalSupportPoint } from "../../../../packages/engine/src/physics/physicalSupportPoint";
import { PhysicalHumanFixtures } from "./PhysicalHumanFixtures";
import { PhysicalModelFixtures } from "./PhysicalModelFixtures";
import { createPhysicalBalanceInput } from "./createPhysicalBalanceInput";

/** Complete native episodes share independent Human/primitive geometry and fixed perturbations. The world-actuated Human also retains its no-step resistance control alongside a distinct recovery demand. */
export namespace PhysicalBalanceMatrix {
  /** Finish every quiet, recovery and fall case before reporting findings. */
  export async function run(actuation: "world" | "internal"): Promise<void> {
    const profiles: P[] = [
      PhysicalHumanFixtures.get().profile,
      PhysicalModelFixtures.quadrupod(),
    ];
    const findings: string[] = [];
    for (const profile of profiles)
      for (const kind of actuation === "world" && profile.id === "human"
        ? (["quiet", "resist", "recover", "fall"] as const)
        : (["quiet", "recover", "fall"] as const)) {
        const impulse: number =
          profile.id === "human"
            ? {
                quiet: 0.5,
                resist: 120,
                recover: actuation === "world" ? 180 : 120,
                fall: 600,
              }[kind]
            : { quiet: 0.1, resist: 0.1, recover: 15, fall: 100 }[kind];
        const input: Simulation.IInput = createPhysicalBalanceInput(
          profile,
          actuation,
          impulse,
          6,
        );
        const body: Simulation.IBody = input.bodies[0]!;
        const start: number = performance.now();
        const cpu: NodeJS.CpuUsage = process.cpuUsage();
        let run: Simulation;
        try {
          run = await Simulation.compute(input);
        } catch (error) {
          findings.push(
            `${profile.id}/${kind}: ${error instanceof Error ? error.message : String(error)}`,
          );
          console.log(
            JSON.stringify({
              actuation,
              provider: profile.id,
              kind,
              failed: true,
              wallMs: performance.now() - start,
              cpu: process.cpuUsage(cpu),
              rssBytes: process.memoryUsage().rss,
            }),
          );
          continue;
        }
        const state: (typeof run.cache.recovery)[string] | undefined =
          run.cache.recovery[profile.id];
        const before: number =
          run.cache.at(0.9).bodies[profile.id]![profile.segments[0]!.bone]!
            .position.y;
        const after: number =
          run.cache.at(6).bodies[profile.id]![profile.segments[0]!.bone]!
            .position.y;
        if (!state) {
          findings.push(`${profile.id}/${kind}: no actual support assessment`);
          continue;
        }
        if (
          (kind === "quiet" || kind === "resist") &&
          (state.last !== "supported" ||
            state.steps.length !== 0 ||
            Math.abs(after - before) > 0.02)
        )
          findings.push(
            `${profile.id}/${kind}: no-step support ${state.last}/${state.steps.length}/${after}`,
          );
        if (
          kind === "recover" &&
          (state.last !== "supported" ||
            state.steps.length < 1 ||
            (state.landings?.length ?? 0) < 1 ||
            Object.keys(state.offsets).length < 1 ||
            !state.rootOffset ||
            after < before * 0.8)
        )
          findings.push(
            `${profile.id}: recovery ${JSON.stringify(state)}, height ${after}`,
          );
        if (
          kind === "fall" &&
          (state.last !== "unrecoverable" || after > before * 0.6)
        )
          findings.push(`${profile.id}: fall ${state.last}/${after}`);
        for (const landing of state.landings ?? []) {
          const step: (typeof state.steps)[number] | undefined =
            state.steps.find(
              (candidate: (typeof state.steps)[number]): boolean =>
                candidate.bone === landing.bone &&
                candidate.end <= landing.seconds,
            );
          if (
            !step ||
            Math.hypot(
              landing.position.x - step.to.point[0],
              landing.position.z - step.to.point[1],
            ) > 0.025
          )
            findings.push(`${profile.id}: unconfirmed landing position`);
          const patches: readonly string[] = body.balance!.pattern.limbs.find(
            (
              limb: NonNullable<
                Simulation.IBody["balance"]
              >["pattern"]["limbs"][number],
            ): boolean => limb.bone === landing.bone,
          )!.contacts ?? [landing.bone];
          const observed: number =
            Math.ceil(landing.seconds * run.cache.rate) / run.cache.rate;
          if (
            !run.cache.contacts.some(
              (receipt: (typeof run.cache.contacts)[number]): boolean =>
                (receipt.a.body === "floor" || receipt.b.body === "floor") &&
                ((receipt.a.body === profile.id &&
                  patches.includes(receipt.a.bone)) ||
                  (receipt.b.body === profile.id &&
                    patches.includes(receipt.b.bone))) &&
                (receipt.samples?.some(
                  (
                    sample: NonNullable<typeof receipt.samples>[number],
                  ): boolean =>
                    sample.seconds === observed &&
                    sample.impulse > 0 &&
                    sample.separation <= 0,
                ) ??
                  false),
            )
          )
            findings.push(
              `${profile.id}: landing lacks actual floor-patch contact at ${observed}`,
            );
        }
        let drift: number = 0;
        let speed: number = 0;
        if (kind === "quiet" && actuation === "internal")
          for (const frame of run.cache.frames.filter(
            (frame: (typeof run.cache.frames)[number]): boolean =>
              frame.seconds >= 2,
          )) {
            let center: V = { x: 0, y: 0, z: 0 };
            let velocity: V = { x: 0, y: 0, z: 0 };
            for (const segment of profile.segments) {
              const actual: (typeof frame.bodies)[string][string] =
                frame.bodies[profile.id]![segment.bone]!;
              const offset: V = Quaternion.rotateVector(
                actual.rotation,
                segment.centerOfMass,
              );
              center = Vector3.add(
                center,
                Vector3.scale(
                  Vector3.add(actual.position, offset),
                  segment.mass / profile.mass,
                ),
              );
              velocity = Vector3.add(
                velocity,
                Vector3.scale(
                  Vector3.add(
                    actual.velocity,
                    Vector3.cross(actual.angularVelocity, offset),
                  ),
                  segment.mass / profile.mass,
                ),
              );
            }
            drift = Math.max(
              drift,
              Math.hypot(
                center.x - profile.centerOfMass.x,
                center.z - profile.centerOfMass.z,
              ),
            );
            speed = Math.max(speed, Math.hypot(velocity.x, velocity.z));
          }
        if (drift > 0.02 || speed > 0.02)
          findings.push(
            `${profile.id}: sustained quiet drift/speed ${drift} m / ${speed} m/s`,
          );
        if (kind === "quiet" && actuation === "internal")
          findings.push(...inspectQuiet(run, body));
        const usage: NodeJS.CpuUsage = process.cpuUsage(cpu);
        console.log(
          JSON.stringify({
            actuation,
            provider: profile.id,
            kind,
            state: state.last,
            steps: state.steps.length,
            landings: state.landings?.length ?? 0,
            height: after,
            drift,
            speed,
            wallMs: performance.now() - start,
            cpuMs: (usage.user + usage.system) / 1000,
            rssBytes: process.memoryUsage().rss,
          }),
        );
      }
    TestValidator.equals(
      `${actuation} complete native recovery matrix`,
      findings,
      [],
    );
  }

  /** Sustained quiet acceptance observes every support separately and checks solved load, pivots and limits across the final four seconds. */
  function inspectQuiet(run: Simulation, body: Simulation.IBody): string[] {
    const findings: string[] = [];
    const profile: P = body.profile;
    const late: typeof run.cache.frames = run.cache.frames.filter(
      (frame: (typeof run.cache.frames)[number]): boolean => frame.seconds >= 2,
    );
    const anchor: number = Math.max(
      ...late.flatMap((frame: (typeof late)[number]): number[] =>
        profile.joints.map((joint: P.IJoint): number =>
          Vector3.length(
            Vector3.subtract(
              physicalSupportPoint(
                frame.bodies[body.id]![joint.parent]!,
                joint.parentFrame.position,
              ),
              physicalSupportPoint(
                frame.bodies[body.id]![joint.child]!,
                joint.childFrame.position,
              ),
            ),
          ),
        ),
      ),
    );
    const limit: number = Math.max(
      0,
      ...late.flatMap((frame: (typeof late)[number]): number[] =>
        profile.joints.flatMap((joint: P.IJoint): number[] =>
          measurePhysicalJointLimits(
            joint,
            frame.bodies[body.id]![joint.parent]!,
            frame.bodies[body.id]![joint.child]!,
          ).map(
            (
              coordinate: ReturnType<typeof measurePhysicalJointLimits>[number],
            ): number => coordinate.violation,
          ),
        ),
      ),
    );
    const impulse: number = run.cache.contacts
      .filter(
        (receipt: (typeof run.cache.contacts)[number]): boolean =>
          receipt.source === "solver" &&
          (receipt.a.body === "floor" || receipt.b.body === "floor"),
      )
      .flatMap(
        (
          receipt: (typeof run.cache.contacts)[number],
        ): NonNullable<typeof receipt.samples> => receipt.samples ?? [],
      )
      .filter(
        (
          sample: NonNullable<
            (typeof run.cache.contacts)[number]["samples"]
          >[number],
        ): boolean => sample.seconds > 2,
      )
      .reduce(
        (
          sum: number,
          sample: NonNullable<
            (typeof run.cache.contacts)[number]["samples"]
          >[number],
        ): number => sum + sample.impulse * Math.abs(sample.normal.y),
        0,
      );
    const force: number = impulse / 4;
    if (
      anchor > 0.001 ||
      limit > 0.0001 ||
      Math.abs(force - profile.mass * 9.81) > 0.1 * profile.mass * 9.81 ||
      run.cache.controllerCheckpoints.get(720)?.released?.includes(body.id)
    )
      findings.push(
        `${profile.id}: sustained quiet anchor/ROM/load/withdrawal ${anchor} m / ${limit} rad / ${force} N`,
      );
    for (const limb of body.supportTracking!.pattern.limbs) {
      const bones: readonly string[] = limb.contacts ?? [limb.bone];
      const parts: P.ISegment[] = profile.segments.filter(
        (segment: P.ISegment): boolean => bones.includes(segment.bone),
      );
      const positions: V[] = late.map(
        (frame: (typeof late)[number]): V =>
          physicalSupportPoint(
            frame.bodies[body.id]![limb.bone]!,
            limb.localPoint,
          ),
      );
      const initial: V = physicalSupportPoint(
        run.cache.frames[0]!.bodies[body.id]![limb.bone]!,
        limb.localPoint,
      );
      const drift: number = Math.max(
        ...positions.map((point: V): number =>
          Math.hypot(point.x - initial.x, point.z - initial.z),
        ),
      );
      const creep: number = Math.max(
        ...positions.map((point: V): number =>
          Math.hypot(point.x - positions[0]!.x, point.z - positions[0]!.z),
        ),
      );
      const heights: number[] = late.map(
        (frame: (typeof late)[number]): number =>
          Math.min(
            ...parts.flatMap((segment: P.ISegment): number[] =>
              segment.shapes.map(
                (shape: P.IShape): number =>
                  physicalShapeBounds(
                    frame.bodies[body.id]![segment.bone]!,
                    shape,
                  ).min.y,
              ),
            ),
          ),
      );
      const angle: number = Math.max(
        ...late.flatMap((frame: (typeof late)[number]): number[] =>
          parts.map((segment: P.ISegment): number =>
            Vector3.length(
              PhysicalRotationVector.log(
                Quaternion.multiply(
                  frame.bodies[body.id]![segment.bone]!.rotation,
                  Quaternion.inverse(segment.neutral.rotation),
                ),
              ),
            ),
          ),
        ),
      );
      const missing: number = late.filter(
        (frame: (typeof late)[number]): boolean =>
          !run.cache.contacts.some(
            (receipt: (typeof run.cache.contacts)[number]): boolean =>
              ((receipt.a.body === body.id &&
                bones.includes(receipt.a.bone) &&
                receipt.b.body === "floor") ||
                (receipt.b.body === body.id &&
                  bones.includes(receipt.b.bone) &&
                  receipt.a.body === "floor")) &&
              (receipt.samples?.some(
                (
                  sample: NonNullable<typeof receipt.samples>[number],
                ): boolean =>
                  sample.seconds === frame.seconds &&
                  sample.impulse > 0 &&
                  sample.separation <= 0,
              ) ??
                false),
          ),
      ).length;
      const measurements: object = {
        provider: profile.id,
        bone: limb.bone,
        drift,
        creep,
        minimum: Math.min(...heights),
        maximum: Math.max(...heights),
        angle,
        missing,
        anchor,
        limit,
        force,
      };
      console.log(JSON.stringify(measurements));
      if (
        drift > 0.02 ||
        creep > 0.001 ||
        Math.min(...heights) < -0.001 ||
        Math.max(...heights) > 0.001 ||
        Math.max(...heights) - Math.min(...heights) > 0.0002 ||
        angle > 0.05 ||
        missing
      )
        findings.push(
          `${profile.id}: sustained quiet patch ${JSON.stringify(measurements)}`,
        );
    }
    return findings;
  }
}
