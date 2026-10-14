import { IAutoMovieSceneNode, IAutoMovieScene, IAutoMovieSemanticMask } from "@automovie/interface";
import { IAutoMovieRenderSubject } from "../../../../packages/engine/src/render/IAutoMovieRenderSubject";
import { buildingFixture, instanceSetFixture, modelsFixture, sceneFixture } from "./renderFixtures";
/**
 * Construct the structured subject and typed exceptional lookup masks used by semantic ownership, palette and resolution units. The subject has real building layers and compact instances. The exceptional masks deliberately carry typed dangling or cyclic ownership and unverified digests for the lookup unit; they are not valid sealed production evidence or colour oracles.
 */
export const createSemanticMaskTestInputs: () => { subject: () => IAutoMovieRenderSubject; bulk: (semantic: string) => IAutoMovieSceneNode; broken: (owner: string) => IAutoMovieSemanticMask; cyclic: () => IAutoMovieSemanticMask; } = (): { subject: () => IAutoMovieRenderSubject; bulk: (semantic: string) => IAutoMovieSceneNode; broken: (owner: string) => IAutoMovieSemanticMask; cyclic: () => IAutoMovieSemanticMask; } => {
  const subject: () => IAutoMovieRenderSubject = (): IAutoMovieRenderSubject => ({
      scene: sceneFixture(),
      models: modelsFixture(),
      environments: [buildingFixture()],
      instanceSets: [instanceSetFixture({ id: "windows", count: 12, chunks: 3 })],
      waterBodies: [
        {
          id: "atrium-pool",
          owner: "space:tower/ground-hall",
          nodes: ["pool-surface"],
          cells: null,
          particles: null,
          domain: null,
          material: null,
        },
      ],
    });

  /** One staged node whose semantic id is exactly `node:<id>`. */
  const bulk: (semantic: string) => IAutoMovieSceneNode = (semantic: string): IAutoMovieScene["nodes"][number] => ({
    id: semantic.slice("node:".length),
    model: "prop-model",
    transform: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    motion: null,
    pose: null,
  });

  /** A hand-built mask whose single entry points at an owner that is not there. */
  const broken: (owner: string) => IAutoMovieSemanticMask = (owner: string): IAutoMovieSemanticMask => ({
    version: 2,
    protocol: "automovie.semantic-mask.v2",
    background: "#000000",
    entries: [
      {
        id: "a",
        kind: "node",
        label: null,
        color: "#ABCDEF",
        owner,
        nodes: [],
        slot: null,
      },
    ],
    unaddressed: [],
    digest: `sha256:${"0".repeat(64)}`,
  });

  /** A hand-built mask whose two entries own one another. */
  const cyclic: () => IAutoMovieSemanticMask = (): IAutoMovieSemanticMask => {
    const mask: IAutoMovieSemanticMask = broken("b");
    mask.entries.push({
      id: "b",
      kind: "node",
      label: null,
      color: "#FEDCBA",
      owner: "a",
      nodes: [],
      slot: null,
    });
    return mask;
  };

  return { subject, bulk, broken, cyclic };
};
