/**
 * Read one UTF-8 inspection document under a 16 MiB decoded-byte limit.
 * File size and uncompressed Content-Length bound allocation when supplied;
 * otherwise one bounded buffer accepts chunks without retaining a chunk list.
 * Fatal UTF-8 decoding preserves a BOM as data, so parsing and hashing never
 * silently replace malformed original bytes.
 *
 * @evidence contracts/common.md#principled-implementation A decoded-byte cap admits known sizes before allocation and checks each streamed population before copying. Fatal UTF-8 decoding preserves the exact text-to-byte identity later hashed by the candidate loader.
 * @evidence contracts/common.md#clear-and-simple-design File and HTTP reads share one browser byte reader; JSON parsing, recipe admission and display retain their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unbounded text read, silent UTF-8 replacement, discarded prefix or ignored extra byte supplies an accepted document.
 * @evidence contracts/common.md#meaningful-documentation States decoded-byte limits, trusted-size conditions, UTF-8/BOM behavior, bounded storage and stream cancellation/lock ownership.
 * @evidence contracts/performance.md#efficient-algorithms One O(B) stream copy/decode uses an at-most-16-MiB buffer, without retained chunks or repeated concatenation. Known uncompressed lengths allocate their actual size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each explicit file/response is consumed once without a cross-request result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One reader is acquired, cancelled on failure and unlocked in finally; only decoded text escapes while bounded bytes and the current chunk expire.
 */
export async function readRecoveryViewerDocument(source:File|Response):Promise<string>{
  const maximum:number=16*1024*1024;
  const file:boolean=source instanceof File;
  const stream:ReadableStream<Uint8Array>|null=file?(source as File).stream():(source as Response).body;
  if(stream===null)throw new Error("Inspection document has no readable bytes");
  const reader:ReadableStreamDefaultReader<Uint8Array>=stream.getReader();
  try{
    const response:Response|null=file?null:source as Response;
    if(response&&!response.ok)throw new Error(`Inspection request failed: ${response.status}`);
    const header:string|null=response?.headers.get("content-length")??null;
    const identity:boolean=response===null||!response.headers.get("content-encoding")||response.headers.get("content-encoding")==="identity";
    const declared:number|undefined=file?(source as File).size:identity&&header!==null?Number(header):undefined;
    if(declared!==undefined&&(!Number.isSafeInteger(declared)||declared<1||declared>maximum))
      throw new Error("Inspection document exceeds the admitted byte limit or is empty");
    const bytes:Uint8Array=new Uint8Array(declared??maximum);
    let count:number=0;
    while(true){
      const next:ReadableStreamReadResult<Uint8Array>=await reader.read();
      if(next.done)break;
      if(next.value.byteLength>bytes.length-count)throw new Error("Inspection body exceeds its declared or maximum byte limit");
      bytes.set(next.value,count);count+=next.value.byteLength;
    }
    if(declared!==undefined&&count!==declared)throw new Error("Inspection body is truncated against its declared size");
    return new TextDecoder("utf-8",{fatal:true,ignoreBOM:true}).decode(bytes.subarray(0,count));
  }catch(error:unknown){
    try{await reader.cancel(error);}catch(cleanup:unknown){throw new AggregateError([error,cleanup],"Inspection read and cancellation failed");}
    throw error;
  }finally{reader.releaseLock();}
}
