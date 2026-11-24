import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as M } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmTrajectoryTerms } from "./HumanArmTrajectoryTerms";
import { HumanColliders } from "./HumanColliders";
import { HumanLinkCertificate } from "./HumanLinkCertificate";

/**
 * What the tangle and partner audits read a body by, as one provider every
 * consumer that keeps a limb clear reads too: the arm planner, the per-read
 * limb and digit fits, the course of a limb's swivel and the audit itself. The
 * probes, their reference depths and the related pairs stay the tangle model's
 * (`AutoMovieMotionHumanAuditTangleModel`); this owner places them with the
 * shapes they are read against and states the one depth a probe may lie past
 * its reference, so no consumer judges a narrower body or a different bound
 * than the take is judged by.
 */
export namespace HumanAuditModel {
  /**
   * How far past its reference depth a probe may lie in a shape, metres: the
   * audit's skin (`AutoMovieMotionHumanAuditSkin.BUILT`) less the arm solver's
   * own tolerance (`HumanArmTrajectoryTerms.DEPTH`), so what a consumer admits
   * the audit admits.
   */
  export const ALLOWANCE: number = HumanArmTrajectoryTerms.DEPTH;

  /** A body placed as the audit reads it, beside what else it is read against. */
  export interface IFrame {
    /** The body's tangle model. */
    model: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as M } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmTrajectoryTerms } from "./HumanArmTrajectoryTerms";
import { HumanColliders } from "./HumanColliders";
import { HumanLinkCertificate } from "./HumanLinkCertificate";

/**
 * What the tangle and partner audits read a body by, as one provider every
 * consumer that keeps a limb clear reads too: the arm planner, the per-read
 * limb and digit fits, the course of a limb's swivel and the audit itself. The
 * probes, their reference depths and the related pairs stay the tangle model's
 * (`AutoMovieMotionHumanAuditTangleModel`); this owner places them with the
 * shapes they are read against and states the one depth a probe may lie past
 * its reference, so no consumer judges a narrower body or a different bound
 * than the take is judged by.
 */
export namespace HumanAuditModel {
  /**
   * How far past its reference depth a probe may lie in a shape, metres: the
   * audit's skin (`AutoMovieMotionHumanAuditSkin.BUILT`) less the arm solver's
   * own tolerance (`HumanArmTrajectoryTerms.DEPTH`), so what a consumer admits
   * the audit admits.
   */
  export const ALLOWANCE: number = HumanArmTrajectoryTerms.DEPTH;

  /** A body placed as the audit reads it, beside what else it is read against. */
  export interface IFrame {
    /** The body's tangle model. */
    model: M.IModel;

    /** The body's segments placed, in the model's part order. */
    placed: IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Each part's probes in world metres, in the model's part and probe order:
     * its colliders' corners, then the points along its bone; the hand group's
     * digits are parts of their own.
     */
    probes: IAutoMovieVector3[][];

    /**
     * Another body's segments the body is read against, a partner's; none when
     * absent.
     */
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Segments no human body carries the body is read against, a prop's, a
     * carrier's or an animal's; none when absent.
     */
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[];
  }

  /**
   * A body placed as the audit reads it.
   *
   * @param body The body.
   * @param bones Its posed bones.
   * @param others Another body's placed segments it is read against.
   * @param externals Segments no human body carries it is read against, a
   *   carrier's included.
   * @returns The frame.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[] = [],
  ): IFrame {
    const model: M.IModel = body.tangle;
    const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(body, bones);
    return {
      model,
      placed,
      probes: placed.map(
        (
          segment: IAutoMovieMotionHumanColliders.IPlaced,
          i: number,
        ): IAutoMovieVector3[] =>
          model.parts[i]!.probes.map(
            (probe: IAutoMovieVector3): IAutoMovieVector3 =>
              Vector3.add(
                segment.pose.position,
                Quaternion.rotateVector(segment.pose.rotation, probe),
              ),
          ),
      ),
      others,
      externals,
    };
  }

  /**
   * The bones of a body whose colliders the audit reads, every segment of its
   * model: what a limb keeps clear of on another body, short of the parts a law
   * declares it rests on. The audits read every pair of segments of two bodies,
   * as trajopt and tesseract read every link pair
   * (`trajopt/src/collision_terms.cpp`, `tesseract/collision/bullet/src/
   * bullet_utils.cpp`), and an allowed contact is excluded by name, as MoveIt's
   * allowed-collision matrix lists the pairs allowed to touch; no subset of the
   * body is chosen by hand.
   *
   * @param body The body.
   * @returns Every bone carrying a collider, in the model's part order.
   */
  export function segments(
    body: IAutoMovieMotionHumanBody,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    return new Set<AutoMovieHumanoidBone>(
      body.tangle.parts.map(
        (part: M.IPart): AutoMovieHumanoidBone => part.bone,
      ),
    );
  }

