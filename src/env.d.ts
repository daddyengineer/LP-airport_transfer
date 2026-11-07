/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    utm: string;
    promo: string;
  }
}

interface Window {
  umami?: { track: (event: string) => void };
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
}
