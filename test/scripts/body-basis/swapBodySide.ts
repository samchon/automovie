

/** A name with its side swapped: `left` and `right`, `Left` and `Right`, wherever they occur. */
export function swapBodySide(name: string): string {
  return name.replace(/left|right|Left|Right/g, (side) => {
    switch (side) {
      case "left":
        return "right";
      case "right":
        return "left";
      case "Left":
        return "Right";
      default:
        return "Left";
    }
  });
}
