import { Assembly } from "../house/Assembly";
import { front } from "../house/envelope/front";
import { left } from "../house/envelope/left";
import { rear } from "../house/envelope/rear";
import { right } from "../house/envelope/right";
import { roof } from "../house/envelope/roof";

/** Complete exterior surfaces, cut profiles and measured repeating assemblies.
 */
export function envelope(a: Assembly): void {
  front(a);
  rear(a);
  left(a);
  right(a);
  roof(a);
}
