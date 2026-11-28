import {
  AutoMovieHumanF1Datums as Datums,
  AutoMovieHumanF1Placement as P,
  AutoMovieHumanF1Placing as T,
  AutoMovieHumanSegmentFrame as F,
  AutoMovieHumanSkinDatum as Skin,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieHumanSegmentJoint,
} from "@automovie/interface";

/**
 * A skin datum moves with its wall at its own station; a bone datum moves only with the chain; a rigid child hangs on its skin datum.
 *
 * Scenarios:
 * 1. A made wall along +Y with chart u = X, v = Z and ratio [1.2, 0.8] below station 50 and one above: [10, 20, 5] goes to [12, 20, 4];
 *    [10, 60, 5], whose own station's ratio is one, is returned itself.
 * 2. The reflected wall (v = -Z) maps the reflected point to the reflected result, [12, 20, -4].
 * 3. Re-attaching a made ear (offset [0, 0, 70] under a head at [0, 100, 0]) at [0, 100, 56] gives it offset [0, 0, 56] and carries its
 *    child, offset [1, 2, 3], to [1, 102, 59]; re-attaching at its own origin returns the given chain.
 * 4. f1's leg course origin is the femur's origin, and the ear's attachment at a ratio of one returns f1's stored chain.
 * 5. A declared skin datum (`breastFan`) at [10, 20, 5] goes to [12, 20, 4] on the made wall, and a bone datum (`calf`, the knee centre)
 *    given the same point and wall is returned itself.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production skin map, re-attachment and f1 datum declarations and composes frames with the production composer.
 * @evidence contracts/development/testing.md#independent-expectations Each expected point is the closed form of the made wall's affine map or the made chain.
 * @evidence contracts/development/common.md#meaningful-documentation The affine wall and reflected wall displace skin datums with their material. Bone datums, reattached descendants and the stored reference origin have separate checks.
 */
export function test_human_skin_datum(): void {
  const failures: string[] = [];
  const at = (what: string, got: AutoMovieVector3Tuple, want: AutoMovieVector3Tuple): void => {
    if (!(Math.hypot(got[0] - want[0], got[1] - want[1], got[2] - want[2]) <= 1e-12)) failures.push(`${what}: [${got.join(", ")}] instead of [${want.join(", ")}]`);
  };
  const wall = (side: 1 | -1): Skin.IWall => ({
    at: (s: number): Skin.IFrame => ({ origin: [0, s, 0], u: [1, 0, 0], v: [0, 0, side] }),
    station: (p: AutoMovieVector3Tuple): number => p[1],
    ratio: (s: number): readonly [number, number] => (s < 50 ? [1.2, 0.8] : [1, 1]),
  });

  // 1 and 2.
  at("scaled skin datum", Skin.skin([10, 20, 5], wall(1)), [12, 20, 4]);
  const high: AutoMovieVector3Tuple = [10, 60, 5];
  if (Skin.skin(high, wall(1)) !== high) failures.push("a datum at a unit ratio moved");
  at("reflected skin datum", Skin.skin([10, 20, -5], wall(-1)), [12, 20, -4]);

  // 3. Re-attachment.
  const chain: IAutoMovieHumanSegmentJoint[] = [
    { name: "head", parent: null, offset: [0, 100, 0], rotation: F.IDENTITY },
    { name: "ear", parent: "head", offset: [0, 0, 70], rotation: F.IDENTITY },
    { name: "helix", parent: "ear", offset: [1, 2, 3], rotation: F.IDENTITY },
  ];
  const none = (): undefined => undefined;
  const frames: Map<string, IAutoMovieHumanSegmentFrame> = F.world(chain, none);
  const moved: readonly IAutoMovieHumanSegmentJoint[] = Skin.attach(chain, frames, "ear", [0, 100, 56]);
  at("ear offset", moved[1]!.offset, [0, 0, 56]);
  at("helix follows", F.world(moved, none).get("helix")!.origin, [1, 102, 59]);
  if (Skin.attach(chain, frames, "ear", frames.get("ear")!.origin) !== chain) failures.push("re-attaching at its own origin changed the chain");

  // 4. f1.
  if (Datums.legOrigin(P.REFERENCE) !== P.REFERENCE.get("femur")!.origin) failures.push("f1's leg origin is not the femur's origin");
  const unit: Skin.IWall = { at: (s: number): Skin.IFrame => ({ origin: [0, s, 0], u: [1, 0, 0], v: [0, 0, 1] }), station: (p: AutoMovieVector3Tuple): number => p[1], ratio: (): readonly [number, number] => [1, 1] };
  if (Datums.ear(T.CHAIN, P.REFERENCE, unit) !== T.CHAIN) failures.push("the ear's attachment at a unit ratio changed f1's chain");

  // 5. Declared skin datums move with the wall; a bone datum keeps its place whatever the wall does.
  at("declared skin datum", Datums.point("breastFan", [10, 20, 5], wall(1)), [12, 20, 4]);
  const centre: AutoMovieVector3Tuple = [10, 20, 5];
  if (Datums.point("calf", centre, wall(1)) !== centre) failures.push("a bone datum moved with the wall's tissue ratio");
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
