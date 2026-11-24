import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  createBroom,
  createFishingRod,
  createHammer,
  createLighter,
  createPaper,
  createPen,
  createShovel,
  createSpoon,
  createTissue,
} from "@automovie/archetypes";
import * as root from "@automovie/archetypes";
import * as props from "@automovie/archetypes/props";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";
import { nclose, qclose, vclose } from "../internal/predicates";

/** The identity and paper format a named producer accepts. */
interface INamedParams {
  /** The model's scene id. */
  id?: string;

  /** The paper format, read only by createPaper. */
  format?: createPaper.Format;
}

/** A named producer as the loop calls it. */
type NamedProducer = (
  params: INamedParams,
  seed?: number,
) => AutoMovieArchetype;

/** The saved kind a dispatcher reads, typed per family by the loop's caller. */
interface ISavedParams {
  /** The model's scene id. */
  id?: string;

  /** The saved kind, narrowed by each family's own table. */
  kind: never;
}

/** A saved dispatcher as the loop calls it. */
type SavedDispatcher = (
  params: ISavedParams,
  seed?: number,
) => AutoMovieArchetype;

/**
 * The saved tool and personal-prop recipes checked through both SDK entry
 * points.
 */
const FAMILIES = [
  [
    props.createTool,
    [
      "createHammer",
      "createHandSaw",
      "createScrewdriver",
      "createSpoon",
      "createFork",
      "createLadle",
      "createTableKnife",
      "createStagePrimingWire",
    ],
  ],
  [
    props.createLongTool,
    [
      "createBroom",
      "createMop",
      "createShovel",
      "createForestAxe",
      "createFishingRod",
      "createStageSpongeRammer",
      "createStageWorm",
      "createStageTrailHandspike",
      "createStageSling",
      "createStageAtlatl",
    ],
  ],
  [
    props.createCareItem,
    [
      "createTissue",
      "createComb",
      "createToothbrush",
      "createSqueezeTube",
      "createShavingRazor",
      "createLipstick",
    ],
  ],
  [
    props.createStationery,
    [
      "createBook",
      "createPaper",
      "createPen",
      "createClipboard",
      "createPaper",
    ],
  ],
  [
    props.createWearable,
    ["createWatch", "createHat", "createSpectacles", "createCyclingHelmet"],
  ],
  [props.createSmoking, ["createCigarette", "createLighter"]],
] as const;

/**
 * A named tool or personal prop preserves the saved recipe and places its own
 * contacts.
 *
 * Scenarios:
 *
 * 1. Every saved kind resolves through the same named producer at both public
 *    imports. Compare default, custom ID, zero seed and nonzero seed cases.
 * 2. Recorded pre-split figures pin variable dimensions and model selection.
 * 3. The hammer face and spoon bowl lie on the modeled working surfaces. The broom
 *    and shovel face the floor, the shovel D-grip sits on its crossbar, and the
 *    fishing rod's target is its tip.
 * 4. A loose paper sheet exposes the writing face. A folded map keeps its support
 *    grip and moves its face with its crease.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the named producers, saved inputs and geometric contacts.
 * @evidence contracts/development/testing.md#behavioral-verification Calls both public imports, compares the seed provenance and the displayed frames, and observes the actual physical part extents and folded state.
 * @evidence contracts/development/testing.md#independent-expectations Uses dimensions and model names recorded at 2e593ea before the split. The exposed faces meet the measured proxy parts, and a half-turn about the crease reflects the folded face while leaving its support in place.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers all kinds in the saved order; named defaults, ID overrides, seeded variation, a whole model, differently shaped working ends and paper formats.
 * @evidence contracts/development/testing.md#execution-ownership Runs in memory through the root and props SDK entry points without a renderer.
 */
