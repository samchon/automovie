import { type IAutoMovieFormationSlotMotion, type IAutoMovieFormationDesign, type IAutoMovieFormationStageMarkSet, type IAutoMovieTransform, type IAutoMovieVector3, type IAutoMovieFormationMotionState, type IAutoMovieFormationCadenceSegment, type IAutoMovieFormationMotion, type IAutoMovieFormationGroundRelief, type IAutoMovieGroundQueryPoint, type IAutoMovieFormationSlot, type IAutoMovieFormationGrounding, type IAutoMovieFormationPlacement, type IAutoMovieFormationReform, type IAutoMovieFormationSlotRecord, type IAutoMovieFormationSlotPlacement, type IAutoMoviePlaceFormationSlot, type IAutoMovieFormationBounds, type IAutoMovieFormationSlotState, type IAutoMovieFormationLodInput, type IAutoMovieFormationLodSelection, type IAutoMovieSampledFormationMotion } from "@automovie/interface";
import { compileFormationStageMarks as compileFormationStageMarksImplementation } from "./formation/internal/compileFormationStageMarks";
import { composeFormationHeroTransform as composeFormationHeroTransformImplementation } from "./formation/internal/composeFormationHeroTransform";
import { formationCadenceSegments as formationCadenceSegmentsImplementation } from "./formation/internal/formationCadenceSegments";
import { formationGroundRelief as formationGroundReliefImplementation } from "./formation/internal/formationGroundRelief";
import { formationSlot as formationSlotImplementation } from "./formation/internal/formationSlot";
import { formationSlotPosition as formationSlotPositionImplementation } from "./formation/internal/formationSlotPosition";
import { formationSlotRecord as formationSlotRecordImplementation } from "./formation/internal/formationSlotRecord";
import { placeFormationSlot as placeFormationSlotImplementation } from "./formation/internal/placeFormationSlot";
import { rotateFormationLocalOffset as rotateFormationLocalOffsetImplementation } from "./formation/internal/rotateFormationLocalOffset";
import { transformFormationBounds as transformFormationBoundsImplementation } from "./formation/internal/transformFormationBounds";
import { transformFormationPoint as transformFormationPointImplementation } from "./formation/internal/transformFormationPoint";
import { sampleFormationMotion as sampleFormationMotionImplementation } from "./formation/internal/sampleFormationMotion";
import { sampleFormationSlotMotion as sampleFormationSlotMotionImplementation } from "./formation/internal/sampleFormationSlotMotion";
import { selectFormationLod as selectFormationLodImplementation } from "./formation/internal/selectFormationLod";

/** Public operations for Auto Movie Engine Population Formation. */
export namespace AutoMovieEnginePopulationFormation {
  /**
   * Turn a level-stage mark sheet into ordinary sparse member-motion cues.
   *
   * Supply the fixed design with its admitted layout. Sets must be in
   * chronological order with no overlap. Marks use the design's local axes and
   * absolute coordinates from its anchor, including when the unit has a nonzero
   * heading or consists of blocks. The compiler returns ordinary slot cues for
   * the shot's `formationSlotMotions`; shot admission still owns duration, cue
   * limits, numeric bounds and coexistence with other source tracks. Use a fixed
   * unit layout and spacing for the named marks to describe exact destinations.
   * This compiles root placement. Existing gait and shot clearance checks retain
   * ownership of foot motion and clearance.
   *
   * @param design The admitted formation design that owns the named slots.
   * @param sets Chronological assignments in shot-local seconds.
   * @returns Fresh member cue records in set and mark order.
   * @throws {RangeError} If the sets have conflicting intervals or IDs, a set
   *   is empty, a slot is repeated, promoted, or outside the safe integer
   *   range `[0, design.count)`, or a mark needs a non-finite offset or turn.
   */
  export function compileFormationStageMarks(design: IAutoMovieFormationDesign, sets: readonly IAutoMovieFormationStageMarkSet[]): IAutoMovieFormationSlotMotion[] {
    return compileFormationStageMarksImplementation(design, sets);
  }

