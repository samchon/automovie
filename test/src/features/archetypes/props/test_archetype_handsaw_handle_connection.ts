import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeHammer,
  AutoMovieArchetypeHandSaw,
  AutoMovieArchetypeLadle,
  AutoMovieArchetypeScrewdriver,
  AutoMovieArchetypeTool,
} from "@automovie/archetypes";
import {
  AutoMovieEnginePhysics,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";

/**
 * The hand saw's heel joins the transverse grip to the blade across its bands.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two physical joints, retained contact frames and sampled size bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the built colliders at the default, a historic seed and all eight length, blade and diameter corners, and checks the neighboring hand tools.
 * @evidence contracts/development/testing.md#independent-expectations Uses signed overlap with both original parts, orthogonality to the tooth center and the original handle and blade extents as measurable expectations.
 */
export function test_archetype_handsaw_handle_connection(): void {
  type Params = NonNullable<
    Parameters<typeof AutoMovieArchetypeHandSaw.create>[0]
  >;
  const cases: { params: Params; seed?: number }[] = [
    { params: {} },
    { params: {}, seed: 31 },
  ];
  for (const length of [0.61, 0.62])
    for (const blade of [0.5, 0.55])
      for (const gripDiameter of [0.03, 0.04])
        cases.push({ params: { length, blade, gripDiameter } });

  const identity: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const gap = (
    left: IAutoMoviePhysicalShape,
    right: IAutoMoviePhysicalShape,
  ): number =>
    AutoMovieEnginePhysics.physicalShapePairDistance(
      identity,
      left,
      identity,
      right,
    );
  const near = (label: string, actual: number, expected: number): void =>
    TestValidator.predicate(label, Math.abs(actual - expected) < 1e-9);
  const vector = AutoMovieEngineVector3.create;

  for (const { params, seed } of cases) {
    const saw = AutoMovieArchetypeHandSaw.create(params, seed);
    const saved = AutoMovieArchetypeTool.create(
      { kind: "saw", ...params },
      seed,
    );
    TestValidator.equals(
      "saved tool uses the same joined parts",
      saw.parts,
      saved.parts,
    );

    const shapes = saw.shapes();
    const shape = (id: string): IAutoMoviePhysicalShape => {
      const physical = shapes.find((candidate) => candidate.id === id);
      if (physical === undefined) throw new Error("Missing saw collider " + id);
      return physical;
    };
    const handle = shape("handle");
    const blade = shape("blade");
    for (const id of ["heelFront", "heelBack"]) {
      const heel = shape(id);
      TestValidator.predicate(
        id + " overlaps the handle",
        -gap(heel, handle) > 0.0001,
      );
      TestValidator.predicate(
        id + " overlaps the blade root",
        -gap(heel, blade) > 0.0001,
      );
    }

    const grip = saw.affordance("grip");
    const tooth = saw.affordance("face");
    const length = saw.dimensions.length!;
    const bladeLength = saw.dimensions.blade!;
    near(
      "power grip faces sideways",
      AutoMovieEngineVector3.distance(
        AutoMovieArchetypeFrame.axis(grip.frame, "y"),
        vector(1, 0, 0),
      ),
      0,
    );
    near(
      "tooth faces forward",
      AutoMovieEngineVector3.distance(
        AutoMovieArchetypeFrame.axis(tooth.frame, "y"),
        vector(0, 0, 1),
      ),
      0,
    );
    near(
      "grip stays square to the tooth center",
      AutoMovieEngineVector3.dot(
        AutoMovieArchetypeFrame.axis(grip.frame, "x"),
        AutoMovieEngineVector3.subtract(
          tooth.frame.translation,
          grip.frame.translation,
        ),
      ),
      0,
    );
    near("grip height", grip.frame.translation.y, (length - bladeLength) / 2);
    near("grip aperture", grip.aperture!, saw.dimensions.gripDiameter!);
    near("grip length", grip.length!, 0.12);
    near("tooth height", tooth.frame.translation.y, length - bladeLength / 2);
    near("tooth depth", tooth.frame.translation.z, 0.05);
    near("tooth length", tooth.length!, bladeLength);
    near("blade tip height", archetypeExtent(shapes, "y").high, length);

    for (const axis of ["x", "y", "z"] as const) {
      const original = archetypeExtent([handle, blade], axis);
      const joined = archetypeExtent(shapes, axis);
      near(axis + " lower extent stays fixed", joined.low, original.low);
      near(axis + " upper extent stays fixed", joined.high, original.high);
    }
  }

  for (const build of [
    AutoMovieArchetypeHammer.create,
    AutoMovieArchetypeScrewdriver.create,
    AutoMovieArchetypeLadle.create,
  ])
    for (const seed of [undefined, 31]) {
      const [handle, head] = build({}, seed).shapes();
      near("neighboring handle touches its head", gap(handle!, head!), 0);
    }
}
