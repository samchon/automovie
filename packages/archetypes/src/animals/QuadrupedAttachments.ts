import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedRestLimb } from "./QuadrupedRestLimb";

/**
 * Neutral body connections and fixed parent-local attachment observations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes explicit neutral construction from motion: the former connects an authored control rig to its actual torso capsules, while the latter only reads and admits fixed source attachments.
 * @evidence contracts/development/design.md#principled-representation Parent capsules have their actual axis/radius, and an attachment carries both model and primitive-centre parent coordinates. Neutral construction preserves four bar lengths, foot X/Z and distal carriage while placing the actual terminal cylinder's sole at ground Y=0.
 * @evidence contracts/development/design.md#minimal-and-owned-surface QuadrupedBody uses the shared capsule definitions and neutral construction; QuadrupedJoints uses the actual-part attachment admission. The ride receives fixed attachment metadata without a species branch or another skeleton representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The explicit grounding and closest-solid construction operates only on initial provisional geometry, never on a requested moving root or foot. Already grounded and connected chains stay unchanged; impossible geometry refuses instead of stretching or using a speed/breed fixture.
 */
export namespace QuadrupedAttachments {
  /**
   * The actual rigid parent of an upper limb bar.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two existing axial parent parts.
   * @evidence contracts/development/design.md#principled-representation A closed union retains the quadruped hierarchy's fore/hind ownership.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Used by capsule definitions and fixed attachment metadata.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No free-text or humanoid substitute selects a parent.
   */
  export type Parent = "trunk" | "hindquarters";

  /**
   * A real capsule's cylindrical axis endpoints and complete radius, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines cap centres rather than total capsule extrema, with the common positive radius in metres.
   * @evidence contracts/development/design.md#principled-representation The same finite segment and radius define the constructed torso rod and its closed solid for connection admission.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Shared by neutral geometry and the admitted actual parent reader; no mesh or material data are repeated.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A radius is not expanded to cover a detached joint, and unknown geometry cannot become a zero-height bar.
   */
  export interface ICapsule {
    /** First cap centre, model space. */
    from: IAutoMovieVector3;
    /** Second cap centre, model space. */
    to: IAutoMovieVector3;
    /** Actual positive solid radius. */
    radius: number;
  }

  /**
   * An already admitted actual parent capsule, with its primitive-centre frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The reader supplies actual cap centres/radius and the finite unit rigid part frame, not a joint-origin FK frame.
   * @evidence contracts/development/design.md#principled-representation Actual geometry and its actual model transform together define the owning parent coordinate system.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Adds only the frame needed to express the attachment in the parent's local coordinates.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Frames originate from admitted source parts and never from a species proportion table or an inferred humanoid bone.
   */
  export interface IParent extends ICapsule {
    /** Actual parent primitive-centre TRS; unit scale, model space. */
    frame: IAutoMovieTransform;
  }

  /**
   * One actual upper joint fixed in its real torso parent's coordinates.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines source model-space point and primitive-centre parent-local point in metres; these are distinct from the skeleton's upper-joint origin.
   * @evidence contracts/development/design.md#principled-representation The closed parent identity and one rigidly transformed point represent the same fixed skeletal connection in both useful spaces.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplies the ride and independent observers only the fixed connection they need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No allowed travel, inferred scapular translation, tolerance-sized gap or mutable producer record accompanies the connection.
   */
  export interface IAttachment {
    /** Real parent part identity. */
    parent: Parent;
    /** Actual upper endpoint in source model space. */
    point: IAutoMovieVector3;
    /** Same point in the actual parent part's primitive-centre frame. */
    parentLocal: IAutoMovieVector3;
  }

