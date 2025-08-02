import { WarningConfig, ChannelRating } from '@/types';

/**
 * Create and manage warning banners for YouTube pages
 */
export class WarningBanner {
  private element: HTMLElement | null = null;
  private containerId = 'enshit-radar-warning';

  /**
   * Create warning banner HTML
   */
  public create(config: WarningConfig, channelRating: ChannelRating): HTMLElement {
    // Remove existing banner first
    this.remove();

    const banner = document.createElement('div');
    banner.id = this.containerId;
    banner.className = 'enshit-radar-warning';
    banner.setAttribute('data-enshit-radar-warning', 'true');
    banner.setAttribute('data-channel-id', channelRating.channelId || '');
    banner.setAttribute('data-level', config.level);
    
    // Create DOM structure safely without innerHTML to prevent XSS attacks
    // All user data is properly escaped using textContent instead of innerHTML
    const content = document.createElement('div');
    content.className = 'enshit-radar-warning-content';
    
    // Header section
    const header = document.createElement('div');
    header.className = 'enshit-radar-warning-header';
    
    const icon = document.createElement('span');
    icon.className = 'enshit-radar-warning-icon';
    icon.textContent = config.icon;
    
    const title = document.createElement('span');
    title.className = 'enshit-radar-warning-title';
    title.textContent = config.title;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'enshit-radar-warning-close';
    closeButton.setAttribute('aria-label', 'Close warning');
    
    // Create SVG for close button safely
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('viewBox', '0 0 14 14');
    svg.setAttribute('fill', 'currentColor');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M13 1L1 13M1 1l12 12');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    
    svg.appendChild(path);
    closeButton.appendChild(svg);
    
    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Body section
    const body = document.createElement('div');
    body.className = 'enshit-radar-warning-body';
    
    const description = document.createElement('p');
    description.className = 'enshit-radar-warning-description';
    description.textContent = config.description;
    
    const details = document.createElement('div');
    details.className = 'enshit-radar-warning-details';
    
    const channelSpan = document.createElement('span');
    channelSpan.className = 'enshit-radar-warning-channel';
    channelSpan.textContent = `Channel: ${channelRating.channelName}`;
    
    const levelSpan = document.createElement('span');
    levelSpan.className = 'enshit-radar-warning-level';
    levelSpan.textContent = `Level: ${config.level.toUpperCase()}`;
    
    details.appendChild(channelSpan);
    details.appendChild(levelSpan);
    
    if (channelRating.source) {
      const sourceSpan = document.createElement('span');
      sourceSpan.className = 'enshit-radar-warning-source';
      sourceSpan.textContent = `Source: ${channelRating.source}`;
      details.appendChild(sourceSpan);
    }
    
    body.appendChild(description);
    body.appendChild(details);
    
    // Actions section
    const actions = document.createElement('div');
    actions.className = 'enshit-radar-warning-actions';
    
    const learnMoreButton = document.createElement('button');
    learnMoreButton.className = 'enshit-radar-warning-learn-more';
    learnMoreButton.textContent = 'Learn More';
    
    const dismissButton = document.createElement('button');
    dismissButton.className = 'enshit-radar-warning-dismiss';
    dismissButton.textContent = 'Dismiss for Session';
    
    actions.appendChild(learnMoreButton);
    actions.appendChild(dismissButton);
    
    // Assemble the complete structure
    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(actions);
    banner.appendChild(content);

    // Apply styles
    this.applyWarningStyle(banner, config);
    
    // Add event listeners
    this.addEventListeners(banner, channelRating);
    
    this.element = banner;
    return banner;
  }

