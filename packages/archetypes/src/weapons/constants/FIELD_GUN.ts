import { AutoMovieArchetypeUnits } from "../../core";
import * as FieldGunData from "./internal/FieldGunData";

/*
 * The 6-pdr bronze field gun, Model 1839-1844, on its M1841 carriage, as the
 * 1862 Ordnance Manual gives them, in metres, kilograms and degrees: kept apart
 * from `createCannon` so each file stays within its size, and drawn by
 * `buildFieldGun`.
 *
 * The gun stands on level ground at `y = 0`, its axle across `X` at `z = 0`,
 * its muzzle toward `+Z`. Every place an act reads comes from a read figure or
 * is derived from read figures; the construction estimates below size only
 * parts no act reads, and the elevating screw's place, read from an
 * undimensioned plate, is provisional.
 */
export namespace FIELD_GUN {
  /*
   * The tube's table (p. 19), the carriage's (p. 74), the wheel's and axle's
   * (p. 68), the vent (p. 16), Plate 2, and Gibbon's vent and trunnions.
   */
  export const SOURCE: string = `${FieldGunData.ORDNANCE}: Principal Dimensions and Weights of Guns, Model 1839-1844, brass field 6-pdr, p. 19; Principal Dimensions and Weights of Field-Gun Carriages and Limbers, 6-pdr gun, p. 74; Wheels No. 1 and Axle-Trees No. 1, p. 68; the vent, p. 16; Plate 2, Field Carriage, undimensioned; ${FieldGunData.GIBBON}, pp. 60, 62 and 306`;

  /*
   * The tube (p. 19).
   */
  export const TUBE: Readonly<
    Record<
      | "bore"
      | "boreLength"
      | "baseRing"
      | "whole"
      | "breech"
      | "swell"
      | "trunnion"
      | "trunnionLength"
      | "rimbases"
      | "trunnionToFace"
      | "mass"
      | "preponderance",
      number
    >
  > = {
    /*
     * The bore's diameter, 3.67 in.
     */
    bore: 3.67 * FieldGunData.IN,
    /*
     * The bore's length, 57.5 in.
     */
    boreLength: 57.5 * FieldGunData.IN,
    /*
     * From the rear of the base-ring to the face of the muzzle, 60 in.
     */
    baseRing: 60 * FieldGunData.IN,
    /*
     * The whole length of the piece, 65.6 in; the cascabel is the rest behind
     * the base-ring.
     */
    whole: 65.6 * FieldGunData.IN,
    /*
     * The base-ring's diameter, 10.3 in.
     */
    breech: 10.3 * FieldGunData.IN,
    /*
     * The swell of the muzzle's diameter, twice its 4.125 in semi-diameter.
     */
    swell: 2 * 4.125 * FieldGunData.IN,
    /*
     * The trunnions' diameter, 3.67 in.
     */
    trunnion: 3.67 * FieldGunData.IN,
    /*
     * Each trunnion's length, 2.8 in.
     */
    trunnionLength: 2.8 * FieldGunData.IN,
    /*
     * Between the rimbases, 9.5 in.
     */
    rimbases: 9.5 * FieldGunData.IN,
    /*
     * From the trunnions' axis to the face of the muzzle, 34.91 in.
     */
    trunnionToFace: 34.91 * FieldGunData.IN,
    /*
     * The piece's weight, 884 lb.
     */
    mass: 884 * AutoMovieArchetypeUnits.POUND,
    /*
     * Its preponderance, 47 lb: the weight the breech bears on a support at the
     * rear of the base-ring, the piece hung on its trunnions (p. 15).
     */
    preponderance: 47 * AutoMovieArchetypeUnits.POUND,
  };

  /*
   * The carriage (pp. 68 and 74).
   */
  export const CARRIAGE: Readonly<
    Record<
      | "trunnionHeight"
      | "trunnionBehind"
      | "trailContact"
      | "trailEnd"
      | "plates"
      | "elevation"
      | "depression"
      | "wheel"
      | "track"
      | "axle"
      | "arm"
      | "tyre"
      | "spokes"
      | "mass"
      | "wheelMass"
      | "axleMass",
      number
    >
  > = {
    /*
     * The trunnions' axis above the ground, 43.1 in.
     */
    trunnionHeight: 43.1 * FieldGunData.IN,
    /*
     * The trunnions' axis behind the axle-tree's, the piece in battery on level
     * ground, 0.5 in.
     */
    trunnionBehind: 0.5 * FieldGunData.IN,
    /*
     * Between the points where the trail and the wheels touch the ground, 74.4
     * in.
     */
    trailContact: 74.4 * FieldGunData.IN,
    /*
     * From the front of the wheels to the end of the trail, the piece in
     * battery, 116.6 in.
     */
    trailEnd: 116.6 * FieldGunData.IN,
    /*
     * Between the insides of the trunnion-plates, 9.6 in.
     */
    plates: 9.6 * FieldGunData.IN,
    /*
     * The gun's vertical field of fire above the horizontal, 12 degrees.
     */
    elevation: 12,
    /*
     * And below it, 8 degrees.
     */
    depression: 8,
    /*
     * The wheel's height, 57 in.
     */
    wheel: 57 * FieldGunData.IN,
    /*
     * The track of the wheels, 60 in.
     */
    track: 60 * FieldGunData.IN,
    /*
     * The axle-tree's whole length, 78.84 in.
     */
    axle: 78.84 * FieldGunData.IN,
    /*
     * The axle-tree's arm at the shoulder, 3 in across.
     */
    arm: 3 * FieldGunData.IN,
    /*
     * Wheel No. 1's tire, 2.75 in wide.
     */
    tyre: 2.75 * FieldGunData.IN,
    /*
     * Wheel No. 1's spokes, 14.
     */
    spokes: 14,
    /*
     * The gun-carriage without wheels, 540 lb.
     */
    mass: 540 * AutoMovieArchetypeUnits.POUND,
    /*
     * One wheel, 180 lb.
     */
    wheelMass: 180 * AutoMovieArchetypeUnits.POUND,
    /*
     * Axle-tree No. 1, 116 lb, part of the carriage's 540.
     */
    axleMass: 116 * AutoMovieArchetypeUnits.POUND,
  };

