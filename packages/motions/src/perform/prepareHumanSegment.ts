import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import { HumanSegment } from "./HumanSegment";
import { HumanSegmentLegs } from "./HumanSegmentLegs";
import { HumanSegmentPose } from "./HumanSegmentPose";
import { HumanSegmentStop } from "./HumanSegmentStop";
import { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";
import { readHumanSegmentAnchors } from "./readHumanSegmentAnchors";
import { readHumanSegmentLeaf } from "./readHumanSegmentLeaf";
import { readHumanSegmentLegs } from "./readHumanSegmentLegs";

/**
 * Solve the knots and curves one placed action's display evaluates
 * (`IAutoMovieMotionHumanSegment.IPrepared`), once every action, stop and
 * flight of the performance is resolved, in the order each reads the ones
 * before: the leg chain and the arms' swivel course from the plan alone; the
 * legs' fit over a legs-still window from the leaf at its start; the anchor
 * course, for an action that a hold or an overlay rides; the transition's
 * inertialization offset; and the stopped weapons' goals. The record is set on
 * the action as each member is solved, so a later member reads the earlier
 * ones as the display will.
 *
 * @param person The person, with the committed stops installed.
 * @param segment The action.
 * @returns The action's record, also set on it.
 */
export function prepareHumanSegment(
  person: IAutoMovieMotionHumanSegment.IPerson,
  segment: IAutoMovieMotionHumanSegment,
): IAutoMovieMotionHumanSegment.IPrepared {
  const body: IAutoMovieMotionHumanBody = person.performer.body;
  const prepared: prepareHumanSegmentPose.IPrepared =
    prepareHumanSegmentPose(body);
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
  if (ridden(person, segment))
    record.anchors = readHumanSegmentAnchors.prepare(person, segment, prepared);

  const offset: IAutoMovieMotionHumanSegment.IPrepared["offset"] =
    HumanSegmentPose.offset(person, segment, prepared);
  if (offset !== undefined) record.offset = offset;
  record.stops = HumanSegmentStop.prepare(person, segment);
  return record;
}

/**
 * Whether a hold or an overlay rides an action anywhere in its span, so its
 * display places arm fits the plan's own swivel course does not.
 */
function ridden(
  person: IAutoMovieMotionHumanSegment.IPerson,
  segment: IAutoMovieMotionHumanSegment,
): boolean {
  return (
    person.holds.some(
      (held: IAutoMovieMotionHumanSegment.IHeld): boolean =>
        held.source !== segment &&
        held.from <= segment.end &&
        held.until + HumanSegment.FADE >= segment.entryTime,
    ) ||
    person.overlays.some(
      (overlay: IAutoMovieMotionHumanSegment.IOverlay): boolean =>
        overlay.entryTime <= segment.end &&
        overlay.end + HumanSegment.FADE >= segment.entryTime,
    )
  );
}
