import { verifySecret } from "@/lib/auth/crypto";

export function isPasscodeConfigured(): boolean {
  return Boolean(process.env.PACKY_PASSCODE);
}

export function verifyPasscode(provided: string | null | undefined): boolean {
  return verifySecret(provided, process.env.PACKY_PASSCODE);
}
