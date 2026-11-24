import {
  type AutoMovieArchetype,
  createAxillaryCrutch,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCrutchStairs,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGait,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";

import type { motionComplaints } from "../../features/internal/motionComplaints";
import { motionActionUnit } from "./motionActionUnit";

/**
 * The two-crutch stair climb of `test_motion_gait_crutch_stairs`, staged as
 * that spec stages it, with its checks 1 to 4 for one body and direction, so
 * each direction is a unit of its own and the riser's refusal is checked apart
 * with its adjacent admitted riser.
 */
export namespace crutchStairsScene {
  /** A climb's direction. */
  export type Direction = "up" | "down";

  /** An axillary crutch's model. */
  export type CrutchModel = AutoMovieArchetype<
    createAxillaryCrutch.Affordance,
    createAxillaryCrutch.Dimension
  >;

  /** One crutch climb and what its checks read. */
  export interface IClimb {
    /** The performance. */
    film: HumanPerformance;

    /** Each side's crutch model. */
    models: Record<AutoMovieHumanSide, CrutchModel>;

    /** The climb's parameters. */
    params: IAutoMovieMotionHumanCrutchStairs;
  }

  /** The flight's settings a case overrides. */
  export type Flight = Partial<
    Pick<IAutoMovieMotionHumanCrutchStairs, "direction" | "riser">
  >;

  /**
   * A crutch's length as a share of its user's stature: the clinical fitting
   * the crutch walk's spec stages.
   */
  const FIT: number = 0.77;

  /**
   * How far beside each foot a crutch tip stands, metres: the tripod position
   * (Physiopedia, Crutches).
   */
  const TRIPOD: number = 0.15;

  /**
   * How still a planted crutch tip or foot stays, metres: the campaign's
   * ground-contact bound.
   */
  const STILL: number = 0.002;

  /**
   * How far a sole or tip may lie from its tread, metres: the campaign's
   * support bound.
   */
  const SUPPORT: number = 0.01;

  /**
   * How far a bearing hand may lie from its handgrip, metres: the touch
   * contract's bound, as the crutch walk's spec reads it.
   */
  const GRIP: number = 0.01;

  /** Steps climbed. */
  const COUNT: number = 2;

  /**
   * A domestic riser and going, metres: within the UK Approved Document K
   * private-stair limits (rise at most 220 mm, going at least 220 mm).
   */
  const RISER: number = 0.17;
  const TREAD: number = 0.28;

  /**
   * The first nosing's distance ahead of the toes, metres: the stair climb's
   * default, which the crutch climb keeps when none is given.
   */
  const START: number = 0.05;

  /** The injured side staged. */
  const INJURED: AutoMovieHumanSide = "left";

  /** A crutch site's world point at a second. */
  type Site = (
    side: AutoMovieHumanSide,
    id: createAxillaryCrutch.Affordance,
    seconds: number,
  ) => IAutoMovieVector3;

  /** Where a prop is staged: its floor point and heading. */
  interface IPlaced {
    /** The floor point, world metres. */
    at: IAutoMovieVector3;

    /** The heading, degrees. */
    yaw: number;
  }

  /**
   * The height of the landing a climb starts on, metres: the floor going up,
   * the top of the `COUNT` steps going down.
   */
  export function landing(direction: Direction): number {
    return direction === "down" ? COUNT * RISER : 0;
  }

  /**
   * Performer `a` at the origin facing +Z, its crutches beside the feet level
   * with the toes, climbing `COUNT` steps.
   */
  export function climb(
    body: IAutoMovieMotionHumanBody,
    flight: Flight,
  ): IClimb {
    const length: number = Math.min(
      createAxillaryCrutch.BANDS.length.maximum,
      Math.max(
        createAxillaryCrutch.BANDS.length.minimum,
        FIT * body.measure.stature,
      ),
    );
    const models: Record<AutoMovieHumanSide, CrutchModel> = {
      left: createAxillaryCrutch({ length }),
      right: createAxillaryCrutch({ length }),
    };
    const params: IAutoMovieMotionHumanCrutchStairs = {
      left: "leftCrutch",
      right: "rightCrutch",
      injured: INJURED,
      count: COUNT,
      riser: RISER,
      tread: TREAD,
      ...flight,
    };

    // A descent starts on the top landing: the floor plane is the flight's
    // foot, which no support goes below.
    const height: number = landing(flight.direction ?? "up");
    const performer: IAutoMovieMotionHumanPerformer = {
      subject: "a",
      body,
      at: { x: 0, y: height, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" },
    };

    // The toes, read on the standing body.
    const stand: HumanPerformance = new HumanPerformance({
      seed: "crutch stairs toes",
      performers: [{ ...performer, at: { x: 0, y: 0, z: 0 } }],
      composition: HumanChain.subject("a").stand({ hold: 0.1, sway: 0 }).node,
    });
    const toes: number = Math.max(
      ...(["left", "right"] as const).flatMap(
        (side: AutoMovieHumanSide): number[] =>
          HumanFoot.sockets(body, stand.bones("a", 0), side).map(
            (s: IAutoMovieMotionHumanFoot.ISocket): number => s.point.z,
          ),
      ),
    );
    const props: IAutoMovieMotionHumanProp[] = (["left", "right"] as const).map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanProp => {
        const x: number =
          body.rest.get(`${side}Foot`)!.x +
          (side === "left" ? TRIPOD : -TRIPOD);
        const placed: IPlaced = { at: { x, y: height, z: toes }, yaw: 0 };
        return HumanObject.prop(
          side === "left" ? params.left : params.right,
          models[side],
          placed,
          AutoMovieMotionHumanGait.HumanCrutchStairs.track(
            HumanObject.frame(placed),
            params,
          ),
        );
      },
    );
    return {
      film: new HumanPerformance({
        seed: "crutch stairs",
        performers: [performer],
        props,
        laws: [AutoMovieMotionHumanGait.HumanCrutchStairs],
        composition: HumanChain.subject("a").registered(
          AutoMovieMotionHumanGait.HumanCrutchStairs.name,
          params,
        ).node,
      }),
      models,
      params,
    };
  }

  /**
   * One body's climb in one direction with the original's checks 1 to 4 and the
   * climb's own bounds.
   */
  export function verify(
    checks: motionComplaints.IGatherer,
    body: IAutoMovieMotionHumanBody,
    label: string,
    direction: Direction,
  ): void {
    const { film, models, params }: IClimb = climb(body, { direction });
    const segment: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
    const at: (name: string) => number = (name: string): number =>
      segment.start +
      segment.plan.duration *
        segment.plan.events.find(
          (e: IAutoMovieMotionEvent): boolean => e.name === name,
        )!.share;
    const sign: number = direction === "up" ? 1 : -1;
    const base: number = landing(direction);
    const sound: AutoMovieHumanSide = INJURED === "left" ? "right" : "left";
    const site: Site = (
      side: AutoMovieHumanSide,
      id: createAxillaryCrutch.Affordance,
      seconds: number,
    ): IAutoMovieVector3 => {
      const frame: IAutoMovieRigidTransform = film.prop(
        side === "left" ? params.left : params.right,
        seconds,
      );
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(
          frame.rotation,
          models[side].site(id).translation,
        ),
      );
    };
    const sole: (side: AutoMovieHumanSide, seconds: number) => number = (
      side: AutoMovieHumanSide,
      seconds: number,
    ): number =>
      Math.min(
        ...HumanFoot.sockets(body, film.bones("a", seconds), side).map(
          (s: IAutoMovieMotionHumanFoot.ISocket): number => s.point.y,
        ),
      );
    const toes: number = site(sound, "tip", segment.start).z;
    const name: string = direction === "up" ? "Up" : "Down";
    let previous: number = at("crutchReady");
    for (let i: number = 1; i <= COUNT; ++i) {
      const foot: number = at(`foot${name}${i}`);
      const crutch: number = at(`crutch${name}${i}`);

      // 1. The order, and what stays planted through each move.
      checks.check(
        `${label}: step ${i} moves the ${direction === "up" ? "foot, then the crutches" : "crutches, then the foot"}`,
        direction === "up"
          ? previous < foot && foot < crutch
          : previous < crutch && crutch < foot,
      );
      const footMove: readonly number[] =
        direction === "up" ? [previous, foot] : [crutch, foot];
      const crutchMove: readonly number[] =
        direction === "up" ? [foot, crutch] : [previous, crutch];
      for (const side of ["left", "right"] as const)
        checks.check(
          `${label}: the ${side} tip stays planted while the foot steps ${i}`,
          Vector3.distance(
            site(side, "tip", footMove[0]!),
            site(side, "tip", footMove[1]!),
          ) <= STILL,
        );
      const ankle: (seconds: number) => IAutoMovieVector3 = (
        seconds: number,
      ): IAutoMovieVector3 =>
        film.bones("a", seconds).get(`${sound}Foot`)!.worldPosition;
      checks.check(
        `${label}: the sound foot stays planted while the crutches move ${i}`,
        Vector3.distance(ankle(crutchMove[0]!), ankle(crutchMove[1]!)) <= STILL,
      );

      // 2. On the treads.
      for (const side of ["left", "right"] as const) {
        const tip: IAutoMovieVector3 = site(side, "tip", crutch);
        const ahead: number = tip.z - toes;
        const front: number = START + (i - 1) * TREAD;
        checks.check(
          `${label}: the ${side} tip stands on tread ${i} (${(tip.y * 1000).toFixed(0)} mm, ${(ahead * 1000).toFixed(0)} mm ahead)`,
          Math.abs(tip.y - base - sign * i * RISER) <= SUPPORT &&
            ahead >= front &&
            ahead <= front + TREAD,
        );
      }
      checks.check(
        `${label}: the sound sole stands on tread ${i} (${(sole(sound, foot) * 1000).toFixed(0)} mm)`,
        Math.abs(sole(sound, foot) - base - sign * i * RISER) <= SUPPORT,
      );

      // 3. The hands on the grips.
      for (const t of [foot, crutch])
        for (const side of ["left", "right"] as const) {
          const off: number = Vector3.distance(
            film.bones("a", t).get(`${side}Hand`)!.worldPosition,
            site(side, "grip", t),
          );
          checks.check(
            `${label}: the ${side} hand bears on its grip at step ${i} (${(off * 1000).toFixed(1)} mm)`,
            off <= GRIP + body.measure.hand / 2,
          );
        }
      previous = Math.max(foot, crutch);
    }

    // 4. The injured foot held above the sound foot's tread.
    const lifted: number = at(direction === "up" ? "footUp1" : "crutchDown1");
    const steps: number = 24;
    checks.check(
      `${label}: the injured foot stays above the sound foot's tread`,
      Array.from(
        { length: steps + 1 },
        (_v: unknown, k: number): number =>
          lifted + ((segment.end - lifted) * k) / steps,
      ).every(
        (t: number): boolean =>
          sole(INJURED, t) - sole(sound, t) > HumanFoot.BEARING,
      ),
    );

    // The climb's own bounds.
    motionActionUnit.bounds(checks, label, film, "a", segment);
  }
}
