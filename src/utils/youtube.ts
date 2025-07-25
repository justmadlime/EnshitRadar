import { YouTubePageInfo } from '@/types';

/**
 * Detect if current page is YouTube and extract page information
 */
export function detectYouTubePage(): YouTubePageInfo {
  const url = window.location.href;

  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  
  // Detect page type and extract information
  if (pathname.startsWith('/channel/') || pathname.startsWith('/c/') || pathname.startsWith('/@')) {
    // Channel page
    const channelInfo = extractChannelInfo();
    return {
      pageType: 'channel',
      channelId: channelInfo.channelId,
      channelName: channelInfo.channelName,
      channelUrl: url
    };
  } else if (pathname === '/watch' && searchParams.has('v')) {
    // Video page
    const videoId = searchParams.get('v');
    const channelInfo = extractChannelInfoFromVideo();
    return {
      pageType: 'video',
      videoId: videoId || undefined,
      channelId: channelInfo.channelId,
      channelName: channelInfo.channelName,
      channelUrl: channelInfo.channelUrl
    };
  }
  
  return {
    pageType: 'other'
  };
}

/**
 * Extract channel information from channel page
 */
function extractChannelInfo(): { channelId?: string; channelName?: string } {
  const pathname = window.location.pathname;
  
  // Try to get channel ID from URL
  let channelId: string | undefined;
  if (pathname.startsWith('/channel/')) {
    channelId = pathname.split('/channel/')[1]?.split('/')[0];
  }
  
  // Try to get channel name from page elements
  let channelName: string | undefined;
  
  // Try multiple selectors for channel name
  const nameSelectors = [
    'yt-formatted-string#text.style-scope.ytd-channel-name',
    '#channel-header-container #text',
    '.ytd-channel-name #text',
    'yt-formatted-string.ytd-channel-name',
    '[id="channel-name"] yt-formatted-string'
  ];
  
  for (const selector of nameSelectors) {
    const element = document.querySelector(selector);
    if (element?.textContent?.trim()) {
      channelName = element.textContent.trim();
      break;
    }
  }
  
  // Fallback: try to get from page title
  if (!channelName) {
    const title = document.title;
    if (title && title.includes(' - YouTube')) {
      channelName = title.replace(' - YouTube', '').trim();
    }
  }
  
  return { channelId, channelName };
}

/**
 * Extract channel information from video page
 */
function extractChannelInfoFromVideo(): { channelId?: string; channelName?: string; channelUrl?: string } {
  let channelId: string | undefined;
  let channelName: string | undefined;
  let channelUrl: string | undefined;
  
  // Try to get channel link element
  const channelLinkSelectors = [
    '.ytd-video-owner-renderer .yt-simple-endpoint[href*="/channel/"]',
    '.ytd-video-owner-renderer .yt-simple-endpoint[href*="/@"]',
    '.ytd-video-owner-renderer .yt-simple-endpoint[href*="/c/"]',
    '.ytd-video-owner-renderer .yt-simple-endpoint[href*="/user/"]',
    '#upload-info #channel-name a',
    '.ytd-channel-name a',
    'a[href*="/channel/"]',
    'a[href*="/@"]',
    'a[href*="/c/"]',
    'a[href*="/user/"]',
    '#owner-sub-count + .yt-simple-endpoint.style-scope.yt-formatted-string'
  ];
  
  let channelLinkElement: Element | null = null;
  for (const selector of channelLinkSelectors) {
    channelLinkElement = document.querySelector(selector);
    if (channelLinkElement) break;
  }
  
  if (channelLinkElement) {
    const href = channelLinkElement.getAttribute('href');
    if (href) {
      channelUrl = href.startsWith('/') ? `https://www.youtube.com${href}` : href;
      
      // Extract channel ID from URL
      if (href.includes('/channel/')) {
        channelId = href.split('/channel/')[1]?.split('/')[0];
      } else if (href.includes('/c/')) {
        // Custom channel URL - we'll use the custom name as a fallback ID
        const customName = href.split('/c/')[1]?.split('/')[0];
        channelId = customName ? `custom_${customName}` : undefined;
      } else if (href.includes('/user/')) {
        // Legacy user URL
        const userName = href.split('/user/')[1]?.split('/')[0];
        channelId = userName ? `user_${userName}` : undefined;
      } else if (href.startsWith('/@')) {
        // Handle new @username format
        const handleName = href.split('/@')[1]?.split('/')[0];
        channelId = handleName ? `handle_${handleName}` : undefined;
      }
    }
    
    // Get channel name from link text
    channelName = channelLinkElement.textContent?.trim();
  }
  
  // Alternative method: look for channel name in video metadata
  if (!channelName) {
    const nameSelectors = [
      '.ytd-video-owner-renderer .ytd-channel-name yt-formatted-string',
      '#upload-info #channel-name .yt-simple-endpoint',
      '.ytd-channel-name .yt-simple-endpoint',
      '.ytd-video-owner-renderer .yt-formatted-string',
      '#channel-name .yt-formatted-string',
      '[id="channel-name"] a',
      '.ytd-channel-name span'
    ];
    
    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        channelName = element.textContent.trim();
        break;
      }
    }
  }
  
  // Try to get from URL parameter as fallback
  if (!channelName) {
    const urlParams = new URLSearchParams(window.location.search);
    const abChannel = urlParams.get('ab_channel');
    if (abChannel) {
      channelName = decodeURIComponent(abChannel).replace(/–/g, ' – ').replace(/\s+/g, ' ').trim();
    }
  }
  
  return { channelId, channelName, channelUrl };
}

