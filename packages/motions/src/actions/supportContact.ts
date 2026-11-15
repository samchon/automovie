import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
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
    // On the floor the trunk bears through its own colliders (the buttocks
    // and the thighs' backs sitting, the back or the front lying) and a knee
    // through its shin's, their lowest points resting on it. On a raised
    // surface each lays its own skin on the place, the region's outward
    // normal facing down onto it, as a palm does: the seat, the upper back,
    // the abdomen or the knee.
    const trunk: boolean =
      c.part === "seat" || c.part === "back" || c.part === "front";
    if (trunk || c.part.endsWith("Knee")) {
      if (floor)
        return {
          target: {
            bone: trunk ? "hips" : `${side}LowerLeg`,
            goal: point,
            axes,
          },
          bearing: trunk
            ? c.part === "seat"
              ? /^(hips|leftUpperLeg|rightUpperLeg)$/
              : /^(hips|spine|chest)$/
            : new RegExp(`^${side}LowerLeg$`),
        };
      const region: IHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
        body.surfaces.regions[
          c.part === "seat"
            ? "seat"
            : c.part === "back"
              ? "upperBack"
              : c.part === "front"
                ? "abdomen"
                : side === "left"
                  ? "kneeLeft"
                  : "kneeRight"
        ];
      return {
        target: {
          bone: region.bone,
          point: region.point,
          goal: point,
          axes,
          normal: { local: region.normal, world: down },
        },
      };
    }
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

  /**
   * The target of a part stepping from one contact to another, at the top
   * of its swing: over the middle of the step, lifted by a stepping limb's
   * rise (`crawl.LIFT`) above the higher end, its surface facing as it will
   * bear. Where only one end has a place the swing rises over it; where
   * neither has, the part swings free.
   *
   * @param body The body.
   * @param to The contact it steps to.
   * @param from Where it leaves, world metres; no place when null.
   * @param onto Where it sets down, world metres; no place when null.
   * @param rise How high the swing clears the higher end, metres.
   * @returns The fit's target, or null for a step with no place.
   */
  export function swing(
    body: IHumanBody,
    to: HumanSupport.IContact,
    from: IAutoMovieVector3 | null,
    onto: IAutoMovieVector3 | null,
    rise: number,
  ): HumanBodyFit.ITarget | null {
    const a: IAutoMovieVector3 | null = from ?? onto;
    const b: IAutoMovieVector3 | null = onto ?? from;
    if (a === null || b === null) return null;
    const top: IAutoMovieVector3 = {
      x: (a.x + b.x) / 2,
      y: Math.max(a.y, b.y) + rise,
      z: (a.z + b.z) / 2,
    };
    return form(body, { ...to, kind: "bear" }, top).target;
  }

  /**
   * The contact window's part a support part bears through: a knee through
   * its shin, the lower leg's window; the trunk's window named by the back
   * for every lying position, the front's too, as the lying law names it
   * (`lieDown`); any other part its own.
   */
  export function window(part: HumanSupport.Part): string {
    return part.endsWith("Knee")
      ? part.replace("Knee", "LowerLeg")
      : part === "front"
        ? "back"
        : part;
  }

  /**
   * The limb a part belongs to, which steps as one: a foot and its knee are
   * one leg, a hand its arm; a part of the trunk is its own, since the
   * trunk rolls from one to another and never steps.
   */
  export function limb(part: HumanSupport.Part): string {
    return part.endsWith("Foot") || part.endsWith("Knee")
      ? `${part.startsWith("left") ? "left" : "right"}Leg`
      : part.endsWith("Hand")
        ? `${part.startsWith("left") ? "left" : "right"}Arm`
        : part;
  }

  /** Whether two contacts are one: the same part on the same target. */
  export function same(
    a: HumanSupport.IContact,
    b: HumanSupport.IContact,
  ): boolean {
    return id(a) === id(b);
  }

  /** A contact's identity: its part, how it touches and its target. */
  export function id(c: HumanSupport.IContact): string {
    return `${c.part}|${c.kind}|${JSON.stringify(c.target)}`;
  }

  /** Where a part bears in a posture, dropped to the floor: the place a contact without one keeps. */
  export function onFloor(
    body: IHumanBody,
    posture: IHumanPosture,
    part: HumanSupport.Part,
  ): IAutoMovieVector3 {
    const p: IAutoMovieVector3 = pinned(body, posture, part);
    return { x: p.x, y: 0, z: p.z };
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
