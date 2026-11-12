import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMoviePhysicalProfile,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../../body/IHumanBody";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/AutoMovieMotionHumanTouchEffector";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanColliders } from "../../posture/HumanColliders";
import type { HumanHand } from "../../posture/HumanHand";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import type { humanPolygonMan } from "../humanPolygonMan";

/**
 * Measures of a touch on displayed poses, shared by the touch families'
 * capture cases (#3234, #3284, #3285): where an effector is against the
 * region it touches, how far the acting forearm enters the rest of the body,
 * and how many times the effector comes down on the region.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each measure reads and on which poses.
 * @evidence contracts/development/implementation.md#principled-implementation Every measure reads the performance's displayed bones: the effector through the touch generator's own point, the region through the engine's surface placement and the colliders through `HumanColliders.placed`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One small measure per question, one verdict builder and the drawing helpers the touch cases share.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No measure reads a law's goal; the colliders are read only through `HumanColliders` queries.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the sampled frames; the forearm entry is one segment query per frame.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Run once per capture.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace TouchVerdicts {
  /** A region read on a displayed pose: whose bones and which region. */
  export interface IRegion {
    /** The performer the region belongs to. */
    subject: string;

    /** That performer's body. */
    body: IHumanBody;

    /** The region. */
    region: AutoMovieHumanoidRegion;
  }

  /**
   * A region's world point and normal at a film second.
   *
   * @param performance The performance.
   * @param region The region.
   * @param seconds Film seconds.
   * @returns The point and normal.
   */
  export function place(
    performance: HumanPerformance,
    region: IRegion,
    seconds: number,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    const frame = region.body.surfaces.regions[region.region];
    const placed = resolveAutoMovieHumanoidSurfaces.place(
      frame,
      performance.bones(region.subject, seconds).get(frame.bone)!,
    );
    return { point: placed.point, normal: placed.normal };
  }

  /**
   * The distance from an effector to where it should be on a region (the
   * region's point stood off along its normal), metres, at a film second.
   *
   * @param performance The performance.
   * @param subject The acting performer.
   * @param body Their body.
   * @param side The acting hand.
   * @param effector The effector.
   * @param region The region.
   * @param standoff The stand-off along the normal, metres.
   * @param seconds Film seconds.
   * @returns Metres.
   */
  export function miss(
    performance: HumanPerformance,
    subject: string,
    body: IHumanBody,
    side: HumanHand.Side,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    region: IRegion,
    standoff: number,
    seconds: number,
  ): number {
    const at = place(performance, region, seconds);
    const want: IAutoMovieVector3 = Vector3.add(
      at.point,
      Vector3.scale(Vector3.normalize(at.normal), standoff),
    );
    return Vector3.length(
      Vector3.subtract(
        AutoMovieMotionHumanTouchEffector.point(
          body,
          performance.bones(subject, seconds),
          side,
          effector,
        ),
        want,
      ),
    );
  }

  /**
   * How far an effector is off a region's surface along the region's normal,
   * past its stand-off, metres (positive above, negative inside), at a film
   * second: the measure of an effector that travels along the surface.
   *
   * @param performance The performance.
   * @param subject The acting performer.
   * @param body Their body.
   * @param side The acting hand.
   * @param effector The effector.
   * @param region The region.
   * @param standoff The stand-off along the normal, metres.
   * @param seconds Film seconds.
   * @returns Metres.
   */
  export function off(
    performance: HumanPerformance,
    subject: string,
    body: IHumanBody,
    side: HumanHand.Side,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    region: IRegion,
    standoff: number,
    seconds: number,
  ): number {
    const at = place(performance, region, seconds);
    return (
      Vector3.dot(
        Vector3.subtract(
          AutoMovieMotionHumanTouchEffector.point(
            body,
            performance.bones(subject, seconds),
            side,
            effector,
          ),
          at.point,
        ),
        Vector3.normalize(at.normal),
      ) - standoff
    );
  }

  /**
   * The verdict that an effector stays within a limit of its place on a
   * region at every given instant.
   *
   * @param name The check's name.
   * @param measure The miss at a film second, metres.
   * @param instants Film seconds.
   * @param limit Metres.
   * @returns The verdict, with the worst miss and its second.
   */
  export function within(
    name: string,
    measure: (seconds: number) => number,
    instants: readonly number[],
    limit: number,
  ): IMotionCaptureCase.IVerdict {
    let worst: number = 0;
    let when: number = instants[0] ?? 0;
    for (const t of instants) {
      const value: number = measure(t);
      if (value > worst) {
        worst = value;
        when = t;
      }
    }
    return {
      name,
      passed: worst <= limit,
      detail: `${(worst * 1000).toFixed(1)} mm at ${when.toFixed(2)} s (limit ${(limit * 1000).toFixed(1)} mm)`,
    };
  }

  /**
   * The deepest the acting forearm enters the colliders of a body, metres
   * (negative inside), over the 24 Hz grid of a window: the displayed
   * forearm collider's surface points and its axis against every segment but
   * the acting arm's own. The collider is read as drawn, so a wrist that
   * lies on the surface its palm is laid on reads the wrist's own thickness
   * and not a uniform radius.
   *
   * @param performance The performance.
   * @param subject The acting performer.
   * @param body Their body.
   * @param side The acting arm.
   * @param other The body entered and its subject (the performer's own, or a partner's).
   * @param from Film seconds.
   * @param to Film seconds.
   * @returns The least gap, metres, and its second.
   */
  export function entry(
    performance: HumanPerformance,
    subject: string,
    body: IHumanBody,
    side: HumanHand.Side,
    other: { subject: string; body: IHumanBody },
    from: number,
    to: number,
  ): { gap: number; at: number } {
    const own = (bone: AutoMovieHumanoidBone): boolean =>
      other.subject === subject &&
      bone.startsWith(side) &&
      !bone.endsWith("UpperLeg") &&
      !bone.endsWith("LowerLeg") &&
      !bone.endsWith("Foot") &&
      !bone.endsWith("Toes") &&
      bone !== `${side}Shoulder`;
    let best: { gap: number; at: number } = { gap: Infinity, at: from };
    for (let t: number = from; t <= to + 1e-9; t += 1 / 24) {
      const arm = performance.bones(subject, t);
      const a: IAutoMovieVector3 = arm.get(`${side}LowerArm`)!.worldPosition;
      const b: IAutoMovieVector3 = arm.get(`${side}Hand`)!.worldPosition;
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
        [...performance.bones(other.subject, t)].filter(
          ([bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): boolean =>
            !own(bone),
        ),
      );
      let d: number = HumanColliders.distanceToSegment(
        other.body,
        bones,
        a,
        b,
      ).distance;
      for (const segment of HumanColliders.placed(body, arm))
        if (segment.bone === `${side}LowerArm`)
          for (const shape of segment.shapes)
            for (const local of skin(shape)) {
              const point: IAutoMovieVector3 = Vector3.add(
                segment.pose.position,
                Quaternion.rotateVector(
                  segment.pose.rotation,
                  Vector3.add(
                    shape.transform.position,
                    Quaternion.rotateVector(shape.transform.rotation, local),
                  ),
                ),
              );
              d = Math.min(
                d,
                HumanColliders.distance(other.body, bones, point).distance,
              );
            }
      if (d < best.gap) best = { gap: d, at: t };
    }
    return best;
  }

  /**
   * How many times an effector comes down on its region in a window: the
   * local minima of its miss on a 96 Hz grid that lie within a limit. The
   * window's first sample is where the effector already lies, not a coming
   * down, and is not counted.
   *
   * @param measure The miss at a film second, metres.
   * @param from Film seconds.
   * @param to Film seconds.
   * @param limit Metres.
   * @returns The count.
   */
  export function touches(
    measure: (seconds: number) => number,
    from: number,
    to: number,
    limit: number,
  ): number {
    const step: number = 1 / 96;
    const values: number[] = [];
    for (let t: number = from; t <= to + 1e-9; t += step)
      values.push(measure(t));
    let n: number = 0;
    for (let i: number = 0; i < values.length; i++) {
      const v: number = values[i]!;
      const before: number = i === 0 ? -Infinity : values[i - 1]!;
      const after: number = i === values.length - 1 ? Infinity : values[i + 1]!;
      if (v <= limit && v <= before && v < after) n++;
    }
    return n;
  }

  /**
   * The drawn performer.
   *
   * @param performance The performance.
   * @param subject The performer.
   * @param man The polygon man.
   * @param color The colour; clay when absent.
   * @returns The figure.
   */
  export function figure(
    performance: HumanPerformance,
    subject: string,
    man: humanPolygonMan.IPolygonMan,
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

  /**
   * The film second of an event of a performer's first action.
   *
   * @param performance The performance.
   * @param subject The performer.
   * @param name The event.
   * @param index Which action of the performer; the first when absent.
   * @returns Film seconds.
   */
  export function event(
    performance: HumanPerformance,
    subject: string,
    name: string,
    index: number = 0,
  ): number {
    const segment = performance.segments(subject)[index]!;
    const found = segment.plan.events.find((e) => e.name === name);
    if (found === undefined)
      throw new Error(`The action ${segment.name} has no event ${name}`);
    return segment.start + found.share * segment.plan.duration;
  }

  /**
   * The whole performance at a fixed step, with named instants in their order.
   *
   * @param duration Seconds.
   * @param step Seconds.
   * @param named Instants with their captions.
   * @returns The drawn instants.
   */
  export function times(
    duration: number,
    step: number,
    named: [number, string][],
  ): IMotionCaptureCase.ITime[] {
    const out: IMotionCaptureCase.ITime[] = named.map(([seconds, label]) => ({
      seconds,
      label,
    }));
    const count: number = Math.ceil(duration / step - 1e-9);
    for (let i: number = 0; i <= count; i++) {
      const seconds: number = Math.min(duration, i * step);
      if (out.every((t) => Math.abs(t.seconds - seconds) > step / 4))
        out.push({ seconds, label: `${seconds.toFixed(2)} s` });
    }
    return out.sort((a, b) => a.seconds - b.seconds);
  }
}

