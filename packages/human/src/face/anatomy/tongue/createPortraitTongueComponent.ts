import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieHumanFaceExpression } from "../../structures/IAutoMovieHumanFaceExpression";
import { portraitPoint } from "../../mesh/portraitPoint";
import { portraitNormals } from "../../mesh/portraitNormals";
import type { IPortraitComponent } from "../../surface/IPortraitComponent";
import { createPortraitInteriorFinisher } from "../../surface/createPortraitInteriorFinisher";
import { resolveHumanFaceExpression } from "../../document/resolveHumanFaceExpression";
import { posePortraitJawPoint } from "../mouth/posePortraitJawPoint";
import { attachPortraitOralMesh } from "../mouth/attachPortraitOralMesh";
import { IPortraitTongueShape } from "./IPortraitTongueShape";
import { buildPortraitTongue } from "./buildPortraitTongue";

/**
 * Attach a non-cutting tongue to the observed lower oral frame. The anterior
 * body follows the bound jaw, fading to a fixed posterior endpoint. Normals
 * are recomputed after this non-rigid motion. This is an authored kinematic
 * approximation, not muscular/hyoid simulation or a collision certificate.
 * Fit captures the performed mesh in head millimetres. Native preparation gives
 * each consumer a fresh copy with matching normals; compatibility finish packs
 * this same producer's result without repeating attachment or jaw motion.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Adds a separately finished lingual interior without cutting skin or moving teeth.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Uses the observed lower oral midpoint and shared orthonormal oral placement.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Carries the anterior tongue with the mandible independently of lip separation, smile and pucker.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Applies observed-relative dorsal elevation, anterior displacement and weighted mandibular rotation with a fixed posterior endpoint.
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
        portraitPoint(...(host.positions[id] as [number, number, number]));
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
          frontWeight(fraction(i / 3)),
        );
        placed.positions.splice(i, 3, p.x, p.y, p.z);
      }
      placed.normals = portraitNormals(placed.positions, placed.indices!);
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

const rows = 32,
  columns = 48;
const frontWeight = (v: number): number => 1 - v * v * (3 - 2 * v);
const fraction = (vertex: number): number =>
  vertex === 0
    ? 0
    : vertex === 1 + (rows - 1) * columns
      ? 1
      : (Math.floor((vertex - 1) / columns) + 1) / rows;
