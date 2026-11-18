import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
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
   * Another performer's region is read one reaction time earlier; a target
   * naming the aiming performer uses their supplied own-body frame instead.
   *
   * @param target The target.
   * @param seconds Film seconds.
   * @param frame The aiming person's own frame, for `point` targets in the performer frame and `none`, their own body and bones, for `self`, and their subject, for a `person` that names them (read as `self`).
   * @returns The aim.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world-point/normal output, film seconds, own-body frame use and the person's existing reaction-time offset; target failures remain with their original branch owners.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves anatomical regions on actual world bones and prop-local points on their actual prop frame. Performer-frame points use +X left, +Y up and +Z forward from yaw in degrees; only point and virtual-opponent branches need that heading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per declared target kind, with shared heading construction only where its values are consumed and the existing self-person delegation retained.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Person, self and prop queries retain their full original frame/admission paths. Point-normal normalization and arithmetic grouping are unchanged; a world point still returns the caller's at reference, and no aim result or callback is memoized.
   * @evidence contracts/development/implementation.md#efficient-algorithms Person/self costs include surface placement and their bone reader; prop costs include articulation/hold resolution. Performer points, default world-point normals and none targets need one sine and cosine each; an explicit world normal needs no heading, and a world point needs no left vector or turn closure. Person/self/prop do no heading work. Overall speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each needed heading's sine and cosine supply its forward vector and, for a performer-frame turn, its left vector; different targets and seconds still invoke their own actual readers and no state is shared across queries.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The resolver retains no state or handle. Results keep their original ownership: fresh computed vectors, a borrowed world at point, or a prop provider's own returned record where supplied.
   */
  export function aim(
    self: IAutoMovieMotionHumanPerformanceState,
    target: IAutoMovieMotionTarget,
    seconds: number,
    frame: IAutoMovieMotionHumanPerformanceAim.IFrame,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
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
        const other: IAutoMovieMotionHumanSegment.IPerson = HumanPerformanceRead.person(
          self,
          target.subject,
        );
        const region: IAutoMovieHumanoidSurfaces.IFrame | undefined =
          other.performer.body.surfaces.regions[target.region];
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
        const placed: ReturnType<
          typeof resolveAutoMovieHumanoidSurfaces.place
        > = resolveAutoMovieHumanoidSurfaces.place(
          region,
          HumanPerformanceRead.bones(
            self,
            target.subject,
            seconds - HumanPerception.REACTION,
            new Set([region.bone]),
          ).get(region.bone)!,
        );
        return { point: placed.point, normal: placed.normal };
      }
      case "self": {
        const region: IAutoMovieHumanoidSurfaces.IFrame | undefined =
          frame.body.surfaces.regions[target.region];
        if (region === undefined)
          throw new HumanRefusal({
            kind: "parameter",
            axis: "target.region",
            value: target.region,
            feasible: {
              kind: "alternatives",
              values: Object.keys(frame.body.surfaces.regions),
            },
            reason: `the performer's body has no region named ${target.region}`,
            fix: "aim at one of the regions the body declares",
          });
        const placed: ReturnType<
          typeof resolveAutoMovieHumanoidSurfaces.place
        > = resolveAutoMovieHumanoidSurfaces.place(
          region,
          frame.bones(new Set([region.bone])).get(region.bone)!,
        );
        return { point: placed.point, normal: placed.normal };
      }
      case "prop": {
        const prop: IAutoMovieMotionHumanProp | undefined = self.props.get(target.subject);
        // A part an act has moved is where the prop's state poses it.
        const local: ReturnType<typeof HumanPerformanceObject.point> =
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
        if (target.frame === "world")
          return {
            point: target.at,
            normal:
              target.normal === undefined
                ? Vector3.scale(heading(frame.yaw), -1)
                : Vector3.normalize(target.normal),
          };
        const forward: IAutoMovieVector3 = heading(frame.yaw);
        const left: IAutoMovieVector3 = {
          x: forward.z,
          y: 0,
          z: -forward.x,
        };

        // A performer-frame vector in the world: x left, y up, z forward.
        const turned: (v: IAutoMovieVector3) => IAutoMovieVector3 = (
          v: IAutoMovieVector3,
        ): IAutoMovieVector3 =>
          Vector3.add(
            Vector3.add(Vector3.scale(left, v.x), { x: 0, y: v.y, z: 0 }),
            Vector3.scale(forward, v.z),
          );
        return {
          point: Vector3.add(
            { x: frame.root.x, y: 0, z: frame.root.z },
            turned(target.at),
          ),
          normal:
            target.normal === undefined
              ? Vector3.scale(forward, -1)
              : Vector3.normalize(turned(target.normal)),
        };
      }
      case "none": {
        const forward: IAutoMovieVector3 = heading(frame.yaw);
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

  /** The +Z forward direction at a heading in degrees about world +Y. */
  function heading(degrees: number): IAutoMovieVector3 {
    const yaw: number = (degrees * Math.PI) / 180;
    return { x: Math.sin(yaw), y: 0, z: Math.cos(yaw) };
  }

  /**
   * The aiming frame of a performer standing in a posture: its root and
   * heading, and a `none` target's lines from the body's measures:
   * hipHeight minus 0.3 thigh, chestHeight, and headHeight minus 0.5
   * headRadius. Its range is `0.9 * (thigh + shank)`, all in metres.
   *
   * @param body The performer's body.
   * @param posture The posture they stand in.
   * @param bones Their bones in it, read only for a `self` target or a prop they carry.
   * @param subject Their subject id.
   * @returns The frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the posture root and heading, measure-derived line heights/range, lazy own-bone reader and optional subject used by self and carried-prop aims.
   * @evidence contracts/development/implementation.md#principled-implementation Copies the posture's world root reference and degree heading, derives fixed standing line heights and range from the body's own measures, and carries the supplied own-bone callback without invoking it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record assembly keeps scalar frame construction separate from potentially expensive bone resolution.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the existing 0.3 thigh, 0.5 head-radius and 0.9 leg-length formulas; does not normalize, resolve or substitute the caller's body, posture or bone callback.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar arithmetic plus one frame and one heights record; construction performs no FK or limb fit.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This constructor stores no memo; callers such as Ahead own any unchanged-input evaluation scope and invalidation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the new frame/heights records; root, body and callback are borrowed. The returned frame retains those inputs until released, and a retained callback keeps its producer's existing lifetime and read semantics.
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
