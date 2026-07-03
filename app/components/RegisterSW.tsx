"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // offline support is a progressive enhancement — ignore registration failures
    });
  }, []);

  return null;
}
