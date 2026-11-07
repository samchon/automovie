import {
  AutoMovieMotionAudit as Audit,
  type AutoMoviePhysicsCache as Cache,
  preparePhysicalGeometry as Geometry,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalContactBinding as Binding,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { BoutPhysicalSettings as Settings } from "../../src/physics/BoutPhysicalSettings";
import type { BoutTargetSource } from "../../src/physics/BoutTargetSource";
import { boutContactBindings } from "../../src/physics/boutContactBindings";
import { fitBoutContactTargets } from "../../src/physics/fitBoutContactTargets";
import { observedBoutHeadCenter } from "./observedBoutHeadCenter";
import { observedBoutHeadFront } from "./observedBoutHeadFront";

/** Inspect the shared fitted targets against every actual receiver shape. The same measured round runs in the Node test and the real browser's geometry consumer; it integrates no dynamics and claims no solver impulse. */
export async function inspectBoutPosts(
  source: BoutTargetSource,
  times: readonly number[],
  displacements: readonly number[],
  progress?: (seconds: number) => void,
): Promise<{
  findings: string[];
  cases: {
    seconds: number;
    actor: string;
    side: string;
    displacement: number;
    pairs: number;
    penetration: number;
    guardDrop: number;
    guardRise: number;
    forwardDistance: number;
  }[];
}> {
  const geometry: Geometry.IQueries = await Geometry();
  const profiles: Record<string, P> = {
    a: source.rigs.a.profile,
    b: source.rigs.b.profile,
  };
  const findings: string[] = [];
  const cases: {
    seconds: number;
    actor: string;
    side: string;
    displacement: number;
    pairs: number;
    penetration: number;
    guardDrop: number;
    guardRise: number;
    forwardDistance: number;
  }[] = [];
  for (const seconds of times) {
    progress?.(seconds);
    try {
      const samples: ReturnType<BoutTargetSource["sample"]> =
        source.sample(seconds);
      for (const actor of ["a", "b"] as const)
        for (const side of ["left", "right"] as const) {
          const intent: (typeof samples)[typeof actor]["frame"]["hands"][typeof side] =
            samples[actor].frame.hands[side];
          if (
            intent.kind !== "guard" ||
            !(intent.extension && intent.extension > 0)
          )
            continue;
          const other: "a" | "b" = actor === "a" ? "b" : "a";
          const bindings: Binding[] = boutContactBindings(
            source,
            actor,
            seconds,
          ).filter((binding: Binding): boolean => binding.kind === "separate");
          const actual: Record<string, Record<string, P.ITransform>> = {
            a: samples.a.segments,
            b: samples.b.segments,
          };
          for (const displacement of displacements) {
            const scene: typeof actual = structuredClone(actual);
            const forward: P.ITransform["position"] = {
              x: Math.cos(samples[actor].frame.heading),
              y: 0,
              z: -Math.sin(samples[actor].frame.heading),
            };
            for (const pose of Object.values(scene[other]!))
              pose.position = Vector3.add(
                pose.position,
                Vector3.scale(forward, displacement),
              );
            const fitted: ReturnType<typeof fitBoutContactTargets> =
              displacement === 0
                ? {
                    targets: scene[actor]!,
                    residuals: samples[actor].residuals ?? {},
                  }
                : fitBoutContactTargets(
                    source,
                    actor,
                    seconds,
                    scene[actor]!,
                    scene,
                    geometry,
                    samples[actor].frame,
                    samples[actor].supportGoals,
                  );
            for (const [name, residual] of Object.entries(fitted.residuals))
              if (residual > Settings.targetTolerance)
                findings.push(
                  `${actor}/${side}@${seconds} moved ${displacement}: remaining ${name} ${residual}m`,
                );
            let penetration: number = 0;
            for (const binding of bindings) {
              const own: P.IShape = profiles[actor]!.segments.find(
                (segment: P.ISegment): boolean =>
                  segment.bone === binding.source.bone,
              )!.shapes.find(
                (shape: P.IShape): boolean => shape.id === binding.source.shape,
              )!;
              const target: P.IShape = profiles[other]!.segments.find(
                (segment: P.ISegment): boolean =>
                  segment.bone === binding.target.bone,
              )!.shapes.find(
                (shape: P.IShape): boolean => shape.id === binding.target.shape,
              )!;
              const measured: ReturnType<Geometry.IQueries["contact"]> =
                geometry.contact(
                  {
                    body: actor,
                    bone: binding.source.bone,
                    shape: own,
                    pose: fitted.targets[binding.source.bone]!,
                  },
                  {
                    body: other,
                    bone: binding.target.bone,
                    shape: target,
                    pose: scene[other]![binding.target.bone]!,
                  },
                  seconds,
                );
              penetration = Math.max(penetration, -(measured?.separation ?? 0));
              if (measured && measured.separation < -Settings.targetTolerance)
                findings.push(
                  `${actor}/${side}@${seconds} moved ${displacement}: ${binding.id} ${measured.separation}m`,
                );
            }
            const hand: P.ISegment = profiles[actor]!.segments.find(
              (segment: P.ISegment): boolean => segment.bone === `${side}Hand`,
            )!;
            const glove: P.IShape = hand.shapes.find(
              (shape: P.IShape): boolean => shape.material === "glove",
            )!;
            if (glove.kind !== "sphere")
              throw new Error("Expected the actual film glove sphere");
            const point: P.ITransform["position"] = Vector3.add(
              fitted.targets[hand.bone]!.position,
              Quaternion.rotateVector(
                fitted.targets[hand.bone]!.rotation,
                glove.transform.position,
              ),
            );
            const headCenter: ReturnType<typeof observedBoutHeadCenter> =
              observedBoutHeadCenter(profiles[actor]!, fitted.targets.head!);
            const headHeight: number = headCenter[1];
            const guardDrop: number = headHeight - glove.radius - point.y;
            const guardRise: number = point.y - headHeight - glove.radius;
            // This oracle evaluates transformed primitive geometry directly, without
            // the production planner's shape support or audit's rotated bounds.
            const headFront: number = observedBoutHeadFront(
              profiles[actor]!,
              fitted.targets.head!,
              forward,
            );
            const minimum: number = (2 * intent.extension - 1) * glove.radius;
            const forwardDistance: number =
              Vector3.dot(point, forward) - headFront - minimum;
            if (guardDrop > Settings.targetTolerance)
              findings.push(
                `${actor}/${side}@${seconds} moved ${displacement}: separation dropped head protection ${guardDrop}m`,
              );
            if (guardRise > Settings.targetTolerance)
              findings.push(
                `${actor}/${side}@${seconds} moved ${displacement}: guard rose above the protective head line ${guardRise}m`,
              );
            if (forwardDistance < -Settings.targetTolerance)
              findings.push(
                `${actor}/${side}@${seconds} moved ${displacement}: guard lost its head-front protection ${forwardDistance}m`,
              );
            for (const own of ["left", "right"] as const) {
              const protective: P.ISegment = profiles[actor]!.segments.find(
                (segment: P.ISegment): boolean => segment.bone === `${own}Hand`,
              )!;
              const equipment: P.IShape = protective.shapes.find(
                (shape: P.IShape): boolean => shape.material === "glove",
              )!;
              if (equipment.kind !== "sphere")
                throw new Error("Expected the actual protective glove sphere");
              const center: P.ITransform["position"] = Vector3.add(
                fitted.targets[protective.bone]!.position,
                Quaternion.rotateVector(
                  fitted.targets[protective.bone]!.rotation,
                  equipment.transform.position,
                ),
              );
              if (
                Math.abs(center.y - headHeight) >
                equipment.radius + Settings.targetTolerance
              )
                findings.push(
                  `${actor}/${own}@${seconds} moved ${displacement}: the opposite guard no longer covers head-center height`,
                );
            }
            const states: Record<string, Cache.ISegment> = Object.fromEntries(
              Object.entries(fitted.targets).map(
                ([bone, pose]: [string, P.ITransform]): [
                  string,
                  Cache.ISegment,
                ] => [
                  bone,
                  {
                    ...pose,
                    velocity: { x: 0, y: 0, z: 0 },
                    angularVelocity: { x: 0, y: 0, z: 0 },
                  },
                ],
              ),
            );
            const self: Awaited<ReturnType<typeof Audit.run>> = await Audit.run(
              {
                bodies: [
                  {
                    id: actor,
                    profile: profiles[actor]!,
                    speeds: {},
                    supports: [],
                    constraints: [],
                    floorTolerance: Settings.floorTolerance,
                    overlapTolerance: Settings.targetTolerance,
                    jointTolerance: Settings.jointTolerance,
                    accountForCompression: false,
                  },
                ],
                start: seconds,
                end: seconds,
                rate: Settings.rate,
                floor: Settings.floor,
                sample: (): Cache.IFrame => ({
                  seconds,
                  bodies: { [actor]: states },
                }),
                allowed: (): boolean => false,
              },
            );
            for (const finding of self.findings)
              findings.push(
                `${actor}/${side}@${seconds} moved ${displacement}: ${finding.kind}/${finding.label} ${finding.actual}`,
              );
            const measurement: (typeof cases)[number] = {
              seconds,
              actor,
              side,
              displacement,
              pairs: bindings.length,
              penetration,
              guardDrop,
              guardRise,
              forwardDistance,
            };
            cases.push(measurement);

          }
        }
    } catch (error: unknown) {
      findings.push(
        `sample@${seconds}: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      );
    }
    await new Promise<void>((resolve: () => void): void => {
      setTimeout(resolve, 0);
    });
  }
  return { findings, cases };
}
