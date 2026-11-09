import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";
import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { AutoMoviePhysicsCache } from "./AutoMoviePhysicsCache";

/**
 * Hash every admitted sampled value without retaining one film-sized JSON string.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Hash every admitted sampled value without retaining one film-sized JSON string) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Hash every admitted sampled value without retaining one film-sized JSON string) directly over its typed inputs (`input`) as nested iteration of depth 2 (map over input.bodies; map over body.targets), delegating to `targets.get`, `autoMovieRenderDigest`, `canonicalizeAutoMovieJson`, `targets.set`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 16, 0.2, 0.0001, 64, 23, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 38 lines and 3 top-level statements that reuses `targets.get`, `autoMovieRenderDigest`, `canonicalizeAutoMovieJson`, `targets.set` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 16, 0.2, 0.0001, 64, 23 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (map over input.bodies; map over body.targets), performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function physicalInputDigest(input: Simulation.IInput): string {
  const targets: Map<Simulation.ITarget, string> = new Map();
  const bodies: object[] = input.bodies.map(
    (body: (typeof input.bodies)[number]): object => ({
      ...body,
      maximumBindings: body.maximumBindings ?? 16,
      handoffSeconds: body.handoffSeconds ?? 0.2,
      handoffLimits: body.handoffLimits ?? {
        maximumLinearError: input.contactTolerance ?? 0.0001,
        maximumJointViolation: 64 * 2 ** -23,
      },
      targets: body.targets.map(
        (target: (typeof body.targets)[number]): string => {
          let digest: string | undefined = targets.get(target);
          if (!digest) {
            digest = autoMovieRenderDigest(canonicalizeAutoMovieJson(target));
            targets.set(target, digest);
          }
          return digest;
        },
      ),
    }),
  );
  return autoMovieRenderDigest(
    canonicalizeAutoMovieJson({
      protocol: AutoMoviePhysicsCache.protocol,
      solver: "rapier-0.21.0",
      input: {
        ...input,
        substeps: input.substeps ?? 16,
        internalIterations: input.internalIterations ?? 1,
        contactTolerance: input.contactTolerance ?? 0.0001,
        contactFrequency: input.contactFrequency ?? 240,
        bodies,
      },
    }),
  );
}
