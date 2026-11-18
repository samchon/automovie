import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { crawlChain } from "./crawlChain";
import { crawlFrame } from "./crawlFrame";

/**
 * The inchworm's posture at a placement of its hands and feet, by its
 * middle-plane chain (`crawlChain`): the stated posture each stance of the
 * walk is solved from and kept nearest (`HumanSupport.IStance.prefer`), so
 * the whole-body fit starts at the chain's own shape instead of the
 * standing it would otherwise climb down from, where its l1 merit can stop
 * at a stationary point of the violation that meets no contact (Nocedal and
 * Wright 2006, chapter 17).
 *
 * The body pitches as the chain's trunk lies, each foot pivoted on its ball
 * with the heel lifted as the chain lifts it and the knee bent toward the
 * front of the leg by `KNEE` of the shank (provisional), each palm laid flat
 * on the floor at its place; the posture is then resolved to joint angles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the posture is, why the fit starts there with its source and how it is built. KNEE is the dimensionless provisional shank share used by the actual sagittal knee hint, with metre scale supplied by this body's shank.
 * @evidence contracts/development/design.md#principled-representation A stance's stated posture computed from the chain's shape, never typed.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The knee hint, one-shot builder and fixed-frame preparation serve the inchworm's repeated actual stance preferences; no action parameter or alternative solver is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is the chain's and the body's; the arms and legs are the shared limb goals.
 */
export namespace crawlInchwormPose {
  /**
   * How far the knee's bend point lies before the straight leg's middle,
   * as a share of the shank (provisional).
   */
  export const KNEE: number = 0.25;

