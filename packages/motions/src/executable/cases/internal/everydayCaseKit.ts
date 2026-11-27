import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBody } from "../../../body/AutoMovieMotionHumanBody";
import { HumanPerformance } from "../../../perform/HumanPerformance";
import { poseBones } from "../../../posture/internal/poseBones";
import type { IMotionCaptureCase } from "../../internal/IMotionCaptureCase";
import type { humanPolygonMan } from "../../internal/humanPolygonMan";

/**
 * The shared readers of the everyday capture cases (`everydayCases`): a
 * performance of polygon men, a performer's figure, a segment's event, the
 * angle between two directions and a body's rest frame.
 */
export namespace everydayCaseKit {
  /**
   * One body's case context: its id, its polygon man, its body and the case
   * names' suffix.
   */
  export interface IContext {
    /** The sweep body's id. */
    id: string;

    /** The polygon man. */
    man: humanPolygonMan.IPolygonMan;

    /** Its body. */
    body: IAutoMovieMotionHumanBody;

    /** The case names' suffix; empty for one body. */
    suffix: string;
  }

  /**
   * The context's performance of a chain by its man alone at the origin.
   *
   * @param c The context.
   * @param chain The chain.
   * @param props The scene's props; none when absent.
   * @returns The performance.
   */
  export const one = (
    c: IContext,
    chain: IAutoMovieMotionHumanChain,
    props: readonly IAutoMovieMotionHumanProp[] = [],
  ): IAutoMovieMotionHumanPerformance =>
    perform([[c.man, { x: 0, y: 0, z: 0 }, 0]], chain, props);

  /**
   * A performance of polygon men at places and headings, the first `a` and the
   * second `b`, among the scene's props.
   */
  export function perform(
    people: [humanPolygonMan.IPolygonMan, IAutoMovieVector3, number][],
    chain: IAutoMovieMotionHumanChain,
    props: readonly IAutoMovieMotionHumanProp[] = [],
  ): IAutoMovieMotionHumanPerformance {
    return new HumanPerformance({
      seed: "everyday",
      props: [...props],
      performers: people.map(([man, at, yaw], i: number) => ({
        subject: i === 0 ? "a" : "b",
        body: AutoMovieMotionHumanBody.create(
          man.body.skeleton,
          man.body.profile,
        ),
        at,
        yaw,
        proficiency: { level: "trained" as const },
      })),
      composition: chain.node,
    });
  }

  /** A drawn performer. */
  export function figure(
    performance: Pick<IAutoMovieMotionHumanPerformance, "pose">,
    subject: string,
    man: Pick<humanPolygonMan.IPolygonMan, "body">,
    color?: number,
  ): IMotionCaptureCase.IPerformer {
    return {
      id: subject,
      body: man.body,
      pose: (seconds: number): IAutoMoviePose =>
        performance.pose(subject, seconds),
      ...(color === undefined ? {} : { color }),
    };
  }

  /** The film second of an event of a person's n-th action. */
  export function event(
    performance: IEventPerformance,
    subject: string,
    index: number,
    name: string,
  ): number {
    const segment = performance.segments(subject)[index]!;
    return (
      segment.start +
      segment.plan.events.find((e) => e.name === name)!.share *
        segment.plan.duration
    );
  }

  /** Angle between two vectors, degrees. */
  export function angle(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    return (
      (Math.acos(
        Math.max(
          -1,
          Math.min(1, Vector3.dot(Vector3.normalize(a), Vector3.normalize(b))),
        ),
      ) *
        180) /
      Math.PI
    );
  }

  /**
   * A neutral aiming frame, for reading person targets; its own bones are the
   * body at rest.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
  ): Parameters<IAutoMovieMotionHumanPerformance["aim"]>[2] {
    return {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      heights: { low: 0, middle: 0, high: 0 },
      range: 1,
      body,
      bones: () =>
        poseBones(body, { skeleton: body.skeleton.id, root: null, joints: [] }),
    };
  }
}

/** The part of a segment its events are read from. */
interface IEventSegment {
  /** Its name, for a refusal. */
  name: IAutoMovieMotionHumanSegment["name"];

  /** Film seconds it starts. */
  start: IAutoMovieMotionHumanSegment["start"];

  /** Its plan's events and duration. */
  plan: Pick<IAutoMovieMotionHumanSegment["plan"], "events" | "duration">;
}
/** A performance's segments, all an event reader reads. */
interface IEventPerformance {
  /** A subject's segments in order. */
  segments(subject: string): readonly IEventSegment[];
}
