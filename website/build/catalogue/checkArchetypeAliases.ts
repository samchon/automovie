import {
  AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";
import assert from "node:assert/strict";

import { ArchetypeRegistry } from "../../src/archetypes/ArchetypeRegistry";
import { GalleryAddress } from "../../src/gallery/GalleryAddress";
import { GalleryArchetype } from "../../src/gallery/package/GalleryArchetype";
import { GalleryCatalogue } from "../../src/gallery/package/GalleryCatalogue";
import { PlaygroundAddress } from "../../src/playground/PlaygroundAddress";
import { PlaygroundObjects } from "../../src/playground/package/PlaygroundObjects";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import { SCENES_PARTNER } from "../../src/scenes/data/SCENES_PARTNER";
import { formatSceneChain } from "../../src/scenes/formatSceneChain";
import { SceneArchetype } from "../../src/scenes/package/SceneArchetype";
import { SceneChainNames } from "../../src/scenes/package/SceneChainNames";

/** A version-two composition encoded by the original lz-string writer. */
const SAVED_LINK: string =
  "#c=N4IgbgpgTgzglgewHYgFwCYA0IYQgEzRwENJ8BaGAYwiQhGwAdoAzBKAW2hjQG0BdbBwCuAF2HEANj1QDsCAEYArCFVEzeoGMOWrRRSbRjkWcAB7io9JlAT5hNKESpXioiABEIYODQYgAazgkQlQQKmIuKGJ-XAIiAHZ-MzQARmwATzQABgA6AA5sAC80LBAM4gB3NABObIBfTC0dFTUiAjhRckliRlEERn9GW3tHZ1d3AGkIDIUEYihCbCCQg17+wew40JAk7BTUcnTytOLT8qq0-OzsUzN41FEoYQhG5t02sJhSAnJGAAtkNYQMM7A5oOMIG5PN5fMCVjsAUChgtIjJQJU4PhRP8crlsgljv8IHAAOb-fSoPKpACsxxxvgCdBgMjy2Wy+UaIAONxOVNyNLOh2OFWqqAALDT6vx6kA";

/** Check the site's saved links, seeded animal samples and restored objects. */
export function checkArchetypeAliases(): void {
  const catalogue = GalleryCatalogue.catalogue();
  const listed = catalogue.groups.flatMap((group) =>
    group.subjects.map((subject) => subject.id),
  );
  assert.equal(listed.length, 389, "the gallery preserves its stable root IDs");
  const factories: string[] = ArchetypeRegistry.factoryIds();
  assert.equal(factories.length, 405);
  assert.equal(new Set(factories).size, 405);
  assert.equal(
    new Set(listed).size,
    listed.length,
    "every displayed producer has exactly one catalogue entry",
  );
  const aliased = new Set(catalogue.aliases?.map((alias) => alias.id) ?? []);
  assert(
    listed.every((id) => !aliased.has(id)),
    "no saved dispatcher is also listed beside its named forms",
  );
  const animals = {
    horse: "createHorse",
    pony: "createPony",
    donkey: "createDonkey",
    mule: "createMule",
    dog: "createDog",
    cat: "createCat",
    ox: "createOx",
    camel: "createCamel",
    deer: "createDeer",
  } as const;
  const devices = [
    ["createDevice", "phone", "createPhone"],
    ["createDevice", "camera", "createCamera"],
    ["createDevice", "remote", "createRemote"],
    ["createDevice", "tablet", "createTablet"],
    ["createDevice", "walkieTalkie", "createRadio"],
    ["createKeyboard", "keyboard", "createDesktopKeyboard"],
    ["createKeyboard", "laptop", "createLaptop"],
  ] as const;
  for (const [legacy, variant, subject] of [
    ...Object.entries(animals).map(
      ([kind, id]) => ["createQuadruped", kind, id] as const,
    ),
    ...devices,
  ]) {
    assert.deepEqual(
      listed.filter((id) => id === subject),
      [subject],
    );
    assert(!listed.includes(legacy));
    assert.equal(typeof GalleryCatalogue.producer(legacy)?.call, "function");
    const request = GalleryAddress.decode(
      `?subject=${legacy}&variant=${variant}&seed=7&affordances=0&move.hinge=63`,
      catalogue,
    );
    assert.deepEqual(request, {
      subject,
      variant: "",
      seed: 7,
      state: { hinge: 63 },
      affordances: false,
    });
    assert.equal(
      new URLSearchParams(GalleryAddress.encode(request)).get("subject"),
      subject,
    );
  }
  assert.equal(
    GalleryAddress.decode("?subject=createQuadruped", catalogue).subject,
    "createHorse",
  );
  assert.equal(
    GalleryAddress.decode("?subject=createDoor&variant=hinged", catalogue)
      .variant,
    "hinged",
  );
  assert(
    Object.is(
      GalleryCatalogue.producer("createQuadruped")?.call,
      createQuadruped,
    ),
  );

  for (const legacy of [
    "createInstrument",
    "createGoal",
    "createStick",
    "createClub",
    "createBall",
    "createTool",
    "createLongTool",
    "createCareItem",
    "createStationery",
    "createWearable",
    "createSmoking",
    "createAppliance",
    "createMachine",
    "createSanitary",
    "createStreetFixture",
    "createObstacle",
    "createMobilityAid",
    "createBed",
    "createStorage",
    "createVessel",
    "createTray",
    "createLight",
    "createScenicContainer",
    "createCart",
    "createBoat",
    "createStageWeaponProp",
    "createStageBladeProp",
    "createBow",
    "createHolster",
    "createProjectile",
    "createArmour",
  ]) {
    const alias = catalogue.aliases?.find((item) => item.id === legacy);
    assert(alias, `${legacy} has a gallery alias`);
    assert(
      !listed.includes(legacy),
      `${legacy} is represented by its named forms`,
    );
    assert.deepEqual(
      alias.variants.map((item) => item.id),
      GalleryCatalogue.variants(GalleryCatalogue.producer(legacy)!).list,
    );
    for (const replacement of alias.variants) {
      const request = GalleryAddress.decode(
        `?subject=${legacy}&variant=${replacement.id}&seed=7&affordances=0`,
        catalogue,
      );
      assert.equal(request.subject, replacement.subject);
      assert.equal(request.variant, replacement.variant);
      assert.equal(request.seed, 7);
      assert.equal(request.affordances, false);
      const original = GalleryArchetype.build({
        ...request,
        subject: legacy,
        variant: replacement.id,
      }).archetype;
      const named = GalleryArchetype.build(request).archetype;
      const label = `${legacy}/${replacement.id}`;
      if (legacy === "createScenicContainer" && replacement.id === "cargoPod") {
        const { affordances, ...model } = named;
        const { affordances: originalContacts, ...originalModel } = original;
        assert.deepEqual(model, originalModel, `${label} retains its geometry`);
        assert.deepEqual(
          affordances.map((contact) => contact.id),
          ["top", "mount"],
        );
        assert.deepEqual(affordances[0], originalContacts[0]);
      } else assert.deepEqual(named, original, `${label} retains its geometry`);
      assert.deepEqual(
        named.dimensions,
        original.dimensions,
        `${label} seeded dimensions`,
      );
    }
  }

  for (const [legacy, kind, subject, variant] of [
    ["createClub", "bat", "createBaseballBat", ""],
    ["createGoal", "iceHockeyGoal", "createFieldGoal", "iceHockeyGoal"],
    ["createBall", "americanFootball", "createOvalBall", "americanFootball"],
    ["createStationery", "paper", "createPaper", "sheet"],
    ["createStationery", "map", "createPaper", "foldedMap"],
  ] as const) {
    const oldRequest = {
      subject: legacy,
      variant: kind,
      seed: 7,
      state: {},
      affordances: true,
    };
    const request = GalleryAddress.decode(
      GalleryAddress.encode(oldRequest),
      catalogue,
    );
    assert.deepEqual(request, { ...oldRequest, subject, variant });
    assert.deepEqual(
      GalleryArchetype.build(request).archetype,
      GalleryArchetype.build(oldRequest).archetype,
      `${legacy}/${kind} retains its displayed geometry`,
    );
  }
  assert(
    catalogue.groups
      .find((group) => group.name === "sport")!
      .subjects.some((subject) => subject.id === "createBaseballBat"),
  );
  const paper = {
    subject: "map",
    producer: "createPaper",
    kind: "foldedMap",
    seed: 7,
    x: 0,
    z: 0,
    yaw: 0,
  };
  assert.deepEqual(
    SceneArchetype.model(paper),
    SceneArchetype.model({
      ...paper,
      producer: "createStationery",
      kind: "map",
    }),
  );
  const mapScene: IPlaygroundComposition = {
    version: 3,
    seed: "map",
    performers: [],
    mutuals: [],
    objects: [paper],
  };
  assert.match(
    formatSceneChain(mapScene, SceneChainNames.read(mapScene)),
    /archetypes\.createPaper\(\{\s*format:\s*"foldedMap"/,
    "the emitted scene uses the producer's actual format parameter",
  );
  const cavalry: IPlaygroundComposition = SCENES_PARTNER.find(
    ({ id }) => id === "cavalry-charge",
  )!.composition!;
  const mountedCode: string = formatSceneChain(
    cavalry,
    SceneChainNames.read(cavalry),
  );
  assert.match(mountedCode, /const h0Ride = archetypes\.rideQuadruped\(h0,/);
  assert.match(mountedCode, /cues\["h0:gaits"\] = h0Gaits/);
  assert.match(mountedCode, /^  cues,$/m);
  const fitted = GalleryArchetype.build(
    GalleryAddress.decode(
      "?subject=createStageFittedCarrier&seed=7",
      catalogue,
    ),
  ).archetype;
  assert(fitted.affordance("mouth"));
  assert(fitted.affordance("seated"));

  for (const [kind, gait, speed] of [
    ["horse", "trot", 3.5],
    ["dog", "walk", 0.75],
  ] as const) {
    const request = {
      subject: "createQuadruped",
      variant: kind,
      seed: 7,
      state: {},
      affordances: true,
    };
    const legacy = GalleryArchetype.build(request).archetype;
    const named = GalleryArchetype.build(
      GalleryAddress.decode(GalleryAddress.encode(request), catalogue),
    ).archetype;
    assert.deepEqual(
      named.dimensions,
      legacy.dimensions,
      `${kind} seeded dimensions`,
    );
    assert.deepEqual(
      named.affordances,
      legacy.affordances,
      `${kind} rest contacts`,
    );
    assert(legacy.body !== null && named.body !== null);
    const course: rideQuadruped.ICourse = {
      start: { x: 0, z: 0, heading: 0 },
      legs: [{ kind: "straight", length: 9 }],
      cruise: speed,
      startSpeed: speed,
      endSpeed: speed,
    };
    const oldRide = rideQuadruped(legacy as AutoMovieArchetype, course, gait);
    const newRide = rideQuadruped(named as AutoMovieArchetype, course, gait);
    assert.deepEqual(newRide.instants, oldRide.instants, `${kind} gait events`);
    const landings = newRide.instants.filter(
      (event) => event.label === "leftForeOn" && event.seconds > 0,
    );
    const landing = landings[0]!.seconds;
    const sample = newRide.at(landing);
    assert.deepEqual(
      sample.archetype.parts,
      oldRide.at(landing).archetype.parts,
      `${kind} posed rig at a forefoot landing`,
    );
    assert(
      Math.abs(
        terminalSole(
          sample.archetype.parts.find((part) => part.id === "leftForePastern")!,
          sample.placement,
        ),
      ) <= 0.001,
      `${kind} forefoot reaches the ground at landing`,
    );
    if (kind === "dog") {
      // Seed 7 gives this tempo. Light et al. 2010 Table 1
      // supplies the pooled mean and standard deviation in seconds.
      const expected = 1.11 + 0.7686978130595332 * 0.13;
      assert(
        Math.abs(landings[1]!.seconds - landing - expected) <= 1e-9,
        "the seeded dog's actual stride uses its recorded tempo",
      );
    }
  }

  const dog = GalleryAddress.decode(
    "?subject=createQuadruped&variant=dog&seed=7",
    catalogue,
  );
  const collared = {
    mass: 22,
    collar: {
      width: 0.02,
      thickness: 0.003,
      leadLength: 0.6,
      leadRadius: 0.004,
    },
  };
  const oldLead = GalleryCatalogue.producer("createQuadruped")!.call(
    { ...collared, kind: "dog" },
    dog.seed ?? undefined,
  ).affordance("lead");
  const newLead = GalleryCatalogue.producer(dog.subject)!.call(
    collared,
    dog.seed ?? undefined,
  ).affordance("lead");
  assert.deepEqual(newLead, oldLead, "the named dog's lead retains its frame");

  const restored = PlaygroundAddress.decode(SAVED_LINK)!;
  assert.equal(restored.version, 2);
  assert.deepEqual(
    restored.objects?.map((object) => object.seed),
    [7, 7, undefined],
  );
  assert.deepEqual(
    PlaygroundAddress.decode(PlaygroundAddress.encode(restored)),
    restored,
  );
  const savedObjects = restored.objects!;
  const names = ["createCamera", "createLaptop", "createPhone"] as const;
  const canonical: IPlaygroundComposition = {
    ...restored,
    version: 3,
    objects: savedObjects.map((object, index) => ({
      ...object,
      producer: names[index]!,
      kind: undefined,
    })),
  };
  const namedObjects = PlaygroundAddress.decode(
    PlaygroundAddress.encode(canonical),
  )!.objects!;
  const placed = PlaygroundObjects.props(savedObjects, restored.performers)!;
  const namedPlaced = PlaygroundObjects.props(
    namedObjects,
    restored.performers,
  )!;
  assert.deepEqual(
    placed.map((prop) => prop.subject),
    ["lens-fixture", "edit-laptop", "saved-phone"],
  );
  assert.deepEqual(placed[0]!.frame.position, { x: 1, y: 0.8, z: 2 });
  assert(Math.abs(placed[0]!.frame.rotation.y - Math.SQRT1_2) <= 1e-9);
  assert(Math.abs(placed[0]!.frame.rotation.w - Math.SQRT1_2) <= 1e-9);
  assert.equal(placed[1]!.fixed, true);
  assert.deepEqual(placed[1]!.frame.position, { x: -1, y: 1, z: 1 });
  assert(Math.abs(placed[1]!.frame.rotation.y - 1) <= 1e-9);
  assert(Math.abs(placed[1]!.frame.rotation.w) <= 1e-9);
  const phone = SceneArchetype.model(savedObjects[2]!);
  assert(phone instanceof AutoMovieArchetype);
  assert.equal(phone.dimensions.width, 0.071);
  assert.equal(phone.dimensions.height, 0.151);
  assert.equal(phone.dimensions.thickness, 0.008);
  for (const [index, contact] of ["support", "homeRow", "screen"].entries()) {
    const oldProp = placed[index]!;
    const newProp = namedPlaced[index]!;
    assert.equal(newProp.subject, oldProp.subject);
    assert.deepEqual(newProp.frame, oldProp.frame);
    assert(oldProp.points[contact] !== undefined);
    assert.deepEqual(newProp.points[contact], oldProp.points[contact]);
    assert.deepEqual(
      SceneArchetype.model(namedObjects[index]!),
      SceneArchetype.model(savedObjects[index]!),
    );
  }
}

/** Lowest world point of the complete terminal rod, including its radius. */
function terminalSole(
  part: IAutoMovieModelPart,
  frame: IAutoMovieTransform,
): number {
  assert(part.transform && part.geometry.type === "primitive");
  const shape = part.geometry.shape;
  assert(shape.type === "capsule" || shape.type === "cylinder");
  const axis = Quaternion.rotateVector(
    Quaternion.multiply(frame.rotation, part.transform.rotation),
    { x: 0, y: 1, z: 0 },
  );
  return (
    AutoMovieArchetypeFrame.point(frame, part.transform.translation).y -
    (Math.abs(axis.y) * shape.height) / 2 -
    shape.radius * (shape.type === "capsule" ? 1 : Math.hypot(axis.x, axis.z))
  );
}
