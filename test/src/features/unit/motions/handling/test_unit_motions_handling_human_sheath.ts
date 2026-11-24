import type {
  IAutoMovieAffordance,
  IAutoMovieIntent,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSheath,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import { HumanRefusal, HumanSheath } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { compositionIntents } from "../../../internal/compositionIntents";
import { vclose } from "../../../internal/vclose";

/** Rounding of a few sums, metres. */
const ROUNDING: number = 1e-12;

/**
 * `HumanSheath` stages a blade seated in its carrier: on the mouth's axis it
 * derives the seat (the mouth itself), the entry the blade's length and the
 * clearance out along the mouth's `+Y`, a slider from the seat toward the entry
 * and a socket riding it, and mounts the blade on the seat; `draw` grips the
 * handle and draws the blade out to the entry, and `sheathe` returns it through
 * the entry to the seat.
 *
 * Scenarios, a scabbard whose mouth stands 0.5 m up its origin, upright, and a
 * blade whose tip lies 0.8 m along its `+Y`, drawn clear by 0.1 m:
 *
 * 1. The entry stands 0.9 m above the mouth; the slide socket sits on the seat at
 *    rest, rides the slider to 0.3 m, and stops at the entry for any longer
 *    travel; the blade is mounted on the seat.
 * 2. An unknown mouth, a tip off the blade's `+Y`, no clearance and a fixed blade
 *    are refused on `mouth`, `tip`, `clearance` and `blade`.
 * 3. Drawing grips the handle with no lift and then draws from the seat out of the
 *    entry on the slider; sheathing puts the blade down through the entry onto
 *    the seat along the same guide.
 */
export function test_unit_motions_handling_human_sheath(): void {
  const site: (
    id: string,
    kind: IAutoMovieAffordance["kind"],
    at: IAutoMovieVector3,
  ) => IAutoMovieAffordance = (
    id: string,
    kind: IAutoMovieAffordance["kind"],
    at: IAutoMovieVector3,
  ): IAutoMovieAffordance => ({
    id,
    kind,
    frame: {
      translation: at,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
  });
  const prop: (
    subject: string,
    affordances: IAutoMovieAffordance[],
  ) => IAutoMovieMotionHumanProp = (
    subject: string,
    affordances: IAutoMovieAffordance[],
  ): IAutoMovieMotionHumanProp => ({
    subject,
    frame: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    affordances,
  });
  const scabbard: IAutoMovieMotionHumanProp = prop("scabbard", [
    site("mouth", "socket", { x: 0, y: 0.5, z: 0 }),
  ]);
  const blade: IAutoMovieMotionHumanProp = prop("sword", [
    site("tip", "socket", { x: 0, y: 0.8, z: 0 }),
    site("hilt", "handle", { x: 0, y: -0.1, z: 0 }),
  ]);
  const params: IAutoMovieMotionHumanSheath.IParams = {
    mouth: "mouth",
    tip: "tip",
    handle: "hilt",
    clearance: 0.1,
  };
  const staged: IAutoMovieMotionHumanSheath.IStaging = HumanSheath(
    scabbard,
    blade,
    params,
  );
  const at: (
    affordances: readonly IAutoMovieAffordance[],
    id: string,
  ) => IAutoMovieVector3 = (
    affordances: readonly IAutoMovieAffordance[],
    id: string,
  ): IAutoMovieVector3 =>
    affordances.find((a: IAutoMovieAffordance): boolean => a.id === id)!.frame
      .translation;
  const slid: (travel: number) => IAutoMovieVector3 = (
    travel: number,
  ): IAutoMovieVector3 =>
    at(
      staged.carrier.articulate!({ [HumanSheath.SLIDER]: travel }).affordances,
      HumanSheath.SLIDE,
    );
  TestValidator.predicate(
    "the guide",
    vclose(
      at(staged.carrier.affordances!, HumanSheath.ENTRY),
      { x: 0, y: 1.4, z: 0 },
      ROUNDING,
    ) &&
      vclose(
        at(staged.carrier.affordances!, HumanSheath.SEAT),
        { x: 0, y: 0.5, z: 0 },
        ROUNDING,
      ) &&
      vclose(slid(0), { x: 0, y: 0.5, z: 0 }, ROUNDING) &&
      vclose(slid(0.3), { x: 0, y: 0.8, z: 0 }, ROUNDING) &&
      vclose(slid(2), { x: 0, y: 1.4, z: 0 }, ROUNDING) &&
      staged.blade.mounted?.prop === "scabbard" &&
      staged.blade.mounted.point === HumanSheath.SEAT,
  );
  const refused: (
    carrier: IAutoMovieMotionHumanProp,
    held: IAutoMovieMotionHumanProp,
    asked: IAutoMovieMotionHumanSheath.IParams,
  ) => string = (
    carrier: IAutoMovieMotionHumanProp,
    held: IAutoMovieMotionHumanProp,
    asked: IAutoMovieMotionHumanSheath.IParams,
  ): string => {
    try {
      HumanSheath(carrier, held, asked);
    } catch (error: unknown) {
      if (error instanceof HumanRefusal) return error.axis;
    }
    return "admitted";
  };
  TestValidator.equals(
    "refusals",
    [
      refused(scabbard, blade, { ...params, mouth: "throat" }),
      refused(
        scabbard,
        prop("sword", [
          site("tip", "socket", { x: 0.3, y: 0.8, z: 0 }),
          site("hilt", "handle", { x: 0, y: -0.1, z: 0 }),
        ]),
        params,
      ),
      refused(scabbard, blade, { ...params, clearance: 0 }),
      refused(scabbard, { ...blade, fixed: true }, params),
    ],
    ["mouth", "tip", "clearance", "blade"],
  );
  const named: (intents: IAutoMovieIntent[]) => unknown[] = (
    intents: IAutoMovieIntent[],
  ): unknown[] =>
    intents.map((i: IAutoMovieIntent): unknown => [
      i.capability,
      i.parameters?.params,
    ]);
  TestValidator.equals(
    "the draw and the return",
    [
      named(
        compositionIntents(
          HumanSheath.draw(HumanChain.subject("a"), staged.sheath).node,
        ),
      ),
      named(
        compositionIntents(
          HumanSheath.sheathe(HumanChain.subject("a"), staged.sheath, "left")
            .node,
        ),
      ),
    ],
    [
      [
        ["takeFromCarrier", { prop: "sword", handle: "hilt", lift: 0 }],
        [
          "drawFromCarrier",
          {
            prop: "sword",
            from: {
              prop: "scabbard",
              aperture: HumanSheath.ENTRY,
              point: HumanSheath.SEAT,
              slider: HumanSheath.SLIDER,
              slide: HumanSheath.SLIDE,
            },
          },
        ],
      ],
      [
        [
          "putDownAperture",
          {
            prop: "sword",
            onto: {
              prop: "scabbard",
              aperture: HumanSheath.ENTRY,
              point: HumanSheath.SEAT,
              guide: { slider: HumanSheath.SLIDER, slide: HumanSheath.SLIDE },
            },
            hand: "left",
          },
        ],
      ],
    ],
  );
}
