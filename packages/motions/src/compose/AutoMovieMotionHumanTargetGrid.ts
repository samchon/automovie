import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTargetGrid,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanFrame } from "../posture/HumanFrame";
import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";

/** The alternatives of `NearestResult`'s site. */
type NearestResult = "height" | "lateral" | "distance";

/** The alternatives of `NearestPosture`'s site. */
type NearestPosture = "root" | "yaw";

/**
 * The places of the air around a performer by name: the heights, lateral
 * offsets and distances a law states a hand's place with, the three rungs of a
 * place (a name, a nudged or in-between name, an explicit share record), the
 * share record each resolves to on a body (`place`, the
 * `AutoMovieMotionHumanTarget.IDefault` that `AutoMovieMotionHumanTarget`'s
 * `fallback` and `resolve` take), and the names a world point falls in
 * (`nearest`).
 */
export namespace AutoMovieMotionHumanTargetGrid {
  /**
   * Every height, lowest first: the order `nearest` breaks a tie by and a nudge
   * names a neighbour from, and the list
   * {@link IAutoMovieMotionHumanTargetGrid.Height} is read from.
   */
  export const HEIGHTS = [
    "floor",
    "knee",
    "hip",
    "waist",
    "chest",
    "shoulder",
    "neck",
    "eye",
    "crown",
    "overhead",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanTargetGrid.Height>[];

  /**
   * How far above the shoulder a hand raised overhead stands, as a share of the
   * arm (provisional: the arm nearly straight, from the `raiseHand` and `cheer`
   * gestures, checked by their "hand above the head" verdicts).
   */
  export const OVERHEAD: number = 0.92;

  /**
   * The lateral places of {@link IAutoMovieMotionHumanTargetGrid.Lateral}, as
   * data.
   */
  export const LATERAL_NAMES = [
    "centre",
    "inside",
    "shoulder",
    "outside",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanTargetGrid.Lateral>[];

  /**
   * The share of the half shoulder width each lateral name is, toward the
   * acting hand's side: `centre` on the midline
   * (`AutoMovieMotionHumanTarget.DEFAULTS`), `inside` at 0.6 (`stopPalm`),
   * `shoulder` above the joint (`raiseHand`), `outside` at 1.5 (`wave`;
   * provisional, checked by the place verdict of the `everyday-gesture-wave`
   * captures across the body sweep).
   */
  export const LATERALS: Readonly<
    Record<IAutoMovieMotionHumanTargetGrid.Lateral, number>
  > = {
    centre: 0,
    inside: 0.6,
    shoulder: 1,
    outside: 1.5,
  };

  /** The distances of {@link IAutoMovieMotionHumanTargetGrid.Distance}, as data. */
  export const DISTANCE_NAMES = [
    "close",
    "near",
    "mid",
    "far",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanTargetGrid.Distance>[];

  /**
   * The share of the arm (upper arm and forearm) each distance name is: `close`
   * at 0.1 (`raiseHand`), `near` at 0.25 (`wave`), `mid` at 0.6
   * (`AutoMovieMotionHumanTarget.DEFAULTS.desk`), `far` at 0.8
   * (`AutoMovieMotionHumanTarget.DEFAULTS.ahead`, `stopPalm`).
   */
  export const DISTANCES: Readonly<
    Record<IAutoMovieMotionHumanTargetGrid.Distance, number>
  > = {
    close: 0.1,
    near: 0.25,
    mid: 0.6,
    far: 0.8,
  };

  /**
   * The largest size of a nudge's component, as a share of the arm
   * (provisional).
   */
  export const NUDGE: number = 0.25;

  /**
   * A height name as a share of the stature.
   *
   * @param body The body.
   * @param name The height.
   * @returns The share of the stature.
   */
  export function height(
    body: Pick<IAutoMovieMotionHumanBody, "measure">,
    name: IAutoMovieMotionHumanTargetGrid.Height,
  ): number {
    const m = body.measure;
    switch (name) {
      case "floor":
        return 0;
      case "knee":
        return (m.hipHeight - m.thigh) / m.stature;
      case "hip":
        return m.hipHeight / m.stature;
      case "waist":
        return m.waistHeight / m.stature;
      case "chest":
        return m.chestHeight / m.stature;
      case "shoulder":
        return m.shoulderHeight / m.stature;
      case "neck":
        return m.neckHeight / m.stature;
      case "eye":
        return m.eyeHeight / m.stature;
      case "crown":
        return 1;
      case "overhead":
        return (
          (m.shoulderHeight + OVERHEAD * (m.upperArm + m.forearm)) / m.stature
        );
    }
  }

  /**
   * The share record a place resolves to on a body, for the acting side.
   *
   * @param body The body.
   * @param side The acting hand, which the lateral names and a nudge's `out`
   *   mirror by.
   * @param place The place, on any rung.
   * @returns The share record `fallback` and `resolve` take.
   * @throws {Error} When a nudge's component exceeds `NUDGE`, a between share
   *   lies outside [0, 1] or joins two facings, or an explicit place has an
   *   empty source.
   */
  export function place(
    body: Pick<IAutoMovieMotionHumanBody, "measure">,
    side: AutoMovieHumanSide,
    place: IAutoMovieMotionHumanTargetGrid.Place,
  ): IAutoMovieMotionHumanTarget.IDefault {
    if (typeof place === "string")
      return AutoMovieMotionHumanTarget.DEFAULTS[place];
    if ("explicit" in place) {
      if (place.source.trim() === "")
        throw new Error("An explicit place states its source");
      return place.explicit;
    }
    if ("at" in place)
      return nudged(
        body,
        side,
        named(body, side, place.at),
        place.nudge,
        place.at,
      );
    if ("between" in place) {
      HumanBound.within("between.share", place.share, 0, 1);
      const a: IAutoMovieMotionHumanTarget.IDefault = named(
        body,
        side,
        place.between[0],
      );
      const b: IAutoMovieMotionHumanTarget.IDefault = named(
        body,
        side,
        place.between[1],
      );
      if (a.facing !== b.facing)
        throw new Error("A place between two facings has no facing");
      const mix = (from: number, to: number): number =>
        from + (to - from) * place.share;
      const mixed: IAutoMovieMotionHumanTarget.IDefault = {
        height: mix(a.height, b.height),
        range: mix(a.range, b.range),
        lateral: mix(a.lateral ?? 0, b.lateral ?? 0),
        facing: a.facing,
      };
      return place.nudge === undefined
        ? mixed
        : nudged(body, side, mixed, place.nudge, undefined);
    }
    return named(body, side, place);
  }

  /**
   * The names of the place a world point falls in, for the acting side: the
   * nearest `Height`, `Lateral` and `Distance` of the body as it stands in the
   * posture.
   *
   * @param body The body.
   * @param posture The root and the heading; the root's own height is not read.
   * @param side The acting hand, which the lateral names mirror by.
   * @param point The point, world metres.
   * @returns The three names; a tie goes to the name listed first in its union.
   */
  export function nearest(
    body: Pick<IAutoMovieMotionHumanBody, "measure">,
    posture: Pick<IAutoMovieMotionHumanPosture, NearestPosture>,
    side: AutoMovieHumanSide,
    point: IAutoMovieVector3,
  ): Required<Pick<IAutoMovieMotionHumanTargetGrid.IGrid, NearestResult>> {
    const m = body.measure;
    const local: IAutoMovieVector3 = HumanFrame.local(
      {
        origin: { x: posture.root.x, y: 0, z: posture.root.z },
        yaw: posture.yaw,
      },
      point,
    );
    return {
      height: closest(
        HEIGHTS,
        (name: IAutoMovieMotionHumanTargetGrid.Height): number =>
          height(body, name) * m.stature,
        local.y,
      ),
      lateral: closest(
        Object.keys(LATERALS) as IAutoMovieMotionHumanTargetGrid.Lateral[],
        (name: IAutoMovieMotionHumanTargetGrid.Lateral): number =>
          LATERALS[name] * m.shoulderHalfWidth,
        (side === "left" ? 1 : -1) * local.x,
      ),
      distance: closest(
        Object.keys(DISTANCES) as IAutoMovieMotionHumanTargetGrid.Distance[],
        (name: IAutoMovieMotionHumanTargetGrid.Distance): number =>
          DISTANCES[name] * (m.upperArm + m.forearm),
        local.z,
      ),
    };
  }
}
/** The alternatives of `NamedBase`'s site. */
type NamedBase =
  | IAutoMovieMotionHumanTarget.Name
  | IAutoMovieMotionHumanTargetGrid.IGrid;

/**
 * The share record of a whole place name or of three grid names, the lateral
 * mirrored by the side.
 */
function named(
  body: Pick<IAutoMovieMotionHumanBody, "measure">,
  side: AutoMovieHumanSide,
  base: NamedBase,
): IAutoMovieMotionHumanTarget.IDefault {
  return typeof base === "string"
    ? AutoMovieMotionHumanTarget.DEFAULTS[base]
    : {
        height: AutoMovieMotionHumanTargetGrid.height(body, base.height),
        range: AutoMovieMotionHumanTargetGrid.DISTANCES[base.distance],
        lateral:
          (side === "left" ? 1 : -1) *
          AutoMovieMotionHumanTargetGrid.LATERALS[base.lateral],
        facing: base.facing ?? "performer",
      };
}
/** The alternatives of `NudgedComponentAxis`'s site. */
type NudgedComponentAxis = "out" | "up" | "forward";

/** The alternatives of `NudgedBase`'s site. */
type NudgedBase =
  | IAutoMovieMotionHumanTarget.Name
  | IAutoMovieMotionHumanTargetGrid.IGrid
  | undefined;

/**
 * A share record moved by a nudge, each component converted from arm lengths to
 * its axis's unit; a component past the bound throws and names the neighbouring
 * name of `base`, when it has one.
 */
function nudged(
  body: Pick<IAutoMovieMotionHumanBody, "measure">,
  side: AutoMovieHumanSide,
  record: IAutoMovieMotionHumanTarget.IDefault,
  nudge: IAutoMovieMotionHumanTargetGrid.INudge,
  base: NudgedBase,
): IAutoMovieMotionHumanTarget.IDefault {
  const m = body.measure;
  const arm: number = m.upperArm + m.forearm;
  const component = (axis: NudgedComponentAxis): number => {
    const value: number = nudge[axis] ?? 0;
    if (!(Math.abs(value) <= AutoMovieMotionHumanTargetGrid.NUDGE)) {
      const names: readonly string[] =
        axis === "up"
          ? AutoMovieMotionHumanTargetGrid.HEIGHTS
          : Object.keys(
              axis === "out"
                ? AutoMovieMotionHumanTargetGrid.LATERALS
                : AutoMovieMotionHumanTargetGrid.DISTANCES,
            );
      const next: string | undefined =
        base === undefined || typeof base === "string"
          ? undefined
          : names[
              names.indexOf(
                axis === "up"
                  ? base.height
                  : axis === "out"
                    ? base.lateral
                    : base.distance,
              ) + (value > 0 ? 1 : -1)
            ];
      throw new Error(
        `A nudge of ${value} ${axis} exceeds ${AutoMovieMotionHumanTargetGrid.NUDGE} arm lengths; ${
          next === undefined
            ? "state the place by nearer names"
            : `use the name ${next}`
        }`,
      );
    }
    return value;
  };
  return {
    height: record.height + (component("up") * arm) / m.stature,
    range: record.range + component("forward"),
    lateral:
      (record.lateral ?? 0) +
      ((side === "left" ? 1 : -1) * component("out") * arm) /
        m.shoulderHalfWidth,
    facing: record.facing,
  };
}

/** The name whose length is nearest to a value; the first listed wins a tie. */
function closest<T extends string>(
  names: readonly T[],
  length: (name: T) => number,
  value: number,
): T {
  let best: T = names[0]!;
  for (const name of names)
    if (Math.abs(length(name) - value) < Math.abs(length(best) - value))
      best = name;
  return best;
}
