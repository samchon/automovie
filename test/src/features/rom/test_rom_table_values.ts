import { DEFAULT_HUMANOID_ROM, swingConeAngle } from "@automovie/engine";
import { IAutoMovieJointConstraint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

/**
 * Pin the exposed fallback policy for hinge and ball joints and its observable coupled swing verdict. These approximate defaults are a conventional baseline, not independently established population-specific anatomy.
 *
 * Scenarios:
 *
 * 1. The elbow has flexion [0,150] and no abduction axis.
 * 2. The knee has minimum flexion zero and neither an abduction nor a twist axis.
 * 3. The shoulder has an abduction axis and a 180-degree conventional swing cap, preserving its pure-plane maximum and selected maximal corner.
 * 4. The hip admits pure 120-degree flexion but excludes the max-flexion plus max-abduction corner from its 120-degree cone.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads public fallback values and applies the actual swing metric to pure-plane/corner poses, catching changed hinge policy or loss of the hip's coupled restriction.
 * @evidence contracts/testing.md#independent-expectations Literal hinge intervals and cap values pin the maintained policy; pure-plane half-angle geometry supplies numerical swing expectations. Table maxima combined with the product metric are not an independent derivation of an anatomical envelope.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts hinge null axes with ball-joint abduction, both sides' caps, admitted pure-plane maxima and the hip's excluded corner; override precedence, detection and malformed bounds have separate entries.
 * @evidence contracts/testing.md#execution-ownership The named portable entry owns synchronous public-value and metric observations and creates no Human asset, renderer, native artifact or process.
 */
export function test_rom_table_values(): void {
  const elbow: IAutoMovieJointConstraint = DEFAULT_HUMANOID_ROM.leftLowerArm!;
  TestValidator.predicate(
    "elbow flexion min",
    nclose(elbow.flexion!.min, 0, 0),
  );
  TestValidator.predicate(
    "elbow flexion max",
    nclose(elbow.flexion!.max, 150, 0),
  );
  TestValidator.equals("elbow does not abduct", elbow.abduction, null);

  const knee: IAutoMovieJointConstraint = DEFAULT_HUMANOID_ROM.leftLowerLeg!;
  TestValidator.predicate(
    "knee no hyperextension",
    nclose(knee.flexion!.min, 0, 0),
  );
  TestValidator.equals("knee no abduction", knee.abduction, null);
  TestValidator.equals("knee no twist", knee.twist, null);

  const shoulder: IAutoMovieJointConstraint =
    DEFAULT_HUMANOID_ROM.leftUpperArm!;
  TestValidator.predicate(
    "shoulder is a ball joint",
    shoulder.abduction !== null,
  );
  TestValidator.predicate(
    "left shoulder swing cone",
    nclose(shoulder.swingDeg!, 180, 0),
  );
  TestValidator.predicate(
    "right shoulder swing cone",
    nclose(DEFAULT_HUMANOID_ROM.rightUpperArm!.swingDeg!, 180, 0),
  );
  // These selected default shoulder poses stay within the 180-degree policy; arbitrary multi-turn angles need not.
  TestValidator.equals(
    "the shoulder cone is headroom: the maximal corner never trips it",
    namedFacts([
      [
        "swingConeAngleShoulderFlexion",
        (): boolean =>
          swingConeAngle(shoulder.flexion!.max, shoulder.abduction!.max) <=
          shoulder.swingDeg!,
      ],
      [
        "ncloseSwingConeAngleShoulder",
        (): boolean => nclose(swingConeAngle(shoulder.flexion!.max, 0), 180),
      ],
    ]),
    { swingConeAngleShoulderFlexion: true, ncloseSwingConeAngleShoulder: true },
  );

  const hip: IAutoMovieJointConstraint = DEFAULT_HUMANOID_ROM.leftUpperLeg!;
  TestValidator.predicate("left hip swing cone", nclose(hip.swingDeg!, 120, 0));
  TestValidator.predicate(
    "right hip swing cone",
    nclose(DEFAULT_HUMANOID_ROM.rightUpperLeg!.swingDeg!, 120, 0),
  );
  TestValidator.predicate(
    "pure hip flexion reaches the cone",
    nclose(swingConeAngle(hip.flexion!.max, 0), hip.swingDeg!),
  );
  TestValidator.predicate(
    "hip max flexion+abduction corner is outside the cone",
    swingConeAngle(hip.flexion!.max, hip.abduction!.max) > hip.swingDeg!,
  );
}
