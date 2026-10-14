import {
  type IAutoMovieMeshQueryBudget as ImportedIAutoMovieMeshQueryBudget,
  type IAutoMovieMeshSeparationAttachment as ImportedIAutoMovieMeshSeparationAttachment,
  Vector3,
} from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import type { IAutoMovieHumanFaceHairCurve } from "./IAutoMovieHumanFaceHairCurve";
import type { IHumanFaceHairContactStation } from "./IHumanFaceHairContactStation";
import type { IHumanFaceHairMeshContext } from "./IHumanFaceHairMeshContext";
import { humanFaceHairFrame } from "./humanFaceHairFrame";

/**
 * Emit individually calibrated visible shafts on the existing registered curves. Eight circumferential sides follow the established brow shaft representation. Every original non-root station retains the authored diameter; the first registered root is an attached fan, not a resolved buried follicle. The centreline, native root identity and metric length are never reselected. Source and actual Float32 convex cells must both certify the original gap. An unsupported tube refuses; its diameter is not reduced to obtain coverage.
 *
 * @evidence contracts/common.md#principled-implementation Eight-sided tubes follow every registered station at the exact authored terminal diameter.
 * @evidence contracts/common.md#clear-and-simple-design The calibrated-shaft branch uses the existing contact registration and observer protocol without density-width fitting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported source or Float32 cells refuse rather than narrowing an authored shaft; root fans represent attachments, not buried follicles.
 * @evidence contracts/common.md#meaningful-documentation Positions and diameter are metres; complete root, stem, free curve and native registrations remain required.
 * @evidence contracts/performance.md#efficient-algorithms Each curve station emits eight vertices and checks its swept cell; query cost follows collider traversal and budget.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared frame owner and existing separation readers are reused throughout a curve.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned buffers and temporary rings scale with emitted stations; caller curves and mutable budgets are borrowed.
 *
 * @author Samchon
 */
