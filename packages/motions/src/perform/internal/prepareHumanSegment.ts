import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentLegs } from "./HumanSegmentLegs";
import { HumanSegmentPose } from "./HumanSegmentPose";
import { HumanSegmentStop } from "./HumanSegmentStop";
import { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";
import { readHumanSegmentAnchors } from "./readHumanSegmentAnchors";
import { readHumanSegmentLeaf } from "./readHumanSegmentLeaf";
import { readHumanSegmentLegs } from "./readHumanSegmentLegs";

/*
 * Solve the knots and curves one placed action's display evaluates
 * (`IAutoMovieMotionHumanSegment.IPrepared`), once every action, stop and
 * flight of the performance is resolved, in the order each reads the ones
 * before: the leg chain and the arms' swivel course from the plan alone; the
 * legs' fit over a legs-still window from the leaf at its start; the anchor
 * course, for an action that a hold or an overlay rides; the transition's
 * inertialization offset; and the stopped weapons' goals. The record is set on
 * the action as each member is solved, so a later member reads the earlier ones
 * as the display will.
 * Parameter person: The person, with the committed stops installed.
 * Parameter segment: The action.
 * Returns: The action's record, also set on it.
 */
export function prepareHumanSegment(
  person: IAutoMovieMotionHumanSegment.IPerson,
  segment: IAutoMovieMotionHumanSegment,
): IAutoMovieMotionHumanSegment.IPrepared {
  const body: IAutoMovieMotionHumanBody = person.performer.body;
  const prepared: prepareHumanSegmentPose.IPrepared =
    prepareHumanSegmentPose(body);
  const playback = segment.plan.playback;
  if (playback?.source.preparePlaced !== undefined) delete playback.placed;
  const record: IAutoMovieMotionHumanSegment.IPrepared = {
    legs: readHumanSegmentLegs.chain(segment.plan, body),
    swivels: readHumanSegmentLeaf.swivels(
      segment.plan,
      body,
      segment.context.entry.pose,
    ),
    anchors: [],
    stops: new Map(),
  };
  segment.prepared = record;

  // The legs' fit a legs-still window keeps, from the leaf at its start.
  const window: readonly [number, number] | undefined = segment.plan.legsStill;
  if (
    window !== undefined &&
    person.layers.length === 0 &&
    person.overlays.length === 0
  ) {
    const at: number = segment.start + window[0];
    const reading: readHumanSegmentLeaf.IReading = readHumanSegmentLeaf(
      person,
      segment,
      at,
      undefined,
      undefined,
      prepared,
    );
    if (HumanSegmentLegs.within(person, segment, at, reading.posture, true))
      record.still = HumanSegmentLegs.still(reading.pose, reading.seeds);
  }

  // The anchor course places the arm fits the swivel course does not: a
  // carried hand's and an overlay's.
  if (prepareHumanSegment.ridden(person, segment))
    record.anchors = readHumanSegmentAnchors.prepare(person, segment, prepared);

  const offset: IAutoMovieMotionHumanSegment.IPrepared["offset"] =
    HumanSegmentPose.offset(person, segment, prepared);
  if (offset !== undefined) record.offset = offset;
  record.stops = HumanSegmentStop.prepare(person, segment);
  const preparePlaced = playback?.source.preparePlaced;
  if (
    preparePlaced !== undefined &&
    playback !== undefined &&
    playback.ready &&
    playback.body === body &&
    playback.located === segment.plan.posture
  ) {
    const prepare = (): IAutoMovieMotionHumanPlayback.Placed | undefined =>
      preparePlaced(person, segment);
    const placed = playback.where === undefined
      ? prepare()
      : AutoMovieMotionHumanRefusal.located(playback.where, prepare);
    if (placed !== undefined) playback.placed = placed;
  }
  return record;
}

/*
 * Companion of prepareHumanSegment.
 */
export namespace prepareHumanSegment {
  /*
   * What `ridden` reads of a person: their holds' and overlays' spans.
   */
  export interface IRiders {
    /*
     * The holds, each with the action that took it and its span.
     */
    holds: readonly IRider[];

    /*
     * The overlays' spans.
     */
    overlays: readonly Pick<
      IAutoMovieMotionHumanSegment.IOverlay,
      "entryTime" | "end"
    >[];
  }

  /*
   * A hold's span and the action that took it.
   */
  export interface IRider extends Pick<
    IAutoMovieMotionHumanSegment.IHeld,
    "from" | "until"
  > {
    /*
     * The action that took the hold.
     */
    source: ISpan;
  }

  /*
   * An action's span on the film clock.
   */
  export type ISpan = Pick<IAutoMovieMotionHumanSegment, "entryTime" | "end">;

  /*
   * Whether a hold or an overlay rides an action anywhere in its span, its fade
   * included, so its display places arm fits the plan's own swivel course does
   * not. A hold its own action took does not ride that action.
   * Parameter person: The person's holds and overlays.
   * Parameter segment: The action's span.
   * Returns: Whether a rider overlaps it.
   */
  export function ridden(person: IRiders, segment: ISpan): boolean {
    return (
      person.holds.some(
        (held: IRider): boolean =>
          held.source !== segment &&
          held.from <= segment.end &&
          held.until + HumanSegment.FADE >= segment.entryTime,
      ) ||
      person.overlays.some(
        (
          overlay: Pick<
            IAutoMovieMotionHumanSegment.IOverlay,
            "entryTime" | "end"
          >,
        ): boolean =>
          overlay.entryTime <= segment.end &&
          overlay.end + HumanSegment.FADE >= segment.entryTime,
      )
    );
  }
}
