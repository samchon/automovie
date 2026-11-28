import {
  AutoMovieArchetypeCamera,
  AutoMovieArchetypeDevice,
  AutoMovieArchetypePhone,
  AutoMovieArchetypeRadio,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeRemote,
  AutoMovieArchetypeTablet,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

/**
 * Saved handheld recipes replay the named producers' geometry and retain saved
 * model defaults.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers default and explicit legacy settings for all five kinds, ignored saved model fields and strict direct authoring of band-sized devices.
 * @evidence contracts/development/testing.md#behavioral-verification Compares serialized geometry and IDs from the saved and named routes at absent and numeric seeds. Submits an unused saved model and observes the unchanged result. Calls both named factories with that model and checks structured refusals.
 * @evidence contracts/development/testing.md#independent-expectations The v0.4.3 saved envelope uses `kind` for identity, catalogue `model` on three kinds and finite dimensions for phone and remote. Its wider records can carry an unused model field. The band-sized named factories have an empty model choice set.
 */
export function test_archetypes_props_device_saved_routes(): void {
  const phone = { id: "phone-use", width: 0.0642 };
  const remote = { id: "remote-use", height: 0.142, mass: 0.085 };
  const camera = { id: "camera-use", model: "x100vi" } as const;
  const tablet = { id: "tablet-use", model: "cellular" } as const;
  const radio = { id: "radio-use", model: "liIon1600" } as const;
  const rows: ReadonlyArray<
    readonly [
      AutoMovieArchetypeDevice.IParams,
      (
        explicit: boolean,
        seed?: number,
      ) => ReturnType<typeof AutoMovieArchetypeDevice.create>,
    ]
  > = [
    [
      { kind: "phone", ...phone },
      (explicit, seed) =>
        AutoMovieArchetypePhone.create(explicit ? phone : {}, seed),
    ],
    [
      { kind: "remote", ...remote },
      (explicit, seed) =>
        AutoMovieArchetypeRemote.create(explicit ? remote : {}, seed),
    ],
    [
      { kind: "camera", ...camera },
      (explicit, seed) =>
        AutoMovieArchetypeCamera.create(explicit ? camera : {}, seed),
    ],
    [
      { kind: "tablet", ...tablet },
      (explicit, seed) =>
        AutoMovieArchetypeTablet.create(explicit ? tablet : {}, seed),
    ],
    [
      { kind: "walkieTalkie", ...radio },
      (explicit, seed) =>
        AutoMovieArchetypeRadio.create(explicit ? radio : {}, seed),
    ],
  ];
  for (const [params, named] of rows)
    for (const seed of [undefined, 31])
      for (const explicit of [false, true]) {
        const saved = AutoMovieArchetypeDevice.create(
          explicit ? params : { kind: params.kind },
          seed,
        );
        TestValidator.equals(
          `same saved and named ${params.kind} model`,
          JSON.stringify(saved),
          JSON.stringify(named(explicit, seed)),
        );
        TestValidator.equals(
          `retained ${params.kind} model ID`,
          saved.id,
          explicit ? params.id : "device",
        );
      }
  for (const [kind, named] of [
    ["phone", AutoMovieArchetypePhone.create],
    ["remote", AutoMovieArchetypeRemote.create],
  ] as const) {
    TestValidator.equals(
      `saved ${kind} records keep their original replay`,
      JSON.stringify(
        AutoMovieArchetypeDevice.create({ kind, model: "grIII" }, 31),
      ),
      JSON.stringify(AutoMovieArchetypeDevice.create({ kind }, 31)),
    );
    assert.throws(
      () => named({ model: "grIII" as never }, 31),
      (error: unknown): boolean =>
        error instanceof AutoMovieArchetypeRefusal &&
        error.kind === "parameter" &&
        error.archetype === "device" &&
        error.axis === "model" &&
        error.value === "grIII" &&
        error.feasible?.kind === "alternatives" &&
        error.feasible.values.length === 0,
    );
  }
}
