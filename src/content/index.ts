// Content script that runs on web pages
import { ExtensionMessage, MessageType, ExtensionSettings, YouTubePageInfo } from '@/types';
import { sendToBackground, setupMessageListener } from '@/utils/messaging';
import { detectYouTubePage, watchForYouTubeChanges } from '@/utils/youtube';
import { channelDatabase } from '@/utils/channelDatabase';
import { WarningBanner, addWarningStyles } from '@/components/WarningBanner';

// Prevent execution in sandboxed frames
if (window.top !== window.self && window.frameElement) {
  console.log('[EnshitRadar] 🚫 Skipping execution in iframe');
} else {
  console.log('[EnshitRadar] 🌐 Content script loaded on:', window.location.href);
  
  let currentSettings: ExtensionSettings | null = null;
  let currentWarningBanner: WarningBanner | null = null;
  let youtubeObserver: (MutationObserver & { cleanup?: () => void }) | null = null;
  let currentPageInfo: YouTubePageInfo | null = null;
  let isProcessingChannel = false;

  // Initialize content script
  async function initializeContentScript() {
    try {
      // Load initial settings from storage
      await loadInitialSettings();
      
      // Notify background that content script is loaded
      await sendToBackground(MessageType.CONTENT_LOADED, { url: window.location.href });
      
      // Set up styles for warnings
      addWarningStyles();
      
      // Set up content-specific functionality
      setupPageObserver();
      setupCustomStyles();
      
      // Initialize YouTube detection if on YouTube
      initializeYouTubeDetection();
      
      console.log('[EnshitRadar] Content script initialized with settings:', currentSettings);
    } catch (error) {
      console.error('[EnshitRadar] Failed to initialize content script:', error);
    }
  }

  // Load initial settings from storage
  async function loadInitialSettings() {
    try {
      const result = await chrome.storage.sync.get(['settings']);
      if (result.settings) {
        currentSettings = result.settings;
        console.log('[EnshitRadar] ✅ Initial settings loaded:', currentSettings);
      } else {
        // Use default settings if none exist
        currentSettings = { enabled: true };
        console.log('[EnshitRadar] 🔧 Using default settings:', currentSettings);
      }
    } catch (error) {
      console.error('[EnshitRadar] ❌ Failed to load initial settings:', error);
      // Fallback to default settings
      currentSettings = { enabled: true };
    }
  }

  // Initialize YouTube-specific functionality
  function initializeYouTubeDetection() {
    const pageInfo = detectYouTubePage();
    
    if (!pageInfo.isYouTube) {
      console.log('[EnshitRadar] Not on YouTube, skipping channel detection');
      return;
    }
    
    console.log('[EnshitRadar] 🎬 YouTube page detected:', pageInfo);
    
    // Clean up any existing observer
    if (youtubeObserver) {
      if (typeof youtubeObserver.cleanup === 'function') {
        youtubeObserver.cleanup();
      } else {
        youtubeObserver.disconnect();
      }
    }
    
    // Set up observer to watch for page changes (YouTube SPA)
    youtubeObserver = watchForYouTubeChanges((newPageInfo) => {
      console.log('[EnshitRadar] 🔄 YouTube page changed:', newPageInfo);
      handleYouTubePageChange(newPageInfo);
    });
  }

  // Handle YouTube page changes
  function handleYouTubePageChange(pageInfo: YouTubePageInfo) {
    console.log('[EnshitRadar] 🔄 Page change detected:', pageInfo);
    console.log('[EnshitRadar] 🌐 Current URL:', window.location.href);
    
    // ALWAYS clear existing warning first, regardless of page type or processing state
    if (currentWarningBanner) {
      console.log('[EnshitRadar] 🗑️ Clearing existing warning banner');
      currentWarningBanner.remove();
      currentWarningBanner = null;
    }
    
    // Prevent multiple processing of the same page
    if (isProcessingChannel) {
      console.log('[EnshitRadar] Already processing channel, skipping duplicate');
      return;
    }
    
    // Check if this is the same page we already processed
    if (currentPageInfo && 
        currentPageInfo.isYouTube === pageInfo.isYouTube &&
        currentPageInfo.pageType === pageInfo.pageType &&
        currentPageInfo.channelId === pageInfo.channelId &&
        currentPageInfo.videoId === pageInfo.videoId &&
        window.location.href === currentPageInfo.channelUrl) {
      console.log('[EnshitRadar] Same page detected, skipping processing');
      return;
    }
    
    // Update current page info
    currentPageInfo = pageInfo;
    isProcessingChannel = true;
    
    // Only process channel and video pages  
    if (pageInfo.pageType !== 'channel' && pageInfo.pageType !== 'video') {
      console.log('[EnshitRadar] 🚫 Not a channel or video page, stopping processing');
      isProcessingChannel = false;
      return;
    }
    
    console.log('[EnshitRadar] ✅ Processing', pageInfo.pageType, 'page for channel:', pageInfo.channelName || 'Unknown');
    
    // Check if extension is enabled
    if (currentSettings && !currentSettings.enabled) {
      console.log('[EnshitRadar] Extension disabled, skipping warning');
      isProcessingChannel = false;
      return;
    }
    
    // If settings haven't loaded yet, skip for now
    if (!currentSettings) {
      console.log('[EnshitRadar] Settings not loaded yet, skipping warning');
      isProcessingChannel = false;
      return;
    }
    
    // Try with increasing delays, but only once per page change
    let attempts = 0;
    const maxAttempts = 6; // Increased attempts for better reliability
    
    const tryCheckChannel = () => {
      attempts++;
      
      // Get fresh page info for each attempt (DOM may have loaded more content)
      const freshPageInfo = detectYouTubePage();
      const success = checkChannelAndShowWarning(freshPageInfo);
      
      if (!success && attempts < maxAttempts) {
        // If failed and we haven't reached max attempts, try again with increasing delay
        const delay = attempts * 1000; // 1s, 2s, 3s, 4s, 5s, 6s
        console.log(`[EnshitRadar] Attempt ${attempts} failed, retrying in ${delay}ms`);
        setTimeout(tryCheckChannel, delay);
      } else {
        // Either succeeded or reached max attempts
        if (!success) {
          console.log('[EnshitRadar] All attempts failed, giving up');
        }
        isProcessingChannel = false;
      }
    };
    
    // Wait 1 second for the page/video to load fully before starting checks
    setTimeout(tryCheckChannel, 1000);
  }

  // Check channel against database and show warning if needed
  function checkChannelAndShowWarning(pageInfo: YouTubePageInfo): boolean {
    console.log('[EnshitRadar] 🔍 Checking channel info:', pageInfo);
    console.log('[EnshitRadar] 🌐 Current URL:', window.location.href);
    
    // Double-check: ensure we don't have a stale banner from a previous page
    if (currentWarningBanner) {
      console.log('[EnshitRadar] 🧹 Found stale banner, removing it');
      currentWarningBanner.remove();
      currentWarningBanner = null;
    }
    
    if (!pageInfo.channelId && !pageInfo.channelName) {
      console.log('[EnshitRadar] ❌ No channel information available');
      return false;
    }
    
    // Additional validation: ensure we have meaningful channel data
    if (pageInfo.channelName && pageInfo.channelName.length < 2) {
      console.log('[EnshitRadar] ❌ Channel name too short, likely invalid:', pageInfo.channelName);
      return false;
    }
    
    // Check if we already have a warning banner displayed
    if (currentWarningBanner) {
      console.log('[EnshitRadar] ✅ Warning banner already displayed, skipping');
      return true;
    }
    
    // Double-check: if we're on a video page, make sure the channel info matches the current video
    if (pageInfo.pageType === 'video') {
      const currentVideoId = new URLSearchParams(window.location.search).get('v');
      if (pageInfo.videoId && currentVideoId && pageInfo.videoId !== currentVideoId) {
        console.log('[EnshitRadar] ❌ Video ID mismatch - stale data:', {
          detected: pageInfo.videoId,
          current: currentVideoId
        });
        return false;
      }
    }
    
    // Check if channel is in our database
    const channelRating = channelDatabase.checkChannel(pageInfo.channelId, pageInfo.channelName);
    
    if (!channelRating) {
      console.log('[EnshitRadar] ✅ Channel not in database:', pageInfo.channelName, 'ID:', pageInfo.channelId);
      return true; // Return true as this is a successful "no warning needed" case
    }
    
    // Additional verification: make sure the detected channel name matches what we found
    if (channelRating.channelName && pageInfo.channelName && 
        channelRating.channelName.toLowerCase() !== pageInfo.channelName.toLowerCase()) {
      console.log('[EnshitRadar] ❌ Channel name mismatch - potential false positive:', {
        database: channelRating.channelName,
        detected: pageInfo.channelName
      });
      return false;
    }
    
    // Check if channel was dismissed for this session
    if (channelRating.channelId && WarningBanner.isChannelDismissed(channelRating.channelId)) {
      console.log('[EnshitRadar] 🔇 Channel warning dismissed for session:', channelRating.channelName);
      return true; // Return true as this is handled correctly
    }
    
    console.log('[EnshitRadar] ⚠️ Flagged channel detected and verified:', channelRating);
    
    // Create and show warning (we already checked pageType above)
    if (pageInfo.pageType === 'channel' || pageInfo.pageType === 'video') {
      showChannelWarning(channelRating, pageInfo.pageType);
      return true;
    }
    
    return false;
  }

  // Show warning banner for flagged channel
  function showChannelWarning(channelRating: any, pageType: 'channel' | 'video') {
    try {
      // Get warning configuration
      const warningConfig = channelDatabase.getWarningConfig(channelRating);
      
      // Create warning banner
      currentWarningBanner = new WarningBanner();
      const bannerElement = currentWarningBanner.create(warningConfig, channelRating);
      
      // Try to insert into page
      const inserted = currentWarningBanner.insertIntoPage(pageType);
      
      if (!inserted) {
        console.warn('[EnshitRadar] Could not find suitable container for warning banner');
        // Fallback: insert at top of body
        document.body.insertBefore(bannerElement, document.body.firstChild);
      }
      
      console.log('[EnshitRadar] ✅ Warning banner displayed for:', channelRating.channelName);
      
      // Track warning display
      trackWarningDisplay(channelRating);
      
    } catch (error) {
      console.error('[EnshitRadar] Failed to show channel warning:', error);
    }
  }

  // Set up message listener for communication with background/popup
  setupMessageListener(async (message: ExtensionMessage) => {
    console.log('[EnshitRadar] Content received message:', message.type, message.payload);
    
    switch (message.type) {
      case MessageType.UPDATE_SETTINGS:
        await handleSettingsUpdate(message.payload);
        return { success: true };
      
      case MessageType.TOGGLE_FEATURE:
        await handleFeatureToggle(message.payload);
        return { success: true };
      
      case MessageType.CLEANUP_SESSION_DATA:
        await handleCleanupSessionData(message.payload);
        return { success: true };
      
      default:
        console.warn('[EnshitRadar] Unknown message type in content script:', message.type);
        return { error: 'Unknown message type' };
    }
  });

  // Handle settings updates from background
  async function handleSettingsUpdate(settings: ExtensionSettings) {
    currentSettings = settings;
    console.log('[EnshitRadar] Settings updated in content script:', settings);
    
    // Apply settings to the page
    toggleFeatures(settings.enabled);
  }

  // Handle feature toggle
  async function handleFeatureToggle(payload: { enabled: boolean }) {
    console.log('[EnshitRadar] Feature toggled in content script:', payload.enabled);
    
    // If disabling, cleanup session data immediately
    if (!payload.enabled) {
      console.log('[EnshitRadar] 🧹 Extension disabled - cleaning up session data in content script');
      cleanupSessionData();
    }
    
    if (currentSettings) {
      currentSettings.enabled = payload.enabled;
      toggleFeatures(payload.enabled);
    }
  }

  // Handle cleanup session data request
  async function handleCleanupSessionData(payload?: { reason?: string }) {
    console.log('[EnshitRadar] 🧹 Cleaning up session data:', payload?.reason || 'unknown reason');
    cleanupSessionData();
  }

  /**
   * Clean up all session storage data
   */
  function cleanupSessionData() {
    try {
      console.log('[EnshitRadar] 🧹 Cleaning up EnshitRadar session storage...');
      
      // Remove dismissed channels from session storage
      const dismissedKey = 'enshit-radar-dismissed';
      sessionStorage.removeItem(dismissedKey);
      
      // Remove any other EnshitRadar-related session storage items
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('enshit-radar')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`[EnshitRadar] 🗑️ Removed session storage key: ${key}`);
      });
      
      // Remove warning banners if any are currently displayed
      const existingWarnings = document.querySelectorAll('[data-enshit-radar-warning]');
      existingWarnings.forEach(warning => {
        warning.remove();
        console.log('[EnshitRadar] 🗑️ Removed warning banner from DOM');
      });
      
      // Clean up current warning banner instance
      if (currentWarningBanner) {
        currentWarningBanner.remove();
        currentWarningBanner = null;
        console.log('[EnshitRadar] 🗑️ Removed current warning banner instance');
      }
      
      console.log('[EnshitRadar] ✅ Session cleanup completed');
      
    } catch (error) {
      console.error('[EnshitRadar] ❌ Failed to cleanup session data:', error);
    }
  }

  /**
   * General cleanup function
   */
  function cleanup() {
    console.log('[EnshitRadar] 🧹 General cleanup initiated');
    
    // Remove any displayed warnings
    const existingWarnings = document.querySelectorAll('[data-enshit-radar-warning]');
    existingWarnings.forEach(warning => warning.remove());
    
    // Clean up current warning banner
    if (currentWarningBanner) {
      currentWarningBanner.remove();
      currentWarningBanner = null;
    }
    
    // Stop watching for YouTube changes if we have an observer
    if (youtubeObserver) {
      if (typeof youtubeObserver.cleanup === 'function') {
        youtubeObserver.cleanup();
      } else {
        youtubeObserver.disconnect();
      }
      youtubeObserver = null;
      console.log('[EnshitRadar] 🛑 YouTube observer disconnected');
    }
  }



  // Toggle extension features on/off
  function toggleFeatures(enabled: boolean) {
    const body = document.body;
    
    if (enabled) {
      body.classList.add('extension-enabled');
      body.classList.remove('extension-disabled');
      startFeatures();
    } else {
      body.classList.add('extension-disabled');
      body.classList.remove('extension-enabled');
      stopFeatures();
    }
    
    console.log('[EnshitRadar] Features toggled:', enabled);
  }

  // Start extension features
  function startFeatures() {
    // Add your main extension functionality here
    console.log('[EnshitRadar] Extension features started');
    
    // Floating button removed per user request
  }

  // Stop extension features
  function stopFeatures() {
    console.log('[EnshitRadar] Extension features stopped');
    cleanup();
  }

  // Set up page observer for dynamic content
  function setupPageObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Handle dynamically added content
          handleDynamicContent(mutation.addedNodes);
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[EnshitRadar] Page observer set up');
  }

  // Handle dynamically added content
  function handleDynamicContent(nodes: NodeList) {
    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
      }
    });
  }

  // Set up custom styles
  function setupCustomStyles() {
    const styleId = 'extension-custom-styles';
    
    // Remove existing styles
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Add new styles
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `

      
    `;
    
    document.head.appendChild(style);
    console.log('[EnshitRadar] Custom styles applied');
  }

  // Add floating button example
  function addFloatingButton() {
    const existingButton = document.getElementById('extension-floating-button');
    if (existingButton) return;
    
    const button = document.createElement('button');
    button.id = 'extension-floating-button';
    button.className = 'extension-floating-button';
    button.innerHTML = '🔍';
    button.title = 'EnshitRadar';
    
    button.addEventListener('click', () => {
      console.log('[EnshitRadar] Floating button clicked');
      // Add your click handler logic here
      alert('EnshitRadar extension is active!');
    });
    
    document.body.appendChild(button);
  }

  // Remove floating button
  function removeFloatingButton() {
    const button = document.getElementById('extension-floating-button');
    if (button) {
      button.remove();
    }
  }

  // Track warning display for statistics
  function trackWarningDisplay(channelRating: any) {
    // Send to background for statistics tracking
    sendToBackground(MessageType.CHECK_CHANNEL, {
      channelId: channelRating.channelId,
      channelName: channelRating.channelName
    }).catch(error => {
      console.error('[EnshitRadar] Failed to track warning display:', error);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentScript);
  } else {
    initializeContentScript();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (youtubeObserver) {
      if (typeof youtubeObserver.cleanup === 'function') {
        youtubeObserver.cleanup();
      } else {
        youtubeObserver.disconnect();
      }
    }
    if (currentWarningBanner) {
      currentWarningBanner.remove();
    }
  });
} 