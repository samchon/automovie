/**
 * Twenty-four separately normaled vertices for one six-face box.
 *
 * @evidence contracts/testing.md#behavioral-verification Supplies per-box vertex expectations to the existing inventory and budget assertions without sampling the measured result.
 * @evidence contracts/testing.md#independent-expectations Six faces with four face-local corners each give twenty-four, accounting for distinct normals at shared spatial corners.
 * @evidence contracts/testing.md#distinguishing-cases This is the fixture's indexed box convention, not an eight-shared-vertex mesh or a general model bound; callers own population scaling.
 * @evidence contracts/testing.md#execution-ownership A primitive numerical expectation imported by existing tests, with no case registration, native artifact or browser allocation.
 */
export const BOX_VERTICES: number = 24;
