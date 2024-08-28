import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { api } from "./comfyapp";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurWorkflowID(): string | null {
  return api.getCurWorkflowID();
}
export function setCurWorkflowID(id: string | null) {
  api.setCurWorkflowID(id);
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  setTimeout(function () {
    a.remove();
    window.URL.revokeObjectURL(url);
  }, 0);
}
