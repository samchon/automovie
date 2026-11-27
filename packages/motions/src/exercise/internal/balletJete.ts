import { AutoMovieGravity, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBallet,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieMotionHumanDanceCourse,
  IAutoMovieMotionHumanDanceFootKey,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import { ExerciseKey } from "../ExerciseKey";
import { balletPositions } from "./balletPositions";

/**
 * A grand jeté: a leap from the supporting foot onto the leading one, the legs
 * split at the flight's apex.
 *
 * Before the first beat the dancer sinks into a plié over the supporting foot
 * while the leading leg brushes forward; over `PUSH` seconds the hips drive up
 * and forward to the take-off velocity, the supporting heel rising onto the
 * ball, and leave at the first beat. The flight is ballistic: it rises `APEX`
 * hip heights and travels `TRAVEL` hip heights, its time `2 sqrt(2 g h) / g`.
 * Through it the legs open from the take-off (the leading hip flexed `OPEN`,
 * the other extended `OPEN`) to the authored split at the apex, shared evenly
 * between the leading hip's flexion and the other's extension, and close toward
 * the landing, the leading leg reaching down to land `LAND` degrees ahead of
 * the hips. Each foot is pointed `POINT` degrees past its neutral. The leading
 * foot lands flat; the knee gives over `ABSORB` seconds and the other foot
 * closes behind in fourth.
 *
 * The flight is closed form from the take-off; the legs' angles are provisional
 * readings of Laws (Physics and the Art of Dance, 2002), whose apparent float
 * comes from raising the legs at the apex.
 */
export namespace balletJete {
  /** The flight's rise, hip heights (provisional). */
  export const APEX: number = 0.3;

  /** The flight's travel, hip heights (provisional). */
  export const TRAVEL: number = 1.4;

  /** The push from plié to take-off, seconds (provisional). */
  export const PUSH: number = 0.3;

  /** The landing's give, seconds (provisional). */
  export const ABSORB: number = 0.35;

  /**
   * The legs' opening at take-off and at landing, degrees each from the
   * vertical.
   */
  export const OPEN: number = 30;

  /**
   * The leading leg's reach ahead of the hips at landing, degrees from the
   * vertical.
   */
  export const LAND: number = 12;

  /** The feet's pointe beyond neutral, degrees. */
  export const POINT: number = 50;

  /**
   * The plié's sink before the push and after the landing, a share of the full
   * plié.
   */
  export const SINK: number = 0.6;

  /**
   * The course of a grand jeté.
   *
   * @param context The action's context.
   * @param beats The beat clock.
   * @returns The course.
   */
  export function course(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBallet.IParams>,
    beats: IAutoMovieMotionHumanDanceBeats,
  ): IAutoMovieMotionHumanDanceCourse {
    const p: IAutoMovieMotionHumanBallet.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const g: number = AutoMovieGravity.STANDARD;
    const l: number = body.measure.hipHeight;
    const leg: number = 0.98 * (body.measure.thigh + body.measure.shank);
    const leading: AutoMovieHumanSide = p.side ?? "right";
    const other: AutoMovieHumanSide = leading === "left" ? "right" : "left";
    const split: number = p.split ?? 150;
    const yaw: number = entry.yaw;
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const left: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 1, y: 0, z: 0 },
    );

    // Timing: plié, push, flight, landing, closing.
    const take: number = beats.at(1);
    const push: number = Math.min(PUSH, 0.5 * take);

    // The hips: over the supporting foot in plié, up to the take-off
    // point, ballistic, then down into the landing's plié.
    const standing: IAutoMovieVector3 = balletPositions.hips(body, entry);
    const sink: number = SINK * balletPositions.drop(body);
    const base: IAutoMovieVector3 = context.entry.feet[other].ankle;
    const crouched: IAutoMovieVector3 = {
      x: base.x,
      y: standing.y - sink,
      z: base.z,
    };
    const taken: IAutoMovieVector3 = Vector3.add(
      { x: base.x, y: standing.y, z: base.z },
      Vector3.scale(forward, 0.1 * l),
    );
    // The flight: up APEX from the take-off and down to the height at
    // which the leading leg, LAND degrees ahead, meets the floor.
    const half: number = Math.abs(body.rest.get("leftUpperLeg")!.x);
    const drop: number =
      body.rest.get("hips")!.y - body.rest.get("leftUpperLeg")!.y;
    const floor: number = context.entry.feet[leading].ankle.y;
    const down: number = floor + leg * Math.cos((LAND * Math.PI) / 180) + drop;
    const lift: number = Math.sqrt(2 * g * APEX * l);
    const flight: number =
      (lift + Math.sqrt(lift * lift + 2 * g * Math.max(0, taken.y - down))) / g;
    const land: number = take + flight;
    const settled: number = land + ABSORB;
    const end: number = settled + beats.period;
    const vx: number = (TRAVEL * l) / flight;
    const velocity: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(forward, vx),
      { x: 0, y: lift, z: 0 },
    );
    const ballistic: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 => {
      const s: number = t - take;
      return Vector3.add(taken, {
        x: velocity.x * s,
        y: lift * s - 0.5 * g * s * s,
        z: velocity.z * s,
      });
    };
    const landed: IAutoMovieVector3 = ballistic(land);
    const landing: IAutoMovieVector3 = {
      x: velocity.x,
      y: -lift,
      z: velocity.z,
    };
    const absorbed: IAutoMovieVector3 = Vector3.add(
      { ...landed, y: landed.y - sink },
      Vector3.scale(forward, 0.1 * l),
    );
    const hips: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 => {
      if (t <= take - push)
        return Vector3.lerp(
          standing,
          crouched,
          minimumJerk.share(t / (take - push)),
        );
      if (t <= take)
        return hermite(crouched, zero(), taken, velocity, take - push, take, t);
      if (t <= land) return ballistic(t);
      if (t <= settled)
        return hermite(landed, landing, absorbed, zero(), land, settled, t);
      return Vector3.lerp(
        absorbed,
        { ...absorbed, y: absorbed.y + sink },
        minimumJerk.share((t - settled) / (end - settled)),
      );
    };

    // The legs in flight: from the hip joints along their angles.
    const joint: (side: AutoMovieHumanSide, t: number) => IAutoMovieVector3 = (
      side: AutoMovieHumanSide,
      t: number,
    ): IAutoMovieVector3 =>
      Vector3.add(
        Vector3.add(
          hips(t),
          Vector3.scale(left, side === "left" ? half : -half),
        ),
        { x: 0, y: -drop, z: 0 },
      );
    const apex: number = (take + land) / 2;
    const angle: (front: boolean, t: number) => number = (
      front: boolean,
      t: number,
    ): number => {
      const top: number = split / 2;
      const u: number = (t - take) / (apex - take);
      if (t <= apex)
        return (
          OPEN + (top - OPEN) * minimumJerk.share(Math.max(0, Math.min(1, u)))
        );
      // The leading leg reaches down to land; the other stays extended
      // behind at the split's half through the landing, as a grand jeté
      // lands in arabesque, and closes from there to fourth behind over the
      // give and the closing beat: closed to `OPEN` by the landing, its
      // pointed foot reached the floor as the knee gave.
      return front
        ? top +
            (LAND - top) *
              minimumJerk.share(
                Math.max(0, Math.min(1, (t - apex) / (land - apex))),
              )
        : top;
    };
    const airborne: (
      side: AutoMovieHumanSide,
      t: number,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      side: AutoMovieHumanSide,
      t: number,
    ): IAutoMovieMotionHumanFoot.IPlacement => {
      const front: boolean = side === leading;
      const a: number = angle(front, t);
      const r: number = (a * Math.PI) / 180;
      const direction: IAutoMovieVector3 = Vector3.add(
        Vector3.scale(forward, (front ? 1 : -1) * Math.sin(r)),
        { x: 0, y: -Math.cos(r), z: 0 },
      );
      const ankle: IAutoMovieVector3 = Vector3.add(
        joint(side, t),
        Vector3.scale(direction, leg),
      );
      return {
        ankle,
        rotation: HumanFoot.rotation(yaw, front ? a - POINT : -a - POINT),
      };
    };

    // The landing foot flat beneath the landed leg; the other closes behind.
    const touch: IAutoMovieMotionHumanFoot.IPlacement = {
      ankle: { ...airborne(leading, land).ankle, y: floor },
      rotation: HumanFoot.rotation(yaw, 0),
    };
    const behind: IAutoMovieMotionHumanFoot.IPlacement = {
      ankle: Vector3.add(
        Vector3.add(
          touch.ankle,
          Vector3.scale(
            forward,
            -balletPositions.FOURTH * body.measure.footLength,
          ),
        ),
        Vector3.scale(left, (leading === "left" ? -1 : 1) * 2 * half),
      ),
      rotation: HumanFoot.rotation(yaw, 0),
    };
    const ball: (t: number) => IAutoMovieMotionHumanFoot.IPlacement = (
      t: number,
    ): IAutoMovieMotionHumanFoot.IPlacement =>
      balletPositions.risen(
        body,
        other,
        stood(other).place,
        t <= take - push
          ? 0
          : minimumJerk.share(Math.min(1, (t - (take - push)) / push)),
      );
    const stood: (
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanDanceFootKey = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanDanceFootKey => ({
      at: 0,
      leave: 0.4 * (take - push),
      place: {
        ankle: context.entry.feet[side].ankle,
        rotation: context.entry.feet[side].rotation,
      },
      bears: true,
      clearance: 0,
    });
    const blend: number = 0.15 * flight;
    const arms: IAutoMovieMotionHumanPosture["joints"] = ExerciseKey.from(
      body,
      { pitch: -5 },
      {},
      leading === "left"
        ? { shoulder: 110, raise: 20, elbow: 10 }
        : { shoulder: 10, raise: 85, elbow: 10 },
      leading === "left"
        ? { shoulder: 10, raise: 85, elbow: 10 }
        : { shoulder: 110, raise: 20, elbow: 10 },
    ).joints;
    const course: IAutoMovieMotionHumanDanceCourse = {
      duration: end,
      left: [],
      right: [],
      hips,
      yaw: (): number => yaw,
      joints: (): IAutoMovieMotionHumanPosture["joints"] => arms,
      instants: [
        { name: "push", seconds: take - push },
        { name: "takeoff", seconds: take },
        { name: "apex", seconds: apex },
        { name: "landing", seconds: land },
        { name: "relax", seconds: settled },
      ],
    };
    course[leading] = [
      stood(leading),
      {
        at: take,
        leave: land - blend,
        place: airborne(leading, take),
        bears: false,
        clearance: 0.05 * l,
        hold: (t: number): IAutoMovieMotionHumanFoot.IPlacement =>
          airborne(leading, t),
      },
      { at: land, leave: end, place: touch, bears: true, clearance: 0 },
    ];
    course[other] = [
      { ...stood(other), leave: take - push },
      {
        at: take - push,
        leave: take,
        place: ball(take - push),
        bears: true,
        clearance: 0,
        hold: ball,
      },
      {
        at: take + blend,
        leave: land + 0.5 * ABSORB,
        place: airborne(other, take + blend),
        bears: false,
        clearance: 0,
        hold: (t: number): IAutoMovieMotionHumanFoot.IPlacement =>
          airborne(other, t),
      },
      {
        at: end,
        leave: end,
        place: behind,
        bears: true,
        clearance: 0.05 * l,
      },
    ];
    return course;
  }

  /** The zero vector. */
  function zero(): IAutoMovieVector3 {
    return { x: 0, y: 0, z: 0 };
  }

  /**
   * A cubic Hermite between two points with their velocities over a span, read
   * at a second.
   */
  function hermite(
    a: IAutoMovieVector3,
    va: IAutoMovieVector3,
    b: IAutoMovieVector3,
    vb: IAutoMovieVector3,
    from: number,
    to: number,
    t: number,
  ): IAutoMovieVector3 {
    const d: number = to - from;
    const s: number = Math.max(0, Math.min(1, (t - from) / d));
    const h00: number = 2 * s * s * s - 3 * s * s + 1;
    const h10: number = s * s * s - 2 * s * s + s;
    const h01: number = -2 * s * s * s + 3 * s * s;
    const h11: number = s * s * s - s * s;
    return Vector3.add(
      Vector3.add(Vector3.scale(a, h00), Vector3.scale(va, h10 * d)),
      Vector3.add(Vector3.scale(b, h01), Vector3.scale(vb, h11 * d)),
    );
  }
}