  /**
   * Compose a promoted hero's source-authored node transform with formation
   * placement and motion.
   *
   * Translation keeps authored node/object-motion displacement relative to the
   * builder-owned hero slot. Rotation applies the current formation facing before
   * the authored rotation relative to that slot, while scale remains
   * source-owned.
   *
   * Exactly: translation is the slot position carried through the sampled
   * formation state by {@link transformFormationPoint}, plus `source.translation -
   * base.translation`, and rotation is a yaw of `baseFacingDeg +
   * motion.facingOffsetDeg` degrees about +Y applied after
   * `inverse(base.rotation) * source.rotation`. The authored displacement is
   * added in world axes, so it is neither turned by the formation's facing nor
   * scaled by its spacing. Units are metres and degrees. Geometry measurement and
   * the viewer's instanced formation both place heroes through here.
   *
   * @param base Builder-owned hero slot transform in the designed formation.
   * @param source Authored node transform at the sampled time.
   * @param anchor Formation anchor the slot is laid out around.
   * @param motion Sampled formation state: translation, facing offset and spacing
   *   scale.
   * @param baseFacingDeg Designed formation heading in degrees, default 0.
   * @returns A new world transform for the promoted hero.
   */
  export function composeFormationHeroTransform(base: IAutoMovieTransform, source: IAutoMovieTransform, anchor: IAutoMovieVector3, motion: IAutoMovieFormationMotionState, baseFacingDeg?: number): IAutoMovieTransform {
    return composeFormationHeroTransformImplementation(base, source, anchor, motion, baseFacingDeg);
  }

  /**
   * Cut one unit's cue sequence over `[0, time]` into the intervals its cadence
   * is made of.
   *
   * Each cue interpolates its unit from `from` to `to`, so the ground covered
   * inside a cue is its straight-line x-z displacement scaled by the same eased
   * progress `sampleFormationMotion` places the unit by: the two read one law,
   * and a member's feet cannot disagree with where its unit stands. Every easing
   * a formation cue allows is monotone, so an interval never covers negative
   * ground.
   *
   * A gap between cues covers nothing. The state a unit holds between two cues is
   * the earlier cue's exact `to`, and a jump from that state to the next cue's
   * `from` is a discontinuity the sampler already permits rather than travel a
   * member could walk, so it contributes seconds and no distance. The gait is
   * retained across it, because a unit that has stopped is still doing whatever
   * its last cue had it doing.
   *
   * Turning is reported apart from travel because the two reach a member
   * differently: every member of a unit covers the unit's translation, while the
   * ground a turn carries a member over is that member's own distance from the
   * pivot. A consumer that knows a member's radius composes them; one that does
   * not still gets the unit's travel exactly.
   *
   * Cues are ordered by start alone. The builder refuses overlapping or
   * zero-length cues inside one unit, so no two starts tie in valid input; in
   * malformed input the input's own order is kept. A negative `time` yields no
   * segments.
   */
  export function formationCadenceSegments(motions: readonly IAutoMovieFormationMotion[], formation: string, time: number): IAutoMovieFormationCadenceSegment[] {
    return formationCadenceSegmentsImplementation(motions, formation, time);
  }

  /**
   * How far the terrain under one point rises above the terrain under the anchor,
   * in metres.
   *
   * Relief rather than absolute ground, so `anchor.y` keeps meaning what it
   * always meant: the height the unit was staged at. A unit standing on its
   * ground has an anchor on that ground, and every member then lands on the
   * ground under itself; a unit deliberately staged a metre above its terrain
   * keeps that metre all the way up the hill instead of being snapped down at
   * placement time. Level terrain gives zero relief everywhere.
   *
   * Zero when the formation declares no terrain, when the point is over none, and
   * when the anchor itself is over none: relief is measured from the anchor's own
   * ground, and without that datum there is no rise to state. Each is a fact
   * about what was authored rather than a fallback that guesses.
   *
   * The anchor's ground height is looked up at each call, so nothing is kept
   * between calls and a record may change its `anchor` or `ground` between them.
   */
  export function formationGroundRelief(formation: IAutoMovieFormationGroundRelief.IFormation, point: IAutoMovieGroundQueryPoint): number {
    return formationGroundReliefImplementation(formation, point);
  }

