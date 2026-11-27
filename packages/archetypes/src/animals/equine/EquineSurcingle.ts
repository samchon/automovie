import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core";
import { type AutoMovieArchetypeEquine } from "../AutoMovieArchetypeEquine";

/*
 * An equid's vaulting tack, laid on its body: a surcingle round the barrel
 * behind the withers with two handles on top, and a back pad behind it, the
 * equipment FEI vaulting is performed on (https://www.fei.org/vaulting). The
 * USEF vaulting rules give "two solid handles" and the pad's extent, "max. 80
 * cm from the back edge of the surcingle to the back"; Equestrian Australia's
 * rules, harmonised with the FEI's, cap the handles at 240 mm apart and the pad
 * at "3 cm thick including cover"
 * (https://usef.org/forms-pubs/QGJpESAxi3s/va-vaulting-division,
 * https://www.equestrian.org.au/sites/default/files/Vaulting%20Rule%20Changes%20Effective%201.7.19_0.pdf).
 * The values below lie inside those limits; where they are below a limit they
 * are estimates.
 *
 * The contacts are the two handles a vaulter holds (`leftHandle`,
 * `rightHandle`), the pad's top a vaulter kneels and stands on (`pad`) and the
 * seat astride on the pad just behind the surcingle (`seat`), mounted from the
 * near side as a vaulter on the left rein is. The bridle, side reins and lunge
 * line are not laid: the vaulter holds none of them. No maker's weight was
 * read, so every part is massless.
 */
export namespace EquineSurcingle {
  /*
   * The handles' centres apart, metres: inside the 240 mm the harmonised rules
   * allow (estimate).
   */
  export const SPREAD: number = 0.22;

  /*
   * The handles' grip above the pad's top, metres, and the length of the
   * gripped bar: estimates inside the 280 mm between a handle's fixing points.
   */
  export const HANDLE: Readonly<{ rise: number; length: number }> = {
    rise: 0.12,
    length: 0.12,
  };

  /*
   * The back pad's thickness, length behind the surcingle and width, metres:
   * the 3 cm thickness limit, and 0.6 and 0.5 (estimates inside the 80 cm
   * length and 90 cm width limits).
   */
  export const PAD: Readonly<{ thick: number; length: number; width: number }> =
    {
      thick: 0.03,
      length: 0.6,
      width: 0.5,
    };

  /*
   * The surcingle ahead of the rig's hitch, metres: the girth's place at a
   * riding saddle's front, behind the withers (estimate).
   */
  export const AHEAD: number = 0.2;

  /*
   * The basic seat's depth back from its front edge just behind the surcingle,
   * metres (estimate).
   */
  export const SEAT: number = 0.45;

  /*
   * Lay the surcingle, its handles and the back pad on an equid under
   * construction.
   * Parameter builder: The equid under construction, its body laid.
   * Parameter rig: The equid's rest rig.
   */
  export function lay(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
    rig: AutoMovieArchetypeEquine.IRig,
  ): void {
    const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
    const back: number = rig.back;
    const z: number = rig.hitch.z + AHEAD;
    const top: number = back + PAD.thick;
    const quiet: NonNullable<Parameters<typeof builder.rod>[4]> = {
      color: "#2f3a4a",
      share: 0,
    };
    builder.box("surcingle", v(0.3, 0.03, 0.1), v(0, back + 0.015, z), quiet);
    for (const sign of [1, -1] as const)
      builder.rod(
        `surcingle-${sign > 0 ? "left" : "right"}`,
        0.02,
        v(sign * 0.15, back - 0.01, z),
        v(sign * (rig.barrel + 0.01), back - rig.barrel, z),
        quiet,
      );

    // Each handle is a bar running fore and aft, gripped from above, on its own side of the spine.
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      const x: number = (sign * SPREAD) / 2;
      const grip: IAutoMovieVector3 = v(x, top + HANDLE.rise, z);
      const fore: IAutoMovieVector3 = v(x, grip.y, z + HANDLE.length / 2);
      const aft: IAutoMovieVector3 = v(x, grip.y, z - HANDLE.length / 2);
      builder.rod(`handle-${side}`, 0.015, aft, fore, quiet);
      builder.rod(
        `handle-${side}-fore`,
        0.012,
        v(x, back + 0.03, fore.z),
        fore,
        quiet,
      );
      builder.rod(
        `handle-${side}-aft`,
        0.012,
        v(x, back + 0.03, aft.z),
        aft,
        quiet,
      );
      builder.affordance({
        id: `${side}Handle`,
        kind: "handle",
        symmetry: "none",
        frame: AutoMovieArchetypeFrame.facing(grip, v(0, 1, 0), v(0, 0, 1)),
        extent: null,
        grip: "power",
        aperture: 0.03,
        length: HANDLE.length,
      });
    }

    // The pad behind the surcingle: a surface to kneel and stand on, and the basic seat astride at its front.
    const middle: number = z - 0.05 - PAD.length / 2;
    builder.box(
      "pad",
      v(PAD.width, PAD.thick, PAD.length),
      v(0, back + PAD.thick / 2, middle),
      { color: "#d8d2c4", share: 0 },
    );
    builder.affordance({
      id: "pad",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, top, middle)),
      extent: null,
      width: PAD.width,
      depth: PAD.length,
    });
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: AutoMovieArchetypeFrame.upright(v(0, top, z - 0.08)),
      extent: null,
      depth: SEAT,
      width: PAD.width,
      astride: true,
      mount: "left",
    });
  }
}
