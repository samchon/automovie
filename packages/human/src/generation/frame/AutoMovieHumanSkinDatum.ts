import { AutoMovieHumanSegmentFrame as F } from "./AutoMovieHumanSegmentFrame";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieHumanSegmentJoint,
  IAutoMovieHumanSkinDatum,
} from "@automovie/interface";

/**
 * The one rule for a datum that stands on a wall, and for the rigid child that hangs on it.
 *
 * A bone datum (a joint centre) is a point of its segment's frame and moves only with the chain. A skin datum (tragion, the point under
 * the breast's side where its band fans) stands on a wall at its own station: its offset from the wall's course point in that station's
 * section plane is scaled by the wall's directional tissue ratio there, `[a, b]` along the section's `u` and `v`, so it stays on the
 * scaled wall; its offset along the course is kept. A rigid child whose origin is a skin datum (the ear, whose origin is tragion) is
 * re-attached at the moved datum by rewriting its offset in its parent's frame, so the child's frame, every datum and course stored in it,
 * and its cutters follow the skin through the chain composer: skeleton and skin share one definition.
 */
export namespace AutoMovieHumanSkinDatum {
  /** A section frame of a wall's course: origin and the section plane's unit `u` and `v`, figure frame. */
  export type IFrame = IAutoMovieHumanSkinDatum.IFrame;

  /** A wall: its course frame by station, a point's station on it, and its directional tissue ratio by station. */
  export type IWall = IAutoMovieHumanSkinDatum.IWall;

  /**
   * A skin datum on a scaled wall: its in-plane offset from the course point at its own station scaled by the ratio there. A ratio of
   * exactly one returns the point itself.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The wall's section is an affine map about its course point by `[a, b]` along `u` and `v`; a point of the section's plane moves with that map, its along-course offset kept.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One station, one frame, one ratio, one affine map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the ratio at the datum's own station, never a neighbouring datum's; nonpositive or nonfinite ratios are refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure map coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one point.
   */
  export function skin(point: AutoMovieVector3Tuple, wall: IWall): AutoMovieVector3Tuple {
    const station: number = wall.station(point);
    const [a, b]: readonly [number, number] = wall.ratio(station);
    if (![a, b].every((k: number): boolean => Number.isFinite(k) && k > 0))
      throw new Error("skin datum ratios must be finite and positive");
    if (a === 1 && b === 1) return point;
    const frame: IFrame = wall.at(station);
    const q: AutoMovieVector3Tuple = F.sub(point, [frame.origin[0]!, frame.origin[1]!, frame.origin[2]!]);
    const u: AutoMovieVector3Tuple = [frame.u[0]!, frame.u[1]!, frame.u[2]!];
    const v: AutoMovieVector3Tuple = [frame.v[0]!, frame.v[1]!, frame.v[2]!];
    return F.add(point, F.add(F.scale(u, (a - 1) * F.dot(q, u)), F.scale(v, (b - 1) * F.dot(q, v))));
  }

  /**
   * The chain with the rigid child `joint` re-attached so its origin is `origin`, a point of the figure's frame: its offset becomes the
   * point in its parent's frame at `frames`; its rotation is kept. An origin equal to the child's own returns the given chain.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A rigid child's offset is `A_parent^T (o - o_parent)`, the chain's own definition (`AutoMovieHumanSegmentFrame.relative`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record replaced.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An absent joint, a root joint or a missing parent frame is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the chain's length.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every other record is borrowed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A changed result owns one array and one record.
   */
  export function attach(chain: readonly IAutoMovieHumanSegmentJoint[], frames: ReadonlyMap<string, IAutoMovieHumanSegmentFrame>, joint: string, origin: AutoMovieVector3Tuple): readonly IAutoMovieHumanSegmentJoint[] {
    const index: number = chain.findIndex((entry: IAutoMovieHumanSegmentJoint): boolean => entry.name === joint);
    const record: IAutoMovieHumanSegmentJoint | undefined = chain[index];
    if (record === undefined || record.parent === null) throw new Error("skin datum attaches only a present child joint: " + joint);
    const parent: IAutoMovieHumanSegmentFrame | undefined = frames.get(record.parent);
    const own: IAutoMovieHumanSegmentFrame | undefined = frames.get(joint);
    if (parent === undefined || own === undefined) throw new Error("skin datum needs the frames of " + joint + " and its parent");
    if (own.origin.every((x: number, k: number): boolean => Object.is(x, origin[k]))) return chain;
    return chain.map((entry: IAutoMovieHumanSegmentJoint, k: number): IAutoMovieHumanSegmentJoint => (k === index ? { ...entry, offset: F.toLocal(parent, origin) } : entry));
  }
}
