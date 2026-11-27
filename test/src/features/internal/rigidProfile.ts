import type { AutoMovieArchetype } from "@automovie/archetypes";
import { AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalMaterial,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalShape,
} from "@automovie/interface";

/** The archetype members the conversion reads. */
type RigidModel = Pick<
  AutoMovieArchetype<string, string>,
  "properties" | "shapes"
>;

/**
 * A one-segment rigid physical profile of an archetype model: its seeded
 * mass, centre of mass and principal inertia, and its collision shapes all
 * bound to one authored contact material.
 *
 * @param model The archetype model.
 * @param id The profile id.
 * @param material The authored contact material every shape uses.
 * @returns The rigid profile, its root segment at the model origin.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is taken from the model and what is authored.
 * @evidence contracts/development/implementation.md#principled-implementation Diagonalizes the model's inertia tensor into principal moments and rotation for the native solver.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One conversion shared by the precision deck tests.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The material is the caller's, stated as authored, never presented as measured.
 * @evidence contracts/development/implementation.md#efficient-algorithms One 3x3 eigen-decomposition and one pass over the shapes.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing is cached.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh profile.
 */
export function rigidProfile(
  model: RigidModel,
  id: string,
  material: IAutoMoviePhysicalMaterial,
): IAutoMoviePhysicalProfile {
  const inertia: RigidModel["properties"]["inertia"] = model.properties.inertia;
  const axes: ReturnType<typeof AutoMovieEnginePhysics.physicalPrincipalAxes> = AutoMovieEnginePhysics.physicalPrincipalAxes([
    [inertia.xx, inertia.xy, inertia.xz],
    [inertia.xy, inertia.yy, inertia.yz],
    [inertia.xz, inertia.yz, inertia.zz],
  ]);
  return {
    id,
    mass: model.properties.mass,
    centerOfMass: model.properties.centerOfMass,
    materials: [material],
    provenance:
      "Seeded archetype geometry and mass, with authored contact material.",
    joints: [],
    segments: [
      {
        bone: "root",
        mass: model.properties.mass,
        neutral: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        centerOfMass: model.properties.centerOfMass,
        inertia: axes.moments,
        inertiaRotation: axes.rotation,
        shapes: model.shapes().map(
          (shape: IAutoMoviePhysicalShape): IAutoMoviePhysicalShape => ({
            ...shape,
            material: material.id,
          }),
        ),
      },
    ],
  };
}
