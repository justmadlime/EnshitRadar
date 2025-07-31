// Content script that runs on web pages
import { ExtensionMessage, MessageType, ExtensionSettings, YouTubePageInfo, ChannelRating } from '@/types';
import { sendToBackground, setupMessageListener } from '@/utils/messaging';
import { detectYouTubePage, watchForYouTubeChanges } from '@/utils/youtube';
import { channelDatabase } from '@/utils/channelDatabase';
import { WarningBanner, addWarningStyles } from '@/components/WarningBanner';
import { useSettingsStore } from '@/stores/settingsStore';
import { WarningTag } from '@/components/WarningTag';

// Prevent execution in sandboxed frames
if (!(window.top !== window.self && window.frameElement)) { // 
  setupEvents()
} else {
  console.debug("[EnshitRadar] 🚫 Skipping execution in iframe")
}

let currentSettings: ExtensionSettings | null = null;
let currentWarningBanner: WarningBanner | null = null;
let youtubeObserver: (MutationObserver & { cleanup?: () => void }) | null = null;
let mainWarningTag: WarningTag | null = null;

let secondaryWarningTags: Array<WarningTag> = []

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
    
    console.debug('[EnshitRadar] Content script initialized with settings:', currentSettings);
  } catch (error) {
    console.error('[EnshitRadar] Failed to initialize content script:', error);
  }
}

// Load initial settings from storage
async function loadInitialSettings() {
  try {
    let settingsStore = useSettingsStore.getState();
    if (!settingsStore.settings) {
      await settingsStore.loadSettings();
      settingsStore = useSettingsStore.getState();
    }

    currentSettings = settingsStore.settings
    // Load settings
    
    
  } catch (error) {
    console.error('[EnshitRadar] ❌ Failed to load initial settings:', error);
  }
}


// Initialize YouTube-specific functionality
function initializeYouTubeDetection() {
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
    console.debug('[EnshitRadar] 🔄 YouTube page changed:', newPageInfo);
    handleYouTubePageChange(newPageInfo);
  });
}

function clearWarningReferences() {
  currentWarningBanner = null;
  mainWarningTag = null;
  secondaryWarningTags = []
}

// Handle YouTube page changes
function handleYouTubePageChange(pageInfo: YouTubePageInfo) {
  clearWarningReferences()

  // Check if extension is enabled
  if (currentSettings && !currentSettings.enabled) {
    console.debug('[EnshitRadar] Extension disabled, skipping warning');
    return;
  }
  
  // If settings haven't loaded yet, skip for now
  if (!currentSettings) {
    console.debug('[EnshitRadar] Settings not loaded yet, skipping warning');
    return;
  }
  
  setTimeout(() => {
    checkChannelAndShowWarnings(pageInfo)

    switch (pageInfo.pageType) {
      case "video":
        checkRecommendedVideos()
        break;
      case "mainpage":
        checkMainPageVideos()

    }
  }, 100);
  
}

function checkRecommendedVideos() {
  let recommendedSection = document.getElementById('related')

  let recommendedVideos = recommendedSection.getElementsByTagName('yt-lockup-view-model')
  for (let videoIndex = 0; videoIndex < recommendedVideos.length; videoIndex++) {
    let video = recommendedVideos.item(videoIndex)
    let videoMetadata = video.querySelector('div>div>yt-lockup-metadata-view-model')
    let channelName = videoMetadata.querySelector('yt-content-metadata-view-model>div.yt-content-metadata-view-model-wiz__metadata-row')
    
    
    // TODO: Get channel data for each video using API
    
    let channelRating: ChannelRating = {
      channelId: "",
      channelName: "",
      level: "low",
      description: "",
      dateAdded: "",
      source: "",
    }

    switch (videoIndex % 4) {
      case 0:
        channelRating.level = "low"
        break;
      case 1:
        channelRating.level = "middle"
        break;
      case 2:
        channelRating.level = "high"
        break;
      case 3:
        channelRating.level = "confirmed"
        break;
    }

    const warningConfig = channelDatabase.getWarningConfig(channelRating)
    
    let warningTag = new WarningTag()
    warningTag.createShort(warningConfig, channelRating)
    
    secondaryWarningTags.push(warningTag)
    warningTag.insertInto(channelName as HTMLElement)
  } 
}

function checkMainPageVideos() {

}


// Check channel against database and show warning as required
function checkChannelAndShowWarnings(pageInfo: YouTubePageInfo) {
  // TODO: remove redundant check, better typing?
  if (!(pageInfo.pageType === 'channel' || pageInfo.pageType === 'video')) {
    return
  }

  console.debug('[EnshitRadar] 🔍 Checking channel info:', pageInfo);
  
  if (!pageInfo.channelId && !pageInfo.channelName) {
    console.debug('[EnshitRadar] ❌ No channel information available');
    return;
  }
  
  // Check if channel is in our database
  const channelRating = channelDatabase.checkChannel(pageInfo.channelId, pageInfo.channelName);
  
  if (!channelRating) {
    console.debug('[EnshitRadar] ✅ Channel not in database:', pageInfo.channelName, 'ID:', pageInfo.channelId);
    return;
  }
  
  // Check if channel was dismissed for this session
  if (channelRating.channelId && WarningBanner.isChannelDismissed(channelRating.channelId)) {
    console.debug('[EnshitRadar] 🔇 Channel warning dismissed for session:', channelRating.channelName);
    return;
  }
  
  console.debug('[EnshitRadar] ⚠️ Flagged channel detected:', channelRating);
  
  
  if (currentSettings.showLargeBanners) {
    showLargeChannelWarning(channelRating, pageInfo.pageType);
  }

  if (true) { //TODO: Setting for small tags
    showMainChannelWarningTag(channelRating, pageInfo.pageType)
  }
}

