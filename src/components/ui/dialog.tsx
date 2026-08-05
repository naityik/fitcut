import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/**
 * Sheet on phones, centred panel on desktop — same component, because the
 * content is identical and only the entry gesture differs.
 */
export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { title: string; description?: string }
>(({ className, children, title, description, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 flex flex-col bg-surface shadow-lift focus:outline-none",
        "inset-x-0 bottom-0 max-h-[92vh] rounded-t-3xl",
        "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[440px] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
        className,
      )}
      {...props}
    >
      <div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-line sm:hidden" />
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
        <div>
          <DialogPrimitive.Title className="font-display text-lg font-bold tracking-[-0.01em]">
            {title}
          </DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="mt-0.5 text-[13px] text-muted">
              {description}
            </DialogPrimitive.Description>
          )}
        </div>
        <DialogPrimitive.Close className="-mr-1 rounded-lg p-1.5 text-faint transition-colors hover:bg-ink/5 hover:text-ink">
          <X className="h-4 w-4" strokeWidth={2.2} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </div>
      <div className="safe-bottom overflow-y-auto px-5 pb-5">{children}</div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";
