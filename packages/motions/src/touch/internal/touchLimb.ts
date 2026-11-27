import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";

/*
 * What a touch reads of the body it lays its hand on: the long axis of a
 * partner's touched limb, along which a flat hand lies (`limb`), and the other
 * parts of that body the hand must not sink into.
 */
export namespace touchLimb {
  /*
   * The long axis of a partner's touched segment where the touch starts: its
   * capsule collider's, which runs along the segment's local `+Y`. A segment
   * with no capsule (a box of the trunk) has none.
   */
  export function axis(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTouch.IParams>,
    target: PersonTarget,
  ): IAutoMovieVector3 | undefined {
    const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
      target.subject,
    );
    const bone: AutoMovieHumanoidBone =
      partner.body.surfaces.regions[target.region].bone;
    const segment: IAutoMovieMotionHumanColliders.IPlaced | undefined =
      HumanColliders.placed(
        partner.body,
        partner.bones(context.start, new Set([bone])),
      ).find(
        (s: IAutoMovieMotionHumanColliders.IPlaced): boolean => s.bone === bone,
      );
    const capsule: Shape | undefined = segment?.shapes.find(
      (shape: Shape): boolean => shape.kind === "capsule",
    );
    if (segment === undefined || capsule === undefined) return undefined;
    return AutoMovieEngineVector3.normalize(
      AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.multiply(segment.pose.rotation, capsule.transform.rotation),
        { x: 0, y: 1, z: 0 },
      ),
    );
  }

  /*
   * The parts of the touched body a laid hand must not sink into: on the
   * performer's own body every part but the touched one and the touching arm;
   * on a partner every part but the touched one, where the touch starts.
   */
  export function others(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTouch.IParams>,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: AutoMovieHumanSide,
    target: BodyTarget,
  ): IAutoMovieMotionHumanColliders.IPlaced[] {
    if (target.kind === "person") {
      const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
        target.subject,
      );
      const own: AutoMovieHumanoidBone =
        partner.body.surfaces.regions[target.region].bone;
      return HumanColliders.placed(
        partner.body,
        partner.bones(context.start, HumanColliders.bones(partner.body)),
      ).filter(
        (segment: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          segment.bone !== own,
      );
    }
    const own: AutoMovieHumanoidBone =
      context.body.surfaces.regions[target.region].bone;
    const arm: RegExp = new RegExp(
      `^${side}(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)`,
    );
    return HumanColliders.placed(
      context.body,
      new Map(
        [...bones].filter(
          ([bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): boolean =>
            bone !== own && !arm.test(bone),
        ),
      ),
    );
  }
}

/*
 * The record of `IPersonTarget`'s site.
 */
type IPersonTarget = { kind: "person" };
/*
 * A target on a person: another performer's region.
 */
type PersonTarget = Extract<IAutoMovieMotionTarget, IPersonTarget>;

/*
 * The record of `ISelfTarget`'s site.
 */
type ISelfTarget = { kind: "self" };

/*
 * A target on the performer's own body.
 */
type SelfTarget = Extract<IAutoMovieMotionTarget, ISelfTarget>;

/*
 * A target a touch lays its hand on: the performer's own region or another's.
 */
type BodyTarget = SelfTarget | PersonTarget;

/*
 * One collider shape of a placed segment.
 */
type Shape = IAutoMovieMotionHumanColliders.IPlaced["shapes"][number];