  /**
   * A lower bound on the signed distance from every probe of a segment to a
   * convex shape, the link pair's certificate (`HumanLinkCertificate.certify`),
   * read before any probe.
   */
  export const certify: typeof HumanLinkCertificate.certify =
    HumanLinkCertificate.certify;
}
.IModel;

    /** The body's segments placed, in the model's part order. */
    placed: IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Each part's probes in world metres, in the model's part and probe order:
     * its colliders' corners, then the points along its bone; the hand group's
     * digits are parts of their own.
     */
    probes: IAutoMovieVector3[][];

    /**
     * Another body's segments the body is read against, a partner's; none when
     * absent.
     */
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Segments no human body carries the body is read against, a prop's, a
     * carrier's or an animal's; none when absent.
     */
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[];
  }

  /**
   * A body placed as the audit reads it.
   *
   * @param body The body.
   * @param bones Its posed bones.
   * @param others Another body's placed segments it is read against.
   * @param externals Segments no human body carries it is read against, a
   *   carrier's included.
   * @returns The frame.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[] = [],
  ): IFrame {
    const model: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as M } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmTrajectoryTerms } from "./HumanArmTrajectoryTerms";
import { HumanColliders } from "./HumanColliders";
import { HumanLinkCertificate } from "./HumanLinkCertificate";

/**
 * What the tangle and partner audits read a body by, as one provider every
 * consumer that keeps a limb clear reads too: the arm planner, the per-read
 * limb and digit fits, the course of a limb's swivel and the audit itself. The
 * probes, their reference depths and the related pairs stay the tangle model's
 * (`AutoMovieMotionHumanAuditTangleModel`); this owner places them with the
 * shapes they are read against and states the one depth a probe may lie past
 * its reference, so no consumer judges a narrower body or a different bound
 * than the take is judged by.
 */
export namespace HumanAuditModel {
  /**
   * How far past its reference depth a probe may lie in a shape, metres: the
   * audit's skin (`AutoMovieMotionHumanAuditSkin.BUILT`) less the arm solver's
   * own tolerance (`HumanArmTrajectoryTerms.DEPTH`), so what a consumer admits
   * the audit admits.
   */
  export const ALLOWANCE: number = HumanArmTrajectoryTerms.DEPTH;

  /** A body placed as the audit reads it, beside what else it is read against. */
  export interface IFrame {
    /** The body's tangle model. */
    model: M.IModel;

    /** The body's segments placed, in the model's part order. */
    placed: IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Each part's probes in world metres, in the model's part and probe order:
     * its colliders' corners, then the points along its bone; the hand group's
     * digits are parts of their own.
     */
    probes: IAutoMovieVector3[][];

    /**
     * Another body's segments the body is read against, a partner's; none when
     * absent.
     */
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Segments no human body carries the body is read against, a prop's, a
     * carrier's or an animal's; none when absent.
     */
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[];
  }

  /**
   * A body placed as the audit reads it.
   *
   * @param body The body.
   * @param bones Its posed bones.
   * @param others Another body's placed segments it is read against.
   * @param externals Segments no human body carries it is read against, a
   *   carrier's included.
   * @returns The frame.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[] = [],
  ): IFrame {
    const model: M.IModel = body.tangle;
    const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(body, bones);
    return {
      model,
      placed,
      probes: placed.map(
        (
          segment: IAutoMovieMotionHumanColliders.IPlaced,
          i: number,
        ): IAutoMovieVector3[] =>
          model.parts[i]!.probes.map(
            (probe: IAutoMovieVector3): IAutoMovieVector3 =>
              Vector3.add(
                segment.pose.position,
                Quaternion.rotateVector(segment.pose.rotation, probe),
              ),
          ),
      ),
      others,
      externals,
    };
  }

  /**
   * The bones of a body whose colliders the audit reads, every segment of its
   * model: what a limb keeps clear of on another body, short of the parts a law
   * declares it rests on. The audits read every pair of segments of two bodies,
   * as trajopt and tesseract read every link pair
   * (`trajopt/src/collision_terms.cpp`, `tesseract/collision/bullet/src/
   * bullet_utils.cpp`), and an allowed contact is excluded by name, as MoveIt's
   * allowed-collision matrix lists the pairs allowed to touch; no subset of the
   * body is chosen by hand.
   *
   * @param body The body.
   * @returns Every bone carrying a collider, in the model's part order.
   */
  export function segments(
    body: IAutoMovieMotionHumanBody,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    return new Set<AutoMovieHumanoidBone>(
      body.tangle.parts.map(
        (part: M.IPart): AutoMovieHumanoidBone => part.bone,
      ),
    );
  }

