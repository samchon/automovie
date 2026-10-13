import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { IAutoMovieReferenceReader } from "./structures/IAutoMovieReference";


/**
 * Startup dependencies separated from the server's reference dispatch.
 *
 * @evidence contracts/common.md#principled-implementation Reader, server and stdio transport capabilities describe startup effects without adding request-time root changes.
 * @evidence contracts/common.md#clear-and-simple-design Startup is separable from reference dispatch through three required effect owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The transport contract exposes stdio connection rather than a network listener.
 * @evidence contracts/common.md#meaningful-documentation Members state root binding, installed version and transport ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased startup-port type acquires no transport; startAutoMovieMcpServer invokes its reader, server and transport capabilities, so acquisition and connection lifetime belong to that operation and its eventual caller.
 *
 * @author Samchon
 */
export interface IAutoMovieMcpStartupRuntime {

  /** Bind the startup root once; tool requests never supply a replacement root.
   *
   * @evidence contracts/common.md#principled-implementation An explicit root is bound once by the startup reader capability before tool requests are registered.
   * @evidence contracts/common.md#clear-and-simple-design Root admission stays with the reader rather than transport callbacks.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Requests cannot substitute a different physical root through this port.
   * @evidence contracts/common.md#meaningful-documentation The member documents initial root binding and asynchronous reader transfer.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no runtime algorithm; the supplied concrete operation owns traversal and I/O costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This capability declaration coordinates no cache; the owning operation decides when effects and observations may be reused.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The startup caller receives a bound reader; createAutoMovieReferenceReader retains pinned path observations and opens no descriptor during binding. Its later read operation owns finally-block close attempts, whose rejection cannot prove physical release.
   */
  reader(root: string): Promise<IAutoMovieReferenceReader>;

  /** Register only reference tools using the bound reader and installed package version.
   *
   * @evidence contracts/common.md#principled-implementation A bound reader and installed package version determine one SDK server capability.
   * @evidence contracts/common.md#clear-and-simple-design Server identity and reference registration stay with server construction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The port receives actual read-only capability rather than a generated tool-answer fixture.
   * @evidence contracts/common.md#meaningful-documentation The member documents reference-only registration and installed version identity.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no runtime algorithm; the supplied concrete operation owns traversal and I/O costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This capability declaration coordinates no cache; the owning operation decides when effects and observations may be reused.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned server transfers to startup, which connects it and later transfers connection lifetime to its caller.
   */
  server(reader: IAutoMovieReferenceReader, version: string): McpServer;

  /** Supply the stdio connection without opening a network listener.
   *
   * @evidence contracts/common.md#principled-implementation One stdio transport capability supplies the connection for startup.
   * @evidence contracts/common.md#clear-and-simple-design Transport acquisition is separate from document reading and tool policy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This contract supplies stdio rather than a network authoring surface.
   * @evidence contracts/common.md#meaningful-documentation The member identifies the stdio connection requirement.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no runtime algorithm; the supplied concrete operation owns traversal and I/O costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This capability declaration coordinates no cache; the owning operation decides when effects and observations may be reused.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The connected SDK server owns the supplied transport after startup; caller shutdown owns release.
   */
  transport(): StdioServerTransport;
}
