"use client";

import { useEffect } from "react";

// Static export + basePath: sw.js and its scope must be rooted at the
// configured basePath (see next.config.ts), same reasoning as page.tsx's
// fetch calls.
const BASE_PATH = "/lottery-time-machine";

export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` }).catch(() => {
      // offline support is a progressive enhancement — ignore registration failures
    });
  }, []);

  return null;
}
