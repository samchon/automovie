
/** Finish for each axis-facing side of a box; an omitted side keeps the default finish. */
export type FaceFinishes = Partial<Record<"x-" | "x+" | "y-" | "y+" | "z-" | "z+", string>>;
