import type {
  IAutoMovieMeshDeformationField,
  IAutoMovieVector3,
} from "@automovie/interface";

import { catmullRomPoint } from "../../mesh/catmullRomPoint";
import { millimetrePoint } from "../../mesh/millimetrePoint";
import type { IPortraitSurfaceHost } from "../../surface/structures/IPortraitSurfaceHost";
import type { IPortraitSurfaceLayer } from "../../surface/structures/IPortraitSurfaceLayer";
import { IPortraitCheekShape } from "./IPortraitCheekShape";
import { IPortraitCheekSocket } from "./IPortraitCheekSocket";
import type { IPortraitCheekVolume } from "./IPortraitCheekVolume";

/**
 * Fit named cheek envelopes and a nasolabial groove to the final shared skin.
 * Input settings are copied. Every layer reads the same undeformed refined
 * host; the surface assembler sums fields, preserves open rims and recomputes
 * normals before attached interiors consume that result.
 *
 * The groove integrates compact radial fields along a sampled spline. A cubic
 * radial kernel integrates to 32r/35 along a straight centreline. Multiplying
 * each sample by its normalized segment length times 35/32 keeps depth tied to a metric
 * surface effect rather than the number of samples. Fields are spaced in the
 * normalized support metric; their sine-squared envelope follows physical arc
 * distance, independently of the spacing of the subject's attachment vertices.
 * The anatomical path fades at both ends. Curved paths remain an approximation
 * and require rendered inspection; no cadaver measurement is claimed here.
 * At most 256 groove samples are admitted so an arbitrarily narrow requested
 * radius cannot create an unbounded field population.
 *
 * @evidence contracts/common.md#principled-implementation Named compact cheek fields and a sampled nasolabial spline use metre-converted ellipsoidal support and quadrature weights normalized by actual support-metric travel.
 * @evidence contracts/common.md#clear-and-simple-design The layer copies authored settings but resolves anchors against each current undeformed refined host before the surface assembler sums fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Curved groove integration remains an approximation, active degenerate/unrepresentable paths refuse, and the existing 256-field limit bounds narrow requested support without clipping dimensions.
 * @evidence contracts/common.md#meaningful-documentation The prose states copied-input/current-host ownership, kernel normalization, physical-arc fade and absent cadaver/visual certification.
 * @evidence contracts/performance.md#efficient-algorithms Creation scans named anchors and path identities; each fields call uses O(P) spline samples plus at-most-256 output groove fields and four mass fields, retaining support/physical distances separately.
 * @evidence contracts/performance.md#reuse-equivalent-work Copied socket/profile remain stable across host calls; each new host deliberately recomputes attached positions so mouth/nose changes cannot reuse stale fitted coordinates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned layer closure retains its copied settings/path IDs for caller lifetime; per-host spline arrays and fields are bounded by input path length and admitted field count, with no global resource.
 */
