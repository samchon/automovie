

/** Write one JPEG marker segment with its independent length field. */
export const segment = (marker: number, payload: readonly number[]): number[] => [
  0xff,
  marker,
  ((payload.length + 2) >>> 8) & 0xff,
  (payload.length + 2) & 0xff,
  ...payload,
];
