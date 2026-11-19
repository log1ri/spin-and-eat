import * as DialogPrimitive from '@radix-ui/react-dialog'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description
export const DialogClose = DialogPrimitive.Close

/** Bottom sheet: the page behind dims + slight blur — used for the menu library */
export const DialogSheet = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="sheet-overlay fixed inset-0 z-50">
      {/* Solid strip under the clock bar: Safari paints the status bar from the topmost element's opaque background-color (it skips the translucent overlay) */}
      <div aria-hidden="true" className="sheet-statusbar" />
    </DialogPrimitive.Overlay>
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[560px] flex-col rounded-t-[28px] outline-none',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
DialogSheet.displayName = 'DialogSheet'
