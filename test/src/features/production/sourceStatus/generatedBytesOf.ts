

/**
 * Return the existing logical compiled payload text.
 *
 * @evidence contracts/testing.md#behavioral-verification Concatenates the unchanged compiled-shot prefix with the supplied source text; createSourceStatusWorld uses it at initialization, compilation and tamper comparison.
 * @evidence contracts/testing.md#independent-expectations The fixed literal prefix and exact supplied source define expected fixture bytes; this arrangement does not assert that an engine compiler emits these words.
 * @evidence contracts/testing.md#distinguishing-cases Current versus older compiled source, hand-edited generated text and compile restoration remain distinct in retention/refusal consumers.
 * @evidence contracts/testing.md#execution-ownership The owning portable unit stores or compares the returned string; this helper opens no resource and executes no production builder.
 */
export const generatedBytesOf: (source: string) => string = (source: string): string =>
  `compiled shot for ${source}`;
