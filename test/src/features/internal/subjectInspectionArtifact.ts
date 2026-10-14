import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieCompiledShotSource,
  IAutoMovieModel,
  IAutoMovieSubjectArtifact,
} from "@automovie/interface";

import { subjectInspectionIdentityTransform } from "./subjectInspectionIdentityTransform";
import { subjectInspectionModel } from "./subjectInspectionModel";

/**
 * Compiled artifact with the three #1902 coordinate oracles and one declared
 * room whose occupied content is intentionally smaller than its volume.
 */
export const subjectInspectionArtifact: (props?: {
  revision?: string;
  models?: IAutoMovieModel[];
  nodes?: IAutoMovieCompiledShotSource["scene"]["nodes"];
  instanceSets?: IAutoMovieCompiledInstanceSet[];
  environment?: IAutoMovieBuiltEnvironment | null;
}) => IAutoMovieSubjectArtifact = (
  props: {
    revision?: string;
    models?: IAutoMovieModel[];
    nodes?: IAutoMovieCompiledShotSource["scene"]["nodes"];
    instanceSets?: IAutoMovieCompiledInstanceSet[];
    environment?: IAutoMovieBuiltEnvironment | null;
  } = {},
): IAutoMovieSubjectArtifact => {
  const models: IAutoMovieModel[] = props.models ?? [
    subjectInspectionModel({
      id: "guard-rack-west-pole-0-model",
      min: { x: -13.92, y: 0, z: 5.32 },
      max: { x: -13.87, y: 2.7, z: 5.38 },
    }),
    subjectInspectionModel({
      id: "solar-oriel-model",
      min: { x: 14.75, y: 4.6, z: -1.71 },
      max: { x: 15.65, y: 7.4, z: 1.71 },
    }),
    subjectInspectionModel({
      id: "south-half-timber-brace-0-model",
      min: { x: -14.27, y: 6.89, z: 11.99 },
      max: { x: -3.73, y: 7.73, z: 12.17 },
    }),
  ];
  const nodes: IAutoMovieCompiledShotSource["scene"]["nodes"] =
    props.nodes ??
    models.map(
      (
        model: IAutoMovieModel,
      ): IAutoMovieCompiledShotSource["scene"]["nodes"][number] => ({
        id: `castle/${model.id.replace(/-model$/, "")}`,
        model: model.id,
        transform: subjectInspectionIdentityTransform(),
        motion: null,
        pose: null,
      }),
    );
  const environment: IAutoMovieBuiltEnvironment | null =
    props.environment === undefined
      ? subjectInspectionEnvironment(models)
      : props.environment;
  return {
    revision: props.revision ?? "sha256:inspection-a",
    compiled: {
      eventSamples: [],
      scene: {
        id: "inspection-scene",
        name: "Inspection scene",
        nodes,
        cameras: [],
        lights: [],
      },
      motions: [],
      models,
      formations: [],
      instanceSets: props.instanceSets ?? [],
      formationMotions: [],
      formationSlotMotions: [],
      effects: [],
      shot: {},
      ...(environment === null ? {} : { builtEnvironments: [environment] }),
    } as unknown as IAutoMovieCompiledShotSource,
  };
};

const subjectInspectionEnvironment: (
  models: IAutoMovieModel[],
) => IAutoMovieBuiltEnvironment = (
  models: IAutoMovieModel[],
): IAutoMovieBuiltEnvironment =>
  ({
    version: 1,
    id: "castle",
    units: "meter",
    buildings: [
      { id: "castle", element: "guard-rack-west-pole-0", space: "hall" },
    ],
    models,
    modelReferences: [],
    elements: models.map(
      (
        model: IAutoMovieModel,
      ): IAutoMovieBuiltEnvironment["elements"][number] => ({
        id: model.id.replace(/-model$/, ""),
        kind: model.id.includes("oriel")
          ? "window"
          : model.id.includes("brace")
            ? "brace"
            : "pole",
        parent: null,
        transform: subjectInspectionIdentityTransform(),
        model: model.id,
        space: "hall",
      }),
    ),
    spaces: [
      {
        id: "hall",
        kind: "room",
        parent: null,
        cells: [
          {
            id: "hall-cell",
            planes: [
              { normal: { x: 1, y: 0, z: 0 }, offset: 20 },
              { normal: { x: -1, y: 0, z: 0 }, offset: 20 },
              { normal: { x: 0, y: 1, z: 0 }, offset: 10 },
              { normal: { x: 0, y: -1, z: 0 }, offset: 0 },
              { normal: { x: 0, y: 0, z: 1 }, offset: 20 },
              { normal: { x: 0, y: 0, z: -1 }, offset: 20 },
            ],
          },
        ],
      },
    ],
    boundaries: [],
    openings: [],
    connectors: [],
    surfaces: [],
    walkable: [],
  }) as unknown as IAutoMovieBuiltEnvironment;
