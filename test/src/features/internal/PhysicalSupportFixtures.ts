import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { PhysicalFixtures } from "./PhysicalFixtures";

/** Explicit support and actuator declarations for actual Human and four-support recovery cases. */
export namespace PhysicalSupportFixtures {
  /** Use the two foot endpoints and their toe colliders on the canonical polygon body. */
  export function canonical(
    profile: P,
    duration: number,
  ): IAutoMoviePhysicalSimulationInput.IBody {
    return body(profile, duration, {
      leftFoot: ["leftFoot", "leftToes"],
      rightFoot: ["rightFoot", "rightToes"],
    });
  }

  /** Set the same bounded support policy used by the measured complete native episodes. */
  export function body(
    profile: P,
    duration: number,
    declared?: Readonly<Record<string, readonly string[]>>,
  ): IAutoMoviePhysicalSimulationInput.IBody {
    const endpoints: IAutoMoviePhysicalSegment[] = profile.segments.filter(
      (segment: (typeof profile.segments)[number]): boolean =>
        declared
          ? Object.hasOwn(declared, segment.bone)
          : profile.id === "human"
            ? segment.bone.endsWith("Midfoot")
            : segment.bone.startsWith("support-"),
    );
    if (declared && endpoints.length !== Object.keys(declared).length)
      throw new Error("Missing declared physical support endpoint");
    const pattern: IAutoMovieFootfallPattern = {
      id: "declared-supports",
      minimumSupports: 1,
      limbs: endpoints.map(
        (
          segment: (typeof endpoints)[number],
          index: number,
        ): {
          bone: string;
          contacts: string[];
          chain: string[];
          reach: { root: string; middle: string; tip: string };
          phase: number;
          duty: number;
          offset: { forward: number; left: number };
          stride: { speed: number; length: number }[];
        } => {
          const chain: string[] = [segment.bone];
          let parent: string | undefined = profile.joints.find(
            (joint: (typeof profile.joints)[number]): boolean =>
              joint.child === segment.bone,
          )?.parent;
          while (parent && parent !== profile.segments[0]!.bone) {
            chain.unshift(parent);
            parent = profile.joints.find(
              (joint: (typeof profile.joints)[number]): boolean =>
                joint.child === parent,
            )?.parent;
          }
          const contacts: string[] =
            declared?.[segment.bone] !== undefined
              ? [...declared[segment.bone]!]
              : profile.id === "human"
                ? [segment.bone, segment.bone.replace("Midfoot", "Subtalar")]
                : [segment.bone];
          return {
            bone: segment.bone,
            contacts,
            chain,
            reach: { root: chain[0]!, middle: chain[1]!, tip: chain[2]! },
            phase: index / endpoints.length,
            duty: 0.6,
            offset: {
              forward: segment.neutral.position.x,
              left: segment.neutral.position.z,
            },
            stride: [
              { speed: 0, length: 0.6 },
              { speed: 2, length: 0.6 },
            ],
          };
        },
      ),
    };
    const result: IAutoMoviePhysicalSimulationInput.IBody =
      PhysicalFixtures.body(profile.id, profile, duration);
    for (const target of result.targets) target.strength = 1;
    result.rootStiffness = 100 * profile.mass;
    result.rootDamping = 15 * profile.mass;
    result.maximumRootForce = 25 * profile.mass;
    result.rootTorque = {
      stiffness: 5 * profile.mass,
      damping: profile.mass,
      maximumTorque: 6 * profile.mass,
    };
    result.balance = {
      pattern,
      maximumStep: 0.6,
      duration: 0.25,
      height: 0.1,
      stiffness: 500,
      damping: 60,
      maximumForce: 500,
      margin: 0.01,
    };
    return result;
  }
}
