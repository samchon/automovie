import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformanceAim,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionTarget,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPerception } from "../law/HumanPerception";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/**
 * A target's world point and outward normal at a film second: a person's
 * region, the performer's own, a prop's point, a point of the world or of
 * the performer's frame, or the virtual opponent of no target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is resolved and for which kinds of target.
 * @evidence contracts/development/design.md#principled-representation One function of the state, the target and the second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one resolver every law's `aim` and every layer's reads (#3399).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing person, prop or point is refused with the names that exist.
 */
export namespace HumanPerformanceAim {
  /**
   * A target's world point and outward normal at a film second.
   *
   * @param target The target.
   * @param seconds Film seconds.
   * @param frame The aiming person's own frame, for `point` targets in the performer frame and `none`, their own body and bones, for `self`, and their subject, for a `person` that names them (read as `self`).
   * @returns The aim.
   */
  export function aim(
    self: IAutoMovieMotionHumanPerformanceState,
    target: IAutoMovieMotionTarget,
    seconds: number,
    frame: IAutoMovieMotionHumanPerformanceAim.IFrame,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    const yaw: number = (frame.yaw * Math.PI) / 180;
    const forward: IAutoMovieVector3 = {
      x: Math.sin(yaw),
      y: 0,
      z: Math.cos(yaw),
    };
    const left: IAutoMovieVector3 = {
      x: Math.cos(yaw),
      y: 0,
      z: -Math.sin(yaw),
    };
    switch (target.kind) {
      case "person": {
        // The aiming performer's own body is its own, as a `self` target's.
        if (frame.subject !== undefined && target.subject === frame.subject)
          return HumanPerformanceAim.aim(
            self,
            { kind: "self", region: target.region },
            seconds,
            frame,
          );
        const other: IAutoMovieMotionHumanSegment.IPerson =
          HumanPerformanceRead.person(self, target.subject);
        const region = other.performer.body.surfaces.regions[target.region];
        if (region === undefined)
          throw new HumanRefusal({
            kind: "parameter",
            axis: "target.region",
            value: target.region,
            feasible: {
              kind: "alternatives",
              values: Object.keys(other.performer.body.surfaces.regions),
            },
            reason: `${target.subject}'s body has no region named ${target.region}`,
            fix: "aim at one of the regions the body declares",
          });

        // A person is followed as a person follows one: where the performer
        // perceived them a reaction time earlier. Read at the same instant,
        // two performers aiming at each other would each read the posture
        // still being solved.
        const placed = resolveAutoMovieHumanoidSurfaces.place(
          region,
          HumanPerformanceRead.bones(
            self,
            target.subject,
            seconds - HumanPerception.REACTION,
          ).get(region.bone)!,
        );
        return { point: placed.point, normal: placed.normal };
      }
      case "self": {
        const region = frame.body.surfaces.regions[target.region];
        const placed = resolveAutoMovieHumanoidSurfaces.place(
          region,
          frame.bones().get(region.bone)!,
        );
        return { point: placed.point, normal: placed.normal };
      }
      case "prop": {
        const prop: IAutoMovieMotionHumanProp | undefined = self.props.get(
          target.subject,
        );
        // A part an act has moved is where the prop's state poses it.
        const local =
          prop === undefined
            ? undefined
            : HumanPerformanceObject.point(self, prop, target.point, seconds);
        if (prop === undefined)
          throw HumanPerformanceRead.missing("prop", target.subject, [
            ...self.props.keys(),
          ]);
        if (local === undefined)
          throw new HumanRefusal({
            kind: "affordance",
            axis: "target",
            value: `${target.subject}.${target.point}`,
            feasible: {
              kind: "alternatives",
              values: Object.keys(prop.points),
            },
            reason: `prop ${target.subject} has no point named ${target.point}`,
            fix: `aim at a point the prop declares, or declare ${target.point} in the prop's points`,
          });
        // A part that moves within the prop is where the prop says it is.
        const moving:
          | { point: IAutoMovieVector3; normal: IAutoMovieVector3 }
          | undefined = prop.point?.(target.point, seconds);
        if (moving !== undefined) return moving;
        // A prop the performer carries is read on the performer's own body,
        // as their own region is (`HumanPerformanceRead.prop`).
        const at: IAutoMovieRigidTransform = HumanPerformanceRead.prop(
          self,
          target.subject,
          seconds,
          frame.subject === undefined
            ? undefined
            : { subject: frame.subject, bones: frame.bones },
        );
        return {
          point: Vector3.add(
            at.position,
            Quaternion.rotateVector(at.rotation, local.point),
          ),
          normal: Quaternion.rotateVector(at.rotation, local.normal),
        };
      }
      case "point": {
        // A performer-frame vector in the world: x left, y up, z forward.
        const turned = (v: IAutoMovieVector3): IAutoMovieVector3 =>
          Vector3.add(
            Vector3.add(Vector3.scale(left, v.x), { x: 0, y: v.y, z: 0 }),
            Vector3.scale(forward, v.z),
          );
        return {
          point:
            target.frame === "world"
              ? target.at
              : Vector3.add(
                  { x: frame.root.x, y: 0, z: frame.root.z },
                  turned(target.at),
                ),
          normal:
            target.normal === undefined
              ? Vector3.scale(forward, -1)
              : Vector3.normalize(
                  target.frame === "world"
                    ? target.normal
                    : turned(target.normal),
                ),
        };
      }
      case "none":
        return {
          point: Vector3.add(
            {
              x: frame.root.x,
              y: frame.heights[target.line ?? "middle"],
              z: frame.root.z,
            },
            Vector3.scale(forward, target.range ?? frame.range),
          ),
          normal: Vector3.scale(forward, -1),
        };
    }
  }

  /**
   * The aiming frame of a performer standing in a posture: its root and
   * heading, the heights of a `none` target's three lines from the body's
   * measures (the hips less a third of the thigh, the chest, the head's
   * centre) and its range, nine tenths of the leg's length.
   *
   * @param body The performer's body.
   * @param posture The posture they stand in.
   * @param bones Their bones in it, read only for a `self` target or a prop they carry.
   * @param subject Their subject id.
   * @returns The frame.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">,
    bones: IAutoMovieMotionHumanPerformanceAim.IFrame["bones"],
    subject?: string,
  ): IAutoMovieMotionHumanPerformanceAim.IFrame {
    return {
      root: posture.root,
      yaw: posture.yaw,
      heights: {
        low: body.measure.hipHeight - 0.3 * body.measure.thigh,
        middle: body.measure.chestHeight,
        high: body.measure.headHeight - 0.5 * body.measure.headRadius,
      },
      range: 0.9 * (body.measure.thigh + body.measure.shank),
      body,
      bones,
      ...(subject === undefined ? {} : { subject }),
    };
  }
}
