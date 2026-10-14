import { AutoMoviePrimitiveShape, IAutoMovieModel } from "@automovie/interface";
import { canonicalDrawingMaterial as drawingMaterial } from "./canonicalDrawingMaterial";

/** One unskinned primitive part bound to the caller's shape and material id. */
export const canonicalDrawingBoxModel: (props: { id: string; shape: AutoMoviePrimitiveShape; material: string; }) => IAutoMovieModel = (props: {
  id: string;
  shape: AutoMoviePrimitiveShape;
  material: string;
}): IAutoMovieModel => ({
  id: props.id,
  name: null,
  origin: "generated",
  parts: [
    {
      id: `${props.id}-body`,
      name: null,
      geometry: { type: "primitive", shape: props.shape },
      material: props.material,
      attachedBone: null,
      transform: null,
    },
  ],
  skeleton: null,
  body: null,
  materials: [drawingMaterial(props.material)],
  asset: null,
});