/**
 * Show warning tag for main channel
 * @param channelRating 
 * @param pageType 
 */
function showMainChannelWarningTag(channelRating: ChannelRating, pageType: 'channel' | 'video') {
  try {
    const warningConfig = channelDatabase.getWarningConfig(channelRating)
    
    let mainWarningTag = new WarningTag()
    mainWarningTag.create(warningConfig, channelRating)
    
    let tagParentElement = null

    if (pageType === 'video') {
      tagParentElement = document.getElementById("upload-info")
    } else {
      tagParentElement = document.getElementsByTagName("yt-flexible-actions-view-model")[0]
    }

    if (!tagParentElement) {
      console.error('[EnshitRadar] Failed to find channel data HTML element')
      return
    }

    mainWarningTag.insertInto(tagParentElement)
    

    console.debug('[EnshitRadar] ✅ Warning Tag displayed for:', channelRating.channelName);
    
  } catch (error) {
    console.error('[EnshitRadar] Failed to show channel warning tag:', error);
  }
}

// Show large warning banner for flagged channel
function showLargeChannelWarning(channelRating: any, pageType: 'channel' | 'video') {
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
    
    console.debug('[EnshitRadar] ✅ Warning banner displayed for:', channelRating.channelName);
    
    // Track warning display
    trackWarningDisplay(channelRating);
    
  } catch (error) {
    console.error('[EnshitRadar] Failed to show channel warning:', error);
  }
}

// Handle settings updates from background
async function handleSettingsUpdate(settings: ExtensionSettings) {
  currentSettings = settings;
  console.debug('[EnshitRadar] Settings updated in content script:', settings);
  
  // Apply settings to the page
  toggleFeatures(settings.enabled);
}

// Handle feature toggle
async function handleFeatureToggle(payload: { enabled: boolean }) {
  console.debug('[EnshitRadar] Feature toggled in content script:', payload.enabled);
  
  // If disabling, cleanup session data immediately
  if (!payload.enabled) {
    console.debug('[EnshitRadar] 🧹 Extension disabled - cleaning up session data in content script');
    cleanupSessionData();
  }
  
  if (currentSettings) {
    currentSettings.enabled = payload.enabled;
    toggleFeatures(payload.enabled);
  }
}

// Handle cleanup session data request
async function handleCleanupSessionData(payload?: { reason?: string }) {
  console.debug('[EnshitRadar] 🧹 Cleaning up session data:', payload?.reason || 'unknown reason');
  cleanupSessionData();
}

/**
 * Clean up all session storage data
 */
function cleanupSessionData() {
  try {
    console.debug('[EnshitRadar] 🧹 Cleaning up EnshitRadar session storage...');
    
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
      console.debug(`[EnshitRadar] 🗑️ Removed session storage key: ${key}`);
    });
    
    // Remove all existing warnings
    currentWarningBanner.remove()
    currentWarningBanner = null

    mainWarningTag.remove()
    mainWarningTag = null

    secondaryWarningTags.forEach((tag) => tag.remove())
    secondaryWarningTags = []

    console.debug('[EnshitRadar] 🗑️ Removed existing warning elements');

    
    console.debug('[EnshitRadar] ✅ Session cleanup completed');
    
  } catch (error) {
    console.error('[EnshitRadar] ❌ Failed to cleanup session data:', error);
  }
}

/**
 * General cleanup function
 */
function cleanup() {
  console.debug('[EnshitRadar] 🧹 General cleanup initiated');
  
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
    console.debug('[EnshitRadar] 🛑 YouTube observer disconnected');
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
  
  console.debug('[EnshitRadar] Features toggled:', enabled);
}

// Start extension features
function startFeatures() {
  // Add your main extension functionality here
  console.debug('[EnshitRadar] Extension features started');
  
  // Floating button removed per user request
}

// Stop extension features
function stopFeatures() {
  console.debug('[EnshitRadar] Extension features stopped');
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
  
  console.debug('[EnshitRadar] Page observer set up');
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
  console.debug('[EnshitRadar] Custom styles applied');
}

// Add floating button example
// TODO: Redundant or future feature?
function addFloatingButton() {
  const existingButton = document.getElementById('extension-floating-button');
  if (existingButton) return;
  
  const button = document.createElement('button');
  button.id = 'extension-floating-button';
  button.className = 'extension-floating-button';
  button.innerHTML = '🔍';
  button.title = 'EnshitRadar';
  
  button.addEventListener('click', () => {
    console.debug('[EnshitRadar] Floating button clicked');
    // Add your click handler logic here
    alert('EnshitRadar extension is active!');
  });
  
  document.body.appendChild(button);
}

// Remove floating button
// TODO: Redundant or future feature?
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


function setupEvents() {
  console.debug('[EnshitRadar] 🌐 Content script loaded on:', window.location.href);

  // Set up message listener for communication with background/popup
  setupMessageListener(async (message: ExtensionMessage) => {
    console.debug('[EnshitRadar] Content received message:', message.type, message.payload);
    
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

  window.addEventListener('load',() => setTimeout(initializeContentScript, 500))

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
