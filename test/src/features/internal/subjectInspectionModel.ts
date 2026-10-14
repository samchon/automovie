import { IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";

/** Minimal mesh-backed model whose resident positions state one exact box. */
export const subjectInspectionModel: (props: {
  id: string;
  min: IAutoMovieVector3;
  max: IAutoMovieVector3;
  name?: string | null;
  material?: string | null;
}) => IAutoMovieModel = (props: {
  id: string;
  min: IAutoMovieVector3;
  max: IAutoMovieVector3;
  name?: string | null;
  material?: string | null;
}): IAutoMovieModel =>
  ({
    id: props.id,
    name: props.name ?? props.id,
    origin: "generated",
    parts: [
      {
        id: "body",
        name: "body",
        geometry: {
          type: "mesh",
          mesh: {
            positions: [
              props.min.x,
              props.min.y,
              props.min.z,
              props.max.x,
              props.max.y,
              props.max.z,
            ],
            normals: [0, 1, 0, 0, 1, 0],
            uvs: null,
            indices: [],
            skin: null,
          },
        },
        material: props.material ?? "stone",
        attachedBone: null,
        transform: null,
      },
    ],
    skeleton: null,
    body: null,
    materials:
      props.material === null
        ? []
        : [
            {
              id: props.material ?? "stone",
              name: "inspection stone",
            },
          ],
    asset: null,
  }) as unknown as IAutoMovieModel;
