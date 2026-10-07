import { autoMovieModelColumns } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFormationOverlapScenario } from "./IFormationOverlapScenario";
import { namedFacts, nclose } from "./predicates";

/** Existing primitive and bone-chain column assertions on the caller's original post. */
export const assertFormationModelColumns = (
  wide: IAutoMovieModel,
  scenario: IFormationOverlapScenario,
): void => {
  const { at, bone } = scenario;
  const shapes: IAutoMovieModel = {
    ...wide,
    id: "shapes",
    parts: [
      { type: "sphere" as const, radius: 0.5 },
      { type: "capsule" as const, radius: 0.3, height: 2 },
      { type: "cylinder" as const, radius: 0.2, height: 4 },
      { type: "cone" as const, radius: 0.8, height: 4 },
      { type: "box" as const, width: 3, height: 6, depth: 1 },
      { type: "plane" as const, width: 3, depth: 3 },
      { type: "sphere" as const, radius: Number.POSITIVE_INFINITY },
      { type: "box" as const, width: 1, height: 0, depth: 1 },
    ].map((shape, index) => ({
      id: `part-${index}`,
      name: null,
      geometry: { type: "primitive" as const, shape },
      material: null,
      attachedBone: null,
      transform: null,
    })),
  };
  shapes.parts.push({
    id: "imported",
    name: null,
    geometry: {
      type: "mesh",
      mesh: {
        positions: [],
        normals: null,
        uvs: null,
        indices: null,
        skin: null,
      },
    },
    material: null,
    attachedBone: null,
    transform: null,
  });
  const measured = autoMovieModelColumns(shapes);
  TestValidator.equals(
    "every primitive states the disc inside it and nothing states one it has not got",
    namedFacts([
      // Sphere, capsule, cylinder, cone and box; the plane, the mesh, the
      // infinite radius and the flattened box hold no column at all.
      ["five", () => measured.length === 5],
      [
        "sphere",
        () =>
          nclose(measured[0]!.radius, 0.5) &&
          nclose(measured[0]!.bottom, -0.5) &&
          nclose(measured[0]!.top, 0.5),
      ],
      // A capsule's caps taper, so only the shaft between them is certainly
      // inside the disc its radius states.
      [
        "capsule",
        () =>
          nclose(measured[1]!.radius, 0.3) &&
          nclose(measured[1]!.bottom, -1) &&
          nclose(measured[1]!.top, 1),
      ],
      [
        "cylinder",
        () =>
          nclose(measured[2]!.radius, 0.2) &&
          nclose(measured[2]!.bottom, -2) &&
          nclose(measured[2]!.top, 2),
      ],
      // A cone is wide at the top and a point at the bottom, so the disc of
      // half its base radius is filled through its upper half and nowhere else.
      [
        "cone",
        () =>
          nclose(measured[3]!.radius, 0.4) &&
          nclose(measured[3]!.bottom, 0) &&
          nclose(measured[3]!.top, 2),
      ],
      // A box turned to any heading still holds the disc of its narrower side.
      [
        "box",
        () =>
          nclose(measured[4]!.radius, 0.5) &&
          nclose(measured[4]!.bottom, -3) &&
          nclose(measured[4]!.top, 3),
      ],
    ]),
    {
      five: true,
      sphere: true,
      capsule: true,
      cylinder: true,
      cone: true,
      box: true,
    },
  );

  // A chain listed child before parent, one bone off the axis carrying another
  // that is on it, and four parts: one on the root, one up the chain, one on
  // the off-axis branch, and one riding nothing at all.
  const rigged: IAutoMovieModel = {
    ...wide,
    id: "rigged",
    skeleton: {
      id: "rig",
      bones: [
        bone("head", "spine", at(0, 0.4, 0)),
        bone("spine", "hips", at(0, 0.6, 0)),
        bone("hips", null, at(0, 1, 0)),
        bone("leftUpperArm", "spine", at(0.3, 0, 0)),
        bone("leftLowerArm", "leftUpperArm", at(0, -0.2, 0)),
        // On the axis in translation and turned off the vertical in rotation,
        // so the column of anything riding it is no longer vertical either.
        bone("neck", "spine", {
          ...at(0, 0.2, 0),
          rotation: { x: 0.7071, y: 0, z: 0, w: 0.7071 },
        }),
      ],
    },
    parts: [
      {
        id: "pelvis",
        name: null,
        geometry: {
          type: "primitive",
          shape: { type: "box", width: 0.4, height: 0.2, depth: 0.3 },
        },
        material: null,
        attachedBone: "hips",
        transform: at(0, 0, 0),
      },
      {
        id: "crown",
        name: null,
        geometry: { type: "primitive", shape: { type: "sphere", radius: 0.1 } },
        material: null,
        attachedBone: "head",
        transform: null,
      },
      {
        id: "forearm",
        name: null,
        geometry: {
          type: "primitive",
          shape: { type: "capsule", radius: 0.05, height: 0.3 },
        },
        material: null,
        attachedBone: "leftLowerArm",
        transform: null,
      },
      {
        id: "aside",
        name: null,
        geometry: { type: "primitive", shape: { type: "sphere", radius: 0.2 } },
        material: null,
        attachedBone: null,
        transform: at(0.5, 0, 0),
      },
      {
        id: "behind",
        name: null,
        geometry: { type: "primitive", shape: { type: "sphere", radius: 0.2 } },
        material: null,
        attachedBone: null,
        transform: at(0, 0, 0.5),
      },
      {
        id: "tipped",
        name: null,
        geometry: { type: "primitive", shape: { type: "sphere", radius: 0.2 } },
        material: null,
        attachedBone: null,
        transform: {
          ...at(0, 0, 0),
          rotation: { x: 0.7071, y: 0, z: 0, w: 0.7071 },
        },
      },
      {
        id: "rolled",
        name: null,
        geometry: { type: "primitive", shape: { type: "sphere", radius: 0.2 } },
        material: null,
        attachedBone: null,
        transform: {
          ...at(0, 0, 0),
          rotation: { x: 0, y: 0, z: 0.7071, w: 0.7071 },
        },
      },
      {
        id: "shrunk",
        name: null,
        geometry: {
          type: "primitive",
          shape: { type: "box", width: 2, height: 2, depth: 1 },
        },
        material: null,
        attachedBone: null,
        transform: { ...at(0, 1, 0), scale: { x: 3, y: -2, z: 4 } },
      },
      {
        id: "erased",
        name: null,
        geometry: { type: "primitive", shape: { type: "sphere", radius: 0.2 } },
        material: null,
        attachedBone: null,
        transform: { ...at(0, 0, 0), scale: { x: 0, y: 1, z: 1 } },
      },
      // Riding a bone that is itself turned off the vertical. Its own transform
      // is identity and its bone stands on the axis, so only the bone's own
      // rotation can leave it out; the radius is distinct from every measured
      // column so its absence is readable rather than merely a count.
      {
        id: "collar",
        name: null,
        geometry: {
          type: "primitive",
          shape: { type: "sphere", radius: 0.33 },
        },
        material: null,
        attachedBone: "neck",
        transform: null,
      },
    ],
  };
  const chained = autoMovieModelColumns(rigged);
  TestValidator.equals(
    "a part is measured up its own chain, and left out wherever that chain leaves the axis",
    namedFacts([
      // The pelvis, the crown and the scaled box. The forearm rides a branch
      // that left the axis, and the four beside it are displaced or tipped off
      // it themselves; the last is scaled to nothing across.
      ["three", () => chained.length === 3],
      [
        "pelvis",
        () =>
          nclose(chained[0]!.radius, 0.15) &&
          nclose(chained[0]!.bottom, 0.9) &&
          nclose(chained[0]!.top, 1.1),
      ],
      // Hips one metre up, spine six tenths above it, head four tenths above
      // that: two metres, whatever order the bones were listed in.
      [
        "crown",
        () =>
          nclose(chained[1]!.radius, 0.1) &&
          nclose(chained[1]!.bottom, 1.9) &&
          nclose(chained[1]!.top, 2.1),
      ],
      // A box 2 m across and 1 m deep, scaled by 3 and 4, is 6 m across and 4 m
      // deep, and the disc inside it is half the narrower of those. Mirrored
      // vertically it fills exactly what its unmirrored twin did, one metre up.
      [
        "scaled",
        () =>
          nclose(chained[2]!.radius, 2) &&
          nclose(chained[2]!.bottom, -1) &&
          nclose(chained[2]!.top, 3),
      ],
      // The collar rides a bone that stands on the axis and is turned off the
      // vertical, so its column is not vertical and is not measured. Its radius
      // is unique among the parts, so its absence is a fact about that part
      // rather than a count that happens to agree.
      [
        "theTurnedBoneCarriesNothing",
        () => chained.every((column) => nclose(column.radius, 0.33) === false),
      ],
    ]),
    {
      three: true,
      pelvis: true,
      crown: true,
      scaled: true,
      theTurnedBoneCarriesNothing: true,
    },
  );
};
