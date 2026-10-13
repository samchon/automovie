/**
 * The Playground inspection application's initial neutral reference example.
 * The generic viewer parser receives this choice from the application instead
 * of choosing a named preset for every consumer.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Chooses the Playground's initial face example for the application viewer.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Keeps initial example selection in the application while the generic address parser admits display fields.
 */
export const humanViewerDefaultDocument = "connected-reference";