  /**
   * Apply relevant styles to banner based off warning level
   * @param banner 
   * @param config 
   */
  private applyWarningStyle(banner: HTMLElement, config: WarningConfig): void {
    banner.style.backgroundColor = config.backgroundColor
    banner.style.borderColor = config.borderColor
    banner.style.color = config.color

    let closeBtn = banner.querySelector('.enshit-radar-warning-close') as HTMLElement;
    closeBtn.style.color = config.color

    let allActionButtons = banner.querySelectorAll('.enshit-radar-warning-actions button')
    allActionButtons.forEach((button) => {
      let buttonElement = button as HTMLElement
      buttonElement.style.borderColor = config.color
      buttonElement.style.color = config.color
    })

    let learnMoreButton = banner.querySelector('.enshit-radar-warning-learn-more') as HTMLElement;
    learnMoreButton.style.borderColor = config.borderColor
    learnMoreButton.style.backgroundColor = config.color
    learnMoreButton.style.color = config.backgroundColor
  }

  /**
   * Add event listeners to banner elements
   */
  private addEventListeners(banner: HTMLElement, channelRating: ChannelRating): void {
    // Close button
    const closeBtn = banner.querySelector('.enshit-radar-warning-close');
    closeBtn?.addEventListener('click', () => {
      this.hide();
    });

    // Learn more button
    const learnMoreBtn = banner.querySelector('.enshit-radar-warning-learn-more');
    learnMoreBtn?.addEventListener('click', () => {
      this.handleLearnMore(channelRating);
    });

    // Dismiss button
    const dismissBtn = banner.querySelector('.enshit-radar-warning-dismiss');
    dismissBtn?.addEventListener('click', () => {
      this.handleDismiss(channelRating);
    });
  }

  /**
   * Handle learn more action
   */
  private handleLearnMore(channelRating: ChannelRating): void {
    // Could open a modal or navigate to more information
    console.log('[EnshitRadar] Learn more about:', channelRating);
    
    // For now, show an alert with more info
    const message = `
      Channel: ${channelRating.channelName}
      Risk Level: ${channelRating.level.toUpperCase()}
      Date Added: ${channelRating.dateAdded}
      ${channelRating.source ? `Source: ${channelRating.source}` : ''}

      This information helps you make informed decisions about the content you consume.
    `.trim();
    
    alert(message);
  }

  /**
   * Handle dismiss for session
   */
  private handleDismiss(channelRating: ChannelRating): void {
    // Store dismissed channels in session storage
    const dismissedKey = 'enshit-radar-dismissed';
    const dismissed = JSON.parse(sessionStorage.getItem(dismissedKey) || '[]');
    
    if (!dismissed.includes(channelRating.channelId)) {
      dismissed.push(channelRating.channelId);
      sessionStorage.setItem(dismissedKey, JSON.stringify(dismissed));
    }
    
    this.hide();
  }

  /**
   * Show the banner with animation
   */
  public show(): void {
    if (this.element) {
      this.element.style.display = 'block';
      this.element.style.animation = 'enshitRadarSlideIn 0.3s ease-out';
    }
  }

  /**
   * Hide the banner with animation
   */
  public hide(): void {
    if (this.element) {
      this.element.style.animation = 'enshitRadarSlideOut 0.3s ease-in forwards';
      setTimeout(() => {
        this.remove();
      }, 300);
    }
  }

  /**
   * Remove the banner from DOM
   */
  public remove(): void {
    const existing = document.getElementById(this.containerId);
    if (existing) {
      existing.remove();
    }
    this.element = null;
  }

  /**
   * Check if channel was dismissed for this session
   */
  public static isChannelDismissed(channelId: string): boolean {
    const dismissedKey = 'enshit-radar-dismissed';
    const dismissed = JSON.parse(sessionStorage.getItem(dismissedKey) || '[]');
    return dismissed.includes(channelId);
  }