  /**
   * The torso capsules that both construction and the actual body layout use.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the actual trunk/rump cap centres from the same rest landmarks and shared barrel radius.
   * @evidence contracts/development/implementation.md#principled-implementation The trunk spans its declared half-length at back-minus-radius; the rump shares its rear cap and ends at the declared quarters centre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Compute the shared rear endpoint once and return the two named capsule records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No attachment fit changes these body dimensions or adds an invisible connection primitive.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant coordinate work and two small records, outside motion sampling.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Layout and neutral conformation consume this same owned definition instead of separate torso formulas.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns independent scalar points and retains no rig or external resource.
   */
  export function solids(
    rig: Pick<QuadrupedBody.IRig, "back" | "trunk" | "barrel" | "quarters">,
  ): Readonly<Record<Parent, ICapsule>> {
    const rear: IAutoMovieVector3 = {
      x: 0,
      y: rig.back - rig.barrel,
      z: -rig.trunk / 2,
    };
    return {
      trunk: {
        from: rear,
        to: { x: 0, y: rear.y, z: rig.trunk / 2 },
        radius: rig.barrel,
      },
      hindquarters: {
        from: { ...rear },
        to: { ...rig.quarters },
        radius: rig.barrel,
      },
    };
  }

  /**
   * Ground actual terminal cylinders and connect provisional neutral roots to body solids.
   *
   * This is an authored construction rule, not measured joint anatomy. In each
   * limb's fixed sagittal plane, translate its initial chain by the terminal
   * cylinder's exact sole clearance. The body landmarks stay unchanged. Take
   * the nearest point of the parent section only if that root lies outside;
   * solve the first two bars exactly, preserving all four lengths, the foot
   * X/Z and both distal directions. No whole-model root offset is introduced.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines exact flat-cylinder grounding, explicit neutral connection, actual parent section, preserved source lengths/footprint/distal carriage and refusal for incompatible geometry; terminalRadius is the same metre radius used by the body layout's fourth rods.
   * @evidence contracts/development/implementation.md#principled-implementation The actual terminal cylinder requires distal endpoint Y=r*hypot(axisX,axisZ)+height*max(0,axisY), including an upward terminal's axial extent. Ground the initial chain without moving the body; a capsule's fixed-X section and the existing exact proximal fit then connect any outside root.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Apply the same pure connection rule to the two fore and two hind chains, without a breed or speed branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Body measurements, parent solids, four lengths, footprint and distal carriage stay fixed; only the explicitly constructed terminal-centre height follows its real sole geometry. No whole-model rise changes measured withers height and no requested motion goal is clamped; impossible neutral reach refuses.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four fixed-size geometric projections and at most four closed-form two-circle fits take O(1) time and storage during construction.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the actual common torso definitions and QuadrupedRestLimb's admitted exact length-preserving fit, not a second IK implementation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Every returned chain/point is independently owned; no caller array, completed pose cache or handle is retained.
   */
  export function conform(
    limbs: Readonly<Record<QuadrupedBody.Limb, readonly IAutoMovieVector3[]>>,
    parents: Readonly<Record<Parent, ICapsule>>,
    terminalRadius: number,
  ): Readonly<Record<QuadrupedBody.Limb, readonly IAutoMovieVector3[]>> {
    return {
      leftFore: connect(limbs.leftFore, parents.trunk, true, terminalRadius),
      rightFore: connect(limbs.rightFore, parents.trunk, true, terminalRadius),
      leftHind: connect(
        limbs.leftHind,
        parents.hindquarters,
        false,
        terminalRadius,
      ),
      rightHind: connect(
        limbs.rightHind,
        parents.hindquarters,
        false,
        terminalRadius,
      ),
    };
  }

