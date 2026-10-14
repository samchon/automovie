import { lowerWaterFeature, validateWaterFeatures } from "@automovie/engine";
import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieFluidDomain,
  IAutoMovieFluidSpray,
  IAutoMovieWaterFeature,
} from "@automovie/interface";
import {
  applyRenderMode,
  buildFluidSprayObject,
  buildFluidSurfaceObject,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { observeThrownValue } from "../internal/observeThrownValue";
import { namedFacts } from "../internal/predicates";

/** The four courts, each a convex box two metres either side of its centre. */
const COURTS: readonly [
  {
    readonly space: "pond-court";
    readonly rim: "pond-coping";
    readonly centre: 0;
  },
  {
    readonly space: "channel-court";
    readonly rim: "channel-kerb";
    readonly centre: 8;
  },
  {
    readonly space: "fountain-court";
    readonly rim: "fountain-rim";
    readonly centre: 16;
  },
  {
    readonly space: "fall-court";
    readonly rim: "fall-parapet";
    readonly centre: 24;
  },
] = [
  { space: "pond-court", rim: "pond-coping", centre: 0 },
  { space: "channel-court", rim: "channel-kerb", centre: 8 },
  { space: "fountain-court", rim: "fountain-rim", centre: 16 },
  { space: "fall-court", rim: "fall-parapet", centre: 24 },
] as const;

const court: (centre: number) => {
  id: string;
  planes: { normal: { x: number; y: number; z: number }; offset: number }[];
} = (
  centre: number,
): {
  id: string;
  planes: { normal: { x: number; y: number; z: number }; offset: number }[];
} => ({
  id: `cell-${centre}`,
  planes: [
    { normal: { x: -1, y: 0, z: 0 }, offset: 2 - centre },
    { normal: { x: 1, y: 0, z: 0 }, offset: 2 + centre },
    { normal: { x: 0, y: -1, z: 0 }, offset: 1 },
    { normal: { x: 0, y: 1, z: 0 }, offset: 6 },
    { normal: { x: 0, y: 0, z: -1 }, offset: 2 },
    { normal: { x: 0, y: 0, z: 1 }, offset: 2 },
  ],
});

/** One building whose four logical spaces are four water courts. */
const waterCourt: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => ({
    version: 1,
    id: "water-court",
    units: "meter",
    buildings: [{ id: "unit", element: "root", space: "court" }],
    models: [],
    modelReferences: [],
    elements: [
      {
        id: "root",
        kind: "building",
        parent: null,
        transform: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        model: null,
        space: "court",
      },
    ],
    spaces: [
      { id: "court", kind: "room", parent: null, cells: [] },
      ...COURTS.map(
        (
          one:
            | {
                readonly space: "pond-court";
                readonly rim: "pond-coping";
                readonly centre: 0;
              }
            | {
                readonly space: "channel-court";
                readonly rim: "channel-kerb";
                readonly centre: 8;
              }
            | {
                readonly space: "fountain-court";
                readonly rim: "fountain-rim";
                readonly centre: 16;
              }
            | {
                readonly space: "fall-court";
                readonly rim: "fall-parapet";
                readonly centre: 24;
              },
        ): {
          id: "pond-court" | "channel-court" | "fountain-court" | "fall-court";
          kind: "room";
          parent: string;
          cells: {
            id: string;
            planes: {
              normal: { x: number; y: number; z: number };
              offset: number;
            }[];
          }[];
        } => ({
          id: one.space,
          kind: "room" as const,
          parent: "court",
          cells: [court(one.centre)],
        }),
      ),
    ],
    boundaries: COURTS.map(
      (
        one:
          | {
              readonly space: "pond-court";
              readonly rim: "pond-coping";
              readonly centre: 0;
            }
          | {
              readonly space: "channel-court";
              readonly rim: "channel-kerb";
              readonly centre: 8;
            }
          | {
              readonly space: "fountain-court";
              readonly rim: "fountain-rim";
              readonly centre: 16;
            }
          | {
              readonly space: "fall-court";
              readonly rim: "fall-parapet";
              readonly centre: 24;
            },
      ): {
        id: "pond-coping" | "channel-kerb" | "fountain-rim" | "fall-parapet";
        kind: "wall";
        spaces: (
          | "pond-court"
          | "channel-court"
          | "fountain-court"
          | "fall-court"
        )[];
        elements: never[];
      } => ({
        id: one.rim,
        kind: "wall" as const,
        spaces: [one.space],
        elements: [],
      }),
    ),
    openings: [],
    connectors: [],
    surfaces: [],
    walkable: [],
  });

/** A four-by-four lattice centred on one court, walled all round. */
const lattice: (props: {
  id: string;
  centre: number;
  bed: number[];
  depth: number[];
  sources?: IAutoMovieFluidDomain["sources"];
  drains?: IAutoMovieFluidDomain["drains"];
  sprays?: IAutoMovieFluidSpray[];
}) => IAutoMovieFluidDomain = (props: {
  id: string;
  centre: number;
  bed: number[];
  depth: number[];
  sources?: IAutoMovieFluidDomain["sources"];
  drains?: IAutoMovieFluidDomain["drains"];
  sprays?: IAutoMovieFluidSpray[];
}): IAutoMovieFluidDomain => ({
  version: 1,
  id: props.id,
  units: "meter",
  grid: {
    columns: 4,
    rows: 4,
    cellX: 0.5,
    cellZ: 0.5,
    origin: { x: props.centre - 1, y: 0, z: -1 },
  },
  solver: {
    fixedStepSeconds: 0.015625,
    gravity: 8,
    drag: 0,
    dryDepth: 0,
    referenceDepth: 2,
    maxSteps: 5_000,
  },
  boundaries: { xMin: "wall", xMax: "wall", zMin: "wall", zMax: "wall" },
  bed: props.bed,
  depth: props.depth,
  solid: new Array<boolean>(16).fill(false),
  sources: props.sources ?? [],
  drains: props.drains ?? [],
  sprays: props.sprays ?? [],
});

const mist: (column: number, row: number) => IAutoMovieFluidSpray = (
  column: number,
  row: number,
): IAutoMovieFluidSpray => ({
  id: "mist",
  column,
  row,
  rate: 8,
  lifetime: 1,
  speed: 2,
  direction: { x: 0, y: 1, z: 0 },
  spread: 0,
  size: 0.05,
  seed: 11,
  maxParticles: 16,
  lodDistance: 10,
});

const flat: (value: number) => number[] = (value: number): number[] =>
  new Array<number>(16).fill(value);

/** Bed and depth of the ledge: the upper two rows stand a metre above. */
const ledge: (upper: number, lower: number) => number[] = (
  upper: number,
  lower: number,
): number[] =>
  Array.from({ length: 16 }, (_: unknown, cell: number): number =>
    cell < 8 ? upper : lower,
  );

/**
 * Exercises the existing architecture-to-water numerical binding and reversible CPU guide-material projection.
 *
 * Scenarios:
 * 1. Four independent authored courts/domains pass the actual water-feature binding validator.
 * 2. Still, flowing and simulated features lower to CPU topology, visibility and fixed-step metadata.
 * 3. Only the flowing channel records the flowing-material policy; ripple appearance remains unobserved.
 * 4. Depth, normal and mask replace all four water materials; restore recovers references and beauty keeps them.
 * 5. Structural passes hide the two nonempty sprays and restore visibility; projected counts match Engine samples and the authored rate-times-lifetime population.
 * 6. Each existing water/spray geometry disposal throws its original cause; default material still receives the next attempt, and another invocation retains the existing retry policy and order.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual feature validation/lowering and surface/spray builders, reads topology/status/flow metadata, per-pass material/visibility state and particle counts, then observes actual geometry/material disposal events under a throwing geometry listener.
 * @evidence contracts/testing.md#independent-expectations Four authored independent courts/domains, fixed-step time and emitter rate-times-lifetime define expectations separately from produced meshes; geometry-first ordered event attempts and original Error identity judge independent default-material release. These CPU facts do not prove camera visibility, physical fluid validity or freed GPU storage.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts static/flowing/simulated features, surface versus spray, three structural modes versus beauty, retained/restored material identities and failed geometry cleanup with repeated per-invocation attempts. The neighboring fluid_surface unit owns borrowed-material disposal; solver and geometry values remain unchanged.
 * @evidence contracts/testing.md#execution-ownership The named entry owns existing non-Human fluid records and actual CPU Three projections, retires surface/spray wrappers and uses no browser/renderer/new driver; native uploads and release are unobserved.
 */
export function test_viewer_water_feature_passes(): void {
  const environment: IAutoMovieBuiltEnvironment = waterCourt();
  const domains: IAutoMovieFluidDomain[] = [
    lattice({
      id: "atrium-pond",
      centre: 0,
      bed: flat(0),
      depth: flat(0.25),
    }),
    lattice({
      id: "cloister-channel",
      centre: 8,
      bed: flat(0),
      depth: flat(0.25),
      sources: [
        { id: "feed", column: 0, row: 1, flowRate: 0.05, start: 0, end: null },
      ],
      drains: [
        {
          id: "return",
          column: 3,
          row: 2,
          flowRate: 0.01,
          sillLevel: 0.2,
          start: 0,
          end: null,
        },
      ],
    }),
    lattice({
      id: "court-fountain",
      centre: 16,
      bed: flat(0),
      depth: flat(0.25),
      sources: [
        { id: "jet", column: 1, row: 1, flowRate: 0.05, start: 0, end: null },
      ],
      drains: [
        {
          id: "sump",
          column: 2,
          row: 2,
          flowRate: 0.01,
          sillLevel: 0.2,
          start: 0,
          end: null,
        },
      ],
      sprays: [mist(1, 1)],
    }),
    lattice({
      id: "wall-fall",
      centre: 24,
      bed: ledge(1, 0),
      depth: ledge(0.5, 0),
      sprays: [mist(1, 2)],
    }),
  ];
  const features: IAutoMovieWaterFeature[] = [
    {
      id: "still-pond",
      environment: "water-court",
      space: "pond-court",
      domain: "atrium-pond",
      kind: "pond",
      mode: "static",
      boundaries: ["pond-coping"],
      material: null,
    },
    {
      id: "circulating-channel",
      environment: "water-court",
      space: "channel-court",
      domain: "cloister-channel",
      kind: "channel",
      mode: "flowing",
      boundaries: ["channel-kerb"],
      material: null,
    },
    {
      id: "fountain-basin",
      environment: "water-court",
      space: "fountain-court",
      domain: "court-fountain",
      kind: "fountain",
      mode: "simulated",
      boundaries: ["fountain-rim"],
      material: null,
    },
    {
      id: "water-wall",
      environment: "water-court",
      space: "fall-court",
      domain: "wall-fall",
      kind: "waterfall",
      mode: "simulated",
      boundaries: ["fall-parapet"],
      material: null,
    },
  ];

  const binding: import("@automovie/interface").IAutoMovieValidation =
    validateWaterFeatures({ environment, features, domains });
  TestValidator.equals(
    "four independent lattices bind to four courts of one building",
    binding.success,
    true,
  );

  const time: number = 2;
  const solvedStep: number = time / domains[0].solver.fixedStepSeconds;
  const frames: ReturnType<typeof lowerWaterFeature>[] = features.map(
    (
      feature: IAutoMovieWaterFeature,
      index: number,
    ): import("@automovie/engine").IAutoMovieWaterFeatureFrame =>
      lowerWaterFeature({ feature, domain: domains[index], time }),
  );
  const waters: ReturnType<typeof buildFluidSurfaceObject>[] = frames.map(
    (
      frame: import("@automovie/engine").IAutoMovieWaterFeatureFrame,
      index: number,
    ): import("../../../../packages/viewer/src/IAutoMovieFluidSurfaceObject").IAutoMovieFluidSurfaceObject =>
      buildFluidSurfaceObject({
        surface: frame.surface,
        mode: features[index].mode,
      }),
  );
  const sprays: ReturnType<typeof buildFluidSprayObject>[] = frames.map(
    (
      frame: import("@automovie/engine").IAutoMovieWaterFeatureFrame,
    ): import("../../../../packages/viewer/src/IAutoMovieFluidSprayObject").IAutoMovieFluidSprayObject =>
      buildFluidSprayObject({ sample: frame.spray }),
  );

  TestValidator.equals(
    "every archetype lowers to a triangulated CPU surface marked visible",
    namedFacts([
      [
        "bounds",
        (): boolean =>
          frames.every(
            (
              frame: import("@automovie/engine").IAutoMovieWaterFeatureFrame,
            ): boolean => frame.surface.bounds !== null,
          ),
      ],
      [
        "quads",
        (): boolean =>
          frames.every(
            (
              frame: import("@automovie/engine").IAutoMovieWaterFeatureFrame,
            ): boolean => (frame.surface.mesh.indices ?? []).length >= 6,
          ),
      ],
      [
        "visible",
        (): boolean =>
          waters.every(
            (
              water: import("../../../../packages/viewer/src/IAutoMovieFluidSurfaceObject").IAutoMovieFluidSurfaceObject,
            ): boolean => water.object.visible === true,
          ),
      ],
      [
        "named",
        (): boolean =>
          waters
            .map(
              (
                water: import("../../../../packages/viewer/src/IAutoMovieFluidSurfaceObject").IAutoMovieFluidSurfaceObject,
              ): string => water.object.name,
            )
            .join("|") ===
          "water:atrium-pond|water:cloister-channel|water:court-fountain|water:wall-fall",
      ],
      ["staticHolds", (): boolean => frames[0].state.step === 0],
      [
        "solvedSeek",
        (): boolean =>
          frames
            .slice(1)
            .every(
              (
                frame: import("@automovie/engine").IAutoMovieWaterFeatureFrame,
              ): boolean => frame.state.step === solvedStep,
            ),
      ],
      [
        "surfaceFollowsState",
        (): boolean =>
          frames.every(
            (
              frame: import("@automovie/engine").IAutoMovieWaterFeatureFrame,
            ): boolean => frame.surface.step === frame.state.step,
          ),
      ],
      [
        "flowing",
        (): boolean =>
          waters
            .map(
              (
                water: import("../../../../packages/viewer/src/IAutoMovieFluidSurfaceObject").IAutoMovieFluidSurfaceObject,
              ): boolean => water.object.userData.flowing === true,
            )
            .join(",") === "false,true,false,false",
      ],
    ]),
    {
      bounds: true,
      quads: true,
      visible: true,
      named: true,
      staticHolds: true,
      solvedSeek: true,
      surfaceFollowsState: true,
      flowing: true,
    },
  );

  const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
  for (const water of waters) scene.add(water.object);
  for (const spray of sprays) scene.add(spray.object);
  const originals: (
    | THREE.Material<THREE.MaterialEventMap>
    | THREE.Material<THREE.MaterialEventMap>[]
  )[] = waters.map(
    (
      water: import("../../../../packages/viewer/src/IAutoMovieFluidSurfaceObject").IAutoMovieFluidSurfaceObject,
    ):
      | THREE.Material<THREE.MaterialEventMap>
      | THREE.Material<THREE.MaterialEventMap>[] => water.object.material,
  );
  // The two emitters that actually carry particles are the fountain's jet and the curtain at the foot of the ledge. The still pond and channel declare no emitter, so hiding them would prove nothing.
  const misted: ReturnType<typeof buildFluidSprayObject>[] = [
    sprays[2],
    sprays[3],
  ];

  const structural: {
    overridden: boolean;
    mistHidden: boolean;
    restored: boolean;
    mistShown: boolean;
  }[] = (["depth", "normal", "mask"] as const).map(
    (
      mode: "mask" | "depth" | "normal",
    ): {
      overridden: boolean;
      mistHidden: boolean;
      restored: boolean;
      mistShown: boolean;
    } => {
      const handle: import("../../../../packages/viewer/src/IAutoMovieRenderModeHandle").IAutoMovieRenderModeHandle =
        applyRenderMode(scene, mode);
      const overridden: boolean = waters.every(
        (
          water: import("../../../../packages/viewer/src/IAutoMovieFluidSurfaceObject").IAutoMovieFluidSurfaceObject,
          index: number,
        ): boolean => water.object.material !== originals[index],
      );
      const mistHidden: boolean = misted.every(
        (
          spray: import("../../../../packages/viewer/src/IAutoMovieFluidSprayObject").IAutoMovieFluidSprayObject,
        ): boolean => spray.object.visible === false,
      );
      handle.restore();
      return {
        overridden,
        mistHidden,
        restored: waters.every(
          (
            water: import("../../../../packages/viewer/src/IAutoMovieFluidSurfaceObject").IAutoMovieFluidSurfaceObject,
            index: number,
          ): boolean => water.object.material === originals[index],
        ),
        mistShown: misted.every(
          (
            spray: import("../../../../packages/viewer/src/IAutoMovieFluidSprayObject").IAutoMovieFluidSprayObject,
          ): boolean => spray.object.visible === true,
        ),
      };
    },
  );
  const beauty: import("../../../../packages/viewer/src/IAutoMovieRenderModeHandle").IAutoMovieRenderModeHandle =
    applyRenderMode(scene, "beauty");
  const untouched: boolean = waters.every(
    (
      water: import("../../../../packages/viewer/src/IAutoMovieFluidSurfaceObject").IAutoMovieFluidSurfaceObject,
      index: number,
    ): boolean => water.object.material === originals[index],
  );
  beauty.restore();

  TestValidator.equals(
    "the three requested structural modes replace all four water materials and hide mist",
    namedFacts([
      [
        "overridden",
        (): boolean =>
          structural.every(
            (pass: {
              overridden: boolean;
              mistHidden: boolean;
              restored: boolean;
              mistShown: boolean;
            }): boolean => pass.overridden,
          ),
      ],
      [
        "restored",
        (): boolean =>
          structural.every(
            (pass: {
              overridden: boolean;
              mistHidden: boolean;
              restored: boolean;
              mistShown: boolean;
            }): boolean => pass.restored,
          ),
      ],
      [
        "mistHidden",
        (): boolean =>
          structural.every(
            (pass: {
              overridden: boolean;
              mistHidden: boolean;
              restored: boolean;
              mistShown: boolean;
            }): boolean => pass.mistHidden,
          ),
      ],
      [
        "mistShown",
        (): boolean =>
          structural.every(
            (pass: {
              overridden: boolean;
              mistHidden: boolean;
              restored: boolean;
              mistShown: boolean;
            }): boolean => pass.mistShown,
          ),
      ],
      ["beautyUntouched", (): boolean => untouched],
      [
        "mistProjectedCount",
        (): boolean =>
          misted.every(
            (
              spray: import("../../../../packages/viewer/src/IAutoMovieFluidSprayObject").IAutoMovieFluidSprayObject,
              at: number,
            ): boolean =>
              spray.count() === frames[at + 2].spray.particles.length,
          ),
      ],
      [
        // A jet of 8 particles a second, each living one second, has a steady live set of exactly 8 from the emitter's own numbers, so stopping or doubling fails this independent expectation.
        "mistSteady",
        (): boolean =>
          misted.every(
            (
              spray: import("../../../../packages/viewer/src/IAutoMovieFluidSprayObject").IAutoMovieFluidSprayObject,
            ): boolean => spray.count() === 8,
          ),
      ],
    ]),
    {
      overridden: true,
      restored: true,
      mistHidden: true,
      mistShown: true,
      beautyUntouched: true,
      mistProjectedCount: true,
      mistSteady: true,
    },
  );

  const cleanupAttempts: string[][] = [];
  const cleanupFailures: Error[] = [];
  const cleanupOutcomes: ReturnType<typeof observeThrownValue>[] = [];
  for (const projection of [...waters, ...sprays]) {
    const failure: Error = new Error(
      "Water projection geometry disposal failed.",
    );
    const attempts: string[] = [];
    cleanupAttempts.push(attempts);
    cleanupFailures.push(failure);
    const material: THREE.Material = projection.object
      .material as THREE.Material;
    projection.object.geometry.addEventListener("dispose", (): never => {
      attempts.push("geometry");
      throw failure;
    });
    material.addEventListener("dispose", (): void => {
      attempts.push("material");
    });
    cleanupOutcomes.push(
      observeThrownValue(projection.dispose),
      observeThrownValue(projection.dispose),
    );
  }
  TestValidator.predicate(
    "all eight existing projections retain their original geometry cause on both invocations",
    cleanupFailures.length === 8 &&
      cleanupOutcomes.length === 16 &&
      cleanupOutcomes.every(
        (
          outcome: ReturnType<typeof observeThrownValue>,
          index: number,
        ): boolean =>
          outcome.threw &&
          outcome.error === cleanupFailures[Math.floor(index / 2)],
      ),
  );
  TestValidator.equals(
    "geometry failure cannot skip any existing default material and preserves per-invocation retry order",
    cleanupAttempts,
    Array.from({ length: 8 }, (): string[] => [
      "geometry",
      "material",
      "geometry",
      "material",
    ]),
  );
}
