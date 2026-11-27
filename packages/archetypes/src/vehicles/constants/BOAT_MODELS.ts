import { AutoMovieArchetypeUnits } from "../../core";
import type { AutoMovieArchetypeBoat } from "../AutoMovieArchetypeBoat";
import { BoatModelsData } from "./internal/BoatModelsData";

/*
 * The read boats by kind, each whole, and the options a canoe is built in and
 * the oars a rowboat is rowed with.
 *
 * Rowboats, at their designers' pages: the Selway-Fisher 14 ft Thames skiff (14
 * ft, beam 4 ft 2 in, mid depth 1 ft 6 in, draft 5 in, about 85 lb;
 * https://selway-fisher.com/Rowskiffs.htm), the Duckworks 15 ft 6 in Whitehall
 * skiff (beam 4 ft 5.5 in, mid depth 1 ft 6.5 in, draft 7 in, 95 lb;
 * https://duckworks.com/15-6-whitehall-skiff) and the Glen-L 17 ft Whitehall
 * (16 ft 11 in, beam 4 ft 6 in, depth amidships 1 ft 10 in, about 350 lb;
 * https://www.glen-l.com/17-Whitehall-traditional-rowing-craft/products/190/).
 * The Glen-L page gives no draft: no law gives a hull's draft from these
 * figures, so its draft is the other two rowboats' 5 to 7 in, borrowed
 * (`AutoMovieArchetypeBoat.BANDS`), provisional.
 *
 * Canoes, at their makers' pages, the gunwale width taken as the beam and the
 * bow's depth as the ends' height: the Nova Craft Prospector 16 (16 ft, 36 in,
 * centre 15 in, ends 23 in; https://novacraft.com/?p=3460), the Old Town
 * Discovery 169 (16 ft 9 in, 37 in, 15 in, bow 23 in;
 * https://kayaksandpaddles.co.uk/canoes/old-town-discovery-169, a retailer,
 * secondary), the Wenonah Spirit II (17 ft, gunwale 35 in, centre 14 in, bow 22
 * in; https://wenonah.com/products/spirit-ii) and Minnesota II (18 ft 6 in,
 * gunwale 33.5 in, centre 13.5 in, bow 20.5 in;
 * https://wenonah.com/products/minnesota-ii). Each canoe's mass is its layup's
 * (`LAYUPS`), picked with it.
 *
 * Oars, Fyne Boat Kits' standard oars by length, each blade's size
 * (https://fyneboatkits.co.uk/accessories/oars/oars-standard): a rowboat rows
 * with the oar whose length is nearest the one Shaw and Tenney's rule gives its
 * span (`BoatOars`), so its blade is that oar's.
 */
