import { Quaternion } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { millimetrePoint } from "../../mesh/millimetrePoint";
import { createPortraitInteriorFinisher } from "../../surface/createPortraitInteriorFinisher";
import type { IPortraitComponent } from "../../surface/structures/IPortraitComponent";
import { posePortraitJawPoint } from "../mouth/posePortraitJawPoint";
import { attachPortraitDentalRow } from "./attachPortraitDentalRow";
import { preparePortraitDentalRow } from "./preparePortraitDentalRow";
import { type IPortraitDentalRow } from "./structures/IPortraitDentalRow";

/**
 * Resident lower enamel attached to the observed mandibular frame. Its own
 * crown array describes smaller lower incisors and individual laterals/canines;
 * upper profiles are never silently reused. Cervical ends point inferiorly,
 * incisal edges superiorly. The whole row follows only the jaw hinge, not lip
 * separation, smile or pucker. No gingiva, tongue or occlusion solver is implied.
 * Fit owns the observed-relative pose in head millimetres; native preparation
 * returns a fresh copy without applying that rotation again. The compatibility
 * finisher packs the same producer's mesh through the shared metric boundary.
 *
 * @evidence contracts/common.md#principled-implementation The lower row is prepared by the same producer as the upper, reflected through the cervical-to-incisal axis with its normals and winding, then placed by the shared oral frame at the lower-lip anchor and rotated as a rigid body about the jaw hinge by the observed-relative angle, so the crowns follow only the mandible and never the lips.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named, and the reflected cervical cycle is reversed with the winding it accompanies; no compensation hides a wrong frame.
 * @evidence contracts/common.md#meaningful-documentation The comment states the frame, the row's independent crowns, that lip separation, smile and pucker do not move it and that no occlusion solver is implied.
 * @evidence contracts/modeling.md#part-identity-and-grouping The declaration is one group, the lower dental row as one part with one cervical loop per crown, composed by the row producer.
 * @evidence contracts/modeling.md#spatial-conventions Sockets name host vertices; offsets are millimetres in the head frame, angles degrees about the hinge, and the result is packed once at the metric boundary.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration consumes the observed and current jaw angles from the expression rather than defining a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The primitives are the row's own.
 * @evidence contracts/modeling.md#shared-boundaries The row is placed in the frame of the lower lip anchor and rotated about the same hinge as the lower lip and tongue, through one shared rotation, so lower enamel, lip and tongue move as one mandible; it is not brought into contact with the upper row, so occlusal contact is not guaranteed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The declaration carries no anatomical value; the lower row's dimensions are authored.
 * @evidence contracts/anatomy.md#parametric-authority Inputs are three named oral landmarks, two named nonnegative placement offsets, a named hinge with observed and current angles and a row of named crown dimensions; none addresses a vertex, curve or patch.
 */
export function createPortraitMandibularDentition(
  inputSocket: {
    rightCorner: number;
    leftCorner: number;
    lowerLipMiddle: number;
  },
  inputRow: IPortraitDentalRow,
  inputPlacement: { drop: number; recess: number },
  inputJaw: { hinge: IAutoMovieVector3; observed: number; current: number },
): IPortraitComponent {
  const socket = structuredClone(inputSocket),
    placement = structuredClone(inputPlacement),
    jaw = structuredClone(inputJaw);
  if (
    ![placement.drop, placement.recess, jaw.observed, jaw.current].every(
      Number.isFinite,
    ) ||
    placement.drop < 0 ||
    placement.recess < 0 ||
    jaw.observed < 0 ||
    jaw.observed > 25 ||
    jaw.current < 0 ||
    jaw.current > 25
  )
    throw new Error(
      "Mandibular dentition requires nonnegative finite offsets and jaw angles in [0,25] degrees.",
    );
  posePortraitJawPoint(jaw.hinge, jaw.hinge, 0, 1);
  const prepared = preparePortraitDentalRow(inputRow);
  const row = prepared.mesh;
  // Reflect the cervical-to-incisal axis, including normals and handedness.
  for (let i = 1; i < row.positions.length; i += 3) {
    row.positions[i] = -row.positions[i];
    row.normals![i] = -row.normals![i];
  }
  // Native row preparation always returns indexed, normal-bearing crowns.
  const indices = row.indices!;
  for (let i = 0; i < indices.length; i += 3)
    [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
  return {
    id: "lower-dentition",
    fit: (host) => {
      if (
        Object.values(socket).some(
          (id) =>
            !Number.isInteger(id) || id < 0 || id >= host.positions.length,
        )
      )
        throw new Error("Mandibular sockets must name resident host vertices.");
      const point = (id: number) =>
        millimetrePoint(...(host.positions[id] as [number, number, number]));
      const placed = attachPortraitDentalRow(row, {
        rightCorner: point(socket.rightCorner),
        leftCorner: point(socket.leftCorner),
        upperLipMiddle: point(socket.lowerLipMiddle),
        up: { x: 0, y: 1, z: 0 },
        lift: -placement.drop,
        recess: placement.recess,
      });
      const angle = jaw.current - jaw.observed,
        rotation = Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, angle);
      for (let i = 0; i < placed.positions.length; i += 3) {
        const p = posePortraitJawPoint(
          {
            x: placed.positions[i],
            y: placed.positions[i + 1],
            z: placed.positions[i + 2],
          },
          jaw.hinge,
          angle,
          1,
        );
        const n = Quaternion.rotateVector(rotation, {
          x: placed.normals![i],
          y: placed.normals![i + 1],
          z: placed.normals![i + 2],
        });
        placed.positions.splice(i, 3, p.x, p.y, p.z);
        placed.normals!.splice(i, 3, n.x, n.y, n.z);
      }
      return {
        constraints: [],
        cutFaces: [],
        attach: () => ({
          openings: [],
          ...createPortraitInteriorFinisher(() => [
            {
              id: "tooth-lower-arch",
              mesh: structuredClone(placed),
              material: "teeth",
              // Reflection reverses the cap's winding along with its faces.
              // Reverse the owned cycle as well; its vertex set stays intact.
              loops: prepared.cervical.map((vertices, tooth) => ({
                name: `cervical-${tooth}`,
                vertices: [...vertices].reverse(),
              })),
            },
          ]),
        }),
      };
    },
  };
}
