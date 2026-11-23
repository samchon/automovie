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
 * @param cue Cue id passed to composeHumanBladeExchange, without a phase
 *   suffix.
 * @returns A cue track in time order, with the opening before the block on a
 *   tie.
 * @throws {Error} When either of the exchange's required phases is absent.
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
    throw new Error(
      `The film has no complete staged blade exchange named ${cue}`,
    );

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
