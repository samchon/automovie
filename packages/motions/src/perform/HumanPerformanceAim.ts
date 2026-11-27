import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformanceAim, IAutoMovieMotionHumanPerformanceState, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanProp, IAutoMovieMotionHumanSegment, IAutoMovieMotionTarget, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

import { HumanPerception } from "../law/HumanPerception";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/** The alternatives of `FramePosture`'s site. */
type FramePosture = "root" | "yaw";

/** The record of `IAimMoving`'s site. */
type IAimMoving = { point: IAutoMovieVector3; normal: IAutoMovieVector3 };

/** The record of `IAimResult`'s site. */
type IAimResult = { point: IAutoMovieVector3; normal: IAutoMovieVector3 };

/**
 * A target's world point and outward normal at a film second: a person's
 * region, the performer's own, a prop's point, a point of the world or of the
 * performer's frame, or the virtual opponent of no target.
 */
export namespace HumanPerformanceAim {
  /**
   * A target's world point and outward normal at a film second. Another
   * performer's region is read one reaction time earlier; a target naming the
   * aiming performer uses their supplied own-body frame instead.
   *
   * @param target The target.
   * @param seconds Film seconds.
   * @param frame The aiming person's own frame, for `point` targets in the
   *   performer frame and `none`, their own body and bones, for `self`, and
   *   their subject, for a `person` that names them (read as `self`).
   * @param meetings The instant each partner of the aiming action's own
   *   parallel group is read no later than, the end of their placed actions
   *   when the action was placed, for a partner whose part still waited, so the
   *   aim reads the same pose whenever it is asked.
   * @returns The aim.
   */
  export function aim(
    self: IAutoMovieMotionHumanPerformanceState,
    target: IAutoMovieMotionTarget,
    seconds: number,
    frame: IAutoMovieMotionHumanPerformanceAim.IFrame,
    meetings?: ReadonlyMap<string, number>,
  ): IAimResult {
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
        // A person whose place at the perceived second is not decided yet is
        // refused, as every other reader of a performer refuses it, never
        // read in the pose they entered with; one of the aiming performer's
        // own parallel group is read no later than the aiming action's start
        // (`HumanPerformanceRead.when`).
        const perceived: number = HumanPerformanceRead.when(
          self,
          target.subject,
          seconds - HumanPerception.REACTION,
          (): string => "target.subject",
          meetings?.get(target.subject),
        );
        const other: IAutoMovieMotionHumanSegment.IPerson =
          HumanPerformanceRead.person(self, target.subject);
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
          typeof AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace
        > = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
          region,
          HumanPerformanceRead.bones(
            self,
            target.subject,
            perceived,
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
          typeof AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace
        > = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
          region,
          frame.bones(new Set([region.bone])).get(region.bone)!,
        );
        return { point: placed.point, normal: placed.normal };
      }
      case "prop": {
        const prop: IAutoMovieMotionHumanProp | undefined = self.props.get(
          target.subject,
        );
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
        const moving: IAimMoving | undefined = prop.point?.(
          target.point,
          seconds,
        );
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
          // A point stated in statures is the performer's own measure times its
          // stature, so it fits any body.
          point: Vector3.add(
            { x: frame.root.x, y: 0, z: frame.root.z },
            turned(
              target.frame === "stature"
                ? Vector3.scale(target.at, frame.body.measure.stature)
                : target.at,
            ),
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
   * heading, and a `none` target's lines on a virtual opponent of the
   * performer's own build: the thigh's middle, where a low kick lands; the
   * chest joint; and the chin, whose mandible's lower border lies at about the
   * third cervical vertebra (Gray's Anatomy), the middle of the cervical spine
   * between the neck's base and the head joint. The opponent stands at the
   * performer's arm's length, the measure a straight arm meets them at. All in
   * metres.
   *
   * @param body The performer's body.
   * @param posture The posture they stand in.
   * @param bones Their bones in it, read only for a `self` target or a prop
   *   they carry.
   * @param subject Their subject id.
   * @returns The frame.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, FramePosture>,
    bones: IAutoMovieMotionHumanPerformanceAim.IFrame["bones"],
    subject?: string,
  ): IAutoMovieMotionHumanPerformanceAim.IFrame {
    return {
      root: posture.root,
      yaw: posture.yaw,
      heights: {
        low: body.measure.hipHeight - body.measure.thigh / 2,
        middle: body.measure.chestHeight,
        high: (body.measure.neckHeight + body.measure.headHeight) / 2,
      },
      range: body.measure.upperArm + body.measure.forearm + body.measure.hand,
      body,
      bones,
      ...(subject === undefined ? {} : { subject }),
    };
  }
}
