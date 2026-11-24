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

import { archetypeExtent } from "../../../internal/archetypeExtent";
import { nclose, qclose, vclose } from "../../../internal/predicates";

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
 * 2. Recorded pre-split figures pin variable dimensions and model selection.
 * 3. The hammer face and spoon bowl lie on the modeled working surfaces. The broom
 *    and shovel face the floor, the shovel D-grip sits on its crossbar, and the
 *    fishing rod's target is its tip.
 * 4. A loose paper sheet exposes the writing face. A folded map keeps its support
 *    grip and moves its face with its crease.
 */
export function test_unit_archetypes_props_catalogue_tools_personal(): void {

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
