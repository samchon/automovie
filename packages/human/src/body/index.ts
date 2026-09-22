/**
 * The body below the neck: a connected basis with joints, its documents and
 * its millimetre measurements. It reuses the face's region splitter, normal
 * reconstruction and text envelope rather than copying them, and shares the
 * face's frame so the two bases meet at the neck ring by vertex identity.
 */
export * from "./basis";
export * from "./constants";
export * from "./document";
export * from "./export";
export * from "./measure";
export * from "./simple";
export * from "./structures";
