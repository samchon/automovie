import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanRunSignature } from "../internal/motionHumanRunSignature";

/**
 * A run looks like human running on the large man, at each pace over the steady
 * middle half of a 6 m run, read with the bounds `motionHumanRunSignature`
 * states: the mean trunk inclination in [2, 20] degrees and growing with
 * speed (Thorstensson et al. 1984; Novacheck 1998), a flight every step and
 * the duty factor below 0.45, the sprint's below 0.35 (Alexander 1984), the
 * cadence in [150, 200] steps a minute, the sprint's at least 200 (Cavanagh
 * and Kram 1989; Mero et al. 1992), the centre of mass lowest at mid-stance
 * (Cavagna et al. 1976) and the stance knee flexed in [25, 60] degrees
 * (Novacheck 1998), on a quiet stance read within 3 degrees of vertical.
 *
 * Scenarios:
 * 1. Each pace and the default run lean, fly, bounce and step like running.
 * 2. The lean grows from the jog to the sprint.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real run law on a real body and reads displayed bones; a trunk tipped back, a run with double support or no flight, a wrong cadence, a centre of mass that rises at mid-stance or a stiff stance knee fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations Every bound is a cited running value or marked provisional with its reason; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases Three paces and the default on one of the four extreme bodies; the others are their own specs.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and performs four films in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status and the 2 scenarios.
 */
export function test_human_motion_signature_run_m_large(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  motionHumanRunSignature.read("m-large", complaints);
  complaints.assert("the run has the signature of human running");
}
