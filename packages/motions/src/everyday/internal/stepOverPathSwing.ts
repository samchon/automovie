import { Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClearance,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanClearance } from "../../compose/internal/AutoMovieMotionHumanClearance";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import type { HumanFootRotation } from "../../posture/internal/HumanFootRotation";
import type { HumanFrame } from "../../posture/internal/HumanFrame";
import type { HumanObstacle } from "./HumanObstacle";
import { stepOver } from "./stepOver";
import type { stepOverPath } from "./stepOverPath";

/**
 * A step over's swings (`stepOverPath`): the heights each sole must clear over
 * the obstacle and the floor either side, a foot pitched about its flat ball,
 * the lead sockets' approach and departure ramps, and each swing's shortest
 * path over them, the taut string over the obstacle
 * (`AutoMovieMotionHumanClearance`), the foot leveling and the lead toes
 * lifting as they pass the near side. Read from the crossing's body, feet,
 * obstacle, frame and footprints.
 *
 * @param scope What the crossing's swings are laid from.
 * @returns The swing readers.
 */
export function stepOverPathSwing(
  scope: stepOverPathSwing.IScope,
): stepOverPathSwing.ISwing {
  const {
    body,
    obstacle,
    origin,
    framed,
    near,
    far,
    ground,
    lead,
    trail,
    feet,
    end,
    heading,
    pitched,
    flat,
  }: stepOverPathSwing.IScope = scope;
  // Each swing takes the shortest path over what its sole must clear, the
  // taut string over the obstacle (`AutoMovieMotionHumanClearance`): every
  // sole point over the obstacle at least `MARGIN` above its top and every
  // other one on or above the floor. The trail foot leaves from its ball,
  // pitched as the pelvis left it, and levels by the time its toe reaches
  // the near side; the lead foot lifts its toes by up to `TOE_UP` as its
  // toe passes over the near side and is level again once its heel does,
  // so the ankle need not rise as high as a level foot's.
  // The lead sole clears the top by `MARGIN`, the trail sole by `TRAIL`.
  const top: (side: AutoMovieHumanSide) => number = (
    side: AutoMovieHumanSide,
  ): number =>
    obstacle.at.y -
    origin.y +
    obstacle.height +
    (side === lead ? stepOver.MARGIN : stepOver.TRAIL);
  const mtp: Record<
    AutoMovieHumanSide,
    ReturnType<typeof HumanFoot.preparePoint>
  > = {
    left: HumanFoot.preparePoint(body, "left", "mtp"),
    right: HumanFoot.preparePoint(body, "right", "mtp"),
  };
  const rocking: Record<
    AutoMovieHumanSide,
    ReturnType<typeof HumanFoot.preparePivot>
  > = {
    left: HumanFoot.preparePivot(
      body,
      "left",
      "mtp",
      mtp.left(flat("left", feet.left)),
      heading("left"),
    ),
    right: HumanFoot.preparePivot(
      body,
      "right",
      "mtp",
      mtp.right(flat("right", feet.right)),
      heading("right"),
    ),
  };
  const heeled: stepOverPath.IPlan["heeled"] = (
    side: AutoMovieHumanSide,
    ankle: IAutoMovieVector3,
    pitch: number,
  ): IAutoMovieMotionHumanFoot.IPlacement =>
    pitch === 0
      ? flat(side, ankle)
      : rocking[side](pitch, mtp[side](flat(side, ankle)));
  const surface: (side: AutoMovieHumanSide, z: number) => number = (
    side: AutoMovieHumanSide,
    z: number,
  ): number => (z >= near && z <= far ? top(side) : z > far ? ground : 0);
  const sockets: Record<
    AutoMovieHumanSide,
    ReturnType<typeof HumanFoot.preparePoint>[]
  > = {
    left: HumanFoot.SOCKETS.map(
      (
        point: IAutoMovieMotionHumanFoot.Socket,
      ): ReturnType<typeof HumanFoot.preparePoint> =>
        HumanFoot.preparePoint(body, "left", point),
    ),
    right: HumanFoot.SOCKETS.map(
      (
        point: IAutoMovieMotionHumanFoot.Socket,
      ): ReturnType<typeof HumanFoot.preparePoint> =>
        HumanFoot.preparePoint(body, "right", point),
    ),
  };
  const sole: (
    side: AutoMovieHumanSide,
    pitch: number,
  ) => IAutoMovieMotionHumanClearance.IPoint[] = (
    side: AutoMovieHumanSide,
    pitch: number,
  ): IAutoMovieMotionHumanClearance.IPoint[] => {
    const foot: IAutoMovieMotionHumanFoot.IPlacement = {
      ankle: origin,
      rotation: pitched[side](pitch),
    };
    return sockets[side].map(
      (
        point: ReturnType<typeof HumanFoot.preparePoint>,
      ): IAutoMovieMotionHumanClearance.IPoint => {
        const at: IAutoMovieVector3 = framed.local(point(foot));
        return { z: at.z, y: at.y };
      },
    );
  };
  const smooth: stepOverPath.IPlan["smooth"] = (
    x: number,
    a: number,
    b: number,
  ): number =>
    b <= a
      ? x >= b
        ? 1
        : 0
      : AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, Math.max(0, (x - a) / (b - a))));
  // A foot that leaves pitched levels as its toe comes up to the near
  // side, or as it rises to the obstacle's top where its toe starts at the
  // near side and has no way along to level over: whichever is further.
  // Leveling sooner only lifts a toes-down toe, so the required heights,
  // read along the way alone, stay cleared.
  const pitches: (
    side: AutoMovieHumanSide,
    start: number,
    from: number,
  ) => (z: number, rise?: number) => number = (
    side: AutoMovieHumanSide,
    start: number,
    from: number,
  ): ((z: number, rise?: number) => number) => {
    const level: IAutoMovieMotionHumanClearance.IPoint[] = sole(side, 0);
    const toe: number = near - level[2]!.z;
    const heel: number = near - level[0]!.z;
    return (z: number, rise: number = 0): number => {
      const along: number = toe > from ? smooth(z, from, toe) : 0;
      return (
        start * (1 - Math.max(along, rise)) +
        (side === lead ? stepOver.TOE_UP * (along - smooth(z, toe, heel)) : 0)
      );
    };
  };
  const trailRadius: number = Math.max(
    ...HumanFoot.SOCKETS.map((socket): number =>
      Vector3.length(HumanFoot.offset(body, trail, socket)),
    ),
  );
  const departure: number = heeled(trail, feet[trail], -stepOver.PUSH).ankle.y;
  const summit: number = origin.y + top(trail) + trailRadius;
  // The straight approach and departure on either side of the obstacle
  // join each lead socket's own flat footprints to its full clearance.
  const leadTop: number = top(lead);
  const envelope = (
    socket: IAutoMovieMotionHumanFoot.Socket,
  ): ((z: number) => number) => {
    const start: number = framed.local(
      HumanFoot.point(body, lead, socket, flat(lead, feet[lead])),
    ).z;
    const finish: number = framed.local(
      HumanFoot.point(body, lead, socket, flat(lead, end[lead])),
    ).z;
    return (z: number): number => {
      if (z < near)
        return near > start
          ? leadTop * Math.max(0, (z - start) / (near - start))
          : 0;
      if (z > far)
        return finish > far
          ? ground +
              (leadTop - ground) * Math.max(0, (finish - z) / (finish - far))
          : ground;
      return leadTop;
    };
  };
  const envelopes: Record<
    IAutoMovieMotionHumanFoot.Socket,
    (z: number) => number
  > = {
    heel: envelope("heel"),
    ball: envelope("ball"),
    toe: envelope("toe"),
  };
  const path: (
    side: AutoMovieHumanSide,
    start: number,
  ) => (u: number) => IAutoMovieMotionHumanFoot.IPlacement = (
    side: AutoMovieHumanSide,
    start: number,
  ): ((u: number) => IAutoMovieMotionHumanFoot.IPlacement) => {
    const a: IAutoMovieVector3 = framed.local(
      heeled(side, feet[side], start).ankle,
    );
    const pitch: (z: number, rise?: number) => number = pitches(
      side,
      start,
      a.z,
    );
    const b: IAutoMovieVector3 = framed.local(end[side]);
    const across: number = b.x - a.x;
    const forward: number = Math.max(1e-9, b.z - a.z);
    // The folded trail shank turns the foot through a large arc. Its
    // measured ankle-to-socket radius bounds every pitch and heading.
    const line: ReturnType<typeof AutoMovieMotionHumanClearance.path> =
      AutoMovieMotionHumanClearance.path(
        { z: a.z, y: a.y },
        { z: b.z, y: b.y },
        (z: number): number => {
          let height: number = -Infinity;
          // The lead also clears its sockets' approach and departure ramps
          // here, so the correction rounds never take hold mid-swing and
          // kink its path.
          sole(side, pitch(z)).forEach(
            (point: IAutoMovieMotionHumanClearance.IPoint, k: number): void => {
              height = Math.max(
                height,
                surface(side, z + point.z) - point.y,
                side === lead
                  ? envelopes[HumanFoot.SOCKETS[k]!](z + point.z) - point.y
                  : -Infinity,
              );
            },
          );
          if (side === lead) return height;
          const gap: number = Math.max(near - z, z - far, 0);
          return gap < trailRadius
            ? Math.max(
                height,
                top(side) + Math.sqrt(trailRadius * trailRadius - gap * gap),
              )
            : height;
        },
      );
    return (u: number): IAutoMovieMotionHumanFoot.IPlacement => {
      const at: IAutoMovieMotionHumanClearance.IPoint = line(
        AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, Math.max(0, u))),
      );
      return {
        ankle: framed.point({
          x: a.x + (across * (at.z - a.z)) / forward,
          y: at.y,
          z: at.z,
        }),
        rotation: pitched[side](pitch(at.z, smooth(at.y, a.y, top(side)))),
      };
    };
  };

  return { top, heeled, surface, smooth, departure, summit, envelopes, path };
}

