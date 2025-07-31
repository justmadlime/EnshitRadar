import { WarningDisplayConfig, ChannelRating } from '@/types';

/**
 * Create and manage warning banners for YouTube pages
 */
export class WarningTag {
  private element: HTMLElement | null = null;
  private containerId = 'enshit-radar-warning';

  /**
   * Create warning tag HTML
   */
  public create(config: WarningDisplayConfig, channelRating: ChannelRating): HTMLElement {
    const tag = document.createElement('div');
    tag.id = this.containerId;
    tag.className = 'enshit-radar-warning';
    tag.setAttribute('data-enshit-radar-warning', 'true');
    tag.setAttribute('data-channel-id', channelRating.channelId || '');
    tag.setAttribute('data-level', channelRating.level);
    
    tag.innerHTML = `
      <div 
        class="enshit-radar-warning-tag" 
        style="color: ${config.color}; border-color: ${config.borderColor}; background-color: ${config.backgroundColor};"
        title="Click to learn more"
      >
        <h3>${config.icon} ${config.title}</h3>
      </div>
    `;

    tag.addEventListener('click', () => {
      this.handleLearnMore(channelRating)
    })


    this.element = tag;
    return tag;
  }

  /**
   * Create a slightly modified warning tag with only the icon for smaller locations
   * @param config 
   * @param channelRating 
   * @returns 
   */
  public createShort(config: WarningDisplayConfig, channelRating: ChannelRating): HTMLElement {
    const tag = document.createElement('div');
    tag.id = this.containerId;
    tag.className = 'enshit-radar-warning';
    tag.setAttribute('data-enshit-radar-warning', 'true');
    tag.setAttribute('data-channel-id', channelRating.channelId || '');
    tag.setAttribute('data-level', channelRating.level);
    
    tag.innerHTML = `
      <div 
        class="enshit-radar-warning-tag" 
        style="color: ${config.color}; border-color: ${config.borderColor}; background-color: ${config.backgroundColor}; padding: 4px; margin-left: 5px"
        title="Click to learn more"
      >
        <h3>${config.icon}</h3>
      </div>
    `;

    tag.addEventListener('click', () => {
      this.handleLearnMore(channelRating)
    })


    this.element = tag;
    return tag;
  }

  public insertInto(parent: HTMLElement) {
    parent.appendChild(this.element)
  }

  public remove(): void {
    if (this.element) {
      this.element.remove()
      this.element = null
    }
  }
  

  /**
   * Handle learn more action
   */
  private handleLearnMore(channelRating: ChannelRating): void {
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

}
