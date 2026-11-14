import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanWalkSignature } from "../internal/motionHumanWalkSignature";

/**
 * A walk looks like human walking on the large man, at each pace over the steady
 * middle half of a 3 m walk, read with the bounds `motionHumanWalkSignature`
 * states: the mean trunk inclination in [0, 10] degrees and growing with
 * speed (Thorstensson et al. 1984), the duty factor in [0.55, 0.75] with
 * double support every step (Alexander 1984; Perry and Burnfield 2010), the
 * normal cadence in [95, 130] steps a minute and rising with pace (Perry and
 * Burnfield 2010), the centre of mass highest at mid single support and over
 * the stance foot (Cavagna et al. 1976; Winter 1995), and the head level
 * (Pozzo et al. 1990), on a quiet stance read within 3 degrees of vertical.
 *
 * Scenarios:
 * 1. Each pace and the default walk lean, bear, vault and look like walking.
 * 2. The lean and the cadence grow from the slow pace to the fast one.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real walk law on a real body and reads displayed bones; a trunk tipped back, a gait without double support, a wrong cadence, a centre of mass that dips at mid-stance or a head looking up fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations Every bound is a cited human-gait value or marked provisional with its reason; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases Three paces and the default on one of the four extreme bodies; the others are their own specs.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and performs four films in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status and the 2 scenarios.
 */
export function test_human_motion_signature_walk_m_large(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  motionHumanWalkSignature.read("m-large", complaints);
  complaints.assert("the walk has the signature of human walking");
}
