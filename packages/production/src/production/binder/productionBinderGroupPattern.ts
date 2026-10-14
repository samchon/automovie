/**
 * Supported group-directory spelling is exactly three digits followed by lowercase hyphen-separated slug components. The shared nonglobal pattern supports filtering and numeric tie-breaking without inspecting prose meaning or retaining names.
 */
export const productionBinderGroupPattern: RegExp = /^([0-9]{3})-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
