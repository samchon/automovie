import type { IncomingMessage, ServerResponse } from "node:http";
import type { createHumanViewerNodeService } from "./createHumanViewerNodeService.js";

/**
 * Request bindings for the existing typed numerical protocol over loopback HTTP.
 *
 * @evidence contracts/common.md#principled-implementation The loopback numerical route passes the existing typed service protocol through one HTTP request/response binding.
 * @evidence contracts/common.md#clear-and-simple-design One service reference keeps computation and numerical-worker lifetime outside the HTTP transport record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The route's bindings declare no substitute model builder or untyped result-production path.
 * @evidence contracts/common.md#meaningful-documentation Defines the request URL, inbound/outbound transport and existing numerical service authority.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state The loopback numerical route passes the existing typed service protocol through one HTTP request/response binding.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor One service reference keeps computation and numerical-worker lifetime outside the HTTP transport record.
 * @author Samchon
 */
export interface IServeHumanViewerNumericalProps {
  /**
   * Parsed request URL selecting the numerical session or event route.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Parsed request URL selecting the numerical session or event route. The loopback numerical route passes the existing typed service protocol through one HTTP request/response binding.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Parsed request URL selecting the numerical session or event route. One service reference keeps computation and numerical-worker lifetime outside the HTTP transport record.
   */
  url: URL;

  /**
   * Original incoming HTTP request carrying the typed protocol message.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Original incoming HTTP request carrying the typed protocol message. The loopback numerical route passes the existing typed service protocol through one HTTP request/response binding.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Original incoming HTTP request carrying the typed protocol message. One service reference keeps computation and numerical-worker lifetime outside the HTTP transport record.
   */
  request: IncomingMessage;

  /**
   * Response or owned event stream returned for this numerical request.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Response or owned event stream returned for this numerical request. The loopback numerical route passes the existing typed service protocol through one HTTP request/response binding.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Response or owned event stream returned for this numerical request. One service reference keeps computation and numerical-worker lifetime outside the HTTP transport record.
   */
  response: ServerResponse;

  /**
   * Existing numerical service owning typed sessions, evaluation and source authority.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Existing numerical service owning typed sessions, evaluation and source authority. The loopback numerical route passes the existing typed service protocol through one HTTP request/response binding.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Existing numerical service owning typed sessions, evaluation and source authority. One service reference keeps computation and numerical-worker lifetime outside the HTTP transport record.
   */
  service: ReturnType<typeof createHumanViewerNodeService>;
}
