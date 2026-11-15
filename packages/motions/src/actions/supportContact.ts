import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanSupport } from "../law/HumanSupport";
import type { HumanBodyFit } from "../posture/HumanBodyFit";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { stand } from "./stand";

/**
 * A support planner's contact (`support`) as the whole-body fit takes it
 * and as the course between keys pivots about it: the bone and point that
 * bear, the place held, the normal laid flat and the bones that bear on the
 * floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read for each part.
 * @evidence contracts/development/design.md#principled-representation A contact becomes a fit target and a bearing pattern, and a part the bone its contact rides.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The form, its builder and the pin reader, read by the support law alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The normals are the quiet stance's and the palm socket's own; no angle is typed.
 */
export namespace supportContact {
  /** A contact as the fit takes it: its target and the part that bears on the floor. */
  export interface IForm {
    /** The fit's target. */
    target: HumanBodyFit.ITarget;

    /** The bones that bear on the floor, for a contact on it. */
    bearing?: RegExp;
  }

  /**
   * A contact as the fit takes it. A part on the floor bears on it, its
   * place held across the floor and its height left to the bearing; a part
   * above it is brought to its target on all three axes. A foot lies with
   * its toes flat, a palm flat facing down, as the quiet stance and the
   * hand's palm socket give their normals.
   */
  export function form(
    body: IHumanBody,
    c: HumanSupport.IContact,
    aimed: IAutoMovieVector3 | null,
  ): IForm {
    const side: "left" | "right" = c.part.startsWith("left") ? "left" : "right";

    // A contact without a target lies anywhere on the floor: its normal and
    // its bearing alone, no place.
    const point: IAutoMovieVector3 = aimed ?? { x: 0, y: 0, z: 0 };
    const floor: boolean = point.y <= HumanFoot.BEARING;
    const axes: readonly ("x" | "y" | "z")[] =
      aimed === null ? [] : floor ? ["x", "z"] : ["x", "y", "z"];
    const down: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
    if (c.part.endsWith("Foot")) {
      const bones = poseBones(
        body,
        resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
      );
      return {
        target: {
          bone: `${side}Toes`,
          goal: point,
          axes,
          normal: {
            local: Quaternion.rotateVector(
              Quaternion.inverse(bones.get(`${side}Toes`)!.worldRotation),
              down,
            ),
            world: down,
          },
        },
        ...(floor ? { bearing: new RegExp(`^${side}(Foot|Toes)$`) } : {}),
      };
    }
    // The trunk bears through its own colliders: the buttocks and the
    // thighs' backs sitting, the back or the front lying.
    if (c.part === "seat" || c.part === "back" || c.part === "front")
      return {
        target: { bone: "hips", goal: point, axes },
        ...(floor
          ? {
              bearing:
                c.part === "seat"
                  ? /^(hips|leftUpperLeg|rightUpperLeg)$/
                  : /^(hips|spine|chest)$/,
            }
          : {}),
      };
    if (c.part.endsWith("Knee"))
      return {
        target: { bone: `${side}LowerLeg`, goal: point, axes },
        ...(floor ? { bearing: new RegExp(`^${side}LowerLeg$`) } : {}),
      };
    const surface: HumanHand.IFrame = HumanHand.offset(
      body,
      side,
      c.kind === "grip" ? "grip" : "palm",
    );
    return {
      target: {
        bone: `${side}Hand`,
        ...(floor ? {} : { point: surface.point }),
        goal: point,
        axes,
        ...(c.kind === "bear"
          ? { normal: { local: surface.normal, world: down } }
          : {}),
      },
      ...(floor
        ? {
            bearing: new RegExp(
              `^${side}(Hand|Thumb|Index|Middle|Ring|Little)`,
            ),
          }
        : {}),
    };
  }

  /** Where a part bears in a posture: the joint or bone its contact rides. */
  export function pinned(
    body: IHumanBody,
    posture: IHumanPosture,
    part: HumanSupport.Part,
  ): IAutoMovieVector3 {
    const bones = poseBones(body, resolveHumanPosture(body, posture));
    const side: "left" | "right" = part.startsWith("left") ? "left" : "right";
    const bone: AutoMovieHumanoidBone = part.endsWith("Foot")
      ? `${side}Toes`
      : part.endsWith("Hand")
        ? `${side}Hand`
        : part.endsWith("Knee")
          ? `${side}LowerLeg`
          : "hips";
    return bones.get(bone)!.worldPosition;
  }

}
