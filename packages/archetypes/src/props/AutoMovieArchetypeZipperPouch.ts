import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieAffordanceCoupling, IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";

/** Constructs the stationary zipper pouch from its recipe. */
export namespace AutoMovieArchetypeZipperPouch {
  /**
   * A stationary accessory pouch whose straight zipper opens a hollow interior.
   *
   * The origin is beneath the centre of the base and the tab travels along +X.
   * The built example uses the Kokka lined zipper pouch's 21 cm opening, 12 cm
   * height, 10 cm gusset and nominal 20 cm zipper
   * (https://kokka-fabric.com/en/wp-content/uploads/sites/2/2024/11/CS583_Zipper_Pouch_E.pdf).
   * The model sets its own inward stop allowances. Four short pairs of lips swing
   * clear independently, behind the moving tab. This approximates a flexible
   * pouch mouth with rigid pieces.
   *
   * @param params The model id, supplied as an option or as a positional string.
   * @returns A closed pouch with tab, brace, stops and lip articulation.
   */
  export function create(
    params: AutoMovieArchetypeZipperPouch.IParams = {},
  ): AutoMovieArchetype<string, never> {
    const v: typeof Vector3.create = Vector3.create;
    const width: number = 0.21;
    const depth: number = 0.1;
    const height: number = 0.12;
    const skin: number = 0.002;
    const tabHeight: number = 0.003;
    const tabLength: number = 0.008;
    const start: number = -0.09;
    const travel: number = 0.18;
    const tabY: number = height + 0.009;
    const builder: AutoMovieArchetypeBuilder<string, never> =
      new AutoMovieArchetypeBuilder({
        id: typeof params === "string" ? params : params.id,
        name: "zipper pouch",
        material: "fabric",
        draw: new AutoMovieArchetypeDrawSession<never>(
          "zipper-pouch",
          {},
          undefined,
        ),
      });

    builder.box("bottom", v(width, skin, depth), v(0, skin / 2, 0));
    for (const sign of [-1, 1]) {
      builder.box(
        `wall-${sign}`,
        v(width, height - skin, skin),
        v(0, (height - skin) / 2, (sign * (depth - skin)) / 2),
      );
      builder.box(
        `end-${sign}`,
        v(skin, height, depth - 2 * skin),
        v((sign * (width - skin)) / 2, height / 2, 0),
      );
      builder.box(
        `seam-end-${sign}`,
        v(0.027, skin, depth),
        v((sign * (width - 0.027)) / 2, height - skin / 2, 0),
      );
      builder.box(
        `stop-${sign}`,
        v(skin, 0.003, 0.012),
        v(
          sign * (Math.abs(start) + tabLength / 2 + skin / 2),
          height + 0.0015,
          0,
        ),
        { color: "#363638" },
      );
    }

    // The stem is behind the grasp point so the underside remains accessible.
    builder.box(
      "slider-stem",
      v(tabLength, tabY - height, 0.004),
      v(start, (height + tabY) / 2, 0),
      { color: "#363638" },
    );
    builder.box("tab", v(tabLength, tabHeight, 0.016), v(start, tabY, -0.006), {
      color: "#707075",
    });
    builder.affordance({
      id: "zipper",
      kind: "slider",
      extent: null,
      travel,
      frame: AutoMovieArchetypeFrame.upright(v(start, height, 0)),
      parts: ["slider-stem", "tab"],
    });
    for (const [contact, facing] of [
      ["thumb", 1],
      ["index", -1],
    ] as const) {
      const point: IAutoMovieVector3 = v(
        start,
        tabY + (facing * tabHeight) / 2,
        -0.012,
      );
      builder.affordance({
        id: contact,
        kind: "surface",
        extent: null,
        rides: "zipper",
        frame: {
          ...AutoMovieArchetypeFrame.upright(point),
          rotation: Quaternion.fromAxisAngle(v(1, 0, 0), facing > 0 ? 0 : 180),
        },
      });
    }
    builder.affordance({
      id: "brace",
      kind: "surface",
      extent: null,
      frame: AutoMovieArchetypeFrame.upright(v(start - 0.008, height, -0.032)),
    });

    // The near seam ends cover the plate-to-casing joint. Each coupled pair
    // opens only after its far edge is fully behind the slider stem.
    const section: number = 0.039;
    const first: number = -2 * section;
    const openAngle: number = 66;
    for (let index: number = 0; index < 4; ++index) {
      const edge: number = first + (index + 1) * section;
      const cleared: number = edge - start + tabLength / 2;
      const opened: number = Math.min(travel, cleared + 0.02);
      for (const side of [-1, 1]) {
        const lip: string = `lip-${index}-${side}`;
        builder.box(
          lip,
          v(section, skin, depth / 2),
          v(edge - section / 2, height - skin / 2, (side * depth) / 4),
        );
        builder.affordance({
          id: `hinge-${lip}`,
          kind: "hinge",
          extent: null,
          travel: openAngle,
          parts: [lip],
          frame: {
            // Raise each lip about its underside so its thickness sweeps away from the seam.
            ...AutoMovieArchetypeFrame.upright(
              v(edge - section / 2, height - skin, (side * depth) / 2),
            ),
            rotation: Quaternion.fromAxisAngle(v(0, 0, 1), -side * 90),
          },
          follows: {
            id: "zipper",
            table: [
              { leader: 0, follower: 0 },
              { leader: cleared, follower: 0 },
              { leader: opened, follower: openAngle },
              ...(opened < travel
                ? ([{ leader: travel, follower: openAngle }] satisfies IAutoMovieAffordanceCoupling.IPoint[])
                : []),
            ],
          },
        });
      }
    }
    // The source gives dimensions, so the empty mass is a staging estimate.
    return builder.build(0.06);
  }

  /* Authorable parameters for the zipper pouch producer. */
  /** Object form of the producer parameters. */
  export interface IOptions {
    /** The model id, unique in a scene; `zipper-pouch` when absent. */
    id?: string;
  }

  /** Object parameters or a positional scene identifier. */
  export type IParams = IOptions | string;
}
