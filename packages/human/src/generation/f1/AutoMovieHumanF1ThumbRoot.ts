import { AutoMovieHumanLandmarkSurface } from "../conic/AutoMovieHumanLandmarkSurface";
import type { IAutoMovieHumanSegmentFrame } from "@automovie/interface";

/**
 * The surface at the thumb's root, which divides the hand's skin from the thumb's.
 *
 * The thumb articulates on the hand at its carpometacarpal joint, and its metacarpal lies inside the thenar; the visible thumb leaves
 * the hand at its metacarpophalangeal joint, where the first web's floor stands. Proximal of that joint f1's sections square to the
 * thumb's course are no tube (the web's sheet runs along them), so the thumb is a part on the hand's side and its root is a landmark
 * surface about the metacarpophalangeal centre, as the armscye's is about the shoulder's
 * (`docs/techniques/joints-one-shot.md`, The thumb on the hand's side). The thenar is the hand's.
 *
 * The landmarks ride the thumb's metacarpal, so the surface follows opposition; the loop of the thumb on the hand is not stored: it is
 * generated at the pose from the posed thumb, the posed hand and this surface (`AutoMovieHumanJoinLoop`).
 */
export namespace AutoMovieHumanF1ThumbRoot {
  /**
   * The root's four landmarks on f1's skin, mm in the thumb metacarpal's frame: the skin's first point from the metacarpophalangeal
   * centre straight away from the index finger's knuckle (radial) and to either side of that line, in the plane through the centre
   * square to the thumb's proximal phalanx; and the first web's floor, the skin's crossing nearest the midpoint of the thumb's and
   * the index finger's knuckle centres on the line through it along the bisector of their proximal phalanges. They are read by rule
   * from f1's joint centres and skin (`test/src/reference-conics/FamilyConicThumbRoot.ts`, `FamilyConicJoints.ts --thumb-landmarks`),
   * 9.84, 13.47 and 8.51 mm from the centre and 2.78 mm from the midpoint. Stored in the metacarpal's frame they ride it.
   *
   * F1-FITTED: the rule that reads them runs on f1's skin, and no published proportion places the thumb's root skin from a person's
   * hand measures (ISO 7250-1 hand breadth and thumb length place the joints, not the skin round them). The figure no longer divides
   * by them: the divider is the plane of `divider` (a flattened rule), and these points are its plausibility check.
   */
  export const LANDMARKS_MM: readonly (readonly [number, number, number])[] = [
    [-4.67, -45.07, 8.49],
    [10.93, -39.4, 6.79],
    [-6.9, -45.92, -4.29],
    [9.84, -40.74, -17.66],
  ];

  /**
   * The surface: through the four landmarks, about the thumb's metacarpophalangeal centre, its far side toward the thumb's next joint.
   *
   * @param metacarpal The thumb metacarpal's frame at the person and the pose.
   * @param knuckle The metacarpophalangeal centre, mm in the figure's frame.
   * @param next The interphalangeal centre, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each landmark is carried from the metacarpal's frame to the figure's by the frame's origin and axes, and the surface is built about the knuckle as the fit's is.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame map and one construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No landmark is read from a mesh or moved by a tolerance; the surface's own refusals pass through.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four points and one surface preparation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned surface serves every read of the loop.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the surface's own closure only.
   * @evidence contracts/development/common.md#meaningful-documentation States frames and units.
   */
  export function surface(metacarpal: IAutoMovieHumanSegmentFrame, knuckle: readonly number[], next: readonly number[]): AutoMovieHumanLandmarkSurface.ISurface {
    return AutoMovieHumanLandmarkSurface.create(
      knuckle, LANDMARKS_MM.map((local): [number, number, number] => world(metacarpal, local)), next,
    );
  }

  /**
   * Where the thumb's root stretch starts on its metacarpal, a share of the metacarpal's length from the carpometacarpal joint: half
   * (ESTIMATE, a flattened rule: rule-basis.md, "Flattened rules"). The hand's wall carries the thenar up to this plane.
   */
  export const ROOT_SHARE: number = 0.5;

