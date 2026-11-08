import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";
import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { AutoMoviePhysicsCache } from "./AutoMoviePhysicsCache";

/** Hash every admitted sampled value without retaining one film-sized JSON string. */
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
