import { millimetrePoint as p } from "../../mesh/millimetrePoint";
import { createPortraitInteriorFinisher } from "../../surface/createPortraitInteriorFinisher";
import type { IPortraitComponent } from "../../surface/structures/IPortraitComponent";
import { attachPortraitDentalRow } from "./attachPortraitDentalRow";
import { preparePortraitDentalRow } from "./preparePortraitDentalRow";
import { type IPortraitDentalRow } from "./structures/IPortraitDentalRow";

/**
 * Bind an entire dental group through the same component protocol as the eyes,
 * nose and mouth. This interior does not cut or deform skin. The mouth owns its
 * opening; the group reads the actual refined oral anchors during native
 * preparation. The compatibility finisher packs that same owned millimetre mesh.
 * Socket IDs belong to the subject, while enamel, arch and placement remain
 * independent controls. All offsets and local geometry use millimetres.
 * Observed-maxilla attachment instead captures the host before performance,
 * so a facial expression cannot translate or tilt the upper arch with a lip.
 *
 * @evidence contracts/common.md#principled-implementation The prepared row is placed once by the shared oral frame at the actual final oral anchors, or at the anchors of the host captured before performance for the maxillary attachment, so a facial expression cannot translate or tilt the upper arch with a lip. The component cuts no skin and adds only an interior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named; the maxillary capture is a documented attachment mode, not a compensation.
 * @evidence contracts/common.md#meaningful-documentation The comment states the component protocol, that no skin is cut, which frame each attachment reads and that offsets are millimetres.
 * @evidence contracts/modeling.md#part-identity-and-grouping The declaration is one group, the upper dental row as one part with one cervical loop per crown; the crowns are composed by the row and this component only attaches it.
 * @evidence contracts/modeling.md#spatial-conventions Socket identities name host vertices; offsets and local geometry are millimetres and the result is packed once at the metric boundary.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration consumes no channel; lift and recess are placement offsets.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The primitives are the row's own.
 * @evidence contracts/modeling.md#shared-boundaries The row is attached at the same corner and midpoint vertices the mouth uses, through the shared oral frame, so the enamel sits in the frame of the moving lips at refined-oral attachment and in the observed maxilla frame at the maxillary attachment; it does not follow lip motion in the latter, which is the intended separation of a rigid maxilla from a moving lip.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The declaration carries no anatomical value; the row's dimensions are authored.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits sockets and finite offsets only.
 * @evidence contracts/anatomy.md#parametric-authority Inputs are three named oral landmarks, two named placement offsets, a closed choice of attachment frame and a row of named crown dimensions; none addresses a vertex, curve or patch of the enamel.
 */
export function createPortraitDentalComponent(
  inputSocket: {
    rightCorner: number;
    leftCorner: number;
    upperLipMiddle: number;
  },
  inputRow: IPortraitDentalRow,
  inputPlacement: { lift: number; recess: number },
  attachment: "refined-oral" | "observed-maxilla" = "refined-oral",
): IPortraitComponent {
  if (attachment !== "refined-oral" && attachment !== "observed-maxilla")
    throw new Error(
      "Upper dentition attachment must name the refined oral or observed maxillary frame.",
    );
  const socket = structuredClone(inputSocket),
    placement = structuredClone(inputPlacement),
    row = preparePortraitDentalRow(inputRow);
  if (![placement.lift, placement.recess].every(Number.isFinite))
    throw new Error("Dental component placement must be finite millimetres.");
  return {
    id: "upper-dentition",
    fit: (host) => {
      if (
        Object.values(socket).some(
          (id) =>
            !Number.isInteger(id) || id < 0 || id >= host.positions.length,
        )
      )
        throw new Error(
          "Dental component sockets must name resident host vertices.",
        );
      // Capture before performance. The observed frame is a subject-authored
      // maxillary approximation; subsequent lip and jaw movement cannot carry
      // its entire upper arch along with the moving oral opening.
      const maxilla =
        attachment === "observed-maxilla"
          ? structuredClone(host.positions)
          : undefined;
      return {
        constraints: [],
        cutFaces: [],
        attach: () => ({
          openings: [],
          ...createPortraitInteriorFinisher((refined) => {
            const source = maxilla ?? refined.positions;
            const point = (id: number) =>
              p(source[id][0], source[id][1], source[id][2]);
            return [
              {
                id: "tooth-upper-arch",
                mesh: attachPortraitDentalRow(row.mesh, {
                  rightCorner: point(socket.rightCorner),
                  leftCorner: point(socket.leftCorner),
                  upperLipMiddle: point(socket.upperLipMiddle),
                  up: p(0, 1, 0),
                  ...placement,
                }),
                material: "teeth",
                loops: row.cervical.map((vertices, tooth) => ({
                  name: `cervical-${tooth}`,
                  vertices: [...vertices],
                })),
              },
            ];
          }),
        }),
      };
    },
  };
}
