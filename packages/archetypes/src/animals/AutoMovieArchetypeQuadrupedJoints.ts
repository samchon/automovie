import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { QuadrupedAttachments } from "./quadruped/QuadrupedAttachments";

/**
 * Admit the neutral quadruped bars and read their fixed body connections.
 *
 * Public only so the package's specs can reach it: it is not part of the
 * authoring surface, and it moves to an internal subpath when one exists.
 */
export namespace AutoMovieArchetypeQuadrupedJoints {
  /**
   * Read and admit the five joints of every neutral limb and its parent.
   *
   * The source bar's +Y runs from its upper to its lower endpoint. A capsule's
   * height is its cylindrical span, so cap radius never changes joint length.
   * The returned attachment's parentLocal is relative to the parent's
   * primitive-centre TRS, not the generic skeleton's upper-joint frame.
   *
   * @param parts Neutral model parts with root-local rigid transforms.
   * @returns Independent limb/neck points and admitted fixed parent
   *   coordinates.
   * @throws {RangeError} For malformed, missing, repeated or nonrigid bars,
   *   broken chains, unsupported parent solids or detached upper joints.
   */
  export function read(parts: readonly IAutoMovieModelPart[]): {
    limbs: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, readonly IAutoMovieVector3[]>
    >;
    neck: IAutoMovieVector3;
    attachments: Readonly<
      Record<
        AutoMovieArchetypeQuadrupedBody.Limb,
        QuadrupedAttachments.IAttachment
      >
    >;
  } {
    const indexed: Map<string, IAutoMovieModelPart> = new Map();
    for (const part of parts) {
      if (indexed.has(part.id))
        throw new RangeError(`Repeated quadruped part: ${part.id}`);
      indexed.set(part.id, part);
    }
    const names: readonly AutoMovieArchetypeQuadrupedBody.Bone[] = [
      "trunk",
      "hindquarters",
      "neck",
      "head",
      "tail",
      ...AutoMovieArchetypeQuadrupedBody.LIMBS.flatMap(
        (
          limb: AutoMovieArchetypeQuadrupedBody.Limb,
        ): AutoMovieArchetypeQuadrupedBody.Bone[] => [
          ...AutoMovieArchetypeQuadrupedBody.BONES[limb],
        ],
      ),
    ];
    const bars: Map<AutoMovieArchetypeQuadrupedBody.Bone, Bar> = new Map();
    for (const bone of names) {
      const source: IAutoMovieModelPart | undefined = indexed.get(bone);
      if (source === undefined)
        throw new RangeError(`Missing actual quadruped bar: ${bone}`);
      bars.set(bone, admit(source));
    }
    const neck: Bar = bar("neck");
    const head: Bar = bar("head");
    closure(
      neck.to,
      head.from,
      Math.max(neck.height, head.height),
      "neck/head",
    );
    closure(
      bar("trunk").from,
      bar("hindquarters").from,
      Math.max(bar("trunk").height, bar("hindquarters").height),
      "trunk/hindquarters",
    );
    const limbs: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, readonly IAutoMovieVector3[]>
    > = {
      leftFore: chain("leftFore"),
      rightFore: chain("rightFore"),
      leftHind: chain("leftHind"),
      rightHind: chain("rightHind"),
    };
    return {
      limbs,
      neck: { ...neck.from },
      attachments: QuadrupedAttachments.read(limbs, {
        trunk: parent("trunk"),
        hindquarters: parent("hindquarters"),
      }),
    };

    /*
     * Require an already admitted named bar instead of asserting a map cast.
     */
    function bar(bone: AutoMovieArchetypeQuadrupedBody.Bone): Bar {
      const found: Bar | undefined = bars.get(bone);
      if (found === undefined)
        throw new RangeError(`Unprepared quadruped bar: ${bone}`);
      return found;
    }

    /*
     * The coarse body contract uses capsules for both torso parents.
     */
    function parent(
      id: QuadrupedAttachments.Parent,
    ): QuadrupedAttachments.IParent {
      const actual: Bar = bar(id);
      if (actual.kind !== "capsule")
        throw new RangeError(
          `Quadruped parent ${id} must be its actual capsule solid`,
        );
      return {
        from: actual.from,
        to: actual.to,
        radius: actual.radius,
        frame: actual.frame,
      };
    }

    /*
     * Every joint is simultaneously the preceding lower and following upper
     * endpoint.
     */
    function chain(
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
    ): IAutoMovieVector3[] {
      const links: readonly Bar[] =
        AutoMovieArchetypeQuadrupedBody.BONES[limb].map(bar);
      const points: IAutoMovieVector3[] = [{ ...links[0]!.from }];
      for (let index: number = 0; index < links.length; index++) {
        const link: Bar = links[index]!;
        if (index > 0) {
          const previous: Bar = links[index - 1]!;
          closure(
            previous.to,
            link.from,
            Math.max(previous.height, link.height),
            `${limb}/${index}`,
          );
        }
        if (
          Math.abs(link.from.x - points[0]!.x) >
            roundoff(link.from, points[0]!, link.height) ||
          Math.abs(link.to.x - points[0]!.x) >
            roundoff(link.to, points[0]!, link.height)
        )
          throw new RangeError(
            `Actual ${limb} bars do not share their neutral sagittal plane`,
          );
        points.push({ ...link.to });
      }
      return points;
    }

    /*
     * One arithmetic-noise closure contract for axial and limb junctions.
     */
    function closure(
      left: IAutoMovieVector3,
      right: IAutoMovieVector3,
      length: number,
      label: string,
    ): void {
      const gap: number = Math.hypot(
        left.x - right.x,
        left.y - right.y,
        left.z - right.z,
      );
      if (gap > roundoff(left, right, length))
        throw new RangeError(
          `Actual quadruped junction ${label} has a gap: ${gap} m`,
        );
    }
  }