export const BOAT_MODELS: Readonly<{
  hulls: Readonly<
    Record<
      AutoMovieArchetypeBoat.Kind,
      Readonly<Partial<Record<AutoMovieArchetypeBoat.Model, Figures>>>
    >
  >;
  layups: Readonly<
    Partial<
      Record<
        AutoMovieArchetypeBoat.Model,
        Readonly<Partial<Record<AutoMovieArchetypeBoat.Layup, Figures>>>
      >
    >
  >;
  oars: readonly Readonly<{
    length: number;
    bladeLength: number;
    bladeWidth: number;
  }>[];
}> = {
  hulls: {
    rowboat: {
      thamesSkiff: {
        length: 168 * BoatModelsData.IN,
        beam: 50 * BoatModelsData.IN,
        depth: 18 * BoatModelsData.IN,
        draft: 5 * BoatModelsData.IN,
        mass: 85 * BoatModelsData.LB,
      },
      whitehallSkiff: {
        length: 186 * BoatModelsData.IN,
        beam: 53.5 * BoatModelsData.IN,
        depth: 18.5 * BoatModelsData.IN,
        draft: 7 * BoatModelsData.IN,
        mass: 95 * BoatModelsData.LB,
      },
      whitehall17: {
        length: 203 * BoatModelsData.IN,
        beam: 54 * BoatModelsData.IN,
        depth: 22 * BoatModelsData.IN,
        mass: 350 * BoatModelsData.LB,
      },
    },
    canoe: {
      prospector16: {
        length: 192 * BoatModelsData.IN,
        beam: 36 * BoatModelsData.IN,
        depth: 15 * BoatModelsData.IN,
        endHeight: 23 * BoatModelsData.IN,
      },
      discovery169: {
        length: 201 * BoatModelsData.IN,
        beam: 37 * BoatModelsData.IN,
        depth: 15 * BoatModelsData.IN,
        endHeight: 23 * BoatModelsData.IN,
      },
      spiritII: {
        length: 204 * BoatModelsData.IN,
        beam: 35 * BoatModelsData.IN,
        depth: 14 * BoatModelsData.IN,
        endHeight: 22 * BoatModelsData.IN,
      },
      minnesotaII: {
        length: 222 * BoatModelsData.IN,
        beam: 33.5 * BoatModelsData.IN,
        depth: 13.5 * BoatModelsData.IN,
        endHeight: 20.5 * BoatModelsData.IN,
      },
    },
    launch: {},
  },
  layups: {
    prospector16: {
      fiberglass: { mass: 64 * BoatModelsData.LB },
      tuffStuff: { mass: 54 * BoatModelsData.LB },
      tuffStuffExpedition: { mass: 60 * BoatModelsData.LB },
      aramidLite: { mass: 44 * BoatModelsData.LB },
      blueSteel: { mass: 47 * BoatModelsData.LB },
    },
    discovery169: { polyethylene: { mass: 91 * BoatModelsData.LB } },
    spiritII: {
      flexCore: { mass: 58 * BoatModelsData.LB },
      aramidUltraLight: { mass: 42 * BoatModelsData.LB },
      superLite: { mass: 36.5 * BoatModelsData.LB },
      intekPolyester: { mass: 44 * BoatModelsData.LB },
      intekCarbon: { mass: 44 * BoatModelsData.LB },
    },
    minnesotaII: {
      flexCore: { mass: 58 * BoatModelsData.LB },
      aramidUltraLight: { mass: 42 * BoatModelsData.LB },
      superLite: { mass: 36.5 * BoatModelsData.LB },
      intek: { mass: 44 * BoatModelsData.LB },
      intekCarbon: { mass: 42 * BoatModelsData.LB },
    },
  },
  oars: [
    {
      length: 6 * AutoMovieArchetypeUnits.FOOT,
      bladeLength: 0.54,
      bladeWidth: 0.112,
    },
    {
      length: 6.5 * AutoMovieArchetypeUnits.FOOT,
      bladeLength: 0.54,
      bladeWidth: 0.112,
    },
    {
      length: 7 * AutoMovieArchetypeUnits.FOOT,
      bladeLength: 0.58,
      bladeWidth: 0.112,
    },
    {
      length: 7.5 * AutoMovieArchetypeUnits.FOOT,
      bladeLength: 0.58,
      bladeWidth: 0.112,
    },
    {
      length: 8 * AutoMovieArchetypeUnits.FOOT,
      bladeLength: 0.6,
      bladeWidth: 0.115,
    },
    {
      length: 8.5 * AutoMovieArchetypeUnits.FOOT,
      bladeLength: 0.6,
      bladeWidth: 0.115,
    },
    {
      length: 9 * AutoMovieArchetypeUnits.FOOT,
      bladeLength: 0.6,
      bladeWidth: 0.115,
    },
    {
      length: 10 * AutoMovieArchetypeUnits.FOOT,
      bladeLength: 0.7,
      bladeWidth: 0.12,
    },
  ],
};

/*
 * One boat's or option's figures by dimension.
 */
type Figures = Readonly<
  Partial<Record<AutoMovieArchetypeBoat.Dimension, number>>
>;
