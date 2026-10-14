import type { IAutoMovieVector3, IAutoMovieMesh as IAutoMovieMeshImported, IAutoMovieModelPart as IAutoMovieModelPartImported } from "@automovie/interface";

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

import type { IPortraitComponentHost as IPortraitComponentHostImported } from "../../surface/structures/IPortraitComponentHost";
import type { IControlMesh as IControlMeshImported } from "../../mesh/structures/IControlMesh";
import type { IPortraitInterior as IPortraitInteriorImported } from "../../surface/structures/IPortraitInterior";


/**
 * Attach a non-cutting tongue to the observed lower oral frame. The anterior
 * body follows the bound jaw, fading to a fixed posterior endpoint. Normals
 * are recomputed after this non-rigid motion. This is an authored kinematic
 * approximation, not muscular/hyoid simulation or a collision certificate.
 * Fit captures the performed mesh in head millimetres. Native preparation gives
 * each consumer a fresh copy with matching normals; compatibility finish packs
 * this same producer's result without repeating attachment or jaw motion.
 *
 * @evidence contracts/common.md#principled-implementation Copied shape and observed/current expression differences generate one local tongue, attach it rigidly to resident oral anchors, then weight jaw rotation toward the anterior and recompute normals.
 * @evidence contracts/common.md#clear-and-simple-design Empty constraints/cuts describe a non-cutting component; native preparation and compatibility finish share one fitted interior producer selected by the head.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Weighted jaw motion is authored kinematics, not muscular or collision proof; invalid sockets, hinge and performance refuse without guessed anchors or host mutation.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes observed/current motion, head millimetres, fresh copies, matching normals and unproven collision/anatomy.
 * @evidence contracts/performance.md#efficient-algorithms Local V/T geometry is built once; each fit clones/transforms V vertices and recomputes O(T) normals, and each interior call clones its mesh before optional linear metric packing.
 * @evidence contracts/performance.md#reuse-equivalent-work Fixed copied shape/expression permits shared local geometry across fits; distinct anchors need fresh attachment, and both finish APIs share the fitted producer rather than performing jaw motion twice.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The component retains copied inputs/local mesh; each attachment retains its placed mesh and returns fresh consumer buffers until released, with no global task or host mutation.
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
  const socket: { rightCorner: number; leftCorner: number; lowerLipMiddle: number; } = structuredClone(inputSocket),
    shape: IPortraitTongueShape = structuredClone(inputShape),
    hinge: IAutoMovieVector3 = structuredClone(inputHinge);
  const observed: Required<{ blink?: { right: number; left: number; } | undefined; browRaise?: { right: number; left: number; } | undefined; smile?: { right: number; left: number; } | undefined; jawOpen?: number | undefined; lipPart?: number | undefined; pucker?: number | undefined; tongueRaise?: number | undefined; tongueAdvance?: number | undefined; gazePitch?: { right: number; left: number; } | undefined; gazeYaw?: { right: number; left: number; } | undefined; }> = resolveHumanFaceExpression(observation),
    current: Required<{ blink?: { right: number; left: number; } | undefined; browRaise?: { right: number; left: number; } | undefined; smile?: { right: number; left: number; } | undefined; jawOpen?: number | undefined; lipPart?: number | undefined; pucker?: number | undefined; tongueRaise?: number | undefined; tongueAdvance?: number | undefined; gazePitch?: { right: number; left: number; } | undefined; gazeYaw?: { right: number; left: number; } | undefined; }> = resolveHumanFaceExpression(expression);
  posePortraitJawPoint(hinge, hinge, 0, 1);
  const local: IAutoMovieMeshImported = buildPortraitTongue(shape, {
    raise: current.tongueRaise - observed.tongueRaise,
    advance: current.tongueAdvance - observed.tongueAdvance,
  });
  return {
    id: "tongue",
    fit: (host: IPortraitComponentHostImported): { constraints: never[]; cutFaces: never[]; attach: () => { prepareInteriors: (refined: IControlMeshImported) => IPortraitInteriorImported[]; finish: (refined: IControlMeshImported) => IAutoMovieModelPartImported[]; openings: never[]; }; }  => {
      if (
        Object.values(socket).some(
          (id: number): boolean  =>
            !Number.isInteger(id) || id < 0 || id >= host.positions.length,
        )
      )
        throw new Error("Tongue sockets must name resident host vertices.");
      const point: (id: number) => IAutoMovieVector3 = (id: number): IAutoMovieVector3  =>
        millimetrePoint(...(host.positions[id] as [number, number, number]));
      const placed: IAutoMovieMeshImported = attachPortraitOralMesh(local, {
        rightCorner: point(socket.rightCorner),
        leftCorner: point(socket.leftCorner),
        origin: point(socket.lowerLipMiddle),
        up: { x: 0, y: 1, z: 0 },
        lift: -shape.drop,
        recess: shape.recess,
      });
      for (let i: number = 0; i < placed.positions.length; i += 3) {
        const p: IAutoMovieVector3 = posePortraitJawPoint(
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
        attach: (): { prepareInteriors: (refined: IControlMeshImported) => IPortraitInteriorImported[]; finish: (refined: IControlMeshImported) => IAutoMovieModelPartImported[]; openings: never[]; }  => ({
          openings: [],
          ...createPortraitInteriorFinisher((): { id: string; mesh: IAutoMovieMeshImported; material: string; }[]  => [
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
