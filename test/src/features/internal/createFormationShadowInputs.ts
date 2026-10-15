import { materializeCompiledFormation } from "@automovie/engine";
import type {
  IAutoMovieFormationMotion,
  IAutoMovieModel,
} from "@automovie/interface";
import type { buildInstancedFormation } from "@automovie/viewer";

import { IDENTITY_TRANSFORM, createModel } from "./fixtures";

/**
 * A rigid box with two declared idle cycles, assembled through the ordinary
 * model and compact-formation boundaries. Root bob has zero ground stride,
 * so seconds independently determine its phase without a hand-written table.
 */
export const createFormationShadowInputs: (
  count?: number,
  cyclic?: boolean,
) => Parameters<typeof buildInstancedFormation>[0] = (
  count: number = 2,
  cyclic: boolean = true,
): Parameters<typeof buildInstancedFormation>[0] => {
  const formation: ReturnType<typeof materializeCompiledFormation> =
    materializeCompiledFormation({
      formation: {
        id: "shadow-unit",
        model: "box",
        count: Math.max(1, count),
        layout: {
          kind: "line",
          files: Math.max(1, count),
          ranks: 1,
          spacing: { lateral: 0.01, depth: 1 },
        },
        anchor: { x: 0, y: 0, z: 0 },
        facingDeg: 0,
        seed: 7,
        capabilities: [],
        heroOverrides: [],
      },
      projectionRadii: new Map([["box", 3]]),
    });
  if (count === 0) {
    formation.count = 0;
    formation.anonymousCount = 0;
    formation.chunks = [];
  }
  const model: IAutoMovieModel = createModel({
    id: "box-rig",
    bones: [
      {
        bone: "hips",
        parent: null,
        rest: IDENTITY_TRANSFORM,
        constraint: null,
      },
    ],
  });
  model.parts[0]!.attachedBone = "hips";
  model.parts[0]!.name = "first-box";
  model.parts.push({
    ...model.parts[0]!,
    id: "second-box",
    name: "second-box",
  });
  model.materials.push({ ...model.materials[0]!, id: "second-palette" });
  model.parts.push({
    ...model.parts[0]!,
    id: "third-box",
    name: "third-box",
    material: "second-palette",
  });
  model.profiles = [
    {
      id: "box-cycles",
      name: "box-cycles",
      drivers: [],
      limits: [],
      gaits: cyclic
        ? [
            {
              name: "bob",
              period: 1,
              rootBob: { center: 1.5, amplitude: 0.5, phase: 0 },
              limbs: [],
            },
            {
              name: "high",
              period: 2,
              rootBob: { center: 2, amplitude: 0.25, phase: 0 },
              limbs: [],
            },
          ]
        : [],
    },
  ];
  const still: IAutoMovieFormationMotion["from"] = {
    translation: { x: 0, y: 0, z: 0 },
    facingOffsetDeg: 0,
    spacingScale: { lateral: 1, depth: 1 },
  };
  const motions: IAutoMovieFormationMotion[] = cyclic
    ? [
        {
          id: "bob-cue",
          formation: formation.id,
          action: "hold",
          gait: "bob",
          start: 0,
          end: 1,
          from: still,
          to: still,
          easing: "linear",
        },
        {
          id: "high-cue",
          formation: formation.id,
          action: "hold",
          gait: "high",
          start: 1,
          end: 3,
          from: still,
          to: still,
          easing: "linear",
        },
      ]
    : [];
  return {
    formation,
    models: new Map([[formation.lod[0]!.runtimeModel, model]]),
    motions,
  };
};
