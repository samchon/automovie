import { assertHumanCurves } from "../internal/assertHumanCurves";

/**
 * The trunk and shoulders and their joins are sound curves, on every person.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person and audits the column across the shoulders, catching a ridge round the torso, a band on the belly, a crushed shoulder's seam or an open armpit. Any tapes inside the supported domain pass, however the waist and chest differ.
 * @evidence contracts/testing.md#independent-expectations A ridge is the surface's radius bending the same way all round a ring at one height, which anatomy never does, read at fixed bearings so that it owes nothing to the chain's phases. Pulling the column toward the neck from the armpit, a known defect, read 8.1 to 10.2 against the limit of 8, while the sound figure reads up to 6.5. The margin is thin, so the viewer stays required.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts an hourglass reference, a heavy whole person at the supported edge, a slight one, and tall against short. The neck's test owns the ring the column settles onto, and the arm's test owns the root's far side.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curve_trunk`. The first unit to run pays to generate the shared people; it starts no process, browser or GPU.
 */
export const test_human_curve_trunk = (): void =>
  assertHumanCurves(/^(trunk|upper)$/);
