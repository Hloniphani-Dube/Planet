import { supabase } from "./supabase";

export class EdgeFunctionError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "EdgeFunctionError";
    this.status = status;
  }
}

export async function invokeFunction<TResponse>(
  name: string,
  body?: Record<string, unknown>,
): Promise<TResponse> {
  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    let message = error.message;
    let status = 500;

    const context = (error as { context?: Response }).context;
    if (context) {
      status = context.status;
      try {
        const parsed = await context.clone().json();
        if (parsed?.error) message = parsed.error;
      } catch {
        // Response wasn't JSON, fall back to the SDK's own error message.
      }
    }

    throw new EdgeFunctionError(message, status);
  }

  return data as TResponse;
}
