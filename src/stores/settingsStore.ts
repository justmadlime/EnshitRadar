import { create } from 'zustand';
import { ExtensionSettings } from '@/types';

interface SettingsStore {
  settings: ExtensionSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<ExtensionSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
  resetSettings: () => Promise<void>;
}

const defaultSettings: ExtensionSettings = {
  enabled: true,
  showLargeBanners: true,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  loading: false,

  updateSettings: async (newSettings: Partial<ExtensionSettings>) => {
    const currentSettings = get().settings;
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    try {
      await chrome.storage.sync.set({ settings: updatedSettings });
      set({ settings: updatedSettings });
    } catch (error) {
      console.error('[EnshitRadar] Failed to update settings:', error);
    }
  },

  loadSettings: async () => {
    set({ loading: true });
    try {
      const result = await chrome.storage.sync.get(['settings']);
      const settings = result.settings || defaultSettings;
      set({ settings, loading: false });
    } catch (error) {
      console.error('[EnshitRadar] Failed to load settings:', error);
      set({ settings: defaultSettings, loading: false });
    }
  },

  resetSettings: async () => {
    try {
      await chrome.storage.sync.set({ settings: defaultSettings });
      set({ settings: defaultSettings });
    } catch (error) {
      console.error('[EnshitRadar] Failed to reset settings:', error);
    }
  }
})); 