  /**
   * Regenerate one exact formation slot from its design, in constant memory.
   *
   * Measurement scripts call this on loaded design records. The compiled path,
   * `compiledFormationSlot` behind the source oracle, hands the same
   * {@link formationSlotRecord} identity law and {@link formationSlotPosition}
   * placement a compiled formation, so a slot asked of a design grounded on the
   * compiled terrain snapshot equals the slot the viewer draws. Without `ground`,
   * the member stands at the anchor's height. No filesystem or project state is
   * consulted. Throws a `RangeError` for a slot outside `[0, count)`.
   */
  export function formationSlot(formation: IAutoMovieFormationDesign & IAutoMovieFormationGrounding, slot: number): IAutoMovieFormationSlot {
    return formationSlotImplementation(formation, slot);
  }

  /**
   * Where one slot of a formation stands at rest, in world space.
   *
   * The position half of `formationSlot`, taken on its own because a consumer
   * that only asks where a member is should not have to hold the hero overrides
   * and model group that name it. The compiled formation carries exactly this
   * much, so the builder, the overlap and ground gates, the geometry measurement
   * and the viewer all place a member through this one function, and a gate and a
   * renderer cannot disagree about where a unit is standing.
   *
   * The slot is laid out in the unit's own frame by its layout and dressing,
   * rotated by `facingDeg` about the anchor, and raised by
   * {@link formationGroundRelief}: the ground under the member, not the ground
   * under the group. With a `reform`, the previous completed layout's point (or
   * the designed point when fromLayout is absent) and target local point are
   * blended by its progress before heading and terrain apply, and the target
   * point takes the target layout's own dressing, so a finished re-form stands
   * exactly where a unit designed in the target layout would.
   *
   * A design laid in blocks (`blocks`) places a slot by its block's layout,
   * turned by the block's facing and moved by its offset in the unit's frame,
   * before the same heading and relief; a re-form reads the one layout and is not
   * applied to blocks.
   *
   * The slot must be a safe integer in `[0, formation.count)`. An invalid
   * index throws a `RangeError` before layout or terrain is read.
   */
  export function formationSlotPosition(formation: IAutoMovieFormationPlacement, slot: number, reform?: IAutoMovieFormationReform | null): IAutoMovieVector3 {
    return formationSlotPositionImplementation(formation, slot, reform);
  }

  /**
   * The member record one formation slot regenerates to.
   *
   * A design and a compiled formation share this identity law and differ only in
   * what they hand it: where a promoted hero is spelled, and the terrain the
   * slot's position is placed on. A hero slot is named by its actor and an
   * anonymous slot by `formation:<id>:slot:<six-digit slot>`; every member
   * carries the base model and the designed heading; and its motion phase in `[0,
   * 1)` is seeded by the formation seed and the slot under the phase domain
   * constant, whichever actor or position it is handed. The slot index is not
   * range-checked here; the caller's placement already refused it.
   */
  export function formationSlotRecord(formation: IAutoMovieFormationSlotRecord.IFormation, slot: number, member: IAutoMovieFormationSlotRecord.IMember): IAutoMovieFormationSlot {
    return formationSlotRecordImplementation(formation, slot, member);
  }

  /**
   * Compose a unit's cue and one member's own cue into that member's placement.
   *
   * One owner for the whole composition, because four consumers ask this question
   * and a private copy in any of them is how a review frame comes to disagree
   * with the gate that passed it. The unit's cue places the member exactly as it
   * always did; the member's own cue then displaces and turns it inside the
   * unit.
   */
  export function placeFormationSlot(props: IAutoMoviePlaceFormationSlot.IProps): IAutoMovieFormationSlotPlacement {
    return placeFormationSlotImplementation(props);
  }

