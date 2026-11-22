"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface ExtractionStatus {
  isExtracting: boolean;
  activeQuery: string;
  activeTabId: number | null;
  limit?: number;
  collectedInSession?: number;
  platform?: string;
}

export interface ExtensionBridgeStatus {
  isInstalled: boolean;
  version: string | null;
  isChecking: boolean;
  isTriggering: boolean;
  isSyncing: boolean;
  extractionStatus: ExtractionStatus | null;
  checkConnection: () => void;
  syncExtension: () => Promise<void>;
  triggerSearch: (params: {
    query: string;
    platform?: "Google Maps" | "Facebook" | "LinkedIn" | "Instagram";
    limit?: number;
  }) => Promise<{ success: boolean; message?: string }>;
}

export function useExtensionBridge(): ExtensionBridgeStatus {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [version, setVersion] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus | null>(null);

  const resolveTriggerRef = useRef<((val: { success: boolean; message?: string }) => void) | null>(null);
  const triggerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkConnection = useCallback(() => {
    if (typeof window === "undefined") return;
    setIsChecking(true);

    window.postMessage(
      {
        source: "GM_DASHBOARD",
        type: "PING",
      },
      "*"
    );

    // If no response within 1.5s, mark as not connected
    setTimeout(() => {
      setIsChecking(false);
    }, 1500);
  }, []);

  const syncExtension = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve();
      setIsSyncing(true);

      window.postMessage(
        {
          source: "GM_DASHBOARD",
          type: "SYNC",
        },
        "*"
      );

      // Brief animation time
      setTimeout(() => {
        setIsSyncing(false);
        resolve();
      }, 700);
    });
  }, []);

  // Message listener for Extension communication
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {
      // Must come from current window and our extension source
      if (event.source !== window || !event.data || event.data.source !== "GM_EXTENSION") {
        return;
      }

      const { type, version: extVersion, success, error, extractionStatus: extStatus } = event.data;

      // Pong response: extension is active
      if (type === "PONG" || type === "SYNC_DONE") {
        setIsInstalled(true);
        setVersion(extVersion || "1.0.0");
        setIsChecking(false);
        if (extStatus) {
          setExtractionStatus(extStatus);
        }
      }

      // Search Trigger acknowledgement
      if (type === "SEARCH_TRIGGERED") {
        setIsTriggering(false);
        if (triggerTimeoutRef.current) {
          clearTimeout(triggerTimeoutRef.current);
          triggerTimeoutRef.current = null;
        }

        if (resolveTriggerRef.current) {
          resolveTriggerRef.current({
            success: !!success,
            message: success
              ? "Extraction initiated! A new tab has opened in your browser."
              : error || "Failed to trigger search in extension.",
          });
          resolveTriggerRef.current = null;
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Initial check
    checkConnection();

    // Periodic gentle heartbeat every 5 seconds to keep live extraction status refreshed
    const interval = setInterval(() => {
      window.postMessage(
        {
          source: "GM_DASHBOARD",
          type: "PING",
        },
        "*"
      );
    }, 5000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(interval);
      if (triggerTimeoutRef.current) {
        clearTimeout(triggerTimeoutRef.current);
      }
    };
  }, [checkConnection]);

  const triggerSearch = useCallback(
    ({
      query,
      platform = "Google Maps",
      limit = 50,
    }: {
      query: string;
      platform?: "Google Maps" | "Facebook" | "LinkedIn" | "Instagram";
      limit?: number;
    }) => {
      return new Promise<{ success: boolean; message?: string }>((resolve) => {
        if (typeof window === "undefined") {
          return resolve({ success: false, message: "Window environment not available." });
        }

        if (!query.trim()) {
          return resolve({ success: false, message: "Search query cannot be empty." });
        }

        setIsTriggering(true);
        resolveTriggerRef.current = resolve;

        window.postMessage(
          {
            source: "GM_DASHBOARD",
            type: "TRIGGER_SEARCH",
            payload: {
              query: query.trim(),
              platform,
              limit,
            },
          },
          "*"
        );

        // Safety timeout in case extension fails to reply within 4 seconds
        triggerTimeoutRef.current = setTimeout(() => {
          setIsTriggering(false);
          if (resolveTriggerRef.current) {
            resolveTriggerRef.current({
              success: false,
              message:
                "Extension did not acknowledge the search request. Please make sure the GM Lead Generator extension is installed and active in Chrome.",
            });
            resolveTriggerRef.current = null;
          }
        }, 4000);
      });
    },
    []
  );

  return {
    isInstalled,
    version,
    isChecking,
    isTriggering,
    isSyncing,
    extractionStatus,
    checkConnection,
    syncExtension,
    triggerSearch,
  };
}
