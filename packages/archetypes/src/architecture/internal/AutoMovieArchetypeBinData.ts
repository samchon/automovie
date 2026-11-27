import type { AutoMovieArchetypeBin } from "../AutoMovieArchetypeBin";
import { AutoMovieArchetypeUnits } from "../../core/index";

export namespace AutoMovieArchetypeBinData {
  /*
   * Each kind's models read, each whole, by name, the default first. The wheeled
   * bins: SULO 240 and 360 litre containers, total height about 1060 and 1100 mm,
   * bin height 990 and 1028, bin depth 660 and 770, total depth 730 and 848,
   * width 585 and 680, handle width 400 and 520, wheels 200 and 250 mm, 12.5 and
   * 17 kg empty (https://sulo.com.au/product/240-litre-container/,
   * https://sulo.com.au/product/360-litre-container/). The dumpsters: Wastequip
   * steel front-load containers, 2 and 3 yd flat nestable, 81 7/8 and 82 7/16 in
   * long, 39 3/4 and 46 3/4 in deep at the lid, 34 and 42 in at the base, 40
   * 15/16 and 48 1/2 in high at the front, 45 1/4 and 52 11/16 in at the back,
   * 505 and 602 lb
   * (https://www.Wastequip.com/sites/default/files/2023-06/Steel_FEL_Containers_Brochure_032017_DIGITAL_0.pdf).
   * For a wheeled bin: `width`, `depth` and `height` its body's, `top` its height
   * with the lid, `reach` its depth with the handle, `handle` the handle's width,
   * `wheel` its wheels' diameter. For a dumpster: `width` its length across the
   * front, `depth` its depth at the lid, `reach` at the base, `height` at the
   * front and `top` at the back; it has no handle or wheels.
   */
  export const BIN_MODELS: Readonly<
    Record<
      AutoMovieArchetypeBin.Kind,
      Readonly<
        Partial<
          Record<
            AutoMovieArchetypeBin.Model,
            Readonly<Partial<Record<AutoMovieArchetypeBin.Dimension, number>>>
          >
        >
      >
    >
  > = {
    wheelieBin: {
      "240L": {
        width: 0.585,
        depth: 0.66,
        height: 0.99,
        top: 1.06,
        reach: 0.73,
        handle: 0.4,
        wheel: 0.2,
        mass: 12.5,
      },
      "360L": {
        width: 0.68,
        depth: 0.77,
        height: 1.028,
        top: 1.1,
        reach: 0.848,
        handle: 0.52,
        wheel: 0.25,
        mass: 17,
      },
    },
    dumpster: {
      "2yd": {
        width: (81 + 7 / 8) * AutoMovieArchetypeUnits.INCH,
        depth: (39 + 3 / 4) * AutoMovieArchetypeUnits.INCH,
        height: (40 + 15 / 16) * AutoMovieArchetypeUnits.INCH,
        top: (45 + 1 / 4) * AutoMovieArchetypeUnits.INCH,
        reach: 34 * AutoMovieArchetypeUnits.INCH,
        mass: 505 * AutoMovieArchetypeUnits.POUND,
      },
      "3yd": {
        width: (82 + 7 / 16) * AutoMovieArchetypeUnits.INCH,
        depth: (46 + 3 / 4) * AutoMovieArchetypeUnits.INCH,
        height: (48 + 1 / 2) * AutoMovieArchetypeUnits.INCH,
        top: (52 + 11 / 16) * AutoMovieArchetypeUnits.INCH,
        reach: 42 * AutoMovieArchetypeUnits.INCH,
        mass: 602 * AutoMovieArchetypeUnits.POUND,
      },
    },
  };
}