/** What a step over's swings read and what they are. */
export namespace stepOverPathSwing {
  /** What a crossing lays its swings from. */
  export interface IScope {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The obstacle. */
    obstacle: HumanObstacle.IObstacle;

    /** The feet's middle on the floor. */
    origin: IAutoMovieVector3;

    /** The crossing's frame. */
    framed: HumanFrame.IPrepared;

    /** The obstacle's near side along the heading, metres. */
    near: number;

    /** The obstacle's far side along the heading, metres. */
    far: number;

    /** The landing surface's height, metres. */
    ground: number;

    /** The leading foot. */
    lead: AutoMovieHumanSide;

    /** The trailing foot. */
    trail: AutoMovieHumanSide;

    /** The starting ankles. */
    feet: Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /** The ending ankles. */
    end: Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /**
     * A foot's heading.
     *
     * @param side The foot.
     * @returns The heading, degrees.
     */
    heading: (side: AutoMovieHumanSide) => number;

    /** Each foot's pitched rotation (`HumanFootRotation.prepare`). */
    pitched: Record<
      AutoMovieHumanSide,
      ReturnType<typeof HumanFootRotation.prepare>
    >;

    /** A flat foot (`stepOverPath.IPlan.flat`). */
    flat: stepOverPath.IPlan["flat"];
  }

