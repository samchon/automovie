interface IBinary64Dyadic {
  significand: bigint;
  exponent: number;
}

/* Decode a finite double as a signed integer times a power of two. */
export function decomposeFiniteBinary64(value: number): IBinary64Dyadic {
  VIEW.setFloat64(0, value, false);
  const bits: bigint = VIEW.getBigUint64(0, false);
  const biasedExponent: number = Number((bits >> 52n) & 0x7ffn);
  const fraction: bigint = bits & ((1n << 52n) - 1n);
  // IEEE 754 binary64 normals have an implicit leading bit. Subnormals share
  // the least exponent, including signed zero.
  const significand: bigint =
    biasedExponent === 0 ? fraction : fraction | (1n << 52n);
  return {
    significand: bits >> 63n === 0n ? significand : -significand,
    exponent: biasedExponent === 0 ? -1074 : biasedExponent - 1075,
  };
}

// Each call writes and reads this cell synchronously without user callbacks.
const VIEW: DataView = new DataView(new ArrayBuffer(8));
