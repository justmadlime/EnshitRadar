import { ChannelDatabase, ChannelRating, ShittificationLevel, WarningDisplayConfig } from '@/types';
import channelData from '@/data/channels.json';

/**
 * Channel database service for managing and checking YouTube channel ratings
 */
export class ChannelDatabaseService {
  private database: ChannelDatabase;
  private channelMap: Map<string, ChannelRating>;

  constructor() {
    this.database = channelData as ChannelDatabase;
    this.channelMap = new Map();
    this.buildMaps();
  }

  /**
   * Build lookup maps for efficient searching
   */
  private buildMaps(): void {
    this.channelMap.clear();

    for (const channel of this.database.channels) {
      // Map by channel ID only
      if (channel.channelId) {
        this.channelMap.set(channel.channelId.toLowerCase(), channel);
      }
    }
  }



  /**
   * Check if a channel is in the database
   */
  public checkChannel(channelId?: string, channelName?: string): ChannelRating | null {
    console.log('[EnshitRadar] 🔎 Database lookup - ID:', channelId, 'Name:', channelName);
    
    // First try to match by channel ID (most reliable)
    if (channelId) {
      const channelByUid = this.channelMap.get(channelId.toLowerCase());
      if (channelByUid) {
        console.log('[EnshitRadar] ✅ Found by ID:', channelByUid);
        return channelByUid;
      }
    }

    // If no channel ID, use direct name comparison
    if (channelName) {
      console.log('[EnshitRadar] 🔤 Searching by exact name:', channelName);
      
      // Direct name comparison - no normalization
      for (const channel of this.database.channels) {
        if (channel.channelName === channelName) {
          console.log('[EnshitRadar] ✅ Found by exact name match:', channel);
          return channel;
        }
      }
      
      console.log('[EnshitRadar] ❌ No exact name match found. Available names:', this.database.channels.map(c => c.channelName));
    }

    return null;
  }



  /**
   * Get warning configuration for a shittification level
   */
  public getWarningConfig(rating: ChannelRating): WarningDisplayConfig {
    const configs: Record<ShittificationLevel, Omit<WarningDisplayConfig, 'description'>> = {
      low: {
        color: '#2d5a0d',
        backgroundColor: '#f6ffed',
        borderColor: '#b7eb8f',
        icon: '⚠️',
        title: 'Caution Advisory'
      },
      middle: {
        color: '#d48806',
        backgroundColor: '#fffbe6',
        borderColor: '#ffe58f',
        icon: '⚠️',
        title: 'Quality Warning'
      },
      high: {
        color: '#d4380d',
        backgroundColor: '#fff2e8',
        borderColor: '#ffbb96',
        icon: '🚨',
        title: 'Channel Alert'
      },
      confirmed: {
        color: '#ffffff',
        backgroundColor: '#ff4d4f',
        borderColor: '#ff7875',
        icon: '🛑',
        title: 'CONFIRMED COMPROMISE'
      }
    };

    const baseConfig = configs[rating.level];
    const description = rating.description || this.database.defaultDescriptions[rating.level];

    return {
      ...baseConfig,
      description
    };
  }

  /**
   * Get all channels for a specific level
   */
  public getChannelsByLevel(level: ShittificationLevel): ChannelRating[] {
    return this.database.channels.filter(channel => channel.level === level);
  }

  /**
   * Get total number of channels in database
   */
  public getTotalChannels(): number {
    return this.database.channels.length;
  }

  /**
   * Get database statistics
   */
  public getStatistics(): Record<ShittificationLevel, number> {
    const stats: Record<ShittificationLevel, number> = {
      low: 0,
      middle: 0,
      high: 0,
      confirmed: 0
    };

    for (const channel of this.database.channels) {
      stats[channel.level]++;
    }

    return stats;
  }

  /**
   * Get database version and last updated info
   */
  public getDatabaseInfo(): { version: string; lastUpdated: string; totalChannels: number } {
    return {
      version: this.database.version,
      lastUpdated: this.database.lastUpdated,
      totalChannels: this.database.channels.length
    };
  }

  /**
   * Export current database (for backup/sharing)
   */
  public exportDatabase(): ChannelDatabase {
    return JSON.parse(JSON.stringify(this.database));
  }
}

// Create singleton instance
export const channelDatabase = new ChannelDatabaseService(); 