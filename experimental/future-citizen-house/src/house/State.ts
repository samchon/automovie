/** Switchable occupancy state the house is built for; each combination builds its own environment. */
export type State = {
  /** Glazing mode: clear daytime glass, or the darker private and night tint. */
  privacy: "day" | "private" | "night";

  /** Flex workroom mode: the Murphy bed closed for work, or lowered for a guest. */
  flex: "work" | "guest";
};
