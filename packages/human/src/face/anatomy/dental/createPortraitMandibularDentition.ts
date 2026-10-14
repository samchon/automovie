import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { millimetrePoint } from "../../mesh/millimetrePoint";
import type { IControlMesh } from "../../mesh/structures/IControlMesh";
import { createPortraitInteriorFinisher } from "../../surface/createPortraitInteriorFinisher";
import type { IPortraitComponent } from "../../surface/structures/IPortraitComponent";
import type { IPortraitComponentHost } from "../../surface/structures/IPortraitComponentHost";
import type { IPortraitInterior } from "../../surface/structures/IPortraitInterior";
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
 * @evidence contracts/common.md#principled-implementation Independently authored lower crowns reflect the cervical axis with normals/winding, rigidly attach to observed lower oral anchors and undergo exactly one observed-relative jaw rotation.
 * @evidence contracts/common.md#clear-and-simple-design Native row preparation owns crown geometry and cervical cycles; the component owns lower-axis orientation, placement and jaw-only performance before exposing one interior producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Upper profiles are not silently reused, lip/smile/pucker cannot carry the row, and no gingiva/tongue/occlusion solver is implied.
 * @evidence contracts/common.md#meaningful-documentation The prose states inferior cervical/superior incisal orientation, millimetres, jaw-only movement and no second rotation during native preparation.
 * @evidence contracts/performance.md#efficient-algorithms Preparation includes crown separation/merge; orientation and each fit's placement/position-normal rotation scan V row vertices and its T indices, followed by fresh output cloning.
 * @evidence contracts/performance.md#reuse-equivalent-work The component reuses its prepared reflected row across fits and clones the already-posed result in native preparation instead of rotating again.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The component owns copied controls and the reflected row; each fit closure owns its placed mesh until released, and returned interior copies retain no host/task/resource.
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
  const socket: {
      rightCorner: number;
      leftCorner: number;
      lowerLipMiddle: number;
    } = structuredClone(inputSocket),
    placement: { drop: number; recess: number } =
      structuredClone(inputPlacement),
    jaw: { hinge: IAutoMovieVector3; observed: number; current: number } =
      structuredClone(inputJaw);
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
  const prepared: { mesh: IAutoMovieMesh; cervical: number[][] } =
    preparePortraitDentalRow(inputRow);
  const row: IAutoMovieMesh = prepared.mesh;
  // Reflect the cervical-to-incisal axis, including normals and handedness.
  for (let i: number = 1; i < row.positions.length; i += 3) {
    row.positions[i] = -row.positions[i];
    row.normals![i] = -row.normals![i];
  }
  // Native row preparation always returns indexed, normal-bearing crowns.
  const indices: number[] = row.indices!;
  for (let i: number = 0; i < indices.length; i += 3)
    [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
  return {
    id: "lower-dentition",
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
        throw new Error("Mandibular sockets must name resident host vertices.");
      const point: (id: number) => IAutoMovieVector3 = (
        id: number,
      ): IAutoMovieVector3 =>
        millimetrePoint(...(host.positions[id] as [number, number, number]));
      const placed: IAutoMovieMesh = attachPortraitDentalRow(row, {
        rightCorner: point(socket.rightCorner),
        leftCorner: point(socket.leftCorner),
        upperLipMiddle: point(socket.lowerLipMiddle),
        up: { x: 0, y: 1, z: 0 },
        lift: -placement.drop,
        recess: placement.recess,
      });
      const angle: number = jaw.current - jaw.observed,
        rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          { x: 1, y: 0, z: 0 },
          angle,
        );
      for (let i: number = 0; i < placed.positions.length; i += 3) {
        const p: IAutoMovieVector3 = posePortraitJawPoint(
          {
            x: placed.positions[i],
            y: placed.positions[i + 1],
            z: placed.positions[i + 2],
          },
          jaw.hinge,
          angle,
          1,
        );
        const n: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
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
        attach: (): {
          prepareInteriors: (refined: IControlMesh) => IPortraitInterior[];
          finish: (refined: IControlMesh) => IAutoMovieModelPart[];
          openings: never[];
        } => ({
          openings: [],
          ...createPortraitInteriorFinisher((): IPortraitInterior[] => [
            {
              id: "tooth-lower-arch",
              mesh: structuredClone(placed),
              material: "teeth",
              // Reflection reverses the cap's winding along with its faces.
              // Reverse the owned cycle as well; its vertex set stays intact.
              loops: prepared.cervical.map(
                (
                  vertices: number[],
                  tooth: number,
                ): { name: string; vertices: number[] } => ({
                  name: `cervical-${tooth}`,
                  vertices: [...vertices].reverse(),
                }),
              ),
            },
          ]),
        }),
      };
    },
  };
}
