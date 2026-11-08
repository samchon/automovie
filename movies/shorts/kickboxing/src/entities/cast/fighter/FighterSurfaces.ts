import {
  Quaternion,
  Vector3,
  type resolveAutoMovieRelationalGoal,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { StrikeShape } from "../../../laws/kickboxing/StrikeShape";

/**
 * A fighter's named surfaces on his physical profile: the regions an
 * opponent strikes and the weapon surfaces he strikes with, each a point on
 * a segment's declared collider in that segment's frame. A region is the
 * collider's support point in a body-frame direction at neutral; a weapon
 * adds the outward direction it strikes along.
 *
 * ```ts
 * const { regions, weapons } = FighterSurfaces.derive(profile);
 * weapons["instep-right"]; // { bone: "rightLowerLeg", localPoint, localDirection }
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#surfaces The struck regions and weapon surfaces of the surfaces table.
 * @evidence docs/research/kickboxing/brazilian-kick.md#law The instep and distal shin meet at the ankle's front.
 */
export namespace FighterSurfaces {
  /** A weapon surface: a segment-local point and its outward striking direction. */
  export interface IWeapon {
    /** The segment. */
    bone: string;

    /** The point in the segment's frame, metres. */
    localPoint: IAutoMovieVector3;

    /** The outward direction it strikes along, in the segment's frame. */
    localDirection: IAutoMovieVector3;
  }

  /**
   * The regions and weapons of a profile whose hands carry sphere gloves
   * named `left-glove` and `right-glove`.
   *
   * @param profile The physical profile with gloves, at neutral.
   * @returns Regions and weapons by id.
   */
  export function derive(profile: P): {
    regions: Readonly<Record<string, resolveAutoMovieRelationalGoal.IRegion>>;
    weapons: Readonly<Record<string, IWeapon>>;
  } {
    const segment = (bone: string): P.ISegment =>
      profile.segments.find((s: P.ISegment): boolean => s.bone === bone)!;
    const surface = (
      bone: string,
      direction: IAutoMovieVector3,
      shapeId?: string,
    ): resolveAutoMovieRelationalGoal.IRegion => {
      const s: P.ISegment = segment(bone);
      const shape: P.IShape = shapeId
        ? s.shapes.find((c: P.IShape): boolean => c.id === shapeId)!
        : s.shapes[0]!;
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(s.neutral.rotation),
        Vector3.normalize(direction),
      );
      return { bone, localPoint: support(shape, local) };
    };
    const regions: Record<string, resolveAutoMovieRelationalGoal.IRegion> = {
      face: surface("head", { x: 1, y: -0.2, z: 0 }),
      chin: surface("head", { x: 0.6, y: -0.8, z: 0 }),
      stomach: surface("spine", { x: 1, y: 0, z: 0 }),
      "head-back": surface("head", { x: -1, y: 0, z: 0 }),
    };
    const weapons: Record<string, IWeapon> = {};
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      regions[`jaw-${side}`] = surface("head", {
        x: 0.4,
        y: -0.5,
        z: sign * 0.75,
      });
      regions[`head-${side}`] = surface("head", { x: 0, y: 0, z: sign });
      regions[`jaw-neck-${side}`] = surface("neck", {
        x: -0.3,
        y: 0.3,
        z: sign,
      });
      regions[`ribs-${side}`] = surface("chest", { x: 0.2, y: -0.3, z: sign });
      regions[`thigh-${side}`] = surface(`${side}UpperLeg`, {
        x: 0.2,
        y: 0,
        z: sign,
      });
      regions[`glove-${side}`] = surface(
        `${side}Hand`,
        { x: 1, y: 0, z: 0 },
        `${side}-glove`,
      );
      regions[`forearm-${side}`] = surface(`${side}LowerArm`, {
        x: 0.5,
        y: 0,
        z: sign,
      });
      regions[`shin-${side}`] = surface(`${side}LowerLeg`, {
        x: 1,
        y: 0,
        z: sign * 0.5,
      });
      // The knuckles: the glove sphere's front, along the hand.
      const glove: P.IShape = segment(`${side}Hand`).shapes.find(
        (c: P.IShape): boolean => c.id === `${side}-glove`,
      )!;
      if (glove.kind !== "sphere") throw new Error("A glove is a sphere");
      const along: IAutoMovieVector3 = Vector3.normalize(
        glove.transform.position,
      );
      weapons[`knuckles-${side}`] = {
        bone: `${side}Hand`,
        localPoint: Vector3.add(
          glove.transform.position,
          Vector3.scale(along, glove.radius),
        ),
        localDirection: along,
      };
      // The shin: its side surface at the lower shin's share of the shank.
      const lower: P.ISegment = segment(`${side}LowerLeg`);
      const foot: P.ISegment = segment(`${side}Foot`);
      const toAnkle: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(lower.neutral.rotation),
        Vector3.subtract(foot.neutral.position, lower.neutral.position),
      );
      const axis: IAutoMovieVector3 = Vector3.normalize(toAnkle);
      const across = (p: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.subtract(p, Vector3.scale(axis, Vector3.dot(p, axis)));
      const side_: IAutoMovieVector3 = across(
        surface(`${side}LowerLeg`, { x: 0.3, y: 0, z: -sign }).localPoint,
      );
      weapons[`shin-${side}`] = {
        bone: `${side}LowerLeg`,
        localPoint: Vector3.add(
          Vector3.scale(toAnkle, StrikeShape.SHIN_SHARE),
          side_,
        ),
        localDirection: Vector3.normalize(side_),
      };
      // The instep meets the distal shin at the ankle's front: the shin
      // collider's front surface at the ankle end of the lower leg.
      const front: IAutoMovieVector3 = across(
        surface(`${side}LowerLeg`, { x: 1, y: 0, z: 0 }).localPoint,
      );
      weapons[`instep-${side}`] = {
        bone: `${side}LowerLeg`,
        localPoint: Vector3.add(toAnkle, front),
        localDirection: Vector3.normalize(front),
      };
      const sole = surface(`${side}Midfoot`, { x: 0.3, y: -1, z: 0 });
      weapons[`sole-${side}`] = {
        ...sole,
        localDirection: Vector3.normalize(sole.localPoint),
      };
      weapons[`knee-${side}`] = {
        ...surface(`${side}LowerLeg`, { x: 1, y: 0.4, z: 0 }),
        localDirection: Quaternion.rotateVector(
          Quaternion.inverse(lower.neutral.rotation),
          { x: 1, y: 0, z: 0 },
        ),
      };
    }
    return {
      regions: Object.freeze(regions),
      weapons: Object.freeze(weapons),
    };
  }

  /** A collider's support point in a local unit direction: its farthest surface point that way. */
  function support(
    shape: P.IShape,
    direction: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(shape.transform.rotation),
      direction,
    );
    let point: IAutoMovieVector3;
    switch (shape.kind) {
      case "sphere":
        point = Vector3.scale(local, shape.radius);
        break;
      case "capsule":
        point = Vector3.add(
          { x: 0, y: Math.sign(local.y) * shape.halfLength, z: 0 },
          Vector3.scale(local, shape.radius),
        );
        break;
      case "box": {
        const h = shape.halfExtents;
        const t: number = Math.min(
          local.x === 0 ? Infinity : h.x / Math.abs(local.x),
          local.y === 0 ? Infinity : h.y / Math.abs(local.y),
          local.z === 0 ? Infinity : h.z / Math.abs(local.z),
        );
        point = Vector3.scale(local, t);
        break;
      }
      default:
        throw new Error(
          `Unsupported region collider ${(shape as P.IShape).kind}`,
        );
    }
    return Vector3.add(
      shape.transform.position,
      Quaternion.rotateVector(shape.transform.rotation, point),
    );
  }
}