  /**
   * A lower bound on the signed distance from every probe of a segment to a
   * convex shape, the link pair's certificate (`HumanLinkCertificate.certify`),
   * read before any probe.
   */
  export const certify: typeof HumanLinkCertificate.certify =
    HumanLinkCertificate.certify;
}
.IModel = body.tangle;
    const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(body, bones);
    return {
      model,
      placed,
      probes: placed.map(
        (
          segment: IAutoMovieMotionHumanColliders.IPlaced,
          i: number,
        ): IAutoMovieVector3[] =>
          model.parts[i]!.probes.map(
            (probe: IAutoMovieVector3): IAutoMovieVector3 =>
              Vector3.add(
                segment.pose.position,
                Quaternion.rotateVector(segment.pose.rotation, probe),
              ),
          ),
      ),
      others,
      externals,
    };
  }

  /**
   * The bones of a body whose colliders the audit reads, every segment of its
   * model: what a limb keeps clear of on another body, short of the parts a law
   * declares it rests on. The audits read every pair of segments of two bodies,
   * as trajopt and tesseract read every link pair
   * (`trajopt/src/collision_terms.cpp`, `tesseract/collision/bullet/src/
   * bullet_utils.cpp`), and an allowed contact is excluded by name, as MoveIt's
   * allowed-collision matrix lists the pairs allowed to touch; no subset of the
   * body is chosen by hand.
   *
   * @param body The body.
   * @returns Every bone carrying a collider, in the model's part order.
   */
  export function segments(
    body: IAutoMovieMotionHumanBody,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    return new Set<AutoMovieHumanoidBone>(
      body.tangle.parts.map(
        (part: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as M } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmTrajectoryTerms } from "./HumanArmTrajectoryTerms";
import { HumanColliders } from "./HumanColliders";
import { HumanLinkCertificate } from "./HumanLinkCertificate";

/**
 * What the tangle and partner audits read a body by, as one provider every
 * consumer that keeps a limb clear reads too: the arm planner, the per-read
 * limb and digit fits, the course of a limb's swivel and the audit itself. The
 * probes, their reference depths and the related pairs stay the tangle model's
 * (`AutoMovieMotionHumanAuditTangleModel`); this owner places them with the
 * shapes they are read against and states the one depth a probe may lie past
 * its reference, so no consumer judges a narrower body or a different bound
 * than the take is judged by.
 */
export namespace HumanAuditModel {
  /**
   * How far past its reference depth a probe may lie in a shape, metres: the
   * audit's skin (`AutoMovieMotionHumanAuditSkin.BUILT`) less the arm solver's
   * own tolerance (`HumanArmTrajectoryTerms.DEPTH`), so what a consumer admits
   * the audit admits.
   */
  export const ALLOWANCE: number = HumanArmTrajectoryTerms.DEPTH;

  /** A body placed as the audit reads it, beside what else it is read against. */
  export interface IFrame {
    /** The body's tangle model. */
    model: M.IModel;

    /** The body's segments placed, in the model's part order. */
    placed: IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Each part's probes in world metres, in the model's part and probe order:
     * its colliders' corners, then the points along its bone; the hand group's
     * digits are parts of their own.
     */
    probes: IAutoMovieVector3[][];

    /**
     * Another body's segments the body is read against, a partner's; none when
     * absent.
     */
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Segments no human body carries the body is read against, a prop's, a
     * carrier's or an animal's; none when absent.
     */
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[];
  }

  /**
   * A body placed as the audit reads it.
   *
   * @param body The body.
   * @param bones Its posed bones.
   * @param others Another body's placed segments it is read against.
   * @param externals Segments no human body carries it is read against, a
   *   carrier's included.
   * @returns The frame.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[] = [],
  ): IFrame {
    const model: M.IModel = body.tangle;
    const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(body, bones);
    return {
      model,
      placed,
      probes: placed.map(
        (
          segment: IAutoMovieMotionHumanColliders.IPlaced,
          i: number,
        ): IAutoMovieVector3[] =>
          model.parts[i]!.probes.map(
            (probe: IAutoMovieVector3): IAutoMovieVector3 =>
              Vector3.add(
                segment.pose.position,
                Quaternion.rotateVector(segment.pose.rotation, probe),
              ),
          ),
      ),
      others,
      externals,
    };
  }

  /**
   * The bones of a body whose colliders the audit reads, every segment of its
   * model: what a limb keeps clear of on another body, short of the parts a law
   * declares it rests on. The audits read every pair of segments of two bodies,
   * as trajopt and tesseract read every link pair
   * (`trajopt/src/collision_terms.cpp`, `tesseract/collision/bullet/src/
   * bullet_utils.cpp`), and an allowed contact is excluded by name, as MoveIt's
   * allowed-collision matrix lists the pairs allowed to touch; no subset of the
   * body is chosen by hand.
   *
   * @param body The body.
   * @returns Every bone carrying a collider, in the model's part order.
   */
  export function segments(
    body: IAutoMovieMotionHumanBody,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    return new Set<AutoMovieHumanoidBone>(
      body.tangle.parts.map(
        (part: M.IPart): AutoMovieHumanoidBone => part.bone,
      ),
    );
  }

  /**
   * A lower bound on the signed distance from every probe of a segment to a
   * convex shape, the link pair's certificate (`HumanLinkCertificate.certify`),
   * read before any probe.
   */
  export const certify: typeof HumanLinkCertificate.certify =
    HumanLinkCertificate.certify;
}
.IPart): AutoMovieHumanoidBone => part.bone,
      ),
    );
  }

  /**
   * A lower bound on the signed distance from every probe of a segment to a
   * convex shape, the link pair's certificate (`HumanLinkCertificate.certify`),
   * read before any probe.
   */
  export const certify: typeof HumanLinkCertificate.certify =
    HumanLinkCertificate.certify;
}
,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as M } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmTrajectoryTerms } from "./HumanArmTrajectoryTerms";
import { HumanColliders } from "./HumanColliders";
import { HumanLinkCertificate } from "./HumanLinkCertificate";

