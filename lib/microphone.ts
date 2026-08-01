export type MicrophoneFailure = {
  kind: "blocked" | "missing" | "unavailable" | "panel" | "unknown";
  message: string;
  action: string;
};

export function microphoneFailure(reason: unknown): MicrophoneFailure {
  const name = reason instanceof DOMException ? reason.name : reason instanceof Error ? reason.name : "";

  switch (name) {
    case "NotAllowedError":
      return {
        kind: "blocked",
        message: "Microphone access is blocked in Chrome.",
        action: "Open this site's controls in the address bar, set Microphone to Allow, then try again.",
      };
    case "NotFoundError":
      return {
        kind: "missing",
        message: "Chrome could not find a microphone.",
        action: "Connect or enable a microphone, then try again.",
      };
    case "NotReadableError":
      return {
        kind: "unavailable",
        message: "Your microphone is busy or unavailable.",
        action: "Close other apps using it, then try again.",
      };
    case "SecurityError":
      return {
        kind: "panel",
        message: "Microphone access is not enabled in this extension panel.",
        action: "Install the latest Annotated extension package, then try again.",
      };
    default:
      return {
        kind: "unknown",
        message: "Chrome could not start the microphone.",
        action: "Check Chrome's microphone permission and try again.",
      };
  }
}

export function microphoneIsDelegated(documentValue: Document) {
  const policyDocument = documentValue as Document & {
    permissionsPolicy?: { allowsFeature(feature: string): boolean };
    featurePolicy?: { allowsFeature(feature: string): boolean };
  };
  const policy = policyDocument.permissionsPolicy || policyDocument.featurePolicy;
  return !policy || policy.allowsFeature("microphone");
}
