import type {
  IAutoMovieComposition,
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanSegment,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";

import { HumanPerformance } from "./HumanPerformance";

/** Compile replacement motion while preserving the prepared source prefix. */
export namespace AutoMovieMotionHumanContinuation {
  /** Prepared performers on both sides of the continuation boundary. */
  export interface IResult {
    /** Reader that owns the source take before the join. */
    source: HumanPerformance;

    /** Reader for the replacement from the join onward. */
    branch: HumanPerformance;

    /** Second of the join on the source take's clock. */
    branchStart: number;
  }

  /**
   * Rebuild an authored take with a replacement after complete action groups.
   * The provider supplies the same immutable input and deterministic registered
   * bindings as the saved take. The source reader owns seconds before the join.
   * The branch reader owns the join and later seconds on the same clock. Soft
   * props and physical airborne rotation require another route. Take-wide and
   * retained-action events keep their exact join time in the branch reader.
   *
   * @param input Admitted source take, with an outer sequence of action groups.
   * @param sourceSeconds Saved source second, strictly before the join.
   * @param retainedParts Number of complete outer sequence groups to preserve.
   * @param suffix Replacement composition made of untimed groups and intents.
   * @returns The original reader, branch reader and exact source second of the
   *   join.
   * @throws {Error} When the join, preserved motion or replacement is
   *   unsupported.
   */
  export function compile(
    input: IAutoMovieMotionHumanPerformance.IInput,
    sourceSeconds: number,
    retainedParts: number,
    suffix: IAutoMovieComposition,
  ): IResult {
    if (
      input.composition.type !== "sequence" ||
      retainedParts < 1 ||
      retainedParts >= input.composition.parts.length
    )
      refuse(
        "choose complete leading groups of a source sequence with an existing tail",
      );
    if (!(sourceSeconds >= 0))
      refuse("the source second must be finite and nonnegative");
    if (
      input.flight === "physical" ||
      input.props?.some((prop) => prop.soft !== undefined)
    )
      refuse(
        "physical rotation and soft props require a different continuation route",
      );

    const parts: readonly IAutoMovieComposition[] =
      input.composition.parts.slice(0, retainedParts);
    const retained: number = parts.reduce(
      (sum: number, part: IAutoMovieComposition): number =>
        sum + count(part, false),
      0,
    );
    if (retained === 0 || count(suffix, true) === 0)
      refuse("the retained groups and replacement must both place actions");

    const source: HumanPerformance = new HumanPerformance(input);
    checkPhysicalFlights(source);
    const prefix: readonly IAutoMovieScheduleEntry[] =
      source.schedule.entries.filter(
        (entry: IAutoMovieScheduleEntry): boolean => entry.index < retained,
      );
    const branchStart: number = prefix.reduce(
      (end: number, entry: IAutoMovieScheduleEntry): number =>
        Math.max(end, entry.end),
      0,
    );
    if (sourceSeconds >= branchStart || branchStart >= source.duration)
      refuse(
        "the replacement must start after the saved second and before the original take ends",
      );
    checkTail(source, retained, branchStart);

    const branch: HumanPerformance = new HumanPerformance({
      ...input,
      composition: { type: "sequence", parts: [...parts, suffix] },
    });
    checkPhysicalFlights(branch);
    checkTail(branch, retained, branchStart);
    const kept: readonly IAutoMovieScheduleEntry[] =
      branch.schedule.entries.filter(
        (entry: IAutoMovieScheduleEntry): boolean => entry.index < retained,
      );
    if (!same(prefix.map(timing), kept.map(timing)))
      refuse(
        "the replacement changed a retained action's placement, cut or cues",
      );

    // Read the outgoing law outside the existing action entry allowance.
    const closing: number =
      branchStart - Math.max(2e-12, 2 * Number.EPSILON * branchStart);
    if (closing <= sourceSeconds)
      refuse("the saved second is inside the motion solver's join allowance");
    const seconds: readonly number[] = [sourceSeconds, closing];
    for (const person of input.performers) {
      const id: IAutoMovieMotionHumanPerformer["subject"] = person.subject;
      const originalEntry: IAutoMovieMotionHumanEntryState | undefined =
        joinEntry(source, id, retained, branchStart);
      const branchEntry: IAutoMovieMotionHumanEntryState | undefined =
        joinEntry(branch, id, retained, branchStart);
      if (!same(entryState(originalEntry), entryState(branchEntry)))
        refuse(
          `the replacement changed the join entry, supports or held state of ${id}`,
        );
      if (branch.overlays(id).some((overlay) => overlay.entry >= retained))
        refuse("the replacement cannot add an overlay");
      for (const at of seconds)
        if (!same(source.pose(id, at), branch.pose(id, at)))
          refuse(
            `the replacement changed the preserved pose of ${id} at ${at} s`,
          );
    }
    for (const prop of input.props ?? []) {
      checkFlights(source, branch, prop, branchStart);
      for (const at of [...seconds, branchStart])
        if (
          !same(source.prop(prop.subject, at), branch.prop(prop.subject, at)) ||
          !same(source.state(prop.subject, at), branch.state(prop.subject, at))
        )
          refuse(
            `the replacement changed the preserved frame or articulation of ${prop.subject} at ${at} s`,
          );
    }
    const retainedEvent = (event: IAutoMovieInteractionEvent): boolean =>
      event.time < branchStart ||
      (event.time === branchStart &&
        (event.actionIndex === null || event.actionIndex < retained));
    if (
      !same(
        source.hits().filter(retainedEvent),
        branch.hits().filter(retainedEvent),
      )
    )
      refuse("the replacement changed the retained interaction record");
    return { source, branch, branchStart };
  }
}

/**
 * Read the already prepared owner entry for a performer starting a replacement
 * action at the join.
 */
function joinEntry(
  performance: HumanPerformance,
  subject: string,
  retained: number,
  join: number,
): IAutoMovieMotionHumanEntryState | undefined {
  return performance
    .segments(subject)
    .find(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.entry >= retained && segment.entryTime === join,
    )?.context.entry;
}

/**
 * Compare entry kinematics, contact supports and custody without comparing plan
 * closures.
 */
function entryState(
  entry: IAutoMovieMotionHumanEntryState | undefined,
): unknown {
  if (entry === undefined) return undefined;
  return [
    entry.seconds,
    entry.pose,
    entry.posture,
    entry.velocity,
    entry.acceleration,
    entry.feet,
    entry.supports,
    entry.base,
    entry.holds,
    entry.uses,
    entry.from?.name,
    entry.from?.family,
    entry.from?.params,
    entry.from?.start,
    entry.from?.share,
  ];
}

/** Supplied momentum selects physical airborne rotation even in staged mode. */
function checkPhysicalFlights(performance: HumanPerformance): void {
  for (const person of performance.performers)
    for (const segment of performance.segments(person.subject))
      if (
        segment.plan.airborne !== undefined &&
        segment.plan.flight?.momentum.kind === "momentum"
      )
        refuse(
          `supplied angular momentum for ${person.subject}/${segment.id} requires a different continuation route`,
        );
}

/**
 * Count walk-order leaves and admit ordinary sequence and parallel groups in
 * the replacement.
 */
function count(node: IAutoMovieComposition, replacement: boolean): number {
  switch (node.type) {
    case "intent":
      if (replacement && node.intent.until !== undefined)
        refuse("the replacement cannot cut an action");
      return 1;
    case "sequence":
    case "parallel":
      return node.parts.reduce(
        (sum: number, part: IAutoMovieComposition): number =>
          sum + count(part, replacement),
        0,
      );
    case "at":
      if (replacement)
        refuse("the replacement cannot use anchor-relative placement");
      return count(node.part, replacement);
  }
  return refuse("the composition contains an unknown node kind");
}

/** The timing and event ledger, excluding opaque schedule state. */
function timing(entry: IAutoMovieScheduleEntry): unknown {
  return [
    entry.index,
    entry.start,
    entry.end,
    entry.contact,
    entry.events,
    entry.cut,
    entry.interruptedBy,
  ];
}

/** Require both takes' tails to start at the actual group boundary. */
function checkTail(
  performance: HumanPerformance,
  retained: number,
  join: number,
): void {
  const first: IAutoMovieScheduleEntry | undefined =
    performance.schedule.entries.find(
      (entry: IAutoMovieScheduleEntry): boolean => entry.index >= retained,
    );
  if (first?.start !== join)
    refuse(
      "the tail must start at the join, with no offset back into the retained groups",
    );
}

/**
 * Require each prefix flight to have transferred custody before this branch
 * route.
 */
function checkFlights(
  source: HumanPerformance,
  branch: HumanPerformance,
  prop: IAutoMovieMotionHumanProp,
  join: number,
): void {
  const prefix = (performance: HumanPerformance): unknown[] =>
    performance
      .flights(prop.subject)
      .filter(
        (flight: IAutoMovieMotionHumanPropFlight.IFlight): boolean =>
          flight.launch < join,
      )
      .map((flight: IAutoMovieMotionHumanPropFlight.IFlight): unknown => {
        if (
          !(
            (flight.capturedAt ?? Infinity) < join ||
            (flight.end < join && !flight.legs?.length)
          )
        )
          refuse(
            `flight of ${prop.subject} must settle or be captured before the join`,
          );
        return [
          flight.source.entry,
          flight.launch,
          flight.published,
          flight.capturedAt,
          flight.contact,
        ];
      });
  if (!same(prefix(source), prefix(branch)))
    refuse(`the replacement changed a retained flight of ${prop.subject}`);
}

/** Compare deterministic plain observations without persisting them. */
function same(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (
    typeof left !== "object" ||
    left === null ||
    typeof right !== "object" ||
    right === null
  )
    return false;
  const entries: [string, unknown][] = Object.entries(left);
  return (
    entries.length === Object.keys(right).length &&
    entries.every(
      ([key, value]: [string, unknown]): boolean =>
        Object.prototype.hasOwnProperty.call(right, key) &&
        same(value, (right as Record<string, unknown>)[key]),
    )
  );
}

/** Report the exact unsupported branch premise to the host. */
function refuse(reason: string): never {
  throw new Error(`Human performance continuation: ${reason}.`);
}
