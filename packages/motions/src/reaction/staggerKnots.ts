import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditContact } from "../audit/AutoMovieMotionHumanAuditContact";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { HumanBalance } from "../everyday/HumanBalance";
import { HumanFrame } from "../posture/HumanFrame";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingStance } from "../striking/StrikingStance";
import { StrikingTarget } from "../striking/StrikingTarget";
import { staggerBounds } from "./staggerBounds";

/**
 * The body readings a stagger's legs and trunk share (`StaggerFeet`,
 * `staggerAdmission`, `stagger`): the trunk's shift of the centre of mass,
 * the knee's hint and the share of a swing a foot rises in.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the readings are and who reads them.
 * @evidence contracts/development/design.md#principled-representation Three readings of the body, each from its own measured geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three readings the plan, its feet and its admission share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every reading is the body's own; the reference tilt is `staggerBounds`'.
 */
export namespace staggerKnots {
  /**
   * The centre of mass's shift per sine of the trunk's tilt about the hips,
   * on the entry's feet: the posture tilted `REFERENCE` degrees in pitch and
   * in roll (`AutoMovieMotionHumanLean.pivot`) and its centre of mass read
   * (`HumanBalance.centre`).
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param source Optional same-body FK source borrowed from the surrounding synchronous entry observation.
   * @param projector Optional genuine same-body ROM metadata borrowed by that same operation.
   * @returns The horizontal shift per sine of the pitch and of the roll, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the unchanged entry feet, REFERENCE tilt, sine normalization and horizontal world-metre result.
   * @evidence contracts/development/implementation.md#principled-implementation Measures the whole-body centre on the entry's standing legs, tilts about the hips on each trunk axis, applies leg lowering and divides each centre displacement by sin(REFERENCE).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One standing reference and one shared axis-trial reader produce the two bending vectors.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the actual body, entry, pivot, lowering and reference angle; no fitted body proxy replaces the mass reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three centre readings and two lowered trial postures per plan; one fixed body/profile demand preparation serves them.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One synchronous observation creates or borrows exact FK and same-body ROM metadata for its three centre solves and both lowerings.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local FK demand and owned metadata end on return or throw; only two fresh shift vectors escape.
   */
  export function bending(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMovieMotionHumanActionContext["entry"],
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projector?: ReturnType<typeof prepareHumanPostureProjection>,
  ): Record<"pitch" | "roll", IAutoMovieVector3> {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(source);
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      projector ?? prepareHumanPostureProjection(body);
    const centreOf: ReturnType<typeof HumanBalance.prepareCentre> =
      HumanBalance.prepareCentre(body);
    const standing: IAutoMovieMotionHumanPosture = {
      ...entry.posture,
      limbs: {
        ...entry.posture.limbs,
        ...StrikingStance.legs(body, StrikingTarget.feet(entry)),
      },
    };
    const upright: IAutoMovieVector3 = centreOf(
      standing,
      resolution,
      projection,
    );
    const sine: number = Math.sin((staggerBounds.REFERENCE * Math.PI) / 180);
    const shift: (more: { pitch: number; roll: number }) => IAutoMovieVector3 = (more: {
      pitch: number;
      roll: number;
    }): IAutoMovieVector3 => {
      const tilted: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.pivot(
        body,
        standing,
        more,
      );
      const centre: IAutoMovieVector3 = centreOf(
        {
          ...tilted,
          root: resolveHumanPosture.lower(body, tilted, resolveHumanPosture.KNEE, resolution).root,
        },
        resolution,
        projection,
      );
      return {
        x: (centre.x - upright.x) / sine,
        y: 0,
        z: (centre.z - upright.z) / sine,
      };
    };
    return {
      pitch: shift({ pitch: staggerBounds.REFERENCE, roll: 0 }),
      roll: shift({ pitch: 0, roll: staggerBounds.REFERENCE }),
    };
  }

  /**
   * The point a leg's knee bends toward: ahead over its foot's heading from
   * where the knee rests under the root.
   *
   * @param body The body.
   * @param root The lowered root, world metres.
   * @param yaw The pelvis's heading, degrees.
   * @param side The leg.
   * @param heading The foot's heading, degrees.
   * @param prepared Optional fixed-yaw rest-knee reader, or its world point already evaluated at this exact body/side/root/yaw.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world root/knee hint, degree headings and the optional fixed-yaw reader or exact same-root world rest-knee point.
   * @evidence contracts/development/implementation.md#principled-implementation Places the body's rest lower-leg joint under the supplied root/yaw, then adds unit forward under the foot heading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Select the supplied world point, evaluate the fixed-yaw reader, or perform the ordinary first transform; the foot-heading transform is one shared owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the body's same-side knee offset and a unit-forward hint.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant point work; a fixed-yaw reader avoids repeated trigonometry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The reader fixes this body's same-side rest knee/yaw while accepting the actual root; an explicit world point additionally requires that exact root.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh hint vector and retains nothing.
   */
  export function kneePole(
    body: IAutoMovieMotionHumanActionContext["body"],
    root: IAutoMovieVector3,
    yaw: number,
    side: "left" | "right",
    heading: number,
    prepared?: ReturnType<typeof HumanFrame.preparePoint> | IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      {
        origin: (typeof prepared === "function" ? prepared(root) : prepared) ?? HumanFrame.point(
          { origin: root, yaw },
          body.rest.get(`${side}LowerLeg`)!,
        ),
        yaw: heading,
      },
      { x: 0, y: 0, z: 1 },
    );
  }

  /**
   * The share of a swing a stepping foot takes to rise clear of the floor:
   * the share of a walking swing its lift takes to set down from the
   * floor's contact height (`walkFoot.swing`).
   *
   * @param body The body.
   * @returns The share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the initial rise as a share of swing from the contact-height and lift policy.
   * @evidence contracts/development/implementation.md#principled-implementation Inverts sin^2(pi*u) at the audit contact height over LIFT*hipHeight, as the walking-foot rise law requires.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One explicit inverse-height expression owns the rise share for the displayed feet.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the height, LIFT and body measure without clipping or tuning; the valid body/rise domain remains the caller's premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar work, prepared once by the owning feet object.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The displayed feet call this one formula.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains no body or sample.
   */
  export function risingOf(body: IAutoMovieMotionHumanActionContext["body"]): number {
    return (
      Math.asin(
        Math.sqrt(
          AutoMovieMotionHumanAuditContact.HEIGHT /
            (staggerBounds.LIFT * body.measure.hipHeight),
        ),
      ) / Math.PI
    );
  }
}
