import type { HealthStatus } from "./types";

export const healthLabels: Record<HealthStatus, string> = {
  healthy: "Healthy",
  needs_attention: "Needs attention",
  critical: "Critical",
  unknown: "Unclear from this photo",
};

export const healthDotColor: Record<HealthStatus, string> = {
  healthy: "bg-green-500",
  needs_attention: "bg-yellow-400",
  critical: "bg-red-500",
  unknown: "bg-neutral-300",
};
