import type { IAutoMovieHumanFaceNasalContour } from "@automovie/human/face/structures/IAutoMovieHumanFaceNasalContour";

import type { IHumanSourceAuthoredCompilation } from "./structures/IHumanSourceAuthoredCompilation.ts";

/** Register the provider's oriented native boundary in the current head.
 * Exact native/source/view addressing preserves the authored order. The
 * source-owned chart normal rotates once from Blender XYZ to [X,Z,-Y]; the
 * public reader owns projection and measurement on final Float32 geometry.
 * No angular sorting, nearest point or retired native coordinate substitutes.
 */
export function defineHumanSourceAuthoredNasalContours(
  current: IHumanSourceAuthoredCompilation,
  generation: string,
): IAutoMovieHumanFaceNasalContour[] {
  const headOf = new Map(
    Array.from(
      current.skin.partition.cut.faceToG1,
      (source, vertex): [number, number] => [source, vertex],
    ),
  );
  return (["left", "right"] as const).map<IAutoMovieHumanFaceNasalContour>(
    (side) => {
      const ports = current.packet.orderedPorts.nose.filter(
        (port) => port.side === side,
      );
      const axes = current.nasalAxis.axes.filter((axis) => axis.side === side);
      if (ports.length !== 1 || axes.length !== 1)
        throw new Error(
          `Current ${side} nasal contour lacks one native boundary and chart.`,
        );
      const native = ports[0].orderedNativeBoundary;
      if (native.length < 3 || new Set(native).size !== native.length)
        throw new Error(
          `Current ${side} nasal contour has duplicate native points.`,
        );
      const orderedVertices = native.map((id) => {
        const source = current.root.nativeToSource[id];
        const vertex = headOf.get(source);
        if (!Number.isSafeInteger(source) || source < 0 || vertex === undefined)
          throw new Error(
            `Current ${side} nasal contour native point ${id} is retired or outside the head.`,
          );
        return vertex;
      });
      const n = axes[0].outwardAxisBlender;
      if (
        n.length !== 3 ||
        n.some((value) => !Number.isFinite(value)) ||
        Math.abs(Math.hypot(...n) - 1) > 1e-6
      )
        throw new Error(
          `Current ${side} nasal chart needs its finite source unit normal.`,
        );
      return {
        side,
        generationSourceId: generation,
        protocol: "authored-source-projected-contour/1",
        surface: "Human",
        orderedVertices,
        orderedNativeVertices: [...native],
        projectionNormal: { x: n[0], y: n[2], z: -n[1] },
        qualification: `${current.nasalAxis.qualification}; actual provider socket boundary, not a clinical aperture or tissue segmentation.`,
      };
    },
  );
}