/**
 * What the tangle and partner audits read a body by, as one provider every
 * consumer that keeps a limb clear reads too: the arm planner, the per-read
 * limb and digit fits, the course of a limb's swivel and the audit itself. The
 * probes, their reference depths and the related pairs stay the tangle model's
 * (`AutoMovieMotionHumanAuditTangleModel`); this owner places them with the
 * shapes they are read against and states the one depth a probe may lie past
 * its reference, so no consumer judges a narrower body or a different bound
 * than the take is judged by.
 */
export namespace HumanAuditModel {
  /**
   * How far past its reference depth a probe may lie in a shape, metres: the
   * audit's skin (`AutoMovieMotionHumanAuditSkin.BUILT`) less the arm solver's
   * own tolerance (`HumanArmTrajectoryTerms.DEPTH`), so what a consumer admits
   * the audit admits.
   */
  export const ALLOWANCE: number = HumanArmTrajectoryTerms.DEPTH;

  /** A body placed as the audit reads it, beside what else it is read against. */
  export interface IFrame {
    /** The body's tangle model. */
    model: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as M } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmTrajectoryTerms } from "./HumanArmTrajectoryTerms";
import { HumanColliders } from "./HumanColliders";
import { HumanLinkCertificate } from "./HumanLinkCertificate";

/**
 * What the tangle and partner audits read a body by, as one provider every
 * consumer that keeps a limb clear reads too: the arm planner, the per-read
 * limb and digit fits, the course of a limb's swivel and the audit itself. The
 * probes, their reference depths and the related pairs stay the tangle model's
 * (`AutoMovieMotionHumanAuditTangleModel`); this owner places them with the
 * shapes they are read against and states the one depth a probe may lie past
 * its reference, so no consumer judges a narrower body or a different bound
 * than the take is judged by.
 */
