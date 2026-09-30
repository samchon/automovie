import type { IAutoMovieVector3 } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { resolveHumanFaceExpression } from "../../document/resolveHumanFaceExpression";
import { millimetrePoint } from "../../mesh/millimetrePoint";
import type { IAutoMovieHumanFaceExpression } from "../../structures/IAutoMovieHumanFaceExpression";
import { createPortraitInteriorFinisher } from "../../surface/createPortraitInteriorFinisher";
import type { IPortraitComponent } from "../../surface/structures/IPortraitComponent";
import { attachPortraitOralMesh } from "../mouth/attachPortraitOralMesh";
import { posePortraitJawPoint } from "../mouth/posePortraitJawPoint";
import { IPortraitTongueShape } from "./IPortraitTongueShape";
import { buildPortraitTongue } from "./buildPortraitTongue";
import { frontWeight } from "./frontWeight";
import { portraitTongueStation } from "./portraitTongueStation";

/**
 * Attach a non-cutting tongue to the observed lower oral frame. The anterior
 * body follows the bound jaw, fading to a fixed posterior endpoint. Normals
 * are recomputed after this non-rigid motion. This is an authored kinematic
 * approximation, not muscular/hyoid simulation or a collision certificate.
 * Fit captures the performed mesh in head millimetres. Native preparation gives
 * each consumer a fresh copy with matching normals; compatibility finish packs
 * this same producer's result without repeating attachment or jaw motion.
 *
 * @evidence contracts/common.md#principled-implementation The observed-relative tongue is built once in its local frame, placed by the shared oral frame at the lower-lip anchor, and each vertex is rotated about the jaw hinge by the observed-relative angle weighted by the tip-to-root fade of its station, so the tip follows the mandible and the root stays put; normals are recomputed because the motion is not rigid.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named, and the station weight comes from the layout owner and not from a private restatement of it.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the tongue follows, that normals are recomputed, that this is a kinematic approximation and not muscular or hyoid simulation, and what fit captures.
 * @evidence contracts/modeling.md#part-identity-and-grouping The declaration is the component of one part, the tongue, which it attaches to the observed lower oral frame.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration consumes the raise, advance and jaw differences of the expression and defines no channel of its own.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The primitives are the builder's own.
 * @evidence contracts/modeling.md#spatial-conventions Sockets name host vertices; the local millimetre body is mapped to the head millimetre frame by the shared oral attachment, then rotated in degrees about the head-frame hinge, and packed once at the metric boundary.
 * @evidence contracts/modeling.md#shared-boundaries The tongue is placed in the same lower-lip frame and rotated about the same hinge and by the same rotation function as the lower lip and lower enamel, with the posterior end held fixed, so the anterior body moves with the mandible without the root leaving its place. The tongue is not brought into contact with the teeth or the lining, so the join with them is not guaranteed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The declaration carries no anatomical value; the tongue dimensions are authored.
 * @evidence contracts/anatomy.md#parametric-authority Inputs are three named oral landmarks, a named hinge, the named lingual dimensions and the observed and current expressions; none addresses a vertex, curve or patch.
 */
export function createPortraitTongueComponent(
  inputSocket: {
    rightCorner: number;
    leftCorner: number;
    lowerLipMiddle: number;
  },
  inputShape: IPortraitTongueShape,
  inputHinge: IAutoMovieVector3,
  observation: IAutoMovieHumanFaceExpression,
  expression: IAutoMovieHumanFaceExpression,
): IPortraitComponent {
  const socket = structuredClone(inputSocket),
    shape = structuredClone(inputShape),
    hinge = structuredClone(inputHinge);
  const observed = resolveHumanFaceExpression(observation),
    current = resolveHumanFaceExpression(expression);
  posePortraitJawPoint(hinge, hinge, 0, 1);
  const local = buildPortraitTongue(shape, {
    raise: current.tongueRaise - observed.tongueRaise,
    advance: current.tongueAdvance - observed.tongueAdvance,
  });
  return {
    id: "tongue",
    fit: (host) => {
      if (
        Object.values(socket).some(
          (id) =>
            !Number.isInteger(id) || id < 0 || id >= host.positions.length,
        )
      )
        throw new Error("Tongue sockets must name resident host vertices.");
      const point = (id: number) =>
        millimetrePoint(...(host.positions[id] as [number, number, number]));
      const placed = attachPortraitOralMesh(local, {
        rightCorner: point(socket.rightCorner),
        leftCorner: point(socket.leftCorner),
        origin: point(socket.lowerLipMiddle),
        up: { x: 0, y: 1, z: 0 },
        lift: -shape.drop,
        recess: shape.recess,
      });
      for (let i = 0; i < placed.positions.length; i += 3) {
        const p = posePortraitJawPoint(
          {
            x: placed.positions[i],
            y: placed.positions[i + 1],
            z: placed.positions[i + 2],
          },
          hinge,
          current.jawOpen - observed.jawOpen,
          frontWeight(portraitTongueStation(i / 3)),
        );
        placed.positions.splice(i, 3, p.x, p.y, p.z);
      }
      placed.normals = areaWeightedNormals(placed.positions, placed.indices!);
      return {
        constraints: [],
        cutFaces: [],
        attach: () => ({
          openings: [],
          ...createPortraitInteriorFinisher(() => [
            {
              id: "tongue",
              mesh: structuredClone(placed),
              material: shape.material,
            },
          ]),
        }),
      };
    },
  };
}
