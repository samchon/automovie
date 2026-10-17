/**
 * PIP skin breadth over hand breadth, sex-pooled ratios from Greiner 1991, NATICK/TR-92/011: index 19.9/79.5 and 23.0/90.4 mm, middle 19.3/79.5 and 22.5/90.4, ring 18.4/79.5 and 21.4/90.4, little 16.5/79.5 and 19.2/90.4. Grade: measured, ratios derived.
 *
 * The skeleton uses these also as MCP skin-breadth proxies, following the explicit modelling assumption of Rogers et al. 2008, Ergonomics 51:511-526, section 2.5.2, https://stacks.cdc.gov/view/cdc/188402/cdc_188402_DS1.pdf; that use is conventional rather than a measurement of metacarpal heads. Adult ratios are held across ages.
 */
export const AUTOMOVIE_HUMAN_FINGER_JOINT_BREADTH: {
  readonly Index: 0.252;
  readonly Middle: 0.246;
  readonly Ring: 0.234;
  readonly Little: 0.21;
} = {
  Index: 0.252,
  Middle: 0.246,
  Ring: 0.234,
  Little: 0.21,
} as const;