export namespace HumanAuditModel {
  /**
   * How far past its reference depth a probe may lie in a shape, metres: the
   * audit's skin (`AutoMovieMotionHumanAuditSkin.BUILT`) less the arm solver's
   * own tolerance (`HumanArmTrajectoryTerms.DEPTH`), so what a consumer admits
   * the audit admits.
   */
  export const ALLOWANCE: number = HumanArmTrajectoryTerms.DEPTH;

  /** A body placed as the audit reads it, beside what else it is read against. */
  export interface IFrame {
    /** The body's tangle model. */
    model: M.IModel;

    /** The body's segments placed, in the model's part order. */
    placed: IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Each part's probes in world metres, in the model's part and probe order:
     * its colliders' corners, then the points along its bone; the hand group's
     * digits are parts of their own.
     */
    probes: IAutoMovieVector3[][];

    /**
     * Another body's segments the body is read against, a partner's; none when
     * absent.
     */
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Segments no human body carries the body is read against, a prop's, a
     * carrier's or an animal's; none when absent.
     */
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[];
  }

  /**
   * A body placed as the audit reads it.
   *
   * @param body The body.
   * @param bones Its posed bones.
   * @param others Another body's placed segments it is read against.
   * @param externals Segments no human body carries it is read against, a
   *   carrier's included.
   * @returns The frame.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[] = [],
  ): IFrame {
    const model: M.IModel = body.tangle;
    const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(body, bones);
    return {
      model,
      placed,
      probes: placed.map(
        (
          segment: IAutoMovieMotionHumanColliders.IPlaced,
          i: number,
        ): IAutoMovieVector3[] =>
          model.parts[i]!.probes.map(
            (probe: IAutoMovieVector3): IAutoMovieVector3 =>
              Vector3.add(
                segment.pose.position,
                Quaternion.rotateVector(segment.pose.rotation, probe),
              ),
          ),
      ),
      others,
      externals,
    };
  }

  /**
   * The bones of a body whose colliders the audit reads, every segment of its
   * model: what a limb keeps clear of on another body, short of the parts a law
   * declares it rests on. The audits read every pair of segments of two bodies,
   * as trajopt and tesseract read every link pair
   * (`trajopt/src/collision_terms.cpp`, `tesseract/collision/bullet/src/
   * bullet_utils.cpp`), and an allowed contact is excluded by name, as MoveIt's
   * allowed-collision matrix lists the pairs allowed to touch; no subset of the
   * body is chosen by hand.
   *
   * @param body The body.
   * @returns Every bone carrying a collider, in the model's part order.
   */
  export function segments(
    body: IAutoMovieMotionHumanBody,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    return new Set<AutoMovieHumanoidBone>(
      body.tangle.parts.map(
        (part: M.IPart): AutoMovieHumanoidBone => part.bone,
      ),
    );
  }

  /**
   * A lower bound on the signed distance from every probe of a segment to a
   * convex shape, the link pair's certificate (`HumanLinkCertificate.certify`),
   * read before any probe.
   */
  export const certify: typeof HumanLinkCertificate.certify =
    HumanLinkCertificate.certify;
}
.IModel;

    /** The body's segments placed, in the model's part order. */
    placed: IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Each part's probes in world metres, in the model's part and probe order:
     * its colliders' corners, then the points along its bone; the hand group's
     * digits are parts of their own.
     */
    probes: IAutoMovieVector3[][];

    /**
     * Another body's segments the body is read against, a partner's; none when
     * absent.
     */
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Segments no human body carries the body is read against, a prop's, a
     * carrier's or an animal's; none when absent.
     */
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[];
  }

  /**
   * A body placed as the audit reads it.
   *
   * @param body The body.
   * @param bones Its posed bones.
   * @param others Another body's placed segments it is read against.
   * @param externals Segments no human body carries it is read against, a
   *   carrier's included.
   * @returns The frame.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[] = [],
  ): IFrame {
    const model: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as M } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmTrajectoryTerms } from "./HumanArmTrajectoryTerms";
import { HumanColliders } from "./HumanColliders";
import { HumanLinkCertificate } from "./HumanLinkCertificate";

/**
 * What the tangle and partner audits read a body by, as one provider every
 * consumer that keeps a limb clear reads too: the arm planner, the per-read
 * limb and digit fits, the course of a limb's swivel and the audit itself. The
 * probes, their reference depths and the related pairs stay the tangle model's
 * (`AutoMovieMotionHumanAuditTangleModel`); this owner places them with the
 * shapes they are read against and states the one depth a probe may lie past
 * its reference, so no consumer judges a narrower body or a different bound
 * than the take is judged by.
 */