  /*
   * The vent (p. 16): it "is in the vertical plane passing through the axis,
   * and makes an angle of 80° with it. It enters the bore at a distance from
   * the bottom equal to one-fourth the diameter of the bore"; its outer end
   * leans to the rear, the gunner's side (Gibbon, p. 306: "The vent of most
   * pieces being inclined to the rear").
   */
  export const VENT: number = 80;

  /*
   * The elevating screw (Mordecai, Artillery for the United States Land
   * Service, 1849, p. 73,
   * https://archive.org/details/artilleryforunit00unitrich): the field
   * carriage's screw is forged from 2 in round iron, 15 in long, and turned in
   * a brass box let into the stock, its head bearing under the breech; "the
   * base ring rests upon the head of the elevating screw" (Benton). `bar` is
   * that bar's diameter. `pitch` is ten threads to the inch, the mountain
   * howitzer's screw, which Mordecai says is "finished in the same manner as
   * the screw for a field carriage": borrowed, provisional, since no thread is
   * given for the field screw itself (searched: the 1850, 1861 and 1862
   * Ordnance Manuals, Gibbon 1860, Benton 1862, the 1845 and 1863 Instruction
   * for Field Artillery, Roberts 1861; records/elevating-screw.md).
   */
  export const SCREW: Readonly<{ bar: number; pitch: number }> = {
    bar: 2 * FieldGunData.IN,
    pitch: FieldGunData.IN / 10,
  };

  /*
   * The gun's service, read at the 1861 Ordnance Manual and Gibbon: the 6-pdr's
   * shot, 3.58 in and 6.1 lb (p. 34); its muzzle velocity at the 1.25 lb
   * service charge, 1439 ft/s, from the Washington Arsenal's ballistic pendulum
   * ("Initial Velocities of Cannon-Balls", p. 393); its recoil, "under some
   * circumstances the 6-pdr. gun will recoil but 1½ or 2 yards" (Gibbon, p.
   * 272); the lanyard, "a piece of strong cod-line (about .2 inch diam.) 12
   * feet long", a hook at one end and a toggle .75 inch across and 4 inches
   * long at the other (p. 132); the friction primer's long tube 1.75 inch and
   * its wire 3.4 inches (p. 298); the trail handspike, 53 inches long (p.
   * 137).
   */
  export const SERVICE: Readonly<{
    shot: number;
    shotMass: number;
    velocity: number;
    recoil: Readonly<{ least: number; most: number }>;
    lanyard: number;
    line: number;
    toggle: Readonly<{ diameter: number; length: number }>;
    tube: number;
    wire: number;
    handspike: number;
  }> = {
    shot: 3.58 * FieldGunData.IN,
    shotMass: 6.1 * AutoMovieArchetypeUnits.POUND,
    velocity: 1439 * AutoMovieArchetypeUnits.FOOT,
    recoil: { least: 1.5 * FieldGunData.YARD, most: 2 * FieldGunData.YARD },
    lanyard: 12 * AutoMovieArchetypeUnits.FOOT,
    line: 0.2 * FieldGunData.IN,
    toggle: { diameter: 0.75 * FieldGunData.IN, length: 4 * FieldGunData.IN },
    tube: 1.75 * FieldGunData.IN,
    wire: 3.4 * FieldGunData.IN,
    handspike: 53 * FieldGunData.IN,
  };

  /*
   * Construction estimates, read by no act, each sizing a part the manual gives
   * no figure for:
   *
   * - `cascabel`: the cascabel's knob radius as a share of the base-ring's.
   * - `stockDepth`: the stock's depth as a share of its width, the
   *   trunnion-plates' read 9.6 in.
   * - `spoke`: a spoke's radius as a share of the tire's width.
   * - `nave`: the nave's radius as a multiple of the axle arm's.
   * - `naveLength`: the nave's length as a multiple of the tire's width.
   * - `handspike`: the share of the trail handspike's read 53 in that stands
   *   behind the trail's end where the hands take it; its seat in the trail's
   *   rings is not given (searched: the 1861 Ordnance Manual's handspike table
   *   and Plate 2, Gibbon; records-cannon.md).
   */
  export const ESTIMATES: Readonly<
    Record<
      "cascabel" | "stockDepth" | "spoke" | "nave" | "naveLength" | "handspike",
      number
    >
  > = {
    cascabel: 0.5,
    stockDepth: 0.75,
    spoke: 0.25,
    nave: 3,
    naveLength: 3,
    handspike: 0.5,
  };
}
