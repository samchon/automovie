import {
  AutoMovieHumanSegmentFrame as F,
  AutoMovieHumanSegmentScaling as Scaling,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieHumanSegmentJoint,
} from "@automovie/interface";

/**
 * A segment's length moves its far joint along it; every joint past it follows
 * and keeps its own length.
 *
 * Scenarios:
 *
 * 1. A made chain a > b > c > d (b 100 mm below a, c 50 mm below b and 10 mm to
 *    +Z, turned 90 degrees about Z, d 30 mm along c's -Y): the a-b run scaled
 *    by 1.2 puts b at [0, -120, 0], c at [0, -170, 10] and d at [30, -170, 10]:
 *    the scaled run scales, the next runs translate by 20 mm.
 * 2. The twin by the declared reflection z -> -z
 *    (`AutoMovieHumanSegmentFrame.mirror`) puts the scaled c at [0, -170,
 *    -10].
 * 3. A ratio of one returns the given chain itself; the along/across spread at
 *    ones returns its input.
 * 4. The spread of [2, 3, 4] along X by 1.5 and along Z by 0.5 is [3, 3, 2]; the
 *    reflected axes spread the reflected vector to the reflected result.
 * 5. The chain rejects a zero ratio or absent joint and the spread rejects
 *    nonorthogonal axes.
 * 6. A separate branch attached to the root stays at [40, 20, -5].
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production chain edit and spread and uses the production frame composer.
 * @evidence contracts/development/testing.md#independent-expectations Every expected origin follows from the made offsets, the quarter-turn and the supplied ratio.
 * @evidence contracts/development/testing.md#distinguishing-cases A scaled run, its downstream centres and a separate unchanged branch, the reflection, both identities and three refused inputs.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous unit on a made joint chain.
 * @evidence contracts/development/common.md#meaningful-documentation Numbered scenarios state each made input and expected point.
 */
export function test_human_segment_scaling(): void {
  const failures: string[] = [];
  const at = (
    what: string,
    got: AutoMovieVector3Tuple,
    want: AutoMovieVector3Tuple,
    tolerance: number = 1e-12,
  ): void => {
    if (
      !(
        Math.hypot(got[0] - want[0], got[1] - want[1], got[2] - want[2]) <=
        tolerance
      )
    )
      failures.push(
        `${what}: [${got.join(", ")}] instead of [${want.join(", ")}]`,
      );
  };
  const chain: IAutoMovieHumanSegmentJoint[] = [
    { name: "a", parent: null, offset: [0, 0, 0], rotation: F.IDENTITY },
    { name: "b", parent: "a", offset: [0, -100, 0], rotation: F.IDENTITY },
    {
      name: "c",
      parent: "b",
      offset: [0, -50, 10],
      rotation: F.about(2, Math.PI / 2),
    },
    { name: "d", parent: "c", offset: [0, -30, 0], rotation: F.IDENTITY },
    { name: "other", parent: "a", offset: [40, 20, -5], rotation: F.IDENTITY },
  ];
  const none = (): undefined => undefined;

  // 1 and 2.
  const scaled: readonly IAutoMovieHumanSegmentJoint[] = Scaling.chain(
    chain,
    new Map([["b", 1.2]]),
  );
  const frames: Map<string, IAutoMovieHumanSegmentFrame> = F.world(
    scaled,
    none,
  );
  at("b", frames.get("b")!.origin, [0, -120, 0]);
  at("c", frames.get("c")!.origin, [0, -170, 10]);
  at("d", frames.get("d")!.origin, [30, -170, 10]);
  at("twin c", F.mirror(frames.get("c")!).origin, [0, -170, -10]);
  at("separate branch", frames.get("other")!.origin, [40, 20, -5]);

  // 3. Identities.
  if (Scaling.chain(chain, new Map([["b", 1]])) !== chain)
    failures.push("a ratio of one did not return the given chain");
  const p: AutoMovieVector3Tuple = [2, 3, 4];
  if (Scaling.spread([1, 0, 0], [0, 0, 1], 1, 1)(p) !== p)
    failures.push("a spread at ones did not return its input");

  // 4. The spread and its reflection.
  at("spread", Scaling.spread([1, 0, 0], [0, 0, 1], 1.5, 0.5)(p), [3, 3, 2]);
  const D = (v: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [
    v[0],
    v[1],
    -v[2],
  ];
  const [a, b]: AutoMovieVector3Tuple[] = [
    [0.6, 0, 0.8],
    [-0.8, 0, 0.6],
  ];
  at(
    "reflected spread",
    Scaling.spread(D(a!), D(b!), 1.3, 0.7)(D([1, 2, 3])),
    D(Scaling.spread(a!, b!, 1.3, 0.7)([1, 2, 3])),
  );

  // 5. Defects.
  const refuses = (what: string, call: () => unknown): void => {
    try {
      call();
      failures.push(what + " was accepted");
    } catch {
      // refused as required
    }
  };
  refuses("a zero ratio", (): unknown =>
    Scaling.chain(chain, new Map([["b", 0]])),
  );
  refuses("an absent joint", (): unknown =>
    Scaling.chain(chain, new Map([["e", 1.1]])),
  );
  refuses("axes not square", (): unknown =>
    Scaling.spread([1, 0, 0], [0.6, 0.8, 0], 1, 1),
  );

  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
