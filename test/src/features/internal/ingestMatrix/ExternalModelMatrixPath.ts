

/**
 * Index/property path locating one independently mutated field of a test document.
 *
 * This compile-time vocabulary does not execute the inspector or assert behavior.
 * Runtime expectations are independently encoded by the fixture/case owners, not computed by this alias.
 * Boundary enumeration belongs to fact factories; the type alone contributes no executed case.
 * The alias starts no process, host or dynamic unit and has no discoverable test entry.
 *
 * @author Samchon
 */
export type ExternalModelMatrixPath = readonly (number | string)[];
