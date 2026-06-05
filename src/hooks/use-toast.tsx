import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastFn = ((message: string, options?: ExternalToast) => string | number) & {
  success: (message: string, options?: ExternalToast) => string | number;
  error: (message: string, options?: ExternalToast) => string | number;
  loading: (message: string, options?: ExternalToast) => string | number;
  info: (message: string, options?: ExternalToast) => string | number;
  warning: (message: string, options?: ExternalToast) => string | number;
  message: (message: string, options?: ExternalToast) => string | number;
  promise: typeof sonnerToast.promise;
  dismiss: typeof sonnerToast.dismiss;
};

const toast = ((message: string, options?: ExternalToast) =>
  sonnerToast(message, options)) as ToastFn;
toast.success = (m, o) => sonnerToast.success(m, o);
toast.error = (m, o) => sonnerToast.error(m, o);
toast.loading = (m, o) => sonnerToast.loading(m, o);
toast.info = (m, o) => sonnerToast.info(m, o);
toast.warning = (m, o) => sonnerToast.warning(m, o);
toast.message = (m, o) => sonnerToast.message(m, o);
toast.promise = sonnerToast.promise.bind(sonnerToast) as typeof sonnerToast.promise;
toast.dismiss = sonnerToast.dismiss.bind(sonnerToast) as typeof sonnerToast.dismiss;

export { toast };

export function useToast() {
  return { toast };
}