export namespace HumanAuditModel {
  /**
   * How far past its reference depth a probe may lie in a shape, metres: the
   * audit's skin (`AutoMovieMotionHumanAuditSkin.BUILT`) less the arm solver's
   * own tolerance (`HumanArmTrajectoryTerms.DEPTH`), so what a consumer admits
   * the audit admits.
   */
  export const ALLOWANCE: number = HumanArmTrajectoryTerms.DEPTH;

  /** A body placed as the audit reads it, beside what else it is read against. */
  export interface IFrame {
    /** The body's tangle model. */
    model: M.IModel;

    /** The body's segments placed, in the model's part order. */
    placed: IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Each part's probes in world metres, in the model's part and probe order:
     * its colliders' corners, then the points along its bone; the hand group's
     * digits are parts of their own.
     */
    probes: IAutoMovieVector3[][];

    /**
     * Another body's segments the body is read against, a partner's; none when
     * absent.
     */
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Segments no human body carries the body is read against, a prop's, a
     * carrier's or an animal's; none when absent.
     */
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[];
  }

  /**
   * A body placed as the audit reads it.
   *
   * @param body The body.
   * @param bones Its posed bones.
   * @param others Another body's placed segments it is read against.
   * @param externals Segments no human body carries it is read against, a
   *   carrier's included.
   * @returns The frame.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[] = [],
  ): IFrame {
    const model: M.IModel = body.tangle;
    const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(body, bones);
    return {
      model,
      placed,
      probes: placed.map(
        (
          segment: IAutoMovieMotionHumanColliders.IPlaced,
          i: number,
        ): IAutoMovieVector3[] =>
          model.parts[i]!.probes.map(
            (probe: IAutoMovieVector3): IAutoMovieVector3 =>
              Vector3.add(
                segment.pose.position,
                Quaternion.rotateVector(segment.pose.rotation, probe),
              ),
          ),
      ),
      others,
      externals,
    };
  }

  /**
   * The bones of a body whose colliders the audit reads, every segment of its
   * model: what a limb keeps clear of on another body, short of the parts a law
   * declares it rests on. The audits read every pair of segments of two bodies,
   * as trajopt and tesseract read every link pair
   * (`trajopt/src/collision_terms.cpp`, `tesseract/collision/bullet/src/
   * bullet_utils.cpp`), and an allowed contact is excluded by name, as MoveIt's
   * allowed-collision matrix lists the pairs allowed to touch; no subset of the
   * body is chosen by hand.
   *
   * @param body The body.
   * @returns Every bone carrying a collider, in the model's part order.
   */
  export function segments(
    body: IAutoMovieMotionHumanBody,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    return new Set<AutoMovieHumanoidBone>(
      body.tangle.parts.map(
        (part: M.IPart): AutoMovieHumanoidBone => part.bone,
      ),
    );
  }

