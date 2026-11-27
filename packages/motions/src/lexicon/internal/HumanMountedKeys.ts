import {
  Quaternion,
  Vector3,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanMountRider } from "./HumanMountRider";
import { HumanMountedBank } from "./HumanMountedBank";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanMountedPaths } from "./HumanMountedPaths";
import { HumanMountedSeats } from "./HumanMountedSeats";
import { HumanMountedStirrups } from "./HumanMountedStirrups";

/**
 * A mounted performance's keys, solved once in the carrier contact's frame as
 * it stands at the start: each figure's key posture (`HumanMountedSeats`,
 * `HumanMountedStirrups`), its trunk leant forward as far as brings its holding
 * hands in reach (`HumanMountRider.lean`) or set by a bank seat
 * (`HumanMountedBank`), the hips at each key, each transfer's leg arcs over the
 * carrier (`HumanMountedPaths.arcs`) and the ball each foot kept on its rest
 * pivots about.
 *
 * @param context The mounted performance's context.
 * @param support The carrier's reader.
 * @param origin The carrier contact's frame at the start, world.
 * @param placed The carrier's own frame at the start, world.
 * @param entry The entry posture in the contact's frame, unarmed.
 * @param slack How far the carrier strays from its stride-averaged path.
 * @param planted The entry's planted feet.
 * @returns The seat context, the keys and their transfer paths.
 */
export function HumanMountedKeys(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanMounted>,
  support: IAutoMovieMotionHumanPropReader,
  origin: IAutoMovieRigidTransform,
  placed: IAutoMovieRigidTransform,
  entry: IAutoMovieMotionHumanPosture,
  slack: number,
  planted: Record<AutoMovieHumanSide, boolean>,
): HumanMountedKeys.IKeys {
  const back: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      Quaternion.inverse(origin.rotation),
      Vector3.subtract(point, origin.position),
    );
  const world: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.add(
      origin.position,
      Quaternion.rotateVector(origin.rotation, point),
    );
  const seats: HumanMountedSeats.IContext = {
    body: context.body,
    entry,
    slack,
    point: (id: string): IAutoMovieVector3 =>
      back(HumanMountedFrame.contact(support, id, context.start)),
    contact: (id: string): IAutoMovieAffordance =>
      support.prop.affordances!.find(
        (a: IAutoMovieAffordance): boolean => a.id === id,
      )!,
    clear: (a: IAutoMovieVector3, b: IAutoMovieVector3): number => {
      let least: number = Infinity;
      for (const shape of support.prop.shapes ?? [])
        least = Math.min(
          least,
          AutoMovieEnginePhysics.physicalShapeSegmentDistance(placed, shape, world(a), world(b)),
        );
      return least;
    },
  };
  // A figure whose hands hold leans its trunk as far forward as brings them in reach, as the ride does (`HumanMountRider.lean`).
  const keys: IAutoMovieMotionHumanPosture[] = context.params.figures.map(
    (
      figure: IAutoMovieMotionHumanMounted.IFigure,
    ): IAutoMovieMotionHumanPosture => {
      const key: IAutoMovieMotionHumanPosture = HumanMountedPaths.unarmed(
        HumanMountedStirrups.free(figure.seat)
          ? HumanMountedStirrups.solve(seats, figure.supports!, figure.seat)
          : figure.seat === "aside"
            ? HumanMountedSeats.aside(seats, figure.supports!)
            : figure.seat === "bench"
              ? HumanMountedSeats.bench(seats, figure.supports!)
              : figure.seat === "basic"
                ? HumanMountedSeats.basic(seats)
                : HumanMountedPaths.entered(
                    context.body,
                    entry,
                    figure,
                    planted,
                  ),
      );
      const points: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
      for (const side of ["left", "right"] as const) {
        const id: string | undefined = figure.supports?.[`${side}Hand`];
        if (id !== undefined) points[side] = seats.point(id);
      }
      // A bank seat sets its own trunk, kept in space; its hands take the reins where they are.
      return HumanMountedBank.bank(figure.seat)
        ? HumanMountedBank.key(context.body, figure.seat, key)
        : HumanMountRider.leant(
            key,
            HumanMountRider.lean(context.body, key, points),
          );
    },
  );

  const hipsOf: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieVector3 = (
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 => HumanMountedPaths.hips(context.body, posture);
  const middles: IAutoMovieVector3[] = keys.map(hipsOf);
  const arcs: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>[] =
    HumanMountedPaths.arcs(seats, entry, keys, context.params.figures, planted);
  // The ball each foot kept on its rest pivots about through each transfer.
  const pivots: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>[] =
    keys.map(
      (
        key: IAutoMovieMotionHumanPosture,
        i: number,
      ): Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> => {
        const out: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
        for (const side of ["left", "right"] as const) {
          const ball: IAutoMovieVector3 | undefined = HumanMountedPaths.rested(
            i === 0 ? entry : keys[i - 1]!,
            key,
            side,
          );
          if (ball !== undefined) out[side] = ball;
        }
        return out;
      },
    );
  return { seats, keys, middles, arcs, pivots };
}

/** The records of HumanMountedKeys. */
export namespace HumanMountedKeys {
  /**
   * A mounted performance's keys and their transfer paths, in the carrier
   * contact's frame at the start.
   */
  export interface IKeys {
    /** The seats' reading context. */
    seats: HumanMountedSeats.IContext;

    /** Each figure's key posture. */
    keys: IAutoMovieMotionHumanPosture[];

    /** The hips at each key, metres. */
    middles: IAutoMovieVector3[];

    /** Each transfer's leg arcs over the carrier, metres, by side. */
    arcs: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>[];

    /** The ball each foot kept on its rest pivots about, metres, by side. */
    pivots: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>[];
  }
}
