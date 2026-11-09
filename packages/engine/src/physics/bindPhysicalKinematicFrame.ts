import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import { physicalContactSupportGoals } from "./physicalContactSupportGoals";
import { planPhysicalContactTargets } from "./planPhysicalContactTargets";
import type { preparePhysicalGeometry as Geometry } from "./preparePhysicalGeometry";
import { samplePhysicalTarget } from "./samplePhysicalTarget";

/**
 * Evaluate the same surface relationships without a dynamics world. Geometric receipts retain null impulse and cannot trigger physical withdrawal. All receivers use one simultaneous pre-binding snapshot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Evaluate the same surface relationships without a dynamics world) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Evaluate the same surface relationships without a dynamics world) directly over its typed inputs (`input`, `step`, `frame`, `previous`, `geometry`, `contacts`, `profiles`) as nested iteration of depth 4 (for-of over input.bodies; map over Object.entries(planned); for-of over input.bodies), delegating to `planPhysicalContactTargets`, `physicalContactSupportGoals`, `Object.fromEntries`, `Object.entries(planned).map`, `Object.entries`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 92 lines and 6 top-level statements that reuses `planPhysicalContactTargets`, `physicalContactSupportGoals`, `Object.fromEntries`, `Object.entries(planned).map`, `Object.entries` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 13 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`, `step`, `frame`, `previous`, `geometry`, `contacts`, `profiles`; the dominant cost is nested iteration of depth 4 (for-of over input.bodies; map over Object.entries(planned); for-of over input.bodies), performed once per call with 10 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 10 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function bindPhysicalKinematicFrame(
  input: Simulation.IInput,
  step: number,
  frame: Cache.IFrame,
  previous: Cache.IFrame | undefined,
  geometry: Geometry.IQueries,
  contacts: IAutoMovieContactReceipt[],
  profiles: Record<string, P> = Object.fromEntries(
    input.bodies.map((body: Simulation.IBody): [string, P] => [
      body.id,
      body.profile,
    ]),
  ),
): Cache.IFrame {
  const actual: Cache.IFrame["bodies"] = frame.bodies;
  const bodies: Cache.IFrame["bodies"] = { ...actual };
  for (const body of input.bodies) {
    const target: Simulation.ITarget = body.targets[step]!;
    if (
      !target.bindings?.length &&
      !target.pointBounds?.length &&
      !body.selfAvoidance
    )
      continue;
    const planned: Record<string, P.ITransform> = planPhysicalContactTargets({
      body: body.id,
      profiles,
      targets: target.segments,
      actual,
      bindings: target.bindings ?? [],
      pointBounds: target.pointBounds,
      selfAvoidance: body.selfAvoidance,
      supports: physicalContactSupportGoals(
        body,
        target,
        input.floor,
        input.contactTolerance!,
        step / input.rate,
        input.rate,
        step,
      ),
      geometry,
      floor: input.floor - input.contactTolerance!,
    }).targets;
    bodies[body.id] = Object.fromEntries(
      Object.entries(planned).map(
        ([bone, pose]: [string, P.ITransform]): [string, Cache.ISegment] => {
          const sampled: ReturnType<typeof samplePhysicalTarget> =
            samplePhysicalTarget(
              previous?.bodies[body.id]?.[bone] ?? pose,
              pose,
              1,
              input.rate,
            );
          return [
            bone,
            {
              ...pose,
              velocity: sampled.velocity,
              angularVelocity: sampled.angularVelocity,
            },
          ];
        },
      ),
    );
  }
  const found: Set<string> = new Set();
  for (const body of input.bodies)
    for (const binding of body.targets[step]!.bindings ?? []) {
      if (binding.kind !== "contact") continue;
      const source: P.IShape = body.profile.segments
        .find(
          (segment: P.ISegment): boolean =>
            segment.bone === binding.source.bone,
        )!
        .shapes.find(
          (shape: P.IShape): boolean => shape.id === binding.source.shape,
        )!;
      const target: P.IShape = profiles[binding.target.body]!.segments.find(
        (segment: P.ISegment): boolean => segment.bone === binding.target.bone,
      )!.shapes.find(
        (shape: P.IShape): boolean => shape.id === binding.target.shape,
      )!;
      const receipt: IAutoMovieContactReceipt | null = geometry.contact(
        {
          body: body.id,
          bone: binding.source.bone,
          shape: source,
          pose: bodies[body.id]![binding.source.bone]!,
        },
        {
          body: binding.target.body,
          bone: binding.target.bone,
          shape: target,
          pose: bodies[binding.target.body]![binding.target.bone]!,
        },
        frame.seconds,
      );
      if (receipt && !found.has(receipt.id)) {
        contacts.push(receipt);
        found.add(receipt.id);
      }
    }
  return { ...frame, bodies };
}
