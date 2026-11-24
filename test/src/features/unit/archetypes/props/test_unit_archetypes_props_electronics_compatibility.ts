import {
  type AutoMovieArchetype,
  AutoMovieArchetypeRefusal,
  createCamera,
  createDesktopKeyboard,
  createDevice,
  createKeyboard,
  createLaptop,
  createPhone,
  createRadio,
  createRemote,
  createTablet,
} from "@automovie/archetypes";
import * as props from "@automovie/archetypes/props";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/**
 * The named devices preserve the saved device frames and expose actual contact
 * IDs.
 *
 * Scenarios:
 *
 * 1. Compare each saved recipe and its named producer at seeds 0 and 1045.
 * 2. Check known case sizes and anchored camera and typing contacts.
 * 3. Keep the saved recipe's missing kind refusal and the root and props imports
 *    aligned.
 */
export function test_unit_archetypes_props_electronics_compatibility(): void {
  const candidates = [
    [
      "phone",
      createPhone,
      props.createPhone,
      ["grip", "pinch", "screen", "lens"],
    ],
    [
      "camera",
      createCamera,
      props.createCamera,
      ["grip", "support", "lens", "screen", "button"],
    ],
    ["remote", createRemote, props.createRemote, ["grip", "pinch", "button"]],
    ["tablet", createTablet, props.createTablet, ["grip", "screen"]],
    ["walkieTalkie", createRadio, props.createRadio, ["grip", "speaker"]],
    [
      "keyboard",
      createDesktopKeyboard,
      props.createDesktopKeyboard,
      ["keys", "homeRow"],
    ],
    [
      "laptop",
      createLaptop,
      props.createLaptop,
      ["keys", "homeRow", "screen", "lid"],
    ],
  ] as const;
  for (const [kind, produce, byFamily, contacts] of candidates) {
    TestValidator.predicate(
      `${kind} is the same export from both entry points`,
      produce === byFamily,
    );
    for (const seed of [0, 1045]) {
      const named: AutoMovieArchetype<string, string> = produce({}, seed);
      const saved: AutoMovieArchetype<string, string> =
        kind === "keyboard" || kind === "laptop"
          ? createKeyboard({ kind }, seed)
          : createDevice({ kind }, seed);
      TestValidator.equals(
        `${kind} contact IDs`,
        named.affordances.map((contact) => contact.id),
        [...contacts],
      );
      TestValidator.equals(`${kind} model identifier`, named.id, saved.id);
      TestValidator.predicate(
        `${kind} mass and dimensions`,
        nclose(named.body.mass, saved.body.mass) &&
          Object.entries(saved.dimensions).every(([key, value]) =>
            nclose(named.dimensions[key]!, value!),
          ),
      );
      TestValidator.equals(
        `${kind} part IDs`,
        named.parts.map((part) => part.id),
        saved.parts.map((part) => part.id),
      );
      for (const contact of named.affordances) {
        const before = saved.affordance(contact.id);
        TestValidator.predicate(
          `${kind} ${contact.id} frame`,
          vclose(contact.frame.translation, before.frame.translation) &&
            qclose(contact.frame.rotation, before.frame.rotation),
        );
      }
    }
  }

  // Seed zero in the saved producers at 7a3c5cdec. One free draw and one
  // whole model distinguish changes that affect both public entry points.
  const seededPhone: ReturnType<typeof createPhone> = createPhone({}, 0);
  TestValidator.predicate(
    "saved free-size phone draw",
    nclose(seededPhone.dimensions.width!, 0.07755750626545552) &&
      nclose(seededPhone.dimensions.height!, 0.15706403905975416) &&
      nclose(seededPhone.dimensions.thickness!, 0.006340721870906142) &&
      nclose(seededPhone.body.mass, 0.22172231102),
  );
  const seededCamera: ReturnType<typeof createCamera> = createCamera({}, 0);
  TestValidator.predicate(
    "saved whole X100VI profile",
    nclose(seededCamera.dimensions.width!, 0.128) &&
      nclose(seededCamera.dimensions.height!, 0.0748) &&
      nclose(seededCamera.dimensions.thickness!, 0.0553) &&
      nclose(seededCamera.body.mass, 0.471),
  );

  const camera: ReturnType<typeof createCamera> = createCamera({
    model: "grIII",
  });
  TestValidator.predicate(
    "Ricoh GR III case and far underside support",
    nclose(camera.body.mass, 0.257) &&
      nclose(camera.dimensions.width!, 0.1094) &&
      nclose(
        camera.affordance("grip").frame.translation.x,
        (0.0332 - 0.1094) / 2,
      ) &&
      vclose(camera.affordance("support").frame.translation, {
        x: 0.1094 / 2,
        y: 0.0619 / 2,
        z: 0.0332 / 4,
      }),
  );

  const laptop: ReturnType<typeof createLaptop> = createLaptop({
    model: "air15",
  });
  TestValidator.predicate(
    "MacBook Air 15 base and home row",
    nclose(laptop.dimensions.width!, 0.3404) &&
      nclose(
        laptop.affordance("homeRow").frame.translation.y,
        0.0115 - 0.006,
      ) &&
      nclose(
        laptop.affordance("homeRow").frame.translation.z,
        0.2376 / 2 - 0.01 - 2.5 * 0.01905,
      ),
  );

  for (const legacy of [
    () => createDevice({} as createDevice.IParams),
    () => createKeyboard({} as createKeyboard.IParams),
  ]) {
    let refused: boolean = false;
    try {
      legacy();
    } catch (error) {
      refused = error instanceof AutoMovieArchetypeRefusal;
    }
    TestValidator.predicate("a stored recipe requires its kind", refused);
  }
}
