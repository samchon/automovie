import type {
  IAutoMovieMesh,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { millimetrePoint as p } from "../../mesh/millimetrePoint";
import type { IControlMesh } from "../../mesh/structures/IControlMesh";
import { createPortraitInteriorFinisher } from "../../surface/createPortraitInteriorFinisher";
import type { IPortraitComponent } from "../../surface/structures/IPortraitComponent";
import type { IPortraitComponentHost } from "../../surface/structures/IPortraitComponentHost";
import type { IPortraitInterior } from "../../surface/structures/IPortraitInterior";
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
 * @evidence contracts/common.md#principled-implementation One prebuilt enamel row is rigidly placed by actual oral anchors, or by the explicitly selected observed-maxillary frame captured before performance.
 * @evidence contracts/common.md#clear-and-simple-design The component supplies no skin cuts/constraints and shares one native interior producer with its compatibility finisher.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Observed-maxilla captures the host so moving lips cannot move the complete upper arch; this remains an authored maxillary approximation without gingiva or occlusion simulation.
 * @evidence contracts/common.md#meaningful-documentation The prose states attachment modes, subject-owned socket IDs, millimetre controls and native/metric consumer ownership.
 * @evidence contracts/performance.md#efficient-algorithms Construction includes full row preparation/separation; fitting validates three socket IDs and clones V host points only for observed-maxilla, while each interior read copies/transforms row geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work The prepared row is shared across the component's fits and the same native producer serves both consumers; a captured observed host deliberately differs from refined-oral placement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller-owned component retains its copied socket/placement and prepared row; observed host snapshots belong to returned fit closures and fresh interior meshes belong to consumers.
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
  const socket: {
      rightCorner: number;
      leftCorner: number;
      upperLipMiddle: number;
    } = structuredClone(inputSocket),
    placement: { lift: number; recess: number } =
      structuredClone(inputPlacement),
    row: { mesh: IAutoMovieMesh; cervical: number[][] } =
      preparePortraitDentalRow(inputRow);
  if (![placement.lift, placement.recess].every(Number.isFinite))
    throw new Error("Dental component placement must be finite millimetres.");
  return {
    id: "upper-dentition",
    fit: (
      host: IPortraitComponentHost,
    ): {
      constraints: never[];
      cutFaces: never[];
      attach: () => {
        prepareInteriors: (refined: IControlMesh) => IPortraitInterior[];
        finish: (refined: IControlMesh) => IAutoMovieModelPart[];
        openings: never[];
      };
    } => {
      if (
        Object.values(socket).some(
          (id: number): boolean =>
            !Number.isInteger(id) || id < 0 || id >= host.positions.length,
        )
      )
        throw new Error(
          "Dental component sockets must name resident host vertices.",
        );
      // Capture before performance. The observed frame is a subject-authored
      // maxillary approximation; subsequent lip and jaw movement cannot carry
      // its entire upper arch along with the moving oral opening.
      const maxilla: number[][] | undefined =
        attachment === "observed-maxilla"
          ? structuredClone(host.positions)
          : undefined;
      return {
        constraints: [],
        cutFaces: [],
        attach: (): {
          prepareInteriors: (refined: IControlMesh) => IPortraitInterior[];
          finish: (refined: IControlMesh) => IAutoMovieModelPart[];
          openings: never[];
        } => ({
          openings: [],
          ...createPortraitInteriorFinisher(
            (
              refined: IControlMesh,
            ): {
              id: string;
              mesh: IAutoMovieMesh;
              material: string;
              loops: { name: string; vertices: number[] }[];
            }[] => {
              const source: number[][] = maxilla ?? refined.positions;
              const point: (id: number) => IAutoMovieVector3 = (
                id: number,
              ): IAutoMovieVector3 =>
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
                  loops: row.cervical.map(
                    (
                      vertices: number[],
                      tooth: number,
                    ): { name: string; vertices: number[] } => ({
                      name: `cervical-${tooth}`,
                      vertices: [...vertices],
                    }),
                  ),
                },
              ];
            },
          ),
        }),
      };
    },
  };
}