export function test_archetype_catalogue_tools_personal(): void {
  for (const [family, names] of FAMILIES) {
    TestValidator.predicate(
      `${family.name} kind and producer counts`,
      names.length === family.KINDS.length,
    );
    for (const [index, name] of names.entries()) {
      const kind: string = family.KINDS[index]!;
      const produce: NamedProducer = props[name];
      const legacy: SavedDispatcher = family;
      const format: createPaper.Format | undefined =
        name === "createPaper"
          ? kind === "paper"
            ? "sheet"
            : "foldedMap"
          : undefined;
      TestValidator.predicate(
        `${kind} is the same named export in both SDK entry points`,
        produce === root[name] &&
          Object.entries(family.PRODUCERS).some(
            ([saved, entry]) => kind === saved && entry === produce,
          ),
      );
      for (const [id, seed] of [
        [undefined, undefined],
        ["prop", 0],
        [undefined, 1049],
      ] as const) {
        const named: AutoMovieArchetype = produce({ id, format }, seed);
        const saved: AutoMovieArchetype = legacy(
          { kind: kind as never, id },
          seed,
        );
        TestValidator.predicate(
          `${kind}@${seed} preserves identity, dimensions and mass`,
          named.id === saved.id &&
            named.archetype === saved.archetype &&
            named.name === saved.name &&
            nclose(named.body.mass, saved.body.mass) &&
            Object.entries(saved.dimensions).every(([key, value]) =>
              nclose(named.dimensions[key]!, value!),
            ) &&
            Object.keys(named.dimensions).length ===
              Object.keys(saved.dimensions).length,
        );
        TestValidator.equals(
          `${kind}@${seed} model selection`,
          named.provenance.models,
          saved.provenance.models,
        );
        TestValidator.equals(
          `${kind}@${seed} part IDs`,
          named.parts.map((part) => part.id),
          saved.parts.map((part) => part.id),
        );
        TestValidator.equals(
          `${kind}@${seed} contact IDs`,
          named.affordances.map((contact) => contact.id),
          saved.affordances.map((contact) => contact.id),
        );
        for (const contact of named.affordances) {
          const before: ReturnType<typeof saved.affordance> = saved.affordance(
            contact.id,
          );
          TestValidator.predicate(
            `${kind}@${seed} ${contact.id} frame`,
            vclose(contact.frame.translation, before.frame.translation) &&
              qclose(contact.frame.rotation, before.frame.rotation) &&
              contact.rides === before.rides,
          );
        }
      }
    }
  }

  const hammer: ReturnType<typeof createHammer> = createHammer({}, 0);
  const spoon: ReturnType<typeof createSpoon> = createSpoon({}, 0);
  const broom: ReturnType<typeof createBroom> = createBroom({}, 0);
  const shovel: ReturnType<typeof createShovel> = createShovel({}, 0);
  const rod: ReturnType<typeof createFishingRod> = createFishingRod({}, 0);
  const crossbar: ReturnType<typeof archetypeExtent> = archetypeExtent(
    shovel,
    "y",
    ["grip"],
  );
  TestValidator.predicate(
    "recorded seeded tool sizes, fishing model and working surfaces",
    nclose(hammer.dimensions.gripDiameter!, 0.035121520756181634) &&
      nclose(spoon.dimensions.length!, 0.14885185437605808) &&
      nclose(broom.dimensions.length!, 1.5756151284475435) &&
      nclose(shovel.dimensions.length!, 1.1278451147694275) &&
      rod.provenance.models.model === "NJX902MLFS" &&
      nclose(
        hammer.site("face").translation.z,
        archetypeExtent(hammer, "z", ["head"]).high,
      ) &&
      nclose(
        spoon.site("face").translation.z,
        archetypeExtent(spoon, "z", ["bowl"]).high,
      ) &&
      nclose(
        shovel.site("grip").translation.y,
        (crossbar.low + crossbar.high) / 2,
      ) &&
      nclose(
        rod.site("tip").translation.y,
        archetypeExtent(rod, "y", ["rod"]).high,
      ) &&
      nclose(
        rod.site("grip").translation.y,
        rod.affordance("grip").length! / 2,
      ),
  );
  for (const ground of [broom, shovel]) {
    TestValidator.predicate(
      `${ground.name} face and shaft reach their own parts`,
      nclose(
        ground.site("face").translation.y,
        archetypeExtent(ground, "y", ["head"]).low,
      ) &&
        nclose(
          ground.affordance("shaft").length!,
          archetypeExtent(ground, "y", ["shaft"]).size,
        ) &&
        vclose(AutoMovieArchetypeFrame.axis(ground.site("face"), "y"), {
          x: 0,
          y: -1,
          z: 0,
        }),
    );
  }

  const tissue: ReturnType<typeof createTissue> = createTissue({}, 0);
  const pen: ReturnType<typeof createPen> = createPen({}, 0);
  const lighter: ReturnType<typeof createLighter> = createLighter({}, 0);
  TestValidator.predicate(
    "recorded personal prop stream and the working ends",
    nclose(tissue.dimensions.width!, 0.20556786806950483) &&
      nclose(pen.dimensions.length!, 0.14842244974944513) &&
      lighter.provenance.models.model === "J25" &&
      nclose(
        tissue.site("face").translation.y,
        archetypeExtent(tissue, "y", ["sheet"]).high,
      ) &&
      nclose(
        pen.site("face").translation.z,
        archetypeExtent(pen, "z", ["barrel"]).high,
      ),
  );

  const sheet = createPaper();
  const map = createPaper({ format: "foldedMap" });
  const flat: typeof map = map.articulate({ fold: 180 });
  TestValidator.predicate(
    "paper formats preserve separate hinge and fixed support behavior",
    !sheet.hasArticulations &&
      map.hasArticulations &&
      nclose(
        archetypeExtent(flat, "x").size,
        2 * archetypeExtent(map, "x").size,
      ) &&
      vclose(
        flat.site("support-grip").translation,
        map.site("support-grip").translation,
      ) &&
      nclose(flat.site("face").translation.y, 0),
  );
}
