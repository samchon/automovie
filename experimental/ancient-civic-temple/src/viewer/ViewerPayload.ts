import { createViewerPayload } from "./createViewerPayload";


/** Payload the viewer server sends to the browser. */
export type ViewerPayload = ReturnType<typeof createViewerPayload>;
