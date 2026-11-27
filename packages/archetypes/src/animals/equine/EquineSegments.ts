import type { QuadrupedProportions } from "../quadruped/QuadrupedProportions";
import { AutoMovieArchetypeHorse } from "../AutoMovieArchetypeHorse";

/*
 * Equids' limb and back segments measured on the body's surface, by breed, and
 * the bone fractions an equid derives from them against the horse's.
 *
 * The measures are Brooks et al. 2010, Morphological variation in the horse:
 * defining complex traits of body size and shape, Animal Genetics 41 (Suppl.
 * 2):159, its protocol read at p. 160
 * (https://srvanderplas.github.io/stat-computing-r-python/data/bonus_horse_morphometric_dataset/Brooks_et_al-2010-Animal_Genetics.pdf);
 * each breed's means are computed from the paper's published per-animal rows,
 * in inches, converted at 2.54 cm
 * (https://raw.githubusercontent.com/srvanderplas/stat-computing-r-python/main/data/bonus_horse_morphometric_dataset/Brooks%20Sutter%20Horse%20Morphometrics.txt):
 * no paper prints these means, so they are this campaign's arithmetic on the
 * paper's data. The forearm runs from the point of the elbow to the back of the
 * knee, the cannons from the knee or the point of the hock to the ergot, the
 * gaskin from the stifle to the point of the hock, and the back from the
 * withers to the point of the croup; none is a bone's length, and neither the
 * humerus nor the femur is measured.
 */
export namespace EquineSegments {
  /*
   * One breed's mean measures, centimetres, and its sample size.
   */
  export interface IBreed {
    /*
     * How many animals of the breed the rows hold.
     */
    n: number;

    /*
     * The height at the withers.
     */
    withers: number;

    /*
     * The heart girth, directly behind the forelegs.
     */
    girth: number;

    /*
     * The withers to the point of the croup, straight across the back.
     */
    back: number;

    /*
     * The point of the elbow to the back of the knee.
     */
    forearm: number;

    /*
     * The back of the knee to the ergot.
     */
    foreCannon: number;

    /*
     * The fore pastern and hoof: the bottom of the fetlock to the coronet, and
     * the coronet to the bottom of the hoof.
     */
    foreDigit: number;

    /*
     * The stifle to the point of the hock.
     */
    gaskin: number;

    /*
     * The point of the hock to the ergot.
     */
    hindCannon: number;

    /*
     * The hind pastern and hoof.
     */
    hindDigit: number;
  }

  /*
   * The breeds, each the mean of its rows: the Thoroughbred, against which the
   * horse's bone fractions were measured, the ponies, and the American Mammoth
   * Jackstock, the one donkey breed the rows measure in number (five; the two
   * Mediterranean Miniature Donkeys are recorded and not used), which stands
   * for the donkey. A digit is the pastern's mean plus the hoof's.
   */
  export const BREEDS: Readonly<
    Record<
      | "thoroughbred"
      | "shetland"
      | "welshMountain"
      | "welshPony"
      | "dartmoor"
      | "connemara"
      | "mammothJackstock",
      IBreed
    >
  > = {
    thoroughbred: {
      n: 256,
      withers: 161.4,
      girth: 192.5,
      back: 87.2,
      forearm: 45.4,
      foreCannon: 32.9,
      foreDigit: 11.9 + 8.5,
      gaskin: 58.2,
      hindCannon: 46.5,
      hindDigit: 12.2 + 8.7,
    },
    shetland: {
      n: 24,
      withers: 105.3,
      girth: 135.8,
      back: 58.8,
      forearm: 30.3,
      foreCannon: 19.7,
      foreDigit: 6.4 + 6.4,
      gaskin: 35.8,
      hindCannon: 29.1,
      hindDigit: 7.3 + 6.8,
    },
    welshMountain: {
      n: 7,
      withers: 121.6,
      girth: 151.6,
      back: 66.7,
      forearm: 33.7,
      foreCannon: 24.5,
      foreDigit: 8.6 + 7.6,
      gaskin: 41.0,
      hindCannon: 34.7,
      hindDigit: 8.4 + 7.5,
    },
    welshPony: {
      n: 20,
      withers: 130.7,
      girth: 168.1,
      back: 75.1,
      forearm: 37.5,
      foreCannon: 27.1,
      foreDigit: 8.2 + 7.3,
      gaskin: 48.9,
      hindCannon: 37.8,
      hindDigit: 8.2 + 7.4,
    },
    dartmoor: {
      n: 6,
      withers: 125.7,
      girth: 150.7,
      back: 74.7,
      forearm: 33.2,
      foreCannon: 24.6,
      foreDigit: 11.9 + 7.6,
      gaskin: 48.5,
      hindCannon: 34.6,
      hindDigit: 12.3 + 7.5,
    },
    connemara: {
      n: 33,
      withers: 146.0,
      girth: 180.9,
      back: 76.0,
      forearm: 39.2,
      foreCannon: 28.2,
      foreDigit: 9.5 + 8.9,
      gaskin: 51.8,
      hindCannon: 37.6,
      hindDigit: 9.6 + 9.7,
    },
    mammothJackstock: {
      n: 5,
      withers: 151.1,
      girth: 164.6,
      back: 94.0,
      forearm: 42.2,
      foreCannon: 31.2,
      foreDigit: 13.2 + 7.7,
      gaskin: 50.8,
      hindCannon: 43.9,
      hindDigit: 12.2 + 8.1,
    },
  };

  /*
   * The bone lengths of an equid of a breed, as fractions of the height at the
   * withers: the horse's (`createHorse.LENGTHS`), each measured one scaled by
   * the breed's measure over its withers height against the Thoroughbred's.
   *
   * The horse's fractions were measured on Thoroughbreds (Kubo et al. 1992;
   * Matsuura et al. 2008), so the Thoroughbred's surface measure stands for the
   * bone the fraction measures, and the breed's own measure scales it: the
   * radius by the forearm, the cannons by the cannons, the digits by the
   * pastern and hoof, the tibia by the gaskin and the trunk by the back. The
   * humerus and the femur are measured by no source read (searched: Brooks et
   * al. 2010, which measures neither; pony, donkey and mule osteometry and
   * segment studies, none found), so they keep the horse's fractions:
   * provisional.
   * Parameter breed: The breed.
   * Returns: The bone fractions, in `createHorse.LENGTHS`'s form.
   */
  export function lengths(
    breed: IBreed,
  ): Readonly<QuadrupedProportions.ILengths> {
    const horse: Readonly<QuadrupedProportions.ILengths> = AutoMovieArchetypeHorse.LENGTHS;
    const reference: IBreed = BREEDS.thoroughbred;
    const ratio = (measure: keyof Omit<IBreed, "n" | "withers">): number =>
      breed[measure] / breed.withers / (reference[measure] / reference.withers);
    return {
      fore: [
        horse.fore[0],
        horse.fore[1] * ratio("forearm"),
        horse.fore[2] * ratio("foreCannon"),
        horse.fore[3] * ratio("foreDigit"),
      ],
      hind: [
        horse.hind[0],
        horse.hind[1] * ratio("gaskin"),
        horse.hind[2] * ratio("hindCannon"),
        horse.hind[3] * ratio("hindDigit"),
      ],
      trunk: horse.trunk * ratio("back"),
    };
  }
}
