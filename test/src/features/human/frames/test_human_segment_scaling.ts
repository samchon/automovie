import {
  AutoMovieHumanF1Placing as T,
  AutoMovieHumanF1SegmentLengths as Lengths,
  AutoMovieHumanSegmentFrame as F,
  AutoMovieHumanSegmentScaling as Scaling,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieHumanSegmentJoint,
} from "@automovie/interface";

/**
 * A segment's length moves its far joint along it; every joint past it follows and keeps its own length.
 *
 * Scenarios:
 * 1. A made chain a > b > c > d (b 100 mm below a, c 50 mm below b and 10 mm to +Z, turned 90 degrees about Z, d 30 mm along c's -Y):
 *    the a-b run scaled by 1.2 puts b at [0, -120, 0], c at [0, -170, 10] and d at [30, -170, 10]: the scaled run scales, the next runs
 *    translate by 20 mm.
 * 2. The twin by the declared reflection z -> -z (`AutoMovieHumanSegmentFrame.mirror`) puts the scaled c at [0, -170, -10].
 * 3. A ratio of one returns the given chain itself; the along/across spread at ones returns its input.
 * 4. The spread of [2, 3, 4] along X by 1.5 and along Z by 0.5 is [3, 3, 2]; the reflected axes spread the reflected vector to the
 *    reflected result.
 * 5. Defects are refused: a zero ratio, a joint the chain lacks, axes that are not square.
 * 6. f1's own lengths return the stored chain and every stored datum's local coordinates as they are; a 10 % longer upper arm moves the
 *    elbow centre by a tenth of the humerus's offset and the wrist centre by the same vector.
 * 7. A 10 % longer upper trunk run keeps the thorax's origin and moves the head's by a tenth of its stored offset; a 20 % longer hand
 *    moves the third metacarpal head to 1.2 of its offset, the fifth by 0.2 of its component along the hand's axis only, and leaves the
 *    middle finger's own bone as stored.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production chain edit, spread and f1 length binding and composes their frames with the production composer.
 * @evidence contracts/development/testing.md#independent-expectations Every expected origin is the made chain's closed form; f1's moves are a tenth of a stored offset rotated by the stored humerus frame.
 * @evidence contracts/development/common.md#meaningful-documentation The synthetic chain checks selected length edits, inherited world movement, reflection, unit identity, axial spreading and malformed operations. Stored lengths add named controls.
 */
