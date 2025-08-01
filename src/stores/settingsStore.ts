import { create } from 'zustand';
import { ExtensionSettings } from '@/types';
import { browser } from '@/utils/browser';

interface SettingsStore {
  settings: ExtensionSettings;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<ExtensionSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const defaultSettings: ExtensionSettings = {
  enabled: true,
  showLargeBanners: true
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,

  loadSettings: async () => {
    try {
      set({ isLoading: true });
      const result = await browser.storage.sync.get(['settings']);
      const settings = (result.settings as ExtensionSettings) || defaultSettings;
      set({ settings, isLoading: false });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ settings: defaultSettings, isLoading: false });
    }
  },

  updateSettings: async (newSettings: Partial<ExtensionSettings>) => {
    const { settings } = get();
    const updatedSettings = { ...settings, ...newSettings };
    
    try {
      await browser.storage.sync.set({ settings: updatedSettings });
      set({ settings: updatedSettings });
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  },

  resetSettings: async () => {
    try {
      await browser.storage.sync.set({ settings: defaultSettings });
      set({ settings: defaultSettings });
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }
})); 