export function buildHumanFaceHairShaftMesh(
  curves: readonly IAutoMovieHumanFaceHairCurve[],
  diameter: number,
  clearance: number,
  props: IHumanFaceHairMeshContext,
): IAutoMovieMesh {
  if (
    !Number.isFinite(diameter) ||
    diameter <= 0 ||
    props.attachments.length !== curves.length ||
    props.budgets.length !== curves.length
  )
    throw new Error(
      "Terminal shafts require their metric calibre and canonical curve registrations.",
    );
  const positions: number[] = [],
    indices: number[] = [],
    uvs: number[] = [];
  const radius: number = diameter / 2;
  const direction: (value: IAutoMovieVector3) => IAutoMovieVector3 =
    humanFaceHairFrame.direction;
  curves.forEach(
    (curve: IAutoMovieHumanFaceHairCurve, ordinal: number): void => {
      if (
        curve.points.length < 2 ||
        curve.freeFrom < 1 ||
        curve.freeFrom >= curve.points.length
      )
        throw new Error(
          "A terminal shaft needs its complete registered root, stem and free curve.",
        );
      const offset: number = positions.length / 3;
      const root: IAutoMovieVector3 = curve.points[0];
      positions.push(root.x, root.y, root.z);
      uvs.push(0.5, 0);
      const stations: IHumanFaceHairContactStation[] = [
        { vertices: [offset], radius: 0, arcLength: 0 },
      ];
      const rings: IAutoMovieVector3[][] = [];
      let across: IAutoMovieVector3 | undefined;
      let length: number = 0;
      const certified: (
        vertices: readonly IAutoMovieVector3[],
        rooted: boolean,
        free: boolean,
      ) => void = (
        vertices: readonly IAutoMovieVector3[],
        rooted: boolean,
        free: boolean,
      ): void => {
        const options: {
          clearance: number;
          budget: ImportedIAutoMovieMeshQueryBudget;
          attachment: ImportedIAutoMovieMeshSeparationAttachment | undefined;
        } = {
          clearance: free ? clearance : 0,
          budget: props.budgets[ordinal],
          attachment: rooted ? props.attachments[ordinal] : undefined,
        };
        if (
          !props.separation.source.separated(vertices, options).certified ||
          !props.separation.represented.separated(
            vertices.map(
              (point: IAutoMovieVector3): IAutoMovieVector3 =>
                Vector3.create(
                  Math.fround(point.x),
                  Math.fround(point.y),
                  Math.fround(point.z),
                ),
            ),
            options,
          ).certified
        )
          throw new Error(
            "An authored terminal shaft lacks complete source or Float32 host separation.",
          );
      };
      for (let station: number = 1; station < curve.points.length; ++station) {
        const point: IAutoMovieVector3 = curve.points[station];
        const incoming: IAutoMovieVector3 = direction(
          Vector3.subtract(point, curve.points[station - 1]),
        );
        const tangent: IAutoMovieVector3 =
          station + 1 === curve.points.length
            ? incoming
            : direction(
                Vector3.add(
                  incoming,
                  direction(Vector3.subtract(curve.points[station + 1], point)),
                ),
              );
        if (across === undefined)
          across = humanFaceHairFrame.perpendicular(tangent, curve.normal);
        else {
          const projected: IAutoMovieVector3 = Vector3.subtract(
            across,
            Vector3.scale(tangent, Vector3.dot(across, tangent)),
          );
          across =
            Vector3.length(projected) === 0
              ? humanFaceHairFrame.perpendicular(tangent, curve.normal)
              : direction(projected);
        }
        const around: IAutoMovieVector3 = direction(
          Vector3.cross(tangent, across),
        );
        const radial: IAutoMovieVector3 = across;
        length += Vector3.length(
          Vector3.subtract(point, curve.points[station - 1]),
        );
        const ring: IAutoMovieVector3[] = Array.from(
          { length: 8 },
          (_value: unknown, side: number): IAutoMovieVector3 => {
            const angle: number = (side * Math.PI) / 4;
            return Vector3.add(
              point,
              Vector3.scale(
                Vector3.add(
                  Vector3.scale(radial, Math.cos(angle)),
                  Vector3.scale(around, Math.sin(angle)),
                ),
                radius,
              ),
            );
          },
        );
        if (station === 1) {
          for (let side: number = 0; side < 8; ++side)
            certified([root, ring[(side + 1) % 8], ring[side]], true, false);
        } else
          certified(
            [
              curve.points[station - 1],
              point,
              ...rings[rings.length - 1],
              ...ring,
            ],
            false,
            station - 1 >= curve.freeFrom,
          );
        for (const [side, vertex] of ring.entries()) {
          positions.push(vertex.x, vertex.y, vertex.z);
          uvs.push(side / 8, length / curve.length);
        }
        const first: number = offset + 1 + 8 * (station - 1);
        stations.push({
          vertices: ring.map(
            (_point: IAutoMovieVector3, side: number): number => first + side,
          ),
          radius,
          arcLength: length,
        });
        for (let side: number = 0; side < 8; ++side) {
          const next: number = (side + 1) % 8;
          if (station === 1) indices.push(offset, first + next, first + side);
          else
            indices.push(
              first - 8 + side,
              first - 8 + next,
              first + side,
              first - 8 + next,
              first + next,
              first + side,
            );
        }
        rings.push(ring);
      }
      const tip: IAutoMovieVector3 = curve.points[curve.points.length - 1];
      const tipIndex: number = positions.length / 3;
      positions.push(tip.x, tip.y, tip.z);
      uvs.push(0.5, 1);
      const last: number = tipIndex - 8;
      const final: IHumanFaceHairContactStation = stations[stations.length - 1];
      stations[stations.length - 1] = {
        ...final,
        vertices: [...final.vertices, tipIndex],
      };
      for (let side: number = 0; side < 8; ++side) {
        certified(
          [
            tip,
            rings[rings.length - 1][side],
            rings[rings.length - 1][(side + 1) % 8],
          ],
          false,
          true,
        );
        indices.push(tipIndex, last + side, last + ((side + 1) % 8));
      }
      props.progress?.(ordinal);
      props.observeContactCurve?.({
        attachment: props.attachments[ordinal],
        stations,
      });
    },
  );
  return {
    positions,
    indices,
    normals: areaWeightedNormals(positions, indices),
    uvs,
    skin: null,
  };
}
