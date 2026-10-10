/**
 * A stage the one-skin person construction has just finished, in the order
 * the stages run.
 *
 * - `body-evaluated`: the body partition is shaped, posed and skinned.
 * - `face-evaluated`: the face partition is constructed with its admission
 *   report.
 * - `skin-formed`: the shared skin of the two partitions is formed, with the
 *   normal reference it needs.
 * - `model-validated`: the composed person passed resident-model validation.
 *
 * A construction is one synchronous call, so a caller that runs it off the
 * main thread cannot be asked whether it is still alive. A stage is the only
 * sign of progress it can give. The stage carries no result: reporting one
 * changes neither the returned construction nor any admission decision, and a
 * construction that throws simply stops reporting.
 *
 * @author Samchon
 */
export type AutoMovieHumanPersonConstructionStage =
  | "body-evaluated"
  | "face-evaluated"
  | "skin-formed"
  | "model-validated";
