import { parse } from "devalue";

import type { IServeHumanViewerNumericalProps } from "./IServeHumanViewerNumericalProps";
import type { IHumanViewerNumericalRequest } from "./IHumanViewerNumericalRequest";
import type { IHumanViewerPersistenceCommand } from "./IHumanViewerPersistenceCommand";

/**
 * Bind owned Node sessions to a lossless event stream and original requests.
 * Closing that stream or deleting its session cancels actual computation;
 * neither a numerical failure nor a rejected construction is rewritten.
 * @evidence contracts/common.md#principled-implementation The pinned shared codec retains typed arrays, backing bytes and scalar distinctions through the existing product protocol.
 * @evidence contracts/common.md#clear-and-simple-design Routes only session lifetime and messages; the Node service owns evaluation and source authority.
 * @evidence contracts/common.md#meaningful-documentation States lossless transport and actual session cancellation.
 */
export function serveHumanViewerNumerical(props: IServeHumanViewerNumericalProps): boolean {
  const prefix = "/numerical/";
  if (!props.url.pathname.startsWith(prefix)) return false;
  const id = props.url.pathname.slice(prefix.length);
  const fail = (error: unknown): void => {
    props.response.statusCode = 503;
    props.response.setHeader("Content-Type", "text/plain");
    props.response.end(error instanceof Error ? error.message : String(error));
  };
  if (id === "events" && props.request.method === "GET") {
    try { props.service.open(props.response); } catch (error) { fail(error); }
    return true;
  }
  if (!/^[0-9a-f-]+$/.test(id)) {
    fail(new Error("The numerical endpoint needs its owned session token."));
    return true;
  }
  if (props.request.method === "DELETE") {
    void props.service.close(id).then(() => props.response.end()).catch(fail);
    return true;
  }
  if (props.request.method !== "POST") {
    fail(new Error("The numerical endpoint accepts only original message posts."));
    return true;
  }
  let text = "";
  props.request.setEncoding("utf8");
  props.request.on("data", (chunk: string) => { text += chunk; });
  props.request.once("error", fail);
  props.request.once("end", () => {
    try {
      const value: unknown = parse(text);
      if (value === null || typeof value !== "object")
        throw new Error("A numerical request must be an object.");
      let message: IHumanViewerNumericalRequest | IHumanViewerPersistenceCommand;
      if ("persistence" in value) {
        if (value.persistence !== "flush" && value.persistence !== "discard")
          throw new Error("The numerical persistence command is unsupported.");
        const requestId = "id" in value ? value.id : undefined;
        if (requestId !== undefined && (typeof requestId !== "number" || !Number.isInteger(requestId)))
          throw new Error("Persistence correlation must be an original integer request id.");
        if (value.persistence === "discard" && requestId === undefined)
          throw new Error("Discard needs its original producing request id.");
        message = { persistence: value.persistence, id: requestId };
      } else {
        if (!("id" in value) || typeof value.id !== "number" || !Number.isInteger(value.id) ||
            !("domain" in value) || (value.domain !== "face" && value.domain !== "body" && value.domain !== "person") ||
            !("basis" in value) || typeof value.basis !== "string" ||
            !("input" in value) || value.input === null || typeof value.input !== "object" ||
            !("document" in value.input) || typeof value.input.document !== "string")
          throw new Error("The numerical request has no original domain, source or document.");
        const operation = "operation" in value.input ? value.input.operation : undefined;
        const occlusion = "occlusion" in value.input ? value.input.occlusion : undefined;
        if (operation !== undefined && operation !== "preview" && operation !== "construct" && operation !== "admit")
          throw new Error("The numerical request operation is unsupported.");
        if (occlusion !== undefined && typeof occlusion !== "boolean")
          throw new Error("Numerical occlusion must retain its boolean request meaning.");
        const cache = "cache" in value ? value.cache : undefined;
        let persistenceAuthority: IHumanViewerNumericalRequest["cache"];
        if (cache !== undefined) {
          if (cache === null || typeof cache !== "object" ||
              !("key" in cache) || typeof cache.key !== "string" ||
              !("token" in cache) || typeof cache.token !== "string")
            throw new Error("Preview persistence needs its original catalogue key and generation token.");
          persistenceAuthority = { key: cache.key, token: cache.token };
        }
        message = {
          id: value.id, domain: value.domain, basis: value.basis,
          input: { document: value.input.document, operation, occlusion },
          cache: persistenceAuthority,
        };
      }
      props.service.post(id, message);
      props.response.end();
    } catch (error) { fail(error); }
  });
  return true;
}
