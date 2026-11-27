import type { IAutoMoviePhysicalSimulationInput } from "@automovie/interface";

import { renderDigest } from "../../render/internal/renderDigest";
import { AutoMovieEngineCanonicalJson } from "../../text/AutoMovieEngineCanonicalJson";
import { AutoMovieEnginePhysicsCache } from "../AutoMovieEnginePhysicsCache";
import { physicalProfileWithoutHulls } from "./physicalProfileWithoutHulls";

/*
 * Hash every admitted sampled value without retaining one film-sized JSON
 * string.
 */
export function physicalInputDigest(
  input: IAutoMoviePhysicalSimulationInput.IInput,
): string {
  const targets: Map<IAutoMoviePhysicalSimulationInput.ITarget, string> =
    new Map();
  const bodies: object[] = input.bodies.map(
    (body: (typeof input.bodies)[number]): object => ({
      ...body,
      profile: physicalProfileWithoutHulls(body.profile),
      maximumBindings: body.maximumBindings ?? 16,
      handoffSeconds: body.handoffSeconds ?? 0.2,
      handoffLimits: body.handoffLimits ?? {
        maximumLinearError: input.contactTolerance ?? 0.0001,
        maximumJointViolation: 64 * Number.EPSILON,
      },
      targets: body.targets.map(
        (target: (typeof body.targets)[number]): string => {
          let digest: string | undefined = targets.get(target);
          if (!digest) {
            digest = renderDigest(
              AutoMovieEngineCanonicalJson.canonicalize(target),
            );
            targets.set(target, digest);
          }
          return digest;
        },
      ),
    }),
  );
  return renderDigest(
    AutoMovieEngineCanonicalJson.canonicalize({
      protocol: AutoMovieEnginePhysicsCache.protocol,
      solver: "automovie-xpbd-1",
      input: {
        ...input,
        substeps: input.substeps ?? 16,
        contactTolerance: input.contactTolerance ?? 0.0001,
        contactFrequency: input.contactFrequency ?? 240,
        bodies,
      },
    }),
  );
}
