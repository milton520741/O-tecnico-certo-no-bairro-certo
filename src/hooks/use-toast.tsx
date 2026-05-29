import { toast as sonnerToast, ExternalToast } from "sonner";

export function useToast() {
  return {
    toast: (message: string, options?: ExternalToast) => sonnerToast(message, options),
    success: (message: string, options?: ExternalToast) => sonnerToast.success(message, options),
    error: (message: string, options?: ExternalToast) => sonnerToast.error(message, options),
    loading: (message: string, options?: ExternalToast) => sonnerToast.loading(message, options),
    promise: <T,>(
      promise: Promise<T>,
      messages: { loading: string; success: string; error: string },
      options?: ExternalToast
    ) => sonnerToast.promise(promise, messages, options),
  };
}