  /**
   * Admit actual physical connections and snapshot their fixed parent-local points.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Consumes source chains and already admitted actual parent capsules, rejects disconnected roots and states the primitive-centre coordinate convention.
   * @evidence contracts/development/implementation.md#principled-implementation Compare each actual proximal point to its actual closed capsule, then invert that parent's unit rigid frame to record the same point locally.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Four bindings use one physical membership and coordinate conversion owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reading never repairs source geometry or moves roots. Only scale-derived binary64 roundoff admits a calculated boundary; a real gap refuses.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four constant-size point/segment distances and rigid conversions, once per prepared animal.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual parent axes and frames prepared by QuadrupedJoints serve both membership and parent-local coordinates.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned points are independent scalar copies and retain no part, geometry buffer or mutable source array.
   */
  export function read(
    limbs: Readonly<Record<QuadrupedBody.Limb, readonly IAutoMovieVector3[]>>,
    parents: Readonly<Record<Parent, IParent>>,
  ): Readonly<Record<QuadrupedBody.Limb, IAttachment>> {
    return {
      leftFore: binding("trunk", limbs.leftFore[0]!, parents.trunk),
      rightFore: binding("trunk", limbs.rightFore[0]!, parents.trunk),
      leftHind: binding(
        "hindquarters",
        limbs.leftHind[0]!,
        parents.hindquarters,
      ),
      rightHind: binding(
        "hindquarters",
        limbs.rightHind[0]!,
        parents.hindquarters,
      ),
    };
  }

