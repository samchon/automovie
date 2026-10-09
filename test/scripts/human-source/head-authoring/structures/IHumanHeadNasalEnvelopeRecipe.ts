/** Connected nasal exterior differences in millimetres, zero at source neutral.
 * Sellion and the authored anterior tip support are native correspondence,
 * not clinical nasion/pronasale or inferred cartilage and airway geometry.
 * @author Samchon
 */
export interface IHumanHeadNasalEnvelopeRecipe {
  /** Anterior source-root projection. */
  rootProjectionOffsetMillimetres: number;

  /** Anterior dorsum support projection. */
  dorsumProjectionOffsetMillimetres: number;

  /** Anterior authored tip projection. */
  tipProjectionOffsetMillimetres: number;

  /** Bilateral tip breadth difference. */
  tipBreadthOffsetMillimetres: number;

  /** Superior tip height difference. */
  tipHeightOffsetMillimetres: number;

  /** Anterior source columellar projection. */
  columellarProjectionOffsetMillimetres: number;

  /** Bilateral columellar breadth difference. */
  columellarBreadthOffsetMillimetres: number;

  /** Left alar lateral advancement. */
  leftAlarBreadthOffsetMillimetres: number;

  /** Right alar lateral advancement. */
  rightAlarBreadthOffsetMillimetres: number;

  /** Left alar superior advancement. */
  leftAlarHeightOffsetMillimetres: number;

  /** Right alar superior advancement. */
  rightAlarHeightOffsetMillimetres: number;

  /** Explicit prototype and clinical limitations retained by recipe IO. */
  qualification?: string;
}
