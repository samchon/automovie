import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanArmGeometry
} from "../../../../packages/motions/src/posture/internal/HumanArmGeometry";
import type {
  HumanArmTrajectoryModel
} from "../../../../packages/motions/src/posture/internal/HumanArmTrajectoryModel";

/** Straight, axis-aligned arms and spherical colliders with dyadic lengths. */
export namespace armTrajectoryReading {
  /** A point on the common axis. */
  export function point(x: number): IAutoMovieVector3 {
    return { x, y: 0, z: 0 };
  }

  /** A sphere carried by the origin of its part. */
  export function sphere(radius: number): IAutoMoviePhysicalShape {
    return {
      id: "reading-sphere",
      kind: "sphere",
      radius,
      material: "rubber",
      transform: { position: point(0), rotation: AutoMovieEngineQuaternion.identity() },
    };
  }

  /** One arm's bind pose, with its wrist 3/8 m beyond the frame's parent. */
  export function setup(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanArmGeometry.ISetup {
    const setup: IAutoMovieMotionHumanArmGeometry.ISetup =
      HumanArmGeometry.prepare(body, side);
    const rest = (
      x: number,
    ): IAutoMovieMotionHumanArmGeometry.ISetup["rest"]["upper"] => ({
      translation: point(x),
      rotation: AutoMovieEngineQuaternion.identity(),
      scale: { x: 1, y: 1, z: 1 },
    });
    return {
      ...setup,
      rest: { upper: rest(0), lower: rest(1 / 4), hand: rest(1 / 8) },
    };
  }

  /** Hand part index in the setup's borrowed audit model. */
  export function hand(setup: IAutoMovieMotionHumanArmGeometry.ISetup): number {
    return setup.body.tangle.parts.findIndex(
      (part) => part.bone === setup.bones.hand,
    );
  }

  /** A frame with zero or more hand probes and no other moving part. */
  export function frame(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    wrist: number,
    offsets: readonly number[],
    radius?: number,
  ): IAutoMovieMotionHumanArmGeometry.IFrame {
    const part: number = hand(setup);
    const empty = { centre: point(0), radius: 0 };
    const centre: number =
      offsets.reduce((sum, x) => sum + x, 0) / Math.max(1, offsets.length);
    return {
      parent: {
        position: point(wrist - 3 / 8),
        rotation: AutoMovieEngineQuaternion.identity(),
      },
      tip: point(0),
      surface: offsets.map(point),
      owners: offsets.map(() => "hand"),
      segments: offsets.map(() => part),
      corners: offsets.map((_, i) => i),
      bounds: {
        upper: empty,
        lower: empty,
        hand: {
          centre: point(centre),
          radius: Math.max(0, ...offsets.map((x) => Math.abs(x - centre))),
        },
      },
      related: [],
      resting: new Set<number>(),
      colliders:
        radius === undefined
          ? []
          : [
              {
                owner: "hand",
                bone: setup.bones.hand,
                part,
                pose: { position: point(0), rotation: AutoMovieEngineQuaternion.identity() },
                shapes: [sphere(radius)],
              },
            ],
      shapes: [],
      body: [],
    };
  }

  /** A stationary or timed reading without task or collision exemptions. */
  export function context(
    setups: IAutoMovieMotionHumanArmGeometry.ISetup[],
    frames: IAutoMovieMotionHumanArmGeometry.IFrame[][],
    times: readonly number[],
    still: boolean,
  ): HumanArmTrajectoryModel.IContext {
    const free: number[][] = setups.map((setup) =>
      setup.free.flatMap((free, index) => (free ? [index] : [])),
    );
    const offset: number[] = [];
    let width: number = 0;
    for (const coordinates of free) {
      offset.push(width);
      width += coordinates.length;
    }
    return {
      n: times.length,
      still,
      open: true,
      times,
      speed: () => Infinity,
      setups,
      frames,
      sites: frames.map((arm) => arm.map(() => undefined)),
      rest: frames.map(zero),
      back: frames.map(zero),
      free,
      offset,
      width,
      bounds: setups.map(() => zero().map(() => null)),
      allowed: () => 0,
      between: () => 0,
      grasped: () => undefined,
      inside: () => 0,
      lying: () => false,
      normals: frames.map((arm) => arm.map(() => undefined)),
      rested: () => false,
      touched: frames.map((arm) => arm.map(() => -1)),
      siteHeights: frames.map((arm) => arm.map(() => undefined)),
      reachable: frames.map((arm) =>
        arm.map((frame) => frame.shapes.map((_, i) => i)),
      ),
    };
  }

  /** The straight arm's coordinates, with the three joints at rest. */
  export function zero(): number[] {
    return [0, 0, 0, 0, 0, 0, 0, 0, 0];
  }
}
