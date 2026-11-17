import type {
  IAutoMovieSchedule,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";

/**
 * Read a staged blade exchange's editing cues from a resolved film schedule.
 * The `opening` cue is the opening's decisive instant, `block` is the
 * responder's stroke event and `reply` is the optional follow-through's start.
 * Cues are in film seconds. A cut that removes an instant also removes its cue.
 * An instant at the cut remains.
 *
 * @param schedule Placed schedule containing the exchange.
 * @param cue Cue id passed to composeHumanBladeExchange, without a phase suffix.
 * @returns A cue track in time order, with the opening before the block on a tie.
 * @throws {Error} When either of the exchange's required phases is absent.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the three cues, their timebase, ordering, cut semantics and missing exchange error.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the composer-owned phase anchors, the schedule's placed contact and the block's declared stroke. A placed schedule preserves named events past a cut, so the stroke is read only inside the retained action.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the exact phase anchors in one pass, then project their scheduled instants to the existing cue record.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each second comes from the placed schedule. No pose or physical contact is sampled, and no missing cue is inferred.
 * @evidence contracts/development/implementation.md#efficient-algorithms One scan of the schedule and one lookup in the block's events. The result holds at most three cues, so sorting it is bounded independently of schedule size.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Cases read a completed schedule without placing its actions again. The projection stores no data to reuse across calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns only new cue records and keeps no input reference or resource after the call.
 */
export function readHumanBladeExchangeCues(
  schedule: IAutoMovieSchedule,
  cue: string,
): IAutoMovieScheduleCue[] {
  const openingAnchor: string = `${cue}.opening`;
  const blockAnchor: string = `${cue}.block`;
  const replyAnchor: string = `${cue}.reply`;
  let opening: IAutoMovieScheduleEntry | undefined;
  let block: IAutoMovieScheduleEntry | undefined;
  let reply: IAutoMovieScheduleEntry | undefined;
  for (const entry of schedule.entries) {
    if (entry.intent.anchor === openingAnchor) opening = entry;
    else if (entry.intent.anchor === blockAnchor) block = entry;
    else if (entry.intent.anchor === replyAnchor) reply = entry;
  }
  if (opening === undefined || block === undefined)
    throw new Error(`The film has no complete staged blade exchange named ${cue}`);

  const track: IAutoMovieScheduleCue[] = [];
  if (opening.contact !== undefined)
    track.push({ name: "opening", seconds: opening.contact });
  const stroke: IAutoMovieScheduleCue | undefined = block.events?.find(
    (event: IAutoMovieScheduleCue): boolean => event.name === "stroke",
  );
  if (
    stroke !== undefined &&
    stroke.seconds >= block.start &&
    stroke.seconds <= block.end
  )
    track.push({ name: "block", seconds: stroke.seconds });
  if (reply !== undefined) track.push({ name: "reply", seconds: reply.start });
  return track.sort(
    (a: IAutoMovieScheduleCue, b: IAutoMovieScheduleCue): number =>
      a.seconds - b.seconds,
  );
}
