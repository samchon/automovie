import { physicalJointChain } from "@automovie/engine";
import type {
  IAutoMoviePhysicalContactBinding as Binding,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { BoutPhysicalSettings as Settings } from "./BoutPhysicalSettings";

/** Declare the complete physical subtree of an authored limb against every receiver shape. Separate relationships forbid penetration, including the requested contact pair; approaching a surface witness alone does not establish whole-collider clearance. Shared profile self avoidance handles the performer's other limbs in the same fit. */
export function boutLimbClearanceBindings(
  profile: P,
  receiver: { body: string; profile: P },
  root: string,
  label: string,
): Binding[] {
  const bones: Set<string> = new Set([root]);
  for (let pass: number = 0; pass < profile.segments.length; pass++)
    for (const joint of profile.joints)
      if (bones.has(joint.parent)) bones.add(joint.child);
  return profile.segments
    .filter((segment: P.ISegment): boolean => bones.has(segment.bone))
    .flatMap((own: P.ISegment): Binding[] =>
      own.shapes.flatMap((shape: P.IShape): Binding[] =>
        receiver.profile.segments.flatMap((target: P.ISegment): Binding[] =>
          target.shapes.map(
            (surface: P.IShape): Binding => ({
              id: `${label}:${own.bone}/${shape.id}:${target.bone}/${surface.id}`,
              kind: "separate",
              chain: physicalJointChain(profile, own.bone).filter(
                (bone: string): boolean => bones.has(bone),
              ),
              source: { bone: own.bone, shape: shape.id },
              target: {
                body: receiver.body,
                bone: target.bone,
                shape: surface.id,
              },
              weight: 1,
              compression: 0,
              iterations: Settings.targetIterations,
              tolerance: Settings.targetTolerance,
            }),
          ),
        ),
      ),
    );
}
