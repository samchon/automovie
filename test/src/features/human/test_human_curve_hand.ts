import { assertHumanCurves } from "../internal/assertHumanCurves";

/**
 * The hands and their joins are sound curves, on every person.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person and audits the palm, finger and thumb chains, catching a reversed ring, an unfinite control, a slipped web or a palm that leaves the wrist with a broken join. Any hand size passes, and fingers skip the bands their caps would raise.
 * @evidence contracts/testing.md#independent-expectations Finiteness, winding and join closure are the basis, independent of the hand's stored sections. The wrist seam has its own wide limit, since the sections turn across the hand there, so the rule catches a broken wrist and not a stiff one.
 * @evidence contracts/testing.md#distinguishing-cases Spreads hands by stature and girth across a heavy, a slight, a tall and a short person, where a law in the wrong tape shows at once. The arm's test owns the forearm, and the digit branch here owns what the plain rules exempt.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curve_hand` over the cached generated people, with no process, browser or GPU.
 */
export const test_human_curve_hand = (): void =>
  assertHumanCurves(/^(hand|finger|thumb)\./);
