// Options page script for the Chrome extension
import { MessageType } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { channelDatabase } from '@/utils/channelDatabase';
import { browser } from '@/utils/browser';

console.log('⚙️ Options page loaded');

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  await initializeOptions();
});

async function initializeOptions() {
  try {
    // Get store instance
    const settingsStore = useSettingsStore.getState();
    
    // Load settings
    await settingsStore.loadSettings();
    
    // Set up UI
    updateUI();
    setupEventListeners();
    
    console.log('Options page initialized');
  } catch (error) {
    console.error('Failed to initialize options page:', error);
    showMessage('Failed to load settings', 'error');
  }
}

function updateUI() {
  const currentSettings = useSettingsStore.getState().settings;
  const loading = useSettingsStore.getState().isLoading;
  
  // Update loading state
  document.body.classList.toggle('loading', loading);
  
  // Update form controls
  const enabledToggle = document.getElementById('enabled-toggle') as HTMLInputElement;
  const enableLargeBannersToggle = document.getElementById('enable-large-banners-toggle') as HTMLInputElement;

  enabledToggle.checked = currentSettings.enabled
  enableLargeBannersToggle.checked = currentSettings.showLargeBanners  
}

function setupEventListeners() {
  // Setting controls
  const enabledToggle = document.getElementById('enabled-toggle') as HTMLInputElement;
  const enableLargeBannersToggle = document.getElementById('enable-large-banners-toggle') as HTMLInputElement;
  // Event listeners
  enabledToggle.addEventListener('change', handleEnabledChanged);
  enableLargeBannersToggle.addEventListener('change', handleLargeBannersChanged)
  // Action buttons
  document.getElementById('export-button')?.addEventListener('click', handleExport);
  document.getElementById('clear-data-button')?.addEventListener('click', handleClearData);
  document.getElementById('cleanup-session-button')?.addEventListener('click', handleCleanupSession);
  
  // Social links
  document.getElementById('discord-link')?.addEventListener('click', handleDiscordClick);
  document.getElementById('youtube-link')?.addEventListener('click', handleYouTubeClick);
  document.getElementById('github-link')?.addEventListener('click', handleGitHubClick);
  
  // Subscribe to store changes
  useSettingsStore.subscribe(updateUI);
}

function handleEnabledChanged(event: Event) {
  handleToggleChange(event, "enabled")
}

function handleLargeBannersChanged(event: Event) {
  handleToggleChange(event, "showLargeBanners")
}

async function handleToggleChange(event: Event, settingName: string) {
  const checkbox = event.target as HTMLInputElement;
  try {
    const settingsStore = useSettingsStore.getState()
    let settings = settingsStore.settings
    
    settings[settingName] = checkbox.checked
    
    await settingsStore.updateSettings(settings);
    showMessage('Settings saved successfully', 'success');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showMessage('Failed to save settings', 'error');
    // Revert checkbox state
    checkbox.checked = !checkbox.checked;
  }
}



function showMessage(message: string, type: 'success' | 'error') {
  const statusMessage = document.getElementById('status-message') as HTMLElement;
  statusMessage.textContent = message;
  statusMessage.className = `status-message status-${type}`;
  statusMessage.style.display = 'block';
  
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 3000);
}

async function handleExport() {
  try {
    const settings = useSettingsStore.getState().settings;
    
    const exportData = {
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `enshit-radar-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showMessage('Settings exported successfully', 'success');
  } catch (error) {
    console.error('Failed to export settings:', error);
    showMessage('Failed to export settings', 'error');
  }
}

async function handleClearData() {
  if (confirm('Are you sure you want to clear all extension data? This will reset everything to defaults and cannot be undone.')) {
    try {
      await browser.storage.sync.clear();
      await browser.storage.local.clear();
      await useSettingsStore.getState().resetSettings();
      updateUI();
      showMessage('All data cleared successfully', 'success');
    } catch (error) {
      console.error('Failed to clear data:', error);
      showMessage('Failed to clear data', 'error');
    }
  }
}

async function handleCleanupSession() {
  try {
    // Send cleanup message to all active tabs
    const tabs = await browser.tabs.query({});
    let cleanedTabs = 0;
    
    const cleanupPromises = tabs.map(async (tab) => {
      if (tab.id) {
        try {
          await browser.tabs.sendMessage(tab.id, {
            type: MessageType.CLEANUP_SESSION_DATA,
            payload: { reason: 'manual_cleanup' }
          });
          cleanedTabs++;
        } catch (error) {
          // Tab might not have content script loaded - this is fine
          console.debug('Could not send cleanup message to tab:', tab.id);
        }
      }
    });
    
    await Promise.allSettled(cleanupPromises);
    
    showMessage(`Session data cleaned on ${cleanedTabs} tabs`, 'success');
  } catch (error) {
    console.error('Failed to cleanup session data:', error);
    showMessage('Failed to cleanup session data', 'error');
  }
}

function handleDiscordClick(event: Event) {
  event.preventDefault();
  browser.tabs.create({ url: 'https://discord.gg/brCNpJcx' });
}

function handleYouTubeClick(event: Event) {
  event.preventDefault();
  browser.tabs.create({ url: 'https://www.youtube.com/@justmadlime' });
}

function handleGitHubClick(event: Event) {
  event.preventDefault();
  browser.tabs.create({ url: 'https://github.com/justmadlime/EnshitRadar' });
} 