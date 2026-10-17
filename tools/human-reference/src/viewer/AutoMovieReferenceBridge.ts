import { validateModel } from "../../../../packages/engine/src/validation/validateModel.ts";
import { buildModel } from "../../../../packages/viewer/src/buildModel.ts";
import { captureViewerSnapshot } from "../../../../packages/viewer/src/captureViewerSnapshot.ts";
import { collectAutoMovieOwnedResources } from "../../../../packages/viewer/src/collectAutoMovieOwnedResources.ts";
import { createAutoMovieResourceRetirement } from "../../../../packages/viewer/src/createAutoMovieResourceRetirement.ts";
import { mountViewer } from "../../../../packages/viewer/src/mountViewer.ts";
import { renderAutoMovieScenePass } from "../../../../packages/viewer/src/renderAutoMovieScenePass.ts";
import { comparisonModel } from "./comparisonModel.ts";
import { referenceModel } from "./referenceModel.ts";

/**
 * Exposes the original repository producers to the research browser without replacing their draw or capture methods.
 * Model realization reaches buildGeometry through buildModel, rendering stays in the mounted viewer, and captures call its original composite producer.
 * The browser bundle records these source imports separately from generated model provenance; this bridge does not establish engine surface generation.
 */
export const AutoMovieReferenceBridge: {
  createAutoMovieResourceRetirement: typeof createAutoMovieResourceRetirement;
  comparisonModel: typeof comparisonModel;
  referenceModel: typeof referenceModel;
  buildModel: typeof buildModel;
  captureViewerSnapshot: typeof captureViewerSnapshot;
  collectAutoMovieOwnedResources: typeof collectAutoMovieOwnedResources;
  mountViewer: typeof mountViewer;
  renderAutoMovieScenePass: typeof renderAutoMovieScenePass;
  validateModel: typeof validateModel;
} = {
  createAutoMovieResourceRetirement,
  comparisonModel,
  referenceModel,
  buildModel,
  captureViewerSnapshot,
  collectAutoMovieOwnedResources,
  mountViewer,
  renderAutoMovieScenePass,
  validateModel,
};
