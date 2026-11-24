import {
  AutoMovieHumanSegmentFrame as F,
  AutoMovieHumanSkinDatum as Skin,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieHumanSegmentJoint,
} from "@automovie/interface";

/**
 * A skin datum moves with its wall at its own station; a bone datum moves only
 * with the chain; a rigid child hangs on its skin datum.
 *
 * Scenarios:
 *
 * 1. A made wall along +Y with chart u = X, v = Z and ratio [1.2, 0.8] below
 *    station 50 and one above: [10, 20, 5] goes to [12, 20, 4]; [10, 60, 5],
 *    whose own station's ratio is one, is returned itself.
 * 2. The reflected wall (v = -Z) maps the reflected point to the reflected result,
 *    [12, 20, -4].
 * 3. An ear 70 mm along +Z from a head at [0, 100, 0] follows the head wall's 0.8
 *    lateral ratio to [0, 100, 56]. Its child keeps its own offset and follows
 *    to [1, 102, 59]. Re-attaching at the ear's original origin returns the
 *    same chain.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production skin map and re-attachment and composes the changed chain.
 * @evidence contracts/development/testing.md#independent-expectations Each expected point is the closed form of the made wall's affine map or the made chain.
 * @evidence contracts/development/testing.md#distinguishing-cases Scaled and unit stations, both reflections, a moved and an unmoved attachment.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous unit on made walls and a joint chain.
 * @evidence contracts/development/common.md#meaningful-documentation Numbered scenarios state each made input and expected point.
 */
export function test_human_skin_datum(): void {
  const failures: string[] = [];
  const at = (
    what: string,
    got: AutoMovieVector3Tuple,
    want: AutoMovieVector3Tuple,
  ): void => {
    if (
      !(
        Math.hypot(got[0] - want[0], got[1] - want[1], got[2] - want[2]) <=
        1e-12
      )
    )
      failures.push(
        `${what}: [${got.join(", ")}] instead of [${want.join(", ")}]`,
      );
  };
  const wall = (side: 1 | -1): Skin.IWall => ({
    at: (s: number): Skin.IFrame => ({
      origin: [0, s, 0],
      u: [1, 0, 0],
      v: [0, 0, side],
    }),
    station: (p: AutoMovieVector3Tuple): number => p[1],
    ratio: (s: number): readonly [number, number] =>
      s < 50 ? [1.2, 0.8] : [1, 1],
  });

  // 1 and 2.
  at("scaled skin datum", Skin.skin([10, 20, 5], wall(1)), [12, 20, 4]);
  const high: AutoMovieVector3Tuple = [10, 60, 5];
  if (Skin.skin(high, wall(1)) !== high)
    failures.push("a datum at a unit ratio moved");
  at("reflected skin datum", Skin.skin([10, 20, -5], wall(-1)), [12, 20, -4]);

  // 3. Re-attachment.
  const chain: IAutoMovieHumanSegmentJoint[] = [
    { name: "head", parent: null, offset: [0, 100, 0], rotation: F.IDENTITY },
    { name: "ear", parent: "head", offset: [0, 0, 70], rotation: F.IDENTITY },
    { name: "helix", parent: "ear", offset: [1, 2, 3], rotation: F.IDENTITY },
  ];
  const none = (): undefined => undefined;
  const frames: Map<string, IAutoMovieHumanSegmentFrame> = F.world(chain, none);
  const headWall: Skin.IWall = {
    at: (s: number): Skin.IFrame => ({
      origin: [0, s + 100, 0],
      u: [1, 0, 0],
      v: [0, 0, 1],
    }),
    station: (p: AutoMovieVector3Tuple): number => p[1] - 100,
    ratio: wall(1).ratio,
  };
  const datum: AutoMovieVector3Tuple = Skin.skin(
    frames.get("ear")!.origin,
    headWall,
  );
  const moved: readonly IAutoMovieHumanSegmentJoint[] = Skin.attach(
    chain,
    frames,
    "ear",
    datum,
  );
  if (moved[0] !== chain[0])
    failures.push("reattaching the ear replaced the head");
  at("ear offset", moved[1]!.offset, [0, 0, 56]);
  at("helix follows", F.world(moved, none).get("helix")!.origin, [1, 102, 59]);
  if (Skin.attach(chain, frames, "ear", frames.get("ear")!.origin) !== chain)
    failures.push("re-attaching at its own origin changed the chain");

  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
