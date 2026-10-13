import { AUTOMOVIE_CANONICAL_JSON_PROTOCOL } from "./AUTOMOVIE_CANONICAL_JSON_PROTOCOL";

/** Inspect the engine's current canonical JSON representation and encoding domain. */
export const AUTOMOVIE_CANONICAL_JSON_DOMAIN: Readonly<{
    /** Exact canonical algorithm identity used by the shared engine. */
    protocol: typeof AUTOMOVIE_CANONICAL_JSON_PROTOCOL;

    /** Non-array objects require plain/null prototypes; admitted containers must be acyclic. */
    containers: "plain-acyclic";

    /** An absent own array index has the canonical null spelling. */
    arrayHoles: "null";

    /** Unsupported present array values also use null. */
    arrayUnsupportedValues: "null";

    /** Unsupported object member values are omitted after key admission. */
    objectUnsupportedValues: "omit";

    /** Numeric values must be finite before ordinary JSON number encoding. */
    numbers: "finite-json";

    /** Scalar strings keep their exact sequence without Unicode normalization. */
    unicode: "exact-scalar-sequence";

    /** Own object keys sort by locale-independent UTF-16 units. */
    keyOrder: "utf16-code-unit";

    /** Canonical scalar-safe JSON text becomes UTF-8 bytes for hashing. */
    encoding: "utf-8";
}> = Object.freeze({
    protocol: AUTOMOVIE_CANONICAL_JSON_PROTOCOL,
    containers: "plain-acyclic",
    arrayHoles: "null",
    arrayUnsupportedValues: "null",
    objectUnsupportedValues: "omit",
    numbers: "finite-json",
    unicode: "exact-scalar-sequence",
    keyOrder: "utf16-code-unit",
    encoding: "utf-8",
} as const);
