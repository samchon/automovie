/**
 * The original module-lifetime uncancelled signal is allocated once from an unexposed AbortController and reused only when the request has no outer cancellation signal. It preserves the injected wait signature without fabricating cancellation; each actual wait owns its listener and must remove it when finished. The signal is constant-size retained state rather than an in-flight result cache or provider task, and its allocation does not bound a caller-supplied wait's settlement.
 */
export const repaintExecutionNEVER_ABORTED_SIGNAL: AbortSignal = new AbortController().signal;
