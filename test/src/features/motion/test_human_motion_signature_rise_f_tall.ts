import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanRiseSignature } from "../internal/motionHumanRiseSignature";

/**
 * Rising from a chair looks like a human sit-to-stand on the tall woman, from a seat
 * at the body's own popliteal height, read with the bounds
 * `motionHumanRiseSignature` states (Schenkman et al. 1990): the trunk's
 * peak flexion before seat-off in [20, 60] degrees, the knees at most 20
 * degrees and the trunk within [-10, 10] at standing, both feet on the floor
 * from seat-off to standing (all provisional), on a quiet stance read within
 * 3 degrees of vertical.
 *
 * Scenarios:
 * 1. The trunk flexes into its band before the seat is left.
 * 2. The body ends standing, knees nearly straight and trunk upright.
 * 3. No foot leaves the floor while rising.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real rise law on a real body and reads displayed joints and soles; a rise without forward flexion, one that ends bent or a lifted foot fails with its value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The phases and the flexion are Schenkman et al.'s; every limit is marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases One of the four extreme bodies; the others are their own specs.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and performs one film in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status and the 3 scenarios.
 */
export function test_human_motion_signature_rise_f_tall(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  motionHumanRiseSignature.read("f-tall", complaints);
  complaints.assert("the rise has the signature of a sit-to-stand");
}
