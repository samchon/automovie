import { humanoidDocument } from "./humanoidDocument";
import { humanoidPayload } from "./humanoidPayload";
import { rejects } from "./rejects";

/**
 * Apply a supplied byte mutation and assert the public humanoid profile refusal.
 */
export const rejectsHumanoidPayload: (
  mutate: (payload: Buffer) => void,
  message: string,
) => boolean = (
  mutate: (payload: Buffer) => void,
  message: string,
): boolean => {
  const payload: Buffer = humanoidPayload();
  mutate(payload);
  return rejects(
    humanoidDocument(),
    message,
    "gltf-humanoid-v1",
    (uri: string): Uint8Array | null => (uri === "human.bin" ? payload : null),
  );
};
