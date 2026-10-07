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
 * @evidence contracts/common.md#principled-implementation The stages follow the construction's data dependence: body, then the face that reads its endpoint gains, then the shared skin, then validation of the composed model.
 * @evidence contracts/common.md#clear-and-simple-design A closed set of four names; no payload, timing or percentage is carried.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A stage is reported for every document alike and decides nothing.
 * @evidence contracts/common.md#meaningful-documentation States what each stage has finished and that a stage is progress, not a result.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A stage names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels A stage is not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A stage emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions A stage carries no value in a unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries A stage builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation A stage is not displayed geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A stage carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range A stage admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A stage is not an authoring input.
 * @author Samchon
 */
export type AutoMovieHumanPersonConstructionStage =
  | "body-evaluated"
  | "face-evaluated"
  | "skin-formed"
  | "model-validated";
