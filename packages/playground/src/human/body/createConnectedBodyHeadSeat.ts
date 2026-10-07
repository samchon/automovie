import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import { createHumanWorker } from "../common/createHumanWorker";
import { serializeHumanBodyBasisDocument } from "@automovie/human/body/document/serializeHumanBodyBasisDocument";
import * as THREE from "three";

import { createHumanResidentPort } from "../common/residentPort";
import { createHumanResidentWorker } from "../common/residentWorker";
import type { ConnectedBodyRequest } from "./ConnectedBodyRequest";
import type { ConnectedBodyResult } from "./ConnectedBodyResult";
import { createConnectedBodyRenderer } from "./connectedBodyRenderer";
import type { IConnectedBodyHeadSeatProps } from "./IConnectedBodyHeadSeatProps";

/**
 * Seat the person generation's head on the edited body. The head is the head
 * view with the default face, evaluated with the current body document in its
 * own resident worker; only its `face:` parts come back and they sit in the
 * body's frame. A later body supersedes an earlier answer. Hiding the head
 * says that the top of the neck still follows the default head's carried
 * position, because one-sided neck channels meet that carry at the cut. A
 * head that cannot be built is appended to the status line and body editing
 * continues without it.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Seats the companion head on the edited body in its own worker and keeps body editing alive when the head cannot be built.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Shows or hides the companion head as display state outside the document and reports a head failure on the status line.
 * @author Samchon
 */
export function createConnectedBodyHeadSeat(props: IConnectedBodyHeadSeatProps): (model: unknown, body: IAutoMovieHumanBodyBasisDocument) => void {
  const worker = createHumanResidentWorker<ConnectedBodyRequest, ConnectedBodyResult>(() =>
    createHumanResidentPort(createHumanWorker("worker=body-head")),
  );
  const renderer = createConnectedBodyRenderer({
    loadTexture: (asset) => new THREE.TextureLoader().loadAsync(asset),
    maxAnisotropy: 8,
  });
  let sequence = 0;
  // the head view loads in its worker before the first head can be shown
  let shown = false;
  return (model, body) => {
    const mine = ++sequence;
    if (model === null) {
      props.viewport().companion.show(undefined);
      props.status("Head hidden: the top of the neck still follows the default head's carried position.");
      return;
    }
    if (!shown) props.preparing?.(true);
    // This runs after the panel has written this body's status, so a head
    // failure is appended to that line rather than overwritten by it.
    void worker
      .request({ operation: "preview", document: serializeHumanBodyBasisDocument(body, props.source), measure: false })
      .result.then(async (result) => {
        if (mine !== sequence) return;
        if (result.operation !== "preview") throw new Error("Expected a head preview.");
        const frame = await renderer.prepare(result.model);
        if (mine !== sequence) {
          renderer.dispose(frame);
          return;
        }
        props.viewport().companion.show(renderer.publish(frame));
        props.viewport().companion.place(new THREE.Matrix4());
        shown = true;
        props.preparing?.(false);
      })
      .catch((error: unknown) => {
        if (mine !== sequence) return;
        props.preparing?.(false);
        props.status("Head unavailable: " + (error instanceof Error ? error.message : String(error)));
      });
  };
}
