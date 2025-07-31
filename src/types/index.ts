// Common types for the Chrome extension

export interface ExtensionMessage {
  type: string;
  payload?: any;
}

export interface ExtensionSettings {
  enabled: boolean;
  showLargeBanners: boolean;
}

export interface TabInfo {
  id: number;
  url: string;
  title: string;
  active: boolean;
}

export interface StorageData {
  settings: ExtensionSettings;
  lastUpdated: number;
}

// Message types for communication between scripts
export enum MessageType {
  GET_TAB_INFO = 'GET_TAB_INFO',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  CONTENT_LOADED = 'CONTENT_LOADED',
  TOGGLE_FEATURE = 'TOGGLE_FEATURE',
  CHECK_CHANNEL = 'CHECK_CHANNEL',
  UPDATE_CHANNEL_DATA = 'UPDATE_CHANNEL_DATA',
  CLEANUP_SESSION_DATA = 'CLEANUP_SESSION_DATA'
}

export interface MessagePayload {
  [MessageType.GET_TAB_INFO]: { tabId: number };
  [MessageType.UPDATE_SETTINGS]: ExtensionSettings;
  [MessageType.CONTENT_LOADED]: { url: string };
  [MessageType.TOGGLE_FEATURE]: { enabled: boolean };
  [MessageType.CHECK_CHANNEL]: { channelId: string; channelName: string };
  [MessageType.UPDATE_CHANNEL_DATA]: { forceUpdate?: boolean };
  [MessageType.CLEANUP_SESSION_DATA]: { reason?: string };
}

// YouTube Channel Rating System
export type ShittificationLevel = 'low' | 'middle' | 'high' | 'confirmed';

export interface ChannelRating {
  channelId: string;
  channelName: string;
  level: ShittificationLevel;
  description?: string; // Custom description override
  dateAdded: string;
  source?: string; // Where this information came from
}

export interface ChannelDatabase {
  channels: ChannelRating[];
  defaultDescriptions: Record<ShittificationLevel, string>;
  lastUpdated: string;
  version: string;
}

export interface WarningDisplayConfig {
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon: string;
  title: string;
  description: string;
}

// YouTube page detection
export interface YouTubePageInfo {
  pageType: 'channel' | 'video' | 'other';
  channelId?: string;
  channelName?: string;
  videoId?: string;
  channelUrl?: string;
} 