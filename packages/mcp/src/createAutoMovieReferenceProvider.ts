import { digest } from "./internal/digest";
import { indexReference } from "./internal/indexReference";
import { parseReference } from "./internal/parseReference";
import { readReference } from "./internal/readReference";
import { MAX_FILES } from "./internal/MAX_FILES";
import { MAX_LAYER_BYTES } from "./internal/MAX_LAYER_BYTES";
import { MAX_SOURCE_BYTES } from "./internal/MAX_SOURCE_BYTES";
import { ReferenceError } from "./internal/ReferenceError";
import { fail } from "./internal/fail";
import {
  admitReferencePath,
  splitReferenceLocation,
} from "./internal/referencePath";
import {
  autoMovieReferenceRequestError,
  parseAutoMovieReferenceRequest,
} from "./referenceRequest";
import type {
  AutoMovieReferenceResult,
  IAutoMovieReferenceLayerIndex,
  IAutoMovieReferenceReader,
} from "./structures/IAutoMovieReference";

/**
 * Bind four stateless reference operations to a read-only source capability.
 *
 * Each request reads current bytes. Layer continuation hashes the complete ordered file revisions observed by that request, without claiming atomicity across files.
 *
 *
 * @evidence contracts/common.md#principled-implementation Strict schemas admit four operations; exact path policy precedes reads, source revisions bind stale checks and continuation, and complete serialized envelopes must fit their declared budget.
 * @evidence contracts/common.md#clear-and-simple-design One stateless dispatcher shares navigation and projection helpers between SDK and local transports without claiming an atomic multi-file snapshot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Oversized sources, duplicate inventory identities, stale revisions and oversized results refuse instead of truncating content or reflecting external exception text.
 * @evidence contracts/common.md#meaningful-documentation The comment states current-source reads and non-atomic continuation; classified failures carry provider-authored recovery text.
 * @evidence contracts/performance.md#efficient-algorithms A layer first copies and sorts the reader's F paths with O(F log F) string comparisons, then checks the 10,000-file ceiling; an injected over-limit list therefore still incurs copy and sort work. Admitted sources total at most 32 MiB and at most 100 page files are parsed. Repeated growing-page JSON serialization costs the sum of page-prefix sizes, quadratic in page length for equal-sized file indices; source parsing and reader I/O are additional delegated costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Within a layer request each copied file's digest is shared by continuation and its parse; no result is reused across independent current-source requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources An admitted layer retains at most 10,000 paths and 32 MiB of copied source bytes plus a page's parsed outputs, current reader buffer and temporary JSON strings. These are not a bound on total transient allocation: the raw injected inventory is copied before its count check, path text has no aggregate ceiling, and parser structures coexist with source copies. Request locals become collectable on success or refusal; the provider closure retains only its caller-supplied reader and opens no handle or background task.
 */
export function createAutoMovieReferenceProvider(
  reader: IAutoMovieReferenceReader,
): (input: unknown) => Promise<AutoMovieReferenceResult> {
  return async (input: unknown) : Promise<AutoMovieReferenceResult> => {
    const request: ReturnType<typeof parseAutoMovieReferenceRequest> = parseAutoMovieReferenceRequest(input);
    if (request === null)
      return {
        ok: false,
        error: autoMovieReferenceRequestError(input),
      };
    try {
      const fits: (data: unknown) => boolean = (data: unknown): boolean =>
        Buffer.byteLength(JSON.stringify({ ok: true, data }), "utf8") <=
        request.budgetBytes;
      const load: (file: string) => ReturnType<typeof parseReference> = async (file: string) : ReturnType<typeof parseReference> => {
        admitReferencePath(file);
        return parseReference(file, await reader.read(file));
      };
      let data: Extract<AutoMovieReferenceResult, { ok: true }>["data"];
      switch (request.operation) {
        case "get_index_of_layer": {
          const paths: string[] = [...(await reader.list(request.layer))].sort(
            (a: string, b: string) : number => Number(a > b) - Number(a < b),
          );
          if (paths.length > MAX_FILES)
            fail("RESOURCE_LIMIT", "Layer exceeds the 10,000 file limit.");
          if (
            new Set(paths).size !== paths.length ||
            paths.some((file: string) : boolean => !file.startsWith(`docs/${request.layer}/`))
          )
            fail(
              "PATH_IDENTITY_CHANGED",
              "Layer inventory contains an aliased or mismatched identity.",
            );
          const files: { file: string; bytes: Uint8Array; revision: string }[] =
            [];
          let sourceBytes: number = 0;
          for (const file of paths) {
            admitReferencePath(file);
            const inputBytes: Uint8Array = await reader.read(file);
            if (inputBytes.byteLength > MAX_SOURCE_BYTES)
              fail("RESOURCE_LIMIT", "Source exceeds the 8 MiB file limit.");
            sourceBytes += inputBytes.byteLength;
            if (sourceBytes > MAX_LAYER_BYTES)
              fail("RESOURCE_LIMIT", "Layer exceeds the 32 MiB source limit.");
            // An injected reader may reuse its buffer on the next read.
            const bytes: Uint8Array = Uint8Array.from(inputBytes);
            files.push({ file, bytes, revision: digest(bytes) });
          }
          const revision: string = digest(
            JSON.stringify(
              files.map(({ file, revision: fileRevision }: {file: string;bytes:Uint8Array;revision:string}): [string,string] => [
                file,
                fileRevision,
              ]),
            ),
          );
          if (
            request.continuation !== undefined &&
            request.continuation.revision !== revision
          )
            fail(
              "STALE_REFERENCE",
              "Layer changed; restart its index without a continuation.",
            );
          const offset: number = request.continuation?.offset ?? 0;
          if (offset > files.length)
            fail(
              "INVALID_CONTINUATION",
              "Continuation offset exceeds this layer; restart the index.",
            );
          const page: IAutoMovieReferenceLayerIndex = {
            layer: request.layer,
            revision,
            atomic: false,
            total: files.length,
            files: [],
            continuation: null,
          };
          const limit: number = Math.min(offset + (request.limit ?? 20), files.length);
          for (let cursor: number = offset; cursor < limit; ++cursor) {
            const item: typeof files[number] = files[cursor];
            page.files.push(
              indexReference(await parseReference(item.file, item.bytes)),
            );
            page.continuation =
              cursor + 1 < files.length
                ? { revision, offset: cursor + 1 }
                : null;
            if (!fits(page)) {
              page.files.pop();
              page.continuation = { revision, offset: cursor };
              if (page.files.length === 0)
                fail(
                  "BUDGET_EXCEEDED",
                  "A file index exceeds the response budget; increase budgetBytes or read a known section directly.",
                );
              break;
            }
          }
          data = page;
          break;
        }
        case "get_index_of_file":
          data = indexReference(await load(request.file));
          break;
        case "read_file_without_annotations":
          data = readReference(await load(request.file), request);
          break;
        case "read_section_without_annotations": {
          const location: ReturnType<typeof splitReferenceLocation> = splitReferenceLocation(request.location);
          data = readReference(await load(location.file), {
            ...request,
            anchor: location.anchor,
          });
          break;
        }
      }
      if (!fits(data))
        fail(
          "BUDGET_EXCEEDED",
          "Result exceeds the response budget; read a smaller section or increase budgetBytes.",
        );
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof ReferenceError
            ? { code: error.code, message: error.message }
            : {
                code: "IO_ERROR",
                message:
                  "Reference read failed; inspect the canonical source and local access permissions.",
              },
      };
    }
  };
}
