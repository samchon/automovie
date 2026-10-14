/**
 * The original 512MiB (536870912-byte) raw-retention ceiling is shared by partial, invalid, cancelled, budget-exhausted and candidate-source planning. It protects durable raw publication, while provider allocation/copying/hashing may happen before this gate and have no corresponding residency bound. The module-owned numeric constant adds constant comparison work without per-call resources or a cached provider result; it preserves the existing publication contract.
 */
export const productionRepaintServiceREPAINT_RAW_OUTPUT_MAXIMUM_BYTES: number = 512 * 1024 * 1024;
