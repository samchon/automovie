/*
 * Read one admitted accessor element/component as its decoded numeric value.
 */
export type IExternalModelAccessorReader = (
  element: number,
  component: number,
) => number;
