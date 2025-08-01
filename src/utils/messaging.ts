import { ExtensionMessage, MessageType, MessagePayload } from '@/types';
import { browser, type Tab, type MessageSender } from '@/utils/browser';

/**
 * Send message to background script
 */
export async function sendToBackground<T extends MessageType>(
  type: T,
  payload?: MessagePayload[T]
): Promise<any> {
  const message: ExtensionMessage = { type, payload };
  return await browser.runtime.sendMessage(message);
}

/**
 * Send message to content script
 */
export async function sendToContent<T extends MessageType>(
  tabId: number,
  type: T,
  payload?: MessagePayload[T]
): Promise<any> {
  const message: ExtensionMessage = { type, payload };
  return await browser.tabs.sendMessage(tabId, message);
}

/**
 * Set up message listener
 */
export function setupMessageListener(
  handler: (message: ExtensionMessage, sender: MessageSender) => Promise<any>
) {
  browser.runtime.onMessage.addListener(async (message, sender) => {
    try {
      return await handler(message, sender);
    } catch (error) {
      console.error('[EnshitRadar] Message handler error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
}

/**
 * Get current active tab
 */
export async function getCurrentTab(): Promise<Tab> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Debounce function for limiting rapid function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 