export function test_human_segment_scaling(): void {
  const failures: string[] = [];
  const at = (what: string, got: AutoMovieVector3Tuple, want: AutoMovieVector3Tuple, tolerance: number = 1e-12): void => {
    if (!(Math.hypot(got[0] - want[0], got[1] - want[1], got[2] - want[2]) <= tolerance)) failures.push(`${what}: [${got.join(", ")}] instead of [${want.join(", ")}]`);
  };
  const chain: IAutoMovieHumanSegmentJoint[] = [
    { name: "a", parent: null, offset: [0, 0, 0], rotation: F.IDENTITY },
    { name: "b", parent: "a", offset: [0, -100, 0], rotation: F.IDENTITY },
    { name: "c", parent: "b", offset: [0, -50, 10], rotation: F.about(2, Math.PI / 2) },
    { name: "d", parent: "c", offset: [0, -30, 0], rotation: F.IDENTITY },
  ];
  const none = (): undefined => undefined;

  // 1 and 2.
  const scaled: readonly IAutoMovieHumanSegmentJoint[] = Scaling.chain(chain, new Map([["b", 1.2]]));
  const frames: Map<string, IAutoMovieHumanSegmentFrame> = F.world(scaled, none);
  at("b", frames.get("b")!.origin, [0, -120, 0]);
  at("c", frames.get("c")!.origin, [0, -170, 10]);
  at("d", frames.get("d")!.origin, [30, -170, 10]);
  at("twin c", F.mirror(frames.get("c")!).origin, [0, -170, -10]);

  // 3. Identities.
  if (Scaling.chain(chain, new Map([["b", 1]])) !== chain) failures.push("a ratio of one did not return the given chain");
  const p: AutoMovieVector3Tuple = [2, 3, 4];
  if (Scaling.spread([1, 0, 0], [0, 0, 1], 1, 1)(p) !== p) failures.push("a spread at ones did not return its input");

  // 4. The spread and its reflection.
  at("spread", Scaling.spread([1, 0, 0], [0, 0, 1], 1.5, 0.5)(p), [3, 3, 2]);
  const D = (v: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [v[0], v[1], -v[2]];
  const [a, b]: AutoMovieVector3Tuple[] = [[0.6, 0, 0.8], [-0.8, 0, 0.6]];
  at("reflected spread", Scaling.spread(D(a!), D(b!), 1.3, 0.7)(D([1, 2, 3])), D(Scaling.spread(a!, b!, 1.3, 0.7)([1, 2, 3])));

  // 5. Defects.
  const refuses = (what: string, call: () => unknown): void => {
    try {
      call();
      failures.push(what + " was accepted");
    } catch {
      // refused as required
    }
  };
  refuses("a zero ratio", (): unknown => Scaling.chain(chain, new Map([["b", 0]])));
  refuses("an absent joint", (): unknown => Scaling.chain(chain, new Map([["e", 1.1]])));
  refuses("axes not square", (): unknown => Scaling.spread([1, 0, 0], [0.6, 0.8, 0], 1, 1));

  // 6. f1.
  if (Lengths.chain(Lengths.F1) !== T.CHAIN) failures.push("f1's lengths did not return the stored chain");
  for (const name of Object.keys(T.POINTS)) if (Lengths.local(Lengths.F1, name) !== T.POINTS[name]!.local) failures.push("f1's datum " + name + " moved");
  const longer: readonly IAutoMovieHumanSegmentJoint[] = Lengths.chain({ ...Lengths.F1, upperArm: Lengths.F1.upperArm * 1.1 });
  const [before, after] = [F.world(T.CHAIN, none), F.world(longer, none)];
  const offset: AutoMovieVector3Tuple = T.CHAIN.find((j: IAutoMovieHumanSegmentJoint): boolean => j.name === "forearm")!.offset;
  const move: AutoMovieVector3Tuple = F.scale(F.toWorldDirection(before.get("humerus")!, offset), 0.1);
  at("elbow centre", after.get("forearm")!.origin, F.add(before.get("forearm")!.origin, move), 1e-9);
  at("wrist centre", after.get("hand")!.origin, F.add(before.get("hand")!.origin, move), 1e-9);

  // 7. The trunk's upper run and the hand's length.
  const taller: Map<string, IAutoMovieHumanSegmentFrame> = F.world(Lengths.chain({ ...Lengths.F1, thoraxToHead: Lengths.F1.thoraxToHead * 1.1 }), none);
  const neck: AutoMovieVector3Tuple = T.CHAIN.find((j: IAutoMovieHumanSegmentJoint): boolean => j.name === "head")!.offset;
  at("thorax origin", taller.get("thorax")!.origin, before.get("thorax")!.origin, 0);
  at("head origin", taller.get("head")!.origin, F.add(before.get("head")!.origin, F.scale(F.toWorldDirection(before.get("thorax")!, neck), 0.1)), 1e-9);
  const handed: readonly IAutoMovieHumanSegmentJoint[] = Lengths.chain({ ...Lengths.F1, handLength: Lengths.F1.handLength * 1.2 });
  const offsetOf = (joints: readonly IAutoMovieHumanSegmentJoint[], name: string): AutoMovieVector3Tuple => joints.find((j: IAutoMovieHumanSegmentJoint): boolean => j.name === name)!.offset;
  at("third metacarpal head", offsetOf(handed, "middle.proximal"), F.scale(offsetOf(T.CHAIN, "middle.proximal"), 1.2), 1e-9);
  const along: AutoMovieVector3Tuple = F.unit(offsetOf(T.CHAIN, "middle.proximal"));
  const fifth: AutoMovieVector3Tuple = offsetOf(T.CHAIN, "pinky.proximal");
  at("fifth metacarpal head", offsetOf(handed, "pinky.proximal"), F.add(fifth, F.scale(along, 0.2 * F.dot(fifth, along))), 1e-9);
  at("a finger's own bone", offsetOf(handed, "middle.middle"), offsetOf(T.CHAIN, "middle.middle"), 0);
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