  /**
   * Turn a unit-local displacement into the frame a unit's members are placed in.
   *
   * A member's offset is authored in its unit's own frame: `+x` is the unit's
   * left-to-right and `+z` its front-to-back, whichever way the unit happens to
   * be pointing. {@link transformFormationPoint} rotates a unit's interior by the
   * same total heading, so an offset joins a placed point only after this turns
   * it, and a member that stepped aside keeps stepping aside once its unit
   * turns.
   *
   * Taken as a heading in degrees rather than as a unit, because the two
   * consumers of this arithmetic hold different halves of it: a gate composing a
   * whole world placement passes the unit's designed heading plus the offset its
   * cue has turned it by, while a renderer whose scene graph already carries the
   * cue's rotation passes only the designed heading. Finite heading and offset
   * arithmetic are caller premises; a heading whose degree-to-radian product
   * overflows propagates nonfinite coordinates.
   */
  export function rotateFormationLocalOffset(offset: IAutoMovieVector3, headingDeg: number): IAutoMovieVector3 {
    return rotateFormationLocalOffsetImplementation(offset, headingDeg);
  }

  /** Bound all eight transformed corners of a formation's axis-aligned box. */
  export function transformFormationBounds(bounds: IAutoMovieFormationBounds, anchor: IAutoMovieVector3, motion: IAutoMovieFormationMotionState, baseFacingDeg?: number): IAutoMovieFormationBounds {
    return transformFormationBoundsImplementation(bounds, anchor, motion, baseFacingDeg);
  }

  /** Apply one sampled formation state to a designed world-space point. */
  export function transformFormationPoint(point: IAutoMovieVector3, anchor: IAutoMovieVector3, motion: IAutoMovieFormationMotionState, baseFacingDeg?: number): IAutoMovieVector3 {
    return transformFormationPointImplementation(point, anchor, motion, baseFacingDeg);
  }

  /**
   * Sample one formation's authored cue sequence at finite absolute seconds.
   * Matching cues sort by start and code-unit id; the first active cue wins.
   * Identity precedes the first cue, completed targets remain between cues and
   * reform progress survives cues without a new layout. A new layout starts at
   * the previous completed arrangement; the first starts at the design. Retained
   * translation, spacing and layout records alias authored inputs and must be
   * treated read-only.
   */
  export function sampleFormationMotion(motions: readonly IAutoMovieFormationMotion[], formation: string, time: number): IAutoMovieSampledFormationMotion {
    return sampleFormationMotionImplementation(motions, formation, time);
  }

  /**
   * Sample what one named member of a unit is doing differently at one time.
   *
   * The unit-level sampler answers for the whole crowd at once; this answers for
   * one member of it. The retention law is deliberately the same one: identity
   * before the first cue that names this slot, interpolation inside a cue, and
   * the cue's exact `to` state retained after it ends. That is what lets a member
   * removed once stay removed, and a member that fell stay down, without the
   * author restating either every second of the shot.
   *
   * `present` is not interpolated, because half-drawn is not a state a member can
   * be in. Inside a cue the member holds `from.present`; from the cue's end it
   * holds `to.present`, which the retention above already carries. So a cue whose
   * `from` is present and whose `to` is not takes its member out of the shot at
   * the cue's end, and one absent at both ends takes it out at the cue's start.
   *
   * Selection scans all supplied cues and their slot lists before sorting matches
   * by start and code-unit id. Identity and retained states alias module/input
   * records; consumers must treat returned states as read-only.
   */
  export function sampleFormationSlotMotion(motions: readonly IAutoMovieFormationSlotMotion[], formation: string, slot: number, time: number): IAutoMovieFormationSlotState {
    return sampleFormationSlotMotionImplementation(motions, formation, slot, time);
  }

  /**
   * Select automatic formation LOD from distance and projected contribution.
   *
   * Twenty-four projected pixels are neutral. A prior tier retains a 10% boundary
   * deadband so camera jitter cannot thrash instance buffers. The caller supplies
   * an ordered admitted tier list, finite distance/pixel values and an optional
   * fractional hysteresis. Returned lod aliases that list.
   */
  export function selectFormationLod(input: IAutoMovieFormationLodInput): IAutoMovieFormationLodSelection {
    return selectFormationLodImplementation(input);
  }
}
