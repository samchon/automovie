import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import { AutoMovieMotionHumanVerdicts } from "@automovie/motions";

import { stage } from "./stage";

/**
 * Read the on-court sequence and optionally measure the entire film's body
 * bounds. Every reported cue uses film seconds after the initial grip.
 *
 * @param route The score or held-rebound version.
 * @param bodyBounds Whether to calculate the whole-cut human verdict.
 * @returns Cast count, source window, four physical launches, the contest, and
 *   the verdict when requested.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the source of the checks, their clock and the costliest optional observation.
 * @evidence contracts/development/implementation.md#principled-implementation Uses native flight, current ownership and measured hoop clearance. The independent body report reads every performer over the trim actually mounted.
 * @evidence contracts/development/implementation.md#efficient-algorithms Resolves the requested stage once per call, reads its short fixed list of shots and samples three rim frames. The whole-body report runs only when requested.
 */
export function verify(
  route: stage.Route = "score",
  bodyBounds: boolean = false,
) {
  const { take, cast, filmWindow, rim, ring } = stage(route);
  const flights = take.flights("ball");
  if (
    cast.length !== 10 ||
    flights.length !== 4 ||
    filmWindow.end - filmWindow.start !== 10 ||
    filmWindow.end > take.duration
  )
    throw new Error(
      "The registered film lost a cast member, launch or source frame.",
    );

  const [first, second, pass, shot] = flights;
  if (
    first!.contact?.struck.kind !== "ground" ||
    second!.contact?.struck.kind !== "ground" ||
    shot!.contact?.struck.kind !== "ground"
  )
    throw new Error("The dribble and shot need their realized floor contacts.");
  const owners = take
    .play("ball")
    .events.filter((event) => event.kind === "hold");
  const moving = owners.find((event) => event.caught && event.subject === "a");
  const receiving = owners.find(
    (event) => event.caught && event.subject === "receiver",
  );
  const recovery = owners.find(
    (event) => event.caught && event.subject === "d5",
  );
  if (
    moving === undefined ||
    receiving === undefined ||
    moving.from !== second!.capturedAt ||
    receiving.from !== pass!.capturedAt ||
    moving.to !== pass!.launch ||
    receiving.to !== shot!.launch
  )
    throw new Error("The stock catch and shot lost their actual held props.");
  if (
    route === "recovery" &&
    (recovery === undefined ||
      recovery.hands.length !== 2 ||
      recovery.from !== shot!.capturedAt ||
      !(recovery.from > shot!.end) ||
      recovery.from >= filmWindow.end)
  )
    throw new Error(
      "The rebounder failed to take physical custody inside the cut.",
    );

  const crossing = shot!.launch + 1.05;
  const sphere = shot!.published.sphere!;
  const centre = (seconds: number) => {
    const frame = take.prop("ball", seconds);
    return AutoMovieEngineVector3.add(
      frame.position,
      AutoMovieEngineQuaternion.rotateVector(frame.rotation, sphere.centre),
    );
  };
  const middle = centre(crossing);
  const offset = Math.hypot(middle.x - rim.x, middle.z - rim.z);
  const aperture = ring.dimensions.ring! / 2 - sphere.radius;
  if (
    !(
      offset < aperture &&
      Math.abs(middle.y - rim.y) <= 1e-8 &&
      centre(crossing - 0.01).y > rim.y &&
      centre(crossing + 0.01).y < rim.y &&
      shot!.end > crossing &&
      shot!.end <= filmWindow.end
    )
  )
    throw new Error(
      "The ball must cross down inside the clear ring before bouncing.",
    );

  const contest = take
    .segments("defender")
    .find((segment) => segment.id === "contest")!;
  const cutClock = (seconds: number): number => seconds - filmWindow.start;
  const event = (name: string): number =>
    cutClock(
      contest.start +
        contest.plan.duration *
          contest.plan.events.find((each) => each.name === name)!.share,
    );
  return {
    cast: cast.length,
    filmWindow,
    releases: flights.map((flight) => cutClock(flight.launch)),
    bounces: [first!, second!, shot!].map((flight) => cutClock(flight.end)),
    gather: cutClock(moving.from),
    catch: cutClock(receiving.from),
    ring: { at: cutClock(crossing), offset, aperture },
    contest: {
      takeoff: event("takeoff"),
      apex: event("apex"),
      touchdown: event("touchdown"),
    },
    rebound: recovery === undefined ? null : cutClock(recovery.from),
    ...(bodyBounds
      ? {
          body: AutoMovieMotionHumanVerdicts.read(take, 24, {
            from: filmWindow.start,
            to: filmWindow.end,
          }),
        }
      : {}),
  };
}
