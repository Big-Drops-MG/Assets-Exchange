import { customAlphabet } from "nanoid";

export const generateTrackingCode = (): string => {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nanoid = customAlphabet(alphabet, 8);
  return nanoid();
};
