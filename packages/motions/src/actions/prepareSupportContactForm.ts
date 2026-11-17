import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanSupport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { stand } from "./stand";
import type { supportContact } from "./supportContact";
import { supportContactOnFloor } from "./supportContactOnFloor";

/**
 * Prepare contact forms for one unchanged body operation. Foot normals
 * come from the original quiet stance at the first requested foot normal;
 * only the two resulting local vectors survive that measurement.
 *
 * @param body The unchanged body, canonical rig and anatomical surfaces.
 * @param normals Whether the consumer needs target normals; false only for point observations.
 * @returns Contact forms with the original normal fields by default, or their point-only geometry when normals is false.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed body geometry, lazy quiet-stance foot normals, world targets and scalar/vector retention rather than a retained posed reading.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves the existing foot-toe, hand-socket and trunk/knee skin mapping, floor axes and bearing patterns. Actual fit requests retain downward normals and the same solved-quiet-stance inverse toe rotation; point-only observations omit unused normals.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One explicit normal demand and lazy fixed-foot datum precede the original contact-part branches; supportContact.form and point observations share this sole mapping owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No contact kind, floor threshold, bearing selector, target offset, axis or actual contact normal is approximated. Only point-only readers suppress the normal field; all fit forms retain its original default demand.
 * @evidence contracts/development/implementation.md#efficient-algorithms The first normal-bearing foot request performs one complete quiet-stance solve and FK of the observed toe ancestries; later feet reuse fixed normals. Point-only observations request no quiet-stance solve, and hand sockets are read only when their offset or normal is actually used.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The unchanged body's quiet standing pose defines both toe normals for this operation. Current contact targets and floor decisions remain per request, and no current support posture is shared with the datum.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One caller owns a body reference and at most two fixed local vectors until release; the quiet pose and FK map end with their synchronous measurement, and no time query, fitted support pose or workspace is retained.
 */
export function prepareSupportContactForm(
  body: IAutoMovieMotionHumanBody,
  normals: boolean = true,
): (
  contact: IAutoMovieMotionHumanSupport.IContact,
  aimed: IAutoMovieVector3 | null,
) => supportContact.IForm {
  let feet: Partial<Record<"left" | "right", IAutoMovieVector3>> | undefined;

  /** Read the exact quiet toe frames once, retaining only body-local directions. */
  const toeNormal: (side: "left" | "right") => IAutoMovieVector3 = (
    side: "left" | "right",
  ): IAutoMovieVector3 => {
    let observed: IAutoMovieVector3 | undefined = feet?.[side];
    if (observed === undefined) {
      const bones: ReturnType<typeof poseBones> = poseBones(
        body,
        resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
        undefined,
        TOES,
      );

      /** Re-express world down in a measured toe's local rotation. */
      const normal: (foot: "left" | "right") => IAutoMovieVector3 = (
        foot: "left" | "right",
      ): IAutoMovieVector3 =>
        Quaternion.rotateVector(
          Quaternion.inverse(bones.get(`${foot}Toes`)!.worldRotation),
          { x: 0, y: -1, z: 0 },
        );
      observed = normal(side);
      feet ??= {};
      feet[side] = observed;

      // A canonical rig may omit the unrequested counterpart's toe bone.
      const other: "left" | "right" = side === "left" ? "right" : "left";
      if (bones.has(`${other}Toes`)) feet[other] = normal(other);
    }
    return { ...observed };
  };
  return (
    c: IAutoMovieMotionHumanSupport.IContact,
    aimed: IAutoMovieVector3 | null,
  ): supportContact.IForm => {
    const side: "left" | "right" = c.part.startsWith("left") ? "left" : "right";
    const point: IAutoMovieVector3 = aimed ?? { x: 0, y: 0, z: 0 };
    const floor: boolean = supportContactOnFloor(point);
    const axes: readonly ("x" | "y" | "z")[] =
      aimed === null ? [] : floor ? ["x", "z"] : ["x", "y", "z"];
    const down: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
    if (c.part.endsWith("Foot"))
      return {
        target: {
          bone: `${side}Toes`,
          goal: point,
          axes,
          ...(normals
            ? { normal: { local: toeNormal(side), world: down } }
            : {}),
        },
        ...(floor ? { bearing: new RegExp(`^${side}(Foot|Toes)$`) } : {}),
      };

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
      const region: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
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
          ...(normals ? { normal: { local: region.normal, world: down } } : {}),
        },
      };
    }
    const surface: IAutoMovieMotionHumanHand.IFrame | undefined =
      !floor || (normals && c.kind === "bear")
        ? HumanHand.offset(body, side, c.kind === "grip" ? "grip" : "palm")
        : undefined;
    return {
      target: {
        bone: `${side}Hand`,
        ...(floor ? {} : { point: surface!.point }),
        goal: point,
        axes,
        ...(normals && c.kind === "bear"
          ? { normal: { local: surface!.normal, world: down } }
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
  };
}

/** The quiet-foot datum observes only the two actual toe frames. */
const TOES: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>(
  ["leftToes", "rightToes"],
);
