# src/perform/HumanPerformanceKey.ts#HumanPerformanceKey.of

## @evidence contracts/development/common.md#meaningful-documentation

Defines the structural key and captured effective mode, undefined-only staged default, ordinary/inherited/non-enumerable access and literal admission before serialization or lookup.

## @evidence contracts/development/implementation.md#principled-implementation

Plain data uses canonical content and behaviour/bodies use identity. The actual spread's own flight value is consumed without rereading its getter; if absent from that copy, one ordinary input.flight read supplies the inherited/non-enumerable effective value. The same normalized capture enters both the key and construction, so no valid or invalid policy can borrow another mode's cached state.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preserve the original spread and performer-body observation order, capture and admit the effective mode once, install it as an own data field in the copied key record and walk that record. Return the admitted scalar beside the key for the sole state consumer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No original property descriptor/prototype inspection, Proxy exception, speculative getter call or trusted policy flag is used. A copied own value is already the actual spread observation; other modes use the ordinary effective lookup. Invalid literals refuse before key serialization or cache lookup, without walking an invalid object's members or borrowing a cached staged state.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the input's plain data; a body is one identity read. Capturing mode adds constant copied-record work and at most one ordinary property lookup when spread did not read it, never an extra enumerable getter invocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The key and constructed state share this exact scalar policy observation, including a stateful getter's first value, while the ordinary unchanged-input premise still governs the rest of memoization.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned record contains only key text and the captured mode scalar. Copied input data is call-local, and identity numbering uses weak keys released with their objects; no caller getter or input is retained in the memo key.
