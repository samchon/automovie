import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { QuadrupedRestLimb } from "./QuadrupedRestLimb";

/** Neutral body connections and fixed parent-local attachment observations. */
export namespace QuadrupedAttachments {
  /** The rigid parent of an upper limb bar. */
  export type Parent = "trunk" | "hindquarters";

  /** A real capsule's cylindrical axis endpoints and complete radius, metres. */
  export interface ICapsule {
    /** First cap centre, model space. */
    from: IAutoMovieVector3;
    /** Second cap centre, model space. */
    to: IAutoMovieVector3;
    /** Positive solid radius. */
    radius: number;
  }

  /** An already admitted parent capsule, with its primitive-centre frame. */
  export interface IParent extends ICapsule {
    /** Parent primitive-centre TRS; unit scale, model space. */
    frame: IAutoMovieTransform;
  }

  /** One upper joint fixed in its real torso parent's coordinates. */
  export interface IAttachment {
    /** Real parent part identity. */
    parent: Parent;
    /** Upper endpoint in source model space. */
    point: IAutoMovieVector3;
    /** Same point in the parent part's primitive-centre frame. */
    parentLocal: IAutoMovieVector3;
  }

  /** The torso capsules that both construction and the body layout use. */
  export function solids(
    rig: Pick<
      AutoMovieArchetypeQuadrupedBody.IRig,
      "back" | "trunk" | "barrel" | "quarters"
    >,
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
   * Ground terminal cylinders and connect provisional neutral roots to body
   * solids.
   *
   * This is an authored construction rule, not measured joint anatomy. In each
   * limb's fixed sagittal plane, translate its initial chain by the terminal
   * cylinder's exact sole clearance. The body landmarks stay unchanged. Take
   * the nearest point of the parent section only if that root lies outside;
   * solve the first two bars exactly, preserving all four lengths, the foot X/Z
   * and both distal directions. No whole-model root offset is introduced.
   */
  export function conform(
    limbs: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, readonly IAutoMovieVector3[]>
    >,
    parents: Readonly<Record<Parent, ICapsule>>,
    terminalRadius: number,
  ): Readonly<
    Record<AutoMovieArchetypeQuadrupedBody.Limb, readonly IAutoMovieVector3[]>
  > {
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

  /** Admit physical connections and snapshot their fixed parent-local points. */
  export function read(
    limbs: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, readonly IAutoMovieVector3[]>
    >,
    parents: Readonly<Record<Parent, IParent>>,
  ): Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, IAttachment>> {
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
    if (!(terminalRadius > 0) || initial.length !== 5)
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
        !(length > 0) ||
        Math.abs(current.x - initial[0]!.x) >
          roundoff(current, initial[0]!, length)
      )
        throw new RangeError(
          "Neutral attachment construction requires four positive coplanar bars",
        );
      lengths.push(length);
    }

    // This is the same flat fourth cylinder that AutoMovieArchetypeQuadrupedBody.lay emits.
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
    const origin: IAutoMovieVector3 = source[0]!;
    if (parent.from.x !== parent.to.x)
      throw new RangeError(
        "Neutral parent capsule must stay in its sagittal plane",
      );
    const nearest: IAutoMovieVector3 = axisPoint(origin, parent);
    const lateral: number = Math.abs(origin.x - parent.from.x);
    if (!(parent.radius > lateral))
      throw new RangeError(
        "Neutral limb plane must cut a positive section of its parent capsule",
      );
    const section: number = Math.sqrt(
      (parent.radius - lateral) * (parent.radius + lateral),
    );
    if (!(section > 0))
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

  /**
   * Read-only physical membership and primitive-centre inverse rigid
   * conversion.
   */
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
      !(solid.radius > 0) ||
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
    return { parent, point: { ...point }, parentLocal };
  }

  /**
   * Nearest point on the finite axis; endpoint restriction defines a capsule,
   * not a moving-target correction.
   */
  function axisPoint(
    point: IAutoMovieVector3,
    solid: ICapsule,
  ): IAutoMovieVector3 {
    const dx: number = solid.to.x - solid.from.x;
    const dy: number = solid.to.y - solid.from.y;
    const dz: number = solid.to.z - solid.from.z;
    const span: number = Math.hypot(dx, dy, dz);
    if (!(span > 0))
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
    const along: number = Math.max(0, Math.min(span, projection));
    return {
      x: solid.from.x + along * ux,
      y: solid.from.y + along * uy,
      z: solid.from.z + along * uz,
    };
  }

  /** Bar's sagittal direction, radians from down toward +Z. */
  function direction(from: IAutoMovieVector3, to: IAutoMovieVector3): number {
    return Math.atan2(to.z - from.z, -(to.y - from.y));
  }

  /**
   * Fixed-size rigid geometry arithmetic budget, never an authored gap or
   * contact tolerance.
   */
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
