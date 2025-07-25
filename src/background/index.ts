// Background service worker for Chrome extension
import { ExtensionMessage, MessageType, ExtensionSettings } from '@/types';
import { setupMessageListener } from '@/utils/messaging';
import { useSettingsStore } from '@/stores/settingsStore';


console.log('[EnshitRadar] 🚀 Background service worker loaded');

// Initialize extension on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('[EnshitRadar] Extension startup');
  initializeExtension();
});

// Initialize extension on installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[EnshitRadar] Extension installed:', details.reason);
  initializeExtension();
  
  if (details.reason === 'install') {
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

// Clean up when extension is suspended/disabled
chrome.runtime.onSuspend.addListener(() => {
  console.log('[EnshitRadar] 🧹 Extension is being suspended/disabled - cleaning up data');
  cleanupExtensionData();
});

// Clean up when extension is suspended with more explicit handling
chrome.runtime.onSuspendCanceled.addListener(() => {
  console.log('[EnshitRadar] Extension suspend was canceled');
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('[EnshitRadar] Tab updated:', tab.url);
    // Add any tab-specific logic here
  }
});

// Handle browser action click (if no popup is set)
chrome.action.onClicked.addListener((tab) => {
  console.log('[EnshitRadar] Action clicked for tab:', tab.id);
  // This won't trigger if popup is set in manifest
});

// Set up message handling
setupMessageListener(async (message: ExtensionMessage, sender) => {
  console.log('[EnshitRadar] Background received message:', message.type, message.payload);
  
  switch (message.type) {
    case MessageType.GET_TAB_INFO:
      return await handleGetTabInfo(message.payload?.tabId || sender.tab?.id);
    
    case MessageType.UPDATE_SETTINGS:
      return await handleUpdateSettings(message.payload);
    
    case MessageType.CONTENT_LOADED:
      return await handleContentLoaded(message.payload, sender);
    
    case MessageType.TOGGLE_FEATURE:
      return await handleToggleFeature(message.payload);
    
    case MessageType.CLEANUP_SESSION_DATA:
      return await handleCleanupSessionData();
    
    default:
      console.warn('[EnshitRadar] Unknown message type:', message.type);
      return { error: 'Unknown message type' };
  }
});

/**
 * Cleanup all extension data when disabled
 */
async function cleanupExtensionData() {
  try {
    console.log('[EnshitRadar] 🧹 Starting comprehensive data cleanup...');
    
    // 1. Clear all chrome.storage data
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    console.log('[EnshitRadar] ✅ Chrome storage cleared');
    
    // 2. Send cleanup messages to all active tabs
    const tabs = await chrome.tabs.query({});
    const cleanupPromises = tabs.map(async (tab) => {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: MessageType.CLEANUP_SESSION_DATA,
            payload: { reason: 'extension_disabled' }
          });
        } catch (error) {
          // Tab might not have content script loaded - this is fine
          console.debug('[EnshitRadar] Could not send cleanup message to tab:', tab.id);
        }
      }
    });
    
    await Promise.allSettled(cleanupPromises);
    console.log('[EnshitRadar] ✅ Session cleanup messages sent to all tabs');
    
    // 3. Reset badge
    try {
      await chrome.action.setBadgeText({ text: '' });
      await chrome.action.setTitle({ title: 'EnshitRadar (Disabled)' });
    } catch (error) {
      console.debug('[EnshitRadar] Could not reset badge:', error);
    }
    
    console.log('[EnshitRadar] 🎉 Extension cleanup completed successfully');
    
  } catch (error) {
    console.error('[EnshitRadar] ❌ Failed to cleanup extension data:', error);
  }
}

/**
 * Handle cleanup session data message
 */
async function handleCleanupSessionData() {
  console.log('[EnshitRadar] Cleanup session data requested');
  // This will be handled by content scripts directly
  return { success: true };
}

// Initialize extension settings
async function initializeExtension() {
  try {    
    // Always cleanup session data on startup (in case extension was disabled/enabled)
    console.log('[EnshitRadar] 🧹 Cleaning up stale session data on startup');
    await cleanupStaleSessionData();
    
  } catch (error) {
    console.error('[EnshitRadar] Failed to initialize extension:', error);
  }
}

/**
 * Clean up stale session data on startup
 */
async function cleanupStaleSessionData() {
  try {
    const tabs = await chrome.tabs.query({});
    const cleanupPromises = tabs.map(async (tab) => {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: MessageType.CLEANUP_SESSION_DATA,
            payload: { reason: 'extension_startup' }
          });
        } catch (error) {
          // Tab might not have content script loaded - this is fine
          console.debug('[EnshitRadar] Could not send startup cleanup to tab:', tab.id);
        }
      }
    });
    
    await Promise.allSettled(cleanupPromises);
    console.log('[EnshitRadar] ✅ Startup session cleanup completed');
  } catch (error) {
    console.error('[EnshitRadar] ❌ Failed startup session cleanup:', error);
  }
}

// Handle get tab info requests
async function handleGetTabInfo(tabId?: number) {
  if (!tabId) {
    return { error: 'No tab ID provided' };
  }
  
  try {
    const tab = await chrome.tabs.get(tabId);
    return {
      id: tab.id,
      url: tab.url,
      title: tab.title,
      active: tab.active
    };
  } catch (error) {
    console.error('[EnshitRadar] Failed to get tab info:', error);
    return { error: 'Failed to get tab info' };
  }
}

// Handle settings updates
async function handleUpdateSettings(settings: ExtensionSettings) {
  try {
    await chrome.storage.sync.set({ settings });
    console.log('[EnshitRadar] Settings updated:', settings);
    
    // Notify all tabs about settings change
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: MessageType.UPDATE_SETTINGS,
            payload: settings
          });
        } catch (error) {
          // Tab might not have content script loaded
          console.debug('[EnshitRadar] Could not send settings to tab:', tab.id, error.message);
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('[EnshitRadar] Failed to update settings:', error);
    return { error: 'Failed to update settings' };
  }
}

// Handle content script loaded notification
async function handleContentLoaded(payload: any, sender: chrome.runtime.MessageSender) {
  console.log('[EnshitRadar] Content script loaded on:', payload?.url, 'from tab:', sender.tab?.id);
  
  // Send current settings to the newly loaded content script
  try {
    const result = await chrome.storage.sync.get(['settings']);
    if (sender.tab?.id && result.settings) {
      await chrome.tabs.sendMessage(sender.tab.id, {
        type: MessageType.UPDATE_SETTINGS,
        payload: result.settings
      });
    }
  } catch (error) {
    console.error('[EnshitRadar] Failed to send settings to content script:', error);
  }
  
  return { success: true };
}

// Handle feature toggle
async function handleToggleFeature(payload: { enabled: boolean }) {
  console.log('[EnshitRadar] Feature toggled:', payload.enabled);
  
  // If disabling, cleanup session data across all tabs
  if (!payload.enabled) {
    console.log('[EnshitRadar] 🧹 Extension disabled - cleaning up session data');
    await cleanupStaleSessionData();
  }
  
  // Update badge based on feature state
  const badgeText = payload.enabled ? '' : 'OFF';
  const badgeColor: [number, number, number, number] = payload.enabled 
    ? [0, 128, 0, 255] 
    : [128, 128, 128, 255];
  
  try {
    await chrome.action.setBadgeText({ text: badgeText });
    await chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  } catch (error) {
    console.error('[EnshitRadar] Failed to update badge:', error);
  }
  
  return { success: true };
} 