export function createPortraitCheekLayer(
  socketInput: IPortraitCheekSocket,
  shapeInput: IPortraitCheekShape,
): IPortraitSurfaceLayer {
  const socket: IPortraitCheekSocket = structuredClone(socketInput);
  const shape: IPortraitCheekShape = structuredClone(shapeInput);
  const names: readonly ["malar", "medial", "buccal", "modiolus"] = [
    "malar",
    "medial",
    "buccal",
    "modiolus",
  ] as const;
  const bindings: number[] = [
    ...names.map(
      (name: "malar" | "medial" | "buccal" | "modiolus"): number =>
        socket[name],
    ),
    ...socket.nasolabial,
  ];
  if (
    (socket.side !== "left" && socket.side !== "right") ||
    socket.nasolabial.length < 2 ||
    new Set(socket.nasolabial).size !== socket.nasolabial.length ||
    bindings.some((id: number): boolean => !Number.isInteger(id) || id < 0)
  )
    throw new Error(
      "Cheek attachments need a side, skin identities and an ordered distinct fold path.",
    );
  if (
    names.some((name: "malar" | "medial" | "buccal" | "modiolus"): boolean => {
      const volume: IPortraitCheekVolume = shape[name];
      return (
        (volume.offset !== undefined &&
          (volume.offset.length !== 3 ||
            !volume.offset.every(Number.isFinite))) ||
        ![
          volume.width,
          volume.height,
          volume.reach,
          volume.projection,
          volume.lift,
        ].every(Number.isFinite) ||
        volume.width <= 0 ||
        volume.height <= 0 ||
        volume.reach <= 0
      );
    }) ||
    ![shape.foldWidth, shape.foldDepth, shape.foldReach].every(
      Number.isFinite,
    ) ||
    shape.foldWidth <= 0 ||
    shape.foldDepth < 0 ||
    shape.foldReach <= 0
  )
    throw new Error(
      "Cheek dimensions need finite displacements and positive support radii.",
    );
  return {
    id: `${socket.side}-cheek`,
    fields: (host: IPortraitSurfaceHost): IAutoMovieMeshDeformationField[] => {
      // Read current skin positions rather than freezing fitted coordinates in
      // the component. Mouth/nose replacement can move these same attachments.
      for (const id of bindings) {
        const point: readonly number[] = host.positions[id];
        if (
          point === undefined ||
          point.length !== 3 ||
          !point.every(Number.isFinite)
        )
          throw new Error(
            "A cheek attachment must resolve to a finite resident skin position.",
          );
      }
      const fields: IAutoMovieMeshDeformationField[] = [];
      const field: (
        point: readonly number[],
        width: number,
        height: number,
        reach: number,
        projection: number,
        lift: number,
      ) => void = (
        point: readonly number[],
        width: number,
        height: number,
        reach: number,
        projection: number,
        lift: number,
      ): void => {
        fields.push({
          center: {
            x: point[0] / 1000,
            y: point[1] / 1000,
            z: point[2] / 1000,
          },
          radius: { x: width / 1000, y: height / 1000, z: reach / 1000 },
          displacement: { x: 0, y: lift / 1000, z: projection / 1000 },
          stretch: { x: 0, y: 0, z: 0 },
        });
      };
      for (const name of names) {
        const volume: IPortraitCheekVolume = shape[name];
        if (volume.projection !== 0 || volume.lift !== 0) {
          // The attachment follows the actual refined host. A separate local
          // offset positions the tissue envelope without moving the attachment
          // identity or baking another person's absolute coordinates into it.
          const offset: [number, number, number] = volume.offset ?? [0, 0, 0];
          const center: number[] = host.positions[socket[name]].map(
            (v: number, axis: number): number =>
              v +
              offset[axis] * (axis === 0 && socket.side === "right" ? -1 : 1),
          );
          if (!center.every(Number.isFinite))
            throw new Error(
              "Cheek support centre exceeds its representable range.",
            );
          field(
            center,
            volume.width,
            volume.height,
            volume.reach,
            volume.projection,
            volume.lift,
          );
        }
      }
      if (shape.foldDepth === 0) return fields;
      const path: IAutoMovieVector3[] = socket.nasolabial.map(
        (id: number): IAutoMovieVector3 => {
          const point: readonly number[] = host.positions[id];
          return millimetrePoint(point[0], point[1], point[2]);
        },
      );
      let length: number = 0;
      for (let i: number = 1; i < path.length; i++)
        length += Math.hypot(
          (path[i].x - path[i - 1].x) / shape.foldWidth,
          (path[i].y - path[i - 1].y) / shape.foldWidth,
          (path[i].z - path[i - 1].z) / shape.foldReach,
        );
      if (!Number.isFinite(length) || length === 0)
        throw new Error(
          "An active nasolabial groove needs a finite nonzero skin path.",
        );
      if (Math.ceil(2 * length) > 256)
        throw new Error(
          "Nasolabial width must resolve the skin path within 256 samples.",
        );
      // Resolve the guide first, retaining both physical travel and travel in
      // its ellipsoidal support metric. Equal spline parameter steps are not
      // equal distances when anatomical landmarks have unequal spacing.
      const samples: {
        point: IAutoMovieVector3;
        physical: number;
        normalized: number;
      }[] = Array.from(
        { length: 16 * (path.length - 1) + 1 },
        (
          _value: unknown,
          i: number,
        ): {
          point: IAutoMovieVector3;
          physical: number;
          normalized: number;
        } => ({
          point: catmullRomPoint(path, i / (16 * (path.length - 1))),
          physical: 0,
          normalized: 0,
        }),
      );
      for (let i: number = 1; i < samples.length; i++) {
        const previous: {
            point: IAutoMovieVector3;
            physical: number;
            normalized: number;
          } = samples[i - 1],
          next: {
            point: IAutoMovieVector3;
            physical: number;
            normalized: number;
          } = samples[i];
        const dx: number = next.point.x - previous.point.x,
          dy: number = next.point.y - previous.point.y,
          dz: number = next.point.z - previous.point.z;
        next.physical = previous.physical + Math.hypot(dx, dy, dz);
        next.normalized =
          previous.normalized +
          Math.hypot(
            dx / shape.foldWidth,
            dy / shape.foldWidth,
            dz / shape.foldReach,
          );
      }
      const total: {
        point: IAutoMovieVector3;
        physical: number;
        normalized: number;
      } = samples[samples.length - 1];
      if (!Number.isFinite(total.physical) || total.normalized <= 0)
        throw new Error(
          "Nasolabial displacement must remain finite along a nonzero sampled path.",
        );
      const divisions: number = Math.max(1, Math.ceil(2 * total.normalized));
      if (divisions > 256)
        throw new Error(
          "Nasolabial width must resolve the curved skin path within 256 samples.",
        );
      const step: number = total.normalized / divisions;
      let cursor: number = 0;
      for (let i: number = 0; i < divisions; i++) {
        const distance: number = (i + 0.5) * step;
        while (
          cursor + 1 < samples.length - 1 &&
          samples[cursor + 1].normalized <= distance
        )
          cursor++;
        const before: {
            point: IAutoMovieVector3;
            physical: number;
            normalized: number;
          } = samples[cursor],
          after: {
            point: IAutoMovieVector3;
            physical: number;
            normalized: number;
          } = samples[cursor + 1];
        const fraction: number =
          (distance - before.normalized) /
          (after.normalized - before.normalized);
        const physical: number =
          before.physical + fraction * (after.physical - before.physical);
        const center: number[] = (["x", "y", "z"] as const).map(
          (axis: "x" | "y" | "z"): number =>
            before.point[axis] +
            fraction * (after.point[axis] - before.point[axis]),
        );
        // step is at most one half. Form its bounded quadrature weight before
        // multiplying by depth to avoid a needless large intermediate product.
        const depth: number =
          shape.foldDepth *
          (Math.sin(Math.PI * (physical / total.physical)) ** 2 *
            ((step * 35) / 32));
        field(
          center,
          shape.foldWidth,
          shape.foldWidth,
          shape.foldReach,
          -depth,
          0,
        );
      }
      return fields;
    },
  };
}
