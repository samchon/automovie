import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanSupport } from "../law/HumanSupport";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { stand } from "./stand";
import type { supportContact } from "./supportContact";
import { supportContactOnFloor } from "./supportContactOnFloor";

/**
 * Prepare contact forms for one unchanged body operation. Foot normals
 * come from the original quiet stance, measured only at the first foot
 * request; only the two resulting local vectors survive that measurement.
 *
 * @param body The unchanged body, canonical rig and anatomical surfaces.
 * @returns The original contact form for each contact and world-metre target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed body geometry, lazy quiet-stance foot normals, world targets and scalar/vector retention rather than a retained posed reading.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves the existing foot-toe, hand-socket and trunk/knee skin mapping, floor axes, bearing patterns and downward normals; foot local normals use the same solved quiet stance and inverse bone rotation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy fixed-foot datum precedes the original contact-part branches; supportContact.form delegates this sole mapping owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No contact kind, floor threshold, bearing selector, target offset, axis or canonical stance solve is approximated; every request constructs its own target record.
 * @evidence contracts/development/implementation.md#efficient-algorithms The first foot request performs one complete quiet-stance solve and FK of the two observed toe ancestries; later feet reuse only the fixed two normal vectors instead of repeating that solve. Other contact branches retain constant geometry work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The unchanged body's quiet standing pose defines both toe normals for this operation. Current contact targets and floor decisions remain per request, and no current support posture is shared with the datum.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One caller owns a body reference and at most two fixed local vectors until release; the quiet pose and FK map end with their synchronous measurement, and no time query, fitted support pose or workspace is retained.
 */
export function prepareSupportContactForm(
  body: IHumanBody,
): (
  contact: HumanSupport.IContact,
  aimed: IAutoMovieVector3 | null,
) => supportContact.IForm {
  let normals: Record<"left" | "right", IAutoMovieVector3> | undefined;

  /** Read the exact quiet toe frames once, retaining only body-local directions. */
  const toeNormal = (side: "left" | "right"): IAutoMovieVector3 => {
    if (normals === undefined) {
      const bones: ReturnType<typeof poseBones> = poseBones(
        body,
        resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
        undefined,
        TOES,
      );
      const normal = (foot: "left" | "right"): IAutoMovieVector3 =>
        Quaternion.rotateVector(
          Quaternion.inverse(bones.get(`${foot}Toes`)!.worldRotation),
          { x: 0, y: -1, z: 0 },
        );
      normals = { left: normal("left"), right: normal("right") };
    }
    return { ...normals[side] };
  };
  return (
    c: HumanSupport.IContact,
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
          normal: { local: toeNormal(side), world: down },
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
  };
}

/** The quiet-foot datum observes only the two actual toe frames. */
const TOES: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>(
  ["leftToes", "rightToes"],
);
