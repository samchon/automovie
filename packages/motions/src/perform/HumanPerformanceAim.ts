import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import { HumanSegment } from "./HumanSegment";
import type { IHumanProp } from "./IHumanProp";

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
   * @param frame The aiming person's own frame, for `point` targets in the performer frame and `none`, and their own body and bones, for `self`.
   * @returns The aim.
   */
  export function aim(
    self: HumanPerformanceState,
    target: AutoMovieMotionTarget,
    seconds: number,
    frame: {
      root: IAutoMovieVector3;
      yaw: number;
      heights: Record<"low" | "middle" | "high", number>;
      range: number;
      body: IHumanBody;
      bones: () => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    },
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
        const other: HumanSegment.IPerson = HumanPerformanceRead.person(
          self,
          target.subject,
        );
        const placed = resolveAutoMovieHumanoidSurfaces.place(
          other.performer.body.surfaces.regions[target.region],
          HumanPerformanceRead.bones(self, target.subject, seconds).get(
            other.performer.body.surfaces.regions[target.region].bone,
          )!,
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
        const prop: IHumanProp | undefined = self.props.get(target.subject);
        const local = prop?.points[target.point];
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
        const at: IHumanProp.IFrame = HumanPerformanceRead.prop(
          self,
          target.subject,
          seconds,
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
}
