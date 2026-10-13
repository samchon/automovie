/**
 * What a substance _is_, separately from how its surface catches light.
 *
 * {@link IAutoMovieMaterial} answers the optical question and nothing else: a
 * base colour, a roughness, a normal map. That is the right record for a
 * renderer and the wrong one for a wall, because a wall's thickness, weight,
 * warmth, and wear are not properties of an image. Splitting them means one
 * substance can be shown by different surfaces (the same stone polished and
 * flamed) and one surface can stand in for different substances, without either
 * record having to lie about the other.
 *
 * Every physical property is optional and every one is `null` until measured. A
 * production that never runs a thermal or acoustic study leaves them null and
 * loses nothing; a production that does gets its inputs from the same record
 * the geometry cites, rather than from a table kept beside the model.
 *
 * The engine ships no substances. Names, classifications, and values are the
 * production's to author, because a catalogue of real-world materials is
 * content, and content is the customer's.
 */
export interface IAutoMovieMaterialSubstance {
  /** Stable id so a layer can cite this substance. */
  id: string;

  /** Human / LLM readable label, or `null` when unnamed. */
  name: string | null;

  /**
   * Open classification such as `stone`, `timber`, `metal`, `board`, or a
   * production-specific family. Open on purpose: an era, a fiction, or a
   * speculative building brings its own families.
   */
  classification: string;

  /** Bulk density in kg/m³, strictly above zero, or `null` when unmeasured. */
  density: number | null;

  /** Thermal conductivity in W/(m·K), non-negative, or `null`. */
  thermalConductivity: number | null;

  /** Specific heat capacity in J/(kg·K), strictly above zero, or `null`. */
  specificHeat: number | null;

  /** Fractional sound absorption in `[0, 1]`, or `null`. */
  soundAbsorption: number | null;

  /**
   * Dimensionless water-vapour resistance factor (µ), at least `1`, or `null`.
   * `1` is still air; a vapour barrier is in the tens of thousands.
   */
  vapourResistance: number | null;

  /** Expected service life in years, strictly above zero, or `null`. */
  serviceLife: number | null;

  /** {@link IAutoMovieMaterial} id this substance is shown with, or `null`. */
  surface: string | null;
}
