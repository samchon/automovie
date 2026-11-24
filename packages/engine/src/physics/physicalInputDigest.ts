import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";
import { AutoMoviePhysicsCache } from "./AutoMoviePhysicsCache";

/**
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
      profile: withoutHulls(body.profile),
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

/**
 * A profile as authored: the hull a hull shape carries is derived from its
 * points, so it does not enter the digest.
 */
function withoutHulls(
  profile: IAutoMoviePhysicalProfile,
): IAutoMoviePhysicalProfile {
  return {
    ...profile,
    segments: profile.segments.map(
      (segment: IAutoMoviePhysicalSegment): IAutoMoviePhysicalSegment => ({
        ...segment,
        shapes: segment.shapes.map(
          (shape: IAutoMoviePhysicalShape): IAutoMoviePhysicalShape => {
            if (shape.kind !== "hull") return shape;
            const { hull: _derived, ...authored } = shape;
            return authored;
          },
        ),
      }),
    ),
  };
}