  /**
   * The posture at a placement.
   *
   * @param body The body.
   * @param chain The chain built for the body's standing.
   * @param frame The floor frame of the heading.
   * @param feet Each foot's ball along the heading, metres in the frame.
   * @param wrists Each wrist along the heading, metres in the frame.
   * @param laid Fixed palm geometry from this unchanged body/frame, or the same native preparation when omitted; current FK is borrowed only during this placement.
   * @param source Optional exact FK source belonging only to this synchronous preference construction.
   * @param projector Optional genuine ROM metadata from that same construction; every current joint remains projected.
   * @returns The whole body's tilt and its joint angles.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, their frame and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The chain's shape at the feet's and wrists' middles places the hips and the trunk's pitch; the limb goals place the feet on their balls and the palms on the floor; the resolved pose gives the joints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates one placement to the same prepare owner used by repeated stance preferences, retaining one shape, four limb goals and one complete solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; the fit then meets the stance's contacts exactly.
   * @evidence contracts/development/implementation.md#efficient-algorithms One chain shape and one posture resolve per stance.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed chain/frame/palm metadata share their existing owners; one synchronous exact FK source serves both original elbow searches and the final complete posture solve, with a genuine ROM loan projecting every actual current joint.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This one stance construction releases its local FK/ROM sources and intermediate poses on return or throw; only original tilt and fresh clinical angle tuples return, with no reader/source token or pose history retained.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    chain: crawlChain.IChain,
    frame: IAutoMovieMotionHumanFrame,
    feet: Record<"left" | "right", number>,
    wrists: Record<"left" | "right", number>,
    laid: ReturnType<typeof crawlFrame.prepareLaid> = crawlFrame.prepareLaid(
      body,
      HumanFrame.forward(frame.yaw),
    ),
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projector?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanLieDown.IPose {
    return prepare(body, chain, frame, laid)(feet, wrists, source, projector);
  }

  /**
   * Prepare unchanged body/chain/floor geometry for the inchworm's stance
   * preferences. Each placement still builds four actual limb goals and
   * resolves the complete posture; only frame and sole prerequisites share.
   *
   * @param body The unchanged body and its foot/hand geometry.
   * @param chain The fixed standing-source planar chain.
   * @param frame Fixed world-metre floor origin and degree heading.
   * @param laid The existing fixed palm reader, or its original preparation when absent.
   * @returns A fresh clinical-posture builder for current local-metre foot-ball/wrist coordinates, borrowing optional FK/ROM inputs only during each actual synchronous call.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed body/chain/world frame, changing local foot/wrist coordinates, actual complete four-goal solving and fresh clinical outputs.
   * @evidence contracts/development/implementation.md#principled-implementation Native HumanFrame and HumanFoot preparations retain the original floor transforms and metatarsophalangeal pivots at each current heel angle/contact. The chain still supplies actual hip/trunk shape, both default arm searches run and canonical seeded resolves every original limb/digit demand.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed floor/sole/knee-scale metadata precedes one actual stance builder. Of delegates this same owner, and repeated inchworm preferences consume one producer instead of rebuilding unchanged frame/foot prerequisites.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every stance still uses its actual foot/wrist coordinates, chain scan/bisection, original KNEE share, native goal geometry and complete ROM/limb fitting; no posed answer, contact, target or tolerance is prepared.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed yaw trigonometry, two sole offsets/rotation prefixes and knee scale prepare once across N stances. Each stance retains one actual chain shape, four goals and a complete solve; its two equal sagittal knee coordinates are calculated once without changing expression grouping.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Unchanged body/chain/frame prove fixed geometric metadata only. Every changing angle, point, knee/root and fit remains current. Each stance borrows or owns synchronous FK/ROM sources; a construction-wide native source may share checked prerequisites across actual stances without reusing any pose or clinical output.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Construction owns one fixed frame, two bounded sole readers/contact vectors, knee scale and palm reader until the producer is released. Local or borrowed FK/ROM inputs and intermediate poses never enter the retained producer or clinical outputs; their synchronous owner releases them after the stance or stance batch.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    chain: crawlChain.IChain,
    frame: IAutoMovieMotionHumanFrame,
    laid: ReturnType<typeof crawlFrame.prepareLaid> = crawlFrame.prepareLaid(
      body,
      HumanFrame.forward(frame.yaw),
    ),
  ): (
    feet: Record<"left" | "right", number>,
    wrists: Record<"left" | "right", number>,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projector?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieMotionHumanLieDown.IPose {
    const DEG: number = 180 / Math.PI;
    const sides: readonly ["left", "right"] = ["left", "right"];
    const yaw: number = frame.yaw;
    const floor: ReturnType<typeof HumanFrame.prepare> =
      HumanFrame.prepare(frame);
    const knee: number = KNEE * body.measure.shank;
    const pivots: Record<
      "left" | "right",
      ReturnType<typeof HumanFoot.preparePivot>
    > = {
      left: HumanFoot.preparePivot(
        body,
        "left",
        "mtp",
        { x: 0, y: 0, z: 0 },
        yaw,
      ),
      right: HumanFoot.preparePivot(
        body,
        "right",
        "mtp",
        { x: 0, y: 0, z: 0 },
        yaw,
      ),
    };
    const contacts: Record<"left" | "right", IAutoMovieVector3> = {
      left: { ...HumanFoot.offset(body, "left", "mtp") },
      right: { ...HumanFoot.offset(body, "right", "mtp") },
    };
    return (
      feet: Record<"left" | "right", number>,
      wrists: Record<"left" | "right", number>,
      source?: Parameters<typeof prepareHumanPoseResolution>[0],
      projector?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanLieDown.IPose => {
      const shape: crawlChain.IShape = chain.shape(
        (feet.left + feet.right) / 2,
        (wrists.left + wrists.right) / 2,
      );
      const pitch: number =
        Math.atan2(
          shape.shoulders.u - shape.hips.u,
          shape.shoulders.v - shape.hips.v,
        ) *
          DEG -
        chain.lean;
      const target: IAutoMovieMotionHumanPosture = crawlFrame.posed(body, yaw, 1, pitch, 0, 0);
      const posture: IAutoMovieMotionHumanPosture = {
        ...target,
        root: crawlFrame.rootFor(
          body,
          target,
          floor.point({ x: 0, y: shape.hips.v, z: shape.hips.u }),
        ),
        limbs: {},
        joints: { ...target.joints },
      };
      const kneeY: number =
        (shape.hips.v + shape.ankle.v) / 2 - knee * Math.cos(shape.lam / DEG);
      const kneeZ: number =
        (shape.hips.u + shape.ankle.u) / 2 + knee * Math.sin(shape.lam / DEG);
      for (const side of sides) {
        const placement: IAutoMovieMotionHumanFoot.IPlacement = pivots[side](
          -shape.heel,
          floor.point({
            x: chain.balls[side].x,
            y: chain.balls[side].y,
            z: feet[side],
          }),
        );
        posture.limbs[`${side}Leg`] = {
          point: placement.ankle,
          rotation: placement.rotation,
          bend: floor.point({
            x: chain.balls[side].x,
            y: kneeY,
            z: kneeZ,
          }),
          contact: { ...contacts[side] },
        };
        posture.joints[`${side}Toes`] = [shape.heel, 0, 0];
      }
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(source);
      const projection: ReturnType<typeof prepareHumanPostureProjection> =
        projector ?? prepareHumanPostureProjection(body);
      const placed: IAutoMovieMotionHumanPosture = laid(
        posture,
        (side: "left" | "right"): IAutoMovieVector3 =>
          floor.point({
            x: chain.palms[side],
            y: 0,
            z: wrists[side] - chain.wrists[side].z,
          }),
        resolution,
      );
      const joints: IAutoMovieMotionHumanLieDown.IPose["joints"] = {};
      for (const j of resolveHumanPosture.seeded(
        body,
        placed,
        undefined,
        undefined,
        resolution,
        undefined,
        projection,
      ).pose.joints)
        joints[j.bone] = [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0];
      return { pitch: posture.pitch, roll: 0, joints };
    };
  }
}