  /**
   * A lower bound on the signed distance from every probe of a segment to a
   * convex shape, the link pair's certificate (`HumanLinkCertificate.certify`),
   * read before any probe.
   */
  export const certify: typeof HumanLinkCertificate.certify =
    HumanLinkCertificate.certify;
}
.IModel = body.tangle;
    const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(body, bones);
    return {
      model,
      placed,
      probes: placed.map(
        (
          segment: IAutoMovieMotionHumanColliders.IPlaced,
          i: number,
        ): IAutoMovieVector3[] =>
          model.parts[i]!.probes.map(
            (probe: IAutoMovieVector3): IAutoMovieVector3 =>
              Vector3.add(
                segment.pose.position,
                Quaternion.rotateVector(segment.pose.rotation, probe),
              ),
          ),
      ),
      others,
      externals,
    };
  }

  /**
   * The bones of a body whose colliders the audit reads, every segment of its
   * model: what a limb keeps clear of on another body, short of the parts a law
   * declares it rests on. The audits read every pair of segments of two bodies,
   * as trajopt and tesseract read every link pair
   * (`trajopt/src/collision_terms.cpp`, `tesseract/collision/bullet/src/
   * bullet_utils.cpp`), and an allowed contact is excluded by name, as MoveIt's
   * allowed-collision matrix lists the pairs allowed to touch; no subset of the
   * body is chosen by hand.
   *
   * @param body The body.
   * @returns Every bone carrying a collider, in the model's part order.
   */
  export function segments(
    body: IAutoMovieMotionHumanBody,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    return new Set<AutoMovieHumanoidBone>(
      body.tangle.parts.map(
        (part: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as M } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmTrajectoryTerms } from "./HumanArmTrajectoryTerms";
import { HumanColliders } from "./HumanColliders";
import { HumanLinkCertificate } from "./HumanLinkCertificate";

/**
 * What the tangle and partner audits read a body by, as one provider every
 * consumer that keeps a limb clear reads too: the arm planner, the per-read
 * limb and digit fits, the course of a limb's swivel and the audit itself. The
 * probes, their reference depths and the related pairs stay the tangle model's
 * (`AutoMovieMotionHumanAuditTangleModel`); this owner places them with the
 * shapes they are read against and states the one depth a probe may lie past
 * its reference, so no consumer judges a narrower body or a different bound
 * than the take is judged by.
 */
export namespace HumanAuditModel {
  /**
   * How far past its reference depth a probe may lie in a shape, metres: the
   * audit's skin (`AutoMovieMotionHumanAuditSkin.BUILT`) less the arm solver's
   * own tolerance (`HumanArmTrajectoryTerms.DEPTH`), so what a consumer admits
   * the audit admits.
   */
  export const ALLOWANCE: number = HumanArmTrajectoryTerms.DEPTH;

  /** A body placed as the audit reads it, beside what else it is read against. */
  export interface IFrame {
    /** The body's tangle model. */
    model: M.IModel;

    /** The body's segments placed, in the model's part order. */
    placed: IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Each part's probes in world metres, in the model's part and probe order:
     * its colliders' corners, then the points along its bone; the hand group's
     * digits are parts of their own.
     */
    probes: IAutoMovieVector3[][];

    /**
     * Another body's segments the body is read against, a partner's; none when
     * absent.
     */
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Segments no human body carries the body is read against, a prop's, a
     * carrier's or an animal's; none when absent.
     */
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[];
  }

  /**
   * A body placed as the audit reads it.
   *
   * @param body The body.
   * @param bones Its posed bones.
   * @param others Another body's placed segments it is read against.
   * @param externals Segments no human body carries it is read against, a
   *   carrier's included.
   * @returns The frame.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[] = [],
  ): IFrame {
    const model: M.IModel = body.tangle;
    const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(body, bones);
    return {
      model,
      placed,
      probes: placed.map(
        (
          segment: IAutoMovieMotionHumanColliders.IPlaced,
          i: number,
        ): IAutoMovieVector3[] =>
          model.parts[i]!.probes.map(
            (probe: IAutoMovieVector3): IAutoMovieVector3 =>
              Vector3.add(
                segment.pose.position,
                Quaternion.rotateVector(segment.pose.rotation, probe),
              ),
          ),
      ),
      others,
      externals,
    };
  }

  /**
   * The bones of a body whose colliders the audit reads, every segment of its
   * model: what a limb keeps clear of on another body, short of the parts a law
   * declares it rests on. The audits read every pair of segments of two bodies,
   * as trajopt and tesseract read every link pair
   * (`trajopt/src/collision_terms.cpp`, `tesseract/collision/bullet/src/
   * bullet_utils.cpp`), and an allowed contact is excluded by name, as MoveIt's
   * allowed-collision matrix lists the pairs allowed to touch; no subset of the
   * body is chosen by hand.
   *
   * @param body The body.
   * @returns Every bone carrying a collider, in the model's part order.
   */
  export function segments(
    body: IAutoMovieMotionHumanBody,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    return new Set<AutoMovieHumanoidBone>(
      body.tangle.parts.map(
        (part: M.IPart): AutoMovieHumanoidBone => part.bone,
      ),
    );
  }

  /**
   * A lower bound on the signed distance from every probe of a segment to a
   * convex shape, the link pair's certificate (`HumanLinkCertificate.certify`),
   * read before any probe.
   */
  export const certify: typeof HumanLinkCertificate.certify =
    HumanLinkCertificate.certify;
}
.IPart): AutoMovieHumanoidBone => part.bone,
      ),
    );
  }

  /**
   * A lower bound on the signed distance from every probe of a segment to a
   * convex shape, the link pair's certificate (`HumanLinkCertificate.certify`),
   * read before any probe.
   */
  export const certify: typeof HumanLinkCertificate.certify =
    HumanLinkCertificate.certify;
}
