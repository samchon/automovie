import { assertHumanCurves } from "../internal/assertHumanCurves";

/**
 * The trunk and shoulders and their joins are sound curves, on every person.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person and audits the column across the shoulders, catching a ridge round the torso, a band on the belly, a crushed shoulder's seam, an open armpit, a rear that stops rising at the crotch ring, a sharp tip on that ring's rear or a back that turns faster on one side of the armpit's joint than the other. Any tapes inside the supported domain pass, however the waist and chest differ.
 * @evidence contracts/testing.md#independent-expectations A ridge is the surface's radius bending the same way all round a ring at one height, which anatomy never does, read at fixed bearings so that it owes nothing to the chain's phases. Pulling the column toward the neck from the armpit, a known defect, read 8.1 to 10.2 against the limit of 8, while the sound figure reads up to 6.5. The margin is thin, so the viewer stays required. The shelf, tip and step rules were proved on the figure before the rear line: f1 read 3.35 against 2, 2.17 against 1.5 and 6.92 against 4, and m2 read 2.56 on the tip while its shelf and step passed. All pass after it, but their limits were set after both figures were read, and a line still shows at the crotch ring and across the chest, so these rules do not prove those lines gone. The teeth rule, the largest turn of a ring over one control pitch away from its pinches, read 42, 49 and 52 degrees on f1, m1 and m2 against 30 on a crotch fold 1 mm wide, which printed a sawtooth in the viewer, and reads at most 20.5 on the figure the viewer showed smooth.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts an hourglass reference, a heavy whole person at the supported edge, a slight one, and tall against short. The neck's test owns the ring the column settles onto, and the arm's test owns the root's far side.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curve_trunk`. The first unit to run pays to generate the shared people; it starts no process, browser or GPU.
 */
export const test_human_curve_trunk = (): void =>
  assertHumanCurves(/^(trunk|upper)$/);
