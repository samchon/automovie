/** Author two observable WebVTT cues with fixed independently stated millisecond boundaries. */
export const productionWebVtt = (): Uint8Array =>
  Buffer.from(
    "\uFEFFWEBVTT fixture\n\n00:00:00.000 --> 00:00:00.050\nSignal.\n\n00:00:00.050 --> 00:00:00.100\nAdvance.\n",
    "utf8",
  );