  /*
   * Admit the positive primitive and root-local unit rigid frame before
   * decoding either endpoint.
   */
  function admit(part: IAutoMovieModelPart): Bar {
    if (
      part.geometry.type !== "primitive" ||
      (part.geometry.shape.type !== "cylinder" &&
        part.geometry.shape.type !== "capsule") ||
      part.transform === null ||
      part.transform === undefined ||
      part.attachedBone !== null
    )
      throw new RangeError(
        `Quadruped ${part.id} must be an actual root-local transformed rigid bar`,
      );
    const shape: typeof part.geometry.shape = part.geometry.shape;
    const frame: IAutoMovieTransform = part.transform;
    if (
      ![shape.height, shape.radius].every(
        (value: number): boolean => value > 0,
      ) ||
      frame.scale.x !== 1 ||
      frame.scale.y !== 1 ||
      frame.scale.z !== 1
    )
      throw new RangeError(
        `Quadruped ${part.id} requires positive finite dimensions and a finite unit-scale transform`,
      );
    const norm: number = Math.hypot(
      frame.rotation.x,
      frame.rotation.y,
      frame.rotation.z,
      frame.rotation.w,
    );
    if (Math.abs(norm - 1) > 64 * Number.EPSILON)
      throw new RangeError(`Quadruped ${part.id} requires a unit quaternion`);
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
      x: 0,
      y: shape.height / 2,
      z: 0,
    });
    const from: IAutoMovieVector3 = {
      x: frame.translation.x - offset.x,
      y: frame.translation.y - offset.y,
      z: frame.translation.z - offset.z,
    };
    const to: IAutoMovieVector3 = {
      x: frame.translation.x + offset.x,
      y: frame.translation.y + offset.y,
      z: frame.translation.z + offset.z,
    };
    const length: number = Math.hypot(
      to.x - from.x,
      to.y - from.y,
      to.z - from.z,
    );
    if (!(length > 0))
      throw new RangeError(
        `Quadruped ${part.id} axis is not finitely representable`,
      );
    return {
      kind: shape.type,
      height: shape.height,
      radius: shape.radius,
      from,
      to,
      frame: {
        translation: { ...frame.translation },
        rotation: { ...frame.rotation },
        scale: { ...frame.scale },
      },
    };
  }

  /*
   * Bounded endpoint/rigid-transform arithmetic noise, independent of
   * visible-contact tolerances.
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

/** One admitted rigid bar, with independently owned geometric observations. */
interface Bar {
  /** Primitive discriminator, not a reconstructed species assumption. */
  kind: "cylinder" | "capsule";
  /** Source primitive radius, metres. */
  radius: number;
  /** Source cylindrical span, excluding capsule caps, metres. */
  height: number;
  /** Primitive-centre frame, admitted rigid and copied. */
  frame: IAutoMovieTransform;
  /** Directed upper axis endpoint, source model metres. */
  from: IAutoMovieVector3;
  /** Directed lower axis endpoint, source model metres. */
  to: IAutoMovieVector3;
}