  /**
   * The thumb root's divider: the plane square to the first metacarpal at `ROOT_SHARE` of its length from the carpometacarpal joint
   * (the metacarpal frame's origin) toward the metacarpophalangeal centre, its far side toward that centre. It replaces the surface
   * through the traced landmarks (`surface`), which stay its plausibility check.
   *
   * @param metacarpal The thumb metacarpal's frame at the person and the pose; its origin is the carpometacarpal centre.
   * @param knuckle The metacarpophalangeal centre, mm in the figure's frame.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A plane fixed in the metacarpal's own frame by the person's joint centres.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One point, one normal, one gauge.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The plane's own refusals pass through.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned divider serves every read of the loop.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the plane's closure only.
   * @evidence contracts/development/common.md#meaningful-documentation States frames and units.
   */
  export function divider(metacarpal: IAutoMovieHumanSegmentFrame, knuckle: readonly number[]): AutoMovieHumanLandmarkSurface.ISurface {
    const o = metacarpal.origin;
    const bone: [number, number, number] = [knuckle[0]! - o[0]!, knuckle[1]! - o[1]!, knuckle[2]! - o[2]!];
    const length: number = Math.hypot(...bone);
    const along = (axis: readonly number[]): number => Math.abs(axis[0]! * bone[0] + axis[1]! * bone[1] + axis[2]! * bone[2]) / length;
    const gauge: readonly number[] = [...metacarpal.axes].sort((a, b): number => along(a) - along(b))[0]!;
    return AutoMovieHumanLandmarkSurface.plane(
      [o[0]! + ROOT_SHARE * bone[0], o[1]! + ROOT_SHARE * bone[1], o[2]! + ROOT_SHARE * bone[2]], bone, gauge);
  }

  /**
   * Four search seeds on the divider, mm: at its phases 0, a quarter, a half and three quarters, at `reach` from its centre (the
   * thumb's mean reach there), where the master's search lines start.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Points of the divider itself, so the master's premise that its seeds lie on the divider holds exactly.
   * @evidence contracts/development/common.md#meaningful-documentation States the phases and the radius.
   */
  export function seeds(plane: AutoMovieHumanLandmarkSurface.ISurface, reach: number): [number, number, number][] {
    return [0, 1, 2, 3].map((k: number): [number, number, number] => {
      const p = plane.jet(reach, (Math.PI * k) / 2).p;
      return [p[0], p[1], p[2]];
    });
  }

  /**
   * The observed first-web floor in the placed hand, mm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The locator is the same authored web landmark the divider reads, carried by the same metacarpal frame.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same existing frame transform for the physical contact seed and the divider.
   */
  export function webFloor(metacarpal: IAutoMovieHumanSegmentFrame): [number, number, number] {
    return world(metacarpal, LANDMARKS_MM[3]!);
  }

  /**
   * The radial and two side landmarks carried into the placed thumb, mm.
   * They can initialize a wall address. The separate web floor stays in the divider's perimeter.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the three already observed knuckle-section landmarks using the same metacarpal transform as the divider.
   * @evidence contracts/development/common.md#meaningful-documentation Returns world millimetres in the observed radial and side order, without asserting that any source passes through them.
   */
  export function knuckleSeeds(metacarpal: IAutoMovieHumanSegmentFrame): [number, number, number][] {
    return LANDMARKS_MM.slice(0, 3).map((point): [number, number, number] => world(metacarpal, point));
  }

  /** Map an originally observed point into the placed metacarpal frame. */
  function world(metacarpal: IAutoMovieHumanSegmentFrame, local: readonly number[]): [number, number, number] {
    const at = (k: number): number =>
      metacarpal.origin[k]! + local[0]! * metacarpal.axes[0][k]! +
      local[1]! * metacarpal.axes[1][k]! + local[2]! * metacarpal.axes[2][k]!;
    return [at(0), at(1), at(2)];
  }
}
