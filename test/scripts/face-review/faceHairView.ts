import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type createHumanFaceBasisBuilder,
} from "@automovie/human";

import {
  type IFaceShapeFitView,
  faceShapeFitProject,
} from "./faceShapeFitCamera";
import {
  type IFaceShapeFitAnchor,
  faceShapeFitAnchorPoint,
  faceShapeFitSurfacePositions,
} from "./faceShapeFitSurface";

/**
 * The hair a camera sees on a built model: the pixels of `view` where a hair
 * triangle lies in front of the skin (within `slack` metres, so hair lying on
 * the skin counts), as a mask of the view's own viewport.
 *
 * Both surfaces are rasterized at the view's resolution with their depth
 * along the camera's forward axis; hair hides hair and that does not matter
 * here, only whether the skin hides it. A photograph's hair segmentation is
 * the same kind of observation, so a hair index read on this mask and on a
 * photograph's mask compares like with like. Pure.
 */
export function faceHairVisibleMask(props: {
  view: IFaceShapeFitView;
  skin: { positions: readonly number[]; indices: readonly number[] };
  hair: readonly { positions: readonly number[]; indices: readonly number[] }[];
  slack: number;
}): { width: number; height: number; data: Uint8Array } {
  const size = props.view.viewport;
  const depth = (p: readonly number[]) =>
    [0, 1, 2].reduce(
      (sum, k) => sum + (p[k]! - props.view.eye[k]!) * props.view.forward[k]!,
      0,
    );
  const raster = (
    surface: { positions: readonly number[]; indices: readonly number[] },
    visit: (at: number, z: number) => void,
  ) => {
    for (let t = 0; t < surface.indices.length; t += 3) {
      const c = [0, 1, 2].map((k) => {
        const v = surface.indices[t + k]!;
        const p = [0, 1, 2].map((a) => surface.positions[3 * v + a]!);
        const [x, y] = faceShapeFitProject(props.view, p);
        return { x, y, z: depth(p) };
      });
      const [a, b, d] = c as [
        (typeof c)[number],
        (typeof c)[number],
        (typeof c)[number],
      ];
      const area = (b.x - a.x) * (d.y - a.y) - (d.x - a.x) * (b.y - a.y);
      if (area === 0) continue;
      const x0 = Math.max(0, Math.floor(Math.min(a.x, b.x, d.x)));
      const x1 = Math.min(size - 1, Math.ceil(Math.max(a.x, b.x, d.x)));
      const y0 = Math.max(0, Math.floor(Math.min(a.y, b.y, d.y)));
      const y1 = Math.min(size - 1, Math.ceil(Math.max(a.y, b.y, d.y)));
      for (let y = y0; y <= y1; ++y)
        for (let x = x0; x <= x1; ++x) {
          const px = x + 0.5;
          const py = y + 0.5;
          const w1 =
            ((px - a.x) * (d.y - a.y) - (d.x - a.x) * (py - a.y)) / area;
          const w2 =
            ((b.x - a.x) * (py - a.y) - (px - a.x) * (b.y - a.y)) / area;
          const w0 = 1 - w1 - w2;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          visit(y * size + x, w0 * a.z + w1 * b.z + w2 * d.z);
        }
    }
  };
  const skin = new Float64Array(size * size).fill(Infinity);
  raster(props.skin, (at, z) => {
    if (z < skin[at]!) skin[at] = z;
  });
  const data = new Uint8Array(size * size);
  for (const part of props.hair)
    raster(part, (at, z) => {
      if (z <= skin[at]! + props.slack) data[at] = 1;
    });
  return { width: size, height: size, data };
}

/**
 * One document's model as a hair index reads it under a photograph's
 * camera: the hair the camera sees (`faceHairVisibleMask`), each anchored
 * landmark's projection, and the metric distance between two anchored
 * landmarks (`span`, the lateral eye corners for the hair indices), which
 * turns a millimetre norm into the indices' inter-ocular units.
 */
export function observeFaceHairModel(props: {
  basis: IAutoMovieHumanFaceBasis;
  build: ReturnType<typeof createHumanFaceBasisBuilder>;
  document: IAutoMovieHumanFaceBasisDocument;
  view: IFaceShapeFitView;
  anchors: Readonly<Record<number, IFaceShapeFitAnchor>>;
  span: readonly [number, number];
}): {
  hair: { width: number; height: number; data: Uint8Array };
  landmarks: Record<number, [number, number]>;
  span: number;
} {
  const model = props.build(props.document);
  const skin = faceShapeFitSurfacePositions(props.basis, model, "Human");
  const human = props.basis.surfaces.find((one) => one.id === "Human")!;
  const [a, b] = props.span.map((k) =>
    faceShapeFitAnchorPoint(skin, props.anchors[k]!),
  );
  return {
    hair: faceHairVisibleMask({
      view: props.view,
      skin: { positions: skin, indices: human.indices },
      hair: model.parts.flatMap((part) =>
        part.id.startsWith("numerical-hair:") && part.geometry.type === "mesh"
          ? [
              {
                positions: part.geometry.mesh.positions,
                indices: part.geometry.mesh.indices!,
              },
            ]
          : [],
      ),
      slack: 0.001,
    }),
    landmarks: Object.fromEntries(
      Object.entries(props.anchors).map(([landmark, anchor]) => [
        landmark,
        faceShapeFitProject(props.view, faceShapeFitAnchorPoint(skin, anchor)),
      ]),
    ),
    span: Math.hypot(...[0, 1, 2].map((k) => a![k]! - b![k]!)),
  };
}