/**
 * Watch for dynamic changes in YouTube page (for SPA navigation)
 */
export function watchForYouTubeChanges(callback: (pageInfo: YouTubePageInfo) => void) {
  let currentUrl = window.location.href;
  let currentPageInfo = detectYouTubePage();
  let navigationDetected = false;
  
  // Initial callback
  callback(currentPageInfo);
  
  // Create a more robust navigation detection system
  const handleNavigation = (source: string) => {
    const newUrl = window.location.href;
    if (newUrl !== currentUrl) {
      currentUrl = newUrl;
      navigationDetected = true;
      
      console.debug(`[EnshitRadar] 🚀 Navigation detected via ${source}:`, newUrl);
      
      // Clear any existing timeouts and check multiple times with increasing delays
      // This handles cases where content loads slowly
      const checkAndCallback = (attempt: number, delay: number) => {
        setTimeout(() => {
          const newPageInfo = detectYouTubePage();
          console.debug("New Page Info: ",newPageInfo)
          const hasChanged = JSON.stringify(newPageInfo) !== JSON.stringify(currentPageInfo);
          
          console.debug(`[EnshitRadar] 🔍 Check attempt ${attempt} (${delay}ms):`, {
            hasChanged,
            newPageInfo,
            currentPageInfo
          });
          
          if (hasChanged) {
            currentPageInfo = newPageInfo;
            callback(newPageInfo);
          } else if (attempt < 6) {
            // If no change detected and we haven't reached max attempts, try again
            checkAndCallback(attempt + 1, delay + 500);
          }
        }, delay);
      };
      
      // Multiple attempts with increasing delays to handle slow-loading content
      checkAndCallback(1, 200);   // Quick check
      checkAndCallback(2, 800);   // Medium delay
      checkAndCallback(3, 1500);  // Longer delay
      checkAndCallback(4, 3000);  // Very long delay for very slow content
    }
  };

  // Method 1: Intercept pushState and replaceState (most reliable for SPA navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    handleNavigation('pushState');
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    handleNavigation('replaceState');
  };
  
  // Method 2: Listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', () => {
    handleNavigation('popstate');
  });
  
  // Method 3: Watch for specific YouTube SPA indicators
  let lastVideoId = new URLSearchParams(window.location.search).get('v');
  const observer = new MutationObserver((mutations) => {
    // Check if URL changed (additional safety net)
    const newUrl = window.location.href;
    if (newUrl !== currentUrl) {
      handleNavigation('mutationObserver-url');
      return;
    }
    
    // Check for video ID changes (important for YouTube)
    const currentVideoId = new URLSearchParams(window.location.search).get('v');
    if (currentVideoId !== lastVideoId) {
      lastVideoId = currentVideoId;
      handleNavigation('mutationObserver-videoId');
      return;
    }
    
         // Watch for specific YouTube content changes that indicate navigation
     for (const mutation of mutations) {
       if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
         for (const node of Array.from(mutation.addedNodes)) {
           if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Look for key YouTube page elements that indicate content has changed
            if (element.matches?.([
              'ytd-watch-flexy',           // Video page main container
              'ytd-browse[page-subtype="channels"]', // Channel page
              'ytd-two-column-browse-results-renderer', // Browse results
              '#primary',                   // Primary content area
              '#secondary',                 // Secondary content area
              'ytd-page-manager',          // YouTube's page manager
              'ytd-app'                    // Main app container
            ].join(', ')) || element.querySelector?.([
              'ytd-watch-flexy',
              'ytd-browse[page-subtype="channels"]',
              'ytd-two-column-browse-results-renderer',
              '#primary',
              '#secondary'
            ].join(', '))) {
              handleNavigation('mutationObserver-content');
              return;
            }
          }
        }
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    attributeOldValue: false,
    characterData: false,
    characterDataOldValue: false
  });
  
  // Method 4: Watch for title changes (additional indicator)
  let lastTitle = document.title;
  const titleObserver = new MutationObserver(() => {
    if (document.title !== lastTitle) {
      lastTitle = document.title;
      // Small delay to let URL update as well
      setTimeout(() => {
        handleNavigation('titleChange');
      }, 100);
    }
  });
  
  const titleElement = document.querySelector('title');
  if (titleElement) {
    titleObserver.observe(titleElement, { childList: true });
  }
  
  // Cleanup function
  const cleanup = () => {
    observer.disconnect();
    titleObserver.disconnect();
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  };
  
  // Return the main observer for backward compatibility, but also provide cleanup
  const mainObserver = observer as MutationObserver & { cleanup?: () => void };
  mainObserver.cleanup = cleanup;
  
  return mainObserver;
}

/**
 * Get channel ID from various YouTube URL formats
 */
export function extractChannelIdFromUrl(url: string): string | null {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  // Handle /channel/UCxxxxx format
  if (pathname.includes('/channel/')) {
    const match = pathname.match(/\/channel\/([^\/]+)/);
    return match ? match[1] : null;
  }
  
  // Handle /@username format - we can't directly convert this to channel ID
  // without additional API calls
  if (pathname.startsWith('/@')) {
    return null; // Would need YouTube API to resolve
  }
  
  // Handle /c/customname format - also needs API resolution
  if (pathname.startsWith('/c/')) {
    return null;
  }
  
  return null;
} 