import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanSupport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { stand } from "./stand";
import type { supportContact } from "./supportContact";
import { supportContactOnFloor } from "./supportContactOnFloor";

/*
 * Prepare contact forms for one unchanged body operation. Foot normals come
 * from the original quiet stance at the first requested foot normal; only the
 * two resulting local vectors survive that measurement.
 * Parameter body: The unchanged body, canonical rig and anatomical surfaces.
 * Parameter normals: Whether the consumer needs target normals; false only for
 * point observations.
 * Returns: Contact forms with the original normal fields by default, or their
 * point-only geometry when normals is false.
 */
export function prepareSupportContactForm(
  body: IAutoMovieMotionHumanBody,
  normals: boolean = true,
): (
  contact: IAutoMovieMotionHumanSupport.IContact,
  aimed: IAutoMovieVector3 | null,
) => supportContact.IForm {
  // The quiet stance's toe frames, read once here when normals are wanted,
  // keeping only world down in each toe's local rotation. A canonical rig
  // may omit a toe bone, which then has no normal.
  const feet: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
  if (normals) {
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
      undefined,
      HumanBoneGroups.TOES,
    );
    for (const side of ["left", "right"] as const)
      if (bones.has(`${side}Toes`))
        feet[side] = AutoMovieEngineQuaternion.rotateVector(
          AutoMovieEngineQuaternion.inverse(bones.get(`${side}Toes`)!.worldRotation),
          { x: 0, y: -1, z: 0 },
        );
  }

  /*
   * A toe's prepared local down.
   */
  const toeNormal: (side: AutoMovieHumanSide) => IAutoMovieVector3 = (
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3 => ({ ...feet[side]! });
  return (
    c: IAutoMovieMotionHumanSupport.IContact,
    aimed: IAutoMovieVector3 | null,
  ): supportContact.IForm => {
    const side: AutoMovieHumanSide = c.part.startsWith("left")
      ? "left"
      : "right";
    const point: IAutoMovieVector3 = aimed ?? { x: 0, y: 0, z: 0 };
    const floor: boolean = supportContactOnFloor(point);
    const axes: readonly PrepareSupportContactFormAxesItem[] =
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
    // A palm-to-palm clasp fixes the exposed palm surface on both bodies.
    const clasp: boolean =
      c.target !== "on" &&
      c.target?.kind === "person" &&
      (c.target.region === "palmLeft" || c.target.region === "palmRight");
    const surface: IAutoMovieMotionHumanHand.IFrame | undefined =
      !floor || (normals && c.kind === "bear")
        ? HumanHand.offset(
            body,
            side,
            c.kind === "grip" && !clasp ? "grip" : "palm",
          )
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

/*
 * The alternatives of `PrepareSupportContactFormAxesItem`'s site.
 */
type PrepareSupportContactFormAxesItem = "x" | "y" | "z";
