export type Portal = {
  id: string;
  wall: string;
  from: string;
  to: string;
  center: number;
  width: number;
  height: number;
  pocket?: boolean;
  passage?: boolean;
};
