import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";
import { racketStanceTransfer } from "./racketStanceTransfer";

/**
 * Prepare the support intervals and knee loading for ready and split-step
 * racket phrases.
 *
 * @param context Entry posture and feet of the performer.
 * @param clock The existing phrase clock, with its existing public events.
 * @param lead The first foot out, on the racket side.
 * @param leftward The local left direction in world space.
 * @param split Whether to add a simultaneous hop between outward and recovery
 *   steps.
 * @param extent The authored movement extent multiplier for the jump.
 * @returns Pelvis and leg primitives, with their ground contacts.
 */
export function racketStance(
  context: IAutoMovieMotionHumanActionContext,
  clock: IAutoMovieMotionClock,
  lead: AutoMovieHumanSide,
  leftward: IAutoMovieVector3,
  split: boolean,
  extent: number,
): IRacketStanceResult {
  const { body, entry }: IAutoMovieMotionHumanActionContext = context;
  const follow: AutoMovieHumanSide = lead === "left" ? "right" : "left";
  const ready: number = clock.at("ready");
  const relax: number = clock.at("relax");
  const flight: Window = [clock.at("strokeStart"), clock.at("stroke")];
  const width: number = Vector3.dot(
    Vector3.subtract(entry.feet.left.ankle, entry.feet.right.ankle),
    leftward,
  );
  const widening: number = Math.max(
    0,
    (4 * body.measure.shoulderHalfWidth - width) / 2,
  );
  const spread: number = split ? body.measure.shoulderHalfWidth / 2 : 0;
  const clearance: number = CLEARANCE * body.measure.stature;
  const height: number = 0.03 * body.measure.stature * extent;
  const load: (seconds: number) => number =
    AutoMovieMotionClock.prepareEnvelope(
      clock,
      ["start", "ready"],
      ["relax", "end"],
    );
  const offset = (foot: AutoMovieHumanSide, distance: number): number =>
    Vector3.dot(
      Vector3.subtract(entry.feet[foot].ankle, entry.posture.root),
      leftward,
    ) + (foot === "left" ? distance : -distance);
  const approach: racketStanceTransfer.ITransfer = racketStanceTransfer(
    0,
    ready,
    offset(follow, 0),
    offset(lead, widening),
  );
  const recovery: racketStanceTransfer.ITransfer = racketStanceTransfer(
    relax,
    clock.duration,
    offset(lead, widening + spread),
    offset(follow, 0),
  );
  const airborne = (seconds: number): boolean =>
    split && racketStanceTransfer.inside(flight, seconds);
  const progress = (seconds: number): number =>
    racketStanceTransfer.share(flight, seconds);
  const lift = (seconds: number): number => {
    if (!airborne(seconds)) return 0;
    const t: number = progress(seconds);
    return 4 * height * t * (1 - t);
  };
  const primitives: IAutoMovieMotionHumanPrimitive[] = [
    {
      channels: ["root", "trunk"],
      from: 0,
      to: clock.duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const loaded: number = load(seconds);
        const shift: number =
          seconds < ready && widening > 0
            ? approach.offset(seconds)
            : seconds > relax && widening + spread > 0
              ? recovery.offset(seconds)
              : 0;
        const root: IAutoMovieVector3 = Vector3.addScaled(
          posture.root,
          leftward,
          shift,
        );
        return {
          ...posture,
          root: {
            ...root,
            y: root.y - 0.04 * body.measure.stature * loaded + lift(seconds),
          },
          pitch: posture.pitch + 15 * loaded,
        };
      },
    },
  ];
  const contacts: IAutoMovieMotionHumanContactWindow[] = [];
  for (const foot of ["left", "right"] as const) {
    const rest: IAutoMovieMotionHumanFoot.IPlacement = {
      ankle: entry.feet[foot].ankle,
      rotation: entry.feet[foot].rotation,
    };
    const side: number = foot === "left" ? 1 : -1;
    const open: IAutoMovieMotionHumanFoot.IPlacement = {
      ...rest,
      ankle: Vector3.addScaled(rest.ankle, leftward, side * widening),
    };
    const landed: IAutoMovieMotionHumanFoot.IPlacement = {
      ...rest,
      ankle: Vector3.addScaled(open.ankle, leftward, side * spread),
    };
    const outward: Window = approach.swings[foot === lead ? 0 : 1];
    const inward: Window = recovery.swings[foot === follow ? 0 : 1];
    const stepOut: ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc> =
      AutoMovieMotionHumanLeg.prepareArc(
        rest,
        open,
        widening > 0 ? clearance : 0,
      );
    const stepBack: ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc> =
      AutoMovieMotionHumanLeg.prepareArc(
        landed,
        rest,
        widening + spread > 0 ? clearance : 0,
      );
    const departures: Window[] = [];
    if (widening > 0) departures.push(outward);
    if (split) departures.push(flight);
    if (widening + spread > 0) departures.push(inward);
    primitives.push(
      AutoMovieMotionHumanLeg.place({
        body,
        side: foot,
        from: 0,
        to: clock.duration,
        placement: (
          _: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanFoot.IPlacement => {
          if (seconds <= outward[0] || seconds >= inward[1]) return rest;
          if (seconds < outward[1])
            return stepOut(racketStanceTransfer.ease(outward, seconds));
          if (seconds > inward[0])
            return stepBack(racketStanceTransfer.ease(inward, seconds));
          if (!split || seconds <= flight[0]) return open;
          if (seconds >= flight[1]) return landed;
          const ankle: IAutoMovieVector3 = Vector3.addScaled(
            open.ankle,
            leftward,
            side * spread * racketStanceTransfer.ease(flight, seconds),
          );
          return {
            ankle: { ...ankle, y: ankle.y + lift(seconds) },
            rotation: rest.rotation,
          };
        },
        planted: (seconds: number): boolean =>
          !departures.some((window: Window): boolean =>
            racketStanceTransfer.inside(window, seconds),
          ),
      }),
    );
    let bearing: number = 0;
    for (const [from, to] of [
      ...departures,
      [clock.duration, clock.duration] as const,
    ]) {
      if (bearing < from)
        contacts.push({
          part: `${foot}Foot`,
          kind: "plant",
          from: bearing / clock.duration,
          to: from / clock.duration,
          support: { kind: "ground" },
        });
      bearing = to;
    }
  }
  return { primitives, contacts };
}

/** Absolute action-local endpoints of a phase in seconds. */
type Window = racketStanceTransfer.Window;
/**
 * The height of each ready or recovery step above its ground baseline as a
 * fraction of stature.
 */
const CLEARANCE: number = 0.025;

/** The record of `IRacketStanceResult`'s site. */
type IRacketStanceResult = {
  primitives: IAutoMovieMotionHumanPrimitive[];
  contacts: IAutoMovieMotionHumanContactWindow[];
};