  /** Explicit neutral construction in one canonical sagittal capsule section. */
  function connect(
    initial: readonly IAutoMovieVector3[],
    parent: ICapsule,
    fore: boolean,
    terminalRadius: number,
  ): IAutoMovieVector3[] {
    if (
      !(Number.isFinite(terminalRadius) && terminalRadius > 0) ||
      initial.length !== 5 ||
      initial.some(
        (point: IAutoMovieVector3): boolean =>
          ![point.x, point.y, point.z].every(Number.isFinite),
      )
    )
      throw new RangeError(
        "Neutral attachment construction requires five finite joints and a positive terminal radius",
      );
    const lengths: number[] = [];
    for (let index: number = 1; index < initial.length; index++) {
      const before: IAutoMovieVector3 = initial[index - 1]!;
      const current: IAutoMovieVector3 = initial[index]!;
      const length: number = Math.hypot(
        current.x - before.x,
        current.y - before.y,
        current.z - before.z,
      );
      if (
        !(Number.isFinite(length) && length > 0) ||
        Math.abs(current.x - initial[0]!.x) >
          roundoff(current, initial[0]!, length)
      )
        throw new RangeError(
          "Neutral attachment construction requires four positive coplanar bars",
        );
      lengths.push(length);
    }

    // This is the same flat fourth cylinder that QuadrupedBody.lay emits.
    // Its centreline endpoint is not its sole when the bar is inclined.
    const terminal: number = lengths[3]!;
    const axis: IAutoMovieVector3 = {
      x: (initial[4]!.x - initial[3]!.x) / terminal,
      y: (initial[4]!.y - initial[3]!.y) / terminal,
      z: (initial[4]!.z - initial[3]!.z) / terminal,
    };
    const height: number =
      terminalRadius * Math.hypot(axis.x, axis.z) +
      terminal * Math.max(0, axis.y);
    const offset: number = height - initial[4]!.y;
    const source: IAutoMovieVector3[] = initial.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 => ({
        x: point.x,
        y: point.y + offset,
        z: point.z,
      }),
    );
    if (
      !(Number.isFinite(height) && Number.isFinite(offset)) ||
      source.some(
        (point: IAutoMovieVector3): boolean => !Number.isFinite(point.y),
      )
    )
      throw new RangeError(
        "Neutral terminal support is not finitely representable",
      );
    const origin: IAutoMovieVector3 = source[0]!;
    if (parent.from.x !== parent.to.x)
      throw new RangeError(
        "Neutral parent capsule must stay in its sagittal plane",
      );
    const nearest: IAutoMovieVector3 = axisPoint(origin, parent);
    const lateral: number = Math.abs(origin.x - parent.from.x);
    if (!(Number.isFinite(parent.radius) && parent.radius > lateral))
      throw new RangeError(
        "Neutral limb plane must cut a positive section of its parent capsule",
      );
    const section: number = Math.sqrt(
      (parent.radius - lateral) * (parent.radius + lateral),
    );
    if (!(Number.isFinite(section) && section > 0))
      throw new RangeError(
        "Neutral parent section is not finitely representable",
      );
    const dy: number = origin.y - nearest.y;
    const dz: number = origin.z - nearest.z;
    const distance: number = Math.hypot(dy, dz);
    if (distance <= section + roundoff(origin, nearest, parent.radius))
      return source.map(
        (point: IAutoMovieVector3): IAutoMovieVector3 => ({ ...point }),
      );
    const root: IAutoMovieVector3 = {
      x: origin.x,
      y: nearest.y + dy * (section / distance),
      z: nearest.z + dz * (section / distance),
    };
    const distal: [number, number] = [
      direction(source[2]!, source[3]!),
      direction(source[3]!, source[4]!),
    ];
    return QuadrupedRestLimb(source, root, source[4]!, distal, fore ? -1 : 1);
  }

  /** Read-only physical membership and primitive-centre inverse rigid conversion. */
  function binding(
    parent: Parent,
    point: IAutoMovieVector3 | undefined,
    solid: IParent,
  ): IAttachment {
    if (point === undefined)
      throw new RangeError(`Missing actual ${parent} limb attachment`);
    const nearest: IAutoMovieVector3 = axisPoint(point, solid);
    const distance: number = Math.hypot(
      point.x - nearest.x,
      point.y - nearest.y,
      point.z - nearest.z,
    );
    if (
      !(Number.isFinite(solid.radius) && solid.radius > 0) ||
      distance > solid.radius + roundoff(point, nearest, solid.radius)
    )
      throw new RangeError(
        `The actual ${parent} does not contain its limb attachment: distance ${distance} m, radius ${solid.radius} m`,
      );
    const parentLocal: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(solid.frame.rotation),
      {
        x: point.x - solid.frame.translation.x,
        y: point.y - solid.frame.translation.y,
        z: point.z - solid.frame.translation.z,
      },
    );
    if (![parentLocal.x, parentLocal.y, parentLocal.z].every(Number.isFinite))
      throw new RangeError(
        `The ${parent} attachment is not finitely representable in its parent frame`,
      );
    return { parent, point: { ...point }, parentLocal };
  }

  /** Nearest point on the actual finite axis; endpoint restriction defines a capsule, not a moving-target correction. */
  function axisPoint(
    point: IAutoMovieVector3,
    solid: ICapsule,
  ): IAutoMovieVector3 {
    const dx: number = solid.to.x - solid.from.x;
    const dy: number = solid.to.y - solid.from.y;
    const dz: number = solid.to.z - solid.from.z;
    const span: number = Math.hypot(dx, dy, dz);
    if (
      !(Number.isFinite(span) && span > 0) ||
      ![
        point.x,
        point.y,
        point.z,
        solid.from.x,
        solid.from.y,
        solid.from.z,
        solid.to.x,
        solid.to.y,
        solid.to.z,
      ].every(Number.isFinite)
    )
      throw new RangeError(
        "Attachment capsule axis and query must be finite and nondegenerate",
      );
    const ux: number = dx / span;
    const uy: number = dy / span;
    const uz: number = dz / span;
    const projection: number =
      (point.x - solid.from.x) * ux +
      (point.y - solid.from.y) * uy +
      (point.z - solid.from.z) * uz;
    if (!Number.isFinite(projection))
      throw new RangeError(
        "Attachment coordinates are not finitely representable",
      );
    const along: number = Math.max(0, Math.min(span, projection));
    return {
      x: solid.from.x + along * ux,
      y: solid.from.y + along * uy,
      z: solid.from.z + along * uz,
    };
  }

  /** Actual bar's sagittal direction, radians from down toward +Z. */
  function direction(from: IAutoMovieVector3, to: IAutoMovieVector3): number {
    return Math.atan2(to.z - from.z, -(to.y - from.y));
  }

  /** Fixed-size rigid geometry arithmetic budget, never an authored gap or contact tolerance. */
  function roundoff(
    left: IAutoMovieVector3,
    right: IAutoMovieVector3,
    length: number,
  ): number {
    return (
      64 *
      Number.EPSILON *
      Math.max(
        1,
        Math.abs(length),
        Math.abs(left.x),
        Math.abs(left.y),
        Math.abs(left.z),
        Math.abs(right.x),
        Math.abs(right.y),
        Math.abs(right.z),
      )
    );
  }
}
