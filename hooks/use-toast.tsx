import { useState } from "react";

// You can implement a simple toast hook like this
export const useToast = () => {
  const [toastList, setToastList] = useState<any[]>([]);

  const toast = (options: { title: string; description: string; variant?: string }) => {
    setToastList((prev) => [
      ...prev,
      { ...options, id: Date.now() },
    ]);
  };

  return { toast, toastList };
};
