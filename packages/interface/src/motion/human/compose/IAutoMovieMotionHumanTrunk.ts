import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionClock } from "./IAutoMovieMotionClock";

/**
 * Trunk phrases: the trunk turned on the pelvis, the body sunk into its
 * knees, and the hips moved back under a limb held out.
 *
 * The hip shifts are solved by {@link HumanBalance.shift} on the body at the
 * phrase's fullest pose and scaled between by the clock's envelope, so no
 * shift is stated as a constant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation depth: How far the hips sink at the lowest, metres; not negative. pitch: The trunk's forward inclination at the lowest, degrees, shared between the pelvis and the spine by `sunk`; not negative. legs: The legs the crouch plants where `standing` puts their feet; both when absent. A leg left out is the caller's to place.
 * @evidence contracts/development/design.md#principled-representation depth: How far the hips sink at the lowest, metres; not negative. pitch: The trunk's forward inclination at the lowest, degrees, shared between the pelvis and the spine by `sunk`; not negative. legs: The legs the crouch plants where `standing` puts their feet; both when absent. A leg left out is the caller's to place.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanTrunk.ts (AutoMovieMotionHumanTrunk.crouch, props); everyday/HumanTrunk.ts (HumanTrunk.incline, return); everyday/HumanTrunk.ts (HumanTrunk.region, return); everyday/HumanTrunk.ts (HumanTrunk.surface, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionClock, AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanTrunk {
  /**
   * A crouch over two windows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member gives its meaning, unit and range.
   * @evidence contracts/development/design.md#principled-representation A crouch is how far the hips sink and how far the trunk pitches, between a sinking and a rising window; the knees are not stated because the planted feet decide them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven required members and the legs the crouch plants, read only by `crouch`; the legs exist because one caller (the batting stance) steps one foot out itself while the body sinks.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hip shift: the shift is solved, so a caller cannot state one that unbalances the body; the feet are read off the standing posture, so a caller cannot plant them somewhere the body does not stand.
   */
  export interface ICrouch {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** A standing posture of the action, the one the balance is solved on. */
    standing: IAutoMovieMotionHumanPosture;

    /** The action's clock. */
    clock: IAutoMovieMotionClock;

    /** The instants the body starts sinking and is lowest at. */
    rise: readonly [string, string];

    /** The instants the body starts rising and stands again at. */
    fall: readonly [string, string];

    /** How far the hips sink at the lowest, metres; not negative. */
    depth: number;

    /** The trunk's forward inclination at the lowest, degrees, shared between the pelvis and the spine by `sunk`; not negative. */
    pitch: number;

    /** The legs the crouch plants where `standing` puts their feet; both when absent. A leg left out is the caller's to place. */
    legs?: readonly AutoMovieHumanSide[];
  }

  /**
   * A trunk inclined forward by an angle shared by the lumbopelvic rhythm: the pelvis pitch it takes and the spine and chest flexion added to the given joints. A backward inclination is the pelvis alone, since leaning back is a pelvic tilt. Result returned by HumanTrunk.incline. The pelvis pitch, degrees, and the joints with the flexion added.
   *
   * @evidence contracts/development/common.md#meaningful-documentation pitch is remaining root inclination in degrees; joints contains clinical-degree rotations after distributing trunk flexion.
   * @evidence contracts/development/design.md#principled-representation Separates the pelvis rotation from the flexion carried by spine and chest joints.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by HumanTrunk.incline and read when constructing inclined postures.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical posture joint map and keeps backward inclination on the pelvis alone.
   */
  export type IInclineResult = {
    /** Root pitch in degrees remaining after distributing the inclination among trunk joints. */
    pitch: number;
    /** Clinical-degree joint rotations distributing the trunk inclination. */
    joints: IAutoMovieMotionHumanPosture["joints"];
  };

  /**
   * A trunk or head region's world point and outward unit normal on a posture, returned by HumanTrunk.region.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point is in world metres; normal is an outward unit direction in the same frame.
   * @evidence contracts/development/design.md#principled-representation A surface location and orientation let hand rests use the posed region's geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanTrunk.region produces the point and normal together from the selected region.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both members reuse the canonical vector representation while their comments distinguish position from direction.
   */
  export type IRegionResult = {
    /** Selected trunk surface point in world metres. */
    point: IAutoMovieVector3;
    /** Outward trunk surface unit normal in world coordinates. */
    normal: IAutoMovieVector3;
  };

  /**
   * Where a ray meets the trunk or head colliders of a posture, returned by HumanTrunk.surface. Only the pelvis, spine, chest, neck and head are tested, so an already placed limb does not hide the trunk surface used by a hand rest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point is the ray hit in world metres; normal is the outward unit direction there.
   * @evidence contracts/development/design.md#principled-representation Keeps the actual collider intersection and its normal together for a surface-aligned hand rest.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanTrunk.surface returns the pair read by trunk-contact placement.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts HumanColliders.cast supplies the intersection on the midline colliders, without using a hand's existing placement as a surface.
   */
  export type ISurfaceResult = {
    /** Selected trunk surface point in world metres. */
    point: IAutoMovieVector3;
    /** Outward trunk surface unit normal in world coordinates. */
    normal: IAutoMovieVector3;
  };
}
