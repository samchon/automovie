import type { AutoMovieArchetypeQuadrupedEars } from "./AutoMovieArchetypeQuadrupedEars";

/**
 * Published ear references transferred explicitly to the current equid bodies.
 *
 * Donkey: Patel et al.2025, Indian Journal of Animal Sciences95:322-328, Table2
 * p326, https://doi.org/10.56093/ijans.v95i4.154768. Male Halari means are ear
 * length28.64, breadth10.64 and withers108.04cm (n28). Its adult table heading
 * and mixed-age methods are not perfectly reconciled; these are reported
 * reference means, not a validated Veracruz population law.
 *
 * Mule: Salamanca-Carreño et al.2020, Animals10:679, TableS1 pp6-7,
 * https://doi.org/10.3390/ani10040679; raw15 mules,7 male/8 female, ages4-22 in
 * these rows. ALC/LORE/ORE are withers/ear length/ear width in cm. The
 * supplement is
 * https://mdpi-res.com/d_attachment/animals/animals-10-00679/article_deploy/animals-10-00679-s001.pdf.
 *
 * Each ratio is length/breadth mean over the SAME donor cohort's height mean.
 * Current Veracruz donkey and Velásquez2020 sex-specific mule h/g/mass remain
 * unchanged. Their ear-only uniform transfer is provisional cross-cohort
 * construction, not measured pairing, individual allometry or a population
 * band.
 *
 * Public only so the package's specs can reach it: it is not part of the
 * authoring surface, and it moves to an internal subpath when one exists.
 */
export namespace AutoMovieArchetypeEquineEarProfiles {
  /** One published adult mule's paired measurements, centimetres. */
  export interface IMule {
    /** Biological sex from TableS1 M/H columns. */
    sex: "male" | "female";
    /** Owner-reported age in years. */
    age: number;
    /** ALC, withers height in centimetres. */
    withers: number;
    /** LORE, complete ear length in centimetres. */
    length: number;
    /** ORE, ear width in centimetres. */
    width: number;
  }

  /**
   * Halari Table2 male reference, n28; unrelated to current Veracruz body
   * survey.
   */
  export const DONKEY: Readonly<{
    withers: number;
    length: number;
    width: number;
  }> = { withers: 108.04, length: 28.64, width: 10.64 };

  /** TableS1 actual15 mule rows, in source order pp6-7; no synthetic animals. */
  export const MULES: readonly Readonly<IMule>[] = [
    { sex: "male", age: 6, withers: 122, length: 19, width: 11.5 },
    { sex: "male", age: 14, withers: 131, length: 21, width: 10 },
    { sex: "male", age: 4, withers: 122, length: 19, width: 10 },
    { sex: "male", age: 4, withers: 122.4, length: 19, width: 9.5 },
    { sex: "male", age: 4, withers: 118, length: 19.5, width: 9 },
    { sex: "male", age: 10, withers: 117, length: 19, width: 10.5 },
    { sex: "male", age: 8, withers: 123, length: 18, width: 7.5 },
    { sex: "female", age: 9, withers: 120.7, length: 20, width: 9.5 },
    { sex: "female", age: 5, withers: 115.8, length: 20, width: 9 },
    { sex: "female", age: 5, withers: 126.5, length: 23.3, width: 11 },
    { sex: "female", age: 10, withers: 132, length: 20.5, width: 11 },
    { sex: "female", age: 22, withers: 128, length: 18, width: 9 },
    { sex: "female", age: 5, withers: 120, length: 19, width: 10 },
    { sex: "female", age: 5, withers: 133, length: 20, width: 10 },
    { sex: "female", age: 8, withers: 125.2, length: 19, width: 8 },
  ];

  /** The male Halari ear reference at the current donkey's height. */
  export function donkey(): AutoMovieArchetypeQuadrupedEars.IProfile {
    return profile(DONKEY.withers, DONKEY.length, DONKEY.width);
  }

  /** Same-sex Araucan ear/height mean ratios on the unchanged current mule body. */
  export function mule(
    sex: "male" | "female",
  ): AutoMovieArchetypeQuadrupedEars.IProfile {
    if (sex !== "male" && sex !== "female")
      throw new RangeError("Unknown mule ear-reference sex");
    let height: number = 0;
    let length: number = 0;
    let width: number = 0;
    for (const row of MULES)
      if (row.sex === sex) {
        height += row.withers;
        length += row.length;
        width += row.width;
      }
    return profile(height, length, width);
  }

  /**
   * Krebs et al. 2021, Pesquisa Agropecuária Brasileira 56:e02148, Table 1 p4,
   * https://doi.org/10.1590/S1678-3921.pab2021.v56.e02148: Campolina horses, 84
   * males and 131 females, ear length 0.180 and 0.183 m at withers 1.566 and
   * 1.533 m. The table's "ear width" (0.65 m) is not a pinna breadth, so no
   * horse pinna breadth is read.
   */
  export const HORSE: Readonly<{
    males: number;
    females: number;
    length: readonly [number, number];
    withers: readonly [number, number];
  }> = {
    males: 84,
    females: 131,
    length: [0.18, 0.183],
    withers: [1.566, 1.533],
  };

  /**
   * The Campolina ear length over its own withers height, with a transferred
   * breadth.
   */
  export function horse(): AutoMovieArchetypeQuadrupedEars.IProfile {
    const count: number = HORSE.males + HORSE.females;
    const height: number =
      (HORSE.males * HORSE.withers[0] + HORSE.females * HORSE.withers[1]) /
      count;
    const length: number =
      (HORSE.males * HORSE.length[0] + HORSE.females * HORSE.length[1]) / count;
    return profile(height, length, (length * DONKEY.width) / DONKEY.length, {
      x: 0.3,
      y: 1,
      z: 0.1,
    });
  }

  /*
   * Ten-to-one planar proxy and the neutral splay are authored geometry, never
   * ear-tissue measurements or biological pose.
   */
  function profile(
    height: number,
    length: number,
    width: number,
    direction: AutoMovieArchetypeQuadrupedEars.IProfile["direction"] = {
      x: 1,
      y: 1,
      z: 0,
    },
  ): AutoMovieArchetypeQuadrupedEars.IProfile {
    return {
      length: length / height,
      width: width / height,
      plateThickness: width / height / 10,
      direction,
    };
  }
}