/** Surface points of a collider shape in its own frame: a hull's vertices, a box's corners, and the six axis ends of a sphere or of each end and the middle of a capsule. */
const skin = (shape: IAutoMoviePhysicalProfile.IShape): IAutoMovieVector3[] => {
  if (shape.kind === "hull") return shape.points;
  if (shape.kind === "box") {
    const h: IAutoMovieVector3 = shape.halfExtents;
    return [-1, 1].flatMap((x: number): IAutoMovieVector3[] =>
      [-1, 1].flatMap((y: number): IAutoMovieVector3[] =>
        [-1, 1].map(
          (z: number): IAutoMovieVector3 => ({
            x: x * h.x,
            y: y * h.y,
            z: z * h.z,
          }),
        ),
      ),
    );
  }
  const r: number = shape.radius;
  const half: number = shape.kind === "capsule" ? shape.halfLength : 0;
  const rings: number[] = half === 0 ? [0] : [-half, 0, half];
  return [
    { x: 0, y: half + r, z: 0 },
    { x: 0, y: -half - r, z: 0 },
    ...rings.flatMap((y: number): IAutoMovieVector3[] => [
      { x: r, y, z: 0 },
      { x: -r, y, z: 0 },
      { x: 0, y, z: r },
      { x: 0, y, z: -r },
    ]),
  ];
};