  /**
   * Insert banner into YouTube page at the appropriate location
   */
  public insertIntoPage(pageType: 'channel' | 'video'): boolean {
    if (!this.element) return false;

    let targetContainer: Element | null = null;

    if (pageType === 'channel') {
      
      // Primary Method of showing banner
      let channelBannerElement = document.querySelector('#wrapper > #contentContainer')
      if (channelBannerElement) {
        channelBannerElement.appendChild(this.element);
        this.setChannelPageStyles();
        return true
      }

      // More comprehensive selectors for both direct loads and SPA navigation
      const channelHeaderSelectors = [
        // New YouTube layout (direct load)
        'ytd-browse[page-subtype="channels"] #header',
        'ytd-browse[page-subtype="channels"] .page-header-banner',
        // Channel header containers (works for both)
        '#channel-header-container',
        '.ytd-c4-tabbed-header-renderer',
        '#channel-header',
        // Newer selectors
        'ytd-channel-header-view-model-renderer',
        '#page-header .page-header-view-model-wiz__page-header-content',
        '#page-header',
        // Broader container selectors for direct loads
        'ytd-browse[page-subtype="channels"] ytd-page-header-renderer',
        'ytd-browse #header.ytd-browse'
      ];
      
      // Find the channel header element first
      let channelHeaderElement: Element | null = null;
      for (const selector of channelHeaderSelectors) {
        channelHeaderElement = document.querySelector(selector);
        if (channelHeaderElement) {
          console.log('[EnshitRadar] 📍 Found channel header:', selector);
          break;
        }
      }
      
      if (channelHeaderElement && channelHeaderElement.parentNode) {
        // Insert the banner above the entire channel header
        channelHeaderElement.parentNode.insertBefore(this.element, channelHeaderElement);
        // Only adjust width for channel pages
        this.setChannelPageStyles();
        return true;
      }
      
      // Enhanced fallback: try to insert at the beginning of main content containers
      const fallbackSelectors = [
        // Try main content areas in order of preference
        'ytd-browse[page-subtype="channels"] #primary',
        '#primary-inner',
        '#primary .ytd-browse',
        'ytd-browse #primary',
        '#contents.ytd-browse',
        // Last resort - main page container
        'ytd-browse[page-subtype="channels"]',
        'ytd-two-column-browse-results-renderer'
      ];
      
      for (const selector of fallbackSelectors) {
        targetContainer = document.querySelector(selector);
        if (targetContainer) {
          console.log('[EnshitRadar] 📍 Found fallback container:', selector);
          
          // For the main containers, try to find any header element and insert before it
          const headerInContainer = targetContainer.querySelector('#header, #channel-header-container, .ytd-c4-tabbed-header-renderer, ytd-page-header-renderer');
          if (headerInContainer) {
            targetContainer.insertBefore(this.element, headerInContainer);
            console.log('[EnshitRadar] 📍 Inserted before header in container');
          } else {
            // Insert at the beginning of the container
            if (targetContainer.firstChild) {
              targetContainer.insertBefore(this.element, targetContainer.firstChild);
            } else {
              targetContainer.appendChild(this.element);
            }
          }
          
          this.setChannelPageStyles();
          return true;
        }
      }
    } else if (pageType === 'video') {
      // Insert before video title/info
      const selectors = [
        '#above-the-fold',
        '.ytd-video-primary-info-renderer',
        '#primary-inner',
        '.ytd-watch-flexy[role="main"]',
        '#primary',
        '#columns'
      ];
      
      for (const selector of selectors) {
        targetContainer = document.querySelector(selector);
        if (targetContainer) {
          console.log('[EnshitRadar] 📍 Found video container:', selector);
          break;
        }
      }
    }

    if (targetContainer) {
      // Insert banner as first child or after header
      if (targetContainer.firstChild) {
        targetContainer.insertBefore(this.element, targetContainer.firstChild);
      } else {
        targetContainer.appendChild(this.element);
      }
      
      return true;
    }

    return false;
  }

  /**
   * Adjust banner width on channel pages to be properly sized and centered
   */
  private setChannelPageStyles(): void {
    if (!this.element) return;
    
    // Make the banner appropriately sized and centered
    Object.assign(this.element.style, {
      width: '80%',
      maxWidth: '1200px',
      marginLeft: 'auto',
      marginRight: 'auto',
      marginTop: '16px',
      boxSizing: 'border-box',
      top: '-100%',
    });
  }
}