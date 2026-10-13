

/**
 * Case-insensitive Windows device basenames remain reserved with extensions and are refused by declared-path admission.
 */
export const AUTOMOVIE_DERIVED_ARTIFACT_WINDOWS_DEVICE: RegExp = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9]|conin\$|conout\$)(?:\.|$)/iu;
