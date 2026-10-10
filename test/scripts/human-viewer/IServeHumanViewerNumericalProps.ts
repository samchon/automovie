import type { IncomingMessage, ServerResponse } from "node:http";
import type { createHumanViewerNodeService } from "./createHumanViewerNodeService";

/** Request bindings for the existing typed numerical protocol over loopback HTTP. @author Samchon */
export interface IServeHumanViewerNumericalProps {
  url: URL;
  request: IncomingMessage;
  response: ServerResponse;
  service: ReturnType<typeof createHumanViewerNodeService>;
}
