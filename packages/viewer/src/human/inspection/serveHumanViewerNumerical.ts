import { parse } from "devalue";

import { HumanViewerNodeSourceChangedError } from "./HumanViewerNodeSourceChangedError.js";
import type { IHumanViewerNumericalRequest } from "./IHumanViewerNumericalRequest.js";
import type { IHumanViewerPersistenceCommand } from "./IHumanViewerPersistenceCommand.js";
import type { IServeHumanViewerNumericalProps } from "./IServeHumanViewerNumericalProps.js";

/**
 * Bind owned Node sessions to a lossless event stream and original requests. Closing that stream or deleting its session requests child retirement; termination refusal retains unknown ownership rather than proving computation ended, neither a numerical failure nor a rejected construction is rewritten.
 *
 * @evidence contracts/common.md#principled-implementation Routes actual owned numerical session events, original devalue request projections and DELETE retirement without replacing numerical failure or construction admission.
 * @evidence contracts/common.md#clear-and-simple-design The service retains Node realm/source ownership while this HTTP adapter owns supported methods, message fields and response refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only supported domains/operations, integer correlation and original persistence authority are forwarded; unsupported posts are refused rather than coerced into product requests.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes the event-stream lifetime, original requests and unchanged numerical/admission results; transport completion is not proof of computation admission.
 * @evidence contracts/performance.md#efficient-algorithms Post decoding costs request text bytes and a fixed set of field checks, while numerical work and process termination remain with the service.
 * @evidence contracts/performance.md#reuse-equivalent-work Session ids bind posts to their existing checked realm; equal document text does not share a new process or bypass source-witness checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources POST body listeners/text withdraw on end, abort or response loss and the error listener remains until request close; session streams own child retirement, while request bytes and concurrent posts have no independent cap here.
 */
export function serveHumanViewerNumerical(
  props: IServeHumanViewerNumericalProps,
): boolean {
  const prefix: string = "/numerical/";
  if (!props.url.pathname.startsWith(prefix)) return false;
  const id: string = props.url.pathname.slice(prefix.length);
  const fail: (error: unknown) => void = (error: unknown): void => {
    if (props.response.destroyed || props.response.writableEnded) return;
    props.response.statusCode = 503;
    props.response.setHeader("Content-Type", "text/plain");
    if (error instanceof HumanViewerNodeSourceChangedError)
      props.response.setHeader("X-Human-Viewer-Source-Changed", "true");
    props.response.end(error instanceof Error ? error.message : String(error));
  };
  if (id === "events" && props.request.method === "GET") {
    try {
      props.service.open(props.response);
    } catch (error) {
      fail(error);
    }
    return true;
  }
  if (!/^[0-9a-f-]+$/.test(id)) {
    fail(new Error("The numerical endpoint needs its owned session token."));
    return true;
  }
  if (props.request.method === "DELETE") {
    void props.service
      .close(id)
      .then((): void => {
        props.response.end();
      })
      .catch(fail);
    return true;
  }
  if (props.request.method !== "POST") {
    fail(
      new Error("The numerical endpoint accepts only original message posts."),
    );
    return true;
  }
  let text: string = "";
  props.request.setEncoding("utf8");
  const data: (chunk: string) => void = (chunk: string): void => {
    text += chunk;
  };
  function withdraw(): void {
    props.request.off("data", data);
    props.request.off("end", ended);
    props.request.off("aborted", aborted);
    props.response.off("close", aborted);
  }
  function aborted(): void {
    withdraw();
    text = "";
  }
  function failed(error: Error): void {
    aborted();
    fail(error);
  }
  function closed(): void {
    aborted();
    props.request.off("error", failed);
  }
  function ended(): void {
    withdraw();
    try {
      const value: unknown = parse(text);
      text = "";
      if (value === null || typeof value !== "object")
        throw new Error("A numerical request must be an object.");
      let message:
        | IHumanViewerNumericalRequest
        | IHumanViewerPersistenceCommand;
      if ("persistence" in value) {
        if (value.persistence !== "flush" && value.persistence !== "discard")
          throw new Error("The numerical persistence command is unsupported.");
        const requestId: unknown = "id" in value ? value.id : undefined;
        if (
          requestId !== undefined &&
          (typeof requestId !== "number" || !Number.isInteger(requestId))
        )
          throw new Error(
            "Persistence correlation must be an original integer request id.",
          );
        if (value.persistence === "discard" && requestId === undefined)
          throw new Error("Discard needs its original producing request id.");
        message = { persistence: value.persistence, id: requestId };
      } else {
        if (
          !("id" in value) ||
          typeof value.id !== "number" ||
          !Number.isInteger(value.id) ||
          !("domain" in value) ||
          (value.domain !== "face" &&
            value.domain !== "body" &&
            value.domain !== "person") ||
          !("basis" in value) ||
          typeof value.basis !== "string" ||
          !("input" in value) ||
          value.input === null ||
          typeof value.input !== "object" ||
          !("document" in value.input) ||
          typeof value.input.document !== "string"
        )
          throw new Error(
            "The numerical request has no original domain, source or document.",
          );
        const operation: unknown =
          "operation" in value.input ? value.input.operation : undefined;
        const occlusion: unknown =
          "occlusion" in value.input ? value.input.occlusion : undefined;
        if (
          operation !== undefined &&
          operation !== "preview" &&
          operation !== "construct" &&
          operation !== "exportConstruction" &&
          operation !== "admit"
        )
          throw new Error("The numerical request operation is unsupported.");
        if (occlusion !== undefined && typeof occlusion !== "boolean")
          throw new Error(
            "Numerical occlusion must retain its boolean request meaning.",
          );
        const cache: unknown = "cache" in value ? value.cache : undefined;
        let persistenceAuthority: IHumanViewerNumericalRequest["cache"];
        if (cache !== undefined) {
          if (
            cache === null ||
            typeof cache !== "object" ||
            !("key" in cache) ||
            typeof cache.key !== "string" ||
            !("token" in cache) ||
            typeof cache.token !== "string"
          )
            throw new Error(
              "Preview persistence needs its original catalogue key and generation token.",
            );
          persistenceAuthority = { key: cache.key, token: cache.token };
        }
        message = {
          id: value.id,
          domain: value.domain,
          basis: value.basis,
          input: { document: value.input.document, operation, occlusion },
          cache: persistenceAuthority,
        };
      }
      props.service.post(id, message);
      props.response.end();
    } catch (error) {
      text = "";
      fail(error);
    }
  }
  props.request.on("data", data);
  props.request.once("end", ended);
  props.request.once("aborted", aborted);
  props.request.on("error", failed);
  props.request.once("close", closed);
  props.response.once("close", aborted);
  return true;
}
