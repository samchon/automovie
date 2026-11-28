import { AutoMovieArchetypeRefusal, AutoMovieArchetypeCart } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeModelSweep } from "../../internal/archetypeModelSweep";

/** An inch, metres, as the sources state their figures. */
const IN: number = 0.0254;

/** A cart's built figures for some dimensions, in order. */
const figures =
  (
    params: AutoMovieArchetypeCart.IParams,
    names: readonly AutoMovieArchetypeCart.Dimension[],
  ): ((seed: number) => number[]) =>
  (seed: number): number[] => {
    const dimensions = AutoMovieArchetypeCart.create(params, seed).dimensions;
    return names.map((name: AutoMovieArchetypeCart.Dimension): number => dimensions[name]!);
  };

/** The refusal a call throws, or null. */
const refusal = (call: () => unknown): AutoMovieArchetypeRefusal | null => {
  try {
    call();
  } catch (error) {
    if (error instanceof AutoMovieArchetypeRefusal) return error;
    throw error;
  }
  return null;
};

/**
 * A carrier is one read model whole, and a cart's shafts fit the horse that draws it.
 *
 * Scenarios:
 * 1. Over 200 seeds (`archetypeModelSweep`), a trolley's castors are Wanzl's 100 or 125 mm; a cart's wheels the multi-use cart's 43 in or the Dennett gig's 4 ft 5 in, and the multi-use cart's shafts 89.5 or 93.5 in on its 57 in track; a rickshaw's length and width one of the Edo-Tokyo Museum's two or the Powerhouse's; a chariot's wheels one of Carter's six; a brougham's height, width, length and wheels the Brewster's, the Miner, Stevens' or the Peters'.
 * 2. A cart whose shafts are not read, the gig, takes shafts reaching from the horse's point of shoulder past its point of buttock, 185/172 of its withers height behind (Jensen et al. 2019), by a clearance of 8 to 20 in (IVC Carriage).
 * 3. The multi-use cart draws its horse inside its 14.2 to 16.3 hh and the horse's own 1.58 to 1.80 m; with the horse fixed taller than 16.3 hh, only the gig is picked.
 * 4. A fixed shaft length on the multi-use cart, whose shafts are read, and a model on a trolley, which has none, are refused at their axes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies measured vehicle entries, attachment-shaft clearance, horse height admission and the fixed-figure and missing-model refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Builds each public cart kind across its seeded catalogue and reads wheel, track, length and mass figures together with the paired horse and shafts. Tests fixed values at the owning catalogue axes.
 * @evidence contracts/development/testing.md#independent-expectations Uses the stated manufacturer and museum dimensions as whole entries. The gig's far attachment position follows from 185/172 of the horse's withers height and the literal 8 to 20 inch clearance.
 */
export function test_archetype_cart_models(): void {
  TestValidator.equals(
    "each carrier is one read model whole",
    archetypeModelSweep([
      {
        name: "trolley castor",
        measure: figures({ kind: "trolley" }, ["wheelDiameter"]),
        models: [[0.1], [0.125]],
        source: "Wanzl's EL series page",
      },
      {
        name: "cart",
        measure: figures({ kind: "cart" }, ["wheelDiameter"]),
        models: [[43 * IN], [53 * IN]],
        source:
          "the multi-use cart's seller and the Carriage Foundation's Dennett gig",
      },
      {
        name: "cart shafts",
        measure: figures({ kind: "cart", model: "multiUse" }, [
          "shaftLength",
          "track",
        ]),
        models: [
          [89.5 * IN, 57 * IN],
          [93.5 * IN, 57 * IN],
        ],
        source: "the multi-use cart's seller",
      },
      {
        name: "rickshaw",
        measure: figures({ kind: "rickshaw" }, ["length", "width"]),
        models: [
          [2.13, 1.02],
          [1.98, 1.07],
          [2.15, 0.9],
        ],
        source: "the Edo-Tokyo Museum's and the Powerhouse's records",
      },
      {
        name: "chariot",
        measure: figures({ kind: "chariot" }, ["wheelDiameter"]),
        models: [[0.93], [0.94], [0.92], [0.97], [0.84], [0.8]],
        source: "Carter's notes, Griffith Institute TAA i.3.8.17",
      },
      {
        name: "carriage",
        measure: figures({ kind: "carriage" }, [
          "height",
          "width",
          "length",
          "frontWheelDiameter",
          "wheelDiameter",
        ]),
        models: [
          [78.5 * IN, 68 * IN, 145.5 * IN, 36.5 * IN, 48.25 * IN],
          [79 * IN, 69 * IN, 153 * IN, 42 * IN, 50 * IN],
          [74 * IN, 65 * IN, 139 * IN, 36 * IN, 44 * IN],
        ],
        source: "The Henry Ford's and the Carriage Foundation's records",
      },
    ]),
    [],
  );

  const findings: string[] = [];
  for (let seed: number = 0; seed < archetypeModelSweep.SEEDS; seed++) {
    const gig: Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, number>>> =
      AutoMovieArchetypeCart.create({ kind: "cart", model: "dennettGig" }, seed).dimensions;
    const clearance: number =
      gig.shaftLength! - (185 / 172) * gig.withersHeight!;
    if (!(clearance >= 8 * IN - 1e-9 && clearance <= 20 * IN + 1e-9))
      findings.push(
        `gig@${seed}: the single tree stands ${clearance} m behind the point of buttock`,
      );
    if (Math.abs(clearance - gig.clearance!) > 1e-9)
      findings.push(
        `gig@${seed}: the shafts are not the horse's length and the drawn clearance`,
      );
    const multi: number = AutoMovieArchetypeCart.create({ kind: "cart", model: "multiUse" }, seed)
      .dimensions.withersHeight!;
    if (!(multi >= 1.58 && multi <= 67 * IN))
      findings.push(
        `multi-use@${seed}: drawn for a horse ${multi} m at the withers`,
      );
    const tall: number = AutoMovieArchetypeCart.create({ kind: "cart", withersHeight: 1.75 }, seed)
      .dimensions.wheelDiameter!;
    if (Math.abs(tall - 53 * IN) > 1e-9)
      findings.push(
        `cart@${seed}: a 1.75 m horse drew a cart on ${tall} m wheels, not the gig`,
      );
  }
  TestValidator.equals("a cart's shafts and horse fit", findings, []);

  const chariot = AutoMovieArchetypeCart.create({ kind: "chariot", model: "carter333" });
  TestValidator.equals(
    "the explicit Carter model supplies its own wheel diameter",
    [chariot.provenance.models.model, chariot.dimensions.wheelDiameter],
    ["carter333", 0.8],
  );

  TestValidator.equals(
    "a read figure and a missing axis are refused",
    [
      refusal((): unknown =>
        AutoMovieArchetypeCart.create({ kind: "cart", model: "multiUse", shaftLength: 2.3 }, 1),
      )?.axis,
      refusal((): unknown =>
        AutoMovieArchetypeCart.create({ kind: "trolley", model: "brewster" }, 1),
      )?.axis,
      refusal((): unknown =>
        AutoMovieArchetypeCart.create({ kind: "chariot", model: "brewster" }, 1),
      )?.axis,
    ],
    ["shaftLength", "model", "model"],
  );
}