  /** The swing readers. */
  export interface ISwing {
    /**
     * The height a sole clears over the obstacle, from the floor.
     *
     * @param side The foot.
     * @returns The height, metres.
     */
    top: (side: AutoMovieHumanSide) => number;

    /** A foot pitched about its flat ball (`stepOverPath.IPlan.heeled`). */
    heeled: stepOverPath.IPlan["heeled"];

    /**
     * The surface a foot's sole is over along the heading.
     *
     * @param side The foot.
     * @param z The distance along the heading, metres.
     * @returns The surface's height, metres.
     */
    surface: (side: AutoMovieHumanSide, z: number) => number;

    /** The bounded minimum-jerk share (`stepOverPath.IPlan.smooth`). */
    smooth: stepOverPath.IPlan["smooth"];

    /** The trail ankle's height as it leaves, metres. */
    departure: number;

    /** The trail ankle's height over the obstacle, metres. */
    summit: number;

    /** Each lead socket's least height along the heading. */
    envelopes: Record<IAutoMovieMotionHumanFoot.Socket, (z: number) => number>;

    /**
     * A foot's swing from a pitch.
     *
     * @param side The foot.
     * @param start The foot's pitch as it leaves, degrees.
     * @returns The foot at a share of the swing.
     */
    path: (
      side: AutoMovieHumanSide,
      start: number,
    ) => (u: number) => IAutoMovieMotionHumanFoot.IPlacement;
  }
}
