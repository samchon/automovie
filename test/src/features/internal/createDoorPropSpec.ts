import {
  IAutoMovieNode,
  IAutoMoviePropSpec,
  IAutoMovieTransform,
} from "@automovie/interface";

const IDENTITY: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

function jointNode(id: string, parent: string | null = null): IAutoMovieNode {
  return {
    id,
    name: null,
    parent,
    kind: "group",
    transform: IDENTITY,
    mesh: null,
    camera: null,
    light: null,
    skin: null,
  };
}
const SIN55: number = Math.sin((55 * Math.PI) / 180);
const COS55: number = Math.cos((55 * Math.PI) / 180);

/** A fully-loaded door prop: body + stack-top affordance + hinge articulation. */
export function createDoorPropSpec(): IAutoMoviePropSpec {
  return {
    node: "door",
    model: {
      id: "door",
      name: "door",
      origin: "generated",
      skeleton: null,
      body: { mass: 25, centerOfMass: null, friction: 0.4, restitution: 0.1 },
      affordances: [
        {
          id: "top",
          kind: "stack-top",
          frame: { ...IDENTITY, translation: { x: 0, y: 2, z: 0 } },
          extent: [
            { x: -0.4, y: 0, z: -0.02 },
            { x: 0.4, y: 0, z: -0.02 },
            { x: 0.4, y: 0, z: 0.02 },
            { x: -0.4, y: 0, z: 0.02 },
          ],
        },
      ],
      materials: [],
      parts: [
        {
          id: "panel",
          name: null,
          geometry: {
            type: "primitive",
            shape: { type: "box", width: 0.8, height: 2, depth: 0.04 },
          },
          material: null,
          attachedBone: null,
          transform: null,
        },
      ],
      asset: null,
    },
    articulation: {
      nodes: [
        jointNode("root"),
        jointNode("hinge", "root"),
        jointNode("handleMirror", "root"),
      ],
      profile: {
        id: "door-profile",
        name: "hinge",
        drivers: [
          {
            type: "copy",
            owner: "mirror",
            source: "pivot",
            translation: false,
            rotation: true,
            scale: false,
            influence: 1,
          },
        ],
        limits: [
          {
            channel: { kind: "node", node: "pivot", path: "rotation" },
            min: [0, 0, 0, COS55],
            max: [0, SIN55, 0, 1],
          },
        ],
      },
      binding: {
        profile: "door-profile",
        boneMap: { pivot: "hinge", mirror: "handleMirror" },
      },
    },
  };
}
