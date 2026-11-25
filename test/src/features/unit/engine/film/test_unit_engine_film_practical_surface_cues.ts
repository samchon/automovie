import { createDevice } from "@automovie/archetypes";
import {
  performShot,
  samplePracticalSurfaceMaterial,
  stageScene,
} from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMoviePerformShotProps,
  IAutoMoviePerformedShot,
  IAutoMoviePracticalSurfaceTrack,
  IAutoMovieScript,
  IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../../../internal/filmFixtures";

/**
 * A phone prop's material cue has exact timing and applies to one instance.
 *
 * Scenarios:
 *
 * 1. Two staged nodes share a phone model. The selected part changes at the cue.
 * 2. Seeking in either direction gives the same material at each time. The
 *    second phone and any other part have no override.
 * 3. The shot rejects duplicate targets, an unknown model material and an
 *    event at the exclusive end.
 * 4. A later shot can explicitly carry the selected material into its opening.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the two placements, exact edge and reverse seeking, authored refusal cases and the next shot's opening.
 * @evidence contracts/development/testing.md#behavioral-verification Passes two staged instances through the public performShot gate and observes only admitted output and the public sampler. The malformed case checks input diagnostics.
 * @evidence contracts/development/testing.md#independent-expectations The opening and cue materials and expected lookup times are explicit literals. The untouched phone must have no override and must still cite the original model.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a sample just before the cue from the exact cue, seeks backwards, and checks three rejection causes in one compile. The second shot has an explicitly authored opening.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous in-memory shot compilation and data sampling. Does not start a host or assert any pixels.
 */
export function test_unit_engine_film_practical_surface_cues(): void {
  const phone: ReturnType<typeof createDevice> = createDevice({
    id: "shared-phone",
    kind: "phone",
  });
  const part: string = phone.parts[0]!.id;
  const base: IAutoMovieMaterial = phone.materials[0]!;
  const cueMaterial: string = "message-visible";
  const model: IAutoMovieModel = {
    ...phone,
    materials: [
      ...phone.materials,
      { ...base, id: cueMaterial, emissive: base.baseColor },
    ],
  };
  const script: IAutoMovieScript = makeScriptWrite();
  const staged: IAutoMovieStagedSet = stageScene(
    script,
    makeStagingWrite({
      set: [
        { node: "held-phone", model: model.id, position: { x: 1, y: 1, z: 0 } },
        {
          node: "spare-phone",
          model: model.id,
          position: { x: 2, y: 1, z: 0 },
        },
      ],
    }),
  );
  if (!staged.success) throw new Error(JSON.stringify(staged.violations));
  const props: IAutoMoviePerformShotProps = {
    script,
    staged,
    performance: makePerformanceWrite({ duration: 1, draft: [] }),
    synthesize: (): null => null,
    skeleton: (): null => null,
    models: [model],
  };
  const opening: IAutoMoviePracticalSurfaceTrack["keys"][number] = {
    time: 0,
    material: base.id,
  };
  const track: IAutoMoviePracticalSurfaceTrack = {
    node: "held-phone",
    part,
    keys: [opening, { time: 0.4, material: cueMaterial }],
  };
  const first: IAutoMoviePerformedShot = performShot({
    ...props,
    practicalSurfaces: [track],
  });
  if (!first.success) throw new Error(JSON.stringify(first.violations));

  TestValidator.equals(
    "cue takes effect at its exact time",
    samplePracticalSurfaceMaterial(first.shot, track.node, part, 0.4),
    cueMaterial,
  );
  TestValidator.equals(
    "seeking just before the cue restores the opening",
    samplePracticalSurfaceMaterial(first.shot, track.node, part, 0.399),
    base.id,
  );
  TestValidator.equals(
    "seeking forward again restores the cue material",
    samplePracticalSurfaceMaterial(first.shot, track.node, part, 0.9),
    cueMaterial,
  );
  TestValidator.equals(
    "the other placement has no override",
    samplePracticalSurfaceMaterial(first.shot, "spare-phone", part, 0.4),
    undefined,
  );
  TestValidator.equals(
    "another part has no override",
    samplePracticalSurfaceMaterial(first.shot, track.node, "other", 0.4),
    undefined,
  );
  TestValidator.equals(
    "the shared model remains on the base material",
    model.parts[0]!.material,
    base.id,
  );
  TestValidator.equals(
    "the exclusive end has no sample",
    samplePracticalSurfaceMaterial(first.shot, track.node, part, 1),
    undefined,
  );

  const invalid: IAutoMoviePerformedShot = performShot({
    ...props,
    practicalSurfaces: [
      track,
      { ...track, keys: [opening, { time: 1, material: "unknown-material" }] },
    ],
  });
  if (invalid.success)
    throw new Error("malformed practical tracks were admitted");
  TestValidator.equals(
    "all broken cue fields have source paths",
    invalid.violations.map(
      (finding: IAutoMovieConstraintViolation): string => finding.path,
    ),
    [
      "$input.practicalSurfaces[1].part",
      "$input.practicalSurfaces[1].keys[1].time",
      "$input.practicalSurfaces[1].keys[1].material",
    ],
  );

  const following: IAutoMoviePerformedShot = performShot({
    ...props,
    shotId: "following",
    practicalSurfaces: [
      { ...track, keys: [{ time: 0, material: cueMaterial }] },
    ],
  });
  if (!following.success) throw new Error(JSON.stringify(following.violations));
  TestValidator.equals(
    "next shot's authored opening matches the prior cue",
    samplePracticalSurfaceMaterial(following.shot, track.node, part, 0),
    cueMaterial,
  